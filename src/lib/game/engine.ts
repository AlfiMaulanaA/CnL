import type {
  GameLogEntry,
  GameLogKind,
  GamePlayer,
  GameSettings,
  GameState,
  PlayerStats,
  RollAction
} from '../../types/game.ts';
import { BOARD_SIZE } from './board.ts';
import { rollDice } from './dice.ts';
import { applyBoardEvent, calculateNextPosition, checkWinner, getNextPlayerIndex, isExtraTurn } from './rules.ts';

export { getNextPlayerIndex };

/**
 * Pure game engine. `dispatch()` mutates the given state (Ludo-style) so the
 * authoritative online server can broadcast the very same object, while local
 * play simply clones before dispatching to trigger React re-renders.
 */

export const DEFAULT_SETTINGS: GameSettings = {
  exactFinish: true,
  extraTurnOnSix: false,
  maxExtraRolls: 3,
  turnTimer: 30,
  autoRollOnTimeout: true,
  requireReady: true
};

export type GamePlayerInit = Omit<GamePlayer, 'position' | 'isConnected'> &
  Partial<Pick<GamePlayer, 'position' | 'isConnected'>>;

export type DispatchError = 'NOT_YOUR_TURN' | 'GAME_OVER' | 'ALREADY_ROLLED';

export type DispatchResult = { ok: true; action: RollAction } | { ok: false; error: DispatchError };

export type RollInput = {
  /** When set, the roll is rejected unless it belongs to this player. */
  playerId?: string;
  /** Deterministic override for tests / server-supplied secure rolls. */
  roll?: number;
};

export function emptyStats(): PlayerStats {
  return {
    turns: 0,
    rolls: 0,
    totalRoll: 0,
    maxRoll: 0,
    ladders: 0,
    chutes: 0,
    biggestClimb: 0,
    biggestSlide: 0
  };
}

function pushLog(game: GameState, kind: GameLogKind, text: string, playerId?: string): void {
  game.logSeq += 1;
  const entry: GameLogEntry = { id: game.logSeq, kind, text, ...(playerId ? { playerId } : {}) };
  game.events.push(entry);
  if (game.events.length > 100) game.events.shift();
}

