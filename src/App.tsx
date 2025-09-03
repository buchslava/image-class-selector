import { useState } from "react";
import { Layout, Button, Image, Row, Col, Typography, message, Space } from "antd";
import { FolderOpenOutlined, DeleteOutlined, DownloadOutlined } from "@ant-design/icons";
import ImageCanvas from "./components/ImageCanvas";
import { ImageFile, Rectangle, ExportResult, BatchExportResult } from "./types";
import { exportAllYOLO, loadYOLOAnnotations } from "./utils/yoloExport";
import "./App.css";

const { Content, Sider } = Layout;
const { Title } = Typography;

function App() {
  const [messageApi, contextHolder] = message.useMessage();
  const [images, setImages] = useState<ImageFile[]>([]);
  const [selectedImage, setSelectedImage] = useState<ImageFile | null>(null);
  const [rectanglesPerImage, setRectanglesPerImage] = useState<Record<string, Rectangle[]>>({});

  // Helper function to get image dimensions from data URL
  const getImageDimensions = (dataUrl: string): Promise<{ width: number; height: number }> => {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.src = dataUrl;
    });
  };

  const loadImages = async () => {
    try {
      const { open } = await import("@tauri-apps/plugin-dialog");
      const { readFile, readDir } = await import("@tauri-apps/plugin-fs");
      
      console.log("Opening folder dialog...");
      const selected = await open({
        directory: true,
        multiple: false,
      });
      
      console.log("Folder dialog result:", selected);

      if (selected && !Array.isArray(selected)) {
        const folderPath = selected;
        console.log("Selected folder:", folderPath);
        
        // Recursively find all image files
        const imageFiles: string[] = [];
        
        const findImagesRecursively = async (dirPath: string): Promise<void> => {
          try {
            const entries = await readDir(dirPath);
            
            for (const entry of entries) {
              const fullPath = `${dirPath}/${entry.name}`;
              
              // Check if it's a directory by trying to read it
              try {
                await readDir(fullPath);
                // If successful, it's a directory, recurse into it
                await findImagesRecursively(fullPath);
              } catch {
                // If failed, it's a file, check if it's an image
                const extension = entry.name.split('.').pop()?.toLowerCase();
                if (extension === 'jpg' || extension === 'jpeg' || extension === 'png') {
                  imageFiles.push(fullPath);
                }
              }
            }
          } catch (error) {
            console.error(`Error reading directory ${dirPath}:`, error);
          }
        };
        
        // Start recursive search
        await findImagesRecursively(folderPath);
        console.log(`Found ${imageFiles.length} image files`);
        
        if (imageFiles.length === 0) {
          message.warning("No image files found in the selected folder");
          return;
        }
        
        // Load all found images
        const imagePromises = imageFiles.map(async (filePath) => {
          try {
            // Read the file using Tauri's file system API
            const fileData = await readFile(filePath);
            
            // Convert to base64 data URL
            const base64 = btoa(String.fromCharCode(...fileData));
            const extension = filePath.split('.').pop()?.toLowerCase() || 'jpg';
            const mimeType = extension === 'png' ? 'image/png' : 'image/jpeg';
            const dataUrl = `data:${mimeType};base64,${base64}`;

            // Get image dimensions
            const dimensions = await getImageDimensions(dataUrl);

            return {
              path: filePath,
              name: filePath.split('/').pop() || 'Unknown',
              data: dataUrl,
              originalWidth: dimensions.width,
              originalHeight: dimensions.height,
            };
          } catch (error) {
            console.error(`Error loading image ${filePath}:`, error);
            return null;
          }
        });

        const loadedImages = (await Promise.all(imagePromises)).filter(
          (img): img is ImageFile => img !== null && img.originalWidth !== undefined && img.originalHeight !== undefined
        );

        // Load existing annotations for each image
        const annotationsPromises = loadedImages.map(async (image) => {
          try {
            console.log(`Attempting to load annotations for: ${image.path}`);
            const rectangles = await loadYOLOAnnotations(
              image.path,
              image.originalWidth,
              image.originalHeight
            );
            console.log(`Loaded ${rectangles.length} rectangles for ${image.path}:`, rectangles);
            return { imagePath: image.path, rectangles };
          } catch (error) {
            console.error(`Error loading annotations for ${image.path}:`, error);
            return { imagePath: image.path, rectangles: [] };
          }
        });

        const annotationsResults = await Promise.all(annotationsPromises);
        
        // Create rectanglesPerImage state
        const initialRectanglesPerImage: Record<string, Rectangle[]> = {};
        annotationsResults.forEach(({ imagePath, rectangles }) => {
          if (rectangles.length > 0) {
            initialRectanglesPerImage[imagePath] = rectangles;
            console.log(`Setting ${rectangles.length} rectangles for ${imagePath}`);
          } else {
            console.log(`No rectangles found for ${imagePath}`);
          }
        });

        console.log("Final rectanglesPerImage state:", initialRectanglesPerImage);

        setImages(loadedImages);
        setRectanglesPerImage(initialRectanglesPerImage);
        
        if (loadedImages.length > 0) {
          setSelectedImage(loadedImages[0]);
        }
        
        const totalAnnotations = Object.values(initialRectanglesPerImage).reduce(
          (sum, rectangles) => sum + rectangles.length, 0
        );
        
        message.success(`Loaded ${loadedImages.length} images and ${totalAnnotations} existing annotations from folder`);

      }
    } catch (error) {
      console.error("Error loading images:", error);
      message.error("Failed to load images");
    }
  };

  const handleRectanglesChange = (newRectangles: Rectangle[]) => {
    if (selectedImage) {
      setRectanglesPerImage(prev => ({
        ...prev,
        [selectedImage.path]: newRectangles
      }));
    }
  };

  const clearAllRectangles = () => {
    if (selectedImage) {
      setRectanglesPerImage(prev => ({
        ...prev,
        [selectedImage.path]: []
      }));
      message.success("All rectangles cleared for this image");
    }
  };

  const clearAllImagesRectangles = () => {
    setRectanglesPerImage({});
    message.success("All rectangles cleared for all images");
  };





  const handleExportAllYOLO = async () => {
    const imagesWithRectangles = images.filter(img => 
      (rectanglesPerImage[img.path] || []).length > 0
    );

    if (imagesWithRectangles.length === 0) {
      message.warning("No images with rectangles to export");
      return;
    }

    try {
      const exports = imagesWithRectangles.map(image => ({
        imagePath: image.path,
        rectangles: rectanglesPerImage[image.path] || [],
        imageWidth: image.originalWidth,
        imageHeight: image.originalHeight,
        classId: 0,
      }));

      const result = await exportAllYOLO(exports);
      
      if (result.successful_exports > 0) {
        
        // Single message for success
        if (result.failed_exports > 0) {
          // Mixed results - show warning
          messageApi.warning(`${result.summary} (${result.successful_exports} successful, ${result.failed_exports} failed)`);
        } else {
          // All successful - show success
          messageApi.success(result.summary);
        }
      } else {
        messageApi.error(result.summary);
      }
    } catch (error) {
      console.error("Error in batch YOLO export:", error);
      messageApi.error('Failed to export YOLO annotations');
    }
  };

  return (
    <>
      {contextHolder}
      <Layout style={{ minHeight: "100vh" }}>
      
      <Layout>
        <Sider
          width={300}
          style={{ background: "#fff" }}
        >
          <div style={{ padding: "16px" }}>
            <Button
              type="primary"
              icon={<FolderOpenOutlined />}
              onClick={loadImages}
              block
              style={{ marginBottom: "16px" }}
            >
              Select Folder
            </Button>
            
            <div
              style={{
                height: "calc(100vh - 120px)",
                overflow: "auto",
                padding: "0 16px",
              }}
            >
              <Row gutter={[8, 8]}>
                {images.map((image, index) => (
                  <Col span={12} key={index}>
                    <div
                      style={{
                        cursor: "pointer",
                        border: selectedImage?.path === image.path ? "2px solid #1890ff" : "1px solid #d9d9d9",
                        borderRadius: "6px",
                        padding: "4px",
                        transition: "all 0.3s",
                        position: "relative",
                      }}
                      onClick={() => setSelectedImage(image)}
                    >
                      <Image
                        src={image.data}
                        alt={image.name}
                        style={{
                          width: "100%",
                          height: "80px",
                          objectFit: "cover",
                          borderRadius: "4px",
                        }}
                        preview={false}
                      />
                      <div
                          style={{
                            fontSize: "12px",
                            textAlign: "center",
                            marginTop: "4px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {image.name}
                        </div>
                      {/* Rectangle count indicator */}
                      {(rectanglesPerImage[image.path] || []).length > 0 && (
                        <div
                          style={{
                            position: "absolute",
                            top: "4px",
                            right: "4px",
                            background: "#52c41a",
                            color: "white",
                            borderRadius: "50%",
                            width: "20px",
                            height: "20px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "10px",
                            fontWeight: "bold",
                          }}
                        >
                          {(rectanglesPerImage[image.path] || []).length}
                        </div>
                      )}
                    </div>
                  </Col>
                ))}
              </Row>
            </div>
          </div>
        </Sider>
        
        <Content style={{ padding: "24px", background: "#f0f2f5" }}>
          {selectedImage ? (
            <div>
              {/* Filename section */}
              <div style={{ 
                display: "flex", 
                alignItems: "center", 
                marginBottom: "12px" 
              }}>
                <Title level={5} style={{ margin: 0, fontSize: "14px", color: "#666" }}>
                  {selectedImage.name}
                </Title>
                {(() => {
                  const currentRectangles = rectanglesPerImage[selectedImage.path] || [];
                  return currentRectangles.length > 0 && (
                    <span className="rectangle-count" style={{ marginLeft: "8px" }}>
                      {currentRectangles.length} rectangle{currentRectangles.length !== 1 ? 's' : ''}
                    </span>
                  );
                })()}
              </div>
              
              {/* Buttons section */}
              <div style={{ 
                display: "flex", 
                justifyContent: "flex-end", 
                marginBottom: "16px" 
              }}>
                <Space>
                  <Button
                    icon={<DeleteOutlined />}
                    onClick={clearAllRectangles}
                    disabled={(rectanglesPerImage[selectedImage.path] || []).length === 0}
                  >
                    Clear This ({rectanglesPerImage[selectedImage.path]?.length || 0})
                  </Button>
                  <Button
                    icon={<DeleteOutlined />}
                    onClick={clearAllImagesRectangles}
                    disabled={Object.keys(rectanglesPerImage).length === 0}
                  >
                    Clear All Images
                  </Button>

                  <Button
                    type="primary"
                    icon={<DownloadOutlined />}
                    onClick={handleExportAllYOLO}
                    disabled={Object.keys(rectanglesPerImage).length === 0}
                  >
                    Export YOLO
                  </Button>
                </Space>
              </div>
              <ImageCanvas
                imageSrc={selectedImage.data}
                imageName={selectedImage.name}
                rectangles={rectanglesPerImage[selectedImage.path] || []}
                onRectanglesChange={handleRectanglesChange}
                originalWidth={selectedImage.originalWidth}
                originalHeight={selectedImage.originalHeight}
              />
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "calc(100vh - 200px)",
                color: "#999",
              }}
            >
              <FolderOpenOutlined style={{ fontSize: "64px", marginBottom: "16px" }} />
              <Title level={3} type="secondary">
                No Image Selected
              </Title>
              <p>Select a folder to load images</p>
            </div>
          )}
        </Content>
      </Layout>
    </Layout>
    </>
  );
}

export default App;

