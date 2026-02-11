import { defineConfig } from "vite";

export default defineConfig({
  root: "public",
  base: "/sense/", // ← GitHub Pages用（超重要）

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
    outDir: "../docs",   // ← publicの外にdocsを作る
    emptyOutDir: true,
  },
});
