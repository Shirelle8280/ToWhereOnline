import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? '/ToWhereOnline/' : '/',
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      cesium: 'cesium',
    },
  },
  define: {
    CESIUM_BASE_URL: JSON.stringify(command === 'build' ? '/ToWhereOnline/cesium/' : '/cesium/'),
  },
  optimizeDeps: {
    include: ['cesium', 'resium'],
  },
})); 