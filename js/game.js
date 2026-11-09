/* Balloon Pop - Game core: state machine, question loop, scoring,
   lives, timers, power-ups and level progression.
   Level behavior is driven entirely by data/levels.js.

   Answer flow: PLAYING -> POPPING (balloon burst) -> ANSWER_REVIEW
   (centered answer card, waits for the player) -> next question. */
(function (root) {
  'use strict';

  var STATES = ['MENU', 'LEVEL_SELECT', 'TUTORIAL', 'PLAYING', 'POPPING',
    'ANSWER_REVIEW', 'TRANSITIONING', 'PAUSED', 'LEVEL_COMPLETE', 'GAME_OVER', 'GAME_COMPLETE'];
  var ALLOWED = {
    MENU: ['LEVEL_SELECT', 'TUTORIAL', 'GAME_COMPLETE'],
    LEVEL_SELECT: ['PLAYING', 'MENU'],
    TUTORIAL: ['LEVEL_SELECT', 'MENU'],
    PLAYING: ['POPPING', 'ANSWER_REVIEW', 'PAUSED', 'GAME_OVER', 'LEVEL_COMPLETE'],
    POPPING: ['ANSWER_REVIEW', 'GAME_OVER', 'PAUSED'],
    ANSWER_REVIEW: ['TRANSITIONING', 'PAUSED', 'PLAYING', 'LEVEL_COMPLETE', 'GAME_OVER'],
    TRANSITIONING: ['PLAYING', 'LEVEL_COMPLETE', 'GAME_OVER'],
    PAUSED: ['PLAYING', 'POPPING', 'ANSWER_REVIEW', 'LEVEL_SELECT', 'MENU', 'GAME_OVER'],
    LEVEL_COMPLETE: ['PLAYING', 'LEVEL_SELECT', 'GAME_COMPLETE', 'MENU'],
    GAME_OVER: ['PLAYING', 'LEVEL_SELECT', 'MENU'],
    GAME_COMPLETE: ['LEVEL_SELECT', 'MENU']
  };

  var rules = root.BP.rules;
  var ui = null;
  var audio = null;
  var storage = null;
  var levels = [];
  var questionsById = {};

  var state = 'MENU';
  var field = null;           /* balloon field instance */
  var loopId = null;
  var playAreaEl = null;

  var run = null;             /* current level run */

  function blankRun(level) {
    return {
      level: level,
      qIndex: 0,
      hearts: rules.START_HEARTS,
      score: 0,
      streak: 0,
      maxCombo: 0,
      mistakes: [],
      correctCount: 0,
      /* per-question */
      locked: false,
      attempts: 0,
      usedFifty: false,
      shieldActive: false,
      freezeLeft: 0,
      limit: level.timeLimitSeconds || 24,
      remaining: level.timeLimitSeconds || 24,
      enabledIds: [],
      correctId: null,
      pendingEnd: null,
      qToken: 0,
      warned: false,
      finalRun: false
    };
  }

  function init(deps) {
    ui = deps.ui;
    audio = deps.audio;
    storage = deps.storage;
    levels = deps.levels;
    playAreaEl = deps.playArea;
    levels.forEach(function (lv, i) { lv.index = i + 1; });
    deps.questions.forEach(function (q) { questionsById[q.id] = q; });
    field = root.BP.balloonField(playAreaEl, deps.fxLayer, deps.assets);

    /* One delegated listener for the whole game: never duplicated. */
    playAreaEl.addEventListener('pointerdown', function (ev) {
      var b = ev.target.closest('.balloon');
      if (!b) return;
      ev.preventDefault();
      if (b.dataset.answerId) root.BP.game.onBalloonTap(b.dataset.answerId);
    });
  }

  function getState() { return state; }

  function setState(next) {
    if (STATES.indexOf(next) === -1) throw new Error('Unknown state ' + next);
    if (ALLOWED[state].indexOf(next) === -1) {
      console.warn('[BP] Blocked transition', state, '->', next);
      return false;
    }
    state = next;
    return true;
  }

  function setStateSoft(next) {
    if (ALLOWED[state].indexOf(next) === -1) {
      console.warn('[BP] Late transition', state, '->', next, '(forced)');
    }
    state = next;
  }

  function forceState(next) { state = next; }

  function shuffled(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  /* Pop callbacks may land while the run is mid-pause (tab hidden during
     the animation). Only abandon work if the player already left. */
  function inGameFlow() {
    return state === 'PLAYING' || state === 'POPPING' ||
      state === 'ANSWER_REVIEW' || state === 'PAUSED';
  }

  function stopAuto() {
    if (run && run.autoTimer) { clearTimeout(run.autoTimer); run.autoTimer = null; }
  }

  function hudData(combo) {
    return {
      levelName: 'L' + String(run.level.index).padStart(2, '0') + ' · ' + run.level.name,
      qIndex: run.qIndex + 1,
      qTotal: 5,
      score: run.score,
      best: run.best,
      hearts: run.hearts,
      combo: combo === undefined ? run.streak : combo
    };
  }

  /* ---------------- Level lifecycle ---------------- */

  function startLevel(level) {
    if (field) field.destroy();
    run = blankRun(level);
    run.best = storage.get().best[level.id] || 0;
    ui.hideFeedback();
    ui.bossBanner(false);
    var veil = document.getElementById('freeze-veil');
    if (veil) veil.classList.remove('active');
    ui.showScreen('game');
    state = 'PLAYING';
    startQuestion(0);
    startLoop();
  }

  function currentQ() {
    return questionsById[run.level.questionIds[run.qIndex]];
  }

  function startQuestion(index) {
    run.qIndex = index;
    run.qToken = (run.qToken || 0) + 1;
    var token = run.qToken;
    var q = currentQ();
    var isBoss = q.id === run.level.bossQuestionId;
    run.locked = true;
    run.attempts = 0;
    run.usedFifty = false;
    run.pendingEnd = null;
    run.warned = false;
    run.warned8 = false;
    run.correctId = q.correctOptionId;

    /* Every question is an escape race; bosses get bonus seconds. */
    run.limit = (run.level.timeLimitSeconds || 24) + (isBoss ? (run.level.bossBonusSeconds || 4) : 0);
    run.remaining = run.limit;

    ui.hideFeedback();
    ui.question(q, isBoss, index, 5);
    ui.hud(hudData());
    ui.timer(run.limit, run.limit); /* full clock during the reading grace */

    /* Remove ALL balloons, timers and particles from the previous
       question before anything new is created. */
    field.clear();
    field.setFrozen(false);

    /* Device-aware option count, fixed for this whole question:
       - desktop/tablet (play area >= 620px): all 4 (L1-3) / 5 (L4-15)
       - phones: 3 on levels 1-3, 4 on later levels
       The subset always contains the correct answer plus random wrongs,
       and is never re-selected mid-question on resize. */
    var areaW = (playAreaEl.getBoundingClientRect().width || root.innerWidth || 0);
    var shown = q.options.length;
    if (areaW < 620) shown = Math.min(shown, run.level.index <= 3 ? 3 : 4);
    var correctOpt = q.options.filter(function (o) { return o.id === run.correctId; })[0];
    var wrongOpts = shuffled(q.options.filter(function (o) { return o.id !== run.correctId; }))
      .slice(0, Math.max(0, shown - 1));
    var options = shuffled([correctOpt].concat(wrongOpts));
    var colors = shuffled(root.BP.assets.colors).slice(0, options.length);
    run.enabledIds = options.map(function (o) { return o.id; });

    field.spawn(
      options.map(function (o, i) { return { id: o.id, text: o.text, color: colors[i] }; }),
      {
        pattern: run.level.movementPattern,
        speed: run.level.movementSpeed,
        limitSec: run.limit,
        holdMs: isBoss ? 1300 : 900 /* reading/entrance grace before the rise */
      }
    );

    /* Power-bar state depends on the fresh option set - update after spawn. */
    updatePowerbar();

    if (isBoss) {
      ui.bossBanner(true);
      setTimeout(function () {
        ui.bossBanner(false);
        if (run && run.qToken === token && (state === 'PLAYING' || state === 'PAUSED')) {
          run.locked = false;
          updatePowerbar(); /* bar becomes active exactly when input does */
        }
      }, 1100);
    } else {
      setTimeout(function () {
        if (run && run.qToken === token && (state === 'PLAYING' || state === 'PAUSED')) {
          run.locked = false;
          updatePowerbar();
        }
      }, 350);
    }
  }

  /* ---------------- Answer resolution ---------------- */

  function completedSentence(q, correctText) {
    if (q.prompt.indexOf('___') !== -1) {
      return q.prompt.replace('___', correctText);
    }
    return null; /* non-fill questions show the correct option alone */
  }

  function optionText(q, id) {
    var o = q.options.filter(function (x) { return x.id === id; })[0];
    return o ? o.text : '';
  }

  function onBalloonTap(answerId) {
    if (state !== 'PLAYING' || !run || run.locked) return;
    if (run.enabledIds.indexOf(answerId) === -1) return;
    var q = currentQ();
    if (!q) return;
    var yourText = optionText(q, answerId);
    var correctText = optionText(q, run.correctId);
    var isLast = run.qIndex >= 4;
    var isCorrect = answerId === run.correctId;

    /* Lock the answer immediately: one submission per question. */
    run.locked = true;
    run.attempts++;
    setStateSoft('POPPING');

    /* The pop sound plays on EVERY popped balloon, correct or not. */
    audio.play('pop');

    field.pop(answerId, isCorrect).then(function () {
      if (!inGameFlow()) return;
      resolveAnswer({
        isCorrect: isCorrect,
        yourText: yourText,
        correctText: correctText,
        isLast: isLast,
        q: q
      });
    });
  }

  /* Apply score / heart / combo changes exactly once, then show the
     centered review card. Nothing advances until the player clicks. */
  function resolveAnswer(ctx) {
    var q = ctx.q;
    var correctText = ctx.correctText;
    var sentence = completedSentence(q, correctText);
    var breakdown = null;
    var shielded = false;

    if (ctx.isCorrect) {
      run.streak++;
      run.maxCombo = Math.max(run.maxCombo, run.streak);
      breakdown = rules.scoreForAnswer({
        timed: true,
        remaining: Math.max(0, run.remaining),
        limit: run.limit,
        streak: run.streak
      });
      run.score += breakdown.total;
      run.correctCount++;
      audio.play(run.streak >= 5 ? 'highCombo' : (run.streak >= 3 ? 'combo' : 'correct'));
      ui.hud(hudData());
    } else {
      run.streak = 0;
      if (run.shieldActive) {
        run.shieldActive = false;
        shielded = true;
        audio.play('shieldUsed');
      } else {
        run.hearts--;
        run.mistakes.push('Q' + (run.qIndex + 1) + ': you chose “' + ctx.yourText + '”');
        audio.play('wrong');
        audio.play('heartLost');
        if (run.hearts <= 0) run.pendingEnd = 'gameover';
      }
      ui.hud(hudData(0));
    }

    setStateSoft('ANSWER_REVIEW');
    field.setFrozen(true); /* remaining balloons hold still behind the card */

    ui.showReview({
      kind: ctx.isCorrect ? 'correct' : (shielded ? 'shielded' : 'wrong'),
      shielded: shielded,
      message: ctx.isCorrect ? rules.feedbackMessage(run.streak, Math.random()) : null,
      yourText: ctx.isCorrect ? null : ctx.yourText,
      correctText: correctText,
      sentence: sentence,
      explanation: q.explanation,
      breakdown: breakdown,
      btnLabel: (run.pendingEnd === 'gameover' || ctx.isLast) ? 'See Results →' : 'Next Question →'
    });
    updatePowerbar(); /* all power-ups disabled while reviewing */
  }

  /* Escape timeout: fire exactly once, animate the balloons out through
     the top, apply the existing life rules, then show the review card. */
  function onTimeout() {
    if (state !== 'PLAYING' || !run || run.locked) return;
    run.locked = true;
    var q = currentQ();
    var correctText = optionText(q, run.correctId);
    run.hearts--;
    run.streak = 0;
    run.mistakes.push('Q' + (run.qIndex + 1) + ': the balloons escaped (answer: ' + correctText + ')');
    audio.play('timeout');
    audio.play('heartLost');
    if (run.hearts <= 0) run.pendingEnd = 'gameover';
    ui.hud(hudData(0));
    updatePowerbar();

    field.escape().then(function () {
      if (!inGameFlow()) return;
      setStateSoft('ANSWER_REVIEW');
      ui.showReview({
        kind: 'timeout',
        yourText: null,
        correctText: correctText,
        sentence: completedSentence(q, correctText),
        explanation: q.explanation,
        breakdown: null,
        btnLabel: (run.pendingEnd === 'gameover' || run.qIndex >= 4) ? 'See Results →' : 'Next Question →'
      });
    });
  }

  /* The ONLY way a question advances: the review card's button.
     TRANSITIONING blocks a second click while the change is applied. */
  function feedbackNext() {
    if (state !== 'ANSWER_REVIEW' || !run) return;
    audio.play('click');
    state = 'TRANSITIONING';
    ui.hideFeedback();
    if (run.pendingEnd === 'gameover') {
      run.pendingEnd = null;
      gameOver();
      return;
    }
    if (run.qIndex >= 4) {
      completeLevel();
      return;
    }
    /* Enter PLAYING before spawning so the power bar (which keys off
       the state) starts enabled, not disabled-by-TRANSITIONING. */
    state = 'PLAYING';
    startQuestion(run.qIndex + 1);
  }

  function nextQuestion() { feedbackNext(); }

  /* ---------------- Level end ---------------- */

  function completeLevel() {
    setStateSoft('LEVEL_COMPLETE');
    stopAuto();
    field.destroy();
    var level = run.level;
    var result = {
      score: run.score,
      stars: rules.starsFor(run.mistakes.length),
      correct: run.correctCount,
      accuracy: rules.accuracyPercent(run.correctCount, 5),
      maxCombo: run.maxCombo
    };
    var prevBest = storage.get().best[level.id] || 0;
    var merged = rules.mergeLevelResult(storage.get(), level, result);
    var wasUnlocked = storage.get().unlocked;
    storage.set(merged.save);
    audio.play('levelWin');
    if (merged.save.unlocked > wasUnlocked) {
      setTimeout(function () { audio.play('unlock'); }, 1000);
    }
    run.finalRun = level.index === levels.length;
    ui.levelComplete({
      levelName: level.name,
      levelTopic: level.grammarTopic,
      levelNum: level.index,
      total: 5,
      correct: result.correct,
      score: result.score,
      best: merged.save.best[level.id],
      accuracy: result.accuracy,
      maxCombo: result.maxCombo,
      stars: result.stars,
      granted: merged.granted,
      newBest: result.score > prevBest
    }, run.finalRun);
  }

  function gameOver() {
    setStateSoft('GAME_OVER');
    stopAuto();
    field.destroy();
    if (loopId) { clearInterval(loopId); loopId = null; }
    ui.overlay('overlay-pause', false); /* in case auto-pause raced the last pop */
    audio.play('gameOver');
    ui.gameOver({
      levelName: run.level.name,
      qIndex: run.qIndex + 1,
      total: 5,
      mistakes: run.mistakes
    });
  }

  function finishGame() {
    var save = storage.get();
    var stars = levels.reduce(function (acc, lv) { return acc + (save.stars[lv.id] || 0); }, 0);
    setStateSoft('GAME_COMPLETE');
    ui.overlay('overlay-complete', false);
    audio.play('fanfare');
    ui.gameComplete({ stars: stars, maxStars: levels.length * 3, totalScore: save.totalScore });
    if (root.BP.onNavigate) root.BP.onNavigate('gamecomplete');
  }

  /* ---------------- Frame clock ----------------
     ONE authoritative gameplay clock: the balloon field's rAF accumulates
     active play time (it halts when frozen, paused, reviewing or hidden),
     and this light interval only mirrors it into the HUD, fires the warn
     tick and triggers the escape timeout. Nothing can desynchronize:
     countdown, balloon travel and speed bonus all read the same elapsed
     seconds. */
  function startLoop() {
    if (loopId) clearInterval(loopId);
    loopId = setInterval(loop, 100);
  }

  function loop() {
    if (state !== 'PLAYING' || !run) return;

    if (run.freezeLeft > 0) {
      run.freezeLeft -= 100;
      if (run.freezeLeft <= 0) {
        run.freezeLeft = 0;
        field.setFrozen(false);
        var veil = document.getElementById('freeze-veil');
        if (veil) veil.classList.remove('active');
        updatePowerbar();
      }
      return;
    }
    if (!field.isFlying()) return; /* still in the reading/entrance grace */

    /* Advance the single authoritative clock; countdown, balloon travel
     * and speed bonus all read these same seconds. */
    field.advanceClock(100);
    var remaining = run.limit - field.getElapsed();
    run.remaining = remaining;
    ui.timer(remaining, run.limit);

    if (remaining <= 8 && !run.warned8) {
      run.warned8 = true;
      audio.play('warn');
    }
    if (remaining <= 5 && !run.warned) {
      run.warned = true;
      audio.play('tick');
    }
    if (remaining <= 0) {
      run.remaining = 0;
      onTimeout();
    }
  }

  /* ---------------- Power-ups ---------------- */

  function updatePowerbar() {
    if (!run) return;
    var counts = storage.get().powerups;
    var active = state === 'PLAYING';
    ui.powerups({
      counts: counts,
      freezeActive: run.freezeLeft > 0,
      shieldActive: run.shieldActive,
      canFreeze: active && (counts.freeze || 0) > 0 && run.freezeLeft <= 0,
      canFifty: active && (counts.fifty || 0) > 0 && !run.usedFifty &&
        rules.fiftyRemovalCount(run.enabledIds.length) > 0,
      canShield: active && (counts.shield || 0) > 0 && !run.shieldActive
    });
  }

  function usePowerup(type) {
    if (state !== 'PLAYING' || !run || run.locked) return;
    var save = storage.get();
    if ((save.powerups[type] || 0) <= 0) return;

    if (type === 'freeze') {
      if (run.freezeLeft > 0) return;
      save.powerups.freeze--;
      storage.set(save);
      run.freezeLeft = 5000;
      field.setFrozen(true);
      var veil = document.getElementById('freeze-veil');
      if (veil) veil.classList.add('active');
      audio.play('freeze');
    } else if (type === 'fifty') {
      var alive = run.enabledIds.slice();
      if (run.usedFifty || rules.fiftyRemovalCount(alive.length) === 0) return;
      var wrong = alive.filter(function (id) { return id !== run.correctId; });
      var toRemove = shuffled(wrong).slice(0, rules.fiftyRemovalCount(alive.length));
      if (!toRemove.length) return;
      save.powerups.fifty--;
      storage.set(save);
      run.usedFifty = true;
      toRemove.forEach(function (id) {
        run.enabledIds = run.enabledIds.filter(function (x) { return x !== id; });
        field.fizzle(id);
      });
      audio.play('fifty');
    } else if (type === 'shield') {
      if (run.shieldActive) return;
      save.powerups.shield--;
      storage.set(save);
      run.shieldActive = true;
      audio.play('shieldOn');
    }
    updatePowerbar();
  }

  /* ---------------- Pause / navigation ---------------- */

  var prevStateBeforePause = 'PLAYING';

  function pause() {
    if (state !== 'PLAYING' && state !== 'POPPING' && state !== 'ANSWER_REVIEW') return;
    prevStateBeforePause = state;
    if (!setState('PAUSED')) return;
    stopAuto();
    field.setFrozen(true);
    audio.pauseMusic();
    ui.overlay('overlay-pause', true);
  }

  function resume() {
    if (state !== 'PAUSED') return;
    ui.overlay('overlay-pause', false);
    audio.resumeMusic();
    state = prevStateBeforePause; /* PLAYING, POPPING or ANSWER_REVIEW */
    if (state === 'PLAYING' && run.freezeLeft > 0) {
      field.setFrozen(true);
      var veil = document.getElementById('freeze-veil');
      if (veil) veil.classList.add('active');
    } else if (state === 'PLAYING') {
      field.setFrozen(false);
    }
    /* ANSWER_REVIEW keeps balloons frozen; the card waits for the player. */
  }

  function restartLevel() {
    if (!run) return;
    ui.overlay('overlay-pause', false);
    ui.overlay('overlay-gameover', false);
    startLevel(run.level);
  }

  function exitToLevels() {
    stopAuto();
    if (field) field.destroy();
    if (loopId) { clearInterval(loopId); loopId = null; }
    var veil = document.getElementById('freeze-veil');
    if (veil) veil.classList.remove('active');
    ['overlay-pause', 'overlay-gameover', 'overlay-complete', 'overlay-complete-all'].forEach(function (id) {
      ui.overlay(id, false);
    });
    run = null;
    forceState('LEVEL_SELECT');
    if (root.BP.onNavigate) root.BP.onNavigate('levels');
  }

  function nextLevel() {
    if (state !== 'LEVEL_COMPLETE' || !run) return;
    ui.overlay('overlay-complete', false);
    if (run.finalRun) { finishGame(); return; }
    var next = levels[run.level.index]; /* level.index is 1-based */
    if (!next) { finishGame(); return; }
    startLevel(next);
  }

  function replayLevel() {
    if (!run) return;
    ui.overlay('overlay-complete', false);
    startLevel(run.level);
  }

  function handleResize() {
    if (field && (state === 'PLAYING' || state === 'POPPING' ||
      state === 'ANSWER_REVIEW' || state === 'PAUSED')) {
      field.relayout();
    }
  }

  root.BP = root.BP || {};
  root.BP.game = {
    init: init,
    getState: getState,
    handleResize: handleResize,
    startLevel: startLevel,
    onBalloonTap: onBalloonTap,
    usePowerup: usePowerup,
    feedbackNext: feedbackNext,
    pause: pause,
    resume: resume,
    restartLevel: restartLevel,
    replayLevel: replayLevel,
    exitToLevels: exitToLevels,
    nextLevel: nextLevel,
    finishGame: finishGame,
    setStateForNav: function (s) { forceState(s); }
  };
})(typeof window !== 'undefined' ? window : globalThis);
