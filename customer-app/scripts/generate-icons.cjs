// PWA icon generator for FoodZone customer app — no external dependencies
// Matches the app's visual identity: teal #00c2e8 bg, white rounded square, person/food icon
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
  for (let y = Math.max(0, Math.floor(cy - rad)); y <= Math.min(sz-1, Math.ceil(cy + rad)); y++)
    for (let x = Math.max(0, Math.floor(cx - rad)); x <= Math.min(sz-1, Math.ceil(cx + rad)); x++) {
      const d = Math.sqrt((x-cx)**2 + (y-cy)**2);
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
// Replicates the splash screen SVG logo:
//   <circle cx="28" cy="28" r="28" fill="#e0f8ff" />
//   <path d="M16 36c0-6.627 5.373-12 12-12s12 5.373 12 12" stroke="#00c2e8" />  ← shoulders arc
//   <circle cx="28" cy="20" r="5" fill="#00c2e8" />                              ← head
//   <path d="M22 36h12M19 40h18" stroke="#00c2a8" />                             ← plate lines
// All coords are in the SVG's 56×56 viewBox (cx=28, cy=28)
function buildIcon(sz) {
  const px = Buffer.alloc(sz * sz * 4);

  // Background: #00c2e8
  for (let i = 0; i < sz*sz*4; i += 4) { px[i]=0; px[i+1]=194; px[i+2]=232; px[i+3]=255; }

  const cx = sz / 2, cy = sz / 2;

  // White rounded square (inner logo container, 70% of icon)
  const pad = Math.round(sz * 0.15);
  const sq  = sz - pad * 2;
  const rx  = Math.round(sq * 0.25);
  rrect(px, sz, pad, pad, sq, sq, rx, 255, 255, 255);

  // Light blue circle: #e0f8ff — maps to SVG circle r=28 (fills the square)
  const bgCircR = sq * 0.44;
  circle(px, sz, cx, cy, bgCircR, 224, 248, 255);

  // SVG reference: 56×56 viewBox, icon center at (28,28)
  // Scale to inner square size
  const sc = sq / 56;

  // Head circle: cx=28,cy=20,r=5 → offset from center: (0, -8), r=5
  const headR = 5 * sc;
  const headY = cy - 8 * sc;
  circle(px, sz, cx, headY, headR, 0, 194, 232);

  // Shoulders arc: upper semicircle, center=(28,36), r=12
  //   → offset from icon center: (0, +8), r=12
  const arcCX = cx;
  const arcCY = cy + 8 * sc;
  const arcR  = 12 * sc;
  const arcThick = Math.max(2, Math.round(3 * sc)); // stroke-width=3 in SVG

  for (let y = Math.max(0, Math.floor(arcCY - arcR - arcThick)); y <= Math.min(sz-1, Math.ceil(arcCY + arcThick/2)); y++) {
    for (let x = Math.max(0, Math.floor(arcCX - arcR - arcThick)); x <= Math.min(sz-1, Math.ceil(arcCX + arcR + arcThick)); x++) {
      if (y > arcCY) continue; // upper half only
      const d = Math.sqrt((x - arcCX)**2 + (y - arcCY)**2);
      if (d >= arcR - arcThick/2 && d <= arcR + arcThick/2) {
        setP(px, sz, x, y, 0, 194, 232);
      }
    }
  }

  // Plate line 1: M22 36 h12 → y=36, x=22..34 → from center: y=+8, x=[-6..+6]
  const lh = Math.max(1, Math.round(2.5 * sc)); // stroke-width=2.5
  const l1y = Math.round(cy + 8 * sc);
  for (let x = Math.round(cx - 6*sc); x <= Math.round(cx + 6*sc); x++)
    for (let ly = l1y - Math.floor(lh/2); ly <= l1y + Math.ceil(lh/2); ly++)
      setP(px, sz, x, ly, 0, 194, 168);

  // Plate line 2: M19 40 h18 → y=40, x=19..37 → from center: y=+12, x=[-9..+9]
  const l2y = Math.round(cy + 12 * sc);
  for (let x = Math.round(cx - 9*sc); x <= Math.round(cx + 9*sc); x++)
    for (let ly = l2y - Math.floor(lh/2); ly <= l2y + Math.ceil(lh/2); ly++)
      setP(px, sz, x, ly, 0, 194, 168);

  // ── Build PNG ─────────────────────────────────────────────────────────────
  const rows = Buffer.alloc(sz * (sz*4 + 1));
  for (let y = 0; y < sz; y++) {
    rows[y*(sz*4+1)] = 0;
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
