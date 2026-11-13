# OpenCode MCP Autoconnect

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![OpenCode Plugin](https://img.shields.io/badge/OpenCode-Plugin-orange.svg)](https://github.com/anomalyco/opencode)

> **About:** Looking for an **OpenCode plugin** to **auto reconnect MCP** servers and **fix MCP timeout** issues? This tool implements the **Model Context Protocol** to **fix stdio server timeout**, resolve **rclone-mcp** connection errors, and ensure stable **MCP server reconnect** functionality during startup.

A lightweight, production-ready **OpenCode plugin** engineered to **automatically detect and reconnect failed MCP (Model Context Protocol) servers** during startup and active sessions. Say goodbye to permanent startup failures caused by slow `npx`, `uv` cold starts, or strict internal limits.

---

## The Problem

When booting an OpenCode workspace, all enabled Model Context Protocol (MCP) servers initialize concurrently. Local stdio servers—such as `npx`/`uv` cold boots or resource-heavy integrations like `rclone-mcp`—frequently exceed OpenCode's initial startup timeout window. 

As a result, these servers get stuck in a permanently `failed` state ([anomalyco/opencode#63512](https://github.com/anomalyco/opencode/issues/63512), [#53226](https://github.com/anomalyco/opencode/issues/53226)), breaking your workflow unless manually restarted.

## The Solution

`mcp-autoconnect` acts as an intelligent background daemon for your AI coding environment:
1. **Continuous Health Polling**: Periodically inspects MCP server statuses via `ctx.mcp.list()`.
2. **Exponential Backoff Strategy**: Gradually retries dropped or failed connections (15s to 8m) to prevent CPU and network saturation.
3. **Automated Reconnection API**: Triggers the experimental connect endpoint (`/api/experimental/mcp/:server/connect`) seamlessly behind the scenes.
4. **Cross-Platform Diagnostics**: Safely outputs lifecycle logs into the OS temporary directory (`<os temp>/opencode/mcp-autoconnect.log`).

---

## 🚀 Quick Install (Plug & Play)

No manual cloning or copying required. Run the one-click installer for your operating system:

### PowerShell (Windows)
```powershell
iex (iwr -useb https://raw.githubusercontent.com/arv-fazriansyah/opencode-mcp-autoconnect/main/install.ps1).Content
```

### Bash (Linux / macOS)
```bash
curl -fsSL https://raw.githubusercontent.com/arv-fazriansyah/opencode-mcp-autoconnect/main/install.sh | bash
```

---

## Technical Specifications & Backoff Schedule

| Configuration Parameter | Default Value | Description |
| :--- | :--- | :--- |
| **Check Interval (`TICK_MS`)** | `30,000ms` (30s) | Frequency of MCP connection polling. |
| **Initial Delay** | `15,000ms` (15s) | Grace period after boot before the first health check. |
| **Max Attempts** | `6` attempts | Maximum reconnect retries before triggering temporary cooldown. |
| **Cooldown Period** | `10 minutes` | Duration before resetting retry attempts on persistent failures. |
| **Backoff Schedule** | `15s`, `30s`, `1m`, `2m`, `4m`, `8m` | Incremental delay between reconnection attempts. |

---

## Log Output & Debugging

Diagnostic logs can be found cross-platform at:
* **Linux / macOS:** `/tmp/opencode/mcp-autoconnect.log`
* **Windows:** `%TEMP%\\opencode\\mcp-autoconnect.log`

---

## Contributing & Support

Contributions, bug reports, and feature requests are welcome! Feel free to check out the [issues page](https://github.com/arv-fazriansyah/opencode-mcp-autoconnect/issues).

## License

Distributed under the [MIT License](LICENSE).
