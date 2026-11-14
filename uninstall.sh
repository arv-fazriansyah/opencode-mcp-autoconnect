#!/bin/sh
# OpenCode MCP Autoconnect - Uninstaller

echo "=== OpenCode MCP Autoconnect Uninstaller ==="

# Determine config directory
if [ -n "$XDG_CONFIG_HOME" ]; then
    ConfigDir="$XDG_CONFIG_HOME/opencode"
else
    ConfigDir="$HOME/.config/opencode"
fi

PluginPath="$ConfigDir/plugins/mcp-autoconnect.ts"
LogPath="/tmp/opencode/mcp-autoconnect.log"

echo "[*] Looking for plugin at: $PluginPath"

if [ -f "$PluginPath" ]; then
    rm -f "$PluginPath"
    echo "[+] Successfully removed plugin: $PluginPath"
else
    echo "[!] Plugin not found at expected location."
fi

echo "[*] Looking for log file at: $LogPath"
if [ -f "$LogPath" ]; then
    rm -f "$LogPath"
    echo "[+] Successfully removed log file: $LogPath"
else
    echo "[!] Log file not found, skipping."
fi

echo "[SUCCESS] Uninstallation complete. Please restart OpenCode."
