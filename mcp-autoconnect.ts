import { spawn } from "node:child_process";
import { appendFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

/**
 * OpenCode plugin: auto-reconnect MCP servers that fail or timeout at startup/runtime.
 *
 * Optimizations implemented:
 * 1. Non-blocking parallel reconnection for multiple failed servers (using Promise.all).
 * 2. Expanded status detection to catch "failed", "error", "stopped", or unresponsive states.
 * 3. Automatic garbage collection of the `attempts` Map for servers that no longer exist or have recovered successfully.
 * 4. Safer logging and fallback diagnostics.
 *
 * Install: copy this file to ~/.config/opencode/plugins/mcp-autoconnect.ts
 * (global) or .opencode/plugins/mcp-autoconnect.ts (project).
 * Log: <os temp>/opencode/mcp-autoconnect.log
 */
const LOG_DIR = join(tmpdir(), "opencode");
const LOG = join(LOG_DIR, "mcp-autoconnect.log");

function log(message: string) {
  try {
    mkdirSync(LOG_DIR, { recursive: true });
    appendFileSync(LOG, `${new Date().toISOString()} ${message}\n`);
  } catch (err) {
    console.warn(`[mcp-autoconnect] Failed to write log: ${String(err)}`);
  }
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
      windowsHide: true,
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
        const servers = result?.data ?? [];

        // Track currently active server names for cleanup
        const activeNames = new Set<string>();

        const problematic = servers.filter((server: any) => {
          const name = String(server?.name ?? "");
          if (name) activeNames.add(name);

          const statusVal = String(server?.status?.status ?? "").toLowerCase();
          // Catch "failed", "error", "stopped", or empty/disconnected states
          return (
            statusVal === "failed" ||
            statusVal === "error" ||
            statusVal === "stopped" ||
            !statusVal ||
            statusVal === "disconnected"
          );
        });

        // Garbage collect attempts Map for servers no longer present or successfully recovered
        for (const [name] of attempts) {
          if (!activeNames.has(name)) {
            attempts.delete(name);
          }
        }

        // Process problematic servers in parallel without sequential blocking delays
        await Promise.all(
          problematic.map(async (server: any) => {
            const name = String(server.name);
            if (!name) return;

            const now = Date.now();
            const state = attempts.get(name);
            const count = state && now - state.last < COOLDOWN_MS ? state.count : 0;

            if (count >= MAX_ATTEMPTS_BEFORE_COOLDOWN) return;

            attempts.set(name, { count: count + 1, last: now });
            const delay = BACKOFF_MS[Math.min(count, BACKOFF_MS.length - 1)];

            log(`detected unhealthy: ${name} (status: ${server?.status?.status ?? "unknown"}, attempt ${count + 1}/${MAX_ATTEMPTS_BEFORE_COOLDOWN}), waiting ${delay}ms`);
            
            await new Promise((resolve) => setTimeout(resolve, delay));
            
            const ok = await reconnect(name, directory);
            if (ok) {
              log(`reconnect succeeded: ${name}`);
              attempts.delete(name);
            } else {
              log(`reconnect failed: ${name}`);
            }
          })
        );
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
