import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['backend/tests/**/*.test.js'],
    setupFiles: ['backend/tests/setup.js'],
    globalSetup: ['backend/tests/globalSetup.js'],
    // Tests share a single SQLite file; run files serially to avoid write contention.
    fileParallelism: false,
  },
});
