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
  const { invoke } = await import('@tauri-apps/api/core');

  const validatedRectangles = rectangles.map(rect => ({
    id: rect.id,
    x: rect.x,
    y: rect.y,
    width: rect.width,
    height: rect.height,
    fill: rect.fill,
    stroke: rect.stroke,
    strokeWidth: rect.strokeWidth || 2,
    draggable: rect.draggable,
    classId: rect.classId || 0,
  }));

  const request = {
    imagePath,
    rectangles: validatedRectangles,
    imageWidth,
    imageHeight,
    classId,
  };

  try {
    return (await invoke('export_rectangles_to_yolo', { request })) as ExportResult;
  } catch (error) {
    console.error('Error calling Rust function:', error);
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
  const { invoke } = await import('@tauri-apps/api/core');

  const requests = exports.map(exportData => ({
    imagePath: exportData.imagePath,
    rectangles: exportData.rectangles.map(rect => ({
      id: rect.id,
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
      fill: rect.fill,
      stroke: rect.stroke,
      strokeWidth: rect.strokeWidth || 2,
      draggable: rect.draggable,
      classId: rect.classId || 0,
    })),
    imageWidth: exportData.imageWidth,
    imageHeight: exportData.imageHeight,
    classId: exportData.classId || 0,
  }));

  try {
    return (await invoke('export_all_rectangles_to_yolo', { requests })) as BatchExportResult;
  } catch (error) {
    console.error('Error calling Rust batch function:', error);
    throw error;
  }
};

export const loadYOLOAnnotations = async (
  imagePath: string,
  imageWidth: number,
  imageHeight: number
): Promise<Rectangle[]> => {
  const { invoke } = await import('@tauri-apps/api/core');

  try {
    return (await invoke('read_yolo_annotations', {
      imagePath,
      imageWidth,
      imageHeight,
    })) as Rectangle[];
  } catch (error) {
    console.error('Error calling Rust function:', error);
    return [];
  }
};
