import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import wails from "@wailsio/runtime/plugins/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), wails("./bindings")],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Split heavy vendor code out of the main chunk for faster initial load.
        manualChunks(id) {
          if (!id.includes("node_modules")) {
            return undefined;
          }
          if (id.includes("@babylonjs") || id.includes("ktx")) {
            return "ktx2";
          }
          if (id.includes("@radix-ui")) {
            return "radix";
          }
          if (id.includes("jszip")) {
            return "jszip";
          }
          return undefined;
        },
      },
    },
  },
});
