import { describe, expect, it } from 'vitest';

import type { GamePlayerInit } from '@/lib/game/engine';
import { createGame, dispatch, getCurrentPlayer, getNextPlayerIndex, rematchGame, validateGame } from '@/lib/game/engine';
import { calculateNextPosition, canMove, isExtraTurn } from '@/lib/game/rules';
import type { GameSettings, GameState } from '@/types/game';

function makePlayers(n: number): GamePlayerInit[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `p${i}`,
    name: `P${i}`,
    avatar: '🐼',
    color: 'red',
    type: 'human'
  }));
}

function makeGame(n = 2, settings: Partial<GameSettings> = {}): GameState {
  return createGame(makePlayers(n), settings);
}

function roll(game: GameState, value: number, playerId?: string) {
  const res = dispatch(game, playerId ? { roll: value, playerId } : { roll: value });
  if (!res.ok) throw new Error(`roll rejected: ${res.error}`);
  return res.action;
}

describe('calculateNextPosition', () => {
  it('moves forward by the roll', () => {
    expect(calculateNextPosition(20, 5, true)).toBe(25);
    expect(calculateNextPosition(0, 6, true)).toBe(6);
  });

  it('stays put on overshoot with Exact Finish ON', () => {
    expect(calculateNextPosition(97, 5, true)).toBe(97);
    expect(calculateNextPosition(99, 6, true)).toBe(99);
  });

  it('bounces back from the top with Exact Finish OFF', () => {
    expect(calculateNextPosition(97, 5, false)).toBe(98);
    expect(calculateNextPosition(96, 6, false)).toBe(98);
    expect(calculateNextPosition(99, 6, false)).toBe(95);
  });

  it('never exceeds 100 or goes below 0', () => {
    for (let pos = 90; pos <= 99; pos++) {
      for (let d = 1; d <= 6; d++) {
        const r = calculateNextPosition(pos, d, false);
        expect(r).toBeGreaterThanOrEqual(1);
        expect(r).toBeLessThanOrEqual(100);
      }
    }
  });

  it('canMove reflects the exact finish rule', () => {
    expect(canMove(97, 5, true)).toBe(false);
    expect(canMove(97, 5, false)).toBe(true);
    expect(canMove(10, 3, true)).toBe(true);
  });
});

describe('movement, ladders and chutes', () => {
  it('advances the token by the dice value', () => {
    const game = makeGame();
    const action = roll(game, 5);
    expect(action.from).toBe(0);
    expect(action.landed).toBe(5);
    expect(action.event).toBeNull();
    expect(action.to).toBe(5);
    expect(game.players[0]?.position).toBe(5);
  });

  it('climbs a ladder when landing on its base', () => {
    const game = makeGame();
    const action = roll(game, 4);
    expect(action.landed).toBe(4);
    expect(action.event).toBe('ladder');
    expect(action.eventTarget).toBe(14);
    expect(action.to).toBe(14);
    expect(game.stats.p0?.ladders).toBe(1);
    expect(game.stats.p0?.biggestClimb).toBe(10);
  });

  it('slides down a chute when landing on its top', () => {
    const game = makeGame();
    game.players[0]!.position = 12;
    const action = roll(game, 5);
    expect(action.landed).toBe(17);
    expect(action.event).toBe('chute');
    expect(action.eventTarget).toBe(7);
    expect(action.to).toBe(7);
    expect(game.stats.p0?.chutes).toBe(1);
    expect(game.stats.p0?.biggestSlide).toBe(10);
  });

  it('does not move on an exact-finish overshoot', () => {
    const game = makeGame();
    game.players[0]!.position = 97;
    const action = roll(game, 5);
    expect(action.skipped).toBe(true);
    expect(action.to).toBe(97);
    expect(game.players[0]?.position).toBe(97);
  });

  it('applies board events after a bounce-back landing', () => {
    const game = makeGame(2, { exactFinish: false });
    game.players[0]!.position = 97;
    // 97 + 4 = 101 -> bounce to 99 -> chute down to 78.
    const action = roll(game, 4);
    expect(action.landed).toBe(99);
    expect(action.event).toBe('chute');
    expect(action.eventTarget).toBe(78);
    expect(action.to).toBe(78);
  });
});

describe('winner detection', () => {
  it('ends the game when reaching tile 100', () => {
    const game = makeGame(3);
    game.players[0]!.position = 94;
    game.players[1]!.position = 40;
    game.players[2]!.position = 70;
    const action = roll(game, 6);

    expect(action.winner).toBe(true);
    expect(action.to).toBe(100);
    expect(game.status).toBe('finished');
    expect(game.winnerId).toBe('p0');
    expect(game.turnState).toBe('GAME_OVER');
    expect(game.rankings).toEqual(['p0', 'p2', 'p1']);
  });

  it('rejects further rolls after the game is finished', () => {
    const game = makeGame();
    game.players[0]!.position = 99;
    // Exact finish ON: roll 1 wins.
    roll(game, 1);
    const again = dispatch(game, { roll: 3 });
    expect(again).toEqual({ ok: false, error: 'GAME_OVER' });
  });
});

