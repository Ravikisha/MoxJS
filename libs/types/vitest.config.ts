import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // *.types.test.ts files are compile-time checks run via tsc --noEmit, not vitest.
    exclude: ['**/node_modules/**', '**/dist/**', '**/*.types.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: ['**/dist/**', '**/node_modules/**', '**/*.types.test.ts'],
    },
  },
});
