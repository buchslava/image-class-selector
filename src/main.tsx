import React from "react";
import ReactDOM from "react-dom/client";
import { App as AntApp } from "antd";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <AntApp
      notification={{
        placement: 'topRight',
        duration: 4,
      }}
    >
      <App />
    </AntApp>
  </React.StrictMode>,
);
