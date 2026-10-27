/* KRYPTEX: screens, boot intro, attract mode, codex, settings, input and main loop. Original. MIT (c) 2026 kxz0tn */
'use strict';
/* ---------- immediate-mode buttons ---------- */
let ui = [], uiDone = [], press = null;
function button(x, y, w, h, label, fn, o = {}) {
  const col = o.col || PAL.C;
  const hot = press && press.btn && press.btn.label === label && press.btn.x === x && press.btn.y === y;
  if (o.disabled) panel(x, y, w, h, PAL.N, PAL.S, null, null);
  else if (hot) panel(x, y, w, h, col, PAL.W, null, null);
  else panel(x, y, w, h, o.fill || PAL.D, col, o.hi || PAL.S, PAL.K);
  const tc = o.disabled ? PAL.G : hot ? PAL.K : PAL.W, k = o.k || 1;
  if (o.sub) { text(label, x + w / 2, y + h / 2 - 7, k, tc, 'center', hot ? null : PAL.K); mini(o.sub, x + w / 2, y + h / 2 + 11, o.disabled ? PAL.S : hot ? PAL.K : col, 'center', null); }
  else text(label, x + w / 2, y + h / 2 + 1, k, tc, 'center', hot ? null : PAL.K, o.mini ? MINI : FONT);
  if (!o.disabled) ui.push({ x, y, w, h, label, fn, now: o.now });
}
function hit(list, px, py) { for (let i = list.length - 1; i >= 0; i--) { const b = list[i]; if (px >= b.x && px <= b.x + b.w && py >= b.y && py <= b.y + b.h) return b; } return null; }
function header(title, back = 'menu') {
  R(0, 0, W, 60, '#000'); R(0, 60, W, 2, PAL.C); text(title, 180, 30, 2, PAL.C);
  button(10, 12, 40, 36, '◀', () => { screen = back; });
}
function credit(y = 628) { mini('DESIGN AND CODE BY KXZ0TN AND NOVA', 180, y, PAL.G); }
function drawToasts(dt) {
  if (screen === 'initials' || screen === 'attract' || screen === 'boot') return;
  let y = 176;
  for (let i = 0; i < toasts.length && i < 2; i++) {
    const t = toasts[i]; t.life -= dt;
    if (t.life < 2.4 && t.life > 0.2 || blink(6)) { panel(24, y, 312, 40, PAL.N, t.col, PAL.S, PAL.K); text(t.t, 180, y + 13, 1, t.col); mini(t.sub || '', 180, y + 28, PAL.L); }
    y += 46;
  }
  for (let i = toasts.length - 1; i >= 0; i--) if (toasts[i].life <= 0) toasts.splice(i, 1);
}

/* ---------- boot intro: the HEX CODE chip assembles from circuit traces, powers on, the name decodes (js/boot.js) ---------- */
const BOOT = { t: 0, done: false };
const BOOT_LEN = KXBoot.LEN;
function drawBoot(dt) {
  BOOT.t += dt; g.fillStyle = '#000'; g.fillRect(0, 0, BW, BH);
  if (BOOT.t >= BOOT_LEN) endBoot();
}
function endBoot() { if (BOOT.done) return; BOOT.done = true; screen = 'attract'; attractT = 0; G = null; }

