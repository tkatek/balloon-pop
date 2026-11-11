/* Balloon Pop - Rising balloon engine.
   Balloons spawn in the lower part of the safe play area and rise as one
   coordinated group; the rise is a linear function of the field's single
   authoritative play clock, so 50% of the time always equals ~50% of the
   travel. Sway and tilt live on a separate inner wrapper so they never
   fight the position transform; pops and entrances animate the inner
   wrapper as well.

   Layered structure per balloon:
     .balloon       (position wrapper: translate3d from rAF, hitbox)
       .balloon-inner (sway + tilt + pop animations)
         img.balloon-img / span.balloon-label                        */
(function (root) {
  'use strict';

  var COLORS = ['red', 'yellow', 'green', 'blue', 'purple'];
  var EXT = ['png', 'webp', 'jpg'];
  var IMAGE_BASE = 'assets/images/';
  var ULTRAWIDE_CLUSTER = 1500; /* balloons never spread wider than this */

  /* Measured visible-artwork fractions of the real PNGs (alpha bounds).
     Normal balloons are tall (2:3) and popped ones nearly square, so a
     naive contain-fit shrinks the burst. These let the pop be scaled so
     its visible explosion matches the inflated body's visual diameter. */
  var VIS = {
    normal: {
      red: { w: 0.871, h: 0.971, cx: 0.490, cy: 0.504 },
      yellow: { w: 0.926, h: 0.987, cx: 0.494, cy: 0.499 },
      green: { w: 0.891, h: 0.951, cx: 0.496, cy: 0.509 },
      blue: { w: 0.898, h: 0.966, cx: 0.488, cy: 0.509 },
      purple: { w: 0.863, h: 0.971, cx: 0.494, cy: 0.501 }
    },
    popped: {
      red: { w: 0.899, h: 0.911, cx: 0.489, cy: 0.515 },
      yellow: { w: 0.884, h: 0.961, cx: 0.494, cy: 0.497 },
      green: { w: 0.869, h: 0.937, cx: 0.483, cy: 0.495 },
      blue: { w: 0.903, h: 0.924, cx: 0.494, cy: 0.509 },
      purple: { w: 0.721, h: 0.949, cx: 0.509, cy: 0.506 }
    }
  };
  var BURST_SCALE = 1.15; /* burst slightly larger than the body diameter */

  /* Gentle-breeze profile per movement pattern (from levels.json).
     All balloons share the same rise speed; only the breeze strength
     differs by level - never a per-answer speed boost.
     Amps are desktop values; phones scale them down further at spawn. */
  var SWAY = {
    float:   { amp: 8 },
    drift:   { amp: 10 },
    wave:    { amp: 12 },
    stagger: { amp: 14 },
    combo:   { amp: 16 }
  };
  /* Crossing intensity per pattern: fraction of the lane spacing a
     balloon's drift may span. Above ~0.5 neighbours' paths overlap and
     they occasionally cross while rising. */
  var CROSS = {
    float:   0.3,
    drift:   0.5,
    wave:    0.62,
    stagger: 0.75,
    combo:   0.88
  };
  var TAU = Math.PI * 2;

  function buildCandidates() {
    var c = { balloons: {}, popped: {} };
    COLORS.forEach(function (color) {
      c.balloons[color] = [
        'balloon-' + color, 'balloon_' + color, color + '-balloon',
        'balloon-' + color + '-normal', color
      ];
      c.popped[color] = [
        'balloon-' + color + '-popped', 'balloon-' + color + '_popped',
        'balloon-' + color + '-pop', 'popped-' + color, 'popped_' + color,
        color + '-popped', 'pop-' + color
      ];
    });
    c.backgrounds = {
      desktop: ['background-desktop', 'background_desktop', 'desktop-background', 'background'],
      mobile: ['background-mobile', 'background_mobile', 'mobile-background', 'background-portrait', 'background']
    };
    c.logo = ['logo', 'logo-small'];
    return c;
  }

  function probeImage(path, timeoutMs) {
    return new Promise(function (resolve) {
      var img = new Image();
      var done = false;
      var timer = setTimeout(function () {
        if (!done) { done = true; resolve(null); }
      }, timeoutMs || 4000);
      img.onload = function () {
        if (done) return;
        done = true;
        clearTimeout(timer);
        if (img.naturalWidth > 1) {
          resolve({ url: path, aspect: img.naturalHeight / img.naturalWidth });
        } else {
          resolve(null);
        }
      };
      img.onerror = function () {
        if (done) return;
        done = true;
        clearTimeout(timer);
        resolve(null);
      };
      img.src = path;
    });
  }

  async function probeList(names) {
    for (var i = 0; i < names.length; i++) {
      for (var e = 0; e < EXT.length; e++) {
        var url = IMAGE_BASE + names[i] + '.' + EXT[e];
        var hit = await probeImage(url);
        if (hit) return hit;
      }
    }
    return null;
  }

  /* Force-decode so the first spawn never flashes an empty frame. */
  async function warmDecode(urls) {
    await Promise.race([
      Promise.all(urls.map(function (u) {
        var im = new Image();
        im.src = u;
        return (im.decode ? im.decode() : Promise.resolve()).catch(function () { });
      })),
      new Promise(function (res) { setTimeout(res, 3000); })
    ]);
  }

  /* Detect the player's artwork. Any image that is missing simply
     returns null and the game falls back to CSS-drawn balloons. */
  async function detectAssets() {
    var cand = buildCandidates();
    var out = {
      balloons: {}, popped: {}, aspects: {},
      bgDesktop: null, bgMobile: null, logo: null, anyBalloon: false
    };
    var jobs = [];
    COLORS.forEach(function (color) {
      jobs.push(probeList(cand.balloons[color]).then(function (hit) {
        out.balloons[color] = hit ? hit.url : null;
        if (hit) out.aspects[color] = hit.aspect;
      }));
      jobs.push(probeList(cand.popped[color]).then(function (hit) {
        out.popped[color] = hit ? hit.url : null;
      }));
    });
    jobs.push(probeList(cand.backgrounds.desktop).then(function (hit) { out.bgDesktop = hit ? hit.url : null; }));
    jobs.push(probeList(cand.backgrounds.mobile).then(function (hit) { out.bgMobile = hit ? hit.url : null; }));
    jobs.push(probeList(cand.logo).then(function (hit) { out.logo = hit ? hit.url : null; }));
    await Promise.all(jobs);
    out.anyBalloon = COLORS.some(function (c) { return !!out.balloons[c]; });

    var warm = [];
    COLORS.forEach(function (c) {
      if (out.balloons[c]) warm.push(out.balloons[c]);
      if (out.popped[c]) warm.push(out.popped[c]);
    });
    if (warm.length) await warmDecode(warm);
    return out;
  }

  /* ---------------- Balloon field ---------------- */

  var reducedMotion = false;
  try {
    reducedMotion = root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch (e) { reducedMotion = false; }

  function createBalloons(container, fxLayer, assets) {
    var raf = null;
    var last = 0;
    var lastRafAt = 0;          /* detects stalled rAF (degraded contexts) */
    var items = [];
    var frozen = false;

    /* Question flight config (from levels.json via game.js). */
    var limitSec = 24;
    var swayProfile = SWAY.float;
    var swayAmp = 8;            /* desktop breeze amplitude (px) */
    var mode = 'idle';          /* idle | fly | escape */
    var elapsed = 0;            /* THE authoritative play clock (seconds) */
    var lastClockAt = 0;        /* performance.now of the last clock tick */
    var escapeT = 0;
    var escapeResolve = null;
    var escapeTimer = null;
    var startHoldTimer = null;
    var riseStartY = 0;         /* group rise band in px (body-aware) */
    var riseEndY = 0;
    var swayX = 26;
    var crossFactor = CROSS.float;
    var areaCache = null;       /* geometry cache: no layout reads per frame */

    function rect() {
      var r = container.getBoundingClientRect();
      return { w: r.width, h: r.height };
    }

    function areaRect() {
      if (!areaCache) areaCache = rect();
      return areaCache;
    }

    function aspectFor(color) {
      return assets.aspects && assets.aspects[color] ? assets.aspects[color] : 1.18;
    }

    /* Formation geometry for a question: landscape = single row;
       portrait = dedicated mobile formations (2+1 triangle, 2x2, 3+2).
       Slots carry their row index; the row pitch is body-based so
       inflated bodies can never overlap each other. */
    /* Portrait vs landscape must follow the VIEWPORT orientation: on
       short phones the play area itself is wider than tall (chrome eats
       height), which must NOT collapse the mobile grid to one row. */
    function isPortrait() {
      return root.innerWidth < root.innerHeight;
    }

    function formation(count, area) {
      var slots = [];
      if (!isPortrait()) {
        for (var i = 0; i < count; i++) slots.push({ x: (i + 0.5) / count, row: 0 });
        return { slots: slots, rows: 1 };
      }
      if (count === 3) {
        slots.push({ x: 0.5, row: 0 });
        slots.push({ x: 0.27, row: 1 });
        slots.push({ x: 0.73, row: 1 });
      } else if (count === 4) {
        slots.push({ x: 0.28, row: 0 });
        slots.push({ x: 0.72, row: 0 });
        slots.push({ x: 0.28, row: 1 });
        slots.push({ x: 0.72, row: 1 });
      } else {
        slots.push({ x: 0.18, row: 0 });
        slots.push({ x: 0.5, row: 0 });
        slots.push({ x: 0.82, row: 0 });
        slots.push({ x: 0.3, row: 1 });
        slots.push({ x: 0.7, row: 1 });
      }
      return { slots: slots, rows: 2 };
    }

    function sizeFor(area, count) {
      var f = formation(count, area);
      var cols = 1, rows = f.rows;
      /* widest row decides the column count */
      var perRow = {};
      f.slots.forEach(function (sl) { perRow[sl.row] = (perRow[sl.row] || 0) + 1; });
      Object.keys(perRow).forEach(function (r) { cols = Math.max(cols, perRow[r]); });

      var phone = area.w < 620;
      var gapX = phone ? 12 + area.w * 0.012 : 22;
      var gapY = phone ? 16 + area.h * 0.012 : 26;
      var bodyWFactor = 0.9;  /* visible body width vs image width */
      var bodyHFactor = 0.99; /* visible body height vs image width */

      var byW = (area.w * 0.94 - (cols - 1) * gapX) / cols / bodyWFactor;
      var byH = (area.h * 0.62 - (rows - 1) * gapY) / rows / bodyHFactor;

      var cap = phone ? Math.max(88, Math.min(118, area.w * 0.29))
        : (count >= 5 ? 195 : 220);
      var s = Math.min(byW, byH, cap);
      var floor = phone ? 76 : 110;
      s = Math.max(Math.min(floor, byH), s);
      return Math.max(64, Math.round(s));
    }

    /* Slots for a fresh question: the formation's slots, shuffled so
       answers are positionally fair (the geometry itself is fixed). */
    function slotsFor(count, area) {
      var slots = formation(count, area).slots.slice();
      for (var k = slots.length - 1; k > 0; k--) {
        var j = Math.floor(Math.random() * (k + 1));
        var tmp = slots[k]; slots[k] = slots[j]; slots[j] = tmp;
      }
      return slots;
    }

    function labelClass(text) {
      var n = text.length;
      if (n <= 6) return 'len-s';
      if (n <= 12) return 'len-m';
      return 'len-l';
    }

    /* Readable label at any balloon size: proportional but clamped. */
    function labelFontSize(text, size) {
      var n = text.length;
      var f = n <= 6 ? size * 0.155 : (n <= 12 ? size * 0.125 : size * 0.105);
      return Math.max(15, Math.min(f, 34));
    }

    /* Drift amplitude per balloon: a fraction of the lane spacing, so
       neighbours' paths overlap and cross. DESKTOP ONLY - phones keep
       stable lanes so answer bodies can never cover each other. */
    function computeDrift(area) {
      if (isPortrait()) { /* stable lanes on every portrait layout */
        items.forEach(function (item) { item.drift1.amp = 0; item.drift2.amp = 0; });
        return;
      }
      /* Lane spacing between DISTINCT columns only: on portrait grids
         two rows share the same x, and a naive pairwise minimum would be
         zero and kill all drift. */
      var minDx = Infinity;
      for (var a = 0; a < items.length; a++) {
        for (var b = a + 1; b < items.length; b++) {
          var dx = Math.abs(items[a].anchor.x - items[b].anchor.x);
          if (dx > 1) minDx = Math.min(minDx, dx);
        }
      }
      if (!isFinite(minDx)) minDx = area.w;
      var phone = area.w < 620 ? 0.6 : 1;
      items.forEach(function (item) {
        var amp = minDx * crossFactor * phone;
        /* never push a body edge inside 6px of the area bounds */
        var maxAmp = Math.max(0, Math.min(item.anchor.x, area.w - item.anchor.x) - item.size / 2 - 6);
        item.drift1.amp = Math.min(amp, maxAmp);
        item.drift2.amp = item.drift1.amp * 0.5;
      });
    }

    /* Sway lane budget: half the clear gap between same-row bodies, so
       even the breeze sway can never make two bodies touch. */
    function computeSway() {
      var minDx = Infinity;
      for (var a = 0; a < items.length; a++) {
        for (var b = a + 1; b < items.length; b++) {
          if (items[a].row !== items[b].row) continue;
          var dx = Math.abs(items[a].anchor.x - items[b].anchor.x);
          minDx = Math.min(minDx, dx);
        }
      }
      if (!isFinite(minDx)) { swayX = 40; return; }
      var bodyW = (items[0] ? items[0].size : 100) * 0.9;
      swayX = Math.max(2, (minDx - bodyW - 10) / 2);
    }

    function spawn(options, opts) {
      mode = 'idle';
      elapsed = 0;
      escapeT = 0;
      if (escapeTimer) { clearTimeout(escapeTimer); escapeTimer = null; }
      if (startHoldTimer) { clearTimeout(startHoldTimer); startHoldTimer = null; }
      limitSec = (opts && opts.limitSec) || 24;
      swayProfile = SWAY[(opts && opts.pattern)] || SWAY.float;
      crossFactor = CROSS[(opts && opts.pattern)] || CROSS.float;
      var swaySpeed = (opts && opts.speed) || 30;

      var area = rect();
      var size = sizeFor(area, options.length);
      var slots = slotsFor(options.length, area);
      var clusterW = Math.min(area.w, ULTRAWIDE_CLUSTER);
      var clusterOff = (area.w - clusterW) / 2;

      /* Body-aware rise band with formation pitch: the group spawns in
         the lower-middle of the area (not glued to the bottom) and the
         topmost row's crown stays visible at the deadline. */
      var phone = area.w < 620;
      var frm = formation(options.length, area);
      var rowDy = size * 0.99 + (phone ? 16 + area.h * 0.012 : 26); /* body height + gap */
      var halfPitch = ((frm.rows - 1) / 2) * rowDy;
      var bodyHalf = size * 0.72; /* artwork half-height (2:3 aspect) */
      riseEndY = bodyHalf + halfPitch + 4;
      riseStartY = Math.max(riseEndY + 60, area.h - bodyHalf - halfPitch - 10);
      swayAmp = Math.min(swayProfile.amp * (phone ? 0.55 : 1), phone ? 5.5 : 18);

      options.forEach(function (opt, i) {
        var aspect = aspectFor(opt.color);
        var el = document.createElement('div');
        el.className = 'balloon' + (assets.balloons[opt.color] ? ' has-img' : ' css-balloon');
        el.dataset.color = opt.color;
        el.dataset.answerId = opt.id;
        el.setAttribute('role', 'button');
        el.setAttribute('aria-label', opt.text);
        el.style.width = size + 'px';
        el.style.height = Math.round(size * aspect) + 'px';

        var inner = document.createElement('div');
        inner.className = 'balloon-inner';

        if (assets.balloons[opt.color]) {
          var img = document.createElement('img');
          img.className = 'balloon-img';
          img.alt = '';
          img.draggable = false;
          img.src = assets.balloons[opt.color];
          inner.appendChild(img);
        }
        var label = document.createElement('span');
        label.className = 'balloon-label ' + labelClass(opt.text);
        label.textContent = opt.text;
        label.style.fontSize = labelFontSize(opt.text, size) + 'px';
        inner.appendChild(label);
        el.appendChild(inner);

        var slot = slots[i];
        var item = {
          id: opt.id,
          color: opt.color,
          text: opt.text,
          el: el,
          inner: inner,
          anchor: {
            x: clusterOff + slot.x * clusterW,
            nx: slot.x
          },
          slotIdx: i,                 /* stable slot for resize re-gridding */
          row: slot.row,
          rowOff: (slot.row - (frm.rows - 1) / 2) * rowDy, /* centered rows */
          size: size,
          aspect: aspect,
          phase: Math.random() * Math.PI * 2,
          /* Gentle breeze: one full sway cycle per ~3.5-5s (slightly
             brisker on higher levels), one tilt cycle per ~6-9s. */
          swayW: TAU / ((4.6 - (swaySpeed / 56) * 1.2) * (0.9 + Math.random() * 0.25)),
          rotW: TAU / (6 + Math.random() * 3),
          /* Crossing drift path: two slow sines with independent phases,
             generated once per question - never re-randomized per frame.
             The amplitude is set after slots are known (computeDrift). */
          drift1: { amp: 0, w: TAU / (7 + Math.random() * 3), p: Math.random() * TAU },
          drift2: { amp: 0, w: TAU / (11 + Math.random() * 4), p: Math.random() * TAU },
          curX: clusterOff + slot.x * clusterW,
          disabled: false,
          popped: false,
          _timers: []
        };
        /* Stable per-question layering: crossings have predictable hit
           targets and never flicker between z-levels. */
        el.style.zIndex = 10 + i;
        items.push(item);
        /* Position BEFORE attaching: no first frame at (0,0). */
        placeAtSpawn(item);
        container.appendChild(el);

        /* Polished entrance: identical fade + rise for every balloon
           (no scale-from-zero, no per-balloon size surprises). */
        try {
          var enter = inner.animate(
            [
              { transform: 'translateY(30px)', opacity: 0 },
              { transform: 'translateY(0px)', opacity: 1 }
            ],
            { duration: reducedMotion ? 1 : 380, easing: 'cubic-bezier(.25,.8,.35,1)', fill: 'backwards' }
          );
          item._timers.push(setTimeout(function () { try { enter.cancel(); } catch (e) { } }, 460));
        } catch (e) { /* cosmetic only */ }
      });

      computeSway();
      computeDrift(area);
      areaCache = area;
      last = performance.now();

      /* Short reading/entrance hold before the countdown and the rise
         begin together (game.js treats field elapsed 0 as clock start). */
      var hold = (opts && opts.holdMs) || 900;
      startHoldTimer = setTimeout(function () {
        startHoldTimer = null;
        mode = 'fly';
        last = performance.now();
        lastClockAt = performance.now();
      }, reducedMotion ? Math.min(hold, 300) : hold);

      if (raf === null) raf = requestAnimationFrame(tick);
    }

    /* Apply the fly-frame for time renderT: linear group rise (subpixel,
     * no rounding stair-step) + drifting X on the position wrapper +
     * gentle breeze sway and direction-lean on the inner wrapper. */
    function applyFlyPositions(renderT) {
      var p = Math.min(1, renderT / limitSec);
      var groupY = riseStartY + (riseEndY - riseStartY) * p; /* 50% time = 50% travel */
      var amp = Math.min(swayAmp, swayX) * (reducedMotion ? 0.5 : 1);
      var rotAmp = 1.6 * (reducedMotion ? 0.5 : 1);
      var area = areaRect();
      items.forEach(function (item) {
        if (item.popped || item.disabled || !item.el) return;
        var y = groupY + item.rowOff;
        item.y = y;
        /* Crossing drift: two slow sines, clamped softly to the area so
         * a balloon eases into vertical travel near the edges instead of
         * bouncing. y stays subpixel for smooth motion at any FPS. */
        var d1 = item.drift1, d2 = item.drift2;
        var x = item.anchor.x +
          Math.sin(renderT * d1.w + d1.p) * d1.amp +
          Math.sin(renderT * d2.w + d2.p) * d2.amp;
        var vx = Math.cos(renderT * d1.w + d1.p) * d1.w * d1.amp +
          Math.cos(renderT * d2.w + d2.p) * d2.w * d2.amp;
        var minX = item.size / 2 + 6;
        var maxX = area.w - item.size / 2 - 6;
        if (x < minX) x = minX; else if (x > maxX) x = maxX;
        item.curX = x;
        item.el.style.transform =
          'translate3d(' + (x - item.size / 2).toFixed(2) + 'px,' +
          (y - item.size * item.aspect / 2).toFixed(2) + 'px,0)';
        var sway = Math.sin(renderT * item.swayW + item.phase) * amp;
        /* lean slightly into the drift direction (capped) */
        var lean = Math.max(-1.1, Math.min(1.1, vx * 0.05));
        var tilt = Math.sin(renderT * item.rotW + item.phase * 0.7) * rotAmp + lean;
        item.inner.style.transform =
          'translateX(' + sway.toFixed(2) + 'px) rotate(' + tilt.toFixed(2) + 'deg)';
      });
    }

    /* The game loop (interval) advances the authoritative clock; the rAF
       is the sole renderer while it runs (interpolating between clock
       ticks for smoothness at any FPS). Only when rAF is detected as
       stalled (throttled background contexts) does the clock tick also
       apply positions, so the game stays correct everywhere. */
    function advanceClock(ms) {
      if (mode === 'fly' && !frozen) {
        elapsed += ms / 1000;
        lastClockAt = performance.now();
        /* Degraded context (rAF stalled): the clock tick keeps the game
           rendering. When rAF is healthy it stays the sole writer. */
        if (performance.now() - lastRafAt > 250) {
          applyFlyPositions(elapsed);
        }
      }
    }

    function placeAtSpawn(item) {
      var y = riseStartY + item.rowOff;
      item.y = y;
      item.curX = item.anchor.x;
      item.el.style.transform =
        'translate3d(' + Math.round(item.anchor.x - item.size / 2) + 'px,' +
        (y - item.size * item.aspect / 2).toFixed(2) + 'px,0)';
    }

    function tick(now) {
      raf = requestAnimationFrame(tick);
      lastRafAt = now;
      var dt = (now - last) / 1000;
      last = now;
      if (dt < 0) dt = 0;
      if (dt > 0.05) dt = 0.05; /* frame-drop guard: no teleporting */
      if (frozen) return;

      if (mode === 'fly') {
        /* Render time = authoritative clock + smooth interpolation
           toward the next tick (capped at one tick). */
        var since = Math.min(0.12, (now - lastClockAt) / 1000);
        applyFlyPositions(elapsed + since);
      } else if (mode === 'escape') {
        escapeT += dt;
        var area = areaRect();
        var escapeSpeed = Math.max(420, area.h * 0.9); /* px/s */
        items.forEach(function (item) {
          if (!item.el || item.popped || item.disabled) return;
          if (item.y === undefined) item.y = riseStartY + item.rowOff;
          item.y -= escapeSpeed * dt;
          item.el.style.transform =
            'translate3d(' + (item.curX - item.size / 2).toFixed(2) + 'px,' +
            (item.y - item.size * item.aspect / 2).toFixed(2) + 'px,0)';
        });
        if (escapeT > 0.9 && escapeResolve) {
          escapeResolve();
          escapeResolve = null;
        }
      }
    }

    /* ---- interactions ---- */

    function byId(id) {
      for (var i = 0; i < items.length; i++) if (items[i].id === id) return items[i];
      return null;
    }

    function particles(x, y, color, star) {
      if (reducedMotion) return;
      var n = star ? 9 : 6;
      for (var i = 0; i < n; i++) {
        var p = document.createElement('div');
        p.className = 'particle' + (star && i % 3 === 0 ? ' star' : '');
        p.style.left = x + 'px';
        p.style.top = y + 'px';
        p.style.background = star && i % 3 === 0 ? 'transparent' : null;
        fxLayer.appendChild(p);
        var ang = Math.random() * Math.PI * 2;
        var dist = 38 + Math.random() * 55;
        try {
          p.animate(
            [
              { transform: 'translate(-50%,-50%) scale(1)', opacity: 1 },
              {
                transform: 'translate(' + (Math.cos(ang) * dist - 4) + 'px,' + (Math.sin(ang) * dist - 4) + 'px) scale(' + (0.2 + Math.random() * 0.5) + ') rotate(' + (Math.random() * 240 - 120) + 'deg)',
                opacity: 0
              }
            ],
            { duration: 480 + Math.random() * 220, easing: 'cubic-bezier(.2,.7,.4,1)' }
          );
        } catch (e) { /* cosmetic only */ }
        setTimeout(function () { p.remove(); }, 950); /* timer-backed cleanup */
      }
    }

    /* Pop a balloon: tiny scale pulse -> popped image (or CSS burst) ->
       fade -> remove. Everything animates the inner wrapper, so the
       position transform is never touched. Timer-backed fallbacks keep
       gameplay moving even if WAAPI is throttled. */
    function pop(id, correct) {
      return new Promise(function (resolve) {
        var item = byId(id);
        if (!item || item.popped) { resolve(null); return; }
        item.popped = true;
        item.el.style.pointerEvents = 'none';
        var r = item.el.getBoundingClientRect();
        var cr = container.getBoundingClientRect();
        var cx = r.left - cr.left + r.width / 2;
        var cy = r.top - cr.top + r.height / 2;

        var done = false;
        var finish = function () {
          if (done) return;
          done = true;
          var poppedSrc = assets.popped[item.color];
          if (poppedSrc) {
            var img = item.inner.querySelector('.balloon-img');
            if (!img) {
              img = document.createElement('img');
              img.className = 'balloon-img';
              img.alt = '';
              item.inner.prepend(img);
            }
            img.src = poppedSrc;
            /* Scale the burst so its VISIBLE artwork matches the
               inflated body's visual diameter. */
            var nv = (VIS.normal[item.color] || { w: 0.9, cx: 0.5, cy: 0.5 });
            var pv = (VIS.popped[item.color] || { w: 0.9, cx: 0.5, cy: 0.5 });
            var iw = img.naturalWidth || 1;
            var ih = img.naturalHeight || 1;
            var visBodyW = item.size * nv.w;
            var drawW = (visBodyW * BURST_SCALE) / pv.w;
            var drawH = drawW * (ih / iw);
            var elH = item.size * item.aspect;
            img.style.position = 'absolute';
            img.style.left = (item.size * nv.cx - pv.cx * drawW) + 'px';
            img.style.top = (elH * nv.cy - pv.cy * drawH) + 'px';
            img.style.width = drawW + 'px';
            img.style.height = drawH + 'px';
            img.style.objectFit = 'fill';
            item.el.classList.add('popped-img');
          } else {
            item.el.classList.add('popped-css');
          }
          item.inner.classList.add('burst');
          particles(cx, cy, item.color, correct);
          try {
            item.inner.animate(
              [{ opacity: 1 }, { opacity: 0 }],
              { duration: 620, delay: 120, fill: 'forwards', easing: 'ease-out' }
            );
          } catch (e) { /* cosmetic only */ }
          item._timers.push(setTimeout(function () {
            if (item.inner) item.inner.style.opacity = '0';
          }, 740));
          item._timers.push(setTimeout(function () {
            if (item.el) { item.el.remove(); item.el = null; }
          }, 780));
          setTimeout(resolve, correct ? 300 : 420);
        };

        /* Tiny, natural scale pulse on the inner wrapper only - no
           horizontal squash of the position layer. */
        try {
          var squash = item.inner.animate(
            [
              { transform: item.inner.style.transform + ' scale(1)', offset: 0 },
              { transform: item.inner.style.transform + ' scale(1.07)', offset: 0.45 },
              { transform: item.inner.style.transform + ' scale(0.96)', offset: 1 }
            ],
            { duration: reducedMotion ? 1 : 120, easing: 'ease-out' }
          );
          squash.onfinish = finish;
        } catch (e) { /* cosmetic only */ }
        item._timers.push(setTimeout(finish, (reducedMotion ? 1 : 120) + 70));
      });
    }

    /* Remove wrong options via 50/50: fizzle out, flight continues. */
    function fizzle(id) {
      var item = byId(id);
      if (!item || item.popped || item.disabled) return;
      item.disabled = true;
      item.el.classList.add('fizzled');
      item.el.style.pointerEvents = 'none';
      var r = item.el.getBoundingClientRect();
      var cr = container.getBoundingClientRect();
      particles(r.left - cr.left + r.width / 2, r.top - cr.top + r.height / 2, item.color, false);
    }

    function disable(id) {
      var item = byId(id);
      if (!item) return;
      item.disabled = true;
      item.el.style.pointerEvents = 'none';
    }

    function setFrozen(v) {
      frozen = v;
      container.classList.toggle('frozen', v);
      last = performance.now();
    }

    /* Timeout: remaining balloons rise out through the top together. */
    function escape() {
      return new Promise(function (res) {
        if (mode !== 'fly') { res(); return; }
        mode = 'escape';
        escapeT = 0;
        escapeResolve = res;
        /* Hard fallback so gameplay never waits on a stalled rAF. */
        escapeTimer = setTimeout(function () {
          escapeTimer = null;
          if (escapeResolve) { var r2 = escapeResolve; escapeResolve = null; r2(); }
        }, 1100);
      });
    }

    /* ---- layout maintenance ---- */

    /* Deterministic formation (no shuffle) for resize re-gridding: each
       balloon keeps its original slot index, so answers never swap
       places when the viewport changes shape. */
    function formationFor(count, area) {
      return formation(count, area).slots;
    }

    function relayout() {
      var area = rect();
      if (!items.length) return;
      areaCache = area;
      var size = sizeFor(area, items.length);
      var clusterW = Math.min(area.w, ULTRAWIDE_CLUSTER);
      var clusterOff = (area.w - clusterW) / 2;
      /* Re-grid the formation for the current orientation (portrait 2x2 /
         3+2 vs landscape single row); each balloon keeps its own slot. */
      var phone = area.w < 620;
      var slots = formationFor(items.length, area);
      var frmRows = formation(items.length, area).rows;
      var rowDy = size * 0.99 + (phone ? 16 + area.h * 0.012 : 26);
      var halfPitch = ((frmRows - 1) / 2) * rowDy;
      items.forEach(function (item) {
        if (item.popped || !item.el) return;
        var slot = slots[item.slotIdx] || slots[0];
        item.anchor.nx = slot.x;
        item.anchor.x = clusterOff + slot.x * clusterW;
        item.row = slot.row;
        item.rowOff = (slot.row - (frmRows - 1) / 2) * rowDy;
        item.size = size;
        item.aspect = aspectFor(item.color);
        item.el.style.width = size + 'px';
        item.el.style.height = Math.round(size * item.aspect) + 'px';
        var lbl = item.inner.querySelector('.balloon-label');
        if (lbl) lbl.style.fontSize = labelFontSize(item.text, size) + 'px';
      });
      /* Recompute the rise band for the new geometry. */
      var bodyHalf = size * 0.72; /* artwork half-height (2:3 aspect) */
      riseEndY = bodyHalf + halfPitch + 4;
      riseStartY = Math.max(riseEndY + 60, area.h - bodyHalf - halfPitch - 10);
      swayAmp = Math.min(swayProfile.amp * (phone ? 0.55 : 1), phone ? 5.5 : 18);
      computeSway();
      computeDrift(area);
      /* Re-place immediately at the current progress so no balloon
         shifts sideways or teleports after a resize. */
      if (mode === 'fly') {
        applyFlyPositions(elapsed);
      } else if (mode !== 'escape') {
        items.forEach(function (item) {
          if (item.popped || !item.el) return;
          placeAtSpawn(item);
        });
      }
    }

    /* Remove every balloon, cancel its pending animation timers and wipe
       leftover particles. Called before each new question. */
    function clear() {
      if (startHoldTimer) { clearTimeout(startHoldTimer); startHoldTimer = null; }
      if (escapeTimer) { clearTimeout(escapeTimer); escapeTimer = null; }
      if (escapeResolve) { escapeResolve = null; }
      items.forEach(function (item) {
        (item._timers || []).forEach(function (tid) { clearTimeout(tid); });
        if (item.el) item.el.remove();
      });
      items = [];
      mode = 'idle';
      elapsed = 0;
      if (fxLayer) {
        while (fxLayer.firstChild) fxLayer.removeChild(fxLayer.firstChild);
      }
    }

    function destroy() {
      if (raf) cancelAnimationFrame(raf);
      raf = null;
      clear();
    }

    return {
      spawn: spawn,
      advanceClock: advanceClock,
      pop: pop,
      fizzle: fizzle,
      disable: disable,
      setFrozen: setFrozen,
      escape: escape,
      relayout: relayout,
      clear: clear,
      destroy: destroy,
      colors: COLORS,
      isFlying: function () { return mode === 'fly' && !frozen; },
      getElapsed: function () { return elapsed; }
    };
  }

  root.BP = root.BP || {};
  root.BP.assets = { detect: detectAssets, colors: COLORS };
  root.BP.balloonField = createBalloons;
})(typeof window !== 'undefined' ? window : globalThis);
