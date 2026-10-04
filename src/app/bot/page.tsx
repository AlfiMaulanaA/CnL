'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Cpu, Play } from 'lucide-react';

import { useLocalMatch } from '@/hooks/useLocalMatch';
import { useMatchAnimation } from '@/hooks/useMatchAnimation';
import { useSettings } from '@/components/settings/SettingsProvider';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { MatchScreen } from '@/components/game/MatchScreen';
import { AvatarPicker } from '@/components/ui/AvatarPicker';
import { Segmented } from '@/components/ui/Segmented';
import { pickBotPreset } from '@/lib/game/bot';
import { PLAYER_COLORS } from '@/lib/game/players';
import { getTheme } from '@/lib/game/themes';
import { playSound } from '@/lib/sound';
import { clearMatch, loadMatch, recordGameStats, saveMatch, type SavedMatch } from '@/lib/storage';
import type { GamePlayerInit } from '@/lib/game/engine';
import type { BotDifficulty } from '@/types/player';

export default function BotPage() {
  const router = useRouter();
  const { settings, rules, guest } = useSettings();
  const animations = settings.animations && !settings.reducedMotion;

  const [you, setYou] = useState(() => ({ name: guest.name, avatar: guest.avatar }));
  const [playerCount, setPlayerCount] = useState(2);
  const [difficulty, setDifficulty] = useState<BotDifficulty>('medium');
  const [saved, setSaved] = useState<SavedMatch | null>(null);

  useEffect(() => {
    const match = loadMatch();
    if (match && match.mode === 'bot') setSaved(match);
  }, []);

  const colorOf = (index: number) => PLAYER_COLORS[index % PLAYER_COLORS.length]?.hex ?? '#8B5CF6';

  const playerInits = useMemo<GamePlayerInit[]>(() => {
    const human: GamePlayerInit = {
      id: 'p0',
      name: you.name.trim() || 'You',
      avatar: you.avatar,
      color: colorOf(0),
      type: 'human'
    };
    const bots: GamePlayerInit[] = Array.from({ length: Math.max(0, playerCount - 1) }, (_, i) => {
      const preset = pickBotPreset(i);
      return {
        id: `p${i + 1}`,
        name: preset.name,
        avatar: preset.avatar,
        color: colorOf(i + 1),
        type: 'bot',
        botDifficulty: difficulty
      };
    });
    return [human, ...bots];
  }, [you.name, you.avatar, playerCount, difficulty]);

  const match = useLocalMatch({ mode: 'bot', players: playerInits, rules });
  const animation = useMatchAnimation(match.game, { animations, playSound });

  useEffect(() => {
    const game = match.game;
    if (!game) return;
    if (game.status === 'playing') {
      saveMatch({ game, mode: 'bot', savedAt: Date.now() });
    } else if (game.status === 'finished') {
      clearMatch();
      recordGameStats(game, 'bot');
    }
  }, [match.game]);

  const game = match.game;
  const theme = getTheme(settings.theme);

  if (game) {
    const current = game.players[game.currentPlayerIndex];
    const canRoll =
      game.status === 'playing' && current?.type === 'human' && !animation.animating && !animation.rolling;
    const botNames = game.players.filter(p => p.type === 'bot').map(p => p.name).join(', ');

    return (
      <MatchScreen
        game={game}
        theme={theme}
        animation={animation}
        canRoll={canRoll}
        onRoll={match.roll}
        youId="p0"
        title="Play vs Bot"
        subtitle={botNames ? `vs ${botNames}` : 'quick match'}
        timerSeconds={rules.turnTimer || 30}
        celebrate={animations}
        exitMessage="Leave the match? Your progress is saved on this device and you can resume later."
        onExit={() => {
          match.stop();
          const fresh = loadMatch();
          setSaved(fresh && fresh.mode === 'bot' ? fresh : null);
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
        <h1 className="text-2xl font-bold text-slate-800">Play vs Bot</h1>
        <p className="mt-1 text-sm text-slate-500">
          Challenge the bots in a quick match — works fully offline.
        </p>

        {saved && (
          <div className="card mt-4 flex flex-col gap-3 border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <div className="font-display text-sm font-bold text-amber-800">Continue your match?</div>
              <div className="text-xs text-amber-600">
                {saved.game.players.length} players · saved{' '}
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

        <div className="card mt-4 space-y-5 p-4">
          <div>
            <div className="mb-1.5 text-xs font-bold uppercase tracking-wide text-slate-400">Your token</div>
            <div className="mb-3 flex items-end gap-3">
              <input
                value={you.name}
                onChange={e => setYou(prev => ({ ...prev, name: e.target.value.slice(0, 15) }))}
                maxLength={15}
                aria-label="Your name"
                className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2.5 font-display font-bold text-slate-700 outline-none focus:border-brand-purple"
                placeholder="Your name"
              />
            </div>
            <AvatarPicker value={you.avatar} onChange={avatar => setYou(prev => ({ ...prev, avatar }))} label="Avatar" />
          </div>

          <div>
            <div className="mb-1.5 text-xs font-bold uppercase tracking-wide text-slate-400">Players</div>
            <Segmented
              ariaLabel="Number of players"
              value={playerCount}
              onChange={setPlayerCount}
              options={[
                { value: 2, label: '2 Players' },
                { value: 3, label: '3 Players' },
                { value: 4, label: '4 Players' }
              ]}
            />
          </div>

          <div>
            <div className="mb-1.5 text-xs font-bold uppercase tracking-wide text-slate-400">Bot difficulty</div>
            <Segmented
              ariaLabel="Bot difficulty"
              value={difficulty}
              onChange={setDifficulty}
              options={[
                { value: 'easy', label: '😊 Easy' },
                { value: 'medium', label: '🙂 Medium' },
                { value: 'hard', label: '😎 Hard' }
              ]}
            />
            <p className="mt-1.5 text-xs text-slate-400">
              Bots roll fair dice — difficulty only changes how fast they react.
            </p>
          </div>

          <div>
            <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Opponents</div>
            <div className="flex flex-wrap gap-2">
              {playerInits.slice(1).map(p => (
                <span
                  key={p.id}
                  className="chip border border-slate-100 bg-slate-50 text-slate-600"
                  style={{ backgroundColor: `${p.color}1A` }}
                >
                  <span aria-hidden>{p.avatar}</span> {p.name}
                  <Cpu className="h-3 w-3 opacity-50" />
                </span>
              ))}
            </div>
          </div>

          <button
            type="button"
            className="btn btn-primary w-full text-base"
            onClick={() => {
              playSound('start');
              match.start();
            }}
          >
            <Play className="h-5 w-5" /> Start Match
          </button>
          <p className="text-center text-xs text-slate-400">
            Exact Finish: {rules.exactFinish ? 'ON' : 'OFF'} ·{' '}
            <Link href="/settings" className="font-bold text-brand-purple underline">
              change rules
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
