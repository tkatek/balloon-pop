/* Balloon Pop - Progress storage (localStorage with graceful recovery). */
(function (root) {
  'use strict';
  var KEY = 'balloonpop.save.v1';
  var rules = root.BP.rules;

  function load(levelOrder) {
    var raw = null;
    try {
      raw = root.localStorage ? root.localStorage.getItem(KEY) : null;
    } catch (e) {
      raw = null; /* private mode / blocked storage */
    }
    if (raw) {
      try {
        var data = JSON.parse(raw);
        if (data && typeof data === 'object') {
          var fresh = rules.freshSave(levelOrder);
          /* Keep whatever is valid, fall back for the rest. */
          fresh.unlocked = rules.clamp(Number(data.unlocked) || 1, 1, levelOrder);
          fresh.totalScore = Math.max(0, Number(data.totalScore) || 0);
          fresh.tutorialDone = !!data.tutorialDone;
          fresh.audioOn = data.audioOn !== false;
          ['stars', 'best', 'cleared'].forEach(function (k) {
            if (data[k] && typeof data[k] === 'object') fresh[k] = data[k];
          });
          if (data.powerups && typeof data.powerups === 'object') {
            ['freeze', 'fifty', 'shield'].forEach(function (k) {
              var v = rules.clamp(Number(data.powerups[k]) || 0, 0, rules.POWERUP_CAP);
              fresh.powerups[k] = v;
            });
          }
          return fresh;
        }
      } catch (e) {
        /* corrupted JSON -> start fresh */
      }
    }
    return rules.freshSave(levelOrder);
  }

  function save(data) {
    try {
      root.localStorage.setItem(KEY, JSON.stringify(data));
    } catch (e) {
      /* storage unavailable: game still playable this session */
    }
  }

  function clear() {
    try {
      root.localStorage.removeItem(KEY);
    } catch (e) { /* ignore */ }
  }

  root.BP = root.BP || {};
  root.BP.storage = {
    load: load,
    save: save,
    clear: clear
  };
})(typeof window !== 'undefined' ? window : globalThis);
