/* KRYPTEX: sectors, species, procedural glyph sets, lore. All original. MIT (c) 2026 kxz0tn */
'use strict';
const SECTORS = [
  { n: 'VELORA DRIFT', sp: 'VELORAN', cols: 4, rows: 4, time: 40, tw: [], ros: ['color'], swap: 0, noise: 0, root: 0,
    pal: { a: '#22e2ff', b: '#2850ff', c: '#b4fff8', d: '#0a2a6a', bg: '#03071a', neb: '#0a1a44' },
    d: 'Gentle signals. Learn to listen.', syl: ['VA', 'LO', 'RI', 'SHA', 'EL', 'YU', 'NE', 'MI', 'AU', 'SEL'],
    mean: ['WE', 'SEE', 'LIGHT', 'YOU', 'TRAVELER', 'WATER', 'SONG', 'DAWN', 'RIVER', 'CHILD', 'SKY', 'MOTHER', 'GLASS', 'FLOAT', 'WIND', 'PEARL', 'MOON', 'BREATH'],
    msg: [0, 1, 2], reply: 'WE SEE YOUR LIGHT, TRAVELER. FOLLOW THE RING TO THE THRESH. THEY SPEAK IN STORMS.',
    lore: ['VELORANS DRIFT THROUGH THE GAS RIVERS OF VELORA, SINGING TO STAY TOGETHER.', 'THEIR GLYPHS ARE SONGS FROZEN INTO LIGHT. EVERY SHAPE HAS A COLOR.', 'THEY WERE THE FIRST TO HEAR THE OZYRON BEAM AND ANSWER IT.'] },
  { n: 'THRESH NEBULA', sp: 'THRESSIC', cols: 4, rows: 5, time: 60, tw: ['drift', 'swap'], ros: ['sound', 'color'], swap: 9, noise: 0, root: 3,
    pal: { a: '#ff32b4', b: '#8a3cff', c: '#ffc4ee', d: '#3a0a4a', bg: '#0c0314', neb: '#2a0a3a' },
    d: 'Glyphs now drift and swap places. Track them.', syl: ['THR', 'KA', 'ZEK', 'ESH', 'VOR', 'IX', 'RAA', 'SK', 'OM', 'TEH'],
    mean: ['STORM', 'IS', 'COMING', 'RUN', 'HIDE', 'HEART', 'ECHO', 'BLADE', 'VOICE', 'MIRROR', 'THUNDER', 'HUNT', 'SPARK', 'CLAW', 'TRUTH', 'SHADOW', 'RAIN', 'WAKE'],
    msg: [0, 1, 2, 3], reply: 'THE STORM IS OUR VOICE AND YOU SPEAK IT WELL. GO NOW. THE BUILDERS OF OZYR ARE WAITING.',
    lore: ['THE THRESSIC LIVE INSIDE A NEBULA THAT NEVER STOPS STORMING.', 'THEY SPEAK IN THUNDER. A THRESSIC WORD IS A SOUND YOU FEEL IN YOUR CHEST.', 'THEIR GLYPHS NEVER SIT STILL. THEY BELIEVE A STILL WORD IS A DEAD WORD.'] },
  { n: 'ORBITAL HUSK', sp: 'OZYR', cols: 4, rows: 6, time: 72, tw: ['drift', 'swap', 'noise'], ros: ['star', 'sound'], swap: 8, noise: 7.5, root: 5,
    pal: { a: '#ffd822', b: '#ff8a1a', c: '#fff2b0', d: '#4a2a06', bg: '#0e0803', neb: '#2a1606' },
    d: 'Signal noise corrupts tiles. Tap static fast to clear it.', syl: ['OZ', 'YR', 'DUN', 'KOR', 'AT', 'RUM', 'BEL', 'GAN', 'TOR', 'UL'],
    mean: ['BEAM', 'ENERGY', 'THROUGH', 'DOOR', 'BUILD', 'SHIP', 'RING', 'FIRE', 'HAND', 'ORBIT', 'CITY', 'SUN', 'IRON', 'FORGE', 'ENGINE', 'BRIDGE', 'LAUNCH', 'TOWER'],
    msg: [0, 1, 2, 3], reply: 'OZYRON WAS OUR WORK. THE REACTOR STILL BURNS FOR YOU. THE NULL REACH LIES BEYOND. DO NOT FEAR ITS SILENCE.',
    lore: ['THE OZYR BUILT THE ORBITAL RING AROUND OZYRON AND THE GREAT REACTOR BELOW IT.', 'THEY MAPPED EVERY STAR BY HAND. EACH OZYR GLYPH IS AN ADDRESS IN THE SKY.', 'WHEN THE BEAM FROM ANOTHER UNIVERSE ARRIVED, THEY BUILT A DOOR FOR IT.'] },
  { n: 'NULL REACH', sp: 'NULLKIN', cols: 5, rows: 6, time: 86, tw: ['drift', 'swap', 'noise', 'rotate'], ros: ['sound', 'color', 'star'], swap: 6.5, noise: 6, root: -2,
    pal: { a: '#36ff6a', b: '#0e7a46', c: '#c8ffd8', d: '#06301a', bg: '#020a05', neb: '#06200e' },
    d: 'Glyphs rotate. Shapes stay the same. Trust them.', syl: ['NUL', 'KI', 'GHA', 'UMM', 'SOL', 'EB', 'NNH', 'OKK', 'ZU', 'HEM'],
    mean: ['NOTHING', 'ENDS', 'ONLY', 'CHANGES', 'SHAPE', 'VOID', 'HUNGER', 'SILENT', 'GHOST', 'DREAM', 'BONE', 'MOSS', 'DEEP', 'SLEEP', 'ASH', 'ROOT', 'COLD', 'REMAIN'],
    msg: [0, 1, 2, 3, 4], reply: 'YOU DID NOT FEAR THE SILENCE. FEW DO. TAKE THE LAST KEY, TRAVELER. THE CORE IS OPEN.',
    lore: ['THE NULLKIN GROW IN THE DARK BETWEEN GALAXIES, WHERE NO LIGHT REACHES.', 'THEY TURN THEIR GLYPHS LIKE STONES IN A RIVER, SO THE MEANING WEARS SMOOTH.', 'NULLKIN DO NOT DIE. THEY SLEEP, AND THE MOSS REMEMBERS THEM.'] },
  { n: 'KRYPTEX CORE', sp: 'KEYKEEPERS', cols: 6, rows: 6, time: 102, tw: ['drift', 'swap', 'noise', 'rotate'], ros: ['sound', 'color', 'star'], swap: 5.5, noise: 5, root: 2,
    pal: { a: '#ffffff', b: '#8a3cff', c: '#e8e0ff', d: '#2a1a5a', bg: '#06040e', neb: '#1a0e3a' },
    d: 'Everything at once. The final cipher.', syl: ['KRY', 'PT', 'EX', 'AEL', 'ON', 'IZ', 'QUA', 'RE', 'XI', 'OTH'],
    mean: ['COME', 'HOME', 'ALL', 'WORLDS', 'ARE', 'ONE', 'KEY', 'LOCK', 'MAP', 'STAR', 'TIME', 'GATE', 'MIND', 'CROWN', 'SEED', 'ZERO', 'ORIGIN', 'ALWAYS'],
    msg: [0, 1, 2, 3, 4, 5], reply: 'WE ARE THE KEYKEEPERS. EVERY CIPHER YOU BROKE WAS A DOOR. COME HOME, TRAVELER. ALL WORLDS ARE ONE.',
    lore: ['THE KEYKEEPERS WROTE THE FIRST CIPHER, THE KRYPTEX, BEFORE THE STARS HAD NAMES.', 'EVERY SPECIES YOU MET LEARNED TO SPEAK FROM A FRAGMENT OF THEIR CODE.', 'THEIR HOMEWORLD SITS AT THE CENTER OF ALL UNIVERSES. NOW YOU KNOW THE WAY.'] },
];
const HUES = ['#ff2a3c', '#ff8a1a', '#ffd822', '#36ff6a', '#22e2ff', '#2850ff', '#ff32b4', '#ffffff'];
const HUE_N = ['RED', 'AMBER', 'GOLD', 'GREEN', 'CYAN', 'BLUE', 'ROSE', 'WHITE'];

