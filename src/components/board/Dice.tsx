'use client';

import { useEffect, useState } from 'react';

export type DiceProps = {
  value: number | null;
  rolling?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

const PIPS: Record<number, Array<[number, number]>> = {
  1: [[1, 1]],
  2: [
    [0, 0],
    [2, 2]
  ],
  3: [
    [0, 0],
    [1, 1],
    [2, 2]
  ],
  4: [
    [0, 0],
    [2, 0],
    [0, 2],
    [2, 2]
  ],
  5: [
    [0, 0],
    [2, 0],
    [1, 1],
    [0, 2],
    [2, 2]
  ],
  6: [
    [0, 0],
    [2, 0],
    [0, 1],
    [2, 1],
    [0, 2],
    [2, 2]
  ]
};

const SIZES = {
  sm: 'h-10 w-10 rounded-xl border-[3px]',
  md: 'h-16 w-16 rounded-2xl border-4',
  lg: 'h-24 w-24 rounded-3xl border-4'
} as const;

const PIP_SIZES = {
  sm: 'h-1.5 w-1.5',
  md: 'h-2.5 w-2.5',
  lg: 'h-3.5 w-3.5'
} as const;

/** Modern flat die face with tumbling animation while rolling (500–900ms). */
export function Dice({ value, rolling = false, size = 'lg', className = '' }: DiceProps) {
  const [face, setFace] = useState<number | null>(value);

  useEffect(() => {
    if (!rolling) {
      setFace(value);
      return;
    }
    const id = setInterval(() => {
      setFace(1 + Math.floor(Math.random() * 6));
    }, 90);
    return () => clearInterval(id);
  }, [rolling, value]);

  const shown = rolling ? (face ?? 3) : value;

  return (
    <div
      className={`relative flex items-center justify-center border-slate-900 bg-white text-slate-900 shadow-candy ${SIZES[size]} ${className}`}
      style={{ borderStyle: 'solid' }}
      role="img"
      aria-label={rolling ? 'Rolling dice' : value ? `Dice showing ${value}` : 'Dice'}
    >
      <div className={`absolute inset-0 ${rolling ? 'animate-dice-tumble' : ''}`} aria-hidden>
        <div className="grid h-full w-full grid-cols-3 grid-rows-3 p-[12%]">
          {Array.from({ length: 9 }, (_, i) => {
            const r = Math.floor(i / 3);
            const c = i % 3;
            const pip = shown != null && (PIPS[shown] ?? []).some(([pc, pr]) => pc === c && pr === r);
            return (
              <span key={i} className="flex items-center justify-center">
                {pip && <span className={`rounded-full bg-slate-900 ${PIP_SIZES[size]}`} />}
              </span>
            );
          })}
        </div>
      </div>
      {shown == null && (
        <span className={`relative font-display font-bold text-slate-400 ${size === 'lg' ? 'text-3xl' : 'text-lg'}`} aria-hidden>
          ?
        </span>
      )}
    </div>
  );
}
