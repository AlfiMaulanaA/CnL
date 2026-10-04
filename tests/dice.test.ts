import { describe, expect, it } from 'vitest';

import { rollDice } from '@/lib/game/dice';

describe('rollDice', () => {
  it('always returns an integer between 1 and 6', () => {
    for (let i = 0; i < 5000; i++) {
      const v = rollDice();
      expect(Number.isInteger(v)).toBe(true);
      expect(v).toBeGreaterThanOrEqual(1);
      expect(v).toBeLessThanOrEqual(6);
    }
  });

  it('uses an injected random source deterministically', () => {
    expect(rollDice(() => 0)).toBe(1);
    expect(rollDice(() => 0.5)).toBe(4);
    expect(rollDice(() => 0.999999)).toBe(6);
  });

  it('covers every face over many rolls', () => {
    const seen = new Set<number>();
    for (let i = 0; i < 500; i++) seen.add(rollDice());
    expect(seen.size).toBe(6);
  });
});
