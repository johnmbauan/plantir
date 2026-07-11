import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    globals: false,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    pool: 'forks',
    restoreMocks: true,
  coverage: {
    enabled: true,
    provider: 'v8',
    include: ['src/**/*.{ts,tsx}'],
    exclude: [
      'src/**/*.d.ts',
      'src/main.tsx',
      'src/supabase.ts',
      'src/types.ts',
      'src/**/types.ts',
      'src/assets/**',
      'src/test/**',
    ],
    thresholds: { lines: 95, functions: 95 },
  },
  },
});
