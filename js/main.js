/* Balloon Pop - Bootstrap: asset preload, screen navigation, menus,
   tutorial trigger, resize & visibility handling. */
(function (root) {
  'use strict';
  var BP = root.BP;

  var save = null;
  var assets = null;
  var resizeTimer = null;

  function $(id) { return document.getElementById(id); }

  function fail(msg) {
    var st = $('load-status');
    if (st) st.textContent = '⚠ ' + msg;
    console.error('[BP]', msg);
  }

  function totalStars() {
    return BP.levels.reduce(function (acc, lv) { return acc + (save.stars[lv.id] || 0); }, 0);
  }

  /* ---------- navigation ---------- */

  function goMenu() {
    BP.game.setStateForNav('MENU');
    BP.ui.showScreen('menu');
    BP.ui.renderMenu(save, totalStars(), BP.levels.length);
  }

  function goLevels() {
    BP.game.setStateForNav('LEVEL_SELECT');
    BP.ui.showScreen('levels');
    BP.ui.setLevelsStarCount(totalStars(), BP.levels.length * 3);
    BP.ui.renderLevels(BP.levels, save, function (lv) {
      BP.audio.play('click');
      BP.game.startLevel(lv);
    });
  }

  BP.onNavigate = function (target) {
    if (target === 'levels') goLevels();
  };

  function startTutorial(then) {
    BP.game.setStateForNav('TUTORIAL');
    BP.ui.showTutorial(function () {
      if (then) then();
    });
  }

  /* ---------- menu decorations ---------- */

  function decorateMenu() {
    var host = $('menu-balloons');
    if (!host) return;
    host.innerHTML = '';
    var reduce = root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var n = reduce ? 4 : 7;
    for (var i = 0; i < n; i++) {
      var b = document.createElement('div');
      var color = BP.assets.colors[i % BP.assets.colors.length];
      b.className = 'menu-balloon' + (assets.balloons[color] ? '' : ' css-balloon');
      b.dataset.color = color;
      b.style.left = (6 + Math.random() * 88) + '%';
      b.style.animationDelay = (Math.random() * 8).toFixed(2) + 's';
      b.style.animationDuration = (10 + Math.random() * 9).toFixed(2) + 's';
      b.style.transform = 'scale(' + (0.5 + Math.random() * 0.7).toFixed(2) + ')';
      if (assets.balloons[color]) {
        var img = document.createElement('img');
        img.src = assets.balloons[color];
        img.alt = '';
        img.draggable = false;
        b.appendChild(img);
      }
      host.appendChild(b);
    }
  }

  function applyBackgrounds() {
    /* Backgrounds are hard-coded in CSS (real artwork + gradient
       fallback); JS only layers in the logo when present. */
    if (assets.logo) BP.ui.setLogo(assets.logo);
  }

  /* ---------- wiring ---------- */

  function wire() {
    var ui = BP.ui, game = BP.game, audio = BP.audio;

    $('btn-play').addEventListener('click', function () {
      audio.play('click');
      if (!save.tutorialDone) {
        startTutorial(function () {
          save.tutorialDone = true;
          persist();
          goLevels();
        });
      } else goLevels();
    });

    $('btn-levels').addEventListener('click', function () { audio.play('click'); goLevels(); });
    $('btn-levels-back').addEventListener('click', function () { audio.play('click'); goMenu(); });

    $('btn-how').addEventListener('click', function () {
      audio.play('click');
      startTutorial(function () { goMenu(); });
    });

    $('btn-sound').addEventListener('click', function () {
      save.audioOn = !(save.audioOn !== false);
      audio.setEnabled(save.audioOn);
      persist();
      ui.renderMenu(save, totalStars(), BP.levels.length);
      if (save.audioOn) audio.play('click');
    });

    $('btn-reset').addEventListener('click', function () {
      ui.confirmDialog('Reset progress?', 'All stars, best scores, power-ups and unlocks will be permanently deleted.', function () {
        BP.storage.clear();
        save = BP.rules.freshSave(BP.levels.length);
        persist();
        audio.setEnabled(save.audioOn);
        ui.renderMenu(save, totalStars(), BP.levels.length);
        ui.toast('Progress reset');
      });
    });

    /* HUD / gameplay */
    $('btn-pause').addEventListener('click', game.pause);
    $('btn-resume').addEventListener('click', game.resume);
    $('btn-restart').addEventListener('click', game.restartLevel);
    $('btn-quit-levels').addEventListener('click', game.exitToLevels);
    $('btn-fb-next').addEventListener('click', game.feedbackNext);
    $('pu-freeze').addEventListener('click', function () { game.usePowerup('freeze'); });
    $('pu-fifty').addEventListener('click', function () { game.usePowerup('fifty'); });
    $('pu-shield').addEventListener('click', function () { game.usePowerup('shield'); });

    /* Results */
    $('btn-lc-next').addEventListener('click', game.nextLevel);
    $('btn-lc-replay').addEventListener('click', game.replayLevel);
    $('btn-lc-levels').addEventListener('click', game.exitToLevels);
    $('btn-go-retry').addEventListener('click', game.restartLevel);
    $('btn-go-levels').addEventListener('click', game.exitToLevels);
    $('btn-gc-levels').addEventListener('click', function () {
      BP.ui.overlay('overlay-complete-all', false);
      goLevels();
    });
    $('btn-gc-menu').addEventListener('click', function () {
      BP.ui.overlay('overlay-complete-all', false);
      goMenu();
    });

    /* Tutorial + dialogs */
    $('btn-tut-next').addEventListener('click', ui.tutorialNext);
    $('btn-tut-skip').addEventListener('click', ui.tutorialSkip);
    $('btn-cf-yes').addEventListener('click', ui.confirmYes);
    $('btn-cf-no').addEventListener('click', ui.confirmNo);

    /* Keyboard accessibility */
    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape') {
        if (game.getState() === 'PLAYING') game.pause();
        else if (game.getState() === 'PAUSED') game.resume();
      } else if ((ev.key === 'Enter' || ev.key === ' ') &&
        document.getElementById('feedback').classList.contains('show')) {
        ev.preventDefault();
        game.feedbackNext();
      }
    });

    /* Auto-pause when the tab is hidden (prevents surprise timeouts). */
    document.addEventListener('visibilitychange', function () {
      if (document.hidden && game.getState() === 'PLAYING') game.pause();
    });

    /* Audio may only start after the player's first interaction. */
    document.addEventListener('pointerdown', function () { audio.unlock(); });

    /* Safe relayout on resize / orientation change. */
    root.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        game.handleResize();
        decorateMenu();
      }, 160);
    });
  }

  function persist() {
    BP.storage.save(save);
  }

  /* ---------- boot ---------- */

  async function boot() {
    if (!BP || !BP.questions || !BP.levels || !BP.rules) {
      fail('Game data failed to load. Please refresh the page.');
      return;
    }
    BP.ui.init();

    var st = $('load-status');
    if (st) st.textContent = 'Blowing up balloons…';
    try {
      assets = await Promise.race([
        BP.assets.detect(),
        new Promise(function (_, rej) { setTimeout(function () { rej(new Error('timeout')); }, 20000); })
      ]).catch(function () { return null; });
    } catch (e) {
      assets = null;
    }
    if (!assets) {
      assets = {
        balloons: {}, popped: {}, bgDesktop: null, bgMobile: null, logo: null, anyBalloon: false
      };
    }

    save = BP.storage.load(BP.levels.length);
    BP.audio.setEnabled(save.audioOn !== false);

    BP.game.init({
      ui: BP.ui,
      audio: BP.audio,
      storage: {
        get: function () { return save; },
        set: function (s) { save = s; persist(); }
      },
      levels: BP.levels,
      questions: BP.questions,
      playArea: $('play-area'),
      fxLayer: $('fx-layer'),
      assets: assets
    });

    applyBackgrounds();
    wire();
    decorateMenu();
    goMenu();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})(typeof window !== 'undefined' ? window : globalThis);
