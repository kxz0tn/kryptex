/* KRYPTEX: engine (pixel buffer, bitmap fonts, primitives, CRT presentation). Original code. MIT (c) 2026 kxz0tn */
'use strict';
const W = 360, H = 640, BW = 180, BH = 320;
const PAL = { K: '#000000', N: '#0a0a22', D: '#16163e', S: '#30306a', G: '#6a6fa0', L: '#b4bce4', W: '#ffffff', C: '#22e2ff', B: '#2850ff', M: '#ff32b4', P: '#8a3cff', V: '#4a1a8a', R: '#ff2a3c', O: '#ff8a1a', Y: '#ffd822', E: '#36ff6a', F: '#0e7a46', T: '#3affd2' };
const RAINBOW = [PAL.R, PAL.O, PAL.Y, PAL.E, PAL.C, PAL.M];
const TAU = Math.PI * 2;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const ease = v => v <= 0 ? 0 : v >= 1 ? 1 : 1 - Math.pow(1 - v, 3);
const backOut = v => { if (v <= 0) return 0; if (v >= 1) return 1; const c = 1.7; return 1 + (c + 1) * Math.pow(v - 1, 3) + c * Math.pow(v - 1, 2); };
function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function todayKey() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
const pad7 = n => String(Math.max(0, Math.min(9999999, Math.floor(n)))).padStart(7, '0');
const ord = n => n + (n === 1 ? 'ST' : n === 2 ? 'ND' : n === 3 ? 'RD' : 'TH');
function hexRgb(h) { h = h.replace('#', ''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; }
function mix(a, b, t) { const A = hexRgb(a), B = hexRgb(b); return '#' + A.map((v, i) => Math.round(lerp(v, B[i], t)).toString(16).padStart(2, '0')).join(''); }

/* ---------- canvases: low-res pixel buffer -> integer upscale -> CRT ---------- */
const cv = document.getElementById('game');
const ctx = cv.getContext('2d', { alpha: false });
const buf = document.createElement('canvas'); buf.width = BW; buf.height = BH;
let g = buf.getContext('2d'); g.imageSmoothingEnabled = false;
const up = document.createElement('canvas'); const ug = up.getContext('2d');
const blm = document.createElement('canvas'); blm.width = 60; blm.height = 107; const bgx = blm.getContext('2d');
let dpr = 1, sc = 1, ox = 0, oy = 0, vw = W, vh = H, K = 2, vignette = null, FX_LOW = false;
function resize() {
  vw = window.innerWidth; vh = window.innerHeight;
  dpr = Math.min(window.devicePixelRatio || 1, FX_LOW ? 1 : 2);
  cv.width = Math.round(vw * dpr); cv.height = Math.round(vh * dpr);
  cv.style.width = vw + 'px'; cv.style.height = vh + 'px';
  sc = Math.min(vw / W, vh / H); ox = (vw - W * sc) / 2; oy = (vh - H * sc) / 2;
  K = Math.max(1, Math.min(6, Math.ceil(sc * 2 * dpr)));
  up.width = BW * K; up.height = BH * K; ug.imageSmoothingEnabled = false;
  vignette = null;
}
window.addEventListener('resize', resize);
resize();

/* ---------- pixel primitives (input in 360x640 logical units, drawn on the 180x320 buffer) ---------- */
let shx = 0, shy = 0;
const q = v => Math.round(v / 2);
function Rb(X, Y, w, h, c) { g.fillStyle = c; g.fillRect(X + shx, Y + shy, w, h); }
function R(x, y, w, h, c) { const X = q(x), Y = q(y); Rb(X, Y, Math.max(1, q(x + w) - X), Math.max(1, q(y + h) - Y), c); }
function box(x, y, w, h, c) { const X = q(x), Y = q(y), Ww = q(x + w) - X, Hh = q(y + h) - Y; Rb(X, Y, Ww, 1, c); Rb(X, Y + Hh - 1, Ww, 1, c); Rb(X, Y, 1, Hh, c); Rb(X + Ww - 1, Y, 1, Hh, c); }
function panel(x, y, w, h, fill, edge, hi, lo) {
  const X = q(x), Y = q(y), Ww = q(x + w) - X, Hh = q(y + h) - Y;
  Rb(X + 1, Y, Ww - 2, Hh, edge); Rb(X, Y + 1, Ww, Hh - 2, edge); Rb(X + 1, Y + 1, Ww - 2, Hh - 2, fill);
  if (hi) { Rb(X + 2, Y + 1, Ww - 4, 1, hi); Rb(X + 1, Y + 2, 1, Hh - 4, hi); }
  if (lo) { Rb(X + 2, Y + Hh - 2, Ww - 4, 1, lo); Rb(X + Ww - 2, Y + 2, 1, Hh - 4, lo); }
}
function lineB(X0, Y0, X1, Y1, c, dash = 0, off = 0) {
  g.fillStyle = c; X0 = Math.round(X0); Y0 = Math.round(Y0); X1 = Math.round(X1); Y1 = Math.round(Y1);
  let dx = Math.abs(X1 - X0), dy = -Math.abs(Y1 - Y0), sx = X0 < X1 ? 1 : -1, sy = Y0 < Y1 ? 1 : -1, e = dx + dy, i = 0;
  for (let guard = 0; guard < 2000; guard++) { if (!dash || ((i + off) % (dash * 2) + dash * 2) % (dash * 2) < dash) g.fillRect(X0 + shx, Y0 + shy, 1, 1); if (X0 === X1 && Y0 === Y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; X0 += sx; } if (e2 <= dx) { e += dx; Y0 += sy; } i++; }
}
const line = (x0, y0, x1, y1, c, dash, off) => lineB(q(x0), q(y0), q(x1), q(y1), c, dash, off);
function circB(X, Y, r, c, step = 1, rot = 0, gapEvery = 0) {
  const n = Math.max(8, Math.round(r * 6.3));
  for (let k = 0; k < n; k += step) { if (gapEvery && Math.floor(k / gapEvery) % 3 === 2) continue; const a = k / n * TAU + rot; Rb(Math.round(X + Math.cos(a) * r), Math.round(Y + Math.sin(a) * r), 1, 1, c); }
}
function discB(X, Y, r, c) { for (let j = -r; j <= r; j++) { const hw = Math.round(Math.sqrt(Math.max(0, r * r - j * j))); Rb(X - hw, Y + j, hw * 2 + 1, 1, c); } }
let ditherPat = null;
function dither(a = 0.5) {
  if (!ditherPat) { const p = document.createElement('canvas'); p.width = p.height = 2; const x = p.getContext('2d'); x.fillStyle = '#000'; x.fillRect(0, 0, 1, 1); x.fillRect(1, 1, 1, 1); ditherPat = g.createPattern(p, 'repeat'); }
  g.fillStyle = ditherPat; g.fillRect(0, 0, BW, BH); if (a > 0.5) { g.globalAlpha = Math.min(1, (a - 0.5) * 2); g.fillStyle = '#000'; g.fillRect(0, 0, BW, BH); g.globalAlpha = 1; }
}
function ditherBox(x, y, w, h) { dither(0); }

/* ---------- bitmap fonts (original glyphs, defined pixel by pixel) ---------- */
const F5 = {
  A: '.###.|#...#|#...#|#####|#...#|#...#|#...#', B: '####.|#...#|#...#|####.|#...#|#...#|####.', C: '.###.|#...#|#....|#....|#....|#...#|.###.',
  D: '####.|#...#|#...#|#...#|#...#|#...#|####.', E: '#####|#....|#....|####.|#....|#....|#####', F: '#####|#....|#....|####.|#....|#....|#....',
  G: '.###.|#...#|#....|#.###|#...#|#...#|.####', H: '#...#|#...#|#...#|#####|#...#|#...#|#...#', I: '.###.|..#..|..#..|..#..|..#..|..#..|.###.',
  J: '..###|...#.|...#.|...#.|...#.|#..#.|.##..', K: '#...#|#..#.|#.#..|##...|#.#..|#..#.|#...#', L: '#....|#....|#....|#....|#....|#....|#####',
  M: '#...#|##.##|#.#.#|#.#.#|#...#|#...#|#...#', N: '#...#|#...#|##..#|#.#.#|#..##|#...#|#...#', O: '.###.|#...#|#...#|#...#|#...#|#...#|.###.',
  P: '####.|#...#|#...#|####.|#....|#....|#....', Q: '.###.|#...#|#...#|#...#|#.#.#|#..#.|.##.#', R: '####.|#...#|#...#|####.|#.#..|#..#.|#...#',
  S: '.####|#....|#....|.###.|....#|....#|####.', T: '#####|..#..|..#..|..#..|..#..|..#..|..#..', U: '#...#|#...#|#...#|#...#|#...#|#...#|.###.',
  V: '#...#|#...#|#...#|#...#|#...#|.#.#.|..#..', W: '#...#|#...#|#...#|#.#.#|#.#.#|#.#.#|.#.#.', X: '#...#|#...#|.#.#.|..#..|.#.#.|#...#|#...#',
  Y: '#...#|#...#|.#.#.|..#..|..#..|..#..|..#..', Z: '#####|....#|...#.|..#..|.#...|#....|#####',
  0: '.###.|#...#|#..##|#.#.#|##..#|#...#|.###.', 1: '..#..|.##..|..#..|..#..|..#..|..#..|.###.', 2: '.###.|#...#|....#|...#.|..#..|.#...|#####',
  3: '#####|...#.|..#..|...#.|....#|#...#|.###.', 4: '...#.|..##.|.#.#.|#..#.|#####|...#.|...#.', 5: '#####|#....|####.|....#|....#|#...#|.###.',
  6: '..##.|.#...|#....|####.|#...#|#...#|.###.', 7: '#####|....#|...#.|..#..|.#...|.#...|.#...', 8: '.###.|#...#|#...#|.###.|#...#|#...#|.###.',
  9: '.###.|#...#|#...#|.####|....#|...#.|.##..',
  ' ': '.....|.....|.....|.....|.....|.....|.....', '.': '.....|.....|.....|.....|.....|.##..|.##..', ',': '.....|.....|.....|.....|.##..|..#..|.#...',
  ':': '.....|.##..|.##..|.....|.##..|.##..|.....', '!': '..#..|..#..|..#..|..#..|..#..|.....|..#..', '?': '.###.|#...#|....#|...#.|..#..|.....|..#..',
  '-': '.....|.....|.....|.###.|.....|.....|.....', '+': '.....|..#..|..#..|#####|..#..|..#..|.....', '/': '....#|....#|...#.|..#..|.#...|#....|#....',
  '%': '##..#|##..#|...#.|..#..|.#...|#..##|#..##', "'": '..#..|..#..|.#...|.....|.....|.....|.....', '(': '...#.|..#..|.#...|.#...|.#...|..#..|...#.',
  ')': '.#...|..#..|...#.|...#.|...#.|..#..|.#...', '=': '.....|.....|#####|.....|#####|.....|.....', '*': '.....|#.#.#|.###.|#####|.###.|#.#.#|.....',
  '#': '.#.#.|.#.#.|#####|.#.#.|#####|.#.#.|.#.#.', '_': '.....|.....|.....|.....|.....|.....|#####', '"': '.#.#.|.#.#.|.....|.....|.....|.....|.....',
  '&': '.##..|#..#.|#.#..|.#...|#.#.#|#..#.|.##.#', '|': '..#..|..#..|..#..|..#..|..#..|..#..|..#..',
  '◀': '...#.|..##.|.###.|####.|.###.|..##.|...#.', '▶': '.#...|.##..|.###.|.####|.###.|.##..|.#...',
  '▲': '.....|..#..|..#..|.###.|.###.|#####|.....', '▼': '.....|#####|.###.|.###.|..#..|..#..|.....',
  '◆': '.....|..#..|.###.|#####|.###.|..#..|.....', '★': '..#..|..#..|#####|.###.|.###.|.#.#.|#...#',
  '♪': '..##.|..#.#|..#..|..#..|###..|###..|.....', '·': '.....|.....|.....|..#..|.....|.....|.....',
  '⌖': '..#..|.###.|##.##|#...#|##.##|.###.|..#..', '■': '.....|#####|#####|#####|#####|#####|.....',
};
const F3 = {
  A: '.#.|#.#|###|#.#|#.#', B: '##.|#.#|##.|#.#|##.', C: '.##|#..|#..|#..|.##', D: '##.|#.#|#.#|#.#|##.', E: '###|#..|##.|#..|###',
  F: '###|#..|##.|#..|#..', G: '.##|#..|#.#|#.#|.##', H: '#.#|#.#|###|#.#|#.#', I: '###|.#.|.#.|.#.|###', J: '..#|..#|..#|#.#|.#.',
  K: '#.#|#.#|##.|#.#|#.#', L: '#..|#..|#..|#..|###', M: '#.#|###|###|#.#|#.#', N: '##.|#.#|#.#|#.#|#.#', O: '.#.|#.#|#.#|#.#|.#.',
  P: '##.|#.#|##.|#..|#..', Q: '.#.|#.#|#.#|##.|.##', R: '##.|#.#|##.|#.#|#.#', S: '.##|#..|.#.|..#|##.', T: '###|.#.|.#.|.#.|.#.',
  U: '#.#|#.#|#.#|#.#|###', V: '#.#|#.#|#.#|#.#|.#.', W: '#.#|#.#|###|###|#.#', X: '#.#|#.#|.#.|#.#|#.#', Y: '#.#|#.#|.#.|.#.|.#.',
  Z: '###|..#|.#.|#..|###', 0: '###|#.#|#.#|#.#|###', 1: '.#.|##.|.#.|.#.|###', 2: '##.|..#|.#.|#..|###', 3: '##.|..#|.#.|..#|##.',
  4: '#.#|#.#|###|..#|..#', 5: '###|#..|##.|..#|##.', 6: '.##|#..|###|#.#|###', 7: '###|..#|.#.|.#.|.#.', 8: '###|#.#|###|#.#|###',
  9: '###|#.#|###|..#|##.', ' ': '...|...|...|...|...', '.': '...|...|...|...|.#.', ',': '...|...|...|.#.|#..', ':': '...|.#.|...|.#.|...',
  '!': '.#.|.#.|.#.|...|.#.', '?': '##.|..#|.#.|...|.#.', '-': '...|...|###|...|...', '+': '...|.#.|###|.#.|...', '/': '..#|..#|.#.|#..|#..',
  '%': '#.#|..#|.#.|#..|#.#', "'": '.#.|.#.|...|...|...', '(': '.#.|#..|#..|#..|.#.', ')': '.#.|..#|..#|..#|.#.', '=': '...|###|...|###|...',
  '&': '.#.|#.#|.#.|#.#|.##', '◀': '..#|.##|###|.##|..#', '▶': '#..|##.|###|##.|#..', '▲': '...|.#.|###|###|...', '▼': '...|###|###|.#.|...',
  '◆': '...|.#.|###|.#.|...', '★': '.#.|###|.#.|#.#|...', '·': '...|...|.#.|...|...', '_': '...|...|...|...|###', '#': '#.#|###|#.#|###|#.#',
  '♪': '.##|.#.|.#.|##.|##.', '|': '.#.|.#.|.#.|.#.|.#.', '*': '#.#|.#.|###|.#.|#.#', '"': '#.#|#.#|...|...|...', '⌖': '.#.|###|#.#|###|.#.',
};
const ALIAS = { '×': 'X', '−': '-', '→': '▶', '↓': '▼', '←': '◀', '↑': '▲', '☆': '★', '—': '-', '…': '.' };
function buildFont(defs, gw, gh) {
  const keys = Object.keys(defs), idx = {}; const c = document.createElement('canvas'); c.width = keys.length * (gw + 1); c.height = gh;
  const x = c.getContext('2d'); x.fillStyle = '#fff';
  keys.forEach((k, i) => { idx[k] = i; defs[k].split('|').forEach((row, r) => { for (let j = 0; j < gw; j++) if (row[j] === '#') x.fillRect(i * (gw + 1) + j, r, 1, 1); }); });
  return { c, idx, gw, gh, adv: gw + 1, tints: {} };
}
const FONT = buildFont(F5, 5, 7), MINI = buildFont(F3, 3, 5);
function tint(f, col) {
  if (f.tints[col]) return f.tints[col];
  const a = document.createElement('canvas'); a.width = f.c.width; a.height = f.c.height; const x = a.getContext('2d');
  x.drawImage(f.c, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = col; x.fillRect(0, 0, a.width, a.height);
  return (f.tints[col] = a);
}
function strB(cx, s, X, Y, k, col, f) {
  const t = tint(f, col);
  for (let i = 0; i < s.length; i++) { let ch = s[i]; ch = ALIAS[ch] || ch; let gi = f.idx[ch]; if (gi === undefined) gi = f.idx['?']; if (ch !== ' ') cx.drawImage(t, gi * f.adv, 0, f.gw, f.gh, X + i * f.adv * k, Y, f.gw * k, f.gh * k); }
}
const tw = (s, k = 1, f = FONT) => s.length * f.adv * k - k;
function text(s, x, y, k = 1, col = PAL.W, al = 'center', sh = PAL.K, f = FONT) {
  s = String(s).toUpperCase(); const w = tw(s, k, f);
  const X = q(x) - (al === 'center' ? Math.floor(w / 2) : al === 'right' ? w : 0) + shx, Y = q(y) - Math.floor(f.gh * k / 2) + shy;
  if (sh) strB(g, s, X + k, Y + k, k, sh, f);
  strB(g, s, X, Y, k, col, f);
}
const mini = (s, x, y, col = PAL.L, al = 'center', sh = PAL.K) => text(s, x, y, 1, col, al, sh, MINI);
function wrapLines(s, maxW, f = MINI, k = 1) {
  const maxC = Math.floor((maxW / 2 + k) / (f.adv * k)); const words = String(s).toUpperCase().split(' '); const out = []; let ln = '';
  for (const w of words) { const t = ln ? ln + ' ' + w : w; if (t.length > maxC && ln) { out.push(ln); ln = w; } else ln = t; }
  if (ln) out.push(ln); return out;
}
function wrap(s, x, y, maxW, col = PAL.L, al = 'center', f = MINI, k = 1, lh = 14) {
  const ls = wrapLines(s, maxW, f, k); ls.forEach((l, i) => text(l, x, y + i * lh, k, col, al, PAL.K, f)); return y + ls.length * lh;
}
let T = 0;
const blink = (rate = 2, ph = 0) => Math.floor(T * rate * 2 + ph) % 2 === 0;
const rainbow = (i = 0, rate = 8) => RAINBOW[(Math.floor(T * rate) + i) % RAINBOW.length];

/* ---------- sprites (procedural pixel art, auto black outline) ---------- */
function mkSprite(w, h, fn, outline = '#000') {
  const c = document.createElement('canvas'); c.width = w + 2; c.height = h + 2; const x = c.getContext('2d'); const px = [];
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const col = fn(i, j); if (col) px.push([i, j, col]); }
  if (outline) { x.fillStyle = outline; for (const [i, j] of px) x.fillRect(i, j, 3, 3); }
  for (const [i, j, col] of px) { x.fillStyle = col; x.fillRect(i + 1, j + 1, 1, 1); }
  return c;
}
function colorize(src, col) { const c = document.createElement('canvas'); c.width = src.width; c.height = src.height; const x = c.getContext('2d'); x.drawImage(src, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = col; x.fillRect(0, 0, c.width, c.height); return c; }
function spr(s, x, y, rotQ = 0, alpha = 1) { // centered at logical x,y; rotQ = quarter turns
  const X = q(x) + shx, Y = q(y) + shy;
  if (alpha < 1) g.globalAlpha = Math.max(0, alpha);
  if (!rotQ) g.drawImage(s, X - Math.floor(s.width / 2), Y - Math.floor(s.height / 2));
  else { g.save(); g.translate(X, Y); g.rotate(rotQ * Math.PI / 2); g.drawImage(s, -Math.floor(s.width / 2), -Math.floor(s.height / 2)); g.restore(); }
  g.globalAlpha = 1;
}
function sprScaled(s, x, y, sxk, syk = sxk, alpha = 1) { // horizontal scale for card flips
  const w = Math.max(1, Math.round(s.width * sxk)), h = Math.max(1, Math.round(s.height * syk));
  if (alpha < 1) g.globalAlpha = Math.max(0, alpha);
  g.drawImage(s, q(x) - Math.floor(w / 2) + shx, q(y) - Math.floor(h / 2) + shy, w, h); g.globalAlpha = 1;
}

/* ---------- logo (wordmark + emblem, both drawn in code) ---------- */
function buildWordmark(s, k) {
  const w = tw(s, k) + 10, h = 7 * k + 10; const mask = document.createElement('canvas'); mask.width = w; mask.height = h;
  strB(mask.getContext('2d'), s, 2, 2, k, '#fff', FONT);
  // carve a cipher slit through every letter
  const mx = mask.getContext('2d'); mx.globalCompositeOperation = 'destination-out'; mx.fillRect(0, 2 + Math.round(7 * k * 0.5), w, 1);
  const face = colorize(mask, PAL.W); const fx = face.getContext('2d'); fx.globalCompositeOperation = 'source-atop';
  const bands = [[0.3, PAL.W], [0.5, '#e8e0ff'], [0.72, '#b48cff'], [0.9, PAL.P], [1.01, '#5a1ab0']]; let y0 = 2;
  for (const [e, c] of bands) { const y1 = 2 + Math.round(7 * k * e); fx.fillStyle = c; fx.fillRect(0, y0, w, Math.max(1, y1 - y0)); y0 = y1; }
  const out = document.createElement('canvas'); out.width = w; out.height = h; const o = out.getContext('2d');
  const ext = colorize(mask, '#1a0a44'), ext2 = colorize(mask, PAL.P), blk = colorize(mask, PAL.K);
  for (let d = 4; d >= 1; d--) o.drawImage(d > 2 ? ext : ext2, d, d);
  for (const [a, b] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) o.drawImage(blk, a, b);
  o.drawImage(face, 0, 0);
  return { c: out, mask, w, h };
}
const WORD = buildWordmark('KRYPTEX', 3), WORD_S = buildWordmark('KRYPTEX', 2);
const shine = document.createElement('canvas'); const shg = shine.getContext('2d');
function drawWordmark(L, cx, cy, bob = true) {
  const X = q(cx) - Math.floor(L.w / 2) + shx, Y = q(cy) - Math.floor(L.h / 2) + shy + (bob ? Math.round(Math.sin(T * 2)) : 0);
  g.drawImage(L.c, X, Y);
  const p = (T % 3.4) / 1.1; if (p < 1) {
    shine.width = L.w; shine.height = L.h; shg.drawImage(L.mask, 0, 0); shg.globalCompositeOperation = 'source-in'; shg.fillStyle = '#fff';
    const sx = Math.round(-20 + p * (L.w + 40)); for (let r = 0; r < L.h; r++) shg.fillRect(sx - r, r, 4, 1);
    g.drawImage(shine, X, Y);
  }
}
// emblem: a cipher lock ring with a keyhole glyph. Built per-frame from rings so it can animate.
/* HEX CODE emblem (logo H): a hex chip on circuit traces with a pixel K core */
const KBITS = ['10001', '10010', '10100', '11000', '10100', '10010', '10001'];
function hexPts(X, Y, r) { const p = []; for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + i * TAU / 6; p.push([Math.round(X + Math.cos(a) * r), Math.round(Y + Math.sin(a) * r)]); } return p; }
function hexB(X, Y, r, c, upto = 1) { const p = hexPts(X, Y, r), n = 6 * upto; for (let i = 0; i < Math.floor(n); i++) lineB(p[i][0], p[i][1], p[(i + 1) % 6][0], p[(i + 1) % 6][1], c); const f = n - Math.floor(n); if (f > 0 && n < 6) { const i = Math.floor(n), A = p[i], B = p[(i + 1) % 6]; lineB(A[0], A[1], Math.round(lerp(A[0], B[0], f)), Math.round(lerp(A[1], B[1], f)), c); } }
// traces in units of hex radius (from logo H): polyline points relative to centre
const TRACES = [[[-.82, -.38], [-1.05, -.38], [-1.05, -.62]], [[.82, -.38], [1.07, -.38]], [[-.82, .46], [-.97, .62], [-1.2, .62]], [[.82, .46], [1.03, .62]], [[0, -1], [0, -1.19]], [[0, 1], [0, 1.23]]];
function drawEmblem(cx, cy, s = 1, t = T, build = 1) {
  const X = q(cx) + shx, Y = q(cy) + shy, r = Math.round(26 * s);
  const Rr = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
  if (build > 0.05) { const p = hexPts(X, Y, r); g.fillStyle = '#0c0626'; g.beginPath(); g.moveTo(p[0][0], p[0][1]); for (const v of p) g.lineTo(v[0], v[1]); g.closePath(); g.fill(); }
  // circuit traces with travelling pulses
  const tb = clamp(build * 2, 0, 1);
  for (let i = 0; i < TRACES.length; i++) {
    const tr = TRACES[i].map(([u, v]) => [Math.round(X + u * r), Math.round(Y + v * r)]);
    for (let j = 0; j < tr.length - 1; j++) { lineB(tr[j][0] - shx, tr[j][1] - shy, Math.round(lerp(tr[j][0], tr[j + 1][0], tb)) - shx, Math.round(lerp(tr[j][1], tr[j + 1][1], tb)) - shy, '#0f6a80'); }
    const e = tr[tr.length - 1]; if (tb >= 1) Rr(e[0] - 1, e[1] - 1, 3, 3, PAL.C);
    if (build >= 1) { const ph = ((t * 0.8 + i * 0.37) % 1.6); if (ph < 1) { const L = tr.length - 1, f = ph * L, j = Math.min(L - 1, Math.floor(f)), u = f - j, A = tr[tr.length - 1 - j], B = tr[tr.length - 2 - j]; Rr(Math.round(lerp(A[0], B[0], u)), Math.round(lerp(A[1], B[1], u)), 1, 1, '#fff'); } }
  }
  // neon outer hex (purple glow + bright core) and white inner hex
  const hb = clamp((build - 0.2) * 2, 0, 1);
  if (hb > 0) { hexB(X - shx, Y - shy, r + 1, PAL.V, hb); hexB(X - shx, Y - shy, r - 1, PAL.V, hb); hexB(X - shx, Y - shy, r, '#b48cff', hb); }
  if (build > 0.55) hexB(X - shx, Y - shy, Math.round(r * 0.865), '#e8e0ff', clamp((build - 0.55) * 3, 0, 1));
  // pixel K core
  if (build > 0.7) {
    const u = Math.max(1, Math.round(r * 0.115)), kx = X - Math.round(2.5 * u), ky = Y - Math.round(3.5 * u);
    const on = clamp((build - 0.7) / 0.3, 0, 1) * 35;
    let n = 0;
    for (let j = 0; j < 7; j++) for (let i = 0; i < 5; i++) { if (KBITS[j][i] !== '1') continue; if (n++ > on) continue; const col = j === 3 ? PAL.C : '#fff'; Rr(kx + i * u - 1, ky + j * u - 1, u + 1, u + 1, '#3a1a7a'); Rr(kx + i * u, ky + j * u, u - (u > 2 ? 1 : 0), u - (u > 2 ? 1 : 0), col); }
    if (build >= 1 && (t % 4.2) < 0.08) Rr(kx - u, ky + 3 * u, 7 * u, 1, '#fff'); // occasional glitch line
  }
}

/* ---------- particles, floating text, shake ---------- */
const parts = [], floats = [];
let shake = 0, flash = 0, flashCol = '#fff';
function burst(x, y, cols, n = 14, sp = 140, life = 0.7, grav = 60) {
  if (FX_LOW) n = Math.ceil(n / 2);
  for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = sp * (0.3 + Math.random() * 0.7); parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: life * (0.6 + Math.random() * 0.6), max: life, col: cols[i % cols.length], gr: grav, sz: Math.random() < 0.25 ? 2 : 1 }); }
}
function ringFx(x, y, col, r = 40) { parts.push({ ring: true, x, y, r: 2, R: r, life: 0.45, max: 0.45, col }); }
function trail(x0, y0, x1, y1, col, n = 8) { for (let i = 0; i < n; i++) parts.push({ x: x0, y: y0, tx: x1 + (Math.random() - 0.5) * 6, ty: y1 + (Math.random() - 0.5) * 6, home: true, d: i * 0.03, t: 0, life: 0.7 + i * 0.03, max: 0.7, col, sz: 2 }); }
function floatText(t, x, y, col, k = 1) { floats.push({ t, x, y, col, k, life: 1.1 }); }
function updParts(dt) {
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i]; p.life -= dt; if (p.life <= 0) { parts.splice(i, 1); continue; }
    if (p.ring) { p.r = lerp(p.r, p.R, Math.min(1, dt * 9)); circB(q(p.x) + 0, q(p.y), Math.round(p.r / 2), p.col, 1); continue; }
    if (p.home) { p.d -= dt; if (p.d > 0) continue; p.t = Math.min(1, p.t + dt * 1.8); const e = ease(p.t); const bx = lerp(p.x, p.tx, e), by = lerp(p.y, p.ty, e) - Math.sin(e * Math.PI) * 30; Rb(q(bx), q(by), p.sz, p.sz, p.col); if (p.t >= 1) p.life = 0; continue; }
    p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.gr * dt; p.vx *= 0.98;
    if (p.life > p.max * 0.25 || blink(10)) Rb(q(p.x), q(p.y), p.sz, p.sz, p.col);
  }
  for (let i = floats.length - 1; i >= 0; i--) {
    const f = floats[i]; f.life -= dt; f.y -= dt * 36; if (f.life <= 0) { floats.splice(i, 1); continue; }
    if (f.life > 0.25 || blink(8)) text(f.t, f.x, f.y, f.k, f.col);
  }
}

