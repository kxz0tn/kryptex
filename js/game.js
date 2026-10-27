/* KRYPTEX: core game (cards, waves, living glyphs, noise, combo, deep scan, boss transmissions, ring jumps). Original. MIT (c) 2026 kxz0tn */
'use strict';
/* ---------- save ---------- */
const SKEY = 'kryptex.save.v1';
const DEF = {
  set: { music: 0.6, sfx: 0.8, mute: false, vib: true, shake: true, fx: 'high' },
  camp: { unlocked: 0, cleared: 0 }, codex: [[], [], [], [], []], hs: {}, ini: 'AAA',
  daily: { date: '', best: 0, plays: 0 }, stats: { runs: 0, matches: 0, bosses: 0, wins: 0, best: 0 }, tut: false,
};
function merge(d, s) {
  if (typeof d !== 'object' || d === null || Array.isArray(d)) return s === undefined ? d : s;
  const o = {}; for (const k in d) o[k] = merge(d[k], s && typeof s === 'object' ? s[k] : undefined);
  if (s && typeof s === 'object') for (const k in s) if (!(k in o)) o[k] = s[k];
  return o;
}
let S;
function load() { try { S = merge(DEF, JSON.parse(localStorage.getItem(SKEY) || '{}')); } catch (e) { S = merge(DEF, {}); } }
function save() { try { localStorage.setItem(SKEY, JSON.stringify(S)); } catch (e) { /* storage blocked */ } }
load();
FX_LOW = S.set.fx === 'low'; resize();
const applyAudio = () => KXAudio.setVolumes(S.set.music, S.set.sfx, S.set.mute);
applyAudio();

/* ---------- high scores ---------- */
const HS_MODES = ['campaign', 'daily'];
const HS_LABEL = { campaign: 'CAMPAIGN', daily: 'DAILY SIGNAL' };
const HS_NAMES = ['KXZ', 'NVA', 'ZYX', 'QOR', 'VEL', 'THR', 'OZY', 'NUL', 'KEY', 'ACE'];
function defaultHS(m) { const base = m === 'campaign' ? 90000 : 30000; return HS_NAMES.map((n, i) => ({ n, s: Math.round(base * (1 - i * 0.09) / 10) * 10, st: Math.max(1, 5 - Math.floor(i / 2)) })); }
function hsList(m) {
  if (m === 'daily' && S.hs.dailyDate !== todayKey()) { S.hs.daily = defaultHS('daily'); S.hs.dailyDate = todayKey(); }
  if (!Array.isArray(S.hs[m])) S.hs[m] = defaultHS(m);
  return S.hs[m];
}
const vib = ms => { if (G && G.demo) return; if (S.set.vib && navigator.vibrate) try { navigator.vibrate(ms); } catch (e) { /* unsupported */ } };
const gsfx = (n, ...a) => { if (G && G.demo) return; const f = KXAudio.sfx[n]; if (f) f(...a); };
const addShake = v => { if (S.set.shake && !(G && G.demo && screen !== 'attract')) shake = Math.max(shake, v); };

/* ---------- toasts ---------- */
const toasts = [];
function toast(t, sub, col) { toasts.push({ t, sub, col: col || PAL.C, life: 2.6 }); }

/* ---------- game state ---------- */
let screen = 'boot', G = null;
const GRID = { x: 10, y: 164, w: 340, h: 392 };
const MULT = [[16, 8], [12, 6], [9, 5], [6, 4], [4, 3], [2, 2], [0, 1]];
function sec() { return SECTORS[G.si]; }
function has(k) { return G.daily ? ['drift', 'swap', 'noise'].includes(k) || sec().tw.includes(k) : sec().tw.includes(k); }

