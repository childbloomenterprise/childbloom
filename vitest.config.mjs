// Root-level Vitest config for the serverless API (api/**).
// The client has its own runner (client/vite.config.js → `cd client && npm test`);
// this one covers the Node/ESM backend helpers. `.mjs` so it loads as ESM
// regardless of the root package.json "type".
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['api/**/*.test.js'],
    globals: true,
  },
});
