@echo off
echo ========================================
echo Image Class Selector - Windows Builder
echo ========================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if Rust is installed
rustc --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Rust is not installed or not in PATH
    echo Please install Rust from https://rustup.rs/
    pause
    exit /b 1
)

echo Checking dependencies...
echo.

REM Install npm dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo Installing npm dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install npm dependencies
        pause
        exit /b 1
    )
)

REM Add Windows target for Rust
echo Adding Windows target for Rust...
rustup target add x86_64-pc-windows-msvc
if %errorlevel% neq 0 (
    echo ERROR: Failed to add Windows target
    pause
    exit /b 1
)

REM Check if Windows SDK is available
echo Checking Windows SDK...
where cl >nul 2>&1
if %errorlevel% neq 0 (
    echo WARNING: Windows SDK (cl.exe) not found in PATH
    echo You may need to install Visual Studio Build Tools or Visual Studio
    echo with C++ development tools.
    echo.
    echo Attempting to build anyway...
    echo.
)

REM Create distributables directory structure
if not exist "distributables" mkdir distributables
if not exist "distributables\windows" mkdir distributables\windows

echo Building Windows distributable...
echo This may take several minutes...
echo.

REM Build the Windows distributable
npm run tauri build -- --target x86_64-pc-windows-msvc
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Build failed!
    echo.
    echo Common solutions:
    echo 1. Install Visual Studio Build Tools with C++ workload
    echo 2. Install Windows SDK
    echo 3. Run this script from Visual Studio Developer Command Prompt
    echo 4. Check that all dependencies are properly installed
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo Build completed successfully!
echo ========================================
echo.

REM Copy built files to distributables folder
echo Copying distributables...

REM Find the built files
for /r "src-tauri\target\x86_64-pc-windows-msvc\release\bundle" %%f in (*.msi) do (
    echo Copying MSI installer: %%~nxf
    copy "%%f" "distributables\windows\" >nul
)

for /r "src-tauri\target\x86_64-pc-windows-msvc\release\bundle" %%f in (*.exe) do (
    echo Copying EXE executable: %%~nxf
    copy "%%f" "distributables\windows\" >nul
)

echo.
echo Windows distributables are now available in:
echo   distributables\windows\
echo.
echo Files created:
dir /b "distributables\windows\"

echo.
echo Build process completed!
pause
