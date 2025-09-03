// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use serde::{Deserialize, Serialize};
use std::fs;

#[derive(Debug, Serialize, Deserialize, Clone)]
struct Rectangle {
    id: String,
    x: f64,
    y: f64,
    width: f64,
    height: f64,
    fill: String,
    stroke: String,
    stroke_width: f64,
    draggable: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct YoloExportRequest {
    image_path: String,
    rectangles: Vec<Rectangle>,
    image_width: u32,
    image_height: u32,
    class_id: u32,
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn export_rectangles_to_yolo(request: YoloExportRequest) -> Result<String, String> {
    println!("=== YOLO EXPORT START ===");
    println!("Image path: {}", request.image_path);
    println!("Image dimensions: {}x{}", request.image_width, request.image_height);
    println!("Number of rectangles: {}", request.rectangles.len());
    println!("Class ID: {}", request.class_id);
    
    let YoloExportRequest {
        image_path,
        rectangles,
        image_width,
        image_height,
        class_id,
    } = request;

    // Convert image path to txt path
    let txt_path = if image_path.ends_with(".jpg") || image_path.ends_with(".jpeg") {
        image_path.replace(".jpg", ".txt").replace(".jpeg", ".txt")
    } else if image_path.ends_with(".png") {
        image_path.replace(".png", ".txt")
    } else {
        return Err("Unsupported image format".to_string());
    };

    println!("TXT output path: {}", txt_path);

    // Generate YOLO format lines
    let mut lines = Vec::new();
    for (i, rect) in rectangles.iter().enumerate() {
        println!("Processing rectangle {}: x={}, y={}, w={}, h={}", i, rect.x, rect.y, rect.width, rect.height);
        
        // Convert to YOLO format (normalized)
        let x_center = (rect.x + rect.width / 2.0) / image_width as f64;
        let y_center = (rect.y + rect.height / 2.0) / image_height as f64;
        let w_norm = rect.width / image_width as f64;
        let h_norm = rect.height / image_height as f64;

        println!("YOLO normalized: x_center={:.6}, y_center={:.6}, w={:.6}, h={:.6}", x_center, y_center, w_norm, h_norm);

        // Format: class x_center y_center width height
        let line = format!("{} {:.6} {:.6} {:.6} {:.6}", class_id, x_center, y_center, w_norm, h_norm);
        lines.push(line);
    }

    // Write to file
    let content = lines.join("\n");
    println!("Final content to write:");
    println!("{}", content);
    println!("Writing to file: {}", txt_path);
    
    match fs::write(&txt_path, content) {
        Ok(_) => {
            println!("=== YOLO EXPORT SUCCESS ===");
            println!("File written successfully to: {}", txt_path);
            Ok(format!("YOLO annotations exported to: {}", txt_path))
        },
        Err(e) => {
            println!("=== YOLO EXPORT ERROR ===");
            println!("Failed to write file: {}", e);
            Err(format!("Failed to write file: {}", e))
        }
    }
}

#[tauri::command]
fn export_all_rectangles_to_yolo(requests: Vec<YoloExportRequest>) -> Result<String, String> {
    println!("=== BATCH YOLO EXPORT START ===");
    println!("Number of images to process: {}", requests.len());
    
    let mut success_count = 0;
    let mut error_count = 0;
    let mut errors = Vec::new();

    for (i, request) in requests.iter().enumerate() {
        println!("Processing image {}: {}", i, request.image_path);
        match export_rectangles_to_yolo(request.clone()) {
            Ok(_) => {
                success_count += 1;
                println!("Successfully exported image {}", i);
            },
            Err(e) => {
                error_count += 1;
                println!("Failed to export image {}: {}", i, e);
                errors.push(e);
            }
        }
    }

    println!("=== BATCH YOLO EXPORT COMPLETE ===");
    println!("Success: {}, Errors: {}", success_count, error_count);

    if success_count > 0 {
        let message = if error_count > 0 {
            format!("Exported {} YOLO annotation files ({} failed)", success_count, error_count)
        } else {
            format!("Successfully exported {} YOLO annotation files", success_count)
        };
        println!("Returning success message: {}", message);
        Ok(message)
    } else {
        let error_message = format!("Failed to export any YOLO annotations. Errors: {}", errors.join(", "));
        println!("Returning error message: {}", error_message);
        Err(error_message)
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            export_rectangles_to_yolo,
            export_all_rectangles_to_yolo
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
