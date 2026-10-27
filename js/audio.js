/* KRYPTEX: generative audio (soft electronic bed + chiptune blips). 100% synthesized with Web Audio. Original. MIT (c) 2026 kxz0tn */
'use strict';
const KXAudio = (() => {
  let ctx = null, master, comp, musicBus, musicFilter, sfxBus, delayIn, noiseBuf, chipBus, pulse25, pulse12;
  let timer = null, nextTime = 0, step = 0;
  let intensity = 0, inGame = false, boss = false, root = 0, danger = 0;
  const vol = { music: 0.6, sfx: 0.8, muted: false };
  const BPM = 96, S16 = 60 / BPM / 4;
  // D-minor family: Dm9 · Bbmaj7#11 · Gm9 · A7sus4 (original progression)
  const CHORDS = [[38, 53, 57, 60, 64, 65], [34, 53, 57, 58, 62, 64], [43, 53, 57, 58, 62, 69], [45, 55, 57, 59, 62, 64]];
  const BOSS = [[38, 50, 53, 56, 60, 62], [37, 49, 53, 56, 59, 61]]; // dark diminished pulse
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);

  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = vol.muted ? 0 : 1;
    comp = ctx.createDynamicsCompressor(); comp.threshold.value = -15; comp.ratio.value = 4;
    comp.connect(master); master.connect(ctx.destination);
    musicBus = ctx.createGain(); musicBus.gain.value = vol.music * 0.9;
    musicFilter = ctx.createBiquadFilter(); musicFilter.type = 'lowpass'; musicFilter.frequency.value = 900; musicFilter.Q.value = 0.8;
    musicBus.connect(musicFilter); musicFilter.connect(comp);
    delayIn = ctx.createGain(); delayIn.gain.value = 0.32;
    const d = ctx.createDelay(1.5); d.delayTime.value = S16 * 3;
    const fb = ctx.createGain(); fb.gain.value = 0.4;
    const dl = ctx.createBiquadFilter(); dl.type = 'lowpass'; dl.frequency.value = 2600;
    delayIn.connect(d); d.connect(dl); dl.connect(fb); fb.connect(d); dl.connect(musicFilter);
    sfxBus = ctx.createGain(); sfxBus.gain.value = vol.sfx; sfxBus.connect(comp);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const ch = noiseBuf.getChannelData(0); for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1;
    chipBus = ctx.createGain(); chipBus.gain.value = vol.music * 0.9;
    const cl = ctx.createBiquadFilter(); cl.type = 'lowpass'; cl.frequency.value = 4200; chipBus.connect(cl); cl.connect(comp);
    const mkPulse = duty => { const n = 32, re = new Float32Array(n), im = new Float32Array(n); for (let k = 1; k < n; k++) im[k] = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * duty); return ctx.createPeriodicWave(re, im); };
    pulse25 = mkPulse(0.25); pulse12 = mkPulse(0.125);
    nextTime = ctx.currentTime + 0.1; timer = setInterval(pump, 25);
  }
  function pump() {
    if (!ctx || ctx.state !== 'running') return;
    if (nextTime < ctx.currentTime - 0.2) nextTime = ctx.currentTime + 0.05;
    while (nextTime < ctx.currentTime + 0.12) { schedule(step, nextTime); nextTime += S16; step++; }
  }
  function env(gn, t, a, peak, dur) { const p = gn.gain; p.setValueAtTime(0.0001, t); p.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + a); p.exponentialRampToValueAtTime(0.0001, t + dur); }
  function osc(type, f, t, dur, peak, dest, a = 0.005, detune = 0) {
    const o = ctx.createOscillator(), gn = ctx.createGain(); o.type = type; o.frequency.setValueAtTime(f, t); o.detune.value = detune;
    env(gn, t, a, peak, dur); o.connect(gn); gn.connect(dest); o.start(t); o.stop(t + dur + 0.05); return o;
  }
  function pls(f, t, dur, peak, dest, duty = 25, a = 0.002) {
    const o = ctx.createOscillator(), gn = ctx.createGain();
    if (duty === 50) o.type = 'square'; else o.setPeriodicWave(duty === 12 ? pulse12 : pulse25);
    o.frequency.setValueAtTime(f, t); env(gn, t, a, peak, dur); o.connect(gn); gn.connect(dest); o.start(t); o.stop(t + dur + 0.05); return o;
  }
  function seq(notes, t, len, peak, duty = 25, dest) { let tt = t; for (const [n, b] of notes) { if (n) pls(mtof(n), tt, len * b * 0.92, peak, dest || sfxBus, duty); tt += len * b; } return tt; }
  function noise(t, dur, peak, dest, type = 'highpass', f = 7000, f2) {
    const s = ctx.createBufferSource(); s.buffer = noiseBuf; const fl = ctx.createBiquadFilter(); fl.type = type; fl.frequency.setValueAtTime(f, t);
    if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t + dur);
    const gn = ctx.createGain(); env(gn, t, Math.min(0.01, dur / 4), peak, dur); s.connect(fl); fl.connect(gn); gn.connect(dest);
    s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
  }
  function schedule(st, t) {
    const bar = Math.floor(st / 16), pos = st % 16;
    const prog = boss ? BOSS : CHORDS; const chord = prog[bar % prog.length].map(n => n + root);
    const I = inGame ? intensity : 0.12;
    if (pos === 0) {
      musicFilter.frequency.setTargetAtTime((boss ? 500 : 700) + I * 3800, t, 0.6);
      const len = S16 * 16;
      for (let k = 1; k < 5; k++) { const f = mtof(chord[k]); osc('sawtooth', f, t, len * 1.05, 0.016, musicBus, len * 0.4, -9); osc('sawtooth', f, t, len * 1.05, 0.016, musicBus, len * 0.4, 9); }
      osc('sine', mtof(chord[0]), t, len, 0.1, musicBus, 0.3);
    }
    // glassy bell motif (call and answer)
    const bell = [0, 5, 7, 10, 14];
    if (bell.includes(pos) && Math.random() < 0.45 + I * 0.4) {
      const n = chord[1 + Math.floor(Math.random() * 5)] + 12 + (Math.random() < 0.25 ? 12 : 0);
      osc('sine', mtof(n), t, 0.5, 0.045 + I * 0.02, musicBus, 0.004); const o = osc('sine', mtof(n) * 2.01, t, 0.25, 0.012, delayIn, 0.002); o.detune.value = 3;
    }
    if (I > 0.25 && (pos % 4 === 2 || (I > 0.6 && pos % 2 === 1))) noise(t, 0.035, 0.03 + I * 0.03, musicBus, 'highpass', 8500);
    if (I > 0.42 && (pos === 0 || pos === 8 || (I > 0.7 && pos === 11))) {
      const o = ctx.createOscillator(), gn = ctx.createGain(); o.frequency.setValueAtTime(130, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.2);
      env(gn, t, 0.003, 0.36, 0.3); o.connect(gn); gn.connect(musicBus); o.start(t); o.stop(t + 0.32);
    }
    if (I > 0.5 && pos === 4 || I > 0.5 && pos === 12) noise(t, 0.12, 0.05, musicBus, 'bandpass', 1800);
    if (I > 0.35 && (pos === 0 || pos === 3 || pos === 6 || pos === 10 || pos === 13)) osc('triangle', mtof(chord[0] + 12), t, S16 * 1.8, 0.11, musicBus, 0.01);
    // chiptune arp layer
    const cv = inGame ? 0.5 + I * 0.6 : 0.55;
    const ARP = [1, 3, 2, 4, 3, 5, 4, 2, 1, 3, 2, 4, 5, 4, 3, 2];
    const n = chord[ARP[pos]] + 12 + (bar % 8 >= 4 && pos >= 8 ? 12 : 0);
    pls(mtof(n), t, S16 * 0.75, 0.011 * cv, chipBus, pos % 4 === 0 ? 25 : 12);
    if (pos % 4 === 0) pls(mtof(n), t, S16 * 0.8, 0.006 * cv, delayIn, 25);
    if (danger > 0 && pos % 8 === 0) pls(mtof(chord[0] + 36), t, 0.06, 0.02 * danger, sfxBus, 50);
  }
  const now = () => ctx.currentTime;
  const ok = () => ctx && ctx.state === 'running' && !vol.muted;
  const SCALE = [74, 76, 77, 79, 81, 82, 84, 86, 88, 89, 91, 93, 94, 96];
  const GLYPH = [62, 65, 67, 69, 72, 74, 77, 79, 81, 84, 86, 89, 91, 93, 96, 98, 101, 103];
  const sfx = {
    click() { if (!ok()) return; pls(1400, now(), 0.025, 0.03, sfxBus, 12); },
    flip() { if (!ok()) return; const t = now(); noise(t, 0.05, 0.05, sfxBus, 'bandpass', 3000, 6000); pls(880, t, 0.03, 0.02, sfxBus, 12); },
    tone(i) { if (!ok()) return; const t = now(); const f = mtof(GLYPH[i % GLYPH.length]); osc('sine', f, t, 0.5, 0.09, sfxBus, 0.005); pls(f, t, 0.08, 0.025, sfxBus, 25); osc('triangle', f * 1.5, t + 0.02, 0.3, 0.02, delayIn); },
    match(combo) {
      if (!ok()) return; const t = now(); const n = SCALE[Math.min(combo, SCALE.length - 1)];
      [0, 4, 7, 12].forEach((d, i) => pls(mtof(n + d), t + i * 0.04, 0.08, 0.04, sfxBus, i % 2 ? 12 : 25));
      osc('sine', mtof(n + 12), t + 0.12, 0.4, 0.07, sfxBus); osc('sine', mtof(n + 19), t + 0.14, 0.4, 0.02, delayIn);
    },
    miss() { if (!ok()) return; const t = now(); const o = osc('square', 220, t, 0.24, 0.06, sfxBus); o.frequency.exponentialRampToValueAtTime(70, t + 0.22); noise(t, 0.14, 0.06, sfxBus, 'lowpass', 1200); },
    staticHit() { if (!ok()) return; const t = now(); noise(t, 0.06, 0.12, sfxBus, 'bandpass', 2500 + Math.random() * 3000); pls(200 + Math.random() * 300, t, 0.03, 0.03, sfxBus, 50); },
    staticClear() { if (!ok()) return; const t = now(); noise(t, 0.25, 0.12, sfxBus, 'highpass', 2000, 10000); seq([[84, 1], [91, 1], [96, 2]], t, 0.035, 0.04, 25); },
    staticOn() { if (!ok()) return; const t = now(); noise(t, 0.35, 0.09, sfxBus, 'bandpass', 900, 4000); },
    swap() { if (!ok()) return; const t = now(); const o = osc('triangle', 300, t, 0.4, 0.05, sfxBus, 0.05); o.frequency.exponentialRampToValueAtTime(900, t + 0.35); noise(t, 0.35, 0.03, sfxBus, 'bandpass', 600, 3000); },
    scanReady() { if (!ok()) return; seq([[86, 1], [93, 1], [98, 2]], now(), 0.05, 0.05, 25); },
    scan() { if (!ok()) return; const t = now(); const o = osc('sawtooth', 120, t, 1.0, 0.06, sfxBus, 0.05); o.frequency.exponentialRampToValueAtTime(2400, t + 0.7); noise(t, 0.8, 0.07, sfxBus, 'highpass', 500, 9000); },
    warn() { if (!ok()) return; const t = now(); pls(988, t, 0.06, 0.04, sfxBus, 50); pls(988, t + 0.12, 0.06, 0.04, sfxBus, 50); },
    incoming() { if (!ok()) return; const t = now(); for (let i = 0; i < 4; i++) { pls(mtof(57 + (i % 2) * 6), t + i * 0.22, 0.16, 0.05, sfxBus, 25); noise(t + i * 0.22, 0.12, 0.05, sfxBus, 'bandpass', 1500); } },
    bossOk(i) { if (!ok()) return; const t = now(); pls(mtof(GLYPH[i % GLYPH.length]), t, 0.12, 0.05, sfxBus, 25); pls(mtof(GLYPH[i % GLYPH.length] + 12), t + 0.06, 0.1, 0.03, sfxBus, 12); },
    bossFail() { if (!ok()) return; const t = now(); const o = osc('sawtooth', 300, t, 0.5, 0.08, sfxBus); o.frequency.exponentialRampToValueAtTime(50, t + 0.45); noise(t, 0.4, 0.1, sfxBus, 'lowpass', 2000, 100); },
    decoded() { if (!ok()) return; const t = now(); seq([[74, 1], [77, 1], [81, 1], [86, 1], [89, 1], [93, 2], [98, 4]], t, 0.06, 0.06, 25); seq([[50, 4], [57, 4], [62, 8]], t, 0.06, 0.05, 50); },
    type() { if (!ok()) return; pls(600 + Math.random() * 500, now(), 0.02, 0.015, sfxBus, 12); },
    jump() {
      if (!ok()) return; const t = now(); noise(t, 2.4, 0.22, sfxBus, 'lowpass', 150, 8000);
      const o = osc('sawtooth', 50, t, 2.6, 0.08, sfxBus, 1.2); o.frequency.exponentialRampToValueAtTime(400, t + 2.3); osc('sine', 44, t + 1.6, 1.4, 0.45, sfxBus, 0.01);
      seq([[62, 2], [69, 2], [74, 2], [81, 4]], t + 1.6, 0.08, 0.05, 25);
    },
    lost() { if (!ok()) return; const t = now(); const o = osc('sawtooth', 500, t, 1.4, 0.1, sfxBus); o.frequency.exponentialRampToValueAtTime(40, t + 1.3); noise(t, 1.2, 0.18, sfxBus, 'lowpass', 4000, 100); seq([[69, 2], [65, 2], [62, 2], [57, 6]], t + 0.3, 0.12, 0.05, 50); },
    victory() { if (!ok()) return; const t = now(); seq([[74, 1], [77, 1], [81, 1], [86, 2], [0, 1], [84, 1], [86, 1], [89, 2], [0, 1], [93, 1], [98, 6]], t, 0.09, 0.06, 25); seq([[50, 4], [58, 4], [55, 4], [57, 8]], t, 0.09, 0.05, 50); },
    coin() { if (!ok()) return; seq([[81, 1], [86, 1], [93, 3]], now(), 0.045, 0.07, 50); },
    start() { if (!ok()) return; const t = now(); seq([[74, 1], [77, 1], [81, 1], [86, 1], [81, 1], [86, 1], [89, 2], [93, 4]], t, 0.06, 0.06, 25); seq([[62, 4], [65, 4], [69, 8]], t, 0.06, 0.05, 50); },
    letter() { if (!ok()) return; pls(1046, now(), 0.04, 0.04, sfxBus, 25); },
    enter() { if (!ok()) return; seq([[86, 1], [93, 2]], now(), 0.05, 0.05, 25); },
    hiscore() { if (!ok()) return; seq([[81, 1], [86, 1], [89, 1], [93, 1], [98, 4], [0, 1], [93, 1], [98, 6]], now(), 0.075, 0.06, 25); },
    chime() { if (!ok()) return; const t = now(); [86, 89, 93, 98].forEach((n, i) => { osc('sine', mtof(n), t + i * 0.07, 0.4, 0.05, sfxBus); pls(mtof(n), t + i * 0.07, 0.06, 0.03, sfxBus, 25); }); },
    boot() { // synced to KXBoot.TL: trace riser, power-on hit at 1.9 s, letter ticks, lock chord
      if (!ok()) return; const t = now(); noise(t, 1.8, 0.07, sfxBus, 'bandpass', 300, 5000);
      const o = osc('sawtooth', 55, t, 1.9, 0.045, sfxBus, 0.8); o.frequency.exponentialRampToValueAtTime(260, t + 1.85);
      for (let i = 0; i < 6; i++) pls(mtof(62 + i * 2), t + 0.15 + i * 0.12, 0.03, 0.02, sfxBus, 12);
      osc('sine', 42, t + 1.9, 1.2, 0.5, sfxBus, 0.005); noise(t + 1.9, 0.6, 0.18, sfxBus, 'lowpass', 6000, 200);
      seq([[86, 2], [93, 6]], t + 2.75, 0.08, 0.05, 25);
    },
  };
  return {
    init, sfx,
    setIntensity(v) { intensity = clamp(v, 0, 1); }, setInGame(v) { inGame = v; }, setBoss(v) { boss = v; }, setRoot(v) { root = v; }, setDanger(v) { danger = clamp(v, 0, 1); },
    setVolumes(m, s, muted) {
      vol.music = m; vol.sfx = s; vol.muted = muted; if (!ctx) return;
      musicBus.gain.setTargetAtTime(m * 0.9, ctx.currentTime, 0.05); chipBus.gain.setTargetAtTime(m * 0.9, ctx.currentTime, 0.05);
      sfxBus.gain.setTargetAtTime(s, ctx.currentTime, 0.05); master.gain.setTargetAtTime(muted ? 0 : 1, ctx.currentTime, 0.05);
    },
    suspend() { if (ctx && ctx.state === 'running') ctx.suspend(); }, resume() { if (ctx && ctx.state === 'suspended') ctx.resume(); },
    get ready() { return !!ctx; },
  };
})();
