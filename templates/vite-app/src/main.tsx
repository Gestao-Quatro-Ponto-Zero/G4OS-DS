import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Toaster } from "@g4ai/ds";
import { App } from "./App";
import { setupLinks } from "./router";
import "./index.css";

setupLinks();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
    <Toaster />
  </StrictMode>,
);
