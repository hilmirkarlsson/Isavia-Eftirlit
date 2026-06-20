// Býr til einföld PWA forritstákn (192x192, 512x512, og maskable útgáfu)
// án utanaðkomandi pakka – teiknar beint á pixlagrind og kóðar sjálft í PNG.
// Keyrt einu sinni (npm run gen:icons) – úttak fer í public/icons/.

import { deflateSync } from "zlib";
import { writeFileSync, mkdirSync } from "fs";

const BRAND = [0, 85, 149]; // #005595
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

// Einfalt "K" táknmynd – ferningsbakgrunnur í brandlit + hvítur stafur,
// teiknaður með grunnformum (engin leturgrind nauðsynleg).
function makeIcon(size, { maskable = false } = {}) {
  // Maskable: innihald innan ~80% miðjusvæðis svo Android megi klippa kantinn.
  const pad = maskable ? Math.round(size * 0.1) : Math.round(size * 0.18);
  const inner = size - pad * 2;
  const barW = Math.max(2, Math.round(inner * 0.16));
  const cx = size / 2;
  const top = pad;
  const bottom = size - pad;

  function inK(x, y) {
    // Vinstri lóðrétt strik
    if (x >= pad && x < pad + barW && y >= top && y < bottom) return true;
    const midY = size / 2;
    // Tvö skávirki sem mynda "K" út frá miðjustriki
    const dx = x - (pad + barW);
    const dyTop = midY - y;
    const dyBot = y - midY;
    if (y <= midY + barW / 2) {
      const slope = (midY - top) / (size - pad - (pad + barW));
      const expected = midY - dx * slope;
      if (Math.abs(y - expected) < barW && dx >= 0 && dx <= size - pad - (pad + barW)) return true;
    } else {
      const slope = (bottom - midY) / (size - pad - (pad + barW));
      const expected = midY + dx * slope;
      if (Math.abs(y - expected) < barW && dx >= 0 && dx <= size - pad - (pad + barW)) return true;
    }
    return false;
  }

  return encodePng(size, size, (x, y) => {
    const isK = inK(x, y);
    const [r, g, b] = isK ? WHITE : BRAND;
    return [r, g, b, 255];
  });
}

mkdirSync("public/icons", { recursive: true });
writeFileSync("public/icons/icon-192.png", makeIcon(192));
writeFileSync("public/icons/icon-512.png", makeIcon(512));
writeFileSync("public/icons/maskable-512.png", makeIcon(512, { maskable: true }));
writeFileSync("public/icons/apple-touch-icon.png", makeIcon(180));
console.log("Icons written to public/icons/");
