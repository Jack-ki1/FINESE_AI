import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          // Keep these lazy: only ever dynamically imported, must stay split.
          if (id.includes("@duckdb") || id.includes("pyodide")) return;
          if (id.includes("recharts") || id.includes("d3-")) return "vendor-charts";
          if (id.includes("react-router")) return "vendor-router";
          if (id.includes("xlsx")) return "vendor-xlsx";
          if (id.includes("@supabase")) return "vendor-supabase";
          if (id.includes("/react-dom/") || id.includes("/react/") || id.includes("/scheduler/")) return "vendor-react";
          if (id.includes("@radix-ui") || id.includes("cmdk") || id.includes("vaul") || id.includes("embla-carousel") || id.includes("input-otp")) return "vendor-ui";
          if (id.includes("papaparse") || id.includes("date-fns") || id.includes("react-markdown") || id.includes("react-hook-form") || id.includes("lucide-react")) return "vendor-libs";
          return "vendor";
        },
      },
    },
  },
}));
