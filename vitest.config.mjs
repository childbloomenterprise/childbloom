// Root-level Vitest config for the serverless API (api/**).
// The client has its own runner (client/vite.config.js → `cd client && npm test`);
// this one covers the Node/ESM backend helpers. `.mjs` so it loads as ESM
// regardless of the root package.json "type".
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    // Tests live OUTSIDE api/ so Vercel's function counter never sees them.
    include: ['api-tests/**/*.test.js'],
    globals: true,
  },
});
