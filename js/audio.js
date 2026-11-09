/* Balloon Pop - complete audio manager.
   One shared AudioContext drives everything:

   - Original procedural background music: a 104 BPM scheduled sequencer
     (marimba lead, soft bass, airy pad, light hats) built on
     AudioContext.currentTime with a look-ahead scheduler, so the loop
     has no gap and never depends on setTimeout note timing.
   - Layered synthesized SFX with a simple priority/voice system so a
     balloon pop is never crowded out by UI clicks.
   - Real mp3 SFX are used when the files decode; anything missing or
     empty falls back to synthesis silently.
   - Separate music / SFX gains, master mute, persisted preferences,
     gentle ducking around important feedback, visibility-aware
     suspend/resume, and one-time user-gesture unlock. */
(function (root) {
  'use strict';

  var ctx = null;
  var masterGain = null;
  var musicGain = null;
  var sfxGain = null;
  var noiseBuf = null;

  /* ---- preferences (persisted by main.js via storage) ---- */
  var prefs = {
    musicOn: true,
    sfxOn: true,
    musicVol: 0.22, /* music stays under the pops and feedback */
    sfxVol: 0.7,
    muted: false
  };

  var started = false;
  var unlocked = false;
  var duckLevel = 1;        /* current music duck factor */
  var duckTimer = null;
  var activeVoices = 0;
  var lastPlayAt = {};      /* per-name throttle map */

  /* ================= shared context ================= */

  function ensureCtx() {
    if (ctx) return ctx;
    var AC = root.AudioContext || root.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    masterGain = ctx.createGain();
    masterGain.gain.value = 1;
    masterGain.connect(ctx.destination);
    musicGain = ctx.createGain();
    musicGain.gain.value = 0;
    musicGain.connect(masterGain);
    sfxGain = ctx.createGain();
    sfxGain.gain.value = prefs.sfxOn ? prefs.sfxVol : 0;
    sfxGain.connect(masterGain);

    /* one cached white-noise buffer for pops / hats / puffs */
    var len = Math.floor(ctx.sampleRate * 0.5);
    noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    var d = noiseBuf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return ctx;
  }

  function applyGains() {
    if (!ctx) return;
    var t = ctx.currentTime;
    var musicTarget = (prefs.musicOn && !prefs.muted) ? prefs.musicVol * duckLevel : 0;
    musicGain.gain.cancelScheduledValues(t);
    musicGain.gain.setTargetAtTime(musicTarget, t, 0.12);
    sfxGain.gain.setTargetAtTime((prefs.sfxOn && !prefs.muted) ? prefs.sfxVol : 0, t, 0.03);
    masterGain.gain.setTargetAtTime(prefs.muted ? 0 : 1, t, 0.03);
  }

  /* ================= SFX voice helpers ================= */

  function midi(n) { return 440 * Math.pow(2, (n - 69) / 12); }

  function voiceDone(durMs) {
    activeVoices++;
    setTimeout(function () { activeVoices = Math.max(0, activeVoices - 1); }, durMs);
  }

  /* Oscillator with a fast attack / exponential release envelope. */
  function tone(opts) {
    var t0 = ctx.currentTime + (opts.at || 0);
    var dur = opts.dur || 0.15;
    var osc = ctx.createOscillator();
    var g = ctx.createGain();
    osc.type = opts.type || 'sine';
    osc.frequency.setValueAtTime(opts.freq, t0);
    if (opts.glideTo) osc.frequency.exponentialRampToValueAtTime(opts.glideTo, t0 + dur);
    var v = opts.vol || 0.15;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(v, t0 + (opts.attack || 0.008));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    if (opts.filter) {
      var f = ctx.createBiquadFilter();
      f.type = opts.filter;
      if (opts.filterFreq) f.frequency.value = opts.filterFreq;
      g.connect(f);
      f.connect(sfxGain);
    } else {
      g.connect(sfxGain);
    }
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
    osc.onended = function () { try { osc.disconnect(); g.disconnect(); } catch (e) { } };
  }

  /* Filtered noise burst (cached buffer). */
  function noise(opts) {
    var t0 = ctx.currentTime + (opts.at || 0);
    var dur = opts.dur || 0.08;
    var src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    src.loop = true;
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(opts.vol || 0.2, t0 + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    var f = ctx.createBiquadFilter();
    f.type = opts.ftype || 'bandpass';
    f.frequency.value = opts.freq || 1200;
    f.Q.value = opts.q || 1;
    src.connect(f).connect(g).connect(sfxGain);
    src.start(t0);
    src.stop(t0 + dur + 0.05);
    src.onended = function () { try { src.disconnect(); f.disconnect(); g.disconnect(); } catch (e) { } };
  }

  /* ================= the sound effects =================
     priority: 3 = pop / answer feedback / timeouts / jingles
               2 = power-ups, hearts, combos, stars, unlock
               1 = UI clicks, decorative ticks                     */

  var SFX = {
    pop: function (p) {
      /* layered pop: transient click + noise burst + soft low body,
         ~130ms, gentle random pitch variation of +/-5%. */
      var k = 0.95 + Math.random() * 0.1;
      noise({ dur: 0.012, vol: 0.32 * p, ftype: 'highpass', freq: 2600 * k });
      noise({ dur: 0.07, vol: 0.3 * p, freq: 1500 * k, q: 0.8 });
      tone({ freq: 210 * k, glideTo: 88 * k, dur: 0.1, type: 'sine', vol: 0.34 * p });
      voiceDone(160);
    },
    correct: function () {
      tone({ freq: midi(76), dur: 0.11, type: 'triangle', vol: 0.17 });
      tone({ freq: midi(81), at: 0.1, dur: 0.16, type: 'triangle', vol: 0.17 });
      tone({ freq: midi(88), at: 0.1, dur: 0.16, type: 'sine', vol: 0.05 });
      voiceDone(400);
    },
    wrong: function () {
      /* soft descending, never harsh */
      tone({ freq: 311, glideTo: 233, dur: 0.22, type: 'triangle', vol: 0.13, filter: 'lowpass', filterFreq: 900 });
      tone({ freq: 233, at: 0.16, glideTo: 185, dur: 0.2, type: 'sine', vol: 0.08 });
      voiceDone(450);
    },
    combo: function () {
      [72, 76, 79].forEach(function (n, i) {
        tone({ freq: midi(n), at: i * 0.07, dur: 0.1, type: 'sine', vol: 0.13 });
      });
      voiceDone(350);
    },
    highCombo: function () {
      [72, 76, 79, 84].forEach(function (n, i) {
        tone({ freq: midi(n), at: i * 0.06, dur: 0.12, type: 'triangle', vol: 0.14 });
      });
      tone({ freq: midi(96), at: 0.24, dur: 0.22, type: 'sine', vol: 0.05 });
      voiceDone(550);
    },
    tick: function () {
      tone({ freq: 1180, dur: 0.06, type: 'sine', vol: 0.07 });
      voiceDone(120);
    },
    warn: function () {
      tone({ freq: 880, dur: 0.09, type: 'sine', vol: 0.06 });
      tone({ freq: 880, at: 0.14, dur: 0.09, type: 'sine', vol: 0.06 });
      voiceDone(350);
    },
    timeout: function () {
      /* time's up: quick gentle descent, distinct from wrong */
      [79, 74, 69].forEach(function (n, i) {
        tone({ freq: midi(n), at: i * 0.11, dur: 0.14, type: 'sine', vol: 0.13 });
      });
      voiceDone(500);
    },
    freeze: function () {
      tone({ freq: 1250, glideTo: 420, dur: 0.35, type: 'sine', vol: 0.09 });
      tone({ freq: 1650, glideTo: 640, at: 0.06, dur: 0.3, type: 'sine', vol: 0.06 });
      noise({ dur: 0.3, vol: 0.05, freq: 5200, q: 2 });
      voiceDone(600);
    },
    fifty: function () {
      /* quick magical disappearance */
      [67, 74, 81, 86].forEach(function (n, i) {
        tone({ freq: midi(n), at: i * 0.035, dur: 0.09, type: 'sine', vol: 0.1 });
      });
      noise({ at: 0.02, dur: 0.16, vol: 0.07, freq: 3200, q: 1.5 });
      voiceDone(350);
    },
    shieldOn: function () {
      /* protective bubble shimmer */
      tone({ freq: 300, glideTo: 720, dur: 0.22, type: 'sine', vol: 0.1 });
      tone({ freq: 450, glideTo: 980, at: 0.05, dur: 0.22, type: 'sine', vol: 0.07 });
      tone({ freq: midi(93), at: 0.12, dur: 0.18, type: 'sine', vol: 0.04 });
      voiceDone(450);
    },
    shieldUsed: function () {
      /* soft bubble impact + bounce */
      tone({ freq: 160, glideTo: 320, dur: 0.12, type: 'sine', vol: 0.16 });
      noise({ dur: 0.05, vol: 0.1, freq: 900 });
      tone({ freq: 330, at: 0.12, glideTo: 260, dur: 0.12, type: 'sine', vol: 0.07 });
      voiceDone(350);
    },
    heartLost: function () {
      tone({ freq: midi(57), dur: 0.12, type: 'sine', vol: 0.09 });
      tone({ freq: midi(52), at: 0.11, dur: 0.18, type: 'sine', vol: 0.09 });
      voiceDone(400);
    },
    click: function () {
      tone({ freq: 520, dur: 0.045, type: 'sine', vol: 0.07 });
      voiceDone(100);
    },
    unlock: function () {
      [72, 76, 79, 84].forEach(function (n, i) {
        tone({ freq: midi(n), at: i * 0.07, dur: 0.14, type: 'triangle', vol: 0.12 });
      });
      voiceDone(450);
    },
    star: function () {
      tone({ freq: midi(89), dur: 0.12, type: 'sine', vol: 0.11 });
      tone({ freq: midi(94), at: 0.09, dur: 0.16, type: 'sine', vol: 0.11 });
      tone({ freq: midi(89) * 3, at: 0.02, dur: 0.1, type: 'sine', vol: 0.02 });
      voiceDone(400);
    },
    levelWin: function () {
      var seq = [72, 76, 79, 84, 79, 88];
      seq.forEach(function (n, i) {
        tone({ freq: midi(n), at: i * 0.11, dur: i === seq.length - 1 ? 0.35 : 0.13, type: 'triangle', vol: 0.14 });
      });
      voiceDone(900);
    },
    gameOver: function () {
      var seq = [71, 67, 64, 60, 55];
      seq.forEach(function (n, i) {
        tone({ freq: midi(n), at: i * 0.19, dur: 0.26, type: 'triangle', vol: 0.1, filter: 'lowpass', filterFreq: 1400 });
      });
      voiceDone(1300);
    },
    fanfare: function () {
      var seq = [60, 64, 67, 72, 76, 79, 84];
      seq.forEach(function (n, i) {
        tone({ freq: midi(n), at: i * 0.09, dur: 0.16, type: 'triangle', vol: 0.13 });
      });
      [72, 76, 79, 84].forEach(function (n) {
        tone({ freq: midi(n), at: 0.68, dur: 0.75, type: 'triangle', vol: 0.1 });
        tone({ freq: midi(n) * 2, at: 0.68, dur: 0.75, type: 'sine', vol: 0.03 });
      });
      tone({ freq: midi(36), at: 0.68, dur: 0.6, type: 'sine', vol: 0.12 });
      voiceDone(1600);
    }
  };

  var PRIORITY = {
    pop: 3, correct: 3, wrong: 3, timeout: 3, levelWin: 3, gameOver: 3, fanfare: 3,
    combo: 2, highCombo: 2, freeze: 2, fifty: 2, shieldOn: 2, shieldUsed: 2,
    heartLost: 2, star: 2, unlock: 2,
    click: 1, tick: 1, warn: 1
  };

  /* Names that should duck the music briefly while they play. */
  var DUCKED = { correct: 0.45, wrong: 0.45, timeout: 0.4, levelWin: 0.3, gameOver: 0.3, fanfare: 0.25, highCombo: 0.5 };

  function duckTo(level, holdMs) {
    if (!ctx) return;
    duckLevel = level;
    applyGains();
    if (duckTimer) clearTimeout(duckTimer);
    duckTimer = setTimeout(function () {
      duckTimer = null;
      duckLevel = 1;
      applyGains();
    }, holdMs || 1100);
  }

  /* Public SFX entry point. Honors prefs, priorities, a voice limit and
     a 35ms same-sound dedupe window; pops and top-priority cues are
     never dropped. */
  function playSFX(name) {
    try {
      if (!ctx || ctx.state !== 'running' || !SFX[name]) return;
      if (prefs.muted || !prefs.sfxOn) return;
      var pr = PRIORITY[name] || 2;
      if (pr < 3 && activeVoices > 9) return;           /* voice cap for low/medium */
      var now = performance.now();
      if (lastPlayAt[name] && now - lastPlayAt[name] < 35) return; /* dedupe burst */
      lastPlayAt[name] = now;
      if (DUCKED[name]) duckTo(DUCKED[name], name === 'fanfare' ? 1800 : 1100);
      SFX[name](name === 'pop' ? 1 : undefined);
    } catch (e) { /* audio must never break gameplay */ }
  }

  /* ================= procedural music =================
     Original composition, 104 BPM. The scheduler works one bar ahead
     on the AudioContext clock - no setTimeout-timed notes, no audible
     loop seam, infinite seamless playback. */

  var BPM = 104;
  var BEAT = 60 / BPM;
  var BAR = BEAT * 4;
  var PENTA = [0, 2, 4, 7, 9]; /* major pentatonic offsets */

  /* 16-bar progression: two 8-bar halves */
  var PROG = [
    [48, 55, 60, 64], /* C   */
    [45, 52, 57, 60], /* Am  */
    [41, 48, 53, 57], /* F   */
    [43, 50, 55, 59], /* G   */
    [48, 55, 60, 64], /* C   */
    [45, 52, 57, 60], /* Am  */
    [41, 48, 53, 57], /* F   */
    [43, 50, 55, 59], /* G   */
    [41, 48, 53, 57], /* F   */
    [43, 50, 55, 59], /* G   */
    [48, 55, 60, 64], /* C   */
    [45, 52, 57, 60], /* Am  */
    [50, 57, 62, 65], /* Dm  */
    [43, 50, 55, 59], /* G   */
    [48, 55, 60, 64], /* C   */
    [48, 55, 60, 64]  /* C   */
  ];

  /* Melody motifs: 16 eighth-note slots per 2 bars, C-major pentatonic
     around C5 (midi 72). '.' = rest. Original tune, A/B variation. */
  var MOTIF_A = [
    'E5 . G5 . A5 . G5 E5  C5 . D5 E5 G5 . E5 .',
    'A5 . G5 . E5 . D5 C5  D5 . E5 . G5 . . .',
    'A5 . C6 . A5 G5 E5 .  G5 . E5 D5 C5 . . .',
    'E5 G5 A5 . C6 . A5 G5  E5 . D5 . C5 . . .'
  ];
  var MOTIF_B = [
    'C5 . E5 . G5 . A5 B5  C6 . B5 A5 G5 . . .',
    'A5 . E5 . D5 . C5 .   D5 E5 G5 . E5 . . .',
    'F5 . A5 . G5 . E5 C5  D5 . E5 . C5 . . .',
    'E5 . G5 . C6 . D6 C6  B5 . G5 . A5 . . .'
  ];

  function noteMidi(name) {
    var m = /^([A-G])(#?)(\d)$/.exec(name);
    if (!m) return 0;
    var base = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[m[1]] + (m[2] ? 1 : 0);
    return 12 * (parseInt(m[3], 10) + 1) + base;
  }

  var melodyCache = {};
  function motifNotes(kind, idx) {
    var key = kind + idx;
    if (!melodyCache[key]) {
      melodyCache[key] = MOTIFS[kind][idx].trim().split(/\s+/).map(function (t) {
        return t === '.' ? 0 : noteMidi(t);
      });
    }
    return melodyCache[key];
  }
  var MOTIFS = { A: MOTIF_A, B: MOTIF_B };

  function musicVoice(opts) {
    /* marimba-ish: fundamental + quiet octave-partial, fast decay */
    var t0 = opts.t;
    var dur = opts.dur || 0.3;
    var osc = ctx.createOscillator();
    var osc2 = ctx.createOscillator();
    var g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = opts.freq;
    osc2.type = 'sine';
    osc2.frequency.value = opts.freq * 2;
    var g2 = ctx.createGain();
    g2.gain.value = 0.28;
    var v = opts.vol || 0.1;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(v, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    osc2.connect(g2).connect(g);
    g.connect(musicGain);
    osc.start(t0); osc.stop(t0 + dur + 0.05);
    osc2.start(t0); osc2.stop(t0 + dur + 0.05);
    osc.onended = function () { try { osc.disconnect(); osc2.disconnect(); g.disconnect(); g2.disconnect(); } catch (e) { } };
  }

  function musicBass(opts) {
    var t0 = opts.t;
    var osc = ctx.createOscillator();
    var g = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = opts.freq;
    var v = opts.vol || 0.09;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(v, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + (opts.dur || 0.5));
    osc.connect(g).connect(musicGain);
    osc.start(t0); osc.stop(t0 + (opts.dur || 0.5) + 0.05);
    osc.onended = function () { try { osc.disconnect(); g.disconnect(); } catch (e) { } };
  }

  function musicPad(t0, freqs, dur) {
    freqs.forEach(function (f) {
      [f, f * 1.003].forEach(function (ff) {
        var osc = ctx.createOscillator();
        var g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = ff;
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.linearRampToValueAtTime(0.016, t0 + dur * 0.4);
        g.gain.linearRampToValueAtTime(0.0001, t0 + dur);
        osc.connect(g).connect(musicGain);
        osc.start(t0); osc.stop(t0 + dur + 0.05);
        osc.onended = function () { try { osc.disconnect(); g.disconnect(); } catch (e) { } };
      });
    });
  }

  function musicHat(t0, vol) {
    var src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    var g = ctx.createGain();
    var f = ctx.createBiquadFilter();
    f.type = 'highpass';
    f.frequency.value = 7000;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.05);
    src.connect(f).connect(g).connect(musicGain);
    src.start(t0); src.stop(t0 + 0.08);
    src.onended = function () { try { src.disconnect(); f.disconnect(); g.disconnect(); } catch (e) { } };
  }

  var music = { playing: false, barIndex: 0, nextBarTime: 0, timer: null };

  function scheduleBar(bar, t0) {
    var chord = PROG[bar % PROG.length];
    var eighth = BEAT / 2;

    /* pad + bass */
    musicPad(t0, [midi(chord[1]), midi(chord[2] + 12), midi(chord[3] + 12)], BAR * 0.98);
    musicBass({ t: t0, freq: midi(chord[0]), dur: BEAT * 1.6, vol: 0.085 });
    musicBass({ t: t0 + BEAT * 2, freq: midi(chord[0] + 7), dur: BEAT * 0.9, vol: 0.055 });

    /* light hats on the off-beats, slightly stronger on 2 and 4 */
    for (var b = 0; b < 4; b++) {
      musicHat(t0 + b * BEAT + BEAT / 2, b % 2 === 1 ? 0.028 : 0.018);
    }

    /* melody: A section for bars 0-7, B section for 8-15 of each cycle */
    var kind = (Math.floor(bar / 8) % 2 === 0) ? 'A' : 'B';
    var motifIdx = Math.floor((bar % 8) / 2);
    var notes = motifNotes(kind, motifIdx);
    for (var i = 0; i < notes.length; i++) {
      var n = notes[i];
      if (!n) continue;
      /* slight humanization: tiny timing jitter, never on the beat 1 */
      var jt = i % 8 === 0 ? 0 : (Math.random() - 0.5) * 0.012;
      musicVoice({ t: t0 + i * eighth + jt, freq: midi(n), dur: 0.32, vol: 0.1 });
      /* octave sparkle early in each 2-bar motif */
      if (i === 4 && bar % 4 === 0) {
        musicVoice({ t: t0 + i * eighth, freq: midi(n + 12), dur: 0.22, vol: 0.03 });
      }
    }

    /* occasional bell sparkle at section starts */
    if (bar % 8 === 0) {
      musicVoice({ t: t0 + BEAT * 3, freq: midi(96 + PENTA[Math.floor(Math.random() * 5)]), dur: 0.5, vol: 0.025 });
    }
  }

  function schedulerTick() {
    if (!music.playing || !ctx) return;
    var ahead = ctx.currentTime + 0.7;
    while (music.nextBarTime < ahead) {
      scheduleBar(music.barIndex, music.nextBarTime);
      music.barIndex++;
      music.nextBarTime += BAR;
    }
  }

  function playMusic() {
    if (!ensureCtx() || ctx.state !== 'running') return;
    if (music.playing) return; /* never start a second copy */
    music.playing = true;
    music.barIndex = 0;
    music.nextBarTime = ctx.currentTime + 0.08;
    applyGains();
    if (music.timer) clearInterval(music.timer);
    music.timer = setInterval(schedulerTick, 180);
    schedulerTick();
  }

  function stopMusic(fadeSec) {
    if (!ctx) return;
    music.playing = false;
    if (music.timer) { clearInterval(music.timer); music.timer = null; }
    var t = ctx.currentTime;
    musicGain.gain.cancelScheduledValues(t);
    musicGain.gain.setTargetAtTime(0, t, (fadeSec || 0.4) / 3);
  }

  function pauseMusic() { duckTo(0.3, 100000); }  /* stays low until resume */
  function resumeMusic() { duckTo(1, 10); }
  function isMusicPlaying() { return music.playing; }

  /* ================= unlock / lifecycle ================= */

  function unlock() {
    var c = ensureCtx();
    if (!c) return;
    if (c.state === 'suspended') {
      c.resume().then(function () {
        unlocked = true;
        afterUnlock();
      }).catch(function () { });
    } else {
      unlocked = true;
      afterUnlock();
    }
  }

  function afterUnlock() {
    if (!started && prefs.musicOn && !prefs.muted) {
      started = true;
      playMusic();
    }
  }

  /* Tab hidden: fade + suspend; visible: resume in accordance with
     the player's preferences (music restarts seamlessly because the
     scheduler resumes where the context clock stopped). */
  function handleVisibility(hidden) {
    if (!ctx) return;
    if (hidden) {
      var t = ctx.currentTime;
      musicGain.gain.cancelScheduledValues(t);
      musicGain.gain.setTargetAtTime(0, t, 0.05);
      setTimeout(function () {
        if (document.hidden && ctx.state === 'running') ctx.suspend().catch(function () { });
      }, 200);
    } else {
      ctx.resume().then(function () { applyGains(); }).catch(function () { });
    }
  }

  /* ================= preferences API ================= */

  function setPrefs(p) {
    prefs = {
      musicOn: p.musicOn !== false,
      sfxOn: p.sfxOn !== false,
      musicVol: Math.min(1, Math.max(0, Number(p.musicVol) || 0.22)),
      sfxVol: Math.min(1, Math.max(0, Number(p.sfxVol) || 0.7)),
      muted: !!p.muted
    };
    applyGains();
    if (started) {
      if (prefs.musicOn && !prefs.muted) {
        if (!music.playing) playMusic();
      } else {
        stopMusic(0.3);
      }
    }
  }
  function getPrefs() { return JSON.parse(JSON.stringify(prefs)); }

  /* Backwards-compatible simple API used by the game code. */
  function play(name) { playSFX(name); }
  function setEnabled(v) { /* legacy single toggle -> mute all */
    prefs.muted = !v;
    applyGains();
  }
  function isEnabled() { return !prefs.muted; }

  root.BP = root.BP || {};
  root.BP.audio = {
    init: ensureCtx,
    unlock: unlock,
    play: play,
    playSFX: playSFX,
    playMusic: playMusic,
    pauseMusic: pauseMusic,
    resumeMusic: resumeMusic,
    stopMusic: stopMusic,
    isMusicPlaying: isMusicPlaying,
    setPrefs: setPrefs,
    getPrefs: getPrefs,
    setMusicEnabled: function (v) { setPrefs(Object.assign(getPrefs(), { musicOn: v !== false })); },
    setSFXEnabled: function (v) { setPrefs(Object.assign(getPrefs(), { sfxOn: v !== false })); },
    setMusicVolume: function (v) { setPrefs(Object.assign(getPrefs(), { musicVol: v })); },
    setSFXVolume: function (v) { setPrefs(Object.assign(getPrefs(), { sfxVol: v })); },
    setMuted: function (v) { setPrefs(Object.assign(getPrefs(), { muted: !!v })); },
    setEnabled: setEnabled, /* legacy */
    isEnabled: isEnabled,   /* legacy */
    handleVisibility: handleVisibility,
    _state: function () {
      return {
        ctxState: ctx ? ctx.state : 'none',
        musicPlaying: music.playing,
        bar: music.barIndex,
        voices: activeVoices,
        prefs: getPrefs(),
        unlocked: unlocked
      };
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
