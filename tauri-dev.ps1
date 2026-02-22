# Tauri Development Script
# This script ensures cargo is in PATH before running tauri dev

# Add cargo to PATH if not already present
$cargoPath = "$env:USERPROFILE\.cargo\bin"
if ($env:PATH -notlike "*$cargoPath*") {
    $env:PATH = "$cargoPath;$env:PATH"
    Write-Host "Added cargo to PATH: $cargoPath" -ForegroundColor Green
}

# Verify cargo is available
try {
    $cargoVersion = cargo --version
    Write-Host "Cargo found: $cargoVersion" -ForegroundColor Green
} catch {
    Write-Host "Error: Cargo not found. Please install Rust from https://rustup.rs/" -ForegroundColor Red
    exit 1
}

# Run tauri dev
Write-Host "Starting Tauri development server..." -ForegroundColor Cyan
npx tauri dev