function newGame(mode, si = 0, demo = false) {
  const daily = mode === 'daily';
  const seed = daily ? hashStr('KRYPTEX-' + todayKey()) : (Math.random() * 1e9) | 0;
  if (daily) si = seed % 5;
  return {
    mode, daily, demo, si, startSi: si, seed, rng: mulberry(seed), score: 0, combo: 0, maxCombo: 0, mult: 1, res: 0, scanReady: false,
    time: 0, timeMax: 1, cards: [], sel: [], pending: null, phase: 'title', phT: 0, wave: 0, cont: daily ? 0 : 1,
    map: { lit: new Set(), links: new Set() }, n: 0, misses: 0, attempts: 0, matchesRun: 0, waveMisses: 0, swapT: 0, noiseT: 0,
    boss: null, last: null, banner: null, peek: 0, stats: { glyphs: 0, bosses: 0, sectors: 0 }, over: null, ending: null, jump: null,
    bot: { t: 0.6, mem: {} }, rotQ: 0, rotT: 0,
  };
}
function startGame(mode, si = 0) {
  KXAudio.init(); G = newGame(mode, si); screen = 'game'; S.stats.runs++; if (mode === 'daily') { S.daily.plays++; } save();
  enterSector(); KXAudio.setInGame(true);
}
function startDemo() { G = newGame('campaign', Math.floor(Math.random() * 3), true); enterSector(); G.phase = 'wave'; buildWave(0); for (const c of G.cards) c.deal = 0; }
function enterSector() {
  G.phase = 'title'; G.phT = 0; G.wave = 0; G.map = { lit: new Set(), links: new Set() }; G.cards = []; G.sel = []; G.pending = null; G.boss = null;
  const s = sec(); G.n = G.daily ? 15 : s.cols * s.rows / 2;
  KXAudio.setRoot(s.root); KXAudio.setBoss(false);
}
function gridDims() { const s = sec(); return G.daily ? { cols: 5, rows: 6 } : { cols: s.cols, rows: s.rows }; }
function slotRect(slot) {
  const { cols, rows } = gridDims(); const cw = GRID.w / cols, ch = GRID.h / rows;
  const col = slot % cols, row = Math.floor(slot / cols);
  let w = cw - 6, h = ch - 6; if (h > w * 1.3) h = Math.round(w * 1.3);
  return { x: GRID.x + col * cw + cw / 2, y: GRID.y + row * ch + ch / 2, w, h };
}
function shuffle(a, rng) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function buildWave(wave) {
  G.wave = wave; const s = sec(), n = G.n, rng = G.rng; const cards = []; let id = 0;
  for (let gi = 0; gi < n; gi++) {
    const ros = G.daily ? (gi % 2 === 1) : wave === 1;
    let types = ['glyph', 'glyph'];
    if (ros) {
      const opts = (G.daily ? ['sound', 'color', 'star'] : s.ros).filter(t => t !== 'color' || GLYPHS[G.si][gi].hue);
      types = ['glyph', opts.length ? opts[Math.floor(rng() * opts.length)] : 'star'];
    }
    for (const face of types) cards.push({ id: id++, gi, face, slot: 0, up: false, f: 0, matched: false, gone: 0, noise: 0, noiseT: 0, shk: 0, peek: 0, swap: null, deal: 0, hl: 0 });
  }
  const slots = shuffle(cards.map((_, i) => i), rng); cards.forEach((c, i) => { c.slot = slots[i]; c.deal = 0.35 + i * 0.025; });
  G.cards = cards; G.sel = []; G.pending = null; G.waveMisses = 0;
  G.timeMax = (G.daily ? 95 : s.time) * (wave === 1 ? 1.05 : 1); G.time = G.timeMax;
  G.swapT = s.swap || 8; G.noiseT = s.noise || 7; G.phase = 'wave'; G.phT = 0; G.bot.mem = {};
}
function cardPos(c) {
  const r = slotRect(c.slot); let x = r.x, y = r.y;
  if (c.swap) { const a = slotRect(c.swap.from), b = slotRect(c.swap.to), e = ease(c.swap.t); x = lerp(a.x, b.x, e); y = lerp(a.y, b.y, e) + Math.sin(e * Math.PI) * c.swap.arc; }
  if (has('drift') && !c.up && !c.matched) { x += Math.sin(T * 0.9 + c.id * 1.3) * 3; y += Math.cos(T * 1.2 + c.id * 0.7) * 3; }
  if (c.deal > 0) { const e = ease(clamp(1 - c.deal / 0.35, 0, 1)); x = lerp(180, x, e); y = lerp(100, y, e); }
  if (c.shk > 0) x += Math.sin(c.shk * 60) * 4 * c.shk / 0.35;
  return { x, y, w: r.w, h: r.h };
}
function setMult() { const m = MULT.find(([c]) => G.combo >= c)[1]; if (m > G.mult && !G.demo) { floatText('X' + m, 300, 560, PAL.Y, 2); } G.mult = m; }
function tapCard(c) {
  if (G.phase !== 'wave' || c.matched || c.up || c.swap || c.deal > 0) return false;
  if (c.noise > 0) { // clear static with fast taps
    c.noise--; c.shk = 0.15; const p = cardPos(c); burst(p.x, p.y, ['#fff', PAL.L, PAL.G], 5, 90, 0.35, 0); gsfx('staticHit'); vib(8);
    if (c.noise <= 0) { gsfx('staticClear'); burst(p.x, p.y, [sec().pal.a, '#fff'], 16, 160); ringFx(p.x, p.y, sec().pal.a, 50); G.score += 50 * G.mult; floatText('+' + 50 * G.mult, p.x, p.y - 10, PAL.W); }
    return true;
  }
  if (G.pending) resolvePending(true);
  if (G.sel.length >= 2) return false;
  c.up = true; c.peek = 0; G.sel.push(c); gsfx('flip'); vib(6);
  if (c.face === 'glyph' || c.face === 'sound') gsfx('tone', c.gi);
  G.bot.mem[c.id] = true;
  if (G.sel.length === 2) {
    const [a, b] = G.sel; G.attempts++;
    if (a.gi === b.gi) { G.pending = { a, b, ok: true, t: 0.28 }; }
    else { G.pending = { a, b, ok: false, t: 0.75 }; }
  }
  return true;
}
function resolvePending(force) {
  const P = G.pending; if (!P) return; G.pending = null; G.sel = [];
  if (P.ok) match(P.a, P.b);
  else {
    P.a.up = false; P.b.up = false; G.combo = 0; setMult(); G.misses++; G.waveMisses++; P.a.shk = P.b.shk = 0.35;
    gsfx('miss'); addShake(2); vib(35); G.time = Math.max(0, G.time - 1.0);
  }
  void force;
}
function match(a, b) {
  a.matched = b.matched = true; G.combo++; G.maxCombo = Math.max(G.maxCombo, G.combo); setMult();
  const s = sec(), gl = GLYPHS[G.si][a.gi], ros = a.face !== b.face;
  const pts = (100 + (ros ? 60 : 0)) * G.mult; G.score += pts; G.matchesRun++;
  G.time = Math.min(G.timeMax, G.time + 1.6);
  const before = G.res; G.res = Math.min(100, G.res + 13 + G.combo * 2); if (before < 100 && G.res >= 100 && !G.scanReady) { G.scanReady = true; gsfx('scanReady'); if (!G.demo) toast('DEEP SCAN READY', 'TAP SCAN TO REVEAL 3 GLYPHS', PAL.C); }
  const pa = cardPos(a), pb = cardPos(b);
  const sp = STARPOS[G.si][a.gi], tx = 16 + sp.x * 328, ty = 66 + sp.y * 74;
  trail(pa.x, pa.y, tx, ty, s.pal.a, 6); trail(pb.x, pb.y, tx, ty, s.pal.c, 6);
  burst(pa.x, pa.y, [s.pal.a, '#fff', s.pal.c], 12, 150); burst(pb.x, pb.y, [s.pal.a, '#fff', s.pal.c], 12, 150);
  ringFx(pa.x, pa.y, s.pal.a, 46); ringFx(pb.x, pb.y, s.pal.a, 46);
  if (G.wave === 0 || (G.daily && !ros)) G.map.lit.add(a.gi); else { G.map.lit.add(a.gi); G.map.links.add(a.gi); }
  G.last = { word: gl.word, mean: gl.mean, t: 2.4, gi: a.gi };
  floatText('+' + pts, (pa.x + pb.x) / 2, (pa.y + pb.y) / 2 - 8, G.mult > 1 ? PAL.Y : PAL.W);
  gsfx('match', G.combo); vib(18); addShake(G.combo >= 6 ? 3 : 1.5);
  if (!G.demo) { const cx = S.codex[G.si]; if (!cx.includes(a.gi)) { cx.push(a.gi); G.stats.glyphs++; S.stats.matches++; save(); if (cx.length === 1 || cx.length % 6 === 0) toast('CODEX: ' + gl.word, gl.mean + ' · NEW ENTRY', s.pal.a); } }
  if (G.cards.every(c => c.matched)) waveClear();
}
function waveClear() {
  const bonus = Math.round(G.time) * 25; G.score += bonus; G.phase = 'clear'; G.phT = 0;
  const flawless = G.waveMisses === 0;
  if (flawless) G.score += 1000;
  G.banner = { t: 'SIGNAL DECODED', sub: 'TIME BONUS +' + bonus + (flawless ? '  FLAWLESS +1000' : ''), col: sec().pal.a };
  gsfx('decoded'); flash = 0.25; flashCol = sec().pal.a; vib(30);
  for (let i = 0; i < 4; i++) burst(60 + i * 80, 360, [sec().pal.a, '#fff', PAL.Y], 14, 200, 0.9);
}
function useScan() {
  if (!G.scanReady || G.phase !== 'wave') return;
  G.scanReady = false; G.res = 0;
  const pool = G.cards.filter(c => !c.up && !c.matched && !c.noise && !c.swap);
  shuffle(pool, Math.random);
  // the scan locks onto a resonant pair when it can
  const picks = []; if (pool.length) { const a = pool[0]; picks.push(a); const mate = pool.find(c => c !== a && c.gi === a.gi); if (mate) picks.push(mate); }
  for (const c of pool) { if (picks.length >= 3) break; if (!picks.includes(c)) picks.push(c); }
  for (const c of picks) { c.peek = 1.1; const p = cardPos(c); ringFx(p.x, p.y, PAL.C, 40); }
  gsfx('scan'); flash = 0.18; flashCol = PAL.C; addShake(2); vib(25); G.scanFx = 0.6;
}
function doSwap() {
  const pool = G.cards.filter(c => !c.up && !c.matched && !c.noise && !c.swap && c.peek <= 0 && c.deal <= 0);
  if (pool.length < 2) return; shuffle(pool, G.rng); const a = pool[0], b = pool[1];
  const sa = a.slot, sb = b.slot; a.swap = { from: sa, to: sb, t: 0, arc: -18 }; b.swap = { from: sb, to: sa, t: 0, arc: 18 };
  a.slot = sb; b.slot = sa; gsfx('swap');
}
function addNoise() {
  const cnt = G.cards.filter(c => c.noise > 0).length; if (cnt >= 4) return;
  const pool = G.cards.filter(c => !c.up && !c.matched && !c.noise && !c.swap && c.deal <= 0); if (!pool.length) return;
  const c = pool[Math.floor(G.rng() * pool.length)]; c.noise = 3; c.noiseT = 0; gsfx('staticOn'); addShake(1);
}
function spreadNoise(c) {
  const { cols } = gridDims(); const nb = [c.slot - 1, c.slot + 1, c.slot - cols, c.slot + cols];
  const t = G.cards.find(o => nb.includes(o.slot) && !o.up && !o.matched && !o.noise && !o.swap && (Math.abs((o.slot % cols) - (c.slot % cols)) <= 1));
  if (t && G.cards.filter(o => o.noise > 0).length < 5) { t.noise = 3; t.noiseT = 0; gsfx('staticOn'); }
}
function lose(why) {
  if (G.over) return; G.over = { t: 0, why, phase: 'lost', cd: 9 }; G.phase = 'over'; G.sel = []; G.pending = null;
  gsfx('lost'); addShake(8); vib([60, 40, 120]); flash = 0.4; flashCol = PAL.R; KXAudio.setDanger(0);
}
function doContinue() {
  const O = G.over; if (!O || G.cont <= 0) return; G.cont--; G.over = null; G.score = Math.floor(G.score * 0.8);
  if (G.boss) { startBoss(true); } else { G.phase = 'wave'; G.time = Math.max(G.time, 30); for (const c of G.cards) c.noise = 0; }
  gsfx('start'); toast('CONTINUE', 'SIGNAL RESTORED', PAL.E);
}
function giveUp() { finishRun(false); }

