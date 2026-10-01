import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { themeScript } from "@g4ai/ds/lib/theme";

// Aplica o tema salvo antes da primeira pintura (sem piscar).
const dsTheme = {
  name: "ds-theme",
  transformIndexHtml: () => [{ tag: "script", children: themeScript, injectTo: "head-prepend" as const }],
};

export default defineConfig({ plugins: [react(), tailwindcss(), dsTheme] });
