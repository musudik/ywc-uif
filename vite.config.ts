import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0", // Binds to all interfaces
    port: 5173,
    proxy: {
      "/api": {
        target: "https://ywc-api.replit.app/api",
        changeOrigin: true,
        secure: false,
      },
    },
    allowedHosts: [".replit.app", "localhost", "127.0.0.1"],
  },
  preview: {
    host: "0.0.0.0",
    port: 5173,
    proxy: {
      "/api": {
        target: "https://ywc-api.replit.app/api",
        changeOrigin: true,
        secure: false,
      },
    },
    allowedHosts: [".replit.app", "localhost", "127.0.0.1"],
  },
});
