# Image Class Selector - Windows Builder (PowerShell)
# This script builds the Windows distributable for Image Class Selector

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Image Class Selector - Windows Builder" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Function to check if a command exists
function Test-Command($cmdname) {
    return [bool](Get-Command -Name $cmdname -ErrorAction SilentlyContinue)
}

# Check if Node.js is installed
if (-not (Test-Command "node")) {
    Write-Host "ERROR: Node.js is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if Rust is installed
if (-not (Test-Command "rustc")) {
    Write-Host "ERROR: Rust is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Rust from https://rustup.rs/" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "Checking dependencies..." -ForegroundColor Green
Write-Host ""

# Install npm dependencies if node_modules doesn't exist
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing npm dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Failed to install npm dependencies" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
}

# Add Windows target for Rust
Write-Host "Adding Windows target for Rust..." -ForegroundColor Yellow
rustup target add x86_64-pc-windows-msvc
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to add Windows target" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if Windows SDK is available
Write-Host "Checking Windows SDK..." -ForegroundColor Yellow
if (-not (Test-Command "cl")) {
    Write-Host "WARNING: Windows SDK (cl.exe) not found in PATH" -ForegroundColor Yellow
    Write-Host "You may need to install Visual Studio Build Tools or Visual Studio" -ForegroundColor Yellow
    Write-Host "with C++ development tools." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Attempting to build anyway..." -ForegroundColor Yellow
    Write-Host ""
}

# Create distributables directory structure
if (-not (Test-Path "distributables")) {
    New-Item -ItemType Directory -Name "distributables" | Out-Null
}
if (-not (Test-Path "distributables\windows")) {
    New-Item -ItemType Directory -Path "distributables\windows" | Out-Null
}

Write-Host "Building Windows distributable..." -ForegroundColor Green
Write-Host "This may take several minutes..." -ForegroundColor Yellow
Write-Host ""

# Build the Windows distributable
npm run tauri build -- --target x86_64-pc-windows-msvc
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ERROR: Build failed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Common solutions:" -ForegroundColor Yellow
    Write-Host "1. Install Visual Studio Build Tools with C++ workload" -ForegroundColor White
    Write-Host "2. Install Windows SDK" -ForegroundColor White
    Write-Host "3. Run this script from Visual Studio Developer Command Prompt" -ForegroundColor White
    Write-Host "4. Check that all dependencies are properly installed" -ForegroundColor White
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Build completed successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Copy built files to distributables folder
Write-Host "Copying distributables..." -ForegroundColor Yellow

# Find and copy MSI files
$msiFiles = Get-ChildItem -Path "src-tauri\target\x86_64-pc-windows-msvc\release\bundle" -Recurse -Filter "*.msi"
foreach ($file in $msiFiles) {
    Write-Host "Copying MSI installer: $($file.Name)" -ForegroundColor Green
    Copy-Item $file.FullName "distributables\windows\" -Force
}

# Find and copy EXE files
$exeFiles = Get-ChildItem -Path "src-tauri\target\x86_64-pc-windows-msvc\release\bundle" -Recurse -Filter "*.exe"
foreach ($file in $exeFiles) {
    Write-Host "Copying EXE executable: $($file.Name)" -ForegroundColor Green
    Copy-Item $file.FullName "distributables\windows\" -Force
}

Write-Host ""
Write-Host "Windows distributables are now available in:" -ForegroundColor Green
Write-Host "  distributables\windows\" -ForegroundColor White
Write-Host ""
Write-Host "Files created:" -ForegroundColor Green
Get-ChildItem "distributables\windows\" | ForEach-Object { Write-Host "  $($_.Name)" -ForegroundColor White }

Write-Host ""
Write-Host "Build process completed!" -ForegroundColor Green
Read-Host "Press Enter to exit"
