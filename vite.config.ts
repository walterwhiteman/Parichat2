// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // You can keep exclude for lucide-react if it helps your dev server,
  // but the build.target is key for your current error.
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    // This is the crucial line for your production build error
    target: 'es2020',
  },
});
