import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.js'],
    hookTimeout: 180000,
    testTimeout: 30000,
    // One in-memory replica set shared per file; parallel files fight over it.
    fileParallelism: false,
    server: {
      // The app is CommonJS: let Node require it so models compile exactly once.
      deps: { external: [/src\//, /node_modules/] },
    },
  },
});
