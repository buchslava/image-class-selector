// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use serde::{Deserialize, Serialize};
use std::fs;


#[derive(Debug, Serialize, Deserialize)]
struct ExportResult {
    success: bool,
    message: String,
    file_path: Option<String>,
    rectangles_processed: usize,
    errors: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
struct BatchExportResult {
    total_images: usize,
    successful_exports: usize,
    failed_exports: usize,
    results: Vec<ExportResult>,
    summary: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct Rectangle {
    id: String,
    x: f64,
    y: f64,
    width: f64,
    height: f64,
    fill: String,
    stroke: String,
    #[serde(rename = "strokeWidth")]
    stroke_width: f64,
    draggable: bool,
    #[serde(rename = "classId")]
    class_id: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct YoloExportRequest {
    #[serde(rename = "imagePath")]
    image_path: String,
    rectangles: Vec<Rectangle>,
    #[serde(rename = "imageWidth")]
    image_width: u32,
    #[serde(rename = "imageHeight")]
    image_height: u32,
    #[serde(rename = "classId")]
    class_id: f64,
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn export_rectangles_to_yolo(request: YoloExportRequest) -> ExportResult {
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
        return ExportResult {
            success: false,
            message: "Unsupported image format".to_string(),
            file_path: None,
            rectangles_processed: 0,
            errors: vec!["Unsupported image format".to_string()],
        };
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
        let line = format!("{:.0} {:.6} {:.6} {:.6} {:.6}", rect.class_id, x_center, y_center, w_norm, h_norm);
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
            ExportResult {
                success: true,
                message: format!("YOLO annotations exported successfully"),
                file_path: Some(txt_path),
                rectangles_processed: rectangles.len(),
                errors: Vec::new(),
            }
        },
        Err(e) => {
            println!("=== YOLO EXPORT ERROR ===");
            println!("Failed to write file: {}", e);
            ExportResult {
                success: false,
                message: format!("Failed to write file: {}", e),
                file_path: None,
                rectangles_processed: 0,
                errors: vec![e.to_string()],
            }
        }
    }
}

#[tauri::command]
fn export_all_rectangles_to_yolo(requests: Vec<YoloExportRequest>) -> BatchExportResult {
    println!("=== BATCH YOLO EXPORT START ===");
    println!("Number of images to process: {}", requests.len());
    
    let mut success_count = 0;
    let mut error_count = 0;
    let mut errors = Vec::new();

    for (i, request) in requests.iter().enumerate() {
        println!("Processing image {}: {}", i, request.image_path);
        let result = export_rectangles_to_yolo(request.clone());
        if result.success {
            success_count += 1;
            println!("Successfully exported image {}", i);
        } else {
            error_count += 1;
            println!("Failed to export image {}: {}", i, result.message);
            errors.push(result.message);
        }
    }

    println!("=== BATCH YOLO EXPORT COMPLETE ===");
    println!("Success: {}, Errors: {}", success_count, error_count);

    let summary = if success_count > 0 {
        if error_count > 0 {
            format!("Exported {} YOLO annotation files ({} failed)", success_count, error_count)
        } else {
            format!("Successfully exported {} YOLO annotation files", success_count)
        }
    } else {
        format!("Failed to export any YOLO annotations. Errors: {}", errors.join(", "))
    };

    println!("Returning summary: {}", summary);
    
    BatchExportResult {
        total_images: requests.len(),
        successful_exports: success_count,
        failed_exports: error_count,
        results: Vec::new(), // We'll need to collect results from individual exports
        summary,
    }
}

#[tauri::command]
fn read_yolo_annotations(image_path: String, image_width: u32, image_height: u32) -> Result<Vec<Rectangle>, String> {
    println!("=== READING YOLO ANNOTATIONS ===");
    println!("Image path: {}", image_path);
    println!("Image dimensions: {}x{}", image_width, image_height);
    
    // Convert image path to txt path
    let txt_path = if image_path.ends_with(".jpg") || image_path.ends_with(".jpeg") {
        image_path.replace(".jpg", ".txt").replace(".jpeg", ".txt")
    } else if image_path.ends_with(".png") {
        image_path.replace(".png", ".txt")
    } else {
        return Err("Unsupported image format".to_string());
    };

    println!("Looking for annotation file: {}", txt_path);
    
    // Check if the txt file exists
    if !std::path::Path::new(&txt_path).exists() {
        println!("Annotation file does not exist: {}", txt_path);
        return Ok(Vec::new()); // Return empty vector if no annotations exist
    }

    // Read the txt file
    let content = match fs::read_to_string(&txt_path) {
        Ok(content) => content,
        Err(e) => {
            println!("Failed to read annotation file: {}", e);
            return Err(format!("Failed to read annotation file: {}", e));
        }
    };

    println!("Read content: {}", content);

    // Parse YOLO format lines
    let mut rectangles = Vec::new();
    for (line_num, line) in content.lines().enumerate() {
        let line = line.trim();
        if line.is_empty() {
            continue;
        }

        let parts: Vec<&str> = line.split_whitespace().collect();
        if parts.len() != 5 {
            println!("Invalid line {}: expected 5 parts, got {}", line_num + 1, parts.len());
            continue;
        }

        // Parse YOLO format: class x_center y_center width height
        let class_id: f64 = match parts[0].parse() {
            Ok(id) => id,
            Err(e) => {
                println!("Invalid class ID on line {}: {}", line_num + 1, e);
                continue;
            }
        };

        let x_center: f64 = match parts[1].parse() {
            Ok(x) => x,
            Err(e) => {
                println!("Invalid x_center on line {}: {}", line_num + 1, e);
                continue;
            }
        };

        let y_center: f64 = match parts[2].parse() {
            Ok(y) => y,
            Err(e) => {
                println!("Invalid y_center on line {}: {}", line_num + 1, e);
                continue;
            }
        };

        let w_norm: f64 = match parts[3].parse() {
            Ok(w) => w,
            Err(e) => {
                println!("Invalid width on line {}: {}", line_num + 1, e);
                continue;
            }
        };

        let h_norm: f64 = match parts[4].parse() {
            Ok(h) => h,
            Err(e) => {
                println!("Invalid height on line {}: {}", line_num + 1, e);
                continue;
            }
        };

        // Convert normalized coordinates back to pixel coordinates
        let x = (x_center - w_norm / 2.0) * image_width as f64;
        let y = (y_center - h_norm / 2.0) * image_height as f64;
        let width = w_norm * image_width as f64;
        let height = h_norm * image_height as f64;

        println!("Line {}: class={}, x_center={}, y_center={}, w={}, h={}", 
                line_num + 1, class_id, x_center, y_center, w_norm, h_norm);
        println!("Converted to: x={}, y={}, width={}, height={}", x, y, width, height);

        let rectangle = Rectangle {
            id: format!("loaded_rect_{}", line_num),
            x,
            y,
            width,
            height,
            fill: "rgba(0, 123, 255, 0.2)".to_string(),
            stroke: "#007bff".to_string(),
            stroke_width: 2.0,
            draggable: true,
            class_id,
        };

        rectangles.push(rectangle);
    }

    println!("=== READ {} RECTANGLES ===", rectangles.len());
    Ok(rectangles)
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
            export_all_rectangles_to_yolo,
            read_yolo_annotations
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
