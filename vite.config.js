// vite.config.js
import { defineConfig } from "vite";

export default defineConfig({
  root: "public",
  base: "/sense/",

  server: {
    host: true,
    port: 3000,
    strictPort: true,
  },

  preview: {
    host: true,
    port: 3000,
    strictPort: true,
  },

  build: {
    outDir: "../docs",
    emptyOutDir: true,
    rollupOptions: {
      input: "./public/index.html"
    }
  },
});
