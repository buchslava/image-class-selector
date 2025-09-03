import { Rectangle } from '../types';

export const getYOLOTxtPath = (imagePath: string): string => {
  // Replace image extension with .txt
  return imagePath.replace(/\.(jpg|jpeg|png)$/i, '.txt');
};

export const saveYOLOTxtFile = async (
  rectangles: Rectangle[],
  imageWidth: number,
  imageHeight: number,
  outputPath: string,
  classId: number = 0
): Promise<void> => {
  console.log("=== TypeScript YOLO Export Start ===");
  console.log("Output path:", outputPath);
  console.log("Image dimensions:", imageWidth, "x", imageHeight);
  console.log("Number of rectangles:", rectangles.length);
  console.log("Class ID:", classId);
  
  // Use Rust function for Tauri environment
  const { invoke } = await import('@tauri-apps/api/core');
  
  const request = {
    image_path: outputPath,
    rectangles: rectangles.map(rect => ({
      id: rect.id,
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
      fill: rect.fill,
      stroke: rect.stroke,
      stroke_width: rect.strokeWidth,
      draggable: rect.draggable,
    })),
    image_width: imageWidth,
    image_height: imageHeight,
    class_id: classId,
  };
  
  console.log("Sending request to Rust:", request);
  
  try {
    const result = await invoke('export_rectangles_to_yolo', { request });
    console.log("Rust returned:", result);
    console.log("=== TypeScript YOLO Export Success ===");
  } catch (error) {
    console.error("=== TypeScript YOLO Export Error ===");
    console.error("Error calling Rust function:", error);
    throw error;
  }
};

export const exportAllYOLO = async (
  exports: Array<{
    imagePath: string;
    rectangles: Rectangle[];
    imageWidth: number;
    imageHeight: number;
    classId?: number;
  }>
): Promise<void> => {
  console.log("=== TypeScript Batch YOLO Export Start ===");
  console.log("Number of images to export:", exports.length);
  
  // Use Rust batch function for Tauri environment
  const { invoke } = await import('@tauri-apps/api/core');
  
  const requests = exports.map(exportData => ({
    image_path: exportData.imagePath,
    rectangles: exportData.rectangles.map(rect => ({
      id: rect.id,
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
      fill: rect.fill,
      stroke: rect.stroke,
      stroke_width: rect.strokeWidth,
      draggable: rect.draggable,
    })),
    image_width: exportData.imageWidth,
    image_height: exportData.imageHeight,
    class_id: exportData.classId || 0,
  }));
  
  console.log("Sending batch request to Rust:", requests);
  
  try {
    const result = await invoke('export_all_rectangles_to_yolo', { requests });
    console.log("Rust batch returned:", result);
    console.log("=== TypeScript Batch YOLO Export Success ===");
  } catch (error) {
    console.error("=== TypeScript Batch YOLO Export Error ===");
    console.error("Error calling Rust batch function:", error);
    throw error;
  }
};

export const loadYOLOAnnotations = async (
  imagePath: string,
  imageWidth: number,
  imageHeight: number
): Promise<Rectangle[]> => {
  console.log("=== TypeScript Load YOLO Annotations Start ===");
  console.log("Image path:", imagePath);
  console.log("Image dimensions:", imageWidth, "x", imageHeight);
  
  // Use Rust function for Tauri environment
  const { invoke } = await import('@tauri-apps/api/core');
  
  try {
    const rectangles = await invoke('read_yolo_annotations', {
      imagePath: imagePath,
      imageWidth: imageWidth,
      imageHeight: imageHeight,
    });
    
    console.log("Rust returned rectangles:", rectangles);
    console.log("=== TypeScript Load YOLO Annotations Success ===");
    return rectangles as Rectangle[];
  } catch (error) {
    console.error("=== TypeScript Load YOLO Annotations Error ===");
    console.error("Error calling Rust function:", error);
    // Return empty array if no annotations exist or error occurs
    return [];
  }
};
