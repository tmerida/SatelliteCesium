import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';
import vuetify from 'vite-plugin-vuetify';

export default defineConfig({
  plugins: [vue(),vuetify({ autoImport: true })],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    fs: {
      allow: [path.resolve(__dirname, 'src'), path.resolve(__dirname, 'node_modules')],
    },
  },
  define: {
    CESIUM_BASE_URL: JSON.stringify('/cesium'), // Set the base URL for Cesium assets
  },
});