'use client';

import { useId } from 'react';

type SwitchProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
};

/** Accessible on/off switch with an optional description line. */
export function Switch({ checked, onChange, label, description, disabled = false }: SwitchProps) {
  const id = useId();
  return (
    <div className={`flex items-center justify-between gap-3 py-2.5 ${disabled ? 'opacity-50' : ''}`}>
      <div className="min-w-0">
        <label htmlFor={id} className="cursor-pointer font-display text-sm font-bold text-slate-700">
          {label}
        </label>
        {description && <p className="text-xs text-slate-400">{description}</p>}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
          checked ? 'bg-brand-green' : 'bg-slate-300'
        }`}
      >
        <span
          className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${checked ? 'left-[22px]' : 'left-0.5'}`}
        />
      </button>
    </div>
  );
}
