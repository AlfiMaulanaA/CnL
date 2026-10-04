'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { BarChart3, Gamepad2, Music4, Palette, UserRound } from 'lucide-react';

import { AvatarPicker } from '@/components/ui/AvatarPicker';
import { Segmented } from '@/components/ui/Segmented';
import { Switch } from '@/components/ui/Switch';
import { useSettings } from '@/components/settings/SettingsProvider';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { THEME_LIST } from '@/lib/game/themes';
import { emptyStats, loadStats, writeStorage } from '@/lib/storage';
import type { AppStats } from '@/types/settings';

function Section({ icon: Icon, title, children }: { icon: typeof Palette; title: string; children: ReactNode }) {
  return (
    <section className="card p-5">
      <h2 className="mb-2 flex items-center gap-2 text-base font-bold text-slate-800">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-purple/10 text-brand-purple">
          <Icon className="h-4 w-4" />
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function SettingsPage() {
  const { settings, updateSettings, rules, updateRules, guest, updateGuest } = useSettings();
  const [stats, setStats] = useState<AppStats>(() => emptyStats());

  useEffect(() => {
    setStats(loadStats());
  }, []);

  const animationsOn = settings.animations && !settings.reducedMotion;

  return (
    <div className="min-h-dvh pb-12">
      <SiteHeader backHref="/" backLabel="Home" />

      <main className="mx-auto grid w-full max-w-2xl gap-4 px-4 pt-6">
        <h1 className="text-2xl font-bold text-slate-800">Settings</h1>

        <Section icon={UserRound} title="Your Profile">
          <label className="mb-3 block">
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-400">Display name</span>
            <input
              value={guest.name}
              onChange={e => updateGuest({ name: e.target.value.slice(0, 15) })}
              maxLength={15}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 font-display font-bold text-slate-700 outline-none focus:border-brand-purple"
              placeholder="Your name"
            />
          </label>
          <AvatarPicker value={guest.avatar} onChange={avatar => updateGuest({ avatar })} />
        </Section>

        <Section icon={Music4} title="Sound & Music">
          <Switch
            label="Sound effects"
            description="Dice rolls, climbs, slides and wins"
            checked={settings.sound}
            onChange={sound => updateSettings({ sound })}
          />
          <Switch
            label="Background music"
            description="A light original loop (starts after first tap)"
            checked={settings.music}
            onChange={music => updateSettings({ music })}
          />
          <label className="block py-2">
            <span className="mb-1.5 flex items-center justify-between text-xs font-bold uppercase tracking-wide text-slate-400">
              <span>Volume</span>
              <span>{Math.round(settings.volume * 100)}%</span>
            </span>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(settings.volume * 100)}
              onChange={e => updateSettings({ volume: Number(e.target.value) / 100 })}
              className="w-full accent-[#8B5CF6]"
              aria-label="Volume"
            />
          </label>
        </Section>

        <Section icon={Palette} title="Board & Display">
          <div className="mb-2 grid grid-cols-3 gap-2 sm:grid-cols-5">
            {THEME_LIST.map(theme => {
              const active = theme.id === settings.theme;
              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => updateSettings({ theme: theme.id })}
                  aria-pressed={active}
                  className={`rounded-xl border-2 p-2 text-center transition ${
                    active ? 'border-brand-purple bg-brand-purple/5' : 'border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <span className="mx-auto mb-1 flex justify-center gap-0.5" aria-hidden>
                    {theme.palette.slice(0, 6).map(c => (
                      <span key={c} className="h-3 w-3 rounded-full" style={{ backgroundColor: c }} />
                    ))}
                  </span>
                  <span className="text-xs font-bold text-slate-600">{theme.name}</span>
                </button>
              );
            })}
          </div>
          <Switch
            label="Animations"
            description="Token hops, climbs and slides"
            checked={settings.animations}
            onChange={animations => updateSettings({ animations })}
          />
          <Switch
            label="Reduced motion"
            description="Instant transitions, no confetti bounce"
            checked={settings.reducedMotion}
            onChange={reducedMotion => updateSettings({ reducedMotion })}
          />
          {!animationsOn && (
            <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
              Animations are off — moves will appear instantly.
            </p>
          )}
        </Section>

        <Section icon={Gamepad2} title="Default Game Rules">
          <Switch
            label="Exact Finish"
            description="A roll past tile 100 does not move (default ON)"
            checked={rules.exactFinish}
            onChange={exactFinish => updateRules({ exactFinish })}
          />
          <Switch
            label="Bounce Back"
            description="Overshoot bounces back from the top (turns Exact Finish off)"
            checked={!rules.exactFinish}
            onChange={bounce => updateRules({ exactFinish: !bounce })}
          />
          <Switch
            label="Roll 6 = Extra Turn"
            description={`Consecutive sixes grant another roll (max ${rules.maxExtraRolls})`}
            checked={rules.extraTurnOnSix}
            onChange={extraTurnOnSix => updateRules({ extraTurnOnSix })}
          />
          <div className="py-2.5">
            <div className="mb-1.5 text-xs font-bold uppercase tracking-wide text-slate-400">Turn timer</div>
            <Segmented
              ariaLabel="Turn timer"
              value={rules.turnTimer}
              onChange={turnTimer => updateRules({ turnTimer })}
              options={[
                { value: 0, label: 'Off' },
                { value: 15, label: '15s' },
                { value: 30, label: '30s' }
              ]}
            />
          </div>
          <Switch
            label="Auto Roll on Timeout"
            description="Server rolls automatically when time runs out"
            checked={rules.autoRollOnTimeout}
            onChange={autoRollOnTimeout => updateRules({ autoRollOnTimeout })}
          />
          <Switch
            label="Require everyone Ready"
            description="Host can only start when all players are ready"
            checked={rules.requireReady}
            onChange={requireReady => updateRules({ requireReady })}
          />
        </Section>

        <Section icon={BarChart3} title="Your Stats">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { label: 'Games', value: stats.games },
              { label: 'Wins', value: stats.wins },
              { label: 'Rolls', value: stats.rolls },
              { label: 'Climbs', value: stats.ladders }
            ].map(s => (
              <div key={s.label} className="rounded-xl bg-slate-50 py-2.5 text-center">
                <div className="font-display text-xl font-bold text-brand-purple">{s.value}</div>
                <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{s.label}</div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-2 text-xs font-semibold text-slate-500">
            <span className="chip bg-slate-100">Local {stats.modes.local.games}</span>
            <span className="chip bg-slate-100">Bot {stats.modes.bot.games}</span>
            <span className="chip bg-slate-100">Online {stats.modes.online.games}</span>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-sm mt-3"
            onClick={() => {
              writeStorage('stats', emptyStats());
              setStats(emptyStats());
            }}
          >
            Reset stats
          </button>
        </Section>

        <Link href="/" className="btn btn-ghost w-full">
          ← Back to Home
        </Link>
      </main>
    </div>
  );
}
