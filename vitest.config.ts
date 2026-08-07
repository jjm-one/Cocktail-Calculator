import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Vite 8's new default oxc transform has a tsconfig "references" resolution
  // bug that only surfaces on a clean install (it walks up to the solution-
  // style root tsconfig.json and fails to load a referenced project). Fall
  // back to the battle-tested esbuild transform to avoid it.
  oxc: false,
  define: {
    __APP_VERSION__: JSON.stringify('test'),
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
