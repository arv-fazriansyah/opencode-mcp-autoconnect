#!/usr/bin/env bash
# OpenCode MCP Autoconnect - One-Click Installer (Plug & Play)

set -e

echo "=== OpenCode MCP Autoconnect Installer ==="

# Determine config directory
CONFIG_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/opencode"
PLUGINS_DIR="$CONFIG_DIR/plugins"

echo "[*] Target plugin directory: $PLUGINS_DIR"

# Create plugins directory if not exists
mkdir -p "$PLUGINS_DIR"

# Download mcp-autoconnect.ts
TARGET_FILE="$PLUGINS_DIR/mcp-autoconnect.ts"
SOURCE_URL="https://raw.githubusercontent.com/arv-fazriansyah/opencode-mcp-autoconnect/main/mcp-autoconnect.ts"

echo "[*] Downloading mcp-autoconnect.ts..."
if command -v curl >/dev/null 2>&1; then
    curl -fsSL "$SOURCE_URL" -o "$TARGET_FILE"
elif command -v wget >/dev/null 2>&1; then
    wget -qO "$TARGET_FILE" "$SOURCE_URL"
else
    echo "[ERROR] Neither curl nor wget is available." >&2
    exit 1
fi

echo "[SUCCESS] Plugin installed successfully to: $TARGET_FILE"
echo "[READY] OpenCode will now auto-reconnect failed MCP servers. Plug & Play!"
