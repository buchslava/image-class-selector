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
}

export interface ExportData {
  imageName: string;
  imagePath: string;
  rectangles: Rectangle[];
  exportDate: string;
}
