#!/usr/bin/env pwsh
# OpenCode MCP Autoconnect - Uninstaller

$ErrorActionPreference = "Stop"

Write-Host "=== OpenCode MCP Autoconnect Uninstaller ===" -ForegroundColor Cyan

# Determine config directory
$ConfigDir = if ($env:XDG_CONFIG_HOME) { 
    Join-Path $env:XDG_CONFIG_HOME "opencode" 
} else { 
    Join-Path $env:USERPROFILE ".config\opencode" 
}

$PluginPath = Join-Path $ConfigDir "plugins\mcp-autoconnect.ts"
$LogPath = Join-Path $env:TEMP "opencode\mcp-autoconnect.log"

Write-Host "[*] Looking for plugin at: $PluginPath" -ForegroundColor Yellow

if (Test-Path $PluginPath) {
    Remove-Item -Path $PluginPath -Force
    Write-Host "[+] Successfully removed plugin: $PluginPath" -ForegroundColor Green
} else {
    Write-Host "[!] Plugin not found at expected location." -ForegroundColor Yellow
}

Write-Host "[*] Looking for log file at: $LogPath" -ForegroundColor Yellow
if (Test-Path $LogPath) {
    Remove-Item -Path $LogPath -Force
    Write-Host "[+] Successfully removed log file: $LogPath" -ForegroundColor Green
} else {
    Write-Host "[!] Log file not found, skipping." -ForegroundColor Yellow
}

Write-Host "[SUCCESS] Uninstallation complete. Please restart OpenCode." -ForegroundColor Cyan
