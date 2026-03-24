import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;

          if (id.includes('/react/') || id.includes('/react-dom/')) {
            return 'react-vendor';
          }

          if (id.includes('/leaflet/') || id.includes('/react-leaflet/')) {
            return 'map-vendor';
          }

          if (
            id.includes('/framer-motion/') ||
            id.includes('/lucide-react/') ||
            id.includes('/react-hot-toast/') ||
            id.includes('/recharts/')
          ) {
            return 'ui-vendor';
          }

          if (
            id.includes('/axios/') ||
            id.includes('/socket.io-client/') ||
            id.includes('/date-fns/')
          ) {
            return 'network-vendor';
          }
        },
      },
    },
  },
  server: {
    host: '0.0.0.0',
    port: 3001
  }
});
