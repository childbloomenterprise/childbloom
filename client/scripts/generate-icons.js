/**
 * ChildBloom Icon Generator
 * Converts favicon.svg into all required PNG sizes for PWA + Play Store.
 * Run: node scripts/generate-icons.js
 */

import sharp from 'sharp';
import { readFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = join(__dirname, '..', 'public');
const SVG_PATH = join(PUBLIC_DIR, 'favicon.svg');

const svgBuffer = readFileSync(SVG_PATH);

// Standard icon sizes
const SIZES = [48, 72, 96, 144, 192, 512];

// Maskable icon: icon fills 60% of canvas (20% safe zone on each side)
// Background: teal #1D9E75
async function generateMaskable(size, svgBuf) {
  const innerSize = Math.round(size * 0.6);
  const padding = Math.round(size * 0.2);

  // Resize SVG to inner size
  const iconBuffer = await sharp(svgBuf)
    .resize(innerSize, innerSize)
    .png()
    .toBuffer();

  // Composite onto teal background
  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 29, g: 158, b: 117, alpha: 1 }, // #1D9E75
    },
  })
    .composite([{ input: iconBuffer, left: padding, top: padding }])
    .png()
    .toBuffer();
}

async function main() {
  mkdirSync(PUBLIC_DIR, { recursive: true });

  for (const size of SIZES) {
    const filename = `logo${size}.png`;
    const outPath = join(PUBLIC_DIR, filename);

    // Maskable for 192 and 512 (used by Android)
    if (size === 192 || size === 512) {
      const buf = await generateMaskable(size, svgBuffer);
      await sharp(buf).toFile(outPath);
      console.log(`✓ ${filename} (maskable)`);
    } else {
      await sharp(svgBuffer).resize(size, size).png().toFile(outPath);
      console.log(`✓ ${filename}`);
    }
  }

  // Apple touch icon (180x180, plain resize — iOS ignores maskable)
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(join(PUBLIC_DIR, 'apple-touch-icon.png'));
  console.log('✓ apple-touch-icon.png (180x180)');

  console.log('\nAll icons generated successfully in client/public/');
}

main().catch((err) => {
  console.error('Icon generation failed:', err.message);
  process.exit(1);
});
