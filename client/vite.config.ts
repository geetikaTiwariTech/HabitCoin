import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

import path from "path";


export default defineConfig({
  plugins: [
    react()
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@shared": path.resolve(__dirname, "../shared"),
      "@assets": path.resolve(__dirname, "../attached_assets"),
    },
  },
  root: ".", // already inside client folder, so . is correct
  build: {
    outDir: "dist", // defaults to client/dist
    emptyOutDir: true,
    target: 'esnext',  // Ensures that esbuild knows to handle ESM syntax
    esbuild: {
      loader: 'ts',  // Specify loader type (TS in this case)
      target: 'esnext', // Ensure compatibility with ESM
    },
    commonjsOptions: {
        include: [/node_modules/],
    },
  },
});
