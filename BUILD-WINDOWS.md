# Building Image Class Selector for Windows

## Quick Start

### Prerequisites
- **Windows 10/11** (64-bit)
- **Node.js** (v16 or higher) - Download from [nodejs.org](https://nodejs.org/)
- **Rust** - Install from [rustup.rs](https://rustup.rs/)
- **Visual Studio Build Tools** or **Visual Studio** with C++ workload

### Automated Build (Recommended)

1. **Open Command Prompt or PowerShell** in the project directory
2. **Run the build script**:
   ```cmd
   build-windows.bat
   ```
   or
   ```powershell
   .\build-windows.ps1
   ```
3. **Wait for completion** - The script will handle everything automatically
4. **Find your distributables** in `distributables/windows/` folder

### Manual Build

If you prefer to build manually:

```cmd
# Install dependencies
npm install

# Add Windows target
rustup target add x86_64-pc-windows-msvc

# Build
npm run tauri build -- --target x86_64-pc-windows-msvc
```

## Troubleshooting

### "cl.exe not found"
- Install **Visual Studio Build Tools** with C++ workload
- Or install **Visual Studio Community** with C++ development tools
- Run from **Visual Studio Developer Command Prompt**

### "Node.js not found"
- Install Node.js from [nodejs.org](https://nodejs.org/)
- Restart Command Prompt/PowerShell after installation

### "Rust not found"
- Install Rust from [rustup.rs](https://rustup.rs/)
- Restart Command Prompt/PowerShell after installation

### Build fails with resource errors
- Ensure Windows SDK is installed
- Try running from Visual Studio Developer Command Prompt
- Check that all Visual Studio C++ components are installed

## Output Files

After successful build, you'll find:
- `Image Class Selector_0.1.0_x64.msi` - Windows installer package
- `Image Class Selector_0.1.0_x64.exe` - Standalone executable

These files will be automatically copied to `distributables/windows/` folder.

## Features Included

✅ Custom rectangular icon (blue + orange rectangles)  
✅ "Image Class Selector" name in title bar and taskbar  
✅ File menu with Select Folder, Load Classes, and Quit options  
✅ Keyboard shortcuts (Ctrl+O, Ctrl+L)  
✅ Full Windows integration  

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Ensure all prerequisites are installed
3. Try running from Visual Studio Developer Command Prompt
4. Check that Windows SDK and Visual Studio C++ tools are properly installed
