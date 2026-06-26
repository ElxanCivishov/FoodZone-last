// PWA icon generator — no external dependencies, pure Node.js
const zlib = require('zlib');
const fs   = require('fs');
const path = require('path');

// ── CRC32 ──────────────────────────────────────────────────────────────────
const CRC = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let j = 0; j < 8; j++) c = (c & 1) ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
  CRC[i] = c;
}
const crc32 = buf => {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) c = CRC[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
};

const u32 = n => Buffer.from([(n>>>24)&0xFF,(n>>>16)&0xFF,(n>>>8)&0xFF,n&0xFF]);

const pngChunk = (type, data) => {
  const t = Buffer.from(type, 'ascii');
  return Buffer.concat([u32(data.length), t, data, u32(crc32(Buffer.concat([t, data])))]);
};

// ── Draw helpers ───────────────────────────────────────────────────────────
const setP = (buf, sz, x, y, r, g, b, a = 255) => {
  if (x < 0 || y < 0 || x >= sz || y >= sz) return;
  const i = (y * sz + x) * 4;
  buf[i] = r; buf[i+1] = g; buf[i+2] = b; buf[i+3] = a;
};

const circle = (buf, sz, cx, cy, rad, r, g, b) => {
  for (let y = Math.max(0, Math.floor(cy-rad)); y <= Math.min(sz-1, Math.ceil(cy+rad)); y++)
    for (let x = Math.max(0, Math.floor(cx-rad)); x <= Math.min(sz-1, Math.ceil(cx+rad)); x++) {
      const d = Math.sqrt((x-cx)**2+(y-cy)**2);
      if (d <= rad) setP(buf, sz, x, y, r, g, b, d > rad-1 ? Math.round((rad-d)*255) : 255);
    }
};

const rect = (buf, sz, x1, y1, w, h, r, g, b) => {
  for (let y = y1; y < y1+h; y++)
    for (let x = x1; x < x1+w; x++) setP(buf, sz, x, y, r, g, b);
};

const rrect = (buf, sz, x, y, w, h, rx, r, g, b) => {
  rect(buf, sz, x+rx, y, w-rx*2, h, r, g, b);
  rect(buf, sz, x, y+rx, w, h-rx*2, r, g, b);
  circle(buf, sz, x+rx,   y+rx,   rx, r, g, b);
  circle(buf, sz, x+w-rx, y+rx,   rx, r, g, b);
  circle(buf, sz, x+rx,   y+h-rx, rx, r, g, b);
  circle(buf, sz, x+w-rx, y+h-rx, rx, r, g, b);
};

// ── Icon render ────────────────────────────────────────────────────────────
function buildIcon(sz) {
  const px = Buffer.alloc(sz * sz * 4);
  // bg: #0f0f12
  for (let i = 0; i < sz*sz*4; i += 4) { px[i]=15; px[i+1]=15; px[i+2]=18; px[i+3]=255; }

  const pad = Math.round(sz * 0.11);
  const sq  = sz - pad * 2;
  const rx  = Math.round(sq * 0.22);

  // Orange rounded square: #f97316
  rrect(px, sz, pad, pad, sq, sq, rx, 249, 115, 22);

  // White fork & knife (scaled to size)
  const s  = sz / 192;
  const cx = sz / 2, cy = sz / 2;

  // Fork — 3 tines
  const fx = cx - sz * 0.13;
  for (let t = -1; t <= 1; t++)
    rect(px, sz, Math.round(fx+t*5*s-s), Math.round(cy-36*s), Math.round(2*s+1), Math.round(20*s), 255,255,255);
  // crossbar
  rect(px, sz, Math.round(fx-6*s), Math.round(cy-17*s), Math.round(13*s), Math.round(3*s), 255,255,255);
  // handle
  rect(px, sz, Math.round(fx-s), Math.round(cy-14*s), Math.round(2*s+1), Math.round(40*s), 255,255,255);

  // Knife
  const kx = cx + sz * 0.10;
  rect(px, sz, Math.round(kx-s*1.5), Math.round(cy-36*s), Math.round(3*s), Math.round(30*s), 255,255,255);
  rect(px, sz, Math.round(kx-s),     Math.round(cy-6*s),  Math.round(2*s+1), Math.round(42*s), 255,255,255);

  // Build PNG scanlines
  const rows = Buffer.alloc(sz * (sz*4 + 1));
  for (let y = 0; y < sz; y++) {
    rows[y*(sz*4+1)] = 0; // filter = None
    px.copy(rows, y*(sz*4+1)+1, y*sz*4, (y+1)*sz*4);
  }

  const ihdr = Buffer.concat([u32(sz), u32(sz), Buffer.from([8,6,0,0,0])]);
  const sig  = Buffer.from([0x89,0x50,0x4E,0x47,0x0D,0x0A,0x1A,0x0A]);

  return Buffer.concat([
    sig,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', zlib.deflateSync(rows, { level: 9 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

// ── Output ─────────────────────────────────────────────────────────────────
const root     = path.resolve(__dirname, '..');
const iconsDir = path.join(root, 'public', 'icons');
fs.mkdirSync(iconsDir, { recursive: true });

[72, 96, 128, 144, 152, 192, 384, 512].forEach(sz => {
  const file = path.join(iconsDir, `icon-${sz}.png`);
  fs.writeFileSync(file, buildIcon(sz));
  console.log(`  ✓ public/icons/icon-${sz}.png`);
});

fs.writeFileSync(path.join(root, 'public', 'apple-touch-icon.png'), buildIcon(180));
console.log('  ✓ public/apple-touch-icon.png');
console.log('\nDone.');
