/* Balloon Pop - Pure game rules.
   No DOM access here: these functions are shared by the browser game
   (game.js) and the automated validator (tests/validate-data.mjs),
   which evaluates this file in a bare JavaScript context. */
(function (root) {
  'use strict';

  var BASE_POINTS = 100;
  var MAX_SPEED_BONUS = 50;
  var COMBO_STEP = 10;
  var MAX_COMBO_BONUS = 50;
  var POWERUP_CAP = 4;
  var POWERUP_OVERFLOW_POINTS = 100;
  var START_HEARTS = 3;

  function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
  }

  /* Points for a correct answer.
     timed: level has a timer; remaining/limit: seconds left at the moment
     of the correct tap; streak: consecutive first-attempt correct count
     including this answer. */
  function scoreForAnswer(opts) {
    var speedBonus = 0;
    if (opts.timed && opts.limit > 0) {
      speedBonus = Math.round(MAX_SPEED_BONUS * clamp(opts.remaining / opts.limit, 0, 1));
    }
    var streak = Math.max(1, opts.streak | 0);
    var comboBonus = streak >= 2 ? Math.min(COMBO_STEP * (streak - 1), MAX_COMBO_BONUS) : 0;
    return {
      base: BASE_POINTS,
      speed: speedBonus,
      combo: comboBonus,
      total: BASE_POINTS + speedBonus + comboBonus
    };
  }

  /* 0 mistakes -> 3 stars, 1 -> 2, 2 -> 1. Three mistakes ends the
     level before completion, so 0 is unreachable on a finished level. */
  function starsFor(mistakes) {
    if (mistakes <= 0) return 3;
    if (mistakes === 1) return 2;
    if (mistakes === 2) return 1;
    return 0;
  }

  function accuracyPercent(correct, total) {
    if (!total) return 0;
    return Math.round((correct / total) * 100);
  }

  /* Merge a finished level result into saved progress.
     Never lowers stars or best score; returns {save, granted, firstClear,
     newPerfect} so the caller can show rewards. */
  function mergeLevelResult(save, level, result) {
    var s = JSON.parse(JSON.stringify(save));
    var id = level.id;
    var prevStars = s.stars[id] || 0;
    var prevBest = s.best[id] || 0;
    var firstClear = prevStars === 0 && !s.cleared[id];
    var newPerfect = result.stars === 3 && prevStars < 3;

    s.cleared[id] = true;
    s.stars[id] = Math.max(prevStars, result.stars);
    s.best[id] = Math.max(prevBest, result.score);
    s.totalScore = (s.totalScore || 0) + result.score;

    var idx = level.index; /* 1-based level number */
    s.unlocked = Math.max(s.unlocked, Math.min(idx + 1, s.levelOrder));

    var granted = [];
    function grant(type, count) {
      for (var i = 0; i < count; i++) {
        if ((s.powerups[type] || 0) >= POWERUP_CAP) {
          s.totalScore += POWERUP_OVERFLOW_POINTS;
          granted.push({ type: type, overflow: true });
        } else {
          s.powerups[type] = (s.powerups[type] || 0) + 1;
          granted.push({ type: type, overflow: false });
        }
      }
    }
    var reward = level.reward || {};
    if (firstClear && reward.first) {
      Object.keys(reward.first).forEach(function (k) { grant(k, reward.first[k]); });
    }
    if (newPerfect && reward.perfect) {
      Object.keys(reward.perfect).forEach(function (k) { grant(k, reward.perfect[k]); });
    }
    return { save: s, granted: granted, firstClear: firstClear, newPerfect: newPerfect };
  }

  function freshSave(levelOrder) {
    return {
      version: 1,
      unlocked: 1,
      levelOrder: levelOrder,
      cleared: {},
      stars: {},
      best: {},
      totalScore: 0,
      powerups: { freeze: 1, fifty: 1, shield: 1 },
      tutorialDone: false,
      audioOn: true,
      audio: { musicOn: true, sfxOn: true, musicVol: 0.22, sfxVol: 0.7, muted: false }
    };
  }

  /* 50/50: how many wrong balloons to remove for a given number of
     remaining options (never removes the correct one). */
  function fiftyRemovalCount(remainingOptions) {
    return remainingOptions >= 4 ? 2 : (remainingOptions === 3 ? 1 : 0);
  }

  var FEEDBACK_OK = ['Nice!', 'Great Pop!', 'Well Done!', 'Perfect!', 'Awesome!'];
  var FEEDBACK_COMBO = ['Amazing Combo!', 'On Fire!', 'Unstoppable!', 'Incredible!'];

  function feedbackMessage(streak, rnd) {
    if (streak >= 4) return FEEDBACK_COMBO[Math.floor(rnd * FEEDBACK_COMBO.length) % FEEDBACK_COMBO.length];
    return FEEDBACK_OK[Math.floor(rnd * FEEDBACK_OK.length) % FEEDBACK_OK.length];
  }

  root.BP = root.BP || {};
  root.BP.rules = {
    BASE_POINTS: BASE_POINTS,
    MAX_SPEED_BONUS: MAX_SPEED_BONUS,
    COMBO_STEP: COMBO_STEP,
    MAX_COMBO_BONUS: MAX_COMBO_BONUS,
    POWERUP_CAP: POWERUP_CAP,
    START_HEARTS: START_HEARTS,
    clamp: clamp,
    scoreForAnswer: scoreForAnswer,
    starsFor: starsFor,
    accuracyPercent: accuracyPercent,
    mergeLevelResult: mergeLevelResult,
    freshSave: freshSave,
    fiftyRemovalCount: fiftyRemovalCount,
    feedbackMessage: feedbackMessage
  };
})(typeof window !== 'undefined' ? window : globalThis);
