/**
 * Board configuration & coordinate system.
 *
 * The board is a classic 10×10 grid numbered 1–100 in a boustrophedon
 * (zig-zag) pattern:
 *
 *   100 99 98 ... 91     <- row index 9 (top)
 *    81 82 83 ... 90     <- row index 8
 *    ...
 *     1  2  3 ... 10     <- row index 0 (bottom)
 *
 * All coordinates are kept independent from DOM order: the renderer maps
 * `tileToGrid()` onto CSS grid positions, and `tileCenter()` onto normalized
 * 0..1 coordinates shared by the SVG overlay and the token layer.
 */

export const BOARD_SIZE = 100;
export const GRID_SIZE = 10;

/** Bottom of the ladder -> top of the ladder. */
export const LADDERS: Record<number, number> = {
  4: 14,
  9: 31,
  20: 38,
  28: 84,
  40: 59,
  51: 67,
  63: 81,
  71: 91
};

/** Top of the slide -> bottom of the slide. */
export const CHUTES: Record<number, number> = {
  17: 7,
  54: 34,
  62: 19,
  64: 60,
  87: 36,
  93: 73,
  95: 75,
  99: 78
};

export type Cell = {
  /** 0 = bottom row (tiles 1–10), 9 = top row (tiles 91–100). */
  row: number;
  /** 0 = leftmost column. */
  col: number;
};

export type Point = { x: number; y: number };

function clampTile(n: number): number {
  if (!Number.isFinite(n)) return 1;
  return Math.min(BOARD_SIZE, Math.max(1, Math.round(n)));
}

/** Logical cell for a tile (row counted from the bottom, even rows go left→right). */
export function tileToCell(tile: number): Cell {
  const i = clampTile(tile) - 1;
  const row = Math.floor(i / GRID_SIZE);
  const offset = i % GRID_SIZE;
  const col = row % 2 === 0 ? offset : GRID_SIZE - 1 - offset;
  return { row, col };
}

/** Inverse of {@link tileToCell}. */
export function cellToTile(row: number, col: number): number {
  const offset = row % 2 === 0 ? col : GRID_SIZE - 1 - col;
  return row * GRID_SIZE + offset + 1;
}

/**
 * CSS-grid coordinates for a tile: `gridRow` counts from the top (1-based ready)
 * is not applied here — both values are 0-based so callers can add 1.
 */
export function tileToGrid(tile: number): { gridRow: number; col: number } {
  const { row, col } = tileToCell(tile);
  return { gridRow: GRID_SIZE - 1 - row, col };
}

/** Normalized center of a tile (0..1, x → right, y → down). */
export function tileCenter(tile: number): Point {
  const { gridRow, col } = tileToGrid(tile);
  return {
    x: (col + 0.5) / GRID_SIZE,
    y: (gridRow + 0.5) / GRID_SIZE
  };
}

/**
 * Normalized center for a token position.
 * Position 0 (the start, off-board) renders on tile 1's cell so every token
 * stays inside the square board.
 */
export function positionCenter(position: number): Point {
  if (position <= 0) return tileCenter(1);
  return tileCenter(Math.min(position, BOARD_SIZE));
}

export type BoardLink = { from: number; to: number };

export function ladderList(): BoardLink[] {
  return Object.entries(LADDERS)
    .map(([from, to]) => ({ from: Number(from), to }))
    .sort((a, b) => a.from - b.from);
}

export function chuteList(): BoardLink[] {
  return Object.entries(CHUTES)
    .map(([from, to]) => ({ from: Number(from), to }))
    .sort((a, b) => a.from - b.from);
}

/** Event triggered when landing exactly on `position`, if any. */
export function boardEventAt(position: number): 'ladder' | 'chute' | null {
  if (position in LADDERS) return 'ladder';
  if (position in CHUTES) return 'chute';
  return null;
}

export function eventTarget(position: number): number | null {
  if (position in LADDERS) return LADDERS[position] ?? null;
  if (position in CHUTES) return CHUTES[position] ?? null;
  return null;
}

/**
 * Hop-by-hop path a token animates over: every integer position between
 * `from` (exclusive) and `to` (inclusive). Returns [] when nothing moves.
 */
export function hopPath(from: number, to: number): number[] {
  if (to === from) return [];
  const path: number[] = [];
  if (to > from) {
    for (let p = from + 1; p <= to; p++) path.push(p);
  } else {
    for (let p = from - 1; p >= to; p--) path.push(p);
  }
  return path;
}

/** Diagonal-ish alternating palette index for a tile (0..5). */
export function tileColorIndex(tile: number): number {
  const { row, col } = tileToCell(tile);
  return (row + col * 2) % 6;
}
