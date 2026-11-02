import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  server: { port: 5173, strictPort: true, watch: { ignored: ["**/android/**", "**/ios/**"] } },
  build: {
    outDir: "dist",
    sourcemap: false,
    target: "es2022",
    rollupOptions: {
      output: {
        manualChunks: {
          fabric: ["fabric"],
          react: ["react", "react-dom", "react-router-dom"],
        },
      },
    },
  },
});