#!/usr/bin/env pwsh
# OpenCode MCP Autoconnect - One-Click Installer (Plug & Play)

$ErrorActionPreference = "Stop"

Write-Host "=== OpenCode MCP Autoconnect Installer ===" -ForegroundColor Cyan

# Determine config directory
$ConfigDir = if ($env:XDG_CONFIG_HOME) { 
    Join-Path $env:XDG_CONFIG_HOME "opencode" 
} else { 
    Join-Path $env:USERPROFILE ".config\opencode" 
}

$PluginsDir = Join-Path $ConfigDir "plugins"

Write-Host "[*] Target plugin directory: $PluginsDir" -ForegroundColor Yellow

# Create plugins directory if not exists
if (!(Test-Path $PluginsDir)) {
    New-Item -ItemType Directory -Force -Path $PluginsDir | Out-Null
    Write-Host "[+] Created plugins directory." -ForegroundColor Green
}

# Download or copy mcp-autoconnect.ts
$TargetFile = Join-Path $PluginsDir "mcp-autoconnect.ts"
$SourceUrl = "https://raw.githubusercontent.com/arv-fazriansyah/opencode-mcp-autoconnect/main/mcp-autoconnect.ts"

Write-Host "[*] Downloading mcp-autoconnect.ts..." -ForegroundColor Yellow
try {
    Invoke-WebRequest -Uri $SourceUrl -OutFile $TargetFile
    Write-Host "[SUCCESS] Plugin installed successfully to: $TargetFile" -ForegroundColor Green
    Write-Host "[READY] OpenCode will now auto-reconnect failed MCP servers. Plug & Play!" -ForegroundColor Cyan
} catch {
    Write-Host "[ERROR] Failed to download plugin: $_" -ForegroundColor Red
    exit 1
}
