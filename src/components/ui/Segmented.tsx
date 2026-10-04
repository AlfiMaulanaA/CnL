'use client';

type SegmentedOption<T> = {
  value: T;
  label: string;
};

type SegmentedProps<T> = {
  options: Array<SegmentedOption<T>>;
  value: T;
  onChange: (value: T) => void;
  ariaLabel?: string;
};

/** Pill-style segmented control (Ludo-style). */
export function Segmented<T extends string | number>({ options, value, onChange, ariaLabel }: SegmentedProps<T>) {
  return (
    <div className="flex gap-1.5 rounded-2xl bg-slate-100 p-1.5" role="radiogroup" aria-label={ariaLabel}>
      {options.map(opt => {
        const active = opt.value === value;
        return (
          <button
            key={String(opt.value)}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={`flex-1 rounded-xl px-3 py-2 text-sm font-bold transition ${
              active ? 'bg-white text-brand-purple shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
