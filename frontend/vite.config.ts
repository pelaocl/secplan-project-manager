import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173, // Default frontend dev port
    // Proxy API requests to backend to avoid CORS issues during development
    // Use this if VITE_API_BASE_URL is set to "/api"
    proxy: {
      '/api': {
        target: 'http://localhost:5000', // Your backend server address
        changeOrigin: true,
        // secure: false, // Uncomment if backend uses self-signed certificate
        // rewrite: (path) => path.replace(/^\/api/, ''), // Uncomment if backend doesn't expect /api prefix
      },
    },
  },
});