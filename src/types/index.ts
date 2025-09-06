export interface Rectangle {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  draggable: boolean;
  classId: number; // Class ID for this rectangle
}

export interface ImageFile {
  path: string;
  name: string;
  data: string; // base64 data URL
  originalWidth: number; // Original image width
  originalHeight: number; // Original image height
}

export interface ExportResult {
  success: boolean;
  message: string;
  file_path?: string;
  rectangles_processed: number;
  errors: string[];
}

export interface BatchExportResult {
  total_images: number;
  successful_exports: number;
  failed_exports: number;
  results: ExportResult[];
  summary: string;
}
