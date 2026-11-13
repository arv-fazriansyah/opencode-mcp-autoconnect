import { spawn } from "node:child_process";
import { appendFileSync } from "node:fs";

/**
 * OpenCode plugin: auto-reconnect MCP servers that fail at startup.
 *
 * Why: when a Location boots, OpenCode starts every enabled MCP server at once.
 * Local stdio servers (npx/uv cold starts, or rclone-mcp with its 15s internal
 * limit) can run past the startup timeout and stay "failed" forever (see
 * anomalyco/opencode#63512, #53226). This plugin polls the MCP status and
 * retries failed servers through the experimental connect endpoint.
 *
 * Install: copy this file to ~/.config/opencode/plugins/mcp-autoconnect.ts
 * (global) or .opencode/plugins/mcp-autoconnect.ts (project). It is discovered
 * automatically; no config change required.
 *
 * Log: <os temp>/opencode/mcp-autoconnect.log
 */
const LOG = "C:/Users/Fazriansyah/AppData/Local/Temp/opencode/mcp-autoconnect.log";
function log(message: string) {
  try {
    appendFileSync(LOG, `${new Date().toISOString()} ${message}\n`);
  } catch {}
}

const MAX_ATTEMPTS_BEFORE_COOLDOWN = 6;
const COOLDOWN_MS = 10 * 60 * 1000;
const BACKOFF_MS = [15000, 30000, 60000, 120000, 240000, 480000];
const TICK_MS = 30000;

function reconnect(server: string, directory: string): Promise<boolean> {
  return new Promise((resolve) => {
    const url = `/api/experimental/mcp/${encodeURIComponent(server)}/connect?location[directory]=${directory}`;
    const child = spawn("opencode", ["api", "post", url], {
      shell: true,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let out = "";
    child.stdout.on("data", (data) => (out += data.toString()));
    child.stderr.on("data", (data) => (out += data.toString()));
    child.on("error", (error) => {
      log(`reconnect ${server}: spawn error ${error.message}`);
      resolve(false);
    });
    child.on("close", (code) => {
      const ok = code === 0;
      log(`reconnect ${server}: code=${code} out=${out.trim().slice(0, 200)}`);
      resolve(ok);
    });
  });
}

export default {
  id: "mcp-autoconnect",
  setup(ctx: any) {
    const directory = String(ctx.location?.directory ?? "").replace(/\\/g, "/");
    const attempts = new Map<string, { count: number; last: number }>();
    let running = false;

    const tick = async () => {
      if (running) return;
      running = true;
      try {
        const result = await ctx.mcp.list();
        const failed = (result?.data ?? []).filter(
          (server: any) => server?.status?.status === "failed",
        );
        for (const server of failed) {
          const name = String(server.name);
          const now = Date.now();
          const state = attempts.get(name);
          const count = state && now - state.last < COOLDOWN_MS ? state.count : 0;
          if (count >= MAX_ATTEMPTS_BEFORE_COOLDOWN) continue;
          attempts.set(name, { count: count + 1, last: now });
          const delay = BACKOFF_MS[Math.min(count, BACKOFF_MS.length - 1)];
          log(`detected failed: ${name} (attempt ${count + 1}/${MAX_ATTEMPTS_BEFORE_COOLDOWN}), waiting ${delay}ms`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          const ok = await reconnect(name, directory);
          if (ok) {
            log(`reconnect succeeded: ${name}`);
            attempts.delete(name);
          } else {
            log(`reconnect failed: ${name}`);
          }
        }
      } catch (error) {
        log(`tick error ${String(error)}`);
      } finally {
        running = false;
      }
    };

    log(`started for ${directory}`);
    const timer = setInterval(() => {
      void tick();
    }, TICK_MS);
    const initial = setTimeout(() => {
      void tick();
    }, 15000);
    return () => {
      clearInterval(timer);
      clearTimeout(initial);
    };
  },
};
