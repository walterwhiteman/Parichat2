// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    // Excludes lucide-react from Vite's dependency pre-bundling during dev server startup.
    // This typically helps with dev server issues, not directly the production build error.
    exclude: ['lucide-react'],
  },
  build: {
    // Targets a specific ECMAScript version for the output,
    // which can help with compatibility and initialization order issues in production.
    target: 'es2020',
    esbuild: {
      // Disables the generation of legal comments (like license headers) in the output.
      // This is a more aggressive optimization that sometimes resolves obscure bundling issues.
      legalComments: 'none',
    },
    rollupOptions: {
      output: {
        // Sets Rollup's output to be less strict about certain JavaScript behaviors.
        // This is a troubleshooting step for very persistent bundling errors with complex libraries.
        strict: false,
      },
    },
  },
});
