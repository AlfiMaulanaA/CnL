import { memo } from 'react';

export type BoardTileProps = {
  tile: number;
  color: string;
  ink: string;
  highlight?: boolean;
  /** Tile 100 gets a little crown star. */
  isFinish?: boolean;
};

/**
 * A single board square: number first, decoration second — the number must
 * stay readable on every palette (TASK §56).
 */
export const BoardTile = memo(function BoardTile({ tile, color, ink, highlight = false, isFinish = false }: BoardTileProps) {
  return (
    <div
      className="relative flex items-center justify-center rounded-[6px] sm:rounded-md"
      style={{
        backgroundColor: color,
        color: ink,
        backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.28) 1px, transparent 1px)',
        backgroundSize: '7px 7px',
        boxShadow: 'inset 0 -2px 0 rgba(15, 23, 42, 0.12)'
      }}
    >
      <span className="font-display text-[clamp(7px,1.7vw,13px)] font-bold leading-none">{tile}</span>
      {isFinish && (
        <span className="absolute right-[6%] top-[4%] text-[clamp(6px,1.3vw,11px)] leading-none" aria-hidden>
          ★
        </span>
      )}
      {highlight && (
        <span
          className="pointer-events-none absolute inset-0 rounded-[6px] ring-2 ring-inset ring-white/90 sm:rounded-md"
          aria-hidden
        />
      )}
    </div>
  );
});
