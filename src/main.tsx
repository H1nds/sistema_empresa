import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { AppRouter } from "./routes/AppRouter";
import { Toaster } from 'sonner';
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <DndProvider backend={HTML5Backend}>
            <AppRouter />
        </DndProvider>
    <Toaster richColors position="top-right" />
  </React.StrictMode>
);