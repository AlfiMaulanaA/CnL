import type { BotDifficulty, PlayerType } from './player.ts';

export type GameStatus = 'playing' | 'finished';

export type TurnState = 'WAITING_FOR_ROLL' | 'GAME_OVER';

export type BoardEventKind = 'ladder' | 'chute';

export type GameSettings = {
  /** ON: a roll that would pass tile 100 does not move. OFF: bounce back from 100. */
  exactFinish: boolean;
  /** ON: rolling a 6 grants another roll (bounded by maxExtraRolls). */
  extraTurnOnSix: boolean;
  /** Safety cap for consecutive extra rolls. */
  maxExtraRolls: number;
  /** Seconds per human turn, 0 = unlimited. */
  turnTimer: number;
  /** Auto-roll when a human runs out of time. */
  autoRollOnTimeout: boolean;
  /** Require every player to be ready before the host can start. */
  requireReady: boolean;
};

export type GamePlayer = {
  id: string;
  name: string;
  avatar: string;
  color: string;
  position: number;
  type: PlayerType;
  botDifficulty?: BotDifficulty;
  isConnected: boolean;
};

export type PlayerStats = {
  turns: number;
  rolls: number;
  totalRoll: number;
  maxRoll: number;
  ladders: number;
  chutes: number;
  biggestClimb: number;
  biggestSlide: number;
};

export type GameLogKind = 'roll' | 'move' | 'ladder' | 'chute' | 'skip' | 'win' | 'system';

export type GameLogEntry = {
  id: number;
  kind: GameLogKind;
  playerId?: string;
  text: string;
};

/** Everything the UI needs to animate one authoritative roll. */
export type RollAction = {
  type: 'ROLL';
  playerId: string;
  roll: number;
  /** Position before the roll. */
  from: number;
  /** Position right after moving the dice steps (before ladder/chute). */
  landed: number;
  event: BoardEventKind | null;
  /** Destination of the ladder/chute, when triggered. */
  eventTarget: number | null;
  /** Final position after everything resolved. */
  to: number;
  /** Exact-finish overshoot: token did not move. */
  skipped: boolean;
  extraTurn: boolean;
  winner: boolean;
};

export type GameState = {
  id: string;
  status: GameStatus;
  settings: GameSettings;
  players: GamePlayer[];
  currentPlayerIndex: number;
  /** Total number of rolls performed in this match. */
  turnNumber: number;
  diceValue: number | null;
  turnState: TurnState;
  winnerId: string | null;
  /** Winner first, then everyone else ranked by position. */
  rankings: string[];
  consecutiveExtraRolls: number;
  lastAction: RollAction | null;
  events: GameLogEntry[];
  stats: Record<string, PlayerStats>;
  startedAt: number;
  /** Bumped on every state change; used to ignore stale realtime payloads. */
  version: number;
  logSeq: number;
};
