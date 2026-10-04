'use client';

import Link from 'next/link';
import { Settings } from 'lucide-react';

/** Compact brand bar used on non-game pages. */
export function SiteHeader({ backHref, backLabel }: { backHref?: string; backLabel?: string }) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/85 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl items-center gap-3 px-4 py-3">
        <Link href="/" className="flex min-w-0 items-center gap-2.5" aria-label="Climb & Slide home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/app-logo.jpeg" alt="Ludo Logo" className="h-9 w-9 rounded-xl shadow-md object-cover border border-purple-200" />
          <span className="truncate font-display text-xl font-black tracking-tight text-slate-800">
            Climb <span className="text-brand-purple">&amp;</span> Slide
          </span>
        </Link>
        <div className="flex-1" />
        {backHref && (
          <Link href={backHref} className="btn btn-ghost btn-sm">
            {backLabel ?? 'Back'}
          </Link>
        )}
        <Link
          href="/settings"
          className="btn btn-ghost btn-sm !px-2.5"
          aria-label="Settings"
          title="Settings"
        >
          <Settings className="h-4 w-4" />
        </Link>
      </div>
    </header>
  );
}
