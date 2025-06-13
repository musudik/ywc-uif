import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Replit assigns PORT automatically — use that.
const PORT = (process as any).env.PORT || 3000;

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0", // Required for public access
    port: PORT, // Use Replit-assigned or fallback port
    strictPort: true, // Fail fast if port is taken
  },
  preview: {
    host: "0.0.0.0",
    port: PORT,
    strictPort: true,
    allowedHosts: ["your-wealth-coach.replit.app"],
  },
});
