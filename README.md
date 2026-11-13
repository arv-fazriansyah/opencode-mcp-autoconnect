# OpenCode MCP Autoconnect

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![OpenCode Plugin](https://img.shields.io/badge/OpenCode-Plugin-orange.svg)](https://github.com/anomalyco/opencode)

A lightweight OpenCode plugin designed to **automatically detect and reconnect failed MCP (Model Context Protocol) servers** at startup or during runtime.

---

## The Problem

When an OpenCode location boots up, it initializes all enabled MCP servers simultaneously. Local stdio servers—such as `npx`/`uv` cold starts or heavy servers like `rclone-mcp` with strict internal initialization limits—frequently exceed OpenCode's startup timeout window. Consequently, these servers remain stuck in a permanently `failed` state ([anomalyco/opencode#63512](https://github.com/anomalyco/opencode/issues/63512), [#53226](https://github.com/anomalyco/opencode/issues/53226)).

## The Solution

`mcp-autoconnect` continuously monitors your MCP server health in the background. If a server goes down or fails to connect during startup:
1. **Intelligent Polling**: Periodically inspects server status via `ctx.mcp.list()`.
2. **Exponential Backoff**: Gradually retries failed connections using a safe backoff schedule (from 15s up to 8 minutes) to prevent system resource saturation.
3. **Automatic Reconnection**: Triggers the experimental connect endpoint via OpenCode API (`/api/experimental/mcp/:server/connect`).
4. **Cross-Platform Logging**: Gracefully records lifecycle events and connection attempts inside the OS temporary directory (`<os temp>/opencode/mcp-autoconnect.log`).

---

## 🚀 Quick Install (Plug & Play)

No manual copying required! Choose your platform below to install instantly:

### PowerShell (Windows)
Run this command in PowerShell:
```powershell
iex (iwr -useb https://raw.githubusercontent.com/arv-fazriansyah/opencode-mcp-autoconnect/main/install.ps1).Content
```

### Bash (Linux / macOS)
Run this command in your terminal:
```bash
curl -fsSL https://raw.githubusercontent.com/arv-fazriansyah/opencode-mcp-autoconnect/main/install.sh | bash
```

---

## Configuration & Backoff Strategy

| Parameter | Default Value | Description |
| :--- | :--- | :--- |
| **Check Interval (`TICK_MS`)** | `30,000ms` (30s) | Frequency of MCP status polling. |
| **Initial Delay** | `15,000ms` (15s) | Grace period after boot before the first check. |
| **Max Attempts** | `6` attempts | Maximum reconnect retries before entering temporary cooldown. |
| **Cooldown Period** | `10 minutes` | Time to wait before resetting retry counters for persistent failures. |
| **Backoff Schedule** | `15s`, `30s`, `1m`, `2m`, `4m`, `8m` | Incremental delay between reconnection attempts. |

---

## Log Output

All operations and diagnostics are logged safely across platforms (Windows, macOS, Linux) at:
* **Linux/macOS:** `/tmp/opencode/mcp-autoconnect.log`
* **Windows:** `%TEMP%\\opencode\\mcp-autoconnect.log`

---

## License

This project is licensed under the [MIT License](LICENSE).