/* ---------- attract mode ---------- */
let attractT = 0, credits = 0;
const ATTRACT_LEN = 30;
function drawAttract(dt) {
  attractT += dt; const ph = attractT % ATTRACT_LEN;
  if (!G || !G.demo) startDemo();
  update(dt); drawGame(dt);
  if (ph < 10 || ph >= 23) dither(ph < 10 ? 0.75 : 0.85);
  if (ph < 10) {
    drawEmblem(180, 170, 1.3, T, 1); drawWordmark(WORD, 180, 262);
    mini('ALIEN CIPHER MEMORY ARCADE', 180, 292, PAL.C);
    if (blink(1.2)) text(credits ? 'PRESS START' : 'INSERT COIN', 180, 370, 2, credits ? PAL.E : PAL.Y);
    text('1 COIN  1 PLAY', 180, 414, 1, PAL.W);
    const top = hsList('campaign')[0]; text('HI ' + pad7(top.s) + '  ' + top.n, 180, 444, 1, PAL.R);
  } else if (ph < 16) {
    R(0, 100, W, 420, '#000'); drawHSTable('campaign', 120, -1, true);
  } else if (ph < 23) {
    R(0, 300, W, 26, '#000'); if (blink(1)) text('DEMO PLAY', 180, 313, 1, PAL.Y);
  } else {
    R(0, 90, W, 460, '#000');
    text('HOW TO PLAY', 180, 110, 2, PAL.Y);
    const rows = [['FLIP TWO CARDS', 'MATCHING GLYPHS DECODE A WORD', PAL.C], ['FILL THE STAR MAP', 'EVERY WORD LIGHTS A STAR', PAL.Y], ['ROSETTA', 'MATCH A GLYPH TO ITS COLOR, SOUND OR STAR', PAL.M], ['LIVING GLYPHS', 'THEY DRIFT, ROTATE AND SWAP. TRACK THEM', PAL.E], ['STATIC', 'TAP NOISE FAST TO CLEAR IT', PAL.R], ['DEEP SCAN', 'FULL RESONANCE REVEALS 3 GLYPHS', PAL.C], ['BOSS TRANSMISSION', 'REPEAT THE ALIEN MESSAGE', PAL.O]];
    rows.forEach(([a, b, c], i) => { const y = 150 + i * 50; text(a, 180, y, 1, c); mini(b, 180, y + 16, PAL.L); });
  }
  R(0, 0, W, 56, '#000'); text('1UP', 50, 14, 1, PAL.R); text(pad7(0), 50, 34, 1, PAL.W);
  text('HI-SCORE', 250, 14, 1, PAL.R); text(pad7(hsList('campaign')[0].s), 250, 34, 1, PAL.Y);
  R(0, 596, W, 44, '#000'); text('CREDIT ' + credits, 300, 610, 1, PAL.W); credit(630);
  mini(credits ? 'TAP TO START' : 'TAP TO INSERT COIN', 80, 610, credits && blink(2) ? PAL.E : PAL.L);
}
function attractTap() {
  KXAudio.init();
  if (!credits) { credits = 1; KXAudio.sfx.coin(); attractT = 0; return; }
  credits = 0; KXAudio.sfx.start(); G = null; parts.length = 0; screen = 'menu'; KXAudio.setInGame(false);
}
function drawHSTable(mode, y0, hl, big) {
  const list = hsList(mode);
  text(big ? 'HIGH SCORES' : HS_LABEL[mode], 180, y0, 2, rainbow(0, 4));
  if (big) mini(HS_LABEL[mode], 180, y0 + 22, PAL.L);
  mini('RANK  SCORE    NAME  SEC', 180, y0 + 44, PAL.G);
  list.forEach((e, i) => {
    const y = y0 + 66 + i * 28; if (i === hl && !blink(4)) return;
    const col = i === hl ? PAL.W : [PAL.Y, PAL.L, PAL.O][i] || [PAL.C, PAL.E, PAL.M][(i - 3) % 3];
    text(ord(i + 1).padStart(4, ' '), 70, y, 1, col, 'right'); text(pad7(e.s), 180, y, 1, col, 'right'); text(e.n, 226, y, 1, col, 'center'); text(String(e.st || 1), 290, y, 1, col, 'right');
  });
}

