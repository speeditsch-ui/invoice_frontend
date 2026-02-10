import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { copyFileSync } from "fs";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      // Copy the pdf.js worker as a .js file so nginx serves it with the
      // correct application/javascript MIME type without extra config.
      name: "copy-pdf-worker",
      writeBundle(options) {
        const outDir = options.dir || "dist";
        // Use the pdfjs-dist version bundled with react-pdf to ensure version match
        const src = path.resolve(
          "node_modules/react-pdf/node_modules/pdfjs-dist/build/pdf.worker.min.mjs"
        );
        const dest = path.resolve(outDir, "pdf.worker.min.js");
        copyFileSync(src, dest);
      },
    },
  ],
  server: {
    // Proxy API requests to backend in development
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
});
