/* Balloon Pop - Sound effects.
   Tries the mp3 files in assets/sounds/ first; any file that is missing,
   empty or undecodable falls back to a lightweight Web Audio synth.
   Audio is only created after the player's first interaction. */
(function (root) {
  'use strict';

  var ctx = null;
  var enabled = true;
  var buffers = {};
  var FILES = {
    pop: 'assets/sounds/pop.mp3',
    correct: 'assets/sounds/correct.mp3',
    wrong: 'assets/sounds/wrong.mp3'
  };

  function ensureCtx() {
    if (ctx) return ctx;
    var AC = root.AudioContext || root.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    return ctx;
  }

  /* Unlock audio on the first user gesture; never before. */
  function unlock() {
    var c = ensureCtx();
    if (c && c.state === 'suspended') c.resume();
    preload();
  }

  function preload() {
    if (!ensureCtx()) return;
    Object.keys(FILES).forEach(function (name) {
      if (buffers[name] !== undefined) return;
      fetch(FILES[name]).then(function (r) {
        if (!r.ok) throw new Error('http ' + r.status);
        return r.arrayBuffer();
      }).then(function (buf) {
        if (!buf || buf.byteLength === 0) throw new Error('empty');
        return new Promise(function (res, rej) {
          ctx.decodeAudioData(buf, res, rej);
        });
      }).then(function (decoded) {
        buffers[name] = decoded;
      }).catch(function () {
        buffers[name] = null; /* use synth */
      });
    });
  }

  function playBuffered(name) {
    var c = ensureCtx();
    if (!c || !buffers[name]) return false;
    var src = c.createBufferSource();
    src.buffer = buffers[name];
    var g = c.createGain();
    g.gain.value = 0.5;
    src.connect(g).connect(c.destination);
    src.start();
    return true;
  }

  function tone(freq, start, dur, type, vol, glideTo) {
    var c = ensureCtx();
    if (!c) return;
    var t0 = c.currentTime + start;
    var osc = c.createOscillator();
    var g = c.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol || 0.18, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  function noiseBurst(start, dur, vol) {
    var c = ensureCtx();
    if (!c) return;
    var t0 = c.currentTime + start;
    var len = Math.floor(c.sampleRate * dur);
    var buf = c.createBuffer(1, len, c.sampleRate);
    var data = buf.getChannelData(0);
    for (var i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    var src = c.createBufferSource();
    src.buffer = buf;
    var g = c.createGain();
    g.gain.value = vol || 0.25;
    var filter = c.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 900;
    src.connect(filter).connect(g).connect(c.destination);
    src.start(t0);
  }

  var synth = {
    pop: function () { noiseBurst(0, 0.09, 0.3); tone(620, 0, 0.09, 'sine', 0.22, 180); },
    correct: function () { tone(660, 0, 0.12, 'triangle', 0.16); tone(880, 0.1, 0.16, 'triangle', 0.16); },
    wrong: function () { tone(190, 0, 0.2, 'square', 0.1, 120); tone(140, 0.16, 0.22, 'square', 0.08, 95); },
    combo: function () { tone(523, 0, 0.07, 'sine', 0.14); tone(659, 0.07, 0.07, 'sine', 0.14); tone(784, 0.14, 0.1, 'sine', 0.14); },
    tick: function () { tone(1180, 0, 0.07, 'sine', 0.09); },
    star: function () { tone(1319, 0, 0.1, 'sine', 0.12); tone(1568, 0.09, 0.14, 'sine', 0.12); },
    levelWin: function () { tone(523, 0, 0.12, 'triangle', 0.15); tone(659, 0.12, 0.12, 'triangle', 0.15); tone(784, 0.24, 0.12, 'triangle', 0.15); tone(1047, 0.36, 0.24, 'triangle', 0.16); },
    gameOver: function () { tone(392, 0, 0.2, 'triangle', 0.14); tone(330, 0.2, 0.2, 'triangle', 0.13); tone(262, 0.4, 0.24, 'triangle', 0.12); tone(196, 0.62, 0.34, 'triangle', 0.11); },
    click: function () { tone(500, 0, 0.05, 'sine', 0.08); },
    freeze: function () { tone(1200, 0, 0.3, 'sine', 0.1, 400); tone(900, 0.05, 0.3, 'sine', 0.08, 300); },
    shield: function () { tone(300, 0, 0.18, 'sawtooth', 0.08, 600); }
  };

  function play(name) {
    if (!enabled) return;
    try {
      if (buffers[name]) { playBuffered(name); return; }
      if (buffers[name] === null && synth[name]) { synth[name](); return; }
      if (buffers[name] === undefined && FILES[name]) { preload(); synth[name] && synth[name](); return; }
      if (synth[name]) synth[name]();
    } catch (e) { /* audio must never break gameplay */ }
  }

  function setEnabled(v) {
    enabled = !!v;
  }

  root.BP = root.BP || {};
  root.BP.audio = {
    unlock: unlock,
    play: play,
    setEnabled: setEnabled,
    isEnabled: function () { return enabled; }
  };
})(typeof window !== 'undefined' ? window : globalThis);
