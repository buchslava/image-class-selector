# Image Class Selector

A professional desktop application built with Tauri, React, and TypeScript for image annotation and YOLO dataset creation. Create interactive rectangle selections on images and assign them to custom classes.

## ✨ Features

### 🖼️ **Image Management**
- **Load Multiple Images**: Select entire folders of images for batch processing
- **Image Navigation**: Browse through images with thumbnail sidebar
- **Auto-reload**: Images automatically reload when classes are updated

### 🎯 **Annotation Tools**
- **Interactive Canvas**: Click and drag to create selection rectangles
- **Class Assignment**: Assign rectangles to custom classes from dropdown
- **Drag & Resize**: Move and resize rectangles with intuitive controls
- **Smart Selection**: Click outside rectangles to deselect them
- **Persistent Annotations**: Selections maintained across all images

### 📊 **Data Management**
- **Custom Classes**: Load and manage your own class definitions
- **YOLO Export**: Export annotations in YOLO format for machine learning
- **JSON Export**: Export rectangle data as JSON for further processing
- **Clear All**: Remove all rectangles with a single click

### 🖥️ **Desktop Integration**
- **System Menu**: File menu with Select Folder, Load Classes, and Quit
- **Keyboard Shortcuts**: Cmd+O (Select Folder), Cmd+L (Load Classes)
- **Custom Icon**: Professional rectangular icon design
- **Cross-Platform**: Works on macOS, Windows, and Linux

## 🚀 Quick Start

### 1. **Load Your Data**
- **Select Folder**: Use "Select Folder" button or File menu (Cmd+O) to choose image directory
- **Load Classes**: Use "Load Classes" button or File menu (Cmd+L) to load class definitions

### 2. **Annotate Images**
- **Browse Images**: Click thumbnails in sidebar to switch between images
- **Create Rectangles**: Click and drag on canvas to create selection rectangles
- **Assign Classes**: Select rectangles and choose class from dropdown
- **Edit Annotations**: Drag to move, resize handles to adjust size, click outside to deselect

### 3. **Export Results**
- **YOLO Format**: Export annotations for machine learning training
- **JSON Format**: Export raw data for custom processing
- **Batch Export**: Process all images at once

## 📋 Detailed Usage

### **Image Loading**
- Supports common formats: JPG, PNG, GIF, BMP, WebP
- Recursive folder scanning for organized datasets
- Automatic image reloading when classes change

### **Annotation Workflow**
1. **Load Classes**: Define your object classes (e.g., "person", "car", "bicycle")
2. **Select Images**: Choose folder containing your images
3. **Annotate**: Create rectangles around objects and assign classes
4. **Navigate**: Switch between images while maintaining annotations
5. **Export**: Generate YOLO or JSON files for training

### **Keyboard Shortcuts**
- `Cmd+O` (macOS) / `Ctrl+O` (Windows/Linux): Select Folder
- `Cmd+L` (macOS) / `Ctrl+L` (Windows/Linux): Load Classes
- `Cmd+Q` (macOS) / `Alt+F4` (Windows): Quit Application

## 🛠️ Technical Stack

- **Frontend**: React 19 + TypeScript + Vite
- **UI Framework**: Ant Design
- **Canvas Library**: React Konva (Konva.js)
- **Desktop Framework**: Tauri v2
- **Backend**: Rust
- **Code Quality**: Prettier + ESLint + rustfmt

## 🚀 Installation & Distribution

### **Download Pre-built Apps**
Ready-to-use distributables are available in the `distributables/` folder:

- **macOS**: `Image Class Selector_0.1.0_x64.dmg` (3.6MB installer)
- **Windows**: Use build scripts (see below)

### **Build from Source**

#### **Prerequisites**
- Node.js (v18 or higher)
- Rust (latest stable)
- Tauri CLI

#### **Development Setup**
```bash
# Install dependencies
npm install

# Start development server
npm run tauri dev

# Build for production
npm run tauri build
```

#### **Windows Build**
Use the provided build scripts:
```cmd
# Windows Command Prompt
build-windows.bat

# Windows PowerShell
.\build-windows.ps1
```

See `BUILD-WINDOWS.md` for detailed Windows build instructions.

## 🎨 Customization

### **Code Formatting**
- **TypeScript/JavaScript**: Prettier + ESLint
- **Rust**: rustfmt
- **Commands**: `npm run format` and `npm run format:rust`

### **Icon Design**
- Custom rectangular icon with blue and orange rectangles
- Multiple sizes: 32×32, 128×128, 256×256, 512×512 PNG
- Windows ICO format included
- SVG source available for modifications

## 🔧 Development

### **Recommended IDE Setup**
- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

### **Project Structure**
```
src/
├── components/          # React components
├── utils/              # Utility functions
├── types/              # TypeScript definitions
└── App.tsx             # Main application

src-tauri/
├── src/                # Rust backend
├── icons/              # Application icons
└── tauri.conf.json     # Tauri configuration

distributables/         # Built applications
├── macos/              # macOS distributables
├── windows/            # Windows distributables
└── README.md           # Distribution guide
```

## 📄 License

This project is open source and available under the MIT License.
