import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  base: '/ToWhereOnline/',
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      cesium: 'cesium',
    },
  },
  define: {
    CESIUM_BASE_URL: JSON.stringify('/cesium/'),
  },
  optimizeDeps: {
    include: ['cesium', 'resium'],
  },
}); 