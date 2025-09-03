#!/bin/bash

echo "Killing all Tauri and related processes..."

# Kill processes on port 1420
echo "Killing processes on port 1420..."
lsof -ti:1420 | xargs kill -9 2>/dev/null

# Kill npm tauri dev processes
echo "Killing npm tauri dev processes..."
pkill -f "npm run tauri dev" 2>/dev/null

# Kill cargo processes
echo "Killing cargo processes..."
pkill -f "cargo" 2>/dev/null

# Kill any remaining node processes related to the project
echo "Killing node processes..."
pkill -f "vite" 2>/dev/null
pkill -f "tauri" 2>/dev/null

echo "All processes killed!"
