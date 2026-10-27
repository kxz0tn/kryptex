/* KRYPTEX boot sequence: the HEX CODE chip assembles from circuit traces, powers on, and the name decodes.
   Drawn at full display resolution, straight onto the screen canvas. All original. MIT (c) 2026 kxz0tn */
'use strict';
const KXBoot = (() => {
  const TAU = Math.PI * 2, cl = (v, a, b) => v < a ? a : v > b ? b : v, lp = (a, b, t) => a + (b - a) * t;
  const eo = t => 1 - Math.pow(1 - cl(t, 0, 1), 3), ei = t => cl(t, 0, 1) * cl(t, 0, 1);
  const PU = '#8a3cff', LAV = '#b48cff', PALE = '#e8e0ff', CY = '#22e2ff';
  const KB = ['10001', '10010', '10100', '11000', '10100', '10010', '10001'];
  // stroke letterforms on a 4x6 grid (shared with the logo art)
  const LET = {
    A: [[[0, 6], [0, 1.5], [1.5, 0], [2.5, 0], [4, 1.5], [4, 6]], [[0, 3.5], [4, 3.5]]], C: [[[4, 0], [1, 0], [0, 1], [0, 5], [1, 6], [4, 6]]],
    D: [[[0, 0], [0, 6], [2.8, 6], [4, 4.8], [4, 1.2], [2.8, 0], [0, 0]]], E: [[[4, 0], [0, 0], [0, 6], [4, 6]], [[0, 3], [3, 3]]],
    H: [[[0, 0], [0, 6]], [[4, 0], [4, 6]], [[0, 3], [4, 3]]], K: [[[0, 0], [0, 6]], [[4, 0], [0, 3.6]], [[1.4, 2.4], [4, 6]]],
    M: [[[0, 6], [0, 0], [2, 2.6], [4, 0], [4, 6]]], N: [[[0, 6], [0, 0], [4, 6], [4, 0]]], O: [[[1, 0], [3, 0], [4, 1], [4, 5], [3, 6], [1, 6], [0, 5], [0, 1], [1, 0]]],
    P: [[[0, 6], [0, 0], [3.1, 0], [4, 0.9], [4, 2.1], [3.1, 3], [0, 3]]], R: [[[0, 6], [0, 0], [3.1, 0], [4, 0.9], [4, 2.1], [3.1, 3], [0, 3]], [[2, 3], [4, 6]]],
    S: [[[4, 0], [1, 0], [0, 1], [0, 2.2], [0.8, 3], [3.2, 3], [4, 3.8], [4, 5], [3, 6], [0, 6]]], T: [[[0, 0], [4, 0]], [[2, 0], [2, 6]]],
    X: [[[0, 0], [4, 6]], [[4, 0], [0, 6]]], Y: [[[0, 0], [2, 3]], [[4, 0], [2, 3]], [[2, 3], [2, 6]]], Z: [[[0, 0], [4, 0], [0, 6], [4, 6]]],
    V: [[[0, 0], [2, 6], [4, 0]]], L: [[[0, 0], [0, 6], [4, 6]]], F: [[[4, 0], [0, 0], [0, 6]], [[0, 3], [3, 3]]],
  };
  const SCR = Object.keys(LET);
  // H's six chip traces (units of hex radius), each extended as a bus line out to the edge of the screen
  const TR = [
    [[-.82, -.38], [-1.05, -.38], [-1.05, -.62], [-1.05, -1.25], [-1.45, -1.25], [-2.2, -1.25]],
    [[.82, -.38], [1.07, -.38], [1.3, -.62], [1.3, -1.6], [2.2, -1.6]],
    [[-.82, .46], [-.97, .62], [-1.2, .62], [-1.45, .62], [-1.45, 1.1], [-2.2, 1.1]],
    [[.82, .46], [1.03, .62], [1.4, .62], [1.4, .95], [2.2, .95]],
    [[0, -1], [0, -1.19], [.35, -1.45], [.35, -2.0], [.35, -3.0]],
    [[0, 1], [0, 1.16], [-.22, 1.3], [-1.0, 1.3], [-2.2, 1.3]],
    [[-.5, -.87], [-.62, -1.2], [-.62, -3.0]],
    [[.5, .87], [.62, 1.12], [1.15, 1.12], [1.3, 1.25], [2.2, 1.25]],
  ];
  const plen = p => { let L = 0; for (let i = 1; i < p.length; i++) L += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); return L; };
  function partial(x, p, from, to) { // stroke the [from,to] fraction of polyline p (fractions measured from p's end, i.e. inward)
    const L = plen(p); let acc = 0; x.beginPath(); let started = false;
    const a0 = (1 - to) * L, a1 = (1 - from) * L; // measure from the start point (hex side)
    for (let i = 1; i < p.length; i++) {
      const A = p[i - 1], B = p[i], l = Math.hypot(B[0] - A[0], B[1] - A[1]); const s0 = acc, s1 = acc + l; acc = s1;
      if (s1 < a0 || s0 > a1) continue;
      const u0 = cl((a0 - s0) / l, 0, 1), u1 = cl((a1 - s0) / l, 0, 1);
      const P0 = [lp(A[0], B[0], u0), lp(A[1], B[1], u0)], P1 = [lp(A[0], B[0], u1), lp(A[1], B[1], u1)];
      if (!started) { x.moveTo(P0[0], P0[1]); started = true; } x.lineTo(P1[0], P1[1]);
    }
    if (started) x.stroke();
  }
  function pointAt(p, f) { // f=0 at outer end, 1 at hex
    const L = plen(p); let tgt = (1 - f) * L, acc = 0;
    for (let i = 1; i < p.length; i++) { const A = p[i - 1], B = p[i], l = Math.hypot(B[0] - A[0], B[1] - A[1]); if (acc + l >= tgt) { const u = (tgt - acc) / l; return [lp(A[0], B[0], u), lp(A[1], B[1], u)]; } acc += l; }
    return p[p.length - 1];
  }
  function hexPath(x, cx, cy, r) { x.beginPath(); for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + i * TAU / 6; const px = cx + Math.cos(a) * r, py = cy + Math.sin(a) * r; i ? x.lineTo(px, py) : x.moveTo(px, py); } x.closePath(); }
  function hexGrow(x, cx, cy, r, f) { // edges grow from every vertex toward the edge midpoints
    const V = []; for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + i * TAU / 6; V.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); }
    x.beginPath();
    for (let i = 0; i < 6; i++) { const A = V[i], B = V[(i + 1) % 6], h = f * 0.5;
      x.moveTo(A[0], A[1]); x.lineTo(lp(A[0], B[0], h), lp(A[1], B[1], h)); x.moveTo(B[0], B[1]); x.lineTo(lp(B[0], A[0], h), lp(B[1], A[1], h)); }
    x.stroke();
  }
  function glowStroke(x, col, lw, blur, fn, core = '#fff', low = false) {
    x.save(); x.lineCap = 'round'; x.lineJoin = 'round';
    const passes = low ? [[0, col, lw], [0, core, lw * 0.4]] : [[blur, col, lw], [blur * 0.35, col, lw], [0, core, lw * 0.4]];
    for (const [b, c, w] of passes) { x.shadowBlur = b; x.shadowColor = col; x.strokeStyle = c; x.lineWidth = w; fn(); }
    x.restore();
  }
  // the chip itself; st = { traces:[0..1], hex:0..1, inner:0..1, body:0..1, k:0..35, lit:0..1, t, low }
  function chip(x, cx, cy, R, st) {
    const low = !!st.low, T = st.t || 0;
    const trs = (st.stub ? TR.slice(0, 6).map((p, i) => p.slice(0, [3, 2, 3, 2, 2, 2][i])) : TR).map(p => p.map(([u, v]) => [cx + u * R, cy + v * R]));
    // traces
    for (let i = 0; i < trs.length; i++) {
      const f = st.traces == null ? 1 : (st.traces[i] ?? 1); if (f <= 0) continue;
      const hot = st.lit || 0;
      glowStroke(x, CY, R * 0.035, R * 0.12 * (0.6 + hot), () => partial(x, trs[i], 0, f), hot > 0.5 ? '#fff' : '#bff6ff', low);
      // solder pad at the hex end once a trace has arrived
      if (f >= 1) { const e = trs[i][0], k = trs[i][1]; x.save(); x.fillStyle = CY; x.shadowBlur = low ? 0 : R * 0.12; x.shadowColor = CY; x.beginPath(); x.arc(k[0], k[1], R * 0.035, 0, TAU); x.fill(); x.restore(); void e; }
      // the travelling packet (head of the trace while it draws, then a looping data pulse)
      const head = f < 1 ? f : ((T * 0.55 + i * 0.29) % 1.4);
      if (head <= 1 && (f < 1 || st.loop)) { const p = pointAt(trs[i], head); x.save(); x.fillStyle = '#fff'; x.shadowBlur = low ? 0 : R * 0.25; x.shadowColor = CY; x.beginPath(); x.arc(p[0], p[1], R * (f < 1 ? 0.05 : 0.03), 0, TAU); x.fill(); x.restore(); }
    }
    // chip body
    if (st.body > 0) {
      x.save(); x.globalAlpha = cl(st.body, 0, 1); hexPath(x, cx, cy, R); const gr = x.createRadialGradient(cx, cy - R * 0.2, R * 0.1, cx, cy, R * 1.05);
      gr.addColorStop(0, '#24124e'); gr.addColorStop(1, '#07031a'); x.fillStyle = gr; x.fill();
      // etched die lines
      x.strokeStyle = 'rgba(180,140,255,0.10)'; x.lineWidth = 1; for (let k = -4; k <= 4; k++) { x.beginPath(); x.moveTo(cx - R * 0.8, cy + k * R * 0.17); x.lineTo(cx + R * 0.8, cy + k * R * 0.17); x.stroke(); }
      x.restore();
    }
    if (st.hex > 0) glowStroke(x, PU, R * 0.062, R * 0.32, () => (st.hex >= 1 ? (hexPath(x, cx, cy, R), x.stroke()) : hexGrow(x, cx, cy, R, st.hex)), '#f0e6ff', low);
    if (st.inner > 0) glowStroke(x, LAV, R * 0.016, R * 0.1, () => (st.inner >= 1 ? (hexPath(x, cx, cy, R * 0.865), x.stroke()) : hexGrow(x, cx, cy, R * 0.865, st.inner)), PALE, low);
    // pixel K
    if (st.k > 0) {
      const u = R * 0.115, kx = cx - 2.5 * u, ky = cy - 3.5 * u; let n = 0;
      x.save(); x.shadowColor = LAV;
      for (let j = 0; j < 7; j++) for (let i = 0; i < 5; i++) {
        if (KB[j][i] !== '1') continue; n++; if (n > st.k) continue;
        const fresh = st.k - n < 2 && st.k < 17; const col = j === 3 ? CY : '#ffffff';
        x.shadowBlur = low ? 0 : u * (fresh ? 2.2 : 1.1); x.shadowColor = j === 3 ? CY : LAV; x.fillStyle = fresh ? '#ffffff' : col;
        x.fillRect(kx + i * u + u * 0.06, ky + j * u + u * 0.06, u * 0.88, u * 0.88);
      }
      x.restore();
    }
  }
  function word(x, s, cx, cy, u, col, lockAt, t, low, rnd) {
    const gap = 1.6, n = s.length, wd = (n * 4 + (n - 1) * gap) * u, ox = cx - wd / 2, oy = cy - 3 * u; const out = [];
    for (let i = 0; i < n; i++) {
      const la = lockAt[i]; if (t < la - 0.32) continue; const locked = t >= la;
      const ch = locked ? s[i] : SCR[Math.floor(rnd() * SCR.length)]; const L = LET[ch]; const bx = ox + i * (4 + gap) * u;
      const c = locked ? col : (i % 2 ? CY : PU), jx = locked ? 0 : (rnd() - 0.5) * u * 0.8;
      const pop = locked ? 1 + Math.max(0, 0.12 - (t - la)) * 3 : 1;
      x.save(); x.translate(bx + 2 * u + jx, oy + 3 * u); x.scale(pop, pop); x.translate(-2 * u, -3 * u);
      glowStroke(x, c, u * 0.9, low ? 0 : u * (locked ? 2.4 : 1.2), () => { for (const pl of L) { x.beginPath(); pl.forEach(([a, b], j) => (j ? x.lineTo(a * u, b * u) : x.moveTo(a * u, b * u))); x.stroke(); } }, locked ? '#fff' : c, low);
      x.restore(); out.push(locked);
    }
    return out;
  }
  // ---- the sequence ----
  const LEN = 3.5;
  const TL = { trace0: 0.12, trace1: 1.0, hex0: 0.82, hex1: 1.3, inner0: 1.08, inner1: 1.45, lit: 1.42, k0: 1.5, k1: 1.86, hit: 1.9, glitch1: 2.22, w0: 2.08, tag: 2.72, credit: 2.85, out0: 3.18 };
  let off = null, ox2 = null, seed = 7;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const st = { fired: {} };
  function once(k, fn) { if (!st.fired[k]) { st.fired[k] = 1; try { fn(); } catch (_) { /* audio may be locked */ } } }
  function draw(ctx, cvW, cvH, gx, gy, gw, gh, t, low, fx) {
    // render the 360x640 scene into an offscreen canvas at display resolution
    const w = Math.max(1, Math.round(gw)), h = Math.max(1, Math.round(gh));
    if (!off || off.width !== w || off.height !== h) { off = document.createElement('canvas'); off.width = w; off.height = h; ox2 = off.getContext('2d'); }
    const x = ox2, s = w / 360; x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
    const bg = x.createRadialGradient(w / 2, h * 0.38, 10, w / 2, h * 0.45, h * 0.75); bg.addColorStop(0, '#120a30'); bg.addColorStop(1, '#010006');
    x.fillStyle = bg; x.fillRect(0, 0, w, h);
    x.setTransform(s, 0, 0, s, 0, 0); x.imageSmoothingEnabled = false;
    const CX = 180, CY0 = 268, R = 94;
    // faint hex lattice + dust
    x.save(); x.globalAlpha = 0.06 + 0.06 * eo((t - 0.1) / 0.8); x.strokeStyle = PU; x.lineWidth = 0.6;
    for (let row = -1; row < 15; row++) for (let col = -1; col < 9; col++) { const hx = col * 48 + (row % 2) * 24, hy = row * 42; hexPath(x, hx, hy, 26); x.stroke(); }
    x.restore();
    seed = 99; for (let i = 0; i < 90; i++) { const px = rnd() * 360, py = (rnd() * 640 + t * (6 + rnd() * 18)) % 640, a = rnd() * 0.6; x.fillStyle = `rgba(232,224,255,${a})`; x.fillRect(px, py, 1, 1); }
    // terminal handshake text (top-left)
    const LINES = ['KX-OS 1.0  CIPHER CORE', 'HANDSHAKE .......... OK', 'SIGNAL LOCK ........ OK', 'DECODER ............ ONLINE'];
    if (t < TL.hit + 0.1) for (let i = 0; i < LINES.length; i++) { const t0 = 0.05 + i * 0.28; if (t < t0) break; const nC = Math.floor(cl((t - t0) / 0.22, 0, 1) * LINES[i].length); strB(x, LINES[i].slice(0, nC), 14, 18 + i * 9, 1, i === 3 ? '#22e2ff' : '#6a5aa8', MINI); }
    // shake on power-on
    const sh = t > TL.hit && t < TL.hit + 0.35 ? (1 - (t - TL.hit) / 0.35) * 6 : 0;
    x.save(); x.translate((Math.random() - 0.5) * sh, (Math.random() - 0.5) * sh);
    // chip zoom: slight overshoot at power-on
    const zoom = 1 + (t > TL.hit ? Math.max(0, 0.08 - (t - TL.hit) * 0.3) : 0) + (t > TL.out0 ? 0 : 0);
    x.translate(CX, CY0); x.scale(zoom, zoom); x.translate(-CX, -CY0);
    const trc = TR.map((_, i) => eo((t - TL.trace0 - i * 0.06) / (TL.trace1 - TL.trace0 - 0.3)));
    const lit = t < TL.lit ? 0 : Math.max(0, 1 - (t - TL.lit) / 0.6);
    chip(x, CX, CY0, R, { traces: trc, hex: eo((t - TL.hex0) / (TL.hex1 - TL.hex0)), inner: eo((t - TL.inner0) / (TL.inner1 - TL.inner0)), body: (t - TL.hex0) / 0.5, k: t < TL.k0 ? 0 : 1 + Math.floor(cl((t - TL.k0) / (TL.k1 - TL.k0), 0, 1) * 16), lit, t, low, loop: t > TL.hit });
    // power-on shockwave rings
    if (t > TL.hit) { for (const [d, c] of [[0, '#ffffff'], [0.08, CY], [0.16, PU]]) { const e = (t - TL.hit - d) / 0.7; if (e > 0 && e < 1) { x.save(); x.globalAlpha = 1 - e; x.strokeStyle = c; x.lineWidth = 3 * (1 - e) + 0.5; hexPath(x, CX, CY0, R * (1 + e * 1.6)); x.stroke(); x.restore(); } } }
    x.restore();
    // wordmark scramble -> lock
    const lockAt = [0, 1, 2, 3, 4, 5, 6].map(i => TL.w0 + 0.12 + i * 0.075);
    const lk = word(x, 'KRYPTEX', 180, 432, 8.2, LAV, lockAt, t, low, rnd);
    lk.forEach((v, i) => { if (v) once('l' + i, () => KXAudio.sfx.letter()); });
    // underline sweep
    if (t > lockAt[6]) { const e = eo((t - lockAt[6]) / 0.35); x.save(); x.shadowBlur = low ? 0 : 8; x.shadowColor = CY; x.fillStyle = CY; x.fillRect(180 - 150 * e, 467, 300 * e, 1.5); x.restore(); }
    // tagline types out
    if (t > TL.tag) { const msg = 'DECODE THE SIGNAL', nC = Math.floor(cl((t - TL.tag) / 0.3, 0, 1) * msg.length), k = 2, wd = tw(msg, k); x.save(); x.shadowBlur = low ? 0 : 6; x.shadowColor = CY; strB(x, msg.slice(0, nC), 180 - wd / 2, 484, k, '#22e2ff', FONT); x.restore(); }
    if (t > TL.credit) { x.save(); x.globalAlpha = eo((t - TL.credit) / 0.3) * 0.85; const c = 'DESIGN AND CODE BY KXZ0TN AND NOVA'; strB(x, c, 180 - tw(c, 1, MINI) / 2, 600, 1, '#8a7ab8', MINI); x.restore(); }
    // tap hint
    if (t > 0.6 && t < TL.out0) { x.save(); x.globalAlpha = 0.35; const c = 'TAP TO SKIP'; strB(x, c, 346 - tw(c, 1, MINI), 622, 1, '#6a5aa8', MINI); x.restore(); }
    x.setTransform(1, 0, 0, 1, 0, 0);
    // scanlines + vignette
    x.fillStyle = 'rgba(0,0,0,0.22)'; const step = Math.max(2, Math.round(2 * s)); for (let yy = 0; yy < h; yy += step) x.fillRect(0, yy, w, Math.max(1, Math.round(s * 0.6)));
    const vg = x.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, h * 0.75); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.65)'); x.fillStyle = vg; x.fillRect(0, 0, w, h);
    // power-on flash
    if (t > TL.hit && t < TL.hit + 0.5) { x.globalAlpha = Math.pow(1 - (t - TL.hit) / 0.5, 2) * 0.85; x.fillStyle = '#e8f8ff'; x.fillRect(0, 0, w, h); x.globalAlpha = 1; }
    // ---- composite to screen, with the glitch and the CRT power-down exit ----
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, cvW, cvH);
    const glitch = (t > TL.hit && t < TL.glitch1) || (t > 2.95 && t < 3.0);
    if (t > TL.out0) { // CRT collapse: squash to a bright line, then a dot
      const e = cl((t - TL.out0) / (LEN - TL.out0), 0, 1), sy = Math.max(0.004, 1 - ei(e * 1.6)), sx = e < 0.62 ? 1 : Math.max(0.01, 1 - (e - 0.62) / 0.38);
      const dw = gw * sx, dh = gh * sy; ctx.drawImage(off, gx + (gw - dw) / 2, gy + (gh - dh) / 2, dw, dh);
      ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = cl(e * 1.5, 0, 1) * 0.9; ctx.fillStyle = '#cfe9ff'; ctx.fillRect(gx + (gw - dw) / 2, gy + (gh - dh) / 2, dw, dh); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
      once('out', () => KXAudio.sfx.click());
    } else if (glitch && fx) {
      const bands = 9; seed = Math.floor(t * 60) * 31 + 5;
      for (let b = 0; b < bands; b++) { const y0 = Math.floor(b * h / bands), bh = Math.ceil(h / bands), dx = (rnd() - 0.5) * w * (rnd() < 0.35 ? 0.09 : 0.015); ctx.drawImage(off, 0, y0, w, bh, gx + dx, gy + y0 * gh / h, gw, bh * gh / h); }
      ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.45;
      ctx.drawImage(off, gx - gw * 0.012, gy, gw, gh); ctx.globalAlpha = 0.3; ctx.drawImage(off, gx + gw * 0.012, gy, gw, gh);
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'rgba(34,226,255,0.25)'; ctx.fillRect(gx, gy + rnd() * gh, gw, gh * 0.01); ctx.fillStyle = 'rgba(255,50,180,0.2)'; ctx.fillRect(gx, gy + rnd() * gh, gw, gh * 0.006);
    } else ctx.drawImage(off, gx, gy, gw, gh);
    if (t > 0.02) once('boot', () => KXAudio.sfx.boot());
  }
  return { draw, chip, LEN, TL, reset() { st.fired = {}; } };
})();
