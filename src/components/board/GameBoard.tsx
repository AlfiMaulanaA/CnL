'use client';

import { memo, useMemo } from 'react';

import { cellToTile, chuteList, ladderList, tileCenter, tileColorIndex, type Point } from '@/lib/game/board';
import type { BoardTheme } from '@/lib/game/themes';
import { BoardTile } from './BoardTile';
import { Chute } from './Chute';
import { Ladder } from './Ladder';
import { PlayerToken, type TokenPlayer } from './PlayerToken';

export type GameBoardProps = {
  players: TokenPlayer[];
  /** Display positions per player id (animated). */
  positions: Record<string, number>;
  /** Transition duration per player id (ms). */
  durations?: Record<string, number>;
  theme: BoardTheme;
  activePlayerId?: string | null;
  /** Tiles to ring (e.g. from / landed / to of the last action). */
  highlightTiles?: number[];
  /** Homepage preview: board only, no tokens. */
  decorative?: boolean;
  className?: string;
};

const DOM_TILES: number[] = Array.from({ length: 100 }, (_, i) => {
  const gridRow = Math.floor(i / 10);
  const col = i % 10;
  // DOM order = top-left to bottom-right; board row 9 (tiles 91–100) sits on top.
  return cellToTile(9 - gridRow, col);
});

function toViewBox(p: Point): Point {
  return { x: p.x * 100, y: p.y * 100 };
}

export const GameBoard = memo(function GameBoard({
  players,
  positions,
  durations,
  theme,
  activePlayerId,
  highlightTiles,
  decorative = false,
  className = ''
}: GameBoardProps) {
  const ladders = useMemo(() => ladderList().map(l => ({ from: toViewBox(tileCenter(l.from)), to: toViewBox(tileCenter(l.to)) })), []);
  const chutes = useMemo(() => chuteList().map(c => ({ from: toViewBox(tileCenter(c.from)), to: toViewBox(tileCenter(c.to)) })), []);
  const highlight = useMemo(() => new Set(highlightTiles ?? []), [highlightTiles]);

  const stacks = useMemo(() => {
    const byPosition = new Map<number, TokenPlayer[]>();
    for (const p of players) {
      const pos = positions[p.id] ?? 0;
      const bucket = byPosition.get(pos);
      if (bucket) bucket.push(p);
      else byPosition.set(pos, [p]);
    }
    const rows: Array<{ player: TokenPlayer; index: number; count: number }> = [];
    for (const bucket of byPosition.values()) {
      bucket.forEach((player, index) => rows.push({ player, index, count: bucket.length }));
    }
    return rows;
  }, [players, positions]);

  return (
    <div
      className={`relative aspect-square w-full overflow-hidden rounded-2xl border-[3px] border-white shadow-soft ${className}`}
      style={{ background: theme.backdrop }}
      aria-label="Game board with 100 tiles"
    >
      {/* Tiles — data coordinates mapped to DOM grid order inside BoardTile's parent. */}
      <div
        className="absolute inset-[3px] grid gap-[2px] sm:gap-[3px]"
        style={{ gridTemplateColumns: 'repeat(10, 1fr)', gridTemplateRows: 'repeat(10, 1fr)' }}
        aria-hidden
      >
        {DOM_TILES.map(tile => (
          <BoardTile
            key={tile}
            tile={tile}
            color={theme.palette[tileColorIndex(tile)] ?? '#8B5CF6'}
            ink={theme.ink}
            highlight={highlight.has(tile)}
            isFinish={tile === 100}
          />
        ))}
      </div>

      {/* Ladders & slides — normalized viewBox, pointer-transparent (TASK §60–62). */}
      <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" aria-hidden>
        {ladders.map(l => (
          <Ladder key={`lad-${l.from.x}-${l.from.y}`} from={l.from} to={l.to} color={theme.ladderColor} accent={theme.ladderAccent} />
        ))}
        {chutes.map(c => (
          <Chute key={`chu-${c.from.x}-${c.from.y}`} from={c.from} to={c.to} color={theme.chuteColor} accent={theme.chuteAccent} />
        ))}
      </svg>

      {/* Tokens */}
      {!decorative &&
        stacks.map(({ player, index, count }) => (
          <PlayerToken
            key={player.id}
            player={player}
            position={positions[player.id] ?? 0}
            durationMs={durations?.[player.id] ?? 0}
            stackIndex={index}
            stackCount={count}
            isCurrent={activePlayerId === player.id}
          />
        ))}
    </div>
  );
});
