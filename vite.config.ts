import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Replit assigns PORT automatically — use that.
const PORT = (process as any).env.PORT || 5173;

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0", // Required for public access
    port: PORT, // Use Replit-assigned or fallback port
    strictPort: true, // Fail fast if port is taken
    proxy: {
      '/api': {
        target: 'https://ywc-api.replit.app',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api'),
        secure: true,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('Proxy error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
        },
      },
    },
  },
  preview: {
    host: "0.0.0.0",
    port: PORT,
    strictPort: true,
    allowedHosts: ["your-wealth-coach.replit.app"],
    proxy: {
      '/api': {
        target: 'https://ywc-api.replit.app',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api'),
        secure: true,
      },
    },
  },
});
