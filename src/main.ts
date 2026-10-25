import './styles.css';
import { RevealCell } from './application/reveal-cell';
import { StartGame } from './application/start-game';
import { ToggleFlag } from './application/toggle-flag';
import type { DifficultyName } from './domain/difficulty';
import type { Game } from './domain/game';
import { LocalStorageBestTimes } from './infrastructure/local-storage-best-times';
import { RandomMinePlacer } from './infrastructure/random-mine-placer';
import { BoardView } from './presentation/board-view';
import { query } from './presentation/dom';
import { Effects } from './presentation/effects';
import { Hud } from './presentation/hud';
import { Particles } from './presentation/particles';
import { Timeline } from './presentation/timeline';

const clock = () => performance.now();
const bestTimes = new LocalStorageBestTimes();
const startGame = new StartGame(new RandomMinePlacer(), bestTimes);
const revealCell = new RevealCell(bestTimes, clock);
const toggleFlag = new ToggleFlag();

const timeline = new Timeline();
const particles = new Particles(query<HTMLCanvasElement>(document, '#fx'));
const hud = new Hud(query(document, '.app'), { restart: newGame }, clock);
const board = new BoardView(query(document, '#board'), {
  reveal(position) {
    const { events, newRecord } = revealCell.execute(game, position);
    effects.play(events);
    hud.apply(events, newRecord);
  },
  flag(position) {
    const events = toggleFlag.execute(game, position);
    effects.play(events);
    hud.apply(events);
  },
  press: (pressing) => hud.pressing(pressing),
});
const effects = new Effects(board, particles, timeline);

let game: Game;

function newGame(difficulty: DifficultyName): void {
  timeline.cancelAll();
  particles.clear();
  const started = startGame.execute(difficulty);
  game = started.game;
  board.render(game.difficulty);
  hud.reset(game.difficulty, started.bestTimeMs);
}

newGame('beginner');
