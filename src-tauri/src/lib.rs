// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use serde::{Deserialize, Serialize};
use std::fs;

fn image_path_to_annotation_path(image_path: &str) -> Option<String> {
    if image_path.ends_with(".jpg") || image_path.ends_with(".jpeg") {
        Some(image_path.replace(".jpg", ".txt").replace(".jpeg", ".txt"))
    } else if image_path.ends_with(".png") {
        Some(image_path.replace(".png", ".txt"))
    } else {
        None
    }
}

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
fn export_rectangles_to_yolo(request: YoloExportRequest) -> ExportResult {
    let YoloExportRequest { image_path, rectangles, image_width, image_height, class_id: _ } =
        request;

    // Convert image path to txt path
    let txt_path = match image_path_to_annotation_path(&image_path) {
        Some(path) => path,
        None => {
            return ExportResult {
                success: false,
                message: "Unsupported image format".to_string(),
                file_path: None,
                rectangles_processed: 0,
                errors: vec!["Unsupported image format".to_string()],
            };
        }
    };

    // Generate YOLO format lines
    let lines: Vec<String> = rectangles
        .iter()
        .map(|rect| {
            let x_center = (rect.x + rect.width / 2.0) / image_width as f64;
            let y_center = (rect.y + rect.height / 2.0) / image_height as f64;
            let w_norm = rect.width / image_width as f64;
            let h_norm = rect.height / image_height as f64;

            format!(
                "{:.0} {:.6} {:.6} {:.6} {:.6}",
                rect.class_id, x_center, y_center, w_norm, h_norm
            )
        })
        .collect();

    // Write to file
    let content = lines.join("\n");
    match fs::write(&txt_path, content) {
        Ok(_) => ExportResult {
            success: true,
            message: "YOLO annotations exported successfully".to_string(),
            file_path: Some(txt_path),
            rectangles_processed: rectangles.len(),
            errors: Vec::new(),
        },
        Err(e) => ExportResult {
            success: false,
            message: format!("Failed to write file: {}", e),
            file_path: None,
            rectangles_processed: 0,
            errors: vec![e.to_string()],
        },
    }
}

#[tauri::command]
fn export_all_rectangles_to_yolo(requests: Vec<YoloExportRequest>) -> BatchExportResult {
    let mut success_count = 0;
    let mut error_count = 0;
    let mut errors = Vec::new();

    for request in &requests {
        let result = export_rectangles_to_yolo(request.clone());
        if result.success {
            success_count += 1;
        } else {
            error_count += 1;
            errors.push(result.message);
        }
    }

    let summary = if success_count > 0 {
        if error_count > 0 {
            format!("Exported {} YOLO annotation files ({} failed)", success_count, error_count)
        } else {
            format!("Successfully exported {} YOLO annotation files", success_count)
        }
    } else {
        format!("Failed to export any YOLO annotations. Errors: {}", errors.join(", "))
    };

    BatchExportResult {
        total_images: requests.len(),
        successful_exports: success_count,
        failed_exports: error_count,
        results: Vec::new(),
        summary,
    }
}

#[tauri::command]
fn read_yolo_annotations(
    image_path: String,
    image_width: u32,
    image_height: u32,
) -> Result<Vec<Rectangle>, String> {
    // Convert image path to txt path
    let txt_path = image_path_to_annotation_path(&image_path)
        .ok_or_else(|| "Unsupported image format".to_string())?;

    // Check if the txt file exists
    if !std::path::Path::new(&txt_path).exists() {
        return Ok(Vec::new()); // Return empty vector if no annotations exist
    }

    // Read the txt file
    let content = fs::read_to_string(&txt_path)
        .map_err(|e| format!("Failed to read annotation file: {}", e))?;

    // Parse YOLO format lines
    let rectangles: Result<Vec<Rectangle>, String> = content
        .lines()
        .enumerate()
        .filter(|(_, line)| !line.trim().is_empty())
        .map(|(line_num, line)| {
            let parts: Vec<&str> = line.split_whitespace().collect();
            if parts.len() != 5 {
                return Err(format!(
                    "Invalid line {}: expected 5 parts, got {}",
                    line_num + 1,
                    parts.len()
                ));
            }

            // Parse YOLO format: class x_center y_center width height
            let class_id: f64 = parts[0]
                .parse()
                .map_err(|e| format!("Invalid class ID on line {}: {}", line_num + 1, e))?;
            let x_center: f64 = parts[1]
                .parse()
                .map_err(|e| format!("Invalid x_center on line {}: {}", line_num + 1, e))?;
            let y_center: f64 = parts[2]
                .parse()
                .map_err(|e| format!("Invalid y_center on line {}: {}", line_num + 1, e))?;
            let w_norm: f64 = parts[3]
                .parse()
                .map_err(|e| format!("Invalid width on line {}: {}", line_num + 1, e))?;
            let h_norm: f64 = parts[4]
                .parse()
                .map_err(|e| format!("Invalid height on line {}: {}", line_num + 1, e))?;

            // Convert normalized coordinates back to pixel coordinates
            let x = (x_center - w_norm / 2.0) * image_width as f64;
            let y = (y_center - h_norm / 2.0) * image_height as f64;
            let width = w_norm * image_width as f64;
            let height = h_norm * image_height as f64;

            Ok(Rectangle {
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
            })
        })
        .collect();

    rectangles
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            export_rectangles_to_yolo,
            export_all_rectangles_to_yolo,
            read_yolo_annotations
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
