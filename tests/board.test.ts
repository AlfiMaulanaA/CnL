import { describe, expect, it } from 'vitest';

import {
  BOARD_SIZE,
  CHUTES,
  LADDERS,
  boardEventAt,
  cellToTile,
  eventTarget,
  hopPath,
  ladderList,
  chuteList,
  positionCenter,
  tileCenter,
  tileColorIndex,
  tileToCell,
  tileToGrid
} from '@/lib/game/board';

describe('zig-zag coordinate mapping', () => {
  it('places the documented corner tiles correctly', () => {
    expect(tileToCell(1)).toEqual({ row: 0, col: 0 });
    expect(tileToCell(10)).toEqual({ row: 0, col: 9 });
    expect(tileToCell(11)).toEqual({ row: 1, col: 9 });
    expect(tileToCell(20)).toEqual({ row: 1, col: 0 });
    expect(tileToCell(81)).toEqual({ row: 8, col: 0 });
    expect(tileToCell(90)).toEqual({ row: 8, col: 9 });
    expect(tileToCell(91)).toEqual({ row: 9, col: 9 });
    expect(tileToCell(100)).toEqual({ row: 9, col: 0 });
  });

  it('round-trips every tile 1..100', () => {
    for (let n = 1; n <= BOARD_SIZE; n++) {
      const { row, col } = tileToCell(n);
      expect(cellToTile(row, col)).toBe(n);
    }
  });

  it('maps tiles to CSS grid cells with row 0 at the top', () => {
    expect(tileToGrid(1)).toEqual({ gridRow: 9, col: 0 });
    expect(tileToGrid(10)).toEqual({ gridRow: 9, col: 9 });
    expect(tileToGrid(100)).toEqual({ gridRow: 0, col: 0 });
    expect(tileToGrid(91)).toEqual({ gridRow: 0, col: 9 });
  });

  it('produces normalized centers inside the board', () => {
    for (let n = 1; n <= BOARD_SIZE; n++) {
      const { x, y } = tileCenter(n);
      expect(x).toBeGreaterThan(0);
      expect(x).toBeLessThan(1);
      expect(y).toBeGreaterThan(0);
      expect(y).toBeLessThan(1);
    }
    expect(positionCenter(0)).toEqual(tileCenter(1));
    expect(positionCenter(57)).toEqual(tileCenter(57));
  });

  it('assigns a stable color index 0..5 to every tile', () => {
    for (let n = 1; n <= BOARD_SIZE; n++) {
      const idx = tileColorIndex(n);
      expect(idx).toBeGreaterThanOrEqual(0);
      expect(idx).toBeLessThan(6);
    }
  });
});

describe('board links', () => {
  it('only has ladders going up and chutes going down', () => {
    for (const { from, to } of ladderList()) {
      expect(to).toBeGreaterThan(from);
      expect(to).toBeLessThanOrEqual(BOARD_SIZE);
    }
    for (const { from, to } of chuteList()) {
      expect(to).toBeLessThan(from);
      expect(to).toBeGreaterThanOrEqual(1);
    }
  });

  it('matches the TASK configuration', () => {
    expect(LADDERS).toEqual({ 4: 14, 9: 31, 20: 38, 28: 84, 40: 59, 51: 67, 63: 81, 71: 91 });
    expect(CHUTES).toEqual({ 17: 7, 54: 34, 62: 19, 64: 60, 87: 36, 93: 73, 95: 75, 99: 78 });
  });

  it('detects events and resolves targets', () => {
    expect(boardEventAt(4)).toBe('ladder');
    expect(boardEventAt(87)).toBe('chute');
    expect(boardEventAt(50)).toBeNull();
    expect(eventTarget(28)).toBe(84);
    expect(eventTarget(99)).toBe(78);
    expect(eventTarget(12)).toBeNull();
  });
});

describe('hopPath', () => {
  it('lists every step between two positions', () => {
    expect(hopPath(21, 24)).toEqual([22, 23, 24]);
    expect(hopPath(5, 5)).toEqual([]);
    expect(hopPath(7, 5)).toEqual([6, 5]);
    expect(hopPath(0, 3)).toEqual([1, 2, 3]);
  });
});
