'use client';

import { useEffect, useState } from 'react';

import type { GameState } from '@/types/game';

type TurnIndicatorProps = {
  game: GameState;
  /** Whether the local player may roll (online). Null = shared device. */
  isMyTurn?: boolean | null;
  /** Absolute ms timestamp when the turn expires (online timer). */
  deadline?: number | null;
  timerSeconds: number;
  busy?: boolean;
};

function formatName(name: string): string {
  return name.length > 12 ? `${name.slice(0, 12)}…` : name;
}

/** Shows whose turn it is, with glow, timer bar and "YOUR TURN" affordance. */
export function TurnIndicator({ game, isMyTurn, deadline, timerSeconds, busy = false }: TurnIndicatorProps) {
  const current = game.players[game.currentPlayerIndex];
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!deadline) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [deadline]);

  if (!current) return null;

  const mine = isMyTurn === true;
  const totalMs = Math.max(1, timerSeconds * 1000);
  const remainingMs = deadline ? Math.max(0, deadline - now) : totalMs;
  const pct = deadline ? Math.min(100, (remainingMs / totalMs) * 100) : 100;
  const low = deadline && remainingMs <= 5000;

  return (
    <div
      className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-2.5 shadow-soft transition ${
        mine ? 'border-brand-purple bg-white' : 'border-slate-100 bg-white/90'
      }`}
      role="status"
      aria-live="polite"
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-lg ${mine ? 'animate-bounce-in' : ''}`}
        style={{ backgroundColor: current.color, borderColor: '#fff' }}
        aria-hidden
      >
        {current.avatar}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-display text-sm font-bold text-slate-800">
            {mine ? (
              <span className="text-brand-purple">🎲 YOUR TURN</span>
            ) : (
              <>{formatName(current.name)}&rsquo;s Turn</>
            )}
          </span>
          {current.type === 'bot' && <span className="chip bg-slate-100 text-slate-500">BOT</span>}
          {busy && <span className="chip bg-brand-yellow/30 text-amber-700">rolling…</span>}
        </div>
        {deadline ? (
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full transition-[width] duration-200 ease-linear ${low ? 'bg-brand-red' : 'bg-brand-green'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        ) : (
          <div className="mt-1 truncate text-xs text-slate-400">
            Tile {current.position} · {game.turnNumber} rolls played
          </div>
        )}
      </div>
    </div>
  );
}
