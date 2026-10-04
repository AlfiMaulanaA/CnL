'use client';

import { useEffect } from 'react';
import confetti from 'canvas-confetti';

import { Modal } from '@/components/ui/Modal';
import type { GameState } from '@/types/game';

export type ResultOptions = {
  onPlayAgain?: () => void;
  onRematch?: () => void;
  onHome: () => void;
  rematchInfo?: { votes: number; total: number } | null;
};

type GameResultModalProps = {
  open: boolean;
  game: GameState;
  youId?: string | null;
  celebrate: boolean;
  result: ResultOptions;
};

const MEDALS = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣'];

/** Victory screen: confetti, standings, winner stats (TASK §45, §46, §82). */
export function GameResultModal({ open, game, youId, celebrate, result }: GameResultModalProps) {
  const winner = game.players.find(p => p.id === game.winnerId) ?? null;
  const youWon = winner != null && youId != null && winner.id === youId;

  useEffect(() => {
    if (!open || !celebrate) return;
    const burst = (origin: { x: number; y: number }, colors: string[]) => {
      confetti({ particleCount: 90, spread: 70, origin, colors, disableForReducedMotion: true });
    };
    burst({ x: 0.5, y: 0.6 }, ['#8B5CF6', '#3B82F6', '#06B6D4', '#22C55E', '#FACC15', '#EC4899']);
    const t1 = setTimeout(() => burst({ x: 0.2, y: 0.7 }, ['#F97316', '#FACC15', '#EC4899']), 250);
    const t2 = setTimeout(() => burst({ x: 0.8, y: 0.7 }, ['#06B6D4', '#22C55E', '#8B5CF6']), 450);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [open, celebrate]);

  if (!open) return null;

  const winnerStats = winner ? game.stats[winner.id] : null;
  const rankings = game.rankings.length
    ? game.rankings
    : [...game.players].sort((a, b) => b.position - a.position).map(p => p.id);

  const title = youWon ? '🎉 YOU WIN!' : winner ? `🏆 ${winner.name.toUpperCase()} WINS!` : '🎉 GAME OVER!';

  return (
    <Modal open={open} hideClose maxWidth="max-w-lg">
      <div className="text-center">
        <div className="text-5xl" aria-hidden>
          {winner?.avatar ?? '🎉'}
        </div>
        <h2 className="mt-2 text-2xl font-bold text-slate-800">{title}</h2>
        <p className="mt-1 text-sm font-semibold text-slate-500">
          {youWon ? 'Amazing climb!' : 'You reached the top — race you next time!'}
        </p>
      </div>

      {/* Final standings */}
      <ol className="mt-4 space-y-1.5">
        {rankings.map((id, index) => {
          const p = game.players.find(pl => pl.id === id);
          if (!p) return null;
          return (
            <li
              key={id}
              className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm ${
                index === 0 ? 'bg-amber-50 ring-1 ring-amber-200' : 'bg-slate-50'
              }`}
            >
              <span aria-hidden>{MEDALS[index] ?? `#${index + 1}`}</span>
              <span className="text-lg" aria-hidden>
                {p.avatar}
              </span>
              <span className="min-w-0 flex-1 truncate font-display font-bold text-slate-700">
                {p.name}
                {youId != null && p.id === youId && <span className="text-brand-purple"> (You)</span>}
              </span>
              <span className="text-xs font-bold text-slate-400">
                {p.position === 0 ? 'Start' : `Tile ${p.position}`}
              </span>
            </li>
          );
        })}
      </ol>

      {/* Winner stats */}
      {winner && winnerStats && (
        <div className="mt-4 grid grid-cols-4 gap-2 text-center">
          {[
            { label: 'Turns', value: winnerStats.turns },
            { label: 'Ladders', value: winnerStats.ladders },
            { label: 'Slides', value: winnerStats.chutes },
            { label: 'Best Roll', value: winnerStats.maxRoll }
          ].map(s => (
            <div key={s.label} className="rounded-xl bg-slate-50 py-2">
              <div className="font-display text-lg font-bold text-brand-purple">{s.value}</div>
              <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
        {result.onPlayAgain && (
          <button type="button" className="btn btn-green flex-1" onClick={result.onPlayAgain}>
            Play Again
          </button>
        )}
        {result.onRematch && (
          <button type="button" className="btn btn-primary flex-1" onClick={result.onRematch}>
            {result.rematchInfo
              ? `Rematch ${result.rematchInfo.votes}/${result.rematchInfo.total}`
              : 'Request Rematch'}
          </button>
        )}
        <button type="button" className="btn btn-ghost flex-1" onClick={result.onHome}>
          Home
        </button>
      </div>
    </Modal>
  );
}
