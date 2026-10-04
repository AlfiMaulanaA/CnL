'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Play, Plus, Trash2 } from 'lucide-react';

import { useLocalMatch } from '@/hooks/useLocalMatch';
import { useMatchAnimation } from '@/hooks/useMatchAnimation';
import { useSettings } from '@/components/settings/SettingsProvider';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { MatchScreen } from '@/components/game/MatchScreen';
import { AvatarPicker } from '@/components/ui/AvatarPicker';
import { AVATARS, PLAYER_COLORS } from '@/lib/game/players';
import { getTheme } from '@/lib/game/themes';
import { playSound } from '@/lib/sound';
import { clearMatch, loadMatch, recordGameStats, saveMatch, type SavedMatch } from '@/lib/storage';
import type { GamePlayerInit } from '@/lib/game/engine';

type SetupPlayer = { name: string; avatar: string };

export default function LocalPage() {
  const router = useRouter();
  const { settings, rules, guest } = useSettings();
  const animations = settings.animations && !settings.reducedMotion;

  const [setup, setSetup] = useState<SetupPlayer[]>(() => [
    { name: guest.name, avatar: guest.avatar },
    { name: 'Player 2', avatar: AVATARS[1] ?? '🦊' }
  ]);
  const [saved, setSaved] = useState<SavedMatch | null>(null);

  useEffect(() => {
    const match = loadMatch();
    if (match && match.mode === 'local') setSaved(match);
  }, []);

  const playerInits = useMemo<GamePlayerInit[]>(
    () =>
      setup.map((p, i) => ({
        id: `p${i}`,
        name: p.name.trim() || `Player ${i + 1}`,
        avatar: p.avatar,
        color: PLAYER_COLORS[i % PLAYER_COLORS.length]?.hex ?? '#8B5CF6',
        type: 'human'
      })),
    [setup]
  );

  const match = useLocalMatch({ mode: 'local', players: playerInits, rules });
  const animation = useMatchAnimation(match.game, { animations, playSound });

  // Persist progress while playing, clear + record once finished.
  useEffect(() => {
    const game = match.game;
    if (!game) return;
    if (game.status === 'playing') {
      saveMatch({ game, mode: 'local', savedAt: Date.now() });
    } else if (game.status === 'finished') {
      clearMatch();
      recordGameStats(game, 'local');
    }
  }, [match.game]);

  const updatePlayer = (index: number, patch: Partial<SetupPlayer>) => {
    setSetup(prev => prev.map((p, i) => (i === index ? { ...p, ...patch } : p)));
  };

  const colorOf = (index: number) => PLAYER_COLORS[index % PLAYER_COLORS.length]?.hex ?? '#8B5CF6';

  const game = match.game;
  const theme = getTheme(settings.theme);

  if (game) {
    const current = game.players[game.currentPlayerIndex];
    const canRoll =
      game.status === 'playing' && current?.type === 'human' && !animation.animating && !animation.rolling;

    return (
      <MatchScreen
        game={game}
        theme={theme}
        animation={animation}
        canRoll={canRoll}
        onRoll={match.roll}
        title="Local Multiplayer"
        subtitle={`${game.players.length} players · pass & play`}
        timerSeconds={rules.turnTimer || 30}
        celebrate={animations}
        onExit={() => {
          match.stop();
          const fresh = loadMatch();
          setSaved(fresh && fresh.mode === 'local' ? fresh : null);
        }}
        result={{
          onPlayAgain: () => match.restart(),
          onHome: () => router.push('/')
        }}
      />
    );
  }

  return (
    <div className="min-h-dvh pb-10">
      <SiteHeader backHref="/" backLabel="Home" />

      <main className="mx-auto w-full max-w-xl px-4 pt-6">
        <h1 className="text-2xl font-bold text-slate-800">Local Multiplayer</h1>
        <p className="mt-1 text-sm text-slate-500">
          2–6 players on one device. First to tile 100 wins — roll the dice and take turns!
        </p>

        {saved && (
          <div className="card mt-4 flex flex-col gap-3 border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <div className="font-display text-sm font-bold text-amber-800">Continue your match?</div>
              <div className="text-xs text-amber-600">
                {saved.game.players.length} players · {saved.game.players.reduce((m, p) => Math.max(m, p.position), 0)}{' '}
                top tile · saved{' '}
                {new Date(saved.savedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className="btn btn-green btn-sm"
                onClick={() => {
                  match.resume(saved.game);
                  setSaved(null);
                }}
              >
                Resume
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  clearMatch();
                  setSaved(null);
                }}
              >
                Discard
              </button>
            </div>
          </div>
        )}

        <div className="card mt-4 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-sm font-bold uppercase tracking-wide text-slate-400">
              Players ({setup.length})
            </h2>
            <div className="flex gap-2">
              {setup.length < 6 && (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() =>
                    setSetup(prev => [
                      ...prev,
                      { name: `Player ${prev.length + 1}`, avatar: AVATARS[prev.length % AVATARS.length] ?? '🐼' }
                    ])
                  }
                >
                  <Plus className="h-4 w-4" /> Add
                </button>
              )}
            </div>
          </div>

          <ul className="space-y-4">
            {setup.map((p, i) => (
              <li key={i} className="rounded-2xl border border-slate-100 p-3">
                <div className="mb-2 flex items-center gap-2">
                  <span
                    className="flex h-7 w-7 items-center justify-center rounded-full text-sm text-white"
                    style={{ backgroundColor: colorOf(i) }}
                    aria-hidden
                  >
                    {p.avatar}
                  </span>
                  <input
                    value={p.name}
                    onChange={e => updatePlayer(i, { name: e.target.value.slice(0, 15) })}
                    maxLength={15}
                    aria-label={`Player ${i + 1} name`}
                    className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 font-display text-sm font-bold text-slate-700 outline-none focus:border-brand-purple"
                    placeholder={`Player ${i + 1}`}
                  />
                  {setup.length > 2 && (
                    <button
                      type="button"
                      className="rounded-lg p-2 text-slate-300 transition hover:bg-red-50 hover:text-brand-red"
                      onClick={() => setSetup(prev => prev.filter((_, idx) => idx !== i))}
                      aria-label={`Remove player ${i + 1}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <AvatarPicker
                  value={p.avatar}
                  onChange={avatar => updatePlayer(i, { avatar })}
                  label={`Player ${i + 1} token`}
                />
              </li>
            ))}
          </ul>

          <button
            type="button"
            className="btn btn-green mt-4 w-full text-base"
            disabled={setup.length < 2}
            onClick={() => {
              playSound('start');
              match.start();
            }}
          >
            <Play className="h-5 w-5" /> Start Game
          </button>
          <p className="mt-2 text-center text-xs text-slate-400">
            Exact Finish: {rules.exactFinish ? 'ON' : 'OFF'} · Extra Turn on 6:{' '}
            {rules.extraTurnOnSix ? 'ON' : 'OFF'} ·{' '}
            <Link href="/settings" className="font-bold text-brand-purple underline">
              change rules
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
