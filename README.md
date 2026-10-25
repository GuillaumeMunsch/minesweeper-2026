# Minesweeper 2026

Classic Minesweeper in the browser, with visual effects on every move.

**Play it:** https://guillaumemunsch.github.io/minesweeper-2026/

## What it does

- **Three levels**: Beginner (9x9, 10 mines), Intermediate (16x16, 40 mines), Expert (30x16, 99 mines).
- **Safe first click**: mines are placed after the first click, never on that cell or its neighbors.
- **Flood reveal in waves**: empty areas open outward from the click, cell by cell, with a pop and sparks. A big opening also sends a shockwave.
- **Chord click**: click a revealed number whose flags are all placed to open its other neighbors. A wrong flag makes it open a mine.
- **Game over**: the clicked mine explodes, the board shakes, then the other mines blow up one after another, nearest first. Wrong flags are marked.
- **Win**: remaining mines get flagged and confetti falls.
- **Best time per level**, kept in the browser (`localStorage`).

## Controls

| Action | Mouse | Touch |
| --- | --- | --- |
| Reveal a cell | Left click | Tap |
| Flag a cell | Right click or Ctrl + click | Long press |
| Open around a number | Left click on the number | Tap on the number |
| New game | Click the face | Tap the face |

## Code layout

Domain-driven design, plain TypeScript, no UI framework.

```
src/
  domain/          rules only, no DOM: Board, Game, Difficulty, events, ports
  application/     use cases: StartGame, RevealCell, ToggleFlag
  infrastructure/  RandomMinePlacer, LocalStorageBestTimes
  presentation/    BoardView, Hud, Particles (canvas), Effects
  main.ts          wires everything together
```

The domain returns events (`CellsRevealed`, `FlagToggled`, `GameWon`, `GameLost`). The presentation layer plays the effects from those events.

## Run locally

Needs Node 22 and pnpm.

```bash
pnpm install
pnpm dev
```

```bash
pnpm test
```

```bash
pnpm build
```

## Deploy

Every push to `main` runs the tests, builds, and deploys to GitHub Pages (`.github/workflows/deploy.yml`).
