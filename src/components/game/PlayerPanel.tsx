'use client';

import type { GameState } from '@/types/game';

type PlayerPanelProps = {
  game: GameState;
  /** Online: the local player's id (gets the "You" tag). */
  youId?: string | null;
};

function positionLabel(pos: number): string {
  return pos === 0 ? 'Start' : `Tile ${pos}`;
}

/** Player list with active glow, live positions and mini stats (TASK §24, §63). */
export function PlayerPanel({ game, youId }: PlayerPanelProps) {
  const currentId = game.players[game.currentPlayerIndex]?.id;

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-x-visible lg:pb-0" role="list">
      {game.players.map(p => {
        const stats = game.stats[p.id];
        const isCurrent = p.id === currentId && game.status === 'playing';
        const isYou = youId != null && p.id === youId;
        return (
          <div
            key={p.id}
            role="listitem"
            className={`flex min-w-[9.5rem] flex-1 items-center gap-2.5 rounded-xl border p-2.5 transition lg:min-w-0 ${
              isCurrent
                ? 'border-brand-purple bg-white shadow-soft ring-2 ring-brand-purple/25'
                : 'border-slate-100 bg-white/85'
            } ${p.isConnected === false ? 'opacity-60' : ''}`}
          >
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-white text-lg shadow-sm"
              style={{ backgroundColor: p.color }}
              aria-hidden
            >
              {p.avatar}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="truncate font-display text-sm font-bold text-slate-800">{p.name}</span>
                {isYou && <span className="chip bg-brand-purple/15 text-brand-purple">You</span>}
                {p.type === 'bot' && <span className="chip bg-slate-100 text-slate-500">Bot</span>}
                {p.isConnected === false && <span className="chip bg-red-50 text-red-500">Off</span>}
              </div>
              <div className="mt-0.5 flex items-center gap-2 text-[11px] font-semibold text-slate-500">
                <span className={isCurrent ? 'text-brand-purple' : undefined}>{positionLabel(p.position)}</span>
                {stats && stats.ladders > 0 && <span title="Ladders climbed">🪜 {stats.ladders}</span>}
                {stats && stats.chutes > 0 && <span title="Slides hit">⬇ {stats.chutes}</span>}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