/* ---------- menu ---------- */
function drawMenu(dt) {
  drawBackground(dt, SECTORS[0].pal, 0.5);
  drawEmblem(180, 112, 1.2, T, 1); drawWordmark(WORD, 180, 196); mini('DECODE THE SIGNAL', 180, 224, PAL.C);
  const u = S.camp.unlocked;
  button(30, 250, 300, 56, 'CAMPAIGN', () => withTut(() => { screen = 'campaign'; }), { col: PAL.C, sub: 'SECTOR ' + (u + 1) + ' OF 5 UNLOCKED', k: 2 });
  const dBest = S.daily.date === todayKey() ? S.daily.best : 0;
  button(30, 316, 300, 56, 'DAILY SIGNAL', () => withTut(() => startGame('daily')), { col: PAL.Y, sub: todayKey() + (dBest ? ' · BEST ' + dBest : ' · NEW TODAY'), k: 2 });
  const tot = S.codex.reduce((a, c) => a + c.length, 0);
  button(30, 382, 300, 50, 'CODEX', () => { screen = 'codex'; }, { col: PAL.M, sub: tot + ' / 90 GLYPHS DECODED' });
  button(30, 442, 145, 46, 'SCORES', () => { hsView = { mode: 'campaign', hl: -1 }; screen = 'scores'; }, { col: PAL.O });
  button(185, 442, 145, 46, 'SETTINGS', () => { screen = 'settings'; }, { col: PAL.G });
  button(30, 498, 300, 44, 'HOW TO PLAY', () => { tutPage = 0; tutThen = null; screen = 'tutorial'; }, { col: PAL.E });
  mini('PORTRAIT ARCADE · TAP TO PLAY · WORKS OFFLINE', 180, 568, PAL.G);
  credit(628);
}
let tutPage = 0, tutThen = null;
function withTut(fn) { if (S.tut) fn(); else { tutPage = 0; tutThen = fn; screen = 'tutorial'; } }
function drawCampaign(dt) {
  drawBackground(dt, SECTORS[0].pal, 0.5); header('CAMPAIGN');
  SECTORS.forEach((s, i) => {
    const y = 76 + i * 98, locked = i > S.camp.unlocked;
    if (locked) { panel(14, y, 332, 88, PAL.N, PAL.S, null, null); text('SECTOR ' + (i + 1), 120, y + 30, 1, PAL.G, 'left'); mini('SIGNAL NOT YET RECEIVED', 120, y + 52, PAL.S, 'left'); text('?', 62, y + 44, 3, PAL.S); return; }
    button(14, y, 332, 88, 'S' + i, () => startGame('campaign', i), { col: s.pal.a, fill: '#05040e' });
    R(16, y + 2, 328, 84, '#05040e');
    const pt = PORTRAIT[i][blink(0.6, i) ? 0 : 1]; g.drawImage(pt, q(62) - pt.width + shx, q(y + 44) - pt.height + shy, pt.width * 2, pt.height * 2);
    text('SECTOR ' + (i + 1), 116, y + 20, 1, PAL.W, 'left'); text(s.n, 116, y + 40, 1, s.pal.a, 'left');
    mini(s.sp + ' · ' + s.cols + 'X' + s.rows + ' GRID', 116, y + 58, PAL.L, 'left');
    mini(i < S.camp.cleared ? '★ CLEARED' : 'READY', 116, y + 74, i < S.camp.cleared ? PAL.Y : PAL.E, 'left');
    box(14, y, 332, 88, s.pal.a);
  });
  credit(628);
}
/* ---------- codex ---------- */
let codexSp = 0, codexSel = -1;
function drawCodex(dt) {
  const s = SECTORS[codexSp], P = s.pal; drawBackground(dt, P, 0.4); header('CODEX');
  SECTORS.forEach((x, i) => { const on = i === codexSp; button(10 + i * 69, 70, 64, 34, 'S' + (i + 1), () => { codexSp = i; codexSel = -1; }, { col: x.pal.a, fill: on ? x.pal.d : PAL.D }); });
  const cx = S.codex[codexSp], known = cx.length > 0 || codexSp <= S.camp.unlocked;
  if (!known) { text('?????', 180, 200, 2, PAL.S); wrap('NO SIGNAL FROM THIS SECTOR YET. KEEP DECODING TO REACH IT.', 180, 240, 280, PAL.G); credit(628); return; }
  text(s.sp, 180, 124, 2, P.a); mini(cx.length + ' / 18 GLYPHS · ' + s.n, 180, 146, PAL.L);
  for (let i = 0; i < 18; i++) {
    const x = 18 + (i % 6) * 54, y = 160 + Math.floor(i / 6) * 54, have = cx.includes(i), on = codexSel === i;
    panel(x, y, 50, 50, on ? P.d : '#05040e', have ? (on ? '#fff' : glyphColor(codexSp, i)) : PAL.S, null, null);
    if (have) { const gs = glyphSprite(codexSp, i, glyphColor(codexSp, i), '#fff'); g.drawImage(gs, q(x + 25) - gs.width + shx, q(y + 25) - gs.height + shy, gs.width * 2, gs.height * 2); ui.push({ x, y, w: 50, h: 50, label: 'cg' + i, fn: () => { codexSel = i; KXAudio.sfx.tone(i); } }); }
    else text('?', x + 25, y + 26, 1, PAL.S);
  }
  // detail
  panel(14, 326, 332, 120, '#04030c', P.d, null, null);
  if (codexSel >= 0) {
    const gl = GLYPHS[codexSp][codexSel], gs = glyphSprite(codexSp, codexSel, glyphColor(codexSp, codexSel), '#fff');
    g.drawImage(gs, q(70) - Math.floor(gs.width * 2) + shx, q(386) - Math.floor(gs.height * 2) + shy, gs.width * 4, gs.height * 4);
    text(gl.word, 130, 350, 2, P.a, 'left'); text('= ' + gl.mean, 130, 378, 1, PAL.W, 'left');
    mini((gl.hueN ? 'COLOR ' + gl.hueN + ' · ' : '') + 'TONE ♪' + (codexSel + 1) + ' · STAR ' + (codexSel + 1), 130, 400, PAL.L, 'left');
    mini('TAP A GLYPH TO HEAR IT', 130, 420, PAL.G, 'left');
  } else wrap('TAP A DECODED GLYPH TO READ IT', 180, 380, 300, PAL.G);
  // lore
  const n = s.cols * s.rows / 2; mini('LORE', 24, 462, P.a, 'left');
  s.lore.forEach((l, i) => {
    const need = Math.ceil(n * (i + 1) / 3); const y = 480 + i * 46;
    if (cx.length >= need) wrap(l, 24, y, 316, PAL.W, 'left', MINI, 1, 11);
    else mini('LOCKED · DECODE ' + (need - cx.length) + ' MORE GLYPHS', 24, y, PAL.S, 'left');
  });
  credit(628);
}
/* ---------- settings ---------- */
let confirmReset = 0;
function drawSettings(dt) {
  drawBackground(dt, SECTORS[0].pal, 0.4); header('SETTINGS');
  const st = S.set; const y0 = 84;
  const row = (i, label, val, fn, col = PAL.C) => { const y = y0 + i * 58; text(label, 24, y + 22, 1, PAL.W, 'left'); button(206, y, 130, 44, val, fn, { col }); };
  const step = v => Math.round(((v + 0.2) > 1.01 ? 0 : v + 0.2) * 10) / 10;
  row(0, 'SOUND', st.mute ? 'OFF' : 'ON', () => { st.mute = !st.mute; applyAudio(); save(); }, st.mute ? PAL.R : PAL.E);
  row(1, 'MUSIC', Math.round(st.music * 100) + '%', () => { st.music = step(st.music); applyAudio(); save(); });
  row(2, 'EFFECTS', Math.round(st.sfx * 100) + '%', () => { st.sfx = step(st.sfx); applyAudio(); save(); KXAudio.sfx.match(3); });
  row(3, 'HAPTICS', st.vib ? 'ON' : 'OFF', () => { st.vib = !st.vib; save(); vib(30); }, st.vib ? PAL.E : PAL.R);
  row(4, 'SCREEN SHAKE', st.shake ? 'ON' : 'OFF', () => { st.shake = !st.shake; save(); }, st.shake ? PAL.E : PAL.R);
  row(5, 'CRT FX', st.fx === 'low' ? 'LOW' : 'HIGH', () => { st.fx = st.fx === 'low' ? 'high' : 'low'; FX_LOW = st.fx === 'low'; resize(); save(); }, PAL.M);
  button(24, 446, 312, 44, confirmReset > 0 ? 'TAP AGAIN TO ERASE' : 'RESET SAVE', () => {
    if (confirmReset > 0) { localStorage.removeItem(SKEY); load(); applyAudio(); confirmReset = 0; toast('SAVE ERASED', 'A FRESH SIGNAL', PAL.R); } else confirmReset = 3;
  }, { col: PAL.R });
  confirmReset = Math.max(0, confirmReset - dt);
  mini('KRYPTEX V1.0 · MIT LICENSE', 180, 520, PAL.L);
  mini('ALL ART, FONTS AND AUDIO GENERATED IN CODE', 180, 538, PAL.G);
  mini('SAVES STAY ON THIS DEVICE', 180, 556, PAL.G);
  credit(628);
}
/* ---------- tutorial ---------- */
const TUT = [
  ['FLIP TWO', 'TAP TWO CARDS. IF THE GLYPHS MATCH, YOU DECODE AN ALIEN WORD AND LIGHT A STAR ON THE MAP.'],
  ['ROSETTA', 'IN WAVE 2 MATCH EACH GLYPH TO ITS MEANING: ITS COLOR, ITS SOUND, OR ITS STAR ON THE MAP.'],
  ['LIVING SIGNALS', 'GLYPHS DRIFT, ROTATE AND SWAP PLACES. STATIC CORRUPTS CARDS AND DRAINS TIME. TAP IT FAST 3 TIMES.'],
  ['COMBO & SCAN', 'MATCH IN A ROW FOR UP TO X8. FULL RESONANCE GIVES A DEEP SCAN THAT REVEALS 3 GLYPHS.'],
  ['BOSS TRANSMISSION', 'COMPLETE THE STAR MAP AND THE ALIENS CALL. WATCH THEIR MESSAGE, THEN REPEAT IT TO RING-JUMP.'],
];
function finishTut() { S.tut = true; save(); if (tutThen) { const f = tutThen; tutThen = null; f(); } else screen = 'menu'; }
function drawTutorial(dt) {
  drawBackground(dt, SECTORS[tutPage % 5].pal, 0.4); header('HOW TO PLAY');
  const [t, d] = TUT[tutPage]; const P = SECTORS[tutPage % 5].pal;
  text((tutPage + 1) + '/' + TUT.length, 180, 84, 1, PAL.G); text(t, 180, 112, 2, P.a);
  panel(40, 140, 280, 220, '#04030c', P.d, null, null);
  const si = tutPage % 5;
  if (tutPage === 0) { [0, 1].forEach(i => { const x = 120 + i * 120, X = q(x) - 18, Y = q(250) - 24; g.fillStyle = P.a; g.fillRect(X, Y, 36, 48); g.fillStyle = '#04030a'; g.fillRect(X + 1, Y + 1, 34, 46); const gs = glyphSprite(si, 2, glyphColor(si, 2), '#fff'); g.drawImage(gs, X + 18 - gs.width, Y + 24 - gs.height, gs.width * 2, gs.height * 2); }); text('=', 180, 250, 2, PAL.Y); mini(GLYPHS[si][2].word + ' = ' + GLYPHS[si][2].mean, 180, 330, PAL.W); }
  if (tutPage === 1) { const gs = glyphSprite(si, 1, glyphColor(si, 1), '#fff'); g.drawImage(gs, q(100) - gs.width, q(250) - gs.height, gs.width * 2, gs.height * 2); text('▶', 150, 250, 1, PAL.Y); R(184, 232, 36, 36, GLYPHS[si][1].hue || PAL.C); mini('COLOR', 202, 286, PAL.L); text('♪', 250, 250, 2, P.a); mini('SOUND', 250, 286, PAL.L); text('⌖', 294, 250, 2, PAL.Y); mini('STAR', 294, 286, PAL.L); }
  if (tutPage === 2) { for (let i = 0; i < 3; i++) { const X = q(100 + i * 80) - 16, Y = q(250) - 22; g.drawImage(cardBack(si, 32, 44), X + Math.round(Math.sin(T * 2 + i) * 2), Y + Math.round(Math.cos(T * 2 + i) * 2)); if (i === 2) drawNoise(X, Y, 32, 44, { noise: 3 - Math.floor(T % 3), noiseT: 0 }); } mini('DRIFT · SWAP · STATIC', 180, 330, PAL.W); }
  if (tutPage === 3) { text('X8', 120, 250, 3, rainbow(0, 6)); panel(180, 236, 120, 24, '#000', PAL.S, null, null); R(184, 240, 112 * ((T * 0.4) % 1), 16, P.a); mini('RESONANCE', 240, 276, PAL.L); }
  if (tutPage === 4) { const pt = PORTRAIT[si][blink(1) ? 0 : 1]; g.drawImage(pt, q(180) - pt.width, q(240) - pt.height, pt.width * 2, pt.height * 2); mini('REPEAT THE MESSAGE', 180, 330, PAL.W); }
  wrap(d, 180, 386, 290, PAL.W);
  button(30, 540, 140, 50, 'SKIP', finishTut, { col: PAL.G });
  button(190, 540, 140, 50, tutPage < TUT.length - 1 ? 'NEXT ▶' : 'PLAY!', () => { if (tutPage < TUT.length - 1) tutPage++; else finishTut(); }, { col: PAL.E });
  credit(628);
}
/* ---------- pause ---------- */
function drawPause() {
  dither(0.75); text('PAUSED', 180, 200, 3, PAL.C);
  button(60, 260, 240, 54, 'RESUME', () => { screen = 'game'; }, { col: PAL.E, k: 2 });
  if (!G.daily) button(60, 326, 240, 48, 'RESTART SECTOR', () => { const m = G.mode, s = G.si; startGame(m, s); }, { col: PAL.Y });
  button(60, 386, 240, 48, 'SOUND: ' + (S.set.mute ? 'OFF' : 'ON'), () => { S.set.mute = !S.set.mute; applyAudio(); save(); }, { col: PAL.C });
  button(60, 446, 240, 48, 'QUIT TO MENU', () => { G = null; screen = 'menu'; KXAudio.setInGame(false); KXAudio.setBoss(false); KXAudio.setDanger(0); }, { col: PAL.R });
}
/* ---------- results, initials, scores ---------- */
function drawResults(dt) {
  const r = results; r.t += dt; drawBackground(dt, SECTORS[Math.min(4, r.st - 1)].pal, 0.4);
  text(r.victory ? (r.mode === 'daily' ? 'SIGNAL DECODED' : 'FIRST CONTACT') : 'SIGNAL LOST', 180, 90, 2, r.victory ? rainbow(0, 4) : PAL.R);
  mini(HS_LABEL[r.mode], 180, 116, PAL.L);
  text(pad7(Math.min(r.score, Math.floor(r.score * clamp(r.t / 1.2, 0, 1)))), 180, 160, 3, PAL.W);
  const rows = [['SECTORS CLEARED', r.sectors], ['WORDS DECODED', r.glyphs], ['MAX COMBO', r.maxCombo], ['ACCURACY', r.acc + '%']];
  rows.forEach(([a, b], i) => { if (r.t > 0.4 + i * 0.25) { text(a, 40, 220 + i * 36, 1, PAL.L, 'left'); text(String(b), 320, 220 + i * 36, 1, PAL.Y, 'right'); } });
  const list = hsList(r.mode), pos = list.findIndex(e => r.score > e.s);
  if (pos >= 0 && r.t > 1.4) { if (blink(2)) text('NEW HIGH SCORE!', 180, 390, 2, PAL.Y); button(60, 440, 240, 56, 'ENTER INITIALS', () => { entry = { mode: r.mode, score: r.score, st: r.st, pos, i: 0, l: S.ini.split('').map(c => Math.max(0, INI_CH.indexOf(c))), timer: 30, done: false }; screen = 'initials'; }, { col: PAL.E, k: 2 }); }
  else if (r.t > 1.4) { button(30, 440, 140, 50, 'AGAIN', () => startGame(r.mode, r.mode === 'daily' ? 0 : Math.min(S.camp.unlocked, r.st - 1)), { col: PAL.E }); button(190, 440, 140, 50, 'MENU', () => { screen = 'menu'; }, { col: PAL.C }); }
  credit(628);
}
const INI_CH = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.-!★ ';
let entry = null, hsView = { mode: 'campaign', hl: -1 };
function iniMove(d) { const e = entry; e.l[e.i] = (e.l[e.i] + d + INI_CH.length) % INI_CH.length; KXAudio.sfx.letter(); }
function iniOk() { const e = entry; if (e.i < 2) { e.i++; KXAudio.sfx.enter(); return; } commitInitials(); }
function iniDel() { const e = entry; if (e.i > 0) e.i--; KXAudio.sfx.click(); }
function commitInitials() {
  const e = entry; if (e.done) return; e.done = true; const name = e.l.map(i => INI_CH[i]).join(''); S.ini = name;
  const list = hsList(e.mode); list.splice(e.pos, 0, { n: name, s: e.score, st: e.st }); list.length = 10; save();
  KXAudio.sfx.hiscore(); hsView = { mode: e.mode, hl: e.pos }; screen = 'scores';
}
function drawInitials(dt) {
  drawBackground(dt, SECTORS[4].pal, 0.4); const e = entry; e.timer -= dt; if (e.timer <= 0) commitInitials();
  text('GREAT SCORE!', 180, 70, 2, rainbow(0, 6)); text('NEW HIGH SCORE', 180, 108, 1, PAL.W);
  text(`YOU ARE ${ord(e.pos + 1)} IN ${HS_LABEL[e.mode]}`, 180, 130, 1, PAL.Y); text(pad7(e.score), 180, 168, 3, PAL.W);
  mini('ENTER YOUR INITIALS', 180, 206, PAL.L);
  for (let i = 0; i < 3; i++) {
    const x = 100 + i * 80, on = i === e.i; panel(x - 32, 226, 64, 84, on ? PAL.D : PAL.N, on ? PAL.Y : PAL.S, null, null);
    if (!on || blink(3)) text(INI_CH[e.l[i]], x, 268, 5, on ? PAL.Y : PAL.W);
    if (on) { text('▲', x, 218, 1, PAL.Y); text('▼', x, 320, 1, PAL.Y); }
  }
  button(30, 350, 140, 60, '▲', () => iniMove(1), { k: 2 }); button(190, 350, 140, 60, '▼', () => iniMove(-1), { k: 2 });
  button(30, 420, 140, 50, '◀ DEL', iniDel, { col: PAL.R }); button(190, 420, 140, 50, e.i < 2 ? 'NEXT ▶' : 'END', iniOk, { col: PAL.E });
  mini('SWIPE UP/DOWN · TYPE A-Z · ENTER', 180, 494, PAL.G);
  text('TIME ' + Math.max(0, Math.ceil(e.timer)), 180, 524, 1, e.timer < 6 && blink(4) ? PAL.R : PAL.L);
}
function drawScores(dt) {
  drawBackground(dt, SECTORS[0].pal, 0.5); header('HIGH SCORES');
  const i = HS_MODES.indexOf(hsView.mode);
  button(14, 76, 50, 40, '◀', () => { hsView = { mode: HS_MODES[(i + 1) % 2], hl: -1 }; });
  button(296, 76, 50, 40, '▶', () => { hsView = { mode: HS_MODES[(i + 1) % 2], hl: -1 }; });
  drawHSTable(hsView.mode, 96, hsView.hl, false);
  if (hsView.mode === 'daily') mini('TODAY · ' + todayKey() + ' · RESETS AT MIDNIGHT', 180, 440, PAL.G);
  button(30, 556, 140, 50, 'PLAY', () => hsView.mode === 'daily' ? startGame('daily') : (screen = 'campaign'), { col: PAL.E });
  button(190, 556, 140, 50, 'MENU', () => { screen = 'menu'; G = null; });
  credit();
}

