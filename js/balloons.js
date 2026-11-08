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
        if (img.naturalWidth > 1) resolve(path); else resolve(null);
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

  /* Detect the player's artwork. Any image that is missing simply
     returns null and the game falls back to CSS-drawn balloons. */
  async function detectAssets() {
    var cand = buildCandidates();
    var out = { balloons: {}, popped: {}, bgDesktop: null, bgMobile: null, logo: null, anyBalloon: false };
    var jobs = [];
    COLORS.forEach(function (color) {
      jobs.push(probeList(cand.balloons[color]).then(function (u) { out.balloons[color] = u; }));
      jobs.push(probeList(cand.popped[color]).then(function (u) { out.popped[color] = u; }));
    });
    jobs.push(probeList(cand.backgrounds.desktop).then(function (u) { out.bgDesktop = u; }));
    jobs.push(probeList(cand.backgrounds.mobile).then(function (u) { out.bgMobile = u; }));
    jobs.push(probeList(cand.logo).then(function (u) { out.logo = u; }));
    await Promise.all(jobs);
    out.anyBalloon = COLORS.some(function (c) { return !!out.balloons[c]; });
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
    var activePointer = null;

    function rect() {
      var r = container.getBoundingClientRect();
      return { w: r.width, h: r.height };
    }

    function sizeFor(area, count) {
      var cols = count <= 3 ? count : Math.ceil(count / 2);
      var rows = count <= 3 ? 1 : 2;
      var byW = (area.w * 0.92) / cols;
      var byH = (area.h * 0.92) / rows;
      var s = Math.min(byW, byH * 1.05, 170);
      return Math.max(80, Math.round(s));
    }

    /* Normalized anchor slots for the given count, shuffled. */
    function slotsFor(count, area, size) {
      var slots = [];
      var portrait = area.w / area.h < 0.95;
      if (count <= 3 || !portrait) {
        for (var i = 0; i < count; i++) {
          slots.push({ x: (i + 0.5) / count, y: 0.5 });
        }
      } else {
        /* Staggered two rows: 3 + 2 (or 2 + 2), top row slightly left. */
        var top = count === 5 ? 3 : 2;
        var bottom = count - top;
        for (var a = 0; a < top; a++) slots.push({ x: (a + 0.5) / top, y: 0.3 });
        for (var b = 0; b < bottom; b++) slots.push({ x: (b + 0.5) / bottom, y: 0.74 });
      }
      /* Shuffle slot assignment so answers are positionally fair. */
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

    function spawn(options, opts) {
      pattern = opts.pattern || 'float';
      speed = opts.speed || 30;
      var area = rect();
      var size = sizeFor(area, options.length);
      var slots = slotsFor(options.length, area, size);
      var layerScale = Math.min(1, area.w / 700) * (reducedMotion ? 0.6 : 1);

      options.forEach(function (opt, i) {
        var el = document.createElement('div');
        el.className = 'balloon' + (assets.balloons[opt.color] ? ' has-img' : ' css-balloon');
        el.dataset.color = opt.color;
        el.dataset.answerId = opt.id;
        el.setAttribute('role', 'button');
        el.setAttribute('aria-label', opt.text);
        el.style.width = size + 'px';
        el.style.height = Math.round(size * 1.18) + 'px';
        el.style.fontSize = size + 'px'; /* CSS sizes label via em */

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
        el.appendChild(label);

        container.appendChild(el);
        var slot = slots[i];
        var anchor = {
          x: slot.x * area.w,
          y: slot.y * area.h
        };
        var item = {
          id: opt.id,
          color: opt.color,
          text: opt.text,
          el: el,
          anchor: anchor,
          size: size,
          phase: Math.random() * Math.PI * 2,
          freq: 0.75 + Math.random() * 0.5,
          dir: i % 2 === 0 ? 1 : -1,
          yOff: 0,
          xOff: 0,
          disabled: false,
          popped: false
        };
        items.push(item);
        place(item, anchor.x, anchor.y);

        /* Pop-in animation */
        el.animate(
          [{ transform: buildTransform(item) + ' scale(0)', opacity: 0 }, { transform: buildTransform(item) + ' scale(1)', opacity: 1 }],
          { duration: reducedMotion ? 1 : 380, delay: i * 70, easing: 'cubic-bezier(.34,1.56,.64,1)', fill: 'backwards' }
        );
      });

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
      return 'translate3d(' + Math.round(x - hw) + 'px,' + Math.round(y - item.size * 0.59) + 'px,0)';
    }

    function place(item) {
      item.el.style.transform = buildTransform(item);
    }

    function clampToArea(item) {
      var area = rect();
      var hw = item.size / 2;
      var cx = item.anchor.x + item.xOff;
      var cy = item.anchor.y + item.yOff;
      var maxX = area.w - hw - 4;
      var minX = hw + 4;
      var maxY = area.h - item.size * 0.62;
      var minY = item.size * 0.55;
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
        var aH = Math.min(area.h * 0.16, 46) * amp;
        var aW = Math.min(area.w * 0.06, 26) * amp;
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
        p.animate(
          [
            { transform: 'translate(-50%,-50%) scale(1)', opacity: 1 },
            {
              transform: 'translate(' + (Math.cos(ang) * dist - 4) + 'px,' + (Math.sin(ang) * dist - 4) + 'px) scale(' + (0.2 + Math.random() * 0.5) + ') rotate(' + (Math.random() * 240 - 120) + 'deg)',
              opacity: 0
            }
          ],
          { duration: 480 + Math.random() * 220, easing: 'cubic-bezier(.2,.7,.4,1)' }
        ).onfinish = function () { p.remove(); };
      }
    }

    /* Pop a balloon: squash -> popped image (or CSS burst) -> fade. */
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

        var anim = item.el.animate(
          [
            { transform: item.el.style.transform + ' scale(1)', offset: 0 },
            { transform: item.el.style.transform + ' scale(1.18,0.82)', offset: 0.3 },
            { transform: item.el.style.transform + ' scale(0.9,1.1)', offset: 0.6 },
            { transform: item.el.style.transform + ' scale(1)', offset: 1 }
          ],
          { duration: reducedMotion ? 1 : 140, easing: 'ease-out' }
        );

        anim.onfinish = function () {
          var poppedSrc = assets.popped[item.color];
          if (poppedSrc) {
            var img = item.el.querySelector('.balloon-img');
            if (img) img.src = poppedSrc;
            else {
              var pimg = document.createElement('img');
              pimg.className = 'balloon-img';
              pimg.alt = '';
              pimg.src = poppedSrc;
              item.el.prepend(pimg);
            }
            item.el.classList.add('popped-img');
          } else {
            item.el.classList.add('popped-css');
          }
          item.el.classList.remove('popping');
          particles(cx, cy, item.color, correct);
          item.el.animate(
            [{ opacity: 1 }, { opacity: correct ? 0 : 0.35 }],
            { duration: correct ? 480 : 900, delay: 220, fill: 'forwards', easing: 'ease-out' }
          );
          setTimeout(resolve, correct ? 300 : 420);
        };
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
      items.forEach(function (item, i) {
        /* Recompute anchors from stored normalized slots. */
        var nx = item.anchor.nx !== undefined ? item.anchor.nx : (item.anchor.x / Math.max(1, area.w));
        var ny = item.anchor.ny !== undefined ? item.anchor.ny : (item.anchor.y / Math.max(1, area.h));
        item.anchor = { x: nx * area.w, y: ny * area.h, nx: nx, ny: ny };
        item.size = size;
        item.el.style.width = size + 'px';
        item.el.style.height = Math.round(size * 1.18) + 'px';
        item.el.style.fontSize = size + 'px';
        clampToArea(item);
        place(item);
      });
    }

    /* Store normalized anchors right after spawn so resize can restore. */
    function rememberSlots() {
      var area = rect();
      items.forEach(function (item) {
        item.anchor.nx = item.anchor.x / Math.max(1, area.w);
        item.anchor.ny = item.anchor.y / Math.max(1, area.h);
      });
    }

    function clear() {
      items.forEach(function (item) { item.el.remove(); });
      items = [];
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
