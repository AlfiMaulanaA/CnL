'use client';

import { useEffect, useRef, useState } from 'react';

import type { GameLogEntry, GameLogKind } from '@/types/game';

const ICONS: Record<GameLogKind, string> = {
  roll: '🎲',
  move: '➡️',
  ladder: '🪜',
  chute: '⬇️',
  skip: '🚫',
  win: '🏆',
  system: 'ℹ️'
};

const ACCENTS: Record<GameLogKind, string> = {
  roll: 'text-slate-500',
  move: 'text-slate-600',
  ladder: 'text-emerald-600',
  chute: 'text-orange-600',
  skip: 'text-slate-400',
  win: 'text-amber-600',
  system: 'text-slate-400'
};

type GameLogProps = {
  events: GameLogEntry[];
  /** Collapsible list on mobile (TASK §58). */
  collapsible?: boolean;
  title?: string;
};

/** Auto-scrolling match event log (TASK §25). */
export function GameLog({ events, collapsible = true, title = 'Game Log' }: GameLogProps) {
  const [expanded, setExpanded] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'nearest' });
  }, [events.length, expanded]);

  return (
    <div className="card flex min-h-0 flex-col overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(v => !v)}
        className="flex items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/70 px-4 py-2.5 text-left lg:cursor-default"
        aria-expanded={expanded}
      >
        <span className="font-display text-sm font-bold text-slate-700">{title}</span>
        <span className="text-xs font-bold text-slate-400">
          <span className="lg:hidden">{expanded ? 'Hide ▲' : 'Show ▼'}</span>
          <span className="hidden lg:inline">{events.length} events</span>
        </span>
      </button>
      <div
        className={`log-scroll min-h-0 flex-1 overflow-y-auto px-3 py-2 transition-all ${
          collapsible && !expanded ? 'max-h-24 lg:max-h-[18rem]' : 'max-h-64 lg:max-h-[18rem]'
        }`}
      >
        <ul className="space-y-1">
          {events.map(e => (
            <li key={e.id} className={`flex items-start gap-2 text-[13px] leading-snug ${ACCENTS[e.kind]}`}>
              <span aria-hidden>{ICONS[e.kind]}</span>
              <span className="min-w-0 flex-1">{e.text}</span>
            </li>
          ))}
          {events.length === 0 && <li className="text-xs text-slate-400">No moves yet — roll the dice!</li>}
        </ul>
        <div ref={endRef} />
      </div>
    </div>
  );
}
