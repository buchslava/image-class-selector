import { Rectangle, ExportResult, BatchExportResult } from '../types';

export const getYOLOTxtPath = (imagePath: string): string => {
  // Replace image extension with .txt
  return imagePath.replace(/\.(jpg|jpeg|png)$/i, '.txt');
};

export const saveYOLOTxtFile = async (
  rectangles: Rectangle[],
  imageWidth: number,
  imageHeight: number,
  imagePath: string,
  classId: number = 0
): Promise<ExportResult> => {
  console.log("=== TypeScript YOLO Export Start ===");
  console.log("Image path:", imagePath);
  console.log("Image dimensions:", imageWidth, "x", imageHeight);
  console.log("Number of rectangles:", rectangles.length);
  console.log("Class ID:", classId);
  
  // Use Rust function for Tauri environment
  const { invoke } = await import('@tauri-apps/api/core');
  
  // Validate rectangles have all required fields
  const validatedRectangles = rectangles.map(rect => {
    if (rect.strokeWidth === undefined) {
      console.warn(`Rectangle ${rect.id} missing strokeWidth, using default value 2`);
    }
    return {
      id: rect.id,
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
      fill: rect.fill,
      stroke: rect.stroke,
      stroke_width: rect.strokeWidth || 2, // Provide default if missing
      draggable: rect.draggable,
    };
  });

  const request = {
    image_path: imagePath,
    rectangles: validatedRectangles,
    image_width: imageWidth,
    image_height: imageHeight,
    class_id: classId,
  };
  
  console.log("Sending request to Rust:", request);
  
  try {
    const result = await invoke('export_rectangles_to_yolo', { request }) as ExportResult;
    console.log("Rust returned:", result);
    console.log("=== TypeScript YOLO Export Success ===");
    return result;
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
): Promise<BatchExportResult> => {
  console.log("=== TypeScript Batch YOLO Export Start ===");
  console.log("Number of images to export:", exports.length);
  
  // Use Rust batch function for Tauri environment
  const { invoke } = await import('@tauri-apps/api/core');
  
  const requests = exports.map(exportData => {
    // Validate rectangles have all required fields
    const validatedRectangles = exportData.rectangles.map(rect => {
      if (rect.strokeWidth === undefined) {
        console.warn(`Rectangle ${rect.id} missing strokeWidth, using default value 2`);
      }
      return {
        id: rect.id,
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
        fill: rect.fill,
        stroke: rect.stroke,
        stroke_width: rect.strokeWidth || 2, // Provide default if missing
        draggable: rect.draggable,
      };
    });
    
    return {
      image_path: exportData.imagePath,
      rectangles: validatedRectangles,
      image_width: exportData.imageWidth,
      image_height: exportData.imageHeight,
      class_id: exportData.classId || 0,
    };
  });
  
  console.log("Sending batch request to Rust:", requests);
  
  try {
    const result = await invoke('export_all_rectangles_to_yolo', { requests }) as BatchExportResult;
    console.log("Rust batch returned:", result);
    console.log("=== TypeScript Batch YOLO Export Success ===");
    return result;
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