describe('turn rotation & authorization', () => {
  it('rotates to the next player and wraps around', () => {
    const game = makeGame(3);
    expect(getCurrentPlayer(game)?.id).toBe('p0');
    roll(game, 2);
    expect(getCurrentPlayer(game)?.id).toBe('p1');
    roll(game, 2);
    expect(getCurrentPlayer(game)?.id).toBe('p2');
    roll(game, 2);
    expect(getCurrentPlayer(game)?.id).toBe('p0');
    expect(game.turnNumber).toBe(3);
  });

  it('rejects rolls from anyone but the current player', () => {
    const game = makeGame();
    const res = dispatch(game, { roll: 4, playerId: 'p1' });
    expect(res).toEqual({ ok: false, error: 'NOT_YOUR_TURN' });
    expect(game.turnNumber).toBe(0);
  });

  it('getNextPlayerIndex wraps correctly', () => {
    expect(getNextPlayerIndex(0, 4)).toBe(1);
    expect(getNextPlayerIndex(3, 4)).toBe(0);
    expect(getNextPlayerIndex(0, 1)).toBe(0);
  });
});

describe('extra turn on 6', () => {
  it('grants up to maxExtraRolls consecutive extra rolls', () => {
    const game = makeGame(2, { extraTurnOnSix: true, maxExtraRolls: 3 });
    game.players[0]!.position = 46;

    roll(game, 6);
    expect(game.currentPlayerIndex).toBe(0);
    roll(game, 6);
    expect(game.currentPlayerIndex).toBe(0);
    roll(game, 6);
    expect(game.currentPlayerIndex).toBe(0);
    roll(game, 6);
    expect(game.currentPlayerIndex).toBe(1);
    expect(game.consecutiveExtraRolls).toBe(0);
  });

  it('is OFF by default', () => {
    const game = makeGame();
    roll(game, 6);
    expect(game.currentPlayerIndex).toBe(1);
  });

  it('isExtraTurn respects the cap', () => {
    const opts = { extraTurnOnSix: true, maxExtraRolls: 3 };
    expect(isExtraTurn(6, 3, opts)).toBe(false);
    expect(isExtraTurn(6, 2, opts)).toBe(true);
    expect(isExtraTurn(5, 0, opts)).toBe(false);
    expect(isExtraTurn(6, 0, { ...opts, extraTurnOnSix: false })).toBe(false);
  });
});

describe('stats & log', () => {
  it('tracks rolls, max roll and events', () => {
    const game = makeGame();
    roll(game, 4); // ladder 4 -> 14
    roll(game, 3); // p1: 0 -> 3
    expect(game.stats.p0?.turns).toBe(1);
    expect(game.stats.p0?.totalRoll).toBe(4);
    expect(game.stats.p0?.maxRoll).toBe(4);
    expect(game.stats.p1?.turns).toBe(1);
    expect(game.events.length).toBeGreaterThanOrEqual(4);
    expect(game.events.some(e => e.kind === 'ladder')).toBe(true);
    expect(game.events[game.events.length - 1]?.kind).not.toBe('win');
  });
});

describe('rematch', () => {
  it('resets positions, rotates the starter and keeps settings', () => {
    const game = makeGame(3, { exactFinish: false });
    roll(game, 6);
    roll(game, 3);
    expect(game.currentPlayerIndex).toBe(2);
    const next = rematchGame(game);

    expect(next.status).toBe('playing');
    expect(next.winnerId).toBeNull();
    expect(next.turnNumber).toBe(0);
    expect(next.settings.exactFinish).toBe(false);
    expect(next.players.every(p => p.position === 0)).toBe(true);
    // Starter rotates: was p2, now p0.
    expect(next.currentPlayerIndex).toBe(0);
    expect(next.players.map(p => p.id)).toEqual(['p0', 'p1', 'p2']);
  });
});

describe('validateGame', () => {
  it('accepts a real game and rejects broken shapes', () => {
    expect(validateGame(makeGame())).toBe(true);
    expect(validateGame(null)).toBe(false);
    expect(validateGame({})).toBe(false);
    expect(validateGame({ players: [], currentPlayerIndex: 0, status: 'playing' })).toBe(false);
    const bad = makeGame();
    bad.currentPlayerIndex = 99;
    expect(validateGame(bad)).toBe(false);
  });
});
