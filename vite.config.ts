import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Bind to all interfaces for Replit
    port: 5173,
    allowedHosts: [
      'your-wealth-coach.replit.app',
      '.replit.app', // Allow all Replit subdomains
      'localhost',
      '127.0.0.1'
    ]
  },
  preview: {
    host: '0.0.0.0', // Bind to all interfaces for Replit deployment
    port: 5173, // Use same port for consistency
    allowedHosts: [
      'your-wealth-coach.replit.app',
      '.replit.app', // Allow all Replit subdomains
      'localhost',
      '127.0.0.1'
    ]
  }
})