export function createGame(players: GamePlayerInit[], settings: Partial<GameSettings> = {}): GameState {
  const merged: GameSettings = { ...DEFAULT_SETTINGS, ...settings };
  const list: GamePlayer[] = players.map((p, i) => ({
    id: p.id || `p${i}`,
    name: p.name || `Player ${i + 1}`,
    avatar: p.avatar,
    color: p.color,
    position: p.position ?? 0,
    type: p.type,
    ...(p.botDifficulty ? { botDifficulty: p.botDifficulty } : {}),
    isConnected: p.isConnected ?? true
  }));

  const stats: Record<string, PlayerStats> = {};
  for (const p of list) stats[p.id] = emptyStats();

  const game: GameState = {
    id:
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `game-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    status: 'playing',
    settings: merged,
    players: list,
    currentPlayerIndex: 0,
    turnNumber: 0,
    diceValue: null,
    turnState: 'WAITING_FOR_ROLL',
    winnerId: null,
    rankings: [],
    consecutiveExtraRolls: 0,
    lastAction: null,
    events: [],
    stats,
    startedAt: Date.now(),
    version: 1,
    logSeq: 0
  };

  pushLog(game, 'system', `${list.length} players · first to tile ${BOARD_SIZE}`);
  return game;
}

export function getCurrentPlayer(game: GameState): GamePlayer | null {
  return game.players[game.currentPlayerIndex] ?? null;
}

function buildRankings(game: GameState, winnerId: string): string[] {
  const winnerIndex = game.players.findIndex(p => p.id === winnerId);
  const others = game.players
    .map((p, i) => ({ p, i }))
    .filter(x => x.i !== winnerIndex)
    .sort((a, b) => b.p.position - a.p.position || a.i - b.i)
    .map(x => x.p.id);
  return [winnerId, ...others];
}

/**
 * Perform one authoritative roll: generate dice → move → ladder/chute →
 * winner check → turn rotation. Returns the animation payload on success.
 */
export function dispatch(game: GameState, input: RollInput = {}): DispatchResult {
  if (game.status === 'finished' || game.turnState === 'GAME_OVER') {
    return { ok: false, error: 'GAME_OVER' };
  }
  if (game.turnState !== 'WAITING_FOR_ROLL') {
    return { ok: false, error: 'ALREADY_ROLLED' };
  }
  const player = getCurrentPlayer(game);
  if (!player) return { ok: false, error: 'NOT_YOUR_TURN' };
  if (input.playerId && input.playerId !== player.id) {
    return { ok: false, error: 'NOT_YOUR_TURN' };
  }

  const roll = input.roll ?? rollDice();
  const from = player.position;
  const landed = calculateNextPosition(from, roll, game.settings.exactFinish);
  const skipped = landed === from;

  let to = landed;
  let event: RollAction['event'] = null;
  let eventTarget: number | null = null;

  if (!skipped) {
    const res = applyBoardEvent(landed);
    to = res.position;
    event = res.event;
    eventTarget = res.target;
  }

  const winner = checkWinner(to);

  const extraTurn =
    !winner && isExtraTurn(roll, game.consecutiveExtraRolls, game.settings) && game.players.length > 1;

  player.position = to;
  game.diceValue = roll;
  game.turnNumber += 1;

  const stats = game.stats[player.id];
  if (stats) {
    stats.turns += 1;
    stats.rolls += 1;
    stats.totalRoll += roll;
    stats.maxRoll = Math.max(stats.maxRoll, roll);
    if (event === 'ladder' && eventTarget != null) {
      stats.ladders += 1;
      stats.biggestClimb = Math.max(stats.biggestClimb, eventTarget - landed);
    }
    if (event === 'chute' && eventTarget != null) {
      stats.chutes += 1;
      stats.biggestSlide = Math.max(stats.biggestSlide, landed - eventTarget);
    }
  }

  const action: RollAction = {
    type: 'ROLL',
    playerId: player.id,
    roll,
    from,
    landed,
    event,
    eventTarget,
    to,
    skipped,
    extraTurn,
    winner
  };

  pushLog(game, 'roll', `${player.name} rolled ${roll}`, player.id);
  if (skipped) {
    pushLog(game, 'skip', `${player.name} needs an exact roll to finish`, player.id);
  } else {
    pushLog(game, 'move', `${player.name} moved to ${landed}`, player.id);
    if (event === 'ladder' && eventTarget != null) {
      pushLog(game, 'ladder', `${player.name} climbed up to ${eventTarget}`, player.id);
    } else if (event === 'chute' && eventTarget != null) {
      pushLog(game, 'chute', `${player.name} slid down to ${eventTarget}`, player.id);
    }
  }

  if (winner) {
    game.status = 'finished';
    game.winnerId = player.id;
    game.turnState = 'GAME_OVER';
    game.rankings = buildRankings(game, player.id);
    game.consecutiveExtraRolls = 0;
    pushLog(game, 'win', `${player.name} reached tile ${BOARD_SIZE} and wins!`, player.id);
  } else if (extraTurn) {
    game.consecutiveExtraRolls += 1;
    pushLog(game, 'system', `${player.name} rolls again (6!)`, player.id);
  } else {
    game.consecutiveExtraRolls = 0;
    game.currentPlayerIndex = getNextPlayerIndex(game.currentPlayerIndex, game.players.length);
  }

  game.lastAction = action;
  game.version += 1;
  return { ok: true, action };
}

/** Fresh match, same players & settings, rotated starting player. */
export function rematchGame(previous: GameState): GameState {
  const next = createGame(
    previous.players.map(p => ({
      id: p.id,
      name: p.name,
      avatar: p.avatar,
      color: p.color,
      type: p.type,
      ...(p.botDifficulty ? { botDifficulty: p.botDifficulty } : {}),
      isConnected: p.isConnected
    })),
    previous.settings
  );
  next.currentPlayerIndex = previous.players.length > 0 ? (previous.currentPlayerIndex + 1) % previous.players.length : 0;
  return next;
}

/** Structural sanity check used when restoring a saved game. */
export function validateGame(g: unknown): g is GameState {
  if (typeof g !== 'object' || g === null) return false;
  const cand = g as Partial<GameState>;
  if (!Array.isArray(cand.players) || cand.players.length < 2) return false;
  if (typeof cand.currentPlayerIndex !== 'number') return false;
  if (cand.currentPlayerIndex < 0 || cand.currentPlayerIndex >= cand.players.length) return false;
  if (cand.status !== 'playing' && cand.status !== 'finished') return false;
  return cand.players.every(
    p => typeof p.id === 'string' && typeof p.position === 'number' && p.position >= 0 && p.position <= BOARD_SIZE
  );
}