/* ---------- boss transmission ---------- */
function startBoss(retry) {
  const s = sec(), msg = s.msg.slice(0, G.daily ? 5 : s.msg.length);
  const opts = new Set(msg); const pool = shuffle([...Array(G.n).keys()], G.rng); for (const i of pool) { if (opts.size >= 8) break; opts.add(i); }
  G.boss = { st: retry ? 'show' : 'incoming', t: 0, seq: msg, pos: 0, si: 0, strikes: 0, opts: shuffle([...opts], G.rng), time: 0, timeMax: 9 + msg.length * 2.6, rt: 0, chars: 0, press: -1, pressT: 0, err: 0 };
  G.phase = 'boss'; KXAudio.setBoss(true); if (!retry) gsfx('incoming'); addShake(retry ? 0 : 3);
}
function bossTap(gi) {
  const B = G.boss; if (!B || B.st !== 'input') return;
  B.press = gi; B.pressT = 0.15;
  if (gi === B.seq[B.pos]) {
    gsfx('bossOk', gi); B.pos++; vib(12); burst(180, 300, [sec().pal.a, '#fff'], 10, 120, 0.5, 0); G.score += 150 * (G.si + 1);
    if (B.pos >= B.seq.length) {
      B.st = 'decoded'; B.t = 0; const bonus = 2500 * (G.si + 1) + Math.round(B.time) * 60; G.score += bonus; B.bonus = bonus;
      gsfx('decoded'); flash = 0.5; flashCol = '#fff'; addShake(6); vib([30, 30, 60]);
      for (let i = 0; i < 6; i++) burst(30 + i * 60, 300, [sec().pal.a, PAL.Y, '#fff', sec().pal.b], 18, 240, 1.1);
      G.stats.bosses++; if (!G.demo) { S.stats.bosses++; save(); }
    }
  } else {
    B.strikes++; B.err = 0.4; gsfx('bossFail'); addShake(6); vib(80); B.time = Math.max(0, B.time - 2);
    if (B.strikes >= 3) { lose('TRANSMISSION LOST'); return; }
    B.st = 'show'; B.t = 0; B.pos = 0; B.si = 0;
  }
}
function updateBoss(dt) {
  const B = G.boss; B.t += dt; B.pressT -= dt; B.err = Math.max(0, B.err - dt);
  if (B.st === 'incoming' && B.t > 2.4) { B.st = 'show'; B.t = 0; B.si = 0; }
  else if (B.st === 'show') {
    const step = G.si >= 3 ? 0.72 : 0.85; const i = Math.floor(B.t / step);
    if (i !== B.lastShow && i < B.seq.length) { B.lastShow = i; gsfx('tone', B.seq[i]); }
    if (B.t > step * B.seq.length + 0.3) { B.st = 'input'; B.t = 0; B.time = B.timeMax; B.lastShow = -1; }
  } else if (B.st === 'input') {
    B.time -= dt; if (B.time <= 0) lose('TRANSMISSION LOST');
    if (G.demo && B.t > 0.5 + B.pos * 0.45) bossTap(Math.random() < 0.95 ? B.seq[B.pos] : B.opts[0]);
  } else if (B.st === 'decoded' && B.t > 2.2) { B.st = 'reply'; B.t = 0; B.chars = 0; }
  else if (B.st === 'reply') {
    const full = sec().reply.length; const prev = Math.floor(B.chars); B.chars = Math.min(full, B.chars + dt * 34);
    if (Math.floor(B.chars) !== prev && Math.floor(B.chars) % 2 === 0) gsfx('type');
    if (G.demo && B.chars >= full && B.t > 4) { startDemo(); }
  }
}
function bossAdvance() {
  const B = G.boss; if (!B) return;
  if (B.st === 'reply') {
    if (B.chars < sec().reply.length) { B.chars = sec().reply.length; return; }
    if (B.t < 0.6) return;
    KXAudio.setBoss(false); G.stats.sectors++;
    if (G.daily) { finishRun(true); return; }
    if (!G.demo) { S.camp.unlocked = Math.max(S.camp.unlocked, Math.min(4, G.si + 1)); S.camp.cleared = Math.max(S.camp.cleared, G.si + 1); save(); }
    if (G.si >= 4) { G.phase = 'ending'; G.phT = 0; G.boss = null; gsfx('victory'); if (!G.demo) { S.stats.wins++; save(); } return; }
    G.phase = 'jump'; G.phT = 0; G.boss = null; gsfx('jump'); vib([20, 40, 20, 40, 80]);
  }
}
function finishRun(victory) {
  KXAudio.setInGame(false); KXAudio.setBoss(false); KXAudio.setDanger(0);
  const mode = G.daily ? 'daily' : 'campaign';
  if (G.daily) S.daily = { date: todayKey(), best: Math.max(S.daily.date === todayKey() ? S.daily.best : 0, G.score), plays: S.daily.plays };
  S.stats.best = Math.max(S.stats.best, G.score); save();
  results = { mode, score: G.score, victory, sectors: G.stats.sectors, glyphs: G.matchesRun, maxCombo: G.maxCombo, acc: G.attempts ? Math.round(G.matchesRun / G.attempts * 100) : 0, st: G.si + 1, t: 0 };
  screen = 'results'; G = null;
}
let results = null;