/* ---------- CRT presentation ---------- */
function present(redPulse, letterCol) {
  const hi = !FX_LOW;
  ug.drawImage(buf, 0, 0, up.width, up.height);
  const cw = cv.width, ch = cv.height;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, cw, ch);
  const X = Math.round(ox * dpr), Y = Math.round(oy * dpr), Ww = Math.round(W * sc * dpr), Hh = Math.round(H * sc * dpr);
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  if (hi) {
    const strips = 80, sh = up.height / strips, dh = Hh / strips;
    for (let i = 0; i < strips; i++) { const ny = (i + 0.5) / strips * 2 - 1, f = 1 - 0.035 * ny * ny, w2 = Ww * f; ctx.drawImage(up, 0, i * sh, up.width, sh, X + (Ww - w2) / 2, Y + i * dh, w2, dh + 1); }
  } else ctx.drawImage(up, X, Y, Ww, Hh);
  if (hi) {
    bgx.imageSmoothingEnabled = true; bgx.clearRect(0, 0, 60, 107); bgx.drawImage(buf, 0, 0, 60, 107);
    ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.36; ctx.drawImage(blm, X - Ww * 0.01, Y - Hh * 0.01, Ww * 1.02, Hh * 1.02); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  }
  const rowH = Hh / BH;
  if (rowH >= 2) {
    ctx.fillStyle = 'rgba(0,0,0,' + (hi ? 0.32 : 0.2) + ')';
    for (let r = 0; r < BH; r++) ctx.fillRect(X, Math.round(Y + r * rowH + rowH * 0.62), Ww, Math.max(1, Math.round(rowH * 0.32)));
  }
  if (!vignette || vignette.k !== cw + 'x' + ch) {
    const v = document.createElement('canvas'); v.width = Ww; v.height = Hh; const vx = v.getContext('2d');
    const gr = vx.createRadialGradient(Ww / 2, Hh / 2, Hh * 0.28, Ww / 2, Hh / 2, Hh * 0.62); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.55)');
    vx.fillStyle = gr; vx.fillRect(0, 0, Ww, Hh);
    const r = Ww * 0.06; vx.fillStyle = '#000'; vx.beginPath(); vx.rect(0, 0, Ww, Hh); vx.moveTo(r, 0); vx.arcTo(Ww, 0, Ww, Hh, r); vx.arcTo(Ww, Hh, 0, Hh, r); vx.arcTo(0, Hh, 0, 0, r); vx.arcTo(0, 0, Ww, 0, r); vx.closePath(); vx.fill('evenodd');
    const gl = vx.createLinearGradient(0, 0, Ww * 0.6, Hh * 0.4); gl.addColorStop(0, 'rgba(255,255,255,0.06)'); gl.addColorStop(0.5, 'rgba(255,255,255,0)'); vx.fillStyle = gl; vx.fillRect(0, 0, Ww, Hh);
    vignette = { c: v, k: cw + 'x' + ch };
  }
  ctx.drawImage(vignette.c, X, Y);
  if (flash > 0) { ctx.globalAlpha = Math.min(1, flash); ctx.fillStyle = flashCol; ctx.fillRect(X, Y, Ww, Hh); ctx.globalAlpha = 1; }
  if (redPulse > 0) { ctx.fillStyle = `rgba(255,30,60,${redPulse * (0.5 + 0.5 * Math.sin(T * 12))})`; ctx.fillRect(X, Y, Ww, Hh); }
  if (hi && Math.random() < 0.5) { ctx.fillStyle = 'rgba(255,255,255,0.012)'; ctx.fillRect(X, Y, Ww, Hh); }
  if (Y > 60 * dpr) { const m = WORD_S; const k = Math.max(1, Math.floor(Math.min((Y - 10 * dpr) / m.h, cw * 0.8 / m.w))); ctx.imageSmoothingEnabled = false; ctx.drawImage(m.c, Math.round((cw - m.w * k) / 2), Math.round((Y - m.h * k) / 2), m.w * k, m.h * k); }
}
