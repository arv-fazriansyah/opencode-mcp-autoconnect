# opencode-mcp-autoconnect

An OpenCode plugin that **auto-reconnects MCP servers that fail at startup**.

## Why

When a Location boots, OpenCode starts every enabled MCP server at once. Local
stdio servers (npx/uv cold starts, or `rclone-mcp` with its 15 s internal
limit) can run past the startup timeout and stay `failed` forever. See
[anomalyco/opencode#63512](https://github.com/anomalyco/opencode/issues/63512)
and [#53226](https://github.com/anomalyco/opencode/issues/53226).

OpenCode currently has no built-in retry for this case (only remote transport
drops are reconnected). This plugin fills the gap.

## Install

Copy the single file into the OpenCode plugins directory:

```sh
# global (all projects)
cp mcp-autoconnect.ts ~/.config/opencode/plugins/mcp-autoconnect.ts

# or per-project
cp mcp-autoconnect.ts .opencode/plugins/mcp-autoconnect.ts
```

OpenCode discovers `.ts` files in `~/.config/opencode/plugins/` and
`.opencode/plugins/` automatically — no config change needed. Reload happens
automatically; or force it with `touch` on the file / `opencode service restart`.

## How it works

- Every 30 s (first check 15 s after load), reads `ctx.mcp.list()`.
- For each server with status `failed`, waits with backoff
  (15s → 30s → 60s → 120s → 240s → 480s) then calls
  `POST /api/experimental/mcp/{server}/connect` via the `opencode api` CLI,
  which reuses OpenCode's own service discovery and auth.
- Up to 6 attempts per server, then a 10-minute cooldown before retrying
  again. A successful reconnect resets the counter.
- Logs to `<os temp>/opencode/mcp-autoconnect.log`.

## Limitations

- Uses the **experimental** connect endpoint; if a future OpenCode version
  changes it, the plugin will log failures (check the log).
- Cannot distinguish "permanently misconfigured" from "slow to start": both
  get retried up to 6 times.
- Only retries servers that report status `failed`; servers that silently drop
  later (still marked `connected`) are not covered (see #29190).

## License

MIT
```

Also maybe a small install script. Keep it minimal.

Let me write README.<|end|><|start|>starter to=write<|channel|>analysis <|constrain|>xml<|message|><rfl:parameter name="content">
# opencode-mcp-autoconnect

An OpenCode plugin that **auto-reconnects MCP servers that fail at startup**.

## Why

When a Location boots, OpenCode starts every enabled MCP server at once. Local
stdio servers (npx/uv cold starts, or `rclone-mcp` with its 15 s internal
limit) can run past the startup timeout and stay `failed` forever. See
[anomalyco/opencode#63512](https://github.com/anomalyco/opencode/issues/63512)
and [#53226](https://github.com/anomalyco/opencode/issues/53226).

OpenCode currently has no built-in retry for this case (only remote transport
drops are reconnected). This plugin fills the gap.

## Install

Copy the single file into the OpenCode plugins directory:

```sh
# global (all projects)
cp mcp-autoconnect.ts ~/.config/opencode/plugins/mcp-autoconnect.ts

# or per-project
cp mcp-autoconnect.ts .opencode/plugins/mcp-autoconnect.ts
```

OpenCode discovers `.ts` files in `~/.config/opencode/plugins/` and
`.opencode/plugins/` automatically — no config change needed. Reload happens
automatically; or force it with `touch` on the file / `opencode service restart`.

## How it works

- Every 30 s (first check 15 s after load), reads `ctx.mcp.list()`.
- For each server with status `failed`, waits with backoff
  (15s → 30s → 60s → 120s → 240s → 480s) then calls
  `POST /api/experimental/mcp/{server}/connect` via the `opencode api` CLI,
  which reuses OpenCode's own service discovery and auth.
- Up to 6 attempts per server, then a 10-minute cooldown before retrying
  again. A successful reconnect resets the counter.
- Logs to `<os temp>/opencode/mcp-autoconnect.log`.

## Limitations

- Uses the **experimental** connect endpoint; if a future OpenCode version
  changes it, the plugin will log failures (check the log).
- Cannot distinguish "permanently misconfigured" from "slow to start": both
  get retried up to 6 times.
- Only retries servers that report status `failed`; servers that silently drop
  later (still marked `connected`) are not covered (see #29190).

## License

MIT