/* ---------- procedural glyphs: 9x9 seeded rune shapes, symmetry per species ---------- */
const GN = 9;
function makeGlyphGrid(rng, style) {
  for (let attempt = 0; attempt < 60; attempt++) {
    const m = Array.from({ length: GN }, () => new Array(GN).fill(0));
    const put = (x, y) => { if (x >= 0 && y >= 0 && x < GN && y < GN) m[y][x] = 1; };
    const strokes = 2 + Math.floor(rng() * 3);
    for (let s = 0; s < strokes; s++) {
      let x = Math.floor(rng() * GN), y = Math.floor(rng() * GN); const len = 3 + Math.floor(rng() * 6);
      let dir = Math.floor(rng() * 8); const D = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];
      for (let i = 0; i < len; i++) {
        put(x, y);
        if (style === 2 || style === 4) { if (rng() < 0.35) dir = (dir + (rng() < 0.5 ? 2 : 6)) % 8; if (dir % 2) dir = (dir + 1) % 8; } // angular
        else if (rng() < 0.3) dir = (dir + (rng() < 0.5 ? 1 : 7)) % 8; // flowing
        x += D[dir][0]; y += D[dir][1]; if (x < 0 || y < 0 || x >= GN || y >= GN) break;
      }
      if (style === 3 && rng() < 0.6) { put(Math.floor(rng() * GN), Math.floor(rng() * GN)); }
    }
    // symmetry
    const o = Array.from({ length: GN }, () => new Array(GN).fill(0));
    for (let y = 0; y < GN; y++) for (let x = 0; x < GN; x++) if (m[y][x]) {
      o[y][x] = 1;
      if (style === 0 || style === 2 || style === 4) o[y][GN - 1 - x] = 1;          // vertical mirror
      if (style === 4) { o[GN - 1 - y][x] = 1; o[GN - 1 - y][GN - 1 - x] = 1; }    // both mirrors
      if (style === 1) { o[x][GN - 1 - y] = 1; o[GN - 1 - y][GN - 1 - x] = 1; o[GN - 1 - x][y] = 1; } // 4-fold rotation
      if (style === 3) o[GN - 1 - y][GN - 1 - x] = 1;                              // point symmetry
    }
    if (style === 2) { for (let y = 1; y < GN - 1; y++) o[y][4] = 1; }           // Ozyr stem
    if (style === 3) { o[4][4] = 1; }
    let n = 0; for (const r of o) for (const v of r) n += v;
    if (n >= 14 && n <= 42) return o;
  }
  const o = Array.from({ length: GN }, () => new Array(GN).fill(0)); for (let i = 0; i < GN; i++) { o[i][i] = 1; o[i][GN - 1 - i] = 1; } return o;
}
// shape identity is rotation invariant (so rotating glyphs never look like another glyph)
function sig(m) {
  const rots = []; let cur = m;
  for (let r = 0; r < 4; r++) { rots.push(cur.map(row => row.join('')).join('/')); cur = cur[0].map((_, i) => cur.map(row => row[i]).reverse()); }
  return rots.sort()[0];
}
const GLYPHS = SECTORS.map((S, si) => {
  const rng = mulberry(9000 + si * 7919); const seen = new Set(); const list = [];
  const syl = mulberry(31 + si);
  while (list.length < 18) {
    const m = makeGlyphGrid(rng, si); const k = sig(m); if (seen.has(k)) continue; seen.add(k);
    const i = list.length;
    const a = S.syl[Math.floor(syl() * S.syl.length)], b = S.syl[Math.floor(syl() * S.syl.length)];
    list.push({ m, i, word: a === b ? a + '·' + S.syl[(S.syl.indexOf(b) + 3) % S.syl.length] : a + '·' + b, mean: S.mean[i], hue: i < 8 ? HUES[(i + si * 3) % 8] : null, hueN: i < 8 ? HUE_N[(i + si * 3) % 8] : null, sprites: {} });
  }
  return list;
});
function glyphSprite(si, gi, col, hi) {
  const gl = GLYPHS[si][gi]; const key = col + (hi || '');
  if (gl.sprites[key]) return gl.sprites[key];
  const m = gl.m;
  return (gl.sprites[key] = mkSprite(GN, GN, (x, y) => m[y][x] ? (hi && (y === 0 || !m[y - 1][x]) ? hi : col) : null));
}
function glyphColor(si, gi) { const gl = GLYPHS[si][gi]; return gl.hue || SECTORS[si].pal.a; }

