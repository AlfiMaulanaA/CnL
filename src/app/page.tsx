'use client';

import Link from 'next/link';
import { Bot, Globe, Palette, Smartphone, Sparkles, Users, WifiOff } from 'lucide-react';

import { GameBoard } from '@/components/board/GameBoard';
import { useSettings } from '@/components/settings/SettingsProvider';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { getTheme } from '@/lib/game/themes';

const MODE_CARDS = [
  {
    href: '/online',
    icon: Globe,
    title: 'Play Online',
    text: 'Create a room and race with friends online.',
    cta: 'Play Online',
    className: 'btn-blue'
  },
  {
    href: '/bot',
    icon: Bot,
    title: 'Play vs Bot',
    text: 'Challenge computer players in a quick match.',
    cta: 'Challenge Bot',
    className: 'btn-primary'
  },
  {
    href: '/local',
    icon: Users,
    title: 'Local Multiplayer',
    text: 'Take turns on the same device.',
    cta: 'Play Local',
    className: 'btn-green'
  }
] as const;

const FEATURES = [
  { icon: Globe, title: 'Online Multiplayer', text: 'Private rooms with a shareable code.' },
  { icon: Bot, title: 'Smart Bots', text: 'Play anytime against Nova, Pixel, Luna & Bolt.' },
  { icon: WifiOff, title: 'Offline Ready', text: 'Bot & local modes need zero internet.' },
  { icon: Palette, title: 'Colorful Boards', text: 'Five bright board themes to pick from.' },
  { icon: Smartphone, title: 'Mobile Friendly', text: 'Big touch targets, no sideways scrolling.' }
] as const;

export default function HomePage() {
  const { settings } = useSettings();
  const theme = getTheme(settings.theme);

  return (
    <div className="min-h-dvh">
      <SiteHeader />

      {/* Hero */}
      <section className="mx-auto grid w-full max-w-5xl items-center gap-8 px-4 pb-10 pt-8 lg:grid-cols-[1.05fr_1fr] lg:gap-10 lg:pt-14">
        <div className="text-center lg:text-left">
          <span className="chip bg-brand-purple/10 text-brand-purple">
            <Sparkles className="h-3.5 w-3.5" /> Free · Online & Offline
          </span>
          <h1
            className="mt-3 font-display text-5xl font-bold leading-none tracking-tight sm:text-6xl"
            style={{
              background: 'linear-gradient(120deg, #8B5CF6 0%, #3B82F6 35%, #06B6D4 60%, #22C55E 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent'
            }}
          >
            CLIMB &amp; SLIDE
          </h1>
          <p className="mt-3 font-display text-xl font-bold text-slate-700 sm:text-2xl">
            ROLL. CLIMB. RACE TO THE TOP!
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-500 sm:text-base lg:mx-0">
            Challenge your friends, race against bots, and climb your way to victory.
          </p>
          <div className="mt-6 flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center lg:justify-start">
            <Link href="/local" className="btn btn-primary text-base sm:px-7">
              ▶ Play Now
            </Link>
            <Link href="/bot" className="btn btn-yellow text-base sm:px-7">
              🤖 Play vs Bot
            </Link>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-sm">
          <div className="rotate-[-2deg]">
            <GameBoard decorative players={[]} positions={{}} theme={theme} />
          </div>
          <span className="absolute -left-3 -top-4 animate-bounce-in text-3xl drop-shadow-lg" aria-hidden>
            🎲
          </span>
          <span className="absolute -bottom-4 right-2 animate-bounce-in text-3xl drop-shadow-lg" aria-hidden>
            🪜
          </span>
          <span className="absolute -right-3 top-1/3 animate-bounce-in text-3xl drop-shadow-lg" aria-hidden>
            🌈
          </span>
        </div>
      </section>

      {/* Mode cards */}
      <section className="mx-auto w-full max-w-5xl px-4 pb-10">
        <h2 className="mb-4 text-center text-2xl font-bold text-slate-800 lg:text-left">How do you want to play?</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {MODE_CARDS.map(card => (
            <div key={card.href} className="card flex flex-col p-5 transition hover:-translate-y-1 hover:shadow-soft">
              <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-purple/10 text-brand-purple">
                <card.icon className="h-6 w-6" />
              </span>
              <h3 className="text-lg font-bold text-slate-800">{card.title}</h3>
              <p className="mb-4 mt-1 flex-1 text-sm leading-relaxed text-slate-500">{card.text}</p>
              <Link href={card.href} className={`btn ${card.className} w-full`}>
                {card.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-slate-100 bg-white/60">
        <div className="mx-auto w-full max-w-5xl px-4 py-10">
          <h2 className="mb-5 text-center text-2xl font-bold text-slate-800">Why Climb &amp; Slide?</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {FEATURES.map(f => (
              <div key={f.title} className="rounded-2xl border border-slate-100 bg-white p-4 text-center">
                <span className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-brand-cyan/10 text-brand-cyan">
                  <f.icon className="h-5 w-5" />
                </span>
                <div className="font-display text-sm font-bold text-slate-700">{f.title}</div>
                <div className="mt-0.5 text-xs leading-snug text-slate-400">{f.text}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="px-4 py-6 text-center text-xs font-semibold text-slate-400">
        Climb &amp; Slide · Roll fair, climb high, slide smart 🎲
      </footer>
    </div>
  );
}
