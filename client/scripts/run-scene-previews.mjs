/**
 * Bundles render-scene-previews.jsx with esbuild (JSX + the scenes.css
 * import need transforming) and runs it in-process.
 */
import { build } from 'esbuild';
import { writeFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const outfile = join(here, '.render-scene-previews.bundle.mjs');

await build({
  entryPoints: [join(here, 'render-scene-previews.jsx')],
  bundle: true,
  format: 'esm',
  platform: 'node',
  outfile,
  jsx: 'automatic',
  loader: { '.css': 'empty' },
  external: ['react', 'react-dom', '@resvg/resvg-js', 'react-i18next'],
});

try {
  await import(pathToFileURL(outfile).href);
} finally {
  rmSync(outfile, { force: true });
}