/* ---------- input ---------- */
function toLogical(e) { const r = cv.getBoundingClientRect(); return { x: ((e.clientX - r.left) - ox) / sc, y: ((e.clientY - r.top) - oy) / sc }; }
function gameDown(p) {
  if (!G) return;
  const b = hit(uiDone, p.x, p.y);
  if (G.phase === 'over') { press = { x: p.x, y: p.y, btn: b }; return; }
  if (b && (b.label === '||' || b.label === 'DEEP SCAN')) { KXAudio.sfx.click(); b.fn(); return; }
  if (G.phase === 'title') { if (G.phT > 0.5) buildWave(0); return; }
  if (G.phase === 'rosetta') { if (G.phT > 0.8) buildWave(1); return; }
  if (G.phase === 'boss') {
    const B = G.boss;
    if (B.st === 'input') { B.opts.forEach((gi, j) => { const x = 16 + (j % 4) * 84, y = 340 + Math.floor(j / 4) * 84; if (p.x >= x && p.x <= x + 78 && p.y >= y && p.y <= y + 76) bossTap(gi); }); }
    else if (B.st === 'reply') bossAdvance();
    return;
  }
  if (G.phase === 'ending') { if (G.ending && G.ending.t > 4) finishRun(true); return; }
  if (G.phase !== 'wave') return;
  // cards: pick the one under the finger (generous hit box)
  let best = null, bd = 1e9;
  for (const c of G.cards) { if (c.matched) continue; const cp = cardPos(c); const dx = Math.abs(p.x - cp.x), dy = Math.abs(p.y - cp.y); if (dx <= cp.w / 2 + 3 && dy <= cp.h / 2 + 3) { const d = dx + dy; if (d < bd) { bd = d; best = c; } } }
  if (best) tapCard(best);
}
cv.addEventListener('pointerdown', e => {
  e.preventDefault(); KXAudio.init(); const p = toLogical(e);
  try { cv.setPointerCapture(e.pointerId); } catch (_) { /* unsupported */ }
  if (screen === 'boot') { if (BOOT.t > 0.3) endBoot(); return; }
  if (screen === 'attract') { attractTap(); return; }
  if (screen === 'game') { gameDown(p); return; }
  press = { id: e.pointerId, x: p.x, y: p.y, btn: hit(uiDone, p.x, p.y) };
}, { passive: false });
cv.addEventListener('pointermove', e => {
  if (!press) return; const p = toLogical(e), dy = p.y - press.y;
  if (screen === 'initials' && !press.btn && Math.abs(dy) > 30) { iniMove(dy < 0 ? 1 : -1); press.y = p.y; }
});
function endPress(e) {
  if (!press) return;
  if (press.btn) { const p = toLogical(e); const b = hit(uiDone, p.x, p.y); if (b && b.label === press.btn.label && b.x === press.btn.x && b.y === press.btn.y) { KXAudio.sfx.click(); b.fn(); } }
  press = null;
}
cv.addEventListener('pointerup', endPress); cv.addEventListener('pointercancel', endPress);
window.addEventListener('keydown', e => {
  KXAudio.init();
  if (screen === 'boot') { endBoot(); return; }
  if (screen === 'attract') { if (e.key === 'Enter' || e.key === ' ' || e.key === '5') { e.preventDefault(); attractTap(); } return; }
  if (screen === 'initials') {
    e.preventDefault(); const k = e.key.toUpperCase();
    if (e.key === 'ArrowUp') iniMove(1); else if (e.key === 'ArrowDown') iniMove(-1);
    else if (e.key === 'Enter' || e.key === 'ArrowRight') iniOk(); else if (e.key === 'Backspace' || e.key === 'ArrowLeft') iniDel();
    else if (k.length === 1 && INI_CH.includes(k) && k !== ' ') { entry.l[entry.i] = INI_CH.indexOf(k); KXAudio.sfx.letter(); if (entry.i < 2) entry.i++; }
    return;
  }
  if (e.key === 'Escape' || e.key === 'p') { if (screen === 'game' && G && !G.over) screen = 'pause'; else if (screen === 'pause') screen = 'game'; return; }
  if (screen === 'game' && G) {
    if (e.key === ' ' && G.scanReady) useScan();
    if (G.phase === 'boss' && G.boss.st === 'input' && e.key >= '1' && e.key <= '8') { const gi = G.boss.opts[+e.key - 1]; if (gi !== undefined) bossTap(gi); }
    if (e.key === 'Enter') { if (G.phase === 'boss') bossAdvance(); else if (G.phase === 'title') buildWave(0); else if (G.phase === 'over' && G.over.phase === 'cont') doContinue(); }
  }
});
document.addEventListener('visibilitychange', () => { if (document.hidden) { if (screen === 'game' && G && !G.over) screen = 'pause'; KXAudio.suspend(); } else KXAudio.resume(); });

