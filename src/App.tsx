import { useState } from "react";
import { Layout, Button, Image, Row, Col, Typography, message } from "antd";
import { FolderOpenOutlined } from "@ant-design/icons";
import { open } from "@tauri-apps/plugin-dialog";
import { readFile } from "@tauri-apps/plugin-fs";
import "./App.css";

const { Header, Content, Sider } = Layout;
const { Title } = Typography;

interface ImageFile {
  path: string;
  name: string;
  data: string; // base64 data URL
}

function App() {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [selectedImage, setSelectedImage] = useState<ImageFile | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  const loadImages = async () => {
    console.log("Load Images button clicked");
    try {
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
              Load Images
            </Button>
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
                  </div>
                </Col>
              ))}
            </Row>
          </div>
        </Sider>
        
        <Content style={{ padding: "24px", background: "#f0f2f5" }}>
          {selectedImage ? (
            <div style={{ textAlign: "center" }}>
              <Title level={4}>{selectedImage.name}</Title>
              <Image
                src={selectedImage.data}
                alt={selectedImage.name}
                style={{
                  maxWidth: "100%",
                  maxHeight: "calc(100vh - 200px)",
                  objectFit: "contain",
                }}
                preview={{
                  mask: "Click to preview",
                }}
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