/* ---------- demo bot ---------- */
function demoAI(dt) {
  const B = G.bot; B.t -= dt; if (B.t > 0 || G.phase !== 'wave') return;
  B.t = 0.32 + Math.random() * 0.25;
  const nz = G.cards.find(c => c.noise > 0); if (nz && Math.random() < 0.7) { tapCard(nz); B.t = 0.12; return; }
  if (G.scanReady && Math.random() < 0.3) { useScan(); return; }
  const free = G.cards.filter(c => !c.matched && !c.up && !c.noise && !c.swap && c.deal <= 0);
  if (!free.length) return;
  const known = free.filter(c => B.mem[c.id] && Math.random() < 0.9);
  if (G.sel.length === 1) {
    const a = G.sel[0]; const mate = known.find(c => c.gi === a.gi);
    tapCard(mate || free[Math.floor(Math.random() * free.length)]); return;
  }
  for (const a of known) { const b = known.find(c => c !== a && c.gi === a.gi); if (b) { tapCard(a); return; } }
  const unknown = free.filter(c => !B.mem[c.id]); tapCard((unknown.length ? unknown : free)[Math.floor(Math.random() * (unknown.length || free.length))]);
}

/* ---------- update ---------- */
function update(dt) {
  if (!G) return; G.phT += dt; G.peek = Math.max(0, G.peek - dt); if (G.scanFx) G.scanFx = Math.max(0, G.scanFx - dt);
  if (G.last) { G.last.t -= dt; if (G.last.t <= 0) G.last = null; }
  for (const c of G.cards) {
    if (c.deal > 0) c.deal = Math.max(0, c.deal - dt);
    const target = (c.up || c.peek > 0 || (c.matched && c.gone < 1)) ? 1 : 0; c.f += clamp(target - c.f, -dt * 7, dt * 7);
    if (c.peek > 0) c.peek = Math.max(0, c.peek - dt);
    if (c.shk > 0) c.shk = Math.max(0, c.shk - dt);
    if (c.matched) c.gone = Math.min(1, c.gone + dt * 1.6);
    if (c.swap) { c.swap.t += dt / 0.6; if (c.swap.t >= 1) c.swap = null; }
    if (c.noise > 0 && G.phase === 'wave') { c.noiseT += dt; if (c.noiseT > 5) { c.noiseT = 0; spreadNoise(c); } }
  }
  if (has('rotate')) { G.rotT += dt; if (G.rotT > 1.4) { G.rotT = 0; G.rotQ = (G.rotQ + 1) % 4; } }
  if (G.demo) demoAI(dt);
  if (G.phase === 'title') {
    if (G.phT > (G.demo ? 0.1 : 3.0)) { buildWave(0); }
  } else if (G.phase === 'wave') {
    if (G.pending) { G.pending.t -= dt; if (G.pending.t <= 0) {
      resolvePending(); } }
    const noisy = G.cards.filter(c => c.noise > 0).length;
    if (G.phT > 1.2) G.time -= dt * (1 + noisy * 0.3);
    if (has('swap') && G.phT > 3) { G.swapT -= dt; if (G.swapT <= 0) { G.swapT = sec().swap ? sec().swap * (0.8 + G.rng() * 0.4) : 8; doSwap(); } }
    if (has('noise') && G.phT > 4) { G.noiseT -= dt; if (G.noiseT <= 0) { G.noiseT = (sec().noise || 7) * (0.8 + G.rng() * 0.4); addNoise(); } }
    const fr = G.time / G.timeMax; KXAudio.setIntensity(0.35 + G.wave * 0.15 + Math.min(G.combo, 10) * 0.04 + G.si * 0.05); KXAudio.setDanger(G.demo ? 0 : fr < 0.2 ? 1 : 0);
    if (!G.demo && fr < 0.2 && Math.floor(G.time) !== Math.floor(G.time + dt) && G.time > 0) gsfx('warn');
    if (G.time <= 0) { if (G.demo) startDemo(); else lose('SIGNAL LOST'); }
  } else if (G.phase === 'clear') {
    if (G.phT > 2.0) {
      G.banner = null;
      if (G.wave === 0 && !G.daily) { G.phase = 'rosetta'; G.phT = 0; gsfx('incoming'); }
      else { G.phase = 'mapdone'; G.phT = 0; gsfx('chime'); flash = 0.3; flashCol = sec().pal.c; }
    }
  } else if (G.phase === 'rosetta') {
    if (G.phT > (G.demo ? 1.2 : 2.6)) buildWave(1);
  } else if (G.phase === 'mapdone') {
    if (G.phT > 2.4) startBoss(false);
  } else if (G.phase === 'boss') updateBoss(dt);
  else if (G.phase === 'jump') {
    if (G.phT > 3.4) { G.si++; enterSector(); flash = 0.6; flashCol = '#fff'; }
  } else if (G.phase === 'over') {
    const O = G.over; O.t += dt; if (O.t > 1.6 && O.phase === 'lost') { O.phase = G.cont > 0 ? 'cont' : 'end'; O.t = 0; }
    if (O.phase === 'cont') { O.cd -= dt; if (O.cd <= 0) giveUp(); }
    if (O.phase === 'end' && O.t > 1.2) giveUp();
  } else if (G.phase === 'ending') {
    G.ending = G.ending || { t: 0 }; G.ending.t += dt; if (G.phT % 0.5 < dt) burst(Math.random() * 360, 100 + Math.random() * 300, RAINBOW, 16, 160, 1.1);
  }
}

