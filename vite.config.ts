import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Allow external connections
    port: 5173, // Default Vite port
    allowedHosts: [
      'your-wealth-coach.replit.app',
      '.replit.app', // Allow all Replit subdomains
      'localhost',
      '127.0.0.1'
    ]
  },
  preview: {
    host: true,
    port: 4173,
    allowedHosts: [
      'your-wealth-coach.replit.app',
      '.replit.app', // Allow all Replit subdomains
      'localhost',
      '127.0.0.1'
    ]
  }
})
