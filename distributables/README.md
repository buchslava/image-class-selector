# Image Class Selector - Distributables

## macOS Distributable ✅

### Available Files:
- **`Image Class Selector_0.1.0_x64.dmg`** - macOS installer package
- **`Image Class Selector.app`** - Standalone macOS application

### Installation:
1. **DMG Installer**: Double-click the `.dmg` file and drag the app to Applications folder
2. **Standalone App**: Copy the `.app` file to your Applications folder

### Features:
- ✅ Custom rectangular icon (blue + orange rectangles)
- ✅ "Image Class Selector" name in menu bar and dock
- ✅ File menu with Select Folder, Load Classes, and Quit options
- ✅ Keyboard shortcuts (Cmd+O, Cmd+L)
- ✅ Cross-platform compatibility

## Windows Distributable ⚠️

### Status: Not Available
The Windows distributable could not be built on macOS due to missing `llvm-rc` dependency required for Windows resource compilation.

### To Build Windows Version:

#### **Option 1 - Automated Build Scripts (Recommended)**
Use the provided build scripts in the project root:

**Batch Script (Windows Command Prompt):**
```cmd
build-windows.bat
```

**PowerShell Script (Windows PowerShell):**
```powershell
.\build-windows.ps1
```

These scripts will:
- ✅ Check all dependencies (Node.js, Rust, Windows SDK)
- ✅ Install npm dependencies automatically
- ✅ Add Windows Rust target
- ✅ Build the distributable
- ✅ Copy files to `distributables/windows/` folder

#### **Option 2 - Manual Build**
```bash
npm run tauri build -- --target x86_64-pc-windows-msvc
```

#### **Option 3 - Cross-Platform Build (macOS)**
```bash
# Install LLVM with Windows tools
brew install llvm
# Then try building again
npm run tauri build -- --target x86_64-pc-windows-msvc
```

#### **Option 4 - GitHub Actions**
Set up automated Windows builds using GitHub Actions workflow.

### Expected Windows Files:
- `Image Class Selector_0.1.0_x64.msi` - Windows installer
- `Image Class Selector_0.1.0_x64.exe` - Standalone executable

## Technical Details

### Build Configuration:
- **Framework**: Tauri v2
- **Frontend**: React + TypeScript + Vite
- **Backend**: Rust
- **Icons**: Custom rectangular design (PNG + ICO formats)

### Supported Platforms:
- ✅ macOS (Intel x64)
- ⚠️ Windows (requires Windows build environment)
- ✅ Linux (should work with `npm run tauri build`)

## Version Information
- **Version**: 0.1.0
- **App Name**: Image Class Selector
- **Identifier**: com.slava.image-class-selector-v2