/* ---------- drawing ---------- */
const nebula = []; { const r = mulberry(99); for (let i = 0; i < 90; i++) nebula.push({ x: r() * BW, y: r() * BH, z: 0.2 + r() * 0.8, tw: r() * 6 }); }
function drawBackground(dt, pal, speed = 1) {
  pal = pal || SECTORS[0].pal; g.fillStyle = pal.bg; g.fillRect(0, 0, BW, BH);
  // drifting nebula bands
  for (let i = 0; i < 6; i++) { const y = ((i * 61 + T * 3 * speed) % (BH + 40)) - 20; g.globalAlpha = 0.18; g.fillStyle = pal.neb; g.fillRect(0, Math.round(y), BW, 14 + (i % 3) * 6); }
  g.globalAlpha = 1;
  for (const s of nebula) {
    s.y += dt * 5 * s.z * speed; if (s.y > BH) { s.y = 0; s.x = Math.random() * BW; }
    const c = s.z > 0.8 ? (Math.sin(T * 5 + s.tw) > 0.3 ? PAL.W : PAL.L) : s.z > 0.5 ? PAL.G : PAL.S;
    Rb(Math.floor(s.x), Math.floor(s.y), 1, speed > 3 && s.z > 0.6 ? 4 : 1, c);
  }
  // cipher lattice at the bottom
  const hy = 262; Rb(0, hy, BW, 1, pal.d);
  for (let i = -6; i <= 6; i++) lineB(90 + i * 6, hy, 90 + i * 30, BH, pal.d);
  for (let k = 0; k < 6; k++) { const p = ((k + (T * 0.3 * speed) % 1) / 6); Rb(0, Math.round(hy + (BH - hy) * p * p), BW, 1, pal.d); }
}
const backSpr = {};
function cardBack(si, w, h) {
  const key = si + ':' + w + 'x' + h; if (backSpr[key]) return backSpr[key];
  const P = SECTORS[si].pal; const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d');
  x.fillStyle = P.b; x.fillRect(1, 0, w - 2, h); x.fillRect(0, 1, w, h - 2);
  x.fillStyle = '#05040c'; x.fillRect(1, 1, w - 2, h - 2);
  x.fillStyle = P.d; for (let j = 2; j < h - 2; j++) for (let i = 2; i < w - 2; i++) if ((i + j) % 4 === 0) x.fillRect(i, j, 1, 1);
  x.fillStyle = P.b; x.fillRect(2, 2, w - 4, 1); x.fillStyle = '#000'; x.fillRect(2, h - 3, w - 4, 1);
  // central rune lock
  const cx = Math.floor(w / 2), cy = Math.floor(h / 2), r = Math.max(3, Math.floor(Math.min(w, h) / 5));
  x.fillStyle = P.a; for (let k = 0; k < 24; k++) { if (k % 4 === 3) continue; const a = k / 24 * TAU; x.fillRect(Math.round(cx + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r), 1, 1); }
  x.fillStyle = P.c; x.fillRect(cx - 1, cy - 2, 1, 5); x.fillRect(cx, cy - 1, 1, 1); x.fillRect(cx + 1, cy - 2, 1, 1); x.fillRect(cx + 1, cy + 1, 1, 1); x.fillRect(cx, cy + 1, 1, 1);
  x.fillStyle = P.a; [[3, 3], [w - 4, 3], [3, h - 4], [w - 4, h - 4]].forEach(([i, j]) => x.fillRect(i, j, 1, 1));
  return (backSpr[key] = c);
}
function drawCardFace(c, X, Y, w, h, si) {
  // X,Y = buffer top-left. glyph face content drawn into buffer.
  const P = SECTORS[si].pal, gl = GLYPHS[si][c.gi], col = glyphColor(si, c.gi);
  const cx = X + Math.floor(w / 2), cy = Y + Math.floor(h / 2);
  const edge = c.peek > 0 ? PAL.C : c.matched ? P.d : col;
  g.fillStyle = edge; g.fillRect(X + 1, Y, w - 2, h); g.fillRect(X, Y + 1, w, h - 2); g.fillStyle = '#04030a'; g.fillRect(X + 1, Y + 1, w - 2, h - 2);
  if (c.face === 'glyph') {
    const s = glyphSprite(si, c.gi, col, '#ffffff');
    const k = w >= 30 ? 2 : 2; const rq = has('rotate') && !c.matched ? (G.rotQ + c.id) % 4 : 0;
    g.save(); g.translate(cx, cy - (h > 34 ? 3 : 1)); g.rotate(rq * Math.PI / 2); g.drawImage(s, -s.width, -s.height, s.width * k, s.height * k); g.restore();
    if (h > 40) strB(g, gl.word.replace('·', ''), cx - Math.floor(tw(gl.word.replace('·', ''), 1, MINI) / 2), Y + h - 8, 1, P.b, MINI);
  } else if (c.face === 'color') {
    const pul = 0.5 + 0.5 * Math.sin(T * 6 + c.gi);
    const sw = Math.floor(Math.min(w, h) * 0.5);
    g.fillStyle = mix(gl.hue, '#000000', 0.55 - pul * 0.45); g.fillRect(cx - sw / 2 - 2, cy - sw / 2 - 2, sw + 4, sw + 4);
    g.fillStyle = gl.hue; g.fillRect(cx - sw / 2, cy - sw / 2, sw, sw);
    g.fillStyle = '#fff'; g.fillRect(cx - sw / 2 + 1, cy - sw / 2 + 1, 2, 1);
    if (h > 40) strB(g, gl.hueN, cx - Math.floor(tw(gl.hueN, 1, MINI) / 2), Y + h - 8, 1, gl.hue, MINI);
  } else if (c.face === 'sound') {
    // speaker + waveform, cycles encode the tone
    g.fillStyle = P.c; g.fillRect(cx - 9, cy - 2, 3, 5); g.fillRect(cx - 6, cy - 4, 1, 9); g.fillRect(cx - 5, cy - 5, 1, 11);
    const cyc = 1 + (c.gi % 6), amp = 2 + (c.gi % 3), len = Math.max(8, Math.floor(w / 2) - 2);
    for (let i = 0; i < len; i++) { const yy = Math.round(Math.sin(i / len * TAU * cyc * 0.5 + T * 8) * amp); g.fillStyle = i % 2 ? P.a : '#fff'; g.fillRect(cx - 2 + i, cy + yy, 1, 1); }
    if (h > 40) strB(g, '♪' + (c.gi + 1), cx - 4, Y + h - 8, 1, P.a, MINI);
  } else if (c.face === 'star') {
    const mw = w - 6, mh = Math.min(h - 8, Math.round(mw * 0.6)); const mx = X + 3, my = cy - Math.floor(mh / 2);
    g.fillStyle = P.d; g.fillRect(mx, my, mw, 1); g.fillRect(mx, my + mh - 1, mw, 1); g.fillRect(mx, my, 1, mh); g.fillRect(mx + mw - 1, my, 1, mh);
    for (let i = 0; i < G.n; i++) { const p = STARPOS[si][i]; g.fillStyle = PAL.S; g.fillRect(mx + 1 + Math.round(p.x * (mw - 3)), my + 1 + Math.round(p.y * (mh - 3)), 1, 1); }
    const p = STARPOS[si][c.gi], sx = mx + 1 + Math.round(p.x * (mw - 3)), sy = my + 1 + Math.round(p.y * (mh - 3));
    g.fillStyle = PAL.Y; g.fillRect(sx - 1, sy, 3, 1); g.fillRect(sx, sy - 1, 1, 3); if (blink(3)) { g.fillStyle = '#fff'; g.fillRect(sx, sy, 1, 1); }
  }
  if (c.peek > 0) { g.fillStyle = PAL.C; g.fillRect(X + 1, Y + 1 + Math.floor(((1.1 - c.peek) * 40) % (h - 2)), w - 2, 1); }
}
function drawNoise(X, Y, w, h, c) {
  for (let j = 1; j < h - 1; j++) for (let i = 1; i < w - 1; i += 1) { const r = Math.random(); if (r < 0.45) { g.fillStyle = r < 0.12 ? '#fff' : r < 0.3 ? PAL.G : PAL.S; g.fillRect(X + i, Y + j, 1, 1); } }
  g.fillStyle = '#000'; g.fillRect(X + 1, Y + Math.floor(h / 2) - 3, w - 2, 7);
  for (let i = 0; i < 3; i++) { g.fillStyle = i < c.noise ? PAL.R : PAL.S; g.fillRect(X + Math.floor(w / 2) - 5 + i * 4, Y + Math.floor(h / 2) - 1, 3, 3); }
  if (c.noiseT > 3.5 && blink(6)) { g.fillStyle = PAL.R; g.fillRect(X, Y, w, 1); g.fillRect(X, Y + h - 1, w, 1); }
}
function drawCards() {
  const si = G.si;
  // draw swapping cards last so they fly over the others
  const order = G.cards.slice().sort((a, b) => (a.swap ? 1 : 0) - (b.swap ? 1 : 0));
  for (const c of order) {
    const p = cardPos(c); const w = q(p.w), h = q(p.h);
    if (c.matched && c.gone >= 1) { // ghost slot
      const X = q(p.x) - Math.floor(w / 2) + shx, Y = q(p.y) - Math.floor(h / 2) + shy;
      g.globalAlpha = 0.35; const s = glyphSprite(si, c.gi, SECTORS[si].pal.d); g.drawImage(s, X + Math.floor((w - s.width) / 2), Y + Math.floor((h - s.height) / 2)); g.globalAlpha = 1; continue;
    }
    const flipS = Math.abs(Math.cos(c.f * Math.PI)); const showFace = c.f > 0.5;
    let sx = Math.max(0.08, flipS), sy = 1;
    if (c.matched) { const e = c.gone; sx *= 1 + Math.sin(e * Math.PI) * 0.15; sy = 1 + Math.sin(e * Math.PI) * 0.15; if (e > 0.7) { const k = 1 - (e - 0.7) / 0.3; sx *= k; sy *= k; } }
    if (c.swap) { sx *= 1.12; sy *= 1.12; }
    const dw = Math.max(1, Math.round(w * sx)), dh = Math.max(1, Math.round(h * sy));
    const X = q(p.x) - Math.floor(dw / 2) + shx, Y = q(p.y) - Math.floor(dh / 2) + shy;
    if (c.swap) { const s2 = SECTORS[si].pal.a; g.fillStyle = s2; g.globalAlpha = 0.35; g.fillRect(X - 2, Y - 2, dw + 4, dh + 4); g.globalAlpha = 1; }
    if (!showFace) {
      g.drawImage(cardBack(si, w, h), X, Y, dw, dh);
      const sweep = (T * 0.6 + c.slot * 0.07) % 2.2; if (sweep < 1 && dw > 4) { g.globalAlpha = 0.25; g.fillStyle = '#fff'; g.fillRect(X + 1, Y + 1 + Math.floor(sweep * (dh - 2)), dw - 2, 1); g.globalAlpha = 1; }
      if (c.noise > 0) drawNoise(X, Y, dw, dh, c);
    } else {
      if (dw === w && dh === h) drawCardFace(c, X, Y, w, h, si);
      else { // render face into a temp canvas then scale (flip)
        const tc = tmpCanvas(w, h); const tg = tc.getContext('2d'); tg.clearRect(0, 0, w, h);
        const og = g; g = tg; const osx = shx, osy = shy; shx = 0; shy = 0; drawCardFace(c, 0, 0, w, h, si); g = og; shx = osx; shy = osy;
        g.drawImage(tc, X, Y, dw, dh);
      }
      if (G.sel.includes(c) && !G.pending && blink(4)) { g.fillStyle = '#fff'; g.fillRect(X, Y - 1, dw, 1); g.fillRect(X, Y + dh, dw, 1); }
      if (G.pending && !G.pending.ok && (c === G.pending.a || c === G.pending.b)) { g.fillStyle = PAL.R; g.fillRect(X, Y - 1, dw, 1); g.fillRect(X, Y + dh, dw, 1); g.fillRect(X - 1, Y, 1, dh); g.fillRect(X + dw, Y, 1, dh); }
    }
  }
}
const tmpC = {}; function tmpCanvas(w, h) { const k = w + 'x' + h; if (!tmpC[k]) { const c = document.createElement('canvas'); c.width = w; c.height = h; tmpC[k] = c; } return tmpC[k]; }

