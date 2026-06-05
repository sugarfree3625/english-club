import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
      '/socket.io': { target: 'http://localhost:3000', ws: true }
    }
  },
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/vue') || id.includes('node_modules/vue-router') || id.includes('node_modules/axios')) return 'vendor';
          if (id.includes('node_modules/lucide') || id.includes('node_modules/animejs')) return 'ui';
          if (id.includes('node_modules/quill')) return 'editor';
          if (id.includes('node_modules/@fullcalendar')) return 'calendar';
          if (id.includes('node_modules/@supabase')) return 'supabase';
          if (id.includes('node_modules/three')) return 'three';
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
});
