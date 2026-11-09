/* Balloon Pop - Balloon engine: asset detection, responsive layout,
   movement patterns (requestAnimationFrame + delta time), pop animation
   and particles. All movement is transform-based; balloons are clamped
   to the safe play area and never overlap the question card or HUD
   because #play-area is a dedicated flex region between them. */
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
    var t = 0;                 /* accumulated animation time (s), frozen-aware */
    var items = [];            /* live balloons */
    var frozen = false;
    var pattern = 'float';
    var speed = 30;            /* px/s reference */
    var running = false;
    var swayX = 26;            /* max horizontal drift so balloons never collide */

    function rect() {
      var r = container.getBoundingClientRect();
      return { w: r.width, h: r.height };
    }

    function aspectFor(color) {
      return assets.aspects && assets.aspects[color] ? assets.aspects[color] : 1.18;
    }

    /* Balloon body width from the real playable rectangle.
       Desktop targets 145-220px bodies; phones 88-125px; height follows
       the real image aspect (width * aspect). */
    function sizeFor(area, count) {
      var landscape = area.w / area.h >= 0.95;
      var aspect = 1.5; /* dominant real-asset aspect */
      var cols, rows;
      if (landscape) { cols = count; rows = 1; }
      else { rows = 2; cols = count === 5 ? 3 : 2; }

      var clusterW = Math.min(area.w, ULTRAWIDE_CLUSTER) * 0.92;
      var byW = clusterW / cols;
      var byH = (area.h * 0.94) / rows / aspect;

      var cap = count >= 5 ? 195 : 220;
      var s = Math.min(byW, byH, cap);

      var floor = area.w < 640 ? 82 : 110;
      s = Math.max(Math.min(floor, byH), s);
      return Math.max(64, Math.round(s));
    }

    /* Normalized anchor slots for the given count. Portrait uses a
       staggered formation (triangle for 3, 2+2, 3+2); landscape is one
       row inside a centered cluster so ultrawide screens stay balanced. */
    function slotsFor(count, area) {
      var landscape = area.w / area.h >= 0.95;
      var slots = [];
      if (landscape) {
        for (var i = 0; i < count; i++) slots.push({ x: (i + 0.5) / count, y: 0.52 });
      } else if (count === 3) {
        slots.push({ x: 0.5, y: 0.30 });
        slots.push({ x: 0.26, y: 0.73 });
        slots.push({ x: 0.74, y: 0.73 });
      } else if (count === 4) {
        slots.push({ x: 0.26, y: 0.30 });
        slots.push({ x: 0.74, y: 0.30 });
        slots.push({ x: 0.26, y: 0.73 });
        slots.push({ x: 0.74, y: 0.73 });
      } else {
        slots.push({ x: 0.18, y: 0.28 });
        slots.push({ x: 0.5, y: 0.28 });
        slots.push({ x: 0.82, y: 0.28 });
        slots.push({ x: 0.33, y: 0.74 });
        slots.push({ x: 0.67, y: 0.74 });
      }
      /* Shuffle slot assignment so answers are positionally fair. */
      for (var k = slots.length - 1; k > 0; k--) {
        var j = Math.floor(Math.random() * (k + 1));
        var tmp = slots[k]; slots[k] = slots[j]; slots[j] = tmp;
      }
      return slots;
    }

    /* Horizontal sway budget: half the gap between horizontally adjacent
       balloons, minus a margin. Clamping drift to this keeps balloons
       from ever overlapping during movement, not just at spawn. */
    function computeSway() {
      var minDx = Infinity;
      for (var a = 0; a < items.length; a++) {
        for (var b = a + 1; b < items.length; b++) {
          var dy = Math.abs(items[a].anchor.y - items[b].anchor.y);
          if (dy < items[a].size * 0.8) {
            minDx = Math.min(minDx, Math.abs(items[a].anchor.x - items[b].anchor.x));
          }
        }
      }
      swayX = isFinite(minDx) ? Math.max(5, (minDx - items[0].size) / 2 - 8) : 40;
    }

    function labelClass(text) {
      var n = text.length;
      if (n <= 6) return 'len-s';
      if (n <= 12) return 'len-m';
      return 'len-l';
    }

    /* Readable label at any balloon size: proportional but clamped, so
       long answers on small phones never shrink below 15px. */
    function labelFontSize(text, size) {
      var n = text.length;
      var f = n <= 6 ? size * 0.155 : (n <= 12 ? size * 0.125 : size * 0.105);
      return Math.max(15, Math.min(f, 34));
    }

    function spawn(options, opts) {
      pattern = opts.pattern || 'float';
      speed = opts.speed || 30;
      var area = rect();
      var size = sizeFor(area, options.length);
      var slots = slotsFor(options.length, area);
      if (area.w / area.h >= 0.95) {
        /* Landscape: alternate gentle vertical offsets so a row of
           balloons looks natural instead of mechanically aligned. */
        slots.forEach(function (s, i) { s.y = i % 2 === 0 ? 0.47 : 0.58; });
      }
      var clusterW = Math.min(area.w, ULTRAWIDE_CLUSTER);
      var clusterOff = (area.w - clusterW) / 2;
      var amp = reducedMotion ? 0.55 : 1;
      void amp;

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

        if (assets.balloons[opt.color]) {
          var img = document.createElement('img');
          img.className = 'balloon-img';
          img.alt = '';
          img.draggable = false;
          img.src = assets.balloons[opt.color];
          el.appendChild(img);
        }
        var label = document.createElement('span');
        label.className = 'balloon-label ' + labelClass(opt.text);
        label.textContent = opt.text;
        label.style.fontSize = labelFontSize(opt.text, size) + 'px';
        el.appendChild(label);

        var slot = slots[i];
        var item = {
          id: opt.id,
          color: opt.color,
          text: opt.text,
          el: el,
          anchor: {
            x: clusterOff + slot.x * clusterW,
            y: slot.y * area.h
          },
          size: size,
          aspect: aspect,
          phase: Math.random() * Math.PI * 2,
          freq: 0.75 + Math.random() * 0.5,
          dir: i % 2 === 0 ? 1 : -1,
          yOff: 0,
          xOff: 0,
          disabled: false,
          popped: false,
          _timers: []
        };
        items.push(item);
        /* Position BEFORE attaching: the balloon can never paint a
           single frame at the untranslated (0,0) spot. */
        place(item);
        container.appendChild(el);

        /* Pop-in animation; timer-cancelled so a suspended animation
           engine can never leave the balloon stuck at scale(0). */
        try {
          var popIn = el.animate(
            [{ transform: buildTransform(item) + ' scale(0)', opacity: 0 }, { transform: buildTransform(item) + ' scale(1)', opacity: 1 }],
            { duration: reducedMotion ? 1 : 380, delay: i * 70, easing: 'cubic-bezier(.34,1.56,.64,1)', fill: 'backwards' }
          );
          item._timers.push(setTimeout(function () { try { popIn.cancel(); } catch (e) { /* already finished */ } }, i * 70 + 460));
        } catch (e) { /* cosmetic only */ }
      });

      computeSway();
      last = performance.now();
      if (!running) {
        running = true;
        raf = requestAnimationFrame(tick);
      }
    }

    function buildTransform(item) {
      var x = item.anchor.x + item.xOff;
      var y = item.anchor.y + item.yOff;
      var hw = item.size / 2;
      var hh = item.size * item.aspect / 2;
      return 'translate3d(' + Math.round(x - hw) + 'px,' + Math.round(y - hh) + 'px,0)';
    }

    function place(item) {
      item.el.style.transform = buildTransform(item);
    }

    function clampToArea(item) {
      var area = rect();
      var hw = item.size / 2;
      var hh = item.size * item.aspect / 2;
      var cx = item.anchor.x + item.xOff;
      var cy = item.anchor.y + item.yOff;
      var maxX = area.w - hw - 4;
      var minX = hw + 4;
      var maxY = area.h - hh - 2;
      var minY = hh + 2;
      if (cx !== Math.min(Math.max(cx, minX), maxX)) {
        item.xOff += Math.min(Math.max(cx, minX), maxX) - cx;
      }
      if (cy !== Math.min(Math.max(cy, minY), maxY)) {
        item.yOff += Math.min(Math.max(cy, minY), maxY) - cy;
      }
    }

    function tick(now) {
      raf = requestAnimationFrame(tick);
      var dt = (now - last) / 1000;
      last = now;
      if (dt > 0.05) dt = 0.05; /* frame-drop guard keeps motion predictable */
      if (frozen) return;
      t += dt;
      var area = rect();
      var amp = reducedMotion ? 0.55 : 1;

      items.forEach(function (item) {
        if (item.popped || item.disabled) return;
        var aH = Math.min(area.h * 0.14, 42) * amp;
        var aW = Math.min(area.w * 0.05, 24) * amp;
        switch (pattern) {
          case 'float':
            item.xOff = Math.sin(t * item.freq + item.phase) * 8 * amp;
            item.yOff = Math.sin(t * item.freq * 0.8 + item.phase * 1.3) * 7 * amp;
            break;
          case 'drift':
            item.xOff = Math.sin(t * item.freq * 0.6 + item.phase) * aW;
            item.yOff = Math.sin(t * item.freq + item.phase) * aH;
            break;
          case 'wave':
            item.xOff = Math.sin(t * (0.5 + item.freq * 0.5) + item.phase) * (aW * 1.7);
            item.yOff = Math.sin(t * item.freq + item.phase * 1.7) * aH;
            break;
          case 'stagger':
            item.yOff += item.dir * speed * dt * amp;
            if (item.yOff > aH) { item.yOff = aH; item.dir = -1; }
            if (item.yOff < -aH) { item.yOff = -aH; item.dir = 1; }
            item.xOff = Math.sin(t * item.freq * 0.9 + item.phase) * aW;
            break;
          case 'combo':
            item.yOff += item.dir * speed * 1.15 * dt * amp;
            if (item.yOff > aH) { item.yOff = aH; item.dir = -1; }
            if (item.yOff < -aH) { item.yOff = -aH; item.dir = 1; }
            item.xOff = Math.sin(t * (0.65 + item.freq * 0.6) + item.phase) * (aW * 1.9);
            break;
        }
        /* Clamp horizontal drift so balloons never drift into a
           neighbour's space, whatever the movement pattern. */
        item.xOff = Math.max(-swayX, Math.min(swayX, item.xOff));
        clampToArea(item);
        place(item);
      });
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

    /* Pop a balloon: squash -> popped image (or CSS burst) -> fade.
       Resolution is timer-backed: WAAPI onfinish can be delayed or never
       fire in throttled/non-painting contexts, and gameplay must never
       hang on an animation. */
    function pop(id, correct) {
      return new Promise(function (resolve) {
        var item = byId(id);
        if (!item || item.popped) { resolve(null); return; }
        item.popped = true;
        item.el.classList.add('popping');
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
            var img = item.el.querySelector('.balloon-img');
            if (!img) {
              img = document.createElement('img');
              img.className = 'balloon-img';
              img.alt = '';
              item.el.prepend(img);
            }
            img.src = poppedSrc;
            /* Scale the burst so its VISIBLE artwork matches the inflated
               body's visual diameter (the popped PNGs have a different
               aspect and their own transparent padding). */
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
            img.style.objectFit = 'fill'; /* drawW/drawH already match the aspect */
            item.el.classList.add('popped-img');
          } else {
            item.el.classList.add('popped-css');
          }
          item.el.classList.remove('popping');
          particles(cx, cy, item.color, correct);
          /* Fade runs right away (no delay gap where the burst could
             blink invisible: the previous inline-opacity approach fought
             the animation's start delay). */
          try {
            item.el.animate(
              [{ opacity: 1 }, { opacity: 0 }],
              { duration: 620, delay: 120, fill: 'forwards', easing: 'ease-out' }
            );
          } catch (e) { /* cosmetic only */ }
          /* Timer-backed fallbacks: hide then fully remove the popped
             balloon. Tracked so a question change cancels them. */
          item._timers.push(setTimeout(function () {
            if (item.el) item.el.style.opacity = '0';
          }, 740));
          item._timers.push(setTimeout(function () {
            if (item.el) { item.el.remove(); item.el = null; }
          }, 780));
          setTimeout(resolve, correct ? 300 : 420);
        };

        var anim = null;
        try {
          anim = item.el.animate(
            [
              { transform: item.el.style.transform + ' scale(1)', offset: 0 },
              { transform: item.el.style.transform + ' scale(1.18,0.82)', offset: 0.3 },
              { transform: item.el.style.transform + ' scale(0.9,1.1)', offset: 0.6 },
              { transform: item.el.style.transform + ' scale(1)', offset: 1 }
            ],
            { duration: reducedMotion ? 1 : 140, easing: 'ease-out' }
          );
          anim.onfinish = finish;
        } catch (e) { /* cosmetic only */ }

        item._timers.push(setTimeout(finish, (reducedMotion ? 1 : 140) + 80)); /* fallback */
      });
    }

    /* Remove wrong options via 50/50: fizzle out. */
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

    /* Disable a wrongly-picked balloon; keep remnant visible. */
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

    function relayout() {
      var area = rect();
      if (!items.length) return;
      var size = sizeFor(area, items.length);
      var clusterW = Math.min(area.w, ULTRAWIDE_CLUSTER);
      var clusterOff = (area.w - clusterW) / 2;
      items.forEach(function (item) {
        /* Popped balloons are already gone or fading out - leave them. */
        if (item.popped || !item.el) return;
        /* Recompute anchors from stored normalized slots. */
        var nx = item.anchor.nx !== undefined ? item.anchor.nx : (item.anchor.x / Math.max(1, area.w));
        var ny = item.anchor.ny !== undefined ? item.anchor.ny : (item.anchor.y / Math.max(1, area.h));
        item.anchor = { x: nx * area.w, y: ny * area.h, nx: nx, ny: ny };
        item.size = size;
        item.aspect = aspectFor(item.color);
        item.el.style.width = size + 'px';
        item.el.style.height = Math.round(size * item.aspect) + 'px';
        var lbl = item.el.querySelector('.balloon-label');
        if (lbl) lbl.style.fontSize = labelFontSize(item.text, size) + 'px';
        clampToArea(item);
        place(item);
      });
      computeSway();
    }

    /* Store normalized anchors right after spawn so resize can restore. */
    function rememberSlots() {
      var area = rect();
      items.forEach(function (item) {
        item.anchor.nx = item.anchor.x / Math.max(1, area.w);
        item.anchor.ny = item.anchor.y / Math.max(1, area.h);
      });
    }

    /* Remove every balloon, cancel its pending animation timers and wipe
       leftover particles. Called before each new question so nothing from
       the previous question can linger as a "ghost". */
    function clear() {
      items.forEach(function (item) {
        (item._timers || []).forEach(function (tid) { clearTimeout(tid); });
        if (item.el) item.el.remove();
      });
      items = [];
      if (fxLayer) {
        while (fxLayer.firstChild) fxLayer.removeChild(fxLayer.firstChild);
      }
    }

    function destroy() {
      if (raf) cancelAnimationFrame(raf);
      raf = null;
      running = false;
      clear();
    }

    return {
      spawn: function (options, opts) {
        spawn(options, opts);
        rememberSlots();
      },
      pop: pop,
      fizzle: fizzle,
      disable: disable,
      setFrozen: setFrozen,
      relayout: relayout,
      clear: clear,
      destroy: destroy,
      colors: COLORS
    };
  }

  root.BP = root.BP || {};
  root.BP.assets = { detect: detectAssets, colors: COLORS };
  root.BP.balloonField = createBalloons;
})(typeof window !== 'undefined' ? window : globalThis);
