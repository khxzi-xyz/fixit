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
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Core React runtime
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/scheduler')) {
            return 'react-vendor';
          }
          // Radix UI + shadcn components
          if (id.includes('@radix-ui') || id.includes('cmdk') || id.includes('vaul') || id.includes('react-hook-form') || id.includes('@hookform')) {
            return 'ui-vendor';
          }
          // Capacitor native plugins
          if (id.includes('@capacitor') || id.includes('capacitor-native-biometric') || id.includes('@capgo') || id.includes('@capawesome')) {
            return 'capacitor-plugins';
          }
          // Supabase + tanstack query
          if (id.includes('@supabase') || id.includes('@tanstack')) {
            return 'data-layer';
          }
          // Lucide icons
          if (id.includes('lucide-react')) {
            return 'icons';
          }
          // Date utilities
          if (id.includes('date-fns') || id.includes('wouter') || id.includes('zod')) {
            return 'utils-vendor';
          }
        }
      }
    }
  }
});