function drawStarMap() {
  const s = sec(), P = s.pal; panel(6, 60, 348, 92, '#04030c', P.d, null, null);
  const n = G.n, sp = STARPOS[G.si];
  const px = i => 16 + sp[i].x * 328, py = i => 66 + sp[i].y * 74;
  for (const i of G.map.links) { const j = (i + 1) % n; line(px(i), py(i), px(j), py(j), P.b, 2, Math.floor(T * 6)); }
  const upG = new Set(G.cards.filter(c => c.up && !c.matched).map(c => c.gi));
  for (let i = 0; i < n; i++) {
    const X = q(px(i)), Y = q(py(i)), lit = G.map.lit.has(i);
    if (lit) { const tw2 = Math.sin(T * 4 + i) > 0.6; Rb(X - 1, Y, 3, 1, P.a); Rb(X, Y - 1, 1, 3, P.a); Rb(X, Y, 1, 1, '#fff'); if (tw2) { Rb(X - 2, Y, 1, 1, P.c); Rb(X + 2, Y, 1, 1, P.c); } }
    else Rb(X, Y, 1, 1, PAL.S);
    if (upG.has(i) && blink(4)) { Rb(X - 3, Y, 2, 1, PAL.Y); Rb(X + 2, Y, 2, 1, PAL.Y); Rb(X, Y - 3, 1, 2, PAL.Y); Rb(X, Y + 2, 1, 2, PAL.Y); }
  }
  const done = G.map.lit.size + G.map.links.size, tot = G.daily ? n + Math.floor(n / 2) : n * 2;
  mini('STAR MAP ' + Math.min(100, Math.round(done / tot * 100)) + '%', 14, 68, P.a, 'left');
  mini(G.daily ? 'DAILY' : 'WAVE ' + (G.wave + 1) + '/2', 346, 68, PAL.G, 'right');
  if (G.last) { const L = G.last; const a = L.t > 2 ? (2.4 - L.t) / 0.4 : 1; if (a > 0.3 || blink(8)) { R(10, 132, 340, 16, '#000'); text(L.word + ' = ' + L.mean, 180, 141, 1, P.c); } }
}
function drawHUD() {
  const s = sec(), P = s.pal;
  R(0, 0, W, 56, '#000'); R(0, 56, W, 2, P.a);
  mini('SCORE', 14, 10, PAL.R, 'left'); text(pad7(G.score), 14, 26, 1, PAL.W, 'left');
  const hi = Math.max(hsList(G.daily ? 'daily' : 'campaign')[0].s, G.score);
  mini('HI', 300, 10, PAL.R, 'right'); text(pad7(hi), 300, 26, 1, PAL.Y, 'right');
  mini((G.daily ? 'DAILY · ' : 'S' + (G.si + 1) + ' · ') + s.n, 180, 44, P.a);
  text('S' + (G.si + 1), 180, 20, 2, P.a);
  button(312, 6, 42, 42, '||', () => { if (G && !G.over) screen = 'pause'; }, { col: PAL.G });
  // timer bar
  const fr = clamp(G.time / G.timeMax, 0, 1), low = fr < 0.2;
  R(6, 154, 348, 8, '#000'); R(8, 156, 344 * fr, 4, low ? (blink(4) ? PAL.R : PAL.O) : fr < 0.45 ? PAL.Y : P.a);
  if (G.cards.some(c => c.noise > 0) && blink(3)) mini('NOISE DRAIN', 352, 152, PAL.R, 'right');
  // bottom bar: combo, resonance / deep scan
  R(0, 560, W, 80, '#000'); R(0, 560, W, 2, P.d);
  text('X' + G.mult, 44, 584, 2, G.mult >= 4 ? rainbow(0, 6) : G.mult > 1 ? PAL.Y : PAL.G);
  mini('COMBO ' + G.combo, 44, 608, PAL.L);
  const rx = 100, ry = 578, rw = 160;
  if (G.scanReady) button(rx, 570, rw, 50, 'DEEP SCAN', useScan, { col: PAL.C, fill: blink(3) ? '#0a3a4a' : PAL.D, sub: 'REVEAL 3 GLYPHS' });
  else { mini('RESONANCE', rx + rw / 2, 576, PAL.G); panel(rx, ry + 8, rw, 18, '#000', PAL.S, null, null); R(rx + 4, ry + 12, (rw - 8) * G.res / 100, 10, P.a); for (let i = 1; i < 5; i++) R(rx + i * rw / 5, ry + 12, 2, 10, '#000'); }
  text(Math.max(0, Math.ceil(G.time)), 316, 584, 2, low && blink(4) ? PAL.R : PAL.W);
  mini('SIGNAL', 316, 608, PAL.L);
  credit(630);
}
function drawBanner(t, sub, col, y = 360) {
  R(0, y - 34, W, 68, '#000'); R(0, y - 34, W, 2, col); R(0, y + 32, W, 2, col);
  text(t, 180, y - 8, 2, col); if (sub) mini(sub, 180, y + 16, PAL.W);
}
function drawGame(dt) {
  const s = sec(), P = s.pal;
  if (G.phase === 'jump') { drawJump(); return; }
  if (G.phase === 'ending') { drawEnding(dt); return; }
  drawBackground(dt, P, G.phase === 'title' ? 2 : 1);
  if (G.phase === 'boss' || (G.phase === 'over' && G.boss)) { drawBoss(dt); return; }
  drawStarMap();
  if (G.phase !== 'title') drawCards();
  if (G.scanFx > 0) { const y = (0.6 - G.scanFx) / 0.6 * 400 + 160; R(0, y, W, 4, PAL.C); R(0, y - 8, W, 2, '#0a6a7a'); }
  updParts(dt);
  drawHUD();
  if (G.phase === 'title') drawTitleCard();
  if (G.phase === 'clear' && G.banner) drawBanner(G.banner.t, G.banner.sub, G.banner.col);
  if (G.phase === 'rosetta') {
    dither(0.6); text('ROSETTA PHASE', 180, 290, 2, P.a);
    wrap('NOW MATCH EACH GLYPH TO ITS MEANING', 180, 322, 300, PAL.W);
    const types = s.ros; types.forEach((t, i) => { const x = 180 + (i - (types.length - 1) / 2) * 100; text(t === 'color' ? 'COLOR' : t === 'sound' ? 'SOUND' : 'STAR', x, 370, 1, PAL.Y); mini(t === 'color' ? 'ITS HUE' : t === 'sound' ? 'ITS TONE' : 'ITS STAR', x, 388, PAL.L); });
  }
  if (G.phase === 'mapdone') { drawBanner('STAR MAP COMPLETE', 'A TRANSMISSION IS LOCKING ON...', PAL.Y); }
  if (G.phase === 'over') drawOver();
}
function drawTitleCard() {
  const s = sec(), P = s.pal, t = G.phT; dither(0.7);
  const e = ease(clamp(t / 0.5, 0, 1));
  text(G.daily ? 'DAILY SIGNAL' : 'SECTOR ' + (G.si + 1), 180, 190 - (1 - e) * 40, 2, PAL.W);
  text(s.n, 180, 232, Math.max(1, Math.min(3, Math.floor(172 / tw(String(s.n).toUpperCase(), 1)))), P.a);
  const pt = PORTRAIT[G.si][blink(0.7) ? 0 : 1]; g.drawImage(pt, q(180) - pt.width + shx, q(330) - pt.height + shy, pt.width * 2, pt.height * 2);
  mini('SPECIES: ' + s.sp, 180, 396, P.c);
  wrap(s.d, 180, 420, 300, PAL.L);
  if (G.daily) mini('SAME SIGNAL FOR EVERYONE TODAY · ' + todayKey(), 180, 456, PAL.Y);
  if (t > 1.2 && blink(2)) mini('TAP TO BEGIN', 180, 490, PAL.W);
}
function drawBoss(dt) {
  const s = sec(), P = s.pal, B = G.boss;
  // alien portrait
  const pt = PORTRAIT[G.si][B.st === 'reply' && Math.floor(B.chars) % 4 < 2 ? 1 : 0];
  const glitch = B.st === 'incoming' ? Math.max(0, 1 - B.t / 1.8) : B.err;
  const k = 3, X = q(180) - Math.floor(pt.width * k / 2) + shx, Y = q(150) - Math.floor(pt.height * k / 2) + shy;
  if (B.st !== 'incoming' || B.t > 0.4) {
    for (let r = 0; r < pt.height; r++) { const off = glitch > 0 && Math.random() < glitch ? Math.round((Math.random() - 0.5) * 10 * glitch) : 0; g.drawImage(pt, 0, r, pt.width, 1, X + off, Y + r * k, pt.width * k, k); }
  }
  // transmission rings
  for (let i = 0; i < 3; i++) circB(q(180), q(150), 40 + i * 5 + Math.round(Math.sin(T * 3 + i) * 2), i % 2 ? P.b : P.a, 1, T * (i % 2 ? -0.6 : 0.6), 4);
  R(0, 0, W, 56, '#000'); R(0, 56, W, 2, P.a);
  mini('SCORE', 14, 10, PAL.R, 'left'); text(pad7(G.score), 14, 26, 1, PAL.W, 'left');
  text('BOSS TRANSMISSION', 212, 20, 1, blink(2) ? PAL.R : P.a); mini(s.sp, 180, 40, P.c);
  // message slots
  const n = B.seq.length, sw = Math.min(54, 330 / n), x0 = 180 - (n * sw) / 2;
  for (let i = 0; i < n; i++) {
    const x = x0 + i * sw + sw / 2, y = 268; const done = i < B.pos || B.st === 'decoded' || B.st === 'reply';
    panel(x - sw / 2 + 2, y - 26, sw - 4, 52, '#04030c', done ? P.a : PAL.S, null, null);
    if (done) { const gs = glyphSprite(G.si, B.seq[i], glyphColor(G.si, B.seq[i]), '#fff'); g.drawImage(gs, q(x) - gs.width + shx, q(y - 6) - gs.height + shy, gs.width * 2, gs.height * 2); }
    else text('?', x, y - 4, 2, PAL.S);
    if (done) mini(GLYPHS[G.si][B.seq[i]].mean, x, y + 36, PAL.W);
  }
  if (B.st === 'incoming') {
    if (blink(4)) text('INCOMING', 180, 360, 3, PAL.R);
    text('TRANSMISSION', 180, 400, 2, PAL.W); mini('WATCH THE GLYPHS. REPEAT THE MESSAGE.', 180, 440, PAL.L);
  } else if (B.st === 'show') {
    const step = G.si >= 3 ? 0.72 : 0.85, i = Math.floor(B.t / step), ph = (B.t % step) / step;
    if (i < n && ph < 0.8) {
      const gi = B.seq[i], gs = glyphSprite(G.si, gi, glyphColor(G.si, gi), '#fff'), kk = 5, sz = backOut(clamp(ph / 0.25, 0, 1));
      panel(110, 330, 140, 150, '#04030c', P.a, P.d, null);
      g.drawImage(gs, q(180) - Math.floor(gs.width * kk * sz / 2) + shx, q(400) - Math.floor(gs.height * kk * sz / 2) + shy, Math.round(gs.width * kk * sz), Math.round(gs.height * kk * sz));
    }
    mini('RECEIVING ' + Math.min(n, i + 1) + '/' + n, 180, 500, P.c);
  } else if (B.st === 'input') {
    mini('REPEAT THE MESSAGE IN ORDER', 180, 322, PAL.W);
    const bw = 78, bh = 76;
    B.opts.forEach((gi, j) => {
      const x = 16 + (j % 4) * 84, y = 340 + Math.floor(j / 4) * 84; const hot = B.press === gi && B.pressT > 0;
      panel(x, y, bw, bh, hot ? P.a : '#05040e', hot ? '#fff' : glyphColor(G.si, gi), PAL.S, null);
      const gs = glyphSprite(G.si, gi, hot ? '#000' : glyphColor(G.si, gi), hot ? null : '#fff'); g.drawImage(gs, q(x + bw / 2) - gs.width + shx, q(y + bh / 2 - 4) - gs.height + shy, gs.width * 2, gs.height * 2);
      if (S.codex[G.si].includes(gi) || G.demo) mini(GLYPHS[G.si][gi].mean, x + bw / 2, y + bh - 9, hot ? '#000' : PAL.L, 'center', null);
    });
    const fr = clamp(B.time / B.timeMax, 0, 1); R(16, 520, 328, 8, '#000'); R(18, 522, 324 * fr, 4, fr < 0.3 ? PAL.R : P.a);
    for (let i = 0; i < 3; i++) text('◆', 150 + i * 30, 546, 1, i < B.strikes ? PAL.R : PAL.S);
  } else if (B.st === 'decoded') {
    text('DECODED!', 180, 380, 3, rainbow(0, 8)); text('+' + B.bonus, 180, 420, 2, PAL.Y);
  } else if (B.st === 'reply') {
    panel(16, 320, 328, 200, '#04030c', P.a, P.d, null);
    mini(s.sp + ' REPLIES:', 30, 334, P.a, 'left');
    let left = Math.floor(B.chars); wrapLines(s.reply, 300, FONT).forEach((l, i) => { if (left <= 0) return; text(l.slice(0, left), 30, 356 + i * 16, 1, PAL.W, 'left'); left -= l.length + 1; });
    if (B.chars >= s.reply.length && blink(2)) mini(G.daily ? 'TAP TO FINISH' : G.si >= 4 ? 'TAP FOR FIRST CONTACT' : 'TAP TO RING-JUMP', 180, 504, PAL.Y);
  }
  updParts(dt);
  credit(630);
  if (G.phase === 'over') drawOver();
}
function drawOver() {
  const O = G.over; dither(0.7);
  text(O.why, 180, 250, 2, PAL.R); mini('THE ALIENS STOPPED LISTENING', 180, 280, PAL.L);
  if (O.phase === 'cont') {
    text('CONTINUE?', 180, 330, 2, PAL.Y); text(String(Math.ceil(O.cd)), 180, 380, 4, PAL.W);
    button(40, 430, 130, 54, 'YES', doContinue, { col: PAL.E, sub: 'SCORE -20%' }); button(190, 430, 130, 54, 'END', giveUp, { col: PAL.R });
  }
}
function drawJump() {
  const t = G.phT, P = SECTORS[Math.min(4, G.si + 1)].pal, P0 = sec().pal;
  g.fillStyle = '#000'; g.fillRect(0, 0, BW, BH);
  const sp = Math.min(1, t / 1.4) ** 2 * 6 + 0.3;
  for (const s of nebula) { const ang = Math.atan2(s.y - BH / 2, s.x - BW / 2); s.x += Math.cos(ang) * sp * 60 * 0.016 * s.z * 3; s.y += Math.sin(ang) * sp * 60 * 0.016 * s.z * 3; if (s.x < 0 || s.x > BW || s.y < 0 || s.y > BH) { s.x = BW / 2 + (Math.random() - 0.5) * 20; s.y = BH / 2 + (Math.random() - 0.5) * 20; } lineB(s.x, s.y, s.x - Math.cos(ang) * sp * 3, s.y - Math.sin(ang) * sp * 3, s.z > 0.6 ? '#fff' : PAL.L); }
  for (let i = 0; i < 9; i++) {
    const z = ((i / 9 + t * 0.6 * (1 + t)) % 1); const r = 4 + z * z * 160;
    const col = t < 1.6 ? (i % 2 ? P0.a : P0.b) : (i % 2 ? P.a : P.b);
    const pts = 6; for (let k = 0; k < pts; k++) { const a1 = k / pts * TAU + t * (i % 2 ? 1 : -1), a2 = (k + 1) / pts * TAU + t * (i % 2 ? 1 : -1); lineB(BW / 2 + Math.cos(a1) * r, BH / 2 + Math.sin(a1) * r * 1.2, BW / 2 + Math.cos(a2) * r, BH / 2 + Math.sin(a2) * r * 1.2, col, k % 2 ? 2 : 0); }
  }
  if (t > 1.5 && t < 1.8) { flash = 1 - (t - 1.5) / 0.3; flashCol = '#fff'; }
  text('RING JUMP', 180, 120, 2, blink(4) ? PAL.W : P0.a);
  if (t > 1.8) { text('NEXT: SECTOR ' + (G.si + 2), 180, 480, 1, PAL.W); text(SECTORS[G.si + 1].n, 180, 506, 2, P.a); }
  addShake(t < 1.6 ? 2 + t * 2 : 1);
}
function drawEnding(dt) {
  const t = G.ending ? G.ending.t : 0; drawBackground(dt, SECTORS[4].pal, 0.6);
  // homeworld
  const X = q(180), Y = q(220); for (let r = 26; r > 0; r--) discB(X, Y, r, mix('#1a0e3a', '#e8e0ff', 1 - r / 26));
  for (let k = 0; k < 80; k++) { const a = k / 80 * TAU + T * 0.3; const xx = X + Math.cos(a) * 42, yy = Y + Math.sin(a) * 9; if (Math.sin(a) < 0 || Math.abs(xx - X) > 26) Rb(Math.round(xx), Math.round(yy), 1, 1, RAINBOW[k % 6]); }
  drawEmblem(180, 220, 0.6, T, 1);
  const lines = ['FIRST CONTACT', 'ESTABLISHED', '', 'HOMEWORLD COORDINATES', 'KX-0 · 00:00:01 · ORIGIN', '', 'ALL FIVE SPECIES DECODED', 'SCORE ' + pad7(G.score), '', 'DESIGN AND CODE BY', 'KXZ0TN AND NOVA', '', 'THANK YOU FOR LISTENING'];
  let yy0 = 318; lines.forEach((l, i) => { const y = yy0 - Math.max(0, t - 6) * 12; yy0 += i < 2 ? 30 : 18; if (y > 300 && y < 600 && t > i * 0.35) text(l, 180, y, i < 2 ? 2 : 1, i < 2 ? rainbow(i, 4) : i === 4 ? PAL.Y : PAL.W); });
  updParts(dt);
  if (t > 4 && blink(2)) mini('TAP TO CONTINUE', 180, 610, PAL.L);
}
