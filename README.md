# Balloon Pop — English Grammar Game

A colorful balloon-popping arcade game for learning English grammar.
Pure HTML, CSS and vanilla JavaScript — no frameworks, no build step.

## Play

Open `index.html` in any modern browser (double-click works — no server needed),
or serve the folder locally if you prefer:

```
python -m http.server 8080
```

## Your artwork (integrated)

The following real assets are bundled in `assets/images/` and are used
automatically by the game (with a graceful CSS fallback for anything missing):

| Asset | File |
|---|---|
| Balloons (normal) | `balloon-red.png`, `balloon-yellow.png`, `balloon-green.png`, `balloon-blue.png`, `balloon-purple.png` |
| Balloons (popped) | `balloon-red-popped.png`, … one per color |
| Desktop background (landscape) | `background-desktop.png` |
| Mobile background (portrait) | `background-mobile.png` |

All balloon art keeps its original transparency, gloss, knot and string; the
answer word is an HTML overlay centered on the inflated body only. Backgrounds
render with `background-size: cover` (desktop background in landscape, mobile
background in portrait). To swap any artwork later, just replace the file -
the game detects images by these names at startup.

Sound effects: if `assets/sounds/pop.mp3`, `correct.mp3` or `wrong.mp3` are
real audio files they are used; otherwise light Web-Audio synthesized effects
play. Toggle sound from the menu.

## Structure

```
index.html            screens and overlays
css/style.css         all styling, responsive layouts, balloon fallback art
data/questions.js     75 hand-authored grammar questions (JSON array)
data/levels.js        15 level definitions (JSON array)
js/rules.js           pure scoring / stars / unlock rules (shared with tests)
js/storage.js         localStorage progress handling
js/audio.js           mp3 loading + Web-Audio synth fallback
js/balloons.js        asset detection, movement engine, pop animation
js/ui.js              screens, HUD, level cards, dialogs
js/game.js            state machine, question loop, power-ups, timers
js/main.js            boot, navigation, resize/visibility handling
tests/validate-data.mjs  node tests/validate-data.mjs
```

## Validate

```
node tests/validate-data.mjs
```

Checks all 75 questions and 15 levels (counts, uniqueness, options, boss
questions, timers, answer distribution) and simulates scoring, stars,
hearts, unlocks, rewards and replay-protection rules.

## Gameplay summary

- 15 levels × 5 questions, A1 → B2+ grammar progression, boss question last.
- Pop the balloon carrying the correct answer; 3 hearts per level.
- +100 per correct answer, up to +50 speed bonus, combo bonuses up to +50.
- Power-ups earned by playing: ❄️ Freeze, ✂️ 50/50, 🛡️ Shield.
- 3 stars = no mistakes; progress, stars and best scores persist in localStorage.
