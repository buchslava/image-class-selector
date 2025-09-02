# Image Class Selector

A desktop application built with Tauri, React, and TypeScript for selecting and annotating regions in images using interactive rectangles.

## Features

- **Image Loading**: Load multiple images from your file system
- **Interactive Canvas**: Click and drag to create selection rectangles on images
- **Persistent Selections**: Rectangle selections are maintained across all images
- **Drag & Drop**: Move rectangles by dragging them around the canvas
- **Delete Rectangles**: Double-click any rectangle to remove it
- **Export Annotations**: Export rectangle data as JSON for further processing
- **Clear All**: Remove all rectangles with a single click

## How to Use

1. **Load Images**: Click "Load Images" to select image files from your computer
2. **Select Image**: Click on any thumbnail in the sidebar to view it in the main canvas
3. **Create Rectangles**: Click and drag on the canvas to create selection rectangles
4. **Move Rectangles**: Drag existing rectangles to reposition them
5. **Delete Rectangles**: Double-click any rectangle to remove it
6. **Export Data**: Click "Export" to download rectangle annotations as JSON
7. **Clear All**: Click "Clear All" to remove all rectangles

## Technical Stack

- **Frontend**: React 19 + TypeScript
- **UI Framework**: Ant Design
- **Canvas Library**: React Konva (Konva.js)
- **Desktop Framework**: Tauri
- **Build Tool**: Vite

## Development

### Prerequisites

- Node.js (v18 or higher)
- Rust (latest stable)
- Tauri CLI

### Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

