import React, { useRef, useState, useEffect } from 'react';
import { Stage, Layer, Rect, Image as KonvaImage, Transformer, Text } from 'react-konva';
import Konva from 'konva';
import { Rectangle } from '../types';

interface ImageCanvasProps {
  imageSrc: string;
  rectangles: Rectangle[];
  onRectanglesChange: (rectangles: Rectangle[]) => void;
  originalWidth?: number;
  originalHeight?: number;
  selectedClassId: number;
  classes: string[];
  clearSelection?: boolean;
}

const ImageCanvas: React.FC<ImageCanvasProps> = ({
  imageSrc,
  rectangles,
  onRectanglesChange,
  selectedClassId,
  classes,
  clearSelection,
}) => {
  const stageRef = useRef<Konva.Stage>(null);
  const layerRef = useRef<Konva.Layer>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 });
  const [isDrawing, setIsDrawing] = useState(false);
  const [newRect, setNewRect] = useState<Partial<Rectangle> | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });

  // Calculate stage size based on available space and image dimensions
  const calculateStageSize = (imgWidth: number, imgHeight: number) => {
    // Get available space (subtract padding and margins)
    const availableWidth = window.innerWidth - 400; // Account for sidebar
    const availableHeight = window.innerHeight - 200; // Account for header and padding

    const maxWidth = Math.min(availableWidth, 1200); // Cap at 1200px
    const maxHeight = Math.min(availableHeight, 800); // Cap at 800px

    const aspectRatio = imgWidth / imgHeight;

    let width = maxWidth;
    let height = maxWidth / aspectRatio;

    if (height > maxHeight) {
      height = maxHeight;
      width = maxHeight * aspectRatio;
    }

    return { width, height };
  };

  // Load image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setImage(img);
      setImageDimensions({ width: img.width, height: img.height });
      setStageSize(calculateStageSize(img.width, img.height));
    };
    img.onerror = error => {
      console.error('Error loading image:', error);
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (imageDimensions.width > 0 && imageDimensions.height > 0) {
        setStageSize(calculateStageSize(imageDimensions.width, imageDimensions.height));
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [imageDimensions]);

  // Clear selection when clearSelection prop changes
  useEffect(() => {
    if (clearSelection) {
      setSelectedId(null);
    }
  }, [clearSelection]);

  // Coordinate transformation functions
  const stageToImageCoords = (stageX: number, stageY: number) => {
    const scaleX = imageDimensions.width / stageSize.width;
    const scaleY = imageDimensions.height / stageSize.height;
    return {
      x: stageX * scaleX,
      y: stageY * scaleY,
    };
  };

  const imageToStageCoords = (imageX: number, imageY: number) => {
    const scaleX = stageSize.width / imageDimensions.width;
    const scaleY = stageSize.height / imageDimensions.height;
    return {
      x: imageX * scaleX,
      y: imageY * scaleY,
    };
  };

  const transformRectangleToStageCoords = (rect: Rectangle): Rectangle => {
    const transformedPos = imageToStageCoords(rect.x, rect.y);
    const scaleX = stageSize.width / imageDimensions.width;
    const scaleY = stageSize.height / imageDimensions.height;

    return {
      ...rect,
      x: transformedPos.x,
      y: transformedPos.y,
      width: rect.width * scaleX,
      height: rect.height * scaleY,
    };
  };

  // Attach transformer to selected rectangle
  useEffect(() => {
    const layer = layerRef.current;
    const tr = trRef.current;

    if (selectedId && layer && tr) {
      const selectedNode = layer.findOne(`#${selectedId}`);
      if (selectedNode) {
        selectedNode.draggable(true);
        selectedNode.scaleX(1);
        selectedNode.scaleY(1);
        tr.nodes([selectedNode]);
        tr.getLayer()?.batchDraw();
        setTimeout(() => tr.getLayer()?.batchDraw(), 10);
      }
    } else if (tr) {
      tr.nodes([]);
      tr.getLayer()?.batchDraw();
    }
  }, [selectedId]);

  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = stageRef.current;
    if (!stage) return;

    const pos = stage.getPointerPosition();

    // Start drawing if clicking on the stage or background (not on existing rectangles)
    if (e.target === stage || e.target.getClassName() === 'Rect') {
      setSelectedId(null);
      if (pos) {
        setIsDrawing(true);
        setNewRect({
          x: pos.x,
          y: pos.y,
          width: 0,
          height: 0,
        });
      }
    }
  };

  const handleMouseMove = () => {
    if (!isDrawing || !newRect) return;

    const stage = stageRef.current;
    if (!stage) return;

    const pos = stage.getPointerPosition();
    if (pos && newRect.x !== undefined && newRect.y !== undefined) {
      setNewRect({
        ...newRect,
        width: pos.x - newRect.x,
        height: pos.y - newRect.y,
      });
    }
  };

  const handleMouseUp = () => {
    if (
      isDrawing &&
      newRect &&
      Math.abs(newRect.width || 0) > 5 &&
      Math.abs(newRect.height || 0) > 5
    ) {
      const transformedPos = stageToImageCoords(newRect.x || 0, newRect.y || 0);
      const scaleX = imageDimensions.width / stageSize.width;
      const scaleY = imageDimensions.height / stageSize.height;

      const rect: Rectangle = {
        id: `rect_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        x: transformedPos.x,
        y: transformedPos.y,
        width: Math.abs(newRect.width || 0) * scaleX,
        height: Math.abs(newRect.height || 0) * scaleY,
        fill: 'rgba(0, 123, 255, 0.2)',
        stroke: '#007bff',
        strokeWidth: 2,
        draggable: true,
        classId: selectedClassId,
      };

      // Adjust coordinates if width/height are negative
      if (newRect.width && newRect.width < 0) {
        rect.x = transformedPos.x + newRect.width * scaleX;
        rect.width = Math.abs(newRect.width * scaleX);
      }
      if (newRect.height && newRect.height < 0) {
        rect.y = transformedPos.y + newRect.height * scaleY;
        rect.height = Math.abs(newRect.height * scaleY);
      }

      onRectanglesChange([...rectangles, rect]);
    }
    setIsDrawing(false);
    setNewRect(null);
  };

  const updateRect = (id: string, newAttrs: Partial<Rectangle>) => {
    const newRectangles = rectangles.map(rect => {
      if (rect.id === id) {
        // Transform stage coordinates to image coordinates if position/size is being updated
        let transformedAttrs = { ...newAttrs };

        if ('x' in newAttrs || 'y' in newAttrs || 'width' in newAttrs || 'height' in newAttrs) {
          const transformedPos = stageToImageCoords(
            newAttrs.x !== undefined ? newAttrs.x : rect.x,
            newAttrs.y !== undefined ? newAttrs.y : rect.y
          );
          const scaleX = imageDimensions.width / stageSize.width;
          const scaleY = imageDimensions.height / stageSize.height;

          transformedAttrs = {
            ...transformedAttrs,
            x: transformedPos.x,
            y: transformedPos.y,
            width: (newAttrs.width !== undefined ? newAttrs.width : rect.width) * scaleX,
            height: (newAttrs.height !== undefined ? newAttrs.height : rect.height) * scaleY,
          };
        }

        return { ...rect, ...transformedAttrs };
      }
      return rect;
    });
    onRectanglesChange(newRectangles);
  };

  const handleRectClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true;
    const rectId = e.target.id();
    setSelectedId(rectId);
    updateRect(rectId, { classId: selectedClassId });

    // Force transformer update immediately
    setTimeout(() => {
      const layer = layerRef.current;
      const tr = trRef.current;
      if (layer && tr) {
        const selectedNode = layer.findOne(`#${rectId}`);
        if (selectedNode) {
          selectedNode.draggable(true);
          tr.nodes([selectedNode]);
          tr.getLayer()?.batchDraw();
          setTimeout(() => tr.getLayer()?.batchDraw(), 10);
        }
      }
    }, 0);
  };

  const handleRectDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    const rectId = e.target.id();
    updateRect(rectId, {
      x: e.target.x(),
      y: e.target.y(),
    });
  };

  const handleRectTransformEnd = (e: Konva.KonvaEventObject<Event>) => {
    const node = e.target;
    const rectId = node.id();

    updateRect(rectId, {
      x: node.x(),
      y: node.y(),
      width: Math.max(5, node.width() * node.scaleX()),
      height: Math.max(5, node.height() * node.scaleY()),
    });
    node.scaleX(1);
    node.scaleY(1);
  };

  const handleRectDoubleClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    // Remove rectangle on double click
    const rectId = e.target.id();
    const newRectangles = rectangles.filter(rect => rect.id !== rectId);
    onRectanglesChange(newRectangles);
  };

  if (!image) {
    return (
      <div className="canvas-container">
        <div style={{ color: '#999', fontSize: '16px' }}>Loading image...</div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
        height: '100%',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          border: '1px solid #d9d9d9',
          borderRadius: '6px',
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          maxWidth: '100%',
          maxHeight: '100%',
        }}
      >
        <Stage
          ref={stageRef}
          width={stageSize.width}
          height={stageSize.height}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onClick={e => {
            if (e.target === stageRef.current) {
              setSelectedId(null);
            }
          }}
          style={{ cursor: isDrawing ? 'crosshair' : 'default' }}
        >
          <Layer ref={layerRef}>
            <KonvaImage image={image} width={stageSize.width} height={stageSize.height} />

            {/* Invisible background rectangle to catch clicks */}
            <Rect
              x={0}
              y={0}
              width={stageSize.width}
              height={stageSize.height}
              fill="transparent"
            />

            {/* Render existing rectangles */}
            {rectangles.map(rect => {
              const stageCoords = transformRectangleToStageCoords(rect);
              const className = classes[rect.classId] || `${rect.classId || 0}`;
              return (
                <React.Fragment key={rect.id}>
                  <Rect
                    id={rect.id}
                    x={stageCoords.x}
                    y={stageCoords.y}
                    width={stageCoords.width}
                    height={stageCoords.height}
                    fill={rect.fill}
                    stroke={rect.stroke}
                    strokeWidth={rect.strokeWidth}
                    draggable={rect.draggable}
                    onClick={handleRectClick}
                    onDragEnd={handleRectDragEnd}
                    onTransformEnd={handleRectTransformEnd}
                    onDblClick={handleRectDoubleClick}
                  />
                  <Rect
                    x={stageCoords.x + 6}
                    y={stageCoords.y + 6}
                    width={className.length * 8 + 16}
                    height={20}
                    fill="rgba(255, 255, 255, 0.9)"
                    stroke="#000000"
                    strokeWidth={1}
                    cornerRadius={3}
                  />
                  <Text
                    x={stageCoords.x + 8}
                    y={stageCoords.y + 8}
                    text={className}
                    fontSize={14}
                    fill="#000000"
                    stroke="#ffffff"
                    strokeWidth={1}
                    fontStyle="bold"
                    padding={4}
                  />
                </React.Fragment>
              );
            })}

            {/* Render new rectangle being drawn */}
            {newRect && (
              <Rect
                x={newRect.x}
                y={newRect.y}
                width={newRect.width}
                height={newRect.height}
                fill="rgba(0, 123, 255, 0.2)"
                stroke="#007bff"
                strokeWidth={2}
                dash={[5, 5]}
              />
            )}

            {/* Transformer for selected rectangle */}
            <Transformer
              ref={trRef}
              boundBoxFunc={(oldBox, newBox) => {
                if (newBox.width < 5 || newBox.height < 5) {
                  return oldBox;
                }
                return newBox;
              }}
              borderEnabled={true}
              borderStroke="#ff0000"
              borderStrokeWidth={3}
              anchorStroke="#ff0000"
              anchorFill="#ffff00"
              anchorSize={12}
              rotateEnabled={false}
              keepRatio={false}
              enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
              ignoreStroke={false}
              onMouseDown={e => {
                e.cancelBubble = true;
              }}
              onTransform={e => {
                e.target.getLayer()?.batchDraw();
              }}
            />
          </Layer>
        </Stage>
      </div>
    </div>
  );
};

export default ImageCanvas;
