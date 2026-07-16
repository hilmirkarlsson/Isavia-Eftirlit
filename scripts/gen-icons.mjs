// Býr til einföld PWA forritstákn (192x192, 512x512, og maskable útgáfu)
// án utanaðkomandi pakka – teiknar beint á pixlagrind og kóðar sjálft í PNG.
// Keyrt einu sinni (npm run gen:icons) – úttak fer í public/icons/.

import { deflateSync } from "zlib";
import { writeFileSync, mkdirSync } from "fs";

const BRAND = [0, 85, 149]; // #005595
const BRAND_DARK = [0, 49, 92];
const SKY = [95, 176, 220];
const GREEN = [34, 197, 94];
const WHITE = [255, 255, 255];

function crc32(buf) {
  let table = crc32.table;
  if (!table) {
    table = crc32.table = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c;
    }
  }
  let crc = -1;
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function encodePng(width, height, getPixel) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const raw = Buffer.alloc((width * 4 + 1) * height);
  let off = 0;
  for (let y = 0; y < height; y++) {
    raw[off++] = 0; // no filter
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = getPixel(x, y);
      raw[off++] = r;
      raw[off++] = g;
      raw[off++] = b;
      raw[off++] = a;
    }
  }
  const idat = deflateSync(raw);

  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function lerp(a, b, t) {
  return Math.round(a + (b - a) * t);
}

function blend(a, b, t) {
  return [
    lerp(a[0], b[0], t),
    lerp(a[1], b[1], t),
    lerp(a[2], b[2], t),
    lerp(a[3] ?? 255, b[3] ?? 255, t),
  ];
}

function pointInPoly(x, y, pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const xi = pts[i][0];
    const yi = pts[i][1];
    const xj = pts[j][0];
    const yj = pts[j][1];
    const hit = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (hit) inside = !inside;
  }
  return inside;
}

function distToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  const t = lenSq === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq));
  const x = ax + t * dx;
  const y = ay + t * dy;
  return Math.hypot(px - x, py - y);
}

function inRoundedRect(x, y, left, top, right, bottom, radius) {
  const cx = Math.max(left + radius, Math.min(x, right - radius));
  const cy = Math.max(top + radius, Math.min(y, bottom - radius));
  return Math.hypot(x - cx, y - cy) <= radius;
}

// Airport/security mark: blue tile, white shield, runway stripe and radar sweep.
// Still generated in pure JS so all PWA icon sizes stay consistent.
function makeIcon(size, { maskable = false } = {}) {
  const safe = maskable ? size * 0.18 : size * 0.12;
  const cx = size / 2;
  const shieldTop = safe;
  const shieldBottom = size - safe * 0.74;
  const shield = [
    [cx, shieldTop],
    [size - safe, shieldTop + size * 0.13],
    [size - safe * 1.32, shieldBottom - size * 0.22],
    [cx, shieldBottom],
    [safe * 1.32, shieldBottom - size * 0.22],
    [safe, shieldTop + size * 0.13],
  ];

  return encodePng(size, size, (x, y) => {
    const t = Math.min(1, Math.max(0, (x + y) / (size * 1.75)));
    let color = blend([...SKY, 255], [...BRAND, 255], 0.42 + t * 0.42);

    const glow = Math.max(0, 1 - Math.hypot(x - size * 0.2, y - size * 0.14) / (size * 0.75));
    if (glow > 0) color = blend(color, [...WHITE, 255], glow * 0.1);

    if (pointInPoly(x, y, shield)) color = [...WHITE, 255];

    const runway = [
      [cx - size * 0.105, shieldTop + size * 0.24],
      [cx + size * 0.105, shieldTop + size * 0.24],
      [cx + size * 0.038, shieldBottom - size * 0.13],
      [cx - size * 0.038, shieldBottom - size * 0.13],
    ];
    if (pointInPoly(x, y, runway)) color = [...BRAND_DARK, 255];

    const stripeW = Math.max(1.3, size * 0.012);
    const stripeH = size * 0.058;
    for (const yy of [0.38, 0.51, 0.64]) {
      if (
        Math.abs(x - cx) <= stripeW &&
        y >= shieldTop + size * yy &&
        y <= shieldTop + size * yy + stripeH
      ) {
        color = [...WHITE, 255];
      }
    }

    const radarCx = cx + size * 0.17;
    const radarCy = shieldTop + size * 0.31;
    const radarR = size * 0.095;
    const dRadar = Math.hypot(x - radarCx, y - radarCy);
    if (dRadar <= radarR && dRadar >= radarR * 0.72) color = [...GREEN, 255];
    if (distToSegment(x, y, radarCx, radarCy, radarCx + radarR * 0.92, radarCy - radarR * 0.38) < size * 0.014) {
      color = [...GREEN, 255];
    }
    if (dRadar <= size * 0.018) color = [...GREEN, 255];

    // Small flat base keeps the mark legible after OS icon masks are applied.
    if (inRoundedRect(x, y, safe * 1.34, size - safe * 1.15, size - safe * 1.34, size - safe * 0.78, size * 0.035)) {
      color = [...BRAND_DARK, 255];
    }

    return color;
  });
}

mkdirSync("public/icons", { recursive: true });
writeFileSync("public/icons/icon-192.png", makeIcon(192));
writeFileSync("public/icons/icon-512.png", makeIcon(512));
writeFileSync("public/icons/maskable-512.png", makeIcon(512, { maskable: true }));
writeFileSync("public/icons/apple-touch-icon.png", makeIcon(180));
console.log("Icons written to public/icons/");
