import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  base: "/",
  plugins: [
    react(),
    tailwindcss()
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
    },
    dedupe: ["react", "react-dom"],
  },
  server: {
    port: 8084,
    strictPort: false,
    host: "0.0.0.0",
    allowedHosts: true,
    proxy: {
      "/api": {
        target: "https://backend.fixit-now.xyz",
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 8084,
    host: "0.0.0.0",
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/scheduler')) {
            return 'react-vendor';
          }
          if (id.includes('@radix-ui') || id.includes('cmdk') || id.includes('vaul') || id.includes('react-hook-form') || id.includes('@hookform')) {
            return 'ui-vendor';
          }
          if (id.includes('@capacitor') || id.includes('capacitor-native-biometric') || id.includes('@capgo') || id.includes('@capawesome')) {
            return 'capacitor-plugins';
          }
          if (id.includes('@supabase') || id.includes('@tanstack')) {
            return 'data-layer';
          }
          if (id.includes('lucide-react')) {
            return 'icons';
          }
          if (id.includes('date-fns') || id.includes('wouter') || id.includes('zod')) {
            return 'utils-vendor';
          }
        }
      }
    }
  }
});
