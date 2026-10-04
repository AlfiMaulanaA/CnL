'use client';

import type { MatchBanner } from '@/hooks/useMatchAnimation';

type EventBannerProps = {
  banner: MatchBanner;
  /** Distinguishes re-triggered banners so the CSS animation restarts. */
  stamp: number | string;
};

const CONTENT: Record<'ladder' | 'chute' | 'win', { emoji: string; title: string }> = {
  ladder: { emoji: '🪜', title: 'AWESOME!' },
  chute: { emoji: '😱', title: 'OH NO!' },
  win: { emoji: '🎉', title: 'YOU REACHED THE TOP!' }
};

/** Short celebratory overlay for ladders, slides and wins (TASK §64). */
export function EventBanner({ banner, stamp }: EventBannerProps) {
  if (!banner) return null;
  const content = CONTENT[banner.kind];
  const subtitle =
    banner.kind === 'ladder'
      ? `CLIMB TO ${banner.to}!`
      : banner.kind === 'chute'
        ? `SLIDE TO ${banner.to}!`
        : `${banner.playerName.toUpperCase()} WINS!`;

  return (
    <div className="pointer-events-none absolute inset-0 z-40 flex items-start justify-center pt-[12%]">
      <div
        key={`${stamp}-${banner.kind}`}
        className="animate-slide-banner rounded-2xl border-4 border-white px-5 py-3 text-center shadow-soft"
        style={{
          background:
            banner.kind === 'ladder'
              ? 'linear-gradient(135deg, #22C55E, #06B6D4)'
              : banner.kind === 'chute'
                ? 'linear-gradient(135deg, #F97316, #EF4444)'
                : 'linear-gradient(135deg, #FACC15, #F97316)'
        }}
        role="status"
      >
        <div className="text-3xl leading-none sm:text-4xl">{content.emoji}</div>
        <div className="mt-1 font-display text-lg font-bold text-white drop-shadow sm:text-2xl">{content.title}</div>
        <div className="font-display text-sm font-bold text-white/95 sm:text-lg">{subtitle}</div>
      </div>
    </div>
  );
}
