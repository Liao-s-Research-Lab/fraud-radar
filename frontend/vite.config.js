/*import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  
})

*/
// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host:'0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:3000', // Next.js 服務器地址
        changeOrigin: true,
      }
    },
  },
});

