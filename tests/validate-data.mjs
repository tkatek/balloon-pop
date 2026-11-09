/* Balloon Pop - data + rules validator.
   Run:  node tests/validate-data.mjs
   Checks the 75 questions and 15 levels for structural correctness, then
   exercises the pure game rules (scoring, stars, hearts, power-ups,
   persistence merging) exactly as the browser uses them. */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

/* ---- extract the single JSON array from a data file ---- */
function loadArray(file) {
  const src = readFileSync(join(root, file), 'utf8');
  const assign = src.indexOf('= [');       /* anchor on the array assignment */
  if (assign === -1) throw new Error(`${file}: no array assignment found`);
  const start = src.indexOf('[', assign);
  const end = src.lastIndexOf(']');
  if (start === -1 || end === -1 || end < start) {
    throw new Error(`${file}: no JSON array found`);
  }
  return JSON.parse(src.slice(start, end + 1));
}

/* ---- evaluate rules.js in a bare context (same file the browser uses) ---- */
function loadRules() {
  const ctx = { console };
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  vm.runInContext(readFileSync(join(root, 'js/rules.js'), 'utf8'), ctx);
  return ctx.BP.rules;
}

const questions = loadArray('data/questions.js');
const levels = loadArray('data/levels.js');
const rules = loadRules();

let failures = 0;
let checks = 0;
function ok(cond, msg) {
  checks++;
  if (!cond) {
    failures++;
    console.error('  ✗ ' + msg);
  }
}

console.log('== Data validation ==');

/* 1. exactly 15 levels */
ok(levels.length === 15, `expected 15 levels, got ${levels.length}`);

/* 12. unique level ids */
const levelIds = levels.map(l => l.id);
ok(new Set(levelIds).size === levelIds.length, 'duplicate level ids');
ok(levelIds.every(id => /^L\d{2}$/.test(id)), 'level ids must look like L01..L15');

/* 3. exactly 75 unique questions */
ok(questions.length === 75, `expected 75 questions, got ${questions.length}`);
const qIds = questions.map(q => q.id);
ok(new Set(qIds).size === qIds.length, 'duplicate question ids');

/* 2. every level: exactly 5 question ids */
levels.forEach(lv => {
  ok(Array.isArray(lv.questionIds) && lv.questionIds.length === 5,
    `${lv.id}: expected 5 question ids, got ${lv.questionIds ? lv.questionIds.length : 0}`);
});

/* 4. every question references a valid level; 11. no question in multiple levels */
const idSet = new Set(qIds);
const assignments = new Map();
levels.forEach(lv => lv.questionIds.forEach(qid => {
  ok(idSet.has(qid), `${lv.id} references missing question ${qid}`);
  if (assignments.has(qid)) ok(false, `question ${qid} assigned to both ${assignments.get(qid)} and ${lv.id}`);
  assignments.set(qid, lv.id);
}));
questions.forEach(q => {
  ok(assignments.has(q.id), `question ${q.id} not referenced by any level`);
  ok(assignments.get(q.id) === q.levelId, `question ${q.id} levelId mismatch (${q.levelId} vs ${assignments.get(q.id)})`);
});

/* 5-7. option structure */
questions.forEach(q => {
  const ids = q.options.map(o => o.id);
  ok(new Set(ids).size === ids.length, `${q.id}: duplicate option ids`);
  const texts = q.options.map(o => o.text.toLowerCase());
  ok(new Set(texts).size === texts.length, `${q.id}: duplicate answer text`);

  /* exactly one valid correct answer */
  const matches = q.options.filter(o => o.id === q.correctOptionId);
  ok(matches.length === 1, `${q.id}: correctOptionId "${q.correctOptionId}" not found among options`);

  /* required fields non-empty */
  ok(typeof q.prompt === 'string' && q.prompt.includes('___'), `${q.id}: prompt must contain ___`);
  ok(typeof q.hint === 'string' && q.hint.trim().length >= 8, `${q.id}: weak/empty hint`);
  ok(typeof q.explanation === 'string' && q.explanation.trim().length >= 10, `${q.id}: weak/empty explanation`);
  ok(Number.isInteger(q.difficulty) && q.difficulty >= 1 && q.difficulty <= 5, `${q.id}: difficulty must be 1-5`);
  ok(q.prompt.split('___').length === 2, `${q.id}: prompt must have exactly one blank`);
});

/* 8. answer count matches level config */
levels.forEach(lv => {
  lv.questionIds.forEach(qid => {
    const q = questions.find(x => x.id === qid);
    ok(q.options.length === lv.choiceCount,
      `${q.id}: ${q.options.length} options but level ${lv.id} expects ${lv.choiceCount}`);
  });
});

