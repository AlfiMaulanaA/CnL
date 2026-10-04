import { describe, expect, it } from 'vitest';

import { BOT_PRESETS, botDelayMs, botReaction, pickBotPreset } from '@/lib/game/bot';
import type { RollAction } from '@/types/game';

describe('bot presets', () => {
  it('offers at least 4 personalities and cycles them', () => {
    expect(BOT_PRESETS.length).toBeGreaterThanOrEqual(4);
    expect(pickBotPreset(0).name).toBe('Nova');
    expect(pickBotPreset(BOT_PRESETS.length).name).toBe('Nova');
    expect(pickBotPreset(1).name).toBe('Pixel');
  });

  it('schedules a light, difficulty-based delay', () => {
    expect(botDelayMs('easy')).toBeGreaterThan(botDelayMs('medium'));
    expect(botDelayMs('medium')).toBeGreaterThan(botDelayMs('hard'));
    expect(botDelayMs()).toBe(botDelayMs('medium'));
  });
});

function action(overrides: Partial<RollAction>): RollAction {
  return {
    type: 'ROLL',
    playerId: 'p0',
    roll: 4,
    from: 0,
    landed: 4,
    event: null,
    eventTarget: null,
    to: 4,
    skipped: false,
    extraTurn: false,
    winner: false,
    ...overrides
  };
}

describe('bot reactions', () => {
  it('reacts to ladders, chutes and wins', () => {
    expect(botReaction(action({ event: 'ladder', eventTarget: 14, to: 14 }))).toBeTruthy();
    expect(botReaction(action({ event: 'chute', eventTarget: 7, to: 7 }))).toBeTruthy();
    expect(botReaction(action({ to: 100, winner: true }))).toBeTruthy();
    expect(botReaction(action({ to: 96 }))).toBe('So close!');
  });

  it('never manipulates the dice — it only decorates the outcome', () => {
    // botReaction is a pure presentation helper: it returns copy or nothing,
    // and never mutates the action.
    const a = action({ roll: 3, to: 3 });
    const first = botReaction(a);
    const second = botReaction(a);
    expect(first === null || typeof first === 'string').toBe(true);
    expect(second === null || typeof second === 'string').toBe(true);
    expect(a.roll).toBe(3);
    expect(a.to).toBe(3);
  });
});
