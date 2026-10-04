import { memo } from 'react';

import { positionCenter } from '@/lib/game/board';

export type TokenPlayer = {
  id: string;
  name: string;
  avatar: string;
  color: string;
  isConnected?: boolean;
  activeEmote?: string | null;
};

export type PlayerTokenProps = {
  player: TokenPlayer;
  /** Animated display position (0 = start). */
  position: number;
  /** Transition length for this move: ~150ms per hop, ~700ms for climb/slide. */
  durationMs: number;
  stackIndex: number;
  stackCount: number;
  isCurrent: boolean;
};

/** Nudge overlapping tokens apart so every player stays visible (TASK §19). */
export function stackOffset(index: number, count: number): { x: number; y: number } {
  if (count <= 1) return { x: 0, y: 0 };
  const cols = count <= 4 ? 2 : 3;
  const rows = Math.ceil(count / cols);
  const col = index % cols;
  const row = Math.floor(index / cols);
  return { x: (col - (cols - 1) / 2) * 40, y: (row - (rows - 1) / 2) * 40 };
}

export const PlayerToken = memo(function PlayerToken({
  player,
  position,
  durationMs,
  stackIndex,
  stackCount,
  isCurrent
}: PlayerTokenProps) {
  const { x, y } = positionCenter(position);
  const off = stackOffset(stackIndex, stackCount);
  const scale = stackCount > 1 ? 0.72 : 1;
  const offline = player.isConnected === false;

  return (
    <div
      className="absolute z-20"
      style={{
        left: `${x * 100}%`,
        top: `${y * 100}%`,
        width: '7.4%',
        transform: `translate(-50%, -50%) translate(${off.x}%, ${off.y}%) scale(${scale})`,
        transition:
          durationMs > 0
            ? `left ${durationMs}ms ease-in-out, top ${durationMs}ms ease-in-out, transform 180ms ease-out`
            : 'none',
        zIndex: isCurrent ? 30 : 20,
        opacity: offline ? 0.55 : 1,
        filter: offline ? 'grayscale(0.7)' : undefined
      }}
      role="img"
      aria-label={`${player.name} at ${position === 0 ? 'start' : `tile ${position}`}`}
      data-player={player.id}
    >
      {player.activeEmote && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-bounce-in">
          <div className="bg-white/95 text-slate-800 border-2 border-brand-purple rounded-full px-2.5 py-1 text-base shadow-lg flex items-center gap-1 font-bold whitespace-nowrap">
            <span>{player.activeEmote}</span>
          </div>
        </div>
      )}
      <div
        className="flex aspect-square w-full items-center justify-center rounded-full border-2 border-white"
        style={{
          backgroundColor: player.color,
          boxShadow: isCurrent
            ? '0 0 0 3px rgba(255,255,255,0.9), 0 6px 14px rgba(15,23,42,0.35)'
            : '0 4px 10px rgba(15,23,42,0.3)'
        }}
      >
        <span className="text-[clamp(10px,2.1vw,19px)] leading-none" aria-hidden>
          {player.avatar}
        </span>
      </div>
    </div>
  );
});
