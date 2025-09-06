# Image Class Selector

A desktop application built with Tauri, React, and TypeScript for creating YOLO annotations. Draw rectangles on images and assign them to custom classes.

## Features

- **Load Images**: Select folders of images for annotation
- **Load Classes**: Define custom object classes
- **Draw Rectangles**: Click and drag to create selection rectangles
- **Assign Classes**: Select rectangles and assign them to classes
- **Export YOLO**: Export annotations in YOLO format for machine learning
- **Clear Annotations**: Remove rectangles from current image or all images
- **System Menu**: File menu with Select Folder, Load Classes, and Quit
- **Keyboard Shortcuts**: Cmd+O (Select Folder), Cmd+L (Load Classes)

## How to Use

1. **Load Classes**: Click "Load Classes" to select a text file with class names (one per line)
2. **Select Folder**: Click "Select Folder" to choose a directory with images
3. **Annotate**: Click thumbnails to view images, then click and drag to create rectangles
4. **Assign Classes**: Select rectangles and choose a class from the dropdown
5. **Export**: Click "Export YOLO" to save annotations in YOLO format
6. **Clear**: Use "Clear This" or "Clear All Images" to remove annotations

## Keyboard Shortcuts

- `Cmd+O` (macOS) / `Ctrl+O` (Windows/Linux): Select Folder
- `Cmd+L` (macOS) / `Ctrl+L` (Windows/Linux): Load Classes

## Technical Stack

- **Frontend**: React + TypeScript + Vite
- **UI Framework**: Ant Design
- **Canvas Library**: React Konva (Konva.js)
- **Desktop Framework**: Tauri v2
- **Backend**: Rust

## Installation

### Prerequisites
- Node.js (v18 or higher)
- Rust (latest stable)

### Development
```bash
# Install dependencies
npm install

# Start development server
npm run tauri dev

# Build for production
npm run tauri build
```

### Windows Build
Use the provided build scripts:
```cmd
build-windows.bat
```
or
```powershell
.\build-windows.ps1
```

## Distribution

Pre-built apps are available in the `distributables/` folder:
- **macOS**: `Image Class Selector_0.1.0_x64.dmg`
- **Windows**: Use build scripts to create distributables
