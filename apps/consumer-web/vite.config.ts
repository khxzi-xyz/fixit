import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  base: "/",
  plugins: [
    react()
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
    },
    dedupe: ["react", "react-dom"],
  },
  server: {
    port: 8082,
    strictPort: false,
    host: "0.0.0.0",
    allowedHosts: true,
    proxy: {
      "/api": {
        target: "https://backend.fixit-now.xyz",
        changeOrigin: true,
      },
    },
    watch: {
      ignored: ['**/android/**'],
    },
  },
  preview: {
    port: 8082,
    host: "0.0.0.0",
  },
});
