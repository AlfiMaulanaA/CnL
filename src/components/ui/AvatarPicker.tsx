'use client';

import { AVATARS } from '@/lib/game/players';

type AvatarPickerProps = {
  value: string;
  onChange: (avatar: string) => void;
  label?: string;
};

/** Emoji token picker (TASK §18). */
export function AvatarPicker({ value, onChange, label = 'Avatar' }: AvatarPickerProps) {
  return (
    <div role="radiogroup" aria-label={label}>
      <div className="mb-1.5 text-xs font-bold uppercase tracking-wide text-slate-400">{label}</div>
      <div className="flex flex-wrap gap-2">
        {AVATARS.map(a => {
          const active = a === value;
          return (
            <button
              key={a}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={`Avatar ${a}`}
              onClick={() => onChange(a)}
              className={`flex h-11 w-11 items-center justify-center rounded-xl text-xl transition ${
                active
                  ? 'bg-brand-purple/15 ring-2 ring-brand-purple'
                  : 'bg-slate-100 hover:bg-slate-200'
              }`}
            >
              {a}
            </button>
          );
        })}
      </div>
    </div>
  );
}