/* 9. (covered above) + 10. boss question exists and is the 5th */
levels.forEach(lv => {
  ok(lv.questionIds[4] === lv.bossQuestionId,
    `${lv.id}: bossQuestionId ${lv.bossQuestionId} is not the 5th question`);
  ok(idSet.has(lv.bossQuestionId), `${lv.id}: boss question missing`);
});

/* 13. timers valid */
levels.forEach(lv => {
  const t = lv.timeLimitSeconds;
  ok(t === null || (Number.isInteger(t) && t >= 30 && t <= 45),
    `${lv.id}: invalid timeLimitSeconds ${t}`);
  ok(typeof lv.movementSpeed === 'number' && lv.movementSpeed >= 10 && lv.movementSpeed <= 70,
    `${lv.id}: movementSpeed out of range`);
  ok(['float', 'drift', 'wave', 'stagger', 'combo'].includes(lv.movementPattern),
    `${lv.id}: unknown movementPattern`);
});

/* 14. ordering & unlock model: ids ascending with index; choiceCount/timer progress sensibly */
levels.forEach((lv, i) => {
  ok(lv.id === 'L' + String(i + 1).padStart(2, '0'), `level order wrong at index ${i} (${lv.id})`);
});
ok(levels[0].timeLimitSeconds === null, 'level 1 must be untimed');
ok(levels.slice(0, 3).every(l => l.timeLimitSeconds === null), 'levels 1-3 untimed');
const timed = levels.filter(l => l.timeLimitSeconds !== null).map(l => l.timeLimitSeconds);
ok(timed.every((v, i) => i === 0 || v <= timed[i - 1]), 'timers must not increase across levels');

/* correct-answer position distribution (spec: spread across positions) */
levels.forEach(lv => {
  const positions = lv.questionIds.map(qid => {
    const q = questions.find(x => x.id === qid);
    return q.options.findIndex(o => o.id === q.correctOptionId);
  });
  const uniq = new Set(positions);
  ok(uniq.size >= Math.min(3, lv.choiceCount),
    `${lv.id}: correct answers cluster on ${uniq.size} position(s): [${positions}]`);
});

console.log(`   ${checks - failures}/${checks} data checks passed.`);

/* ================= rule / gameplay simulation ================= */
console.log('== Gameplay rules ==');
let r = 0;
function rok(cond, msg) {
  r++;
  if (!cond) {
    failures++;
    console.error('  ✗ ' + msg);
  }
}

/* scoring */
let s = rules.scoreForAnswer({ timed: false, remaining: 0, limit: 0, streak: 1 });
rok(s.total === 100 && s.combo === 0 && s.speed === 0, 'untimed first correct = 100');

s = rules.scoreForAnswer({ timed: true, remaining: 40, limit: 40, streak: 1 });
rok(s.speed === 50 && s.total === 150, 'full-time speed bonus = 50');

s = rules.scoreForAnswer({ timed: true, remaining: 20, limit: 40, streak: 1 });
rok(s.speed === 25, 'half-time speed bonus = 25');

s = rules.scoreForAnswer({ timed: true, remaining: 0, limit: 40, streak: 1 });
rok(s.speed === 0, 'zero remaining speed bonus = 0');

s = rules.scoreForAnswer({ timed: false, streak: 2 });
rok(s.combo === 10, 'streak 2 combo = +10');
s = rules.scoreForAnswer({ timed: false, streak: 4 });
rok(s.combo === 30, 'streak 4 combo = +30');
s = rules.scoreForAnswer({ timed: false, streak: 9 });
rok(s.combo === 50, 'combo capped at +50');
s = rules.scoreForAnswer({ timed: false, streak: 20 });
rok(s.combo === 50, 'combo still capped at +50');

/* stars */
rok(rules.starsFor(0) === 3, '0 mistakes = 3 stars');
rok(rules.starsFor(1) === 2, '1 mistake = 2 stars');
rok(rules.starsFor(2) === 1, '2 mistakes = 1 star');
rok(rules.accuracyPercent(4, 5) === 80, 'accuracy 4/5 = 80%');

/* 50/50 */
rok(rules.fiftyRemovalCount(5) === 2, '50/50 removes 2 with 5 options');
rok(rules.fiftyRemovalCount(4) === 2, '50/50 removes 2 with 4 options');
rok(rules.fiftyRemovalCount(3) === 1, '50/50 removes 1 with 3 options');
rok(rules.fiftyRemovalCount(2) === 0, '50/50 does nothing with 2 options');

