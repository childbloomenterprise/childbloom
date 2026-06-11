/**
 * Headless scene previewer — renders every SCENES entry to a PNG so
 * artwork can be reviewed without a browser. Static render = each
 * scene's 0% key pose (by design the teaching pose).
 *
 * Run: node scripts/run-scene-previews.mjs   (bundles this via esbuild)
 * Output: scene-previews/<scene-id>.png
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import { SCENES } from '../src/features/emergency/components/scenes/index.js';

const OUT = join(process.cwd(), 'scene-previews');
mkdirSync(OUT, { recursive: true });

// Mirror SceneStage's backdrop + zoom so previews match the app.
function stageWrap(childMarkup, zoom = 1.22, accent = '#DC2626') {
  const tx = 220 - 220 * zoom;
  const ty = 256 - 256 * zoom;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 440 320" width="660" height="480" style="--accent:${accent};--spd:1">
  <rect width="440" height="320" fill="#F6EFE4"/>
  <rect y="236" width="440" height="14" fill="#CDB99E" opacity="0.25"/>
  <rect y="250" width="440" height="70" fill="#E5D6C0"/>
  <ellipse cx="220" cy="260" rx="190" ry="26" fill="#FFF8EC" opacity="0.6"/>
  <g transform="translate(${tx},${ty}) scale(${zoom})">${childMarkup}</g>
</svg>`;
}

let done = 0;
const failed = [];
for (const [id, entry] of Object.entries(SCENES)) {
  try {
    const inner = renderToStaticMarkup(createElement(entry.Component, entry.props || {}));
    // resvg has no CSS var support — bake the accent in
    const svg = stageWrap(inner, entry.zoom ?? 1.22).replaceAll('var(--accent)', '#DC2626');
    const png = new Resvg(svg, { fitTo: { mode: 'width', value: 660 } }).render().asPng();
    writeFileSync(join(OUT, `${id.replace(/[^a-z0-9.-]/gi, '_')}.png`), png);
    done++;
  } catch (err) {
    failed.push(`${id}: ${err.message}`);
  }
}
console.log(`rendered ${done}/${Object.keys(SCENES).length} scenes to scene-previews/`);
if (failed.length) { console.error(failed.join('\n')); process.exit(1); }
