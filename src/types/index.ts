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
}

export interface ImageFile {
  path: string;
  name: string;
  data: string; // base64 data URL
  originalWidth: number; // Original image width
  originalHeight: number; // Original image height
}

export interface ExportData {
  imageName: string;
  imagePath: string;
  rectangles: Rectangle[];
  exportDate: string;
}

export interface YOLORectangle {
  classId: number;
  xCenter: number; // normalized (0-1)
  yCenter: number; // normalized (0-1)
  width: number; // normalized (0-1)
  height: number; // normalized (0-1)
}
