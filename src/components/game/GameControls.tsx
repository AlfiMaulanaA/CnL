'use client';

import { Dice } from '@/components/board/Dice';
import type { GameState } from '@/types/game';

type GameControlsProps = {
  game: GameState;
  rolling: boolean;
  canRoll: boolean;
  onRoll: () => void;
  /** Small helper line under the button. */
  hint: string;
};

/** Dice + primary ROLL DICE button — the main interactive control (TASK §14). */
export function GameControls({ game, rolling, canRoll, onRoll, hint }: GameControlsProps) {
  const current = game.players[game.currentPlayerIndex];

  return (
    <div className="card flex items-center gap-4 px-4 py-3">
      <Dice value={game.diceValue} rolling={rolling} size="lg" className="shrink-0" />
      <div className="min-w-0 flex-1">
        <button
          type="button"
          className={`btn w-full text-base sm:text-lg ${
            canRoll ? 'btn-primary animate-bounce-in' : 'bg-slate-200 text-slate-400 shadow-none'
          }`}
          disabled={!canRoll}
          onClick={onRoll}
          aria-label={canRoll ? 'Roll the dice' : `Roll disabled — ${hint}`}
        >
          {rolling ? 'ROLLING…' : 'ROLL DICE'}
        </button>
        <p className="mt-1.5 truncate text-center text-xs font-semibold text-slate-500" aria-live="polite">
          {hint}
        </p>
      </div>
      {current && (
        <span className="hidden shrink-0 text-3xl sm:block" aria-hidden title={current.name}>
          {current.avatar}
        </span>
      )}
    </div>
  );
}
