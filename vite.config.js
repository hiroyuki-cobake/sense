// vite.config.js
import { defineConfig } from "vite";

export default defineConfig({
  root: "public",
  base: "/",

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
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: "./public/index.html",
        transactions: "./public/legal/transactions.html",
        terms: "./public/legal/terms_of_service.html",
        privacy: "./public/legal/privacy_policy.html"
      }
    }
  }
});