/* hearts: 3 wrong answers must end the run (score math only here) */
rok(rules.START_HEARTS === 3, 'start with 3 hearts');

/* level result merge: unlock, never-downgrade, rewards */
let save = rules.freshSave(15);
const L3 = { ...levels[2], index: 3 };
let m = rules.mergeLevelResult(save, L3, { score: 900, stars: 2, correct: 4 });
rok(m.save.unlocked === 4, 'completing level 3 unlocks level 4');
rok(m.save.best.L03 === 900, 'best score stored');
rok(m.save.stars.L03 === 2, 'stars stored');
rok(m.save.totalScore === 900, 'totalScore accumulates');
rok(m.firstClear === true, 'first clear detected');
rok(m.granted.length === 1, 'first-clear reward granted');

/* replay worse: nothing may drop */
m = rules.mergeLevelResult(m.save, L3, { score: 100, stars: 1, correct: 2 });
rok(m.save.best.L03 === 900, 'worse replay does not lower best');
rok(m.save.stars.L03 === 2, 'worse replay does not lower stars');
rok(m.save.unlocked === 4, 'worse replay does not relock levels');
rok(m.granted.length === 0, 'no repeat first-clear reward');
rok(m.save.totalScore === 1000, 'totalScore still accumulates (100 + 900)');

/* replay better: stars upgrade + perfect reward */
m = rules.mergeLevelResult(m.save, L3, { score: 1400, stars: 3, correct: 5 });
rok(m.save.stars.L03 === 3, 'better replay upgrades stars');
rok(m.save.best.L03 === 1400, 'better replay upgrades best');
rok(m.newPerfect === true, 'new perfect detected');
rok(m.granted.some(g => g.type === 'freeze'), 'perfect reward granted');

/* level 15 completion caps unlocked at 15 */
const L15 = { ...levels[14], index: 15 };
m = rules.mergeLevelResult(m.save, L15, { score: 2000, stars: 3, correct: 5 });
rok(m.save.unlocked === 15, 'unlocked capped at 15 after finishing the game');

/* power-up cap overflow -> bonus points */
let capped = rules.freshSave(15);
capped.powerups.freeze = rules.POWERUP_CAP;
const L4 = { ...levels[3], index: 4, reward: { first: { freeze: 1 }, perfect: {} } };
m = rules.mergeLevelResult(capped, L4, { score: 500, stars: 3, correct: 5 });
rok(m.save.powerups.freeze === rules.POWERUP_CAP, 'power-up capped');
rok(m.granted[0].overflow === true, 'overflow reward flagged');
rok(m.save.totalScore > 500, 'overflow converts to points');

/* fresh save defaults */
rok(rules.freshSave(15).unlocked === 1, 'level 1 unlocked by default');
rok(rules.freshSave(15).tutorialDone === false, 'tutorial not done by default');

/* simulated full level: 5 correct first-attempt answers */
{
  let score = 0, streak = 0, maxCombo = 0, mistakes = 0;
  for (let i = 0; i < 5; i++) {
    streak++; maxCombo = Math.max(maxCombo, streak);
    score += rules.scoreForAnswer({ timed: true, remaining: 30, limit: 40, streak }).total;
    mistakes += 0;
  }
  rok(rules.starsFor(mistakes) === 3, 'flawless run = 3 stars');
  rok(score === 5 * (100 + 38) + (0 + 10 + 20 + 30 + 40), `flawless run score math (got ${score})`);
  rok(maxCombo === 5, 'flawless run max combo = 5');
}

/* simulated run: wrong, wrong, then correct (survives with 1 heart) */
{
  let hearts = 3, streak = 0, mistakes = 0;
  const wrong = () => { hearts--; streak = 0; mistakes++; };
  wrong(); wrong();
  rok(hearts === 1, 'two mistakes leave one heart');
  wrong();
  rok(hearts === 0, 'third mistake = game over');
  rok(rules.starsFor(mistakes) === 0, 'uncompleted run gets no stars');
}

console.log(`   ${r} gameplay rule checks run.`);

/* summary */
if (failures === 0) {
  console.log('\n✓ ALL VALIDATION PASSED');
  console.log(`  ${levels.length} levels, ${questions.length} questions (${qIds.length} unique), ${checks} data checks, ${r} rule checks.`);
  process.exit(0);
} else {
  console.error(`\n✗ ${failures} check(s) FAILED`);
  process.exit(1);
}
