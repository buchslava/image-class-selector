import { useState } from "react";
import { Layout, Button, Image, Row, Col, Typography, message, Space, Upload } from "antd";
import { FolderOpenOutlined, DeleteOutlined, DownloadOutlined, UploadOutlined } from "@ant-design/icons";
import ImageCanvas from "./components/ImageCanvas";
import { ImageFile, Rectangle, ExportData } from "./types";
import "./App.css";

// Check if we're running in Tauri environment
const isTauri = typeof window !== 'undefined' && window.__TAURI__;

const { Header, Content, Sider } = Layout;
const { Title } = Typography;

function App() {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [selectedImage, setSelectedImage] = useState<ImageFile | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [rectanglesPerImage, setRectanglesPerImage] = useState<Record<string, Rectangle[]>>({});

  const loadImages = async () => {
    if (isTauri) {
      // Tauri environment - use native file dialog
      try {
        const { open } = await import("@tauri-apps/plugin-dialog");
        const { readFile } = await import("@tauri-apps/plugin-fs");
        
        console.log("Opening file dialog...");
        const selected = await open({
          multiple: true,
          filters: [
            {
              name: "Images",
              extensions: ["jpg", "jpeg", "png"],
            },
          ],
        });
        
        console.log("File dialog result:", selected);

        if (selected && Array.isArray(selected)) {
          const imagePromises = selected.map(async (filePath) => {
            try {
              // Read the file using Tauri's file system API
              const fileData = await readFile(filePath);
              
              // Convert to base64 data URL
              const base64 = btoa(String.fromCharCode(...fileData));
              const extension = filePath.split('.').pop()?.toLowerCase() || 'jpg';
              const mimeType = extension === 'png' ? 'image/png' : 'image/jpeg';
              const dataUrl = `data:${mimeType};base64,${base64}`;

              return {
                path: filePath,
                name: filePath.split('/').pop() || 'Unknown',
                data: dataUrl,
              };
            } catch (error) {
              console.error(`Error loading image ${filePath}:`, error);
              return null;
            }
          });

          const loadedImages = (await Promise.all(imagePromises)).filter(
            (img): img is ImageFile => img !== null
          );

          setImages(loadedImages);
          if (loadedImages.length > 0) {
            setSelectedImage(loadedImages[0]);
          }
          message.success(`Loaded ${loadedImages.length} images`);
        }
      } catch (error) {
        console.error("Error loading images:", error);
        message.error("Failed to load images");
      }
    } else {
      // Web environment - show message to use file input
      message.info("Please use the file input below to select images for web testing");
    }
  };

  const handleFileUpload = (info: any) => {
    const { fileList } = info;
    
    if (fileList.length > 0) {
      const imagePromises = fileList.map(async (file: any) => {
        return new Promise<ImageFile>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            resolve({
              path: file.name,
              name: file.name,
              data: e.target?.result as string,
            });
          };
          reader.readAsDataURL(file.originFileObj);
        });
      });

      Promise.all(imagePromises).then((loadedImages) => {
        setImages(loadedImages);
        if (loadedImages.length > 0) {
          setSelectedImage(loadedImages[0]);
        }
        message.success(`Loaded ${loadedImages.length} images`);
      });
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

  const exportRectangles = () => {
    const currentRectangles = selectedImage ? rectanglesPerImage[selectedImage.path] || [] : [];
    
    if (currentRectangles.length === 0) {
      message.warning("No rectangles to export");
      return;
    }

    const exportData: ExportData = {
      imageName: selectedImage?.name || "unknown",
      imagePath: selectedImage?.path || "",
      rectangles: currentRectangles,
      exportDate: new Date().toISOString(),
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement("a");
    link.href = url;
    link.download = `${selectedImage?.name || "rectangles"}_annotations.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    message.success("Rectangles exported successfully");
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header style={{ display: "flex", alignItems: "center", background: "#001529" }}>
        <Title level={3} style={{ color: "white", margin: 0 }}>
          Image Class Selector
        </Title>
      </Header>
      
      <Layout>
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
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
              {isTauri ? "Load Images" : "Load Images (Desktop Only)"}
            </Button>
            
            {!isTauri && (
              <Upload
                multiple
                accept="image/*"
                showUploadList={false}
                beforeUpload={() => false}
                onChange={handleFileUpload}
                style={{ width: "100%" }}
              >
                <Button
                  icon={<UploadOutlined />}
                  block
                  style={{ marginBottom: "16px" }}
                >
                  Upload Images (Web)
                </Button>
              </Upload>
            )}
          </div>
          
          <div
            style={{
              height: "calc(100vh - 120px)",
              overflow: "auto",
              padding: "0 16px",
            }}
          >
            <Row gutter={[8, 8]}>
              {images.map((image, index) => (
                <Col span={collapsed ? 24 : 12} key={index}>
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
                        height: collapsed ? "60px" : "80px",
                        objectFit: "cover",
                        borderRadius: "4px",
                      }}
                      preview={false}
                    />
                    {!collapsed && (
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
                    )}
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
        </Sider>
        
        <Content style={{ padding: "24px", background: "#f0f2f5" }}>
          {selectedImage ? (
            <div>
              <div style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center", 
                marginBottom: "16px" 
              }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <Title level={4} style={{ margin: 0 }}>
                    {selectedImage.name}
                  </Title>
                  {(() => {
                    const currentRectangles = rectanglesPerImage[selectedImage.path] || [];
                    return currentRectangles.length > 0 && (
                      <span className="rectangle-count">
                        {currentRectangles.length} rectangle{currentRectangles.length !== 1 ? 's' : ''}
                      </span>
                    );
                  })()}
                </div>
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
                    onClick={exportRectangles}
                    disabled={(rectanglesPerImage[selectedImage.path] || []).length === 0}
                  >
                    Export
                  </Button>
                </Space>
              </div>
              <ImageCanvas
                imageSrc={selectedImage.data}
                imageName={selectedImage.name}
                rectangles={rectanglesPerImage[selectedImage.path] || []}
                onRectanglesChange={handleRectanglesChange}
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
              <p>Load some images to get started</p>
            </div>
          )}
        </Content>
      </Layout>
    </Layout>
  );
}

export default App;