/* ---------- loop ---------- */
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now; T += dt;
  ui = [];
  shake = Math.max(0, shake - dt * 22); flash = Math.max(0, flash - dt * 2.2);
  shx = shake > 0.3 ? Math.round((Math.random() - 0.5) * shake) : 0; shy = shake > 0.3 ? Math.round((Math.random() - 0.5) * shake) : 0;
  try {
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    if (screen === 'game') update(dt);
    if (screen === 'game' || screen === 'pause') { drawGame(screen === 'pause' ? 0 : dt); if (screen === 'pause') { shx = shy = 0; drawPause(); } }
    else if (screen === 'boot') drawBoot(dt);
    else if (screen === 'attract') drawAttract(dt);
    else if (screen === 'menu') drawMenu(dt);
    else if (screen === 'campaign') drawCampaign(dt);
    else if (screen === 'codex') drawCodex(dt);
    else if (screen === 'settings') drawSettings(dt);
    else if (screen === 'tutorial') drawTutorial(dt);
    else if (screen === 'results') drawResults(dt);
    else if (screen === 'initials') drawInitials(dt);
    else if (screen === 'scores') drawScores(dt);
    drawToasts(dt);
    uiDone = ui;
    const low = screen === 'game' && G && G.phase === 'wave' && !G.demo ? clamp(0.2 - G.time / G.timeMax, 0, 0.2) : 0;
    if (screen === 'boot' && !BOOT.done) KXBoot.draw(ctx, cv.width, cv.height, ox * dpr, oy * dpr, W * sc * dpr, H * sc * dpr, BOOT.t, FX_LOW, S.set.fx !== 'low');
    else present(low);
    if (screen !== 'game') KXAudio.setIntensity(0.1);
  } catch (err) { console.error(err); }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

/* test + debug hook (read-only helpers) */
window.KX = {
  get G() { return G; }, get screen() { return screen; }, get S() { return S; }, set screen(v) { screen = v; },
  startGame, cardPos, endBoot, bossTap, bossAdvance, useScan, finishRun, get results() { return results; },
  toScreen(x, y) { return { x: ox + x * sc, y: oy + y * sc }; },
  boot: BOOT,
  // test-only fast-forward: solve the current wave through the normal match() path
  solveWave() { if (!G || G.phase !== 'wave') return false; G.sel = []; G.pending = null; const left = G.cards.filter(c => !c.matched); for (const a of left) { if (a.matched) continue; const b = left.find(c => c !== a && !c.matched && c.gi === a.gi); if (b) { G.attempts++; match(a, b); } } return true; },
};
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
