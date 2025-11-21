# Kotoba Hunters

Kotoba Hunters is a small Japanese word-hunting game (Hiragana / JLPT vocabulary) built with React, Vite, and Tailwind CSS.

The goal of the game:

- choose a JLPT level (N5 → N1),
- generate a letter grid (from 4×4 up to 10×10),
- find all hidden Japanese words by dragging across the grid in any direction (horizontal, vertical, and diagonal, both forwards and backwards),
- optionally use hints (showing the Japanese words) if you get stuck.

---

## Table of Contents

- [Gameplay overview](#gameplay-overview)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Data & JLPT CSV files](#data--jlpt-csv-files)
- [Development](#development)
- [Production build](#production-build)
- [Testing](#testing)
- [Dark mode & preferences](#dark-mode--preferences)
- [Grid & word generation](#grid--word-generation)
- [Sounds & haptics](#sounds--haptics)
- [Hints (Japanese readings)](#hints-japanese-readings)
- [GitHub Pages deployment](#github-pages-deployment)

---

## Gameplay overview

- **JLPT levels**: N5 to N1, using separate CSV files (`data/n5.csv`, `data/n4.csv`, etc.).
- **Grid size**: adjustable from 4×4 up to 10×10, with the number of words scaled to the grid size.
- **Hidden words**:
  - placed in the grid with **no intersections** between words,
  - can appear in 8 directions (→, ←, ↑, ↓ and the 4 diagonals),
  - can be found both forwards and backwards,
  - made of Hiragana characters.
- **Selection**:
  - continuous drag / touch (mobile and desktop),
  - the selection snaps to the closest cardinal/diagonal direction,
  - when a word is found, its tiles stay highlighted (green glow) on the grid.
- **Controls panel**:
  - a small **gear button** in the header lets you show/hide the JLPT level and grid size pills,
  - when the controls are visible, the gear looks “pressed” (inverted colors, similar to the hints toggle),
  - when hidden, the panel slides closed vertically, allowing the grid to move further up and freeing space for the grid and the word list.
- **Word list**:
  - always available via a bottom sheet tab ("Word List"),
  - shows all target words, progress (`X / Y Found`),
  - can reveal Japanese hints (kanji/hiragana) per word.
- **Hints**:
  - toggle button "Show hints" under the grid,
  - when on, shows Japanese for all target words in the list (not only found ones),
  - when hints are turned on while the list is closed, the "Word List" tab content is briefly pulled up and down to indicate that new information is available there.
- **Timer**:
  - per-game timer shown in the lower-right corner under the grid,
  - resets on each new game start,
  - stops when all words are found.
- **Dark mode**:
  - respects system preference on first load,
  - can be toggled manually,
  - preference is persisted in `localStorage`.

---

## Tech stack

- **Framework**: React + Vite.
- **Styling**: Tailwind CSS (installed via PostCSS; no CDN in production).
- **Bundler**: Vite (configured with `base: '/kotoba-hunters/'` for GitHub Pages).
- **Language**: TypeScript.
- **Tests**: [Vitest](https://vitest.dev/) for unit and integration-style tests under `utils/`.
- **Audio**: Web Audio API (oscillators) to generate sounds directly in JS (no MP3 assets).

---

## Project structure

Top-level (excerpt):

- `App.tsx` – main application component (global UI, levels, grid size, dark mode, hints, timer, win popup, collapsible controls panel via a gear icon in the header).
- `index.tsx` – React/Vite entry point.
- `index.css` – Tailwind imports + custom keyframes (`pullUpDown` for the Word List tab animation).
- `vite.config.ts` – Vite configuration (React plugin, `base` for GitHub Pages, `@` alias).
- `package.json` – scripts and dependencies.
- `tsconfig.json` – TypeScript configuration.

Main folders:

- `components/`
  - `Grid.tsx` – grid component (drag handling, selection logic, found-word highlighting, light/dark styles, responsive font sizes).
  - `WordList.tsx` – word list bottom sheet, hints display, "pull up" animation on the tab.
- `utils/`
  - `gridGenerator.ts` – builds the grid, places words in 8 directions, enforces no-intersection rule.
  - `csvLoader.ts` – JLPT CSV parsing and kana reading normalization.
  - `wordSource.ts` – loads `data/nX.csv` files for each JLPT level (`N5`, `N4`, etc.).
  - `sound.ts` – sound engine (Web Audio oscillator + `navigator.vibrate` haptics).
  - `csvLoader.test.ts` – Vitest suite for `parseJlptCsv` and its normalization rules.
  - `gridGenerator.test.ts` – Vitest suite for grid creation, word placement, and selection/reading helpers.
  - `wordSource.test.ts` – Vitest suite for `loadWordsForLevel` with mocked `fetch`.
  - `sound.test.ts` – Vitest smoke tests for `playSound` and `navigator.vibrate` usage.
- `data/`
  - `n1.csv`, `n2.csv`, `n3.csv`, `n4.csv`, `n5.csv` – JLPT vocabulary per level.

---

## Data & JLPT CSV files

CSV files live in `data/`: `n5.csv`, `n4.csv`, `n3.csv`, `n2.csv`, `n1.csv`.

Expected format:

```csv
expression,reading,meaning,tags
多分,たぶん,probably,N5
そうじ,そうじ (する),cleaning,N5
月,~がつ,month (counter),N5
...
```

### Reading normalization (`normalizeKana` via `parseJlptCsv`)

When parsing, the loader cleans the `reading` column:

- trims surrounding whitespace,
- if the reading contains `;` or `；`: only the **first** part is kept,
- if the reading contains parentheses `( … )` or `（ … ）`: the parenthesized part is dropped (e.g. `そうじ (する)` → `そうじ`),
- if the reading starts with a tilde `~` or `～` (e.g. counters like `～がつ`): the tilde is removed (`～がつ` → `がつ`),
- rows whose normalized reading is entirely in katakana are skipped (the game focuses on Hiragana practice).

Examples handled:

- `そうじ,そうじ (する)` → `hiragana = そうじ`.
- `月,~がつ` → `hiragana = がつ`.
- `できる,できる` → `hiragana = できる`.
- `カタカナ,カタカナ` → filtered out.

---

## Development

Requirements: Node.js >= 18.

Install dependencies:

```bash
npm install
```

Start the Vite dev server:

```bash
npm run dev
```

Given the `base` setting in `vite.config.ts`, the local URL will typically be:

```text
http://localhost:3000/kotoba-hunters/
```

Vite serves the app under `/kotoba-hunters/` so behavior matches GitHub Pages.

---

## Production build

Build a production bundle:

```bash
npm run build
```

Output goes to the `dist/` folder:

- `dist/index.html`
- `dist/assets/index-*.js`
- `dist/assets/index-*.css`

This bundle is ready to deploy to GitHub Pages (see below).

---

## Testing

The project uses [Vitest](https://vitest.dev/) for unit and small integration tests.

Existing test suites under `utils/`:

- `utils/csvLoader.test.ts` – validates `parseJlptCsv` behavior and reading normalization.
- `utils/gridGenerator.test.ts` – validates grid creation, word placement, and selection/reading helpers (`getSelectedCells` and `getWordFromCells`).
- `utils/wordSource.test.ts` – validates `loadWordsForLevel` with a mocked `fetch` (success and error cases).
- `utils/sound.test.ts` – smoke tests for `playSound`, ensuring it does not throw and calls `navigator.vibrate` when available.

Run all tests:

```bash
npm run test
```

Run a single test file, for example the CSV loader:

```bash
npx vitest run utils/csvLoader.test.ts
```

You can add more tests by creating `*.test.ts` files (Vitest will pick them up).

---

## Dark mode & preferences

Dark mode logic lives in `App.tsx`:

- On initialization:
  - if `localStorage['kotoba-hunters:dark-mode']` is `'true'` or `'false'`, that explicit preference is used,
  - otherwise, `window.matchMedia('(prefers-color-scheme: dark)')` is used to follow the system theme.
- On each dark mode toggle, the preference is persisted in `localStorage`.

All key components (`App`, `GridBoard`, `WordList`, buttons, popup) switch Tailwind classes based on `darkMode`.

---

## Grid & word generation

Grid generation logic is in `utils/gridGenerator.ts`:

- **Directions**: a `DIRECTIONS` array lists 8 directions (right/left, up/down, and the 4 diagonals).
- **No intersections**:
  - `canPlaceWord` ensures every cell for a word placement is empty,
  - if any cell is already occupied, that placement is rejected.
- **Placement algorithm**:
  - candidate words are filtered and shuffled,
  - for each word, up to 50 random (row, col, direction) attempts are made,
  - `placeWord` writes characters into the grid when placement is valid.
- **Fill**:
  - any remaining empty cell is filled with a random Hiragana character from `HIRAGANA_CHARS`.

In `App.tsx`, `startNewGame` calls `generateGameGrid` with:

- the list of words for the selected level,
- the current grid size (`gridSize`),
- a target word count from `getWordCountForGridSize(gridSize)` (larger grids get more words).

---

## Sounds & haptics

Sounds are handled in `utils/sound.ts` using the Web Audio API:

- lazy creation of a single `AudioContext` (or `webkitAudioContext`), resumed if suspended,
- each sound is a short oscillator (`OscillatorNode`) through a `GainNode` envelope,
- sound IDs:
  - `tile-touch` – very short blip for each tile touched/entered during a drag,
  - `word-match` – ascending tone when a word is found,
  - `game-complete` – short celebratory melody (sequence of notes),
  - `ui-soft` – subtle click for UI changes (levels, grid size, hints, word list tab, gear controls).
- **Haptics**:
  - `navigator.vibrate` is used when available, with short patterns (10–40 ms, or `[50, 80, 50]` for game completion).

`playSound(id, { vibrate })` is called from:

- `Grid.tsx` – start of selection and each new tile along the drag path,
- `App.tsx` – for word match, game complete, level/grid size changes, hints toggle, and controls gear,
- `WordList.tsx` – on the Word List tab toggle.

No external audio assets are required.

---

## Hints (Japanese readings)

The "Show hints" button under the grid controls `showJapaneseHints`:

- When `showJapaneseHints` is `false`:
  - the word list only shows Japanese (kanji/hiragana) for **found** words.
- When `showJapaneseHints` is `true`:
  - the word list shows Japanese for **all** target words.

Display logic in `WordList.tsx`:

- If `word.kanji` and `word.hiragana` are identical (e.g. `できる,できる`):
  - only a **single** form is shown (e.g. `できる`).
- Otherwise, Japanese is rendered as `kanji (hiragana)` (e.g. `多分 (たぶん)`).

Word List tab animation:

- When hints are turned on while the list is closed, the inner content of the tab (label + chevron) performs a small vertical `pullUpDown` movement to suggest the user should pull the list up.

---

## GitHub Pages deployment

The `vite.config.ts` file sets:

```ts
export default defineConfig(({ mode }) => {
  // ...
  return {
    base: '/kotoba-hunters/',
    // ...
  };
});
```

For a GitHub repository named `kotoba-hunters`, the app will be available at:

```text
https://<your-username>.github.io/kotoba-hunters/
```

General steps:

1. Build the project:

   ```bash
   npm run build
   ```

2. Deploy the contents of `dist/` to a `gh-pages` branch (manually or using a GitHub Action).
3. Configure GitHub Pages to serve from the `gh-pages` branch.

Because `base` is set to `/kotoba-hunters/`, all relative paths (scripts, CSS, CSV files under `data/`) resolve correctly at that URL.
