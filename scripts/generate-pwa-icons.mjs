// Generates the Cornerstone PWA icons from a branded SVG using sharp.
//   node scripts/generate-pwa-icons.mjs
// Outputs to public/: icon-192.png, icon-512.png, icon-maskable.png, apple-icon.png
// Brand: teal #119488 mark with a white "C" (matches the sidebar logo) + amber accent.
import sharp from "sharp";
import { mkdirSync } from "node:fs";

const OUT = new URL("../public/", import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

// rounded: rounded-square corners (purpose "any"); false = full-bleed for maskable/apple.
// scale: foreground scale (maskable/apple need a safe-zone margin).
function svg({ rounded, scale = 1 }) {
  const r = rounded ? 112 : 0;
  const fg = `
    <g transform="translate(256 256) scale(${scale}) translate(-256 -256)">
      <text x="256" y="372" font-family="Helvetica, Arial, sans-serif" font-size="340"
            font-weight="700" fill="#ffffff" text-anchor="middle">C</text>
      <circle cx="372" cy="168" r="30" fill="#eaba3f"/>
    </g>`;
  return `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="0.35" y2="1">
        <stop offset="0" stop-color="#16a899"/>
        <stop offset="1" stop-color="#0b6f66"/>
      </linearGradient>
    </defs>
    <rect x="0" y="0" width="512" height="512" rx="${r}" fill="url(#g)"/>
    ${fg}
  </svg>`;
}

async function render(svgStr, size, file) {
  await sharp(Buffer.from(svgStr)).resize(size, size).png().toFile(OUT + file);
  console.log("wrote", file, size);
}

await render(svg({ rounded: true }), 192, "icon-192.png");
await render(svg({ rounded: true }), 512, "icon-512.png");
await render(svg({ rounded: false, scale: 0.78 }), 512, "icon-maskable.png"); // safe zone for OS masks
await render(svg({ rounded: false, scale: 0.86 }), 180, "apple-icon.png");    // iOS rounds it itself
console.log("done");