/* ---------- star map positions (per sector, seeded, well spread) ---------- */
const STARPOS = SECTORS.map((S, si) => {
  const rng = mulberry(500 + si * 131); const pts = [];
  const n = 18;
  for (let i = 0; i < n; i++) {
    let best = null, bd = -1;
    for (let t = 0; t < 30; t++) { const p = { x: 0.06 + rng() * 0.88, y: 0.12 + rng() * 0.76 }; let d = 9; for (const o of pts) d = Math.min(d, Math.hypot((o.x - p.x) * 3.6, o.y - p.y)); if (d > bd) { bd = d; best = p; } }
    pts.push(best);
  }
  return pts;
});

/* ---------- alien portraits (seeded symmetric pixel faces) ---------- */
const PORTRAIT = SECTORS.map((S, si) => {
  const P = S.pal, rng = mulberry(77 + si * 13), w = 23, h = 23, cx = 11;
  const eyes = [2, 1, 3, 2, 1][si];
  return [0, 1].map(fr => mkSprite(w, h, (x, y) => {
    const dx = Math.abs(x - cx), dy = y - 12;
    let head;
    if (si === 0) head = (dx / 8) ** 2 + (dy / 10) ** 2 < 1;                         // tall drop
    else if (si === 1) head = dx < 9 - Math.max(0, dy) * 0.5 && dy > -9 && dy < 9;   // shard
    else if (si === 2) head = dx < 8 && dy > -8 && dy < 9 && !(dy < -5 && dx > 5);   // helmet
    else if (si === 3) head = (dx / 9) ** 2 + ((dy + 1) / 8) ** 2 < 1 || (dx < 3 && dy > 5); // bulb + stalk
    else head = dx + Math.abs(dy) < 11;                                             // diamond
    // antennae / crest
    if (!head) { if (si === 0 && dy < -9 && dx === 3 && y > 0) return fr ? P.c : P.a; if (si === 1 && dy < -8 && dx === 6 - (y % 2)) return P.a; if (si === 4 && dy < -9 && dx < 2) return '#ffffff'; return null; }
    // eyes
    const ey = si === 4 ? 10 : 9;
    const exs = eyes === 1 ? [0] : eyes === 2 ? [4] : [0, 5];
    for (const ex of exs) if (dx === ex && (y === ey || y === ey + 1) && !(fr && y === ey + 1)) return '#ffffff';
    for (const ex of exs) if (Math.abs(dx - ex) <= 1 && y >= ey - 1 && y <= ey + 2) return P.d;
    // mouth slit / pattern
    if (y === 16 && dx < 3 + fr) return P.d;
    if ((x + y) % 5 === 0 && dy < 6 && si !== 4) return P.b;
    if (si === 4 && (dx + y) % 4 === 0) return P.b;
    return dx > 5 + (si === 4 ? 2 : 0) ? P.b : P.a;
  }));
});
