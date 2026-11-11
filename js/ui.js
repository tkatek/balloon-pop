/* Balloon Pop - UI rendering: screens, HUD, level cards, feedback,
   tutorial, results and dialogs. No game rules here - game.js drives it. */
(function (root) {
  'use strict';

  function $(id) { return document.getElementById(id); }

  var el = {};
  var tutorialStep = 0;
  var tutorialDone = null;
  var tutTimer = null;

  var TUT_STEPS = [
    {
      icon: '📖',
      title: 'Read the question',
      text: 'The question card at the top asks you to complete an English sentence.'
    },
    {
      icon: '🎈',
      title: 'Find the answer',
      text: 'Every balloon carries a possible answer. Only one is grammatically correct.'
    },
    {
      icon: '👆',
      title: 'Tap the balloon',
      text: 'Tap or click the balloon with the correct answer to pop it!'
    },
    {
      icon: '❤️',
      title: 'Protect your hearts',
      text: 'A wrong pop or a timeout costs one heart. Every level starts with three hearts.'
    },
    {
      icon: '⭐',
      title: 'Earn stars & unlock',
      text: 'Finish with zero mistakes for 3 stars. Completing a level unlocks the next one!'
    }
  ];

  function init() {
    ['screen-loading', 'screen-menu', 'screen-levels', 'screen-game',
      'load-status', 'menu-logo', 'menu-total', 'menu-stars', 'menu-balloons',
      'btn-play', 'btn-levels', 'btn-how', 'btn-sound', 'btn-reset',
      'btn-levels-back', 'levels-grid', 'levels-starcount',
      'btn-pause', 'hud-hearts', 'hud-level', 'hud-qnum', 'hud-score', 'hud-best', 'hud-combo',
      'timer-wrap', 'timer-bar', 'timer-num', 'boss-badge',
      'question-card', 'question-type', 'question-prompt',
      'play-area', 'fx-layer',
      'pu-freeze', 'pu-fifty', 'pu-shield', 'pu-freeze-n', 'pu-fifty-n', 'pu-shield-n',
      'freeze-veil', 'boss-banner',
      'feedback', 'fb-icon', 'fb-title', 'fb-your', 'fb-correct', 'fb-sentence',
      'fb-detail', 'fb-breakdown', 'btn-fb-next',
      'overlay-pause', 'btn-resume', 'btn-restart', 'btn-quit-levels',
      'overlay-tutorial', 'tut-icon', 'tut-title', 'tut-text', 'tut-dots', 'btn-tut-next', 'btn-tut-skip',
      'overlay-complete', 'lc-stars', 'lc-title', 'lc-sub', 'lc-correct', 'lc-score', 'lc-best',
      'lc-accuracy', 'lc-combo', 'lc-rewards', 'lc-newbest',
      'btn-lc-next', 'btn-lc-replay', 'btn-lc-levels',
      'overlay-gameover', 'go-level', 'go-progress', 'go-mistakes',
      'btn-go-retry', 'btn-go-levels',
      'overlay-complete-all', 'gc-stars', 'gc-score', 'btn-gc-levels', 'btn-gc-menu',
      'overlay-confirm', 'cf-title', 'cf-text', 'btn-cf-yes', 'btn-cf-no',
      'overlay-audio', 'ap-music-toggle', 'ap-music-vol', 'ap-music-val',
      'ap-sfx-toggle', 'ap-sfx-vol', 'ap-sfx-val', 'ap-mute', 'ap-close',
      'toast'
    ].forEach(function (id) { el[id] = $(id); });
  }

  function showScreen(name) {
    ['screen-loading', 'screen-menu', 'screen-levels', 'screen-game'].forEach(function (id) {
      el[id].classList.toggle('active', id === 'screen-' + name);
    });
  }

  function overlay(id, show) {
    el[id].classList.toggle('active', !!show);
  }

  /* ---------------- Menu ---------------- */

  function renderMenu(save, totalStarCount, levelOrder) {
    el['menu-total'].textContent = (save.totalScore || 0).toLocaleString();
    el['menu-stars'].textContent = totalStarCount + ' / ' + (levelOrder * 3);
    var sound = save.audioOn !== false;
    el['btn-sound'].textContent = sound ? '🔊 Sound On' : '🔇 Sound Off';
    el['btn-sound'].setAttribute('aria-pressed', String(sound));
  }

  function setLogo(logoUrl) {
    if (!logoUrl) return;
    var img = document.createElement('img');
    img.src = logoUrl;
    img.alt = 'Balloon Pop';
    img.className = 'logo-img';
    el['menu-logo'].appendChild(img);
    el['menu-logo'].querySelector('.logo-text').style.display = 'none';
  }

  /* ---------------- Level select ---------------- */

  function renderLevels(levels, save, onPick) {
    el['levels-grid'].innerHTML = '';
    levels.forEach(function (lv, i) {
      var num = i + 1;
      var unlocked = num <= save.unlocked;
      var stars = save.stars[lv.id] || 0;
      var card = document.createElement('button');
      var tier = 't' + Math.min(5, Math.max(1, lv.difficulty));
      card.className = 'level-card ' + tier + (unlocked ? '' : ' locked') + (stars === 3 ? ' perfect' : '');
      card.disabled = !unlocked;
      card.setAttribute('aria-label', lv.name + (unlocked ? '' : ' (locked)'));

      var diff = '';
      for (var d = 0; d < 5; d++) diff += '<i class="' + (d < lv.difficulty ? 'on' : '') + '"></i>';

      card.innerHTML =
        '<span class="lc-num">' + num + '</span>' +
        '<span class="lc-cefr">' + lv.cefr + '</span>' +
        '<span class="lc-lock">🔒</span>' +
        '<span class="lc-name">' + lv.name + '</span>' +
        '<span class="lc-topic">' + lv.grammarTopic + '</span>' +
        '<span class="lc-diff" title="Difficulty">' + diff + '</span>' +
        '<span class="lc-stars">' + starsHtml(stars) + '</span>';
      if (unlocked) {
        card.addEventListener('click', function () { onPick(lv); });
      }
      el['levels-grid'].appendChild(card);
    });
  }

  function starsHtml(n) {
    var out = '';
    for (var i = 0; i < 3; i++) out += '<span class="st ' + (i < n ? 'on' : '') + '">★</span>';
    return out;
  }

  function setLevelsStarCount(n, max) {
    el['levels-starcount'].textContent = '⭐ ' + n + ' / ' + max;
  }

  /* ---------------- HUD ---------------- */

  function hearts(n, max) {
    var out = '';
    for (var i = 0; i < max; i++) out += '<span class="heart ' + (i < n ? 'on' : '') + '">❤</span>';
    el['hud-hearts'].innerHTML = out;
  }

  var lastScore = 0;
  function hud(data) {
    el['hud-level'].textContent = data.levelName;
    el['hud-qnum'].textContent = 'Q ' + data.qIndex + '/' + data.qTotal;
    var scoreEl = el['hud-score'];
    scoreEl.textContent = data.score.toLocaleString();
    if (data.score > lastScore) {
      scoreEl.classList.remove('bump');
      void scoreEl.offsetWidth;
      scoreEl.classList.add('bump');
    }
    lastScore = data.score;
    el['hud-best'].textContent = 'Best ' + (data.best || 0).toLocaleString();
    hearts(data.hearts, 3);
    if (data.combo >= 2) {
      el['hud-combo'].textContent = '×' + data.combo;
      el['hud-combo'].classList.add('show');
      el['hud-combo'].classList.remove('bump');
      void el['hud-combo'].offsetWidth;
      el['hud-combo'].classList.add('bump');
    } else {
      el['hud-combo'].classList.remove('show');
    }
  }

  function timer(remaining, total) {
    if (total == null) {
      el['timer-wrap'].style.visibility = 'hidden';
      return;
    }
    el['timer-wrap'].style.visibility = 'visible';
    var pct = Math.max(0, Math.min(1, remaining / total));
    el['timer-bar'].style.transform = 'scaleX(' + pct + ')';
    el['timer-num'].textContent = Math.ceil(Math.max(0, remaining)) + 's';
    /* Time-pressure colors: normal, orange under 8s, red under 5s. */
    el['timer-wrap'].classList.toggle('low', remaining <= 5);
    el['timer-wrap'].classList.toggle('warn', remaining > 5 && remaining <= 8);
  }

  function bossBanner(show) {
    el['boss-banner'].classList.toggle('active', !!show);
  }

  function question(q, isBoss, qIndex, qTotal) {
    el['question-prompt'].innerHTML = escapeHtml(q.prompt).replace(
      /_{2,}/g, '<span class="q-blank">$&</span>'
    );
    var types = {
      fill_blank: 'Complete the sentence',
      verb_form: 'Choose the correct verb form',
      word_choice: 'Choose the correct word',
      dialogue: 'Complete the dialogue',
      correction: 'Report it correctly'
    };
    el['question-type'].textContent = (isBoss ? 'BOSS · ' : '') + (types[q.questionType] || 'Complete the sentence');
    el['question-card'].classList.toggle('boss', !!isBoss);
    el['boss-badge'].classList.toggle('on', !!isBoss);
    /* progress dots: current question filled */
    var dots = '';
    for (var i = 0; i < (qTotal || 5); i++) {
      dots += '<i class="' + (i < qIndex ? 'done' : (i === qIndex ? 'cur' : '')) + '"></i>';
    }
    var dotsEl = document.getElementById('q-dots');
    if (dotsEl) dotsEl.innerHTML = dots;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function powerups(data) {
    el['pu-freeze-n'].textContent = data.counts.freeze;
    el['pu-fifty-n'].textContent = data.counts.fifty;
    el['pu-shield-n'].textContent = data.counts.shield;
    el['pu-freeze'].disabled = !data.canFreeze;
    el['pu-fifty'].disabled = !data.canFifty;
    el['pu-shield'].disabled = !data.canShield;
    el['pu-freeze'].classList.toggle('active', !!data.freezeActive);
    el['pu-shield'].classList.toggle('active', !!data.shieldActive);
  }

  /* ---------------- Centered answer-review card ---------------- */

  function showReview(opts) {
    var fb = el['feedback'];
    fb.className = 'feedback show ' + opts.kind;
    var icons = { correct: '🎉', wrong: '❌', shielded: '🛡️', timeout: '⏰' };
    var titles = { wrong: 'Not Quite!', shielded: 'Shield saved you!', timeout: "Time's Up!" };
    el['fb-icon'].textContent = icons[opts.kind] || '🎉';
    el['fb-title'].textContent = opts.kind === 'correct' ? opts.message : titles[opts.kind];

    if (opts.yourText) {
      el['fb-your'].style.display = '';
      el['fb-your'].innerHTML = 'Your answer:&nbsp;<b>' + escapeHtml(opts.yourText) + '&nbsp;✗</b>';
    } else {
      el['fb-your'].style.display = 'none';
    }

    el['fb-correct'].innerHTML = 'Correct answer:&nbsp;<b>' + escapeHtml(opts.correctText) + '&nbsp;✓</b>';

    if (opts.sentence) {
      el['fb-sentence'].style.display = '';
      el['fb-sentence'].textContent = '“' + opts.sentence + '”';
    } else {
      el['fb-sentence'].style.display = 'none';
    }

    el['fb-detail'].textContent = opts.explanation;

    if (opts.breakdown) {
      var parts = ['+' + opts.breakdown.total + ' points'];
      if (opts.breakdown.speed) parts.push('speed +' + opts.breakdown.speed);
      if (opts.breakdown.combo) parts.push('combo +' + opts.breakdown.combo);
      el['fb-breakdown'].textContent = parts.join('   ·   ');
      el['fb-breakdown'].style.display = '';
    } else {
      el['fb-breakdown'].style.display = 'none';
    }

    el['btn-fb-next'].textContent = opts.btnLabel || 'Next Question →';
  }

  function hideFeedback() {
    el['feedback'].classList.remove('show');
  }

  /* ---------------- Results ---------------- */

  function levelComplete(data, isLast) {
    overlay('overlay-complete', true);
    el['lc-title'].textContent = data.levelName;
    el['lc-sub'].textContent = data.levelTopic + ' — Level ' + data.levelNum + ' complete!';
    el['lc-correct'].textContent = data.correct + ' / ' + data.total;
    el['lc-score'].textContent = data.score.toLocaleString();
    el['lc-best'].textContent = data.best.toLocaleString();
    el['lc-accuracy'].textContent = data.accuracy + '%';
    el['lc-combo'].textContent = '×' + data.maxCombo;
    el['lc-newbest'].style.display = data.newBest ? '' : 'none';
    el['btn-lc-next'].style.display = '';
    el['btn-lc-next'].textContent = isLast ? 'Finish 🏆' : 'Next Level ➜';
    var rw = el['lc-rewards'];
    rw.innerHTML = '';
    (data.granted || []).forEach(function (g) {
      var chip = document.createElement('span');
      chip.className = 'reward-chip';
      chip.textContent = g.overflow
        ? '+100 pts (power-up full)'
        : '+1 ' + ({ freeze: '❄️ Freeze', fifty: '✂️ 50/50', shield: '🛡️ Shield' }[g.type] || g.type);
      rw.appendChild(chip);
    });
    /* Star pop-in */
    var slots = el['lc-stars'].querySelectorAll('.st');
    slots.forEach(function (s) { s.className = 'st'; });
    for (var i = 0; i < data.stars; i++) {
      (function (idx) {
        setTimeout(function () {
          slots[idx].className = 'st on pop';
          root.BP.audio.play('star');
        }, 350 + idx * 420);
      })(i);
    }
  }

  function gameOver(data) {
    overlay('overlay-gameover', true);
    el['go-level'].textContent = data.levelName;
    el['go-progress'].textContent = data.qIndex + ' of ' + data.total + ' questions';
    var list = el['go-mistakes'];
    list.innerHTML = '';
    (data.mistakes || []).slice(0, 5).forEach(function (m) {
      var li = document.createElement('li');
      li.textContent = m;
      list.appendChild(li);
    });
    if (!data.mistakes.length) {
      var li = document.createElement('li');
      li.textContent = 'Hearts ran out.';
      list.appendChild(li);
    }
  }

  function gameComplete(data) {
    overlay('overlay-complete-all', true);
    el['gc-stars'].textContent = '⭐ ' + data.stars + ' / ' + data.maxStars;
    el['gc-score'].textContent = data.totalScore.toLocaleString() + ' total points';
  }

  /* ---------------- Tutorial ---------------- */

  function showTutorial(onFinish) {
    tutorialStep = 0;
    tutorialDone = onFinish;
    overlay('overlay-tutorial', true);
    renderTutStep();
  }

  function renderTutStep() {
    var s = TUT_STEPS[tutorialStep];
    el['tut-icon'].textContent = s.icon;
    el['tut-title'].textContent = s.title;
    el['tut-text'].textContent = s.text;
    el['tut-dots'].innerHTML = TUT_STEPS.map(function (_, i) {
      return '<i class="' + (i === tutorialStep ? 'on' : '') + '"></i>';
    }).join('');
    el['btn-tut-next'].textContent = tutorialStep === TUT_STEPS.length - 1 ? "Let's play! 🎈" : 'Next ➜';
    var card = el['overlay-tutorial'].querySelector('.tut-card');
    card.classList.remove('step-in');
    void card.offsetWidth;
    card.classList.add('step-in');
  }

  function tutorialNext() {
    if (tutorialStep < TUT_STEPS.length - 1) {
      tutorialStep++;
      renderTutStep();
    } else {
      overlay('overlay-tutorial', false);
      if (tutTimer) { clearTimeout(tutTimer); tutTimer = null; }
      if (tutorialDone) { var f = tutorialDone; tutorialDone = null; f(); }
    }
  }

  function tutorialSkip() {
    overlay('overlay-tutorial', false);
    if (tutTimer) { clearTimeout(tutTimer); tutTimer = null; }
    if (tutorialDone) { var f = tutorialDone; tutorialDone = null; f(); }
  }

  /* ---------------- Dialogs / toast ---------------- */

  var confirmCb = null;
  function confirmDialog(title, text, onYes) {
    el['cf-title'].textContent = title;
    el['cf-text'].textContent = text;
    confirmCb = onYes;
    overlay('overlay-confirm', true);
  }

  function toast(msg) {
    el['toast'].textContent = msg;
    el['toast'].classList.add('show');
    setTimeout(function () { el['toast'].classList.remove('show'); }, 1800);
  }

  root.BP = root.BP || {};
  root.BP.ui = {
    init: init,
    showScreen: showScreen,
    overlay: overlay,
    renderMenu: renderMenu,
    setLogo: setLogo,
    renderLevels: renderLevels,
    setLevelsStarCount: setLevelsStarCount,
    hud: hud,
    timer: timer,
    bossBanner: bossBanner,
    question: question,
    powerups: powerups,
    showFeedback: showReview,
    showReview: showReview,
    hideFeedback: hideFeedback,
    levelComplete: levelComplete,
    gameOver: gameOver,
    gameComplete: gameComplete,
    showTutorial: showTutorial,
    tutorialNext: tutorialNext,
    tutorialSkip: tutorialSkip,
    confirmDialog: confirmDialog,
    confirmYes: function () { overlay('overlay-confirm', false); if (confirmCb) { var f = confirmCb; confirmCb = null; f(); } },
    confirmNo: function () { overlay('overlay-confirm', false); confirmCb = null; },
    toast: toast,
    el: el
  };
})(typeof window !== 'undefined' ? window : globalThis);
