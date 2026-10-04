'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ArrowLeft, Pause, Play, WifiOff } from 'lucide-react';

import { GameBoard } from '@/components/board/GameBoard';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import type { MatchAnimation } from '@/hooks/useMatchAnimation';
import type { BoardTheme } from '@/lib/game/themes';
import { playSound } from '@/lib/sound';
import type { GameState } from '@/types/game';
import type { ChatMessage } from '@/types/chat';
import { ChatEmotePanel } from './ChatEmotePanel';
import { EventBanner } from './EventBanner';
import { GameControls } from './GameControls';
import { GameLog } from './GameLog';
import { GameResultModal, type ResultOptions } from './GameResultModal';
import { PlayerPanel } from './PlayerPanel';
import { TurnIndicator } from './TurnIndicator';

export type MatchScreenProps = {
  game: GameState;
  theme: BoardTheme;
  animation: MatchAnimation;
  canRoll: boolean;
  onRoll: () => void;
  title: string;
  subtitle?: string;
  /** Online: the local player's id (turn ownership + "You" tag). */
  youId?: string | null;
  /** Online turn deadline (ms epoch) and configured timer length. */
  deadline?: number | null;
  timerSeconds?: number;
  /** Amber bar for connection/room notices. */
  notice?: string | null;
  offline?: boolean;
  headerExtra?: ReactNode;
  /** Extra content under the player list (chat, emotes…). */
  asideExtra?: ReactNode;
  exitLabel?: string;
  exitMessage?: string;
  onExit: () => void;
  result?: ResultOptions | null;
  /** Confetti + celebration effects (off when animations/reduced-motion say no). */
  celebrate?: boolean;
  onSendChat?: (text: string) => void;
  onSendEmote?: (emote: string) => void;
  chatMessages?: ChatMessage[];
};

/**
 * Shared match layout: desktop = players | board | log, mobile = turn → board
 * → dice → players → collapsible log (TASK §57–58).
 */
export function MatchScreen({
  game,
  theme,
  animation,
  canRoll,
  onRoll,
  title,
  subtitle,
  youId,
  deadline,
  timerSeconds = 30,
  notice,
  offline = false,
  headerExtra,
  asideExtra,
  exitLabel = 'Exit',
  exitMessage = 'Leave this match? Your progress is saved on this device and you can resume later.',
  onExit,
  result,
  celebrate = true,
  onSendChat,
  onSendEmote,
  chatMessages = []
}: MatchScreenProps) {
  const [confirmExit, setConfirmExit] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>(chatMessages);
  const [activeEmotes, setActiveEmotes] = useState<Record<string, string>>({});

  const current = game.players[game.currentPlayerIndex];
  const finished = game.status === 'finished';
  const isMyTurn = youId != null ? current?.id === youId : current?.type === 'human';

  const highlightTiles = useMemo(() => {
    const a = game.lastAction;
    if (!a) return [];
    return Array.from(new Set([a.from, a.landed, a.to, a.eventTarget ?? -1])).filter(t => t > 0);
  }, [game.lastAction]);

  // "Turn ready" ping once the previous animation settles.
  const wasAnimating = useRef(animation.animating);
  useEffect(() => {
    const before = wasAnimating.current;
    wasAnimating.current = animation.animating;
    if (before && !animation.animating && game.status === 'playing') playSound('turn');
  }, [animation.animating, game.status]);

  const handleSendMessage = (text: string, emote?: string) => {
    if (onSendChat) {
      onSendChat(text);
      return;
    }
    const myPlayer = game.players.find(p => p.id === (youId ?? current?.id)) ?? current;
    const newMsg: ChatMessage = {
      id: String(Date.now()),
      playerId: myPlayer?.id ?? 'p1',
      playerName: myPlayer?.name ?? 'Player',
      playerAvatar: myPlayer?.avatar ?? '👤',
      playerColor: myPlayer?.color ?? '#8B5CF6',
      text,
      emote,
      timestamp: Date.now()
    };
    setLocalMessages(prev => [...prev, newMsg]);
  };

  const handleSendEmote = (emote: string) => {
    if (onSendEmote) {
      onSendEmote(emote);
      return;
    }
    const myPlayer = game.players.find(p => p.id === (youId ?? current?.id)) ?? current;
    if (!myPlayer) return;
    setActiveEmotes(prev => ({ ...prev, [myPlayer.id]: emote }));
    playSound('emote');
    setTimeout(() => {
      setActiveEmotes(prev => {
        const next = { ...prev };
        delete next[myPlayer.id];
        return next;
      });
    }, 3000);
  };

  const players = game.players.map(p => ({
    id: p.id,
    name: p.name,
    avatar: p.avatar,
    color: p.color,
    isConnected: p.isConnected,
    activeEmote: activeEmotes[p.id] ?? null
  }));

  let hint = 'Tap to roll!';
  if (finished) hint = 'Match complete!';
  else if (isPaused) hint = 'Game Paused';
  else if (animation.rolling) hint = `${current?.name ?? 'Player'} is rolling…`;
  else if (animation.animating) hint = 'Moving…';
  else if (!isMyTurn) hint = `Waiting for ${current?.name ?? 'the next player'}…`;
  else if (current && game.settings.exactFinish && 100 - current.position <= 6) {
    hint = `Need exactly ${100 - current.position} to win!`;
  } else if (current && !game.settings.exactFinish && 100 - current.position <= 6) {
    hint = `Need ${100 - current.position} — overshoot bounces back!`;
  }

  return (
    <div className="flex min-h-dvh flex-col bg-scene">
      <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-slate-200/80 bg-white/95 px-3 py-2.5 backdrop-blur sm:gap-3 sm:px-4 shadow-xs">
        <button
          type="button"
          className="btn btn-ghost btn-sm !px-2.5"
          onClick={() => setConfirmExit(true)}
          aria-label={exitLabel}
          title={exitLabel}
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="truncate font-display text-sm font-extrabold text-slate-800 sm:text-base">{title}</div>
          {subtitle && <div className="truncate text-xs font-semibold text-slate-400">{subtitle}</div>}
        </div>

        <button
          type="button"
          className={`btn btn-sm ${isPaused ? 'btn-yellow' : 'btn-ghost'} !px-3 gap-1.5`}
          onClick={() => setIsPaused(prev => !prev)}
          title={isPaused ? 'Resume Game' : 'Pause Game'}
        >
          {isPaused ? <Play className="h-3.5 w-3.5 fill-current" /> : <Pause className="h-3.5 w-3.5" />}
          <span className="hidden sm:inline font-bold text-xs">{isPaused ? 'Resume' : 'Pause'}</span>
        </button>

        {offline && (
          <span className="chip bg-slate-100 text-slate-500" title="This mode works without internet">
            <WifiOff className="h-3 w-3" /> Offline
          </span>
        )}
        {headerExtra}
      </header>

      {notice && (
        <div className="bg-amber-50 border-b border-amber-200/80 px-4 py-1.5 text-center text-xs font-bold text-amber-800" role="status">
          {notice}
        </div>
      )}

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-3 px-3 py-3 lg:flex-row lg:items-start lg:justify-center lg:gap-5 lg:px-4">
        <aside className="order-3 w-full lg:order-1 lg:w-56 lg:shrink-0">
          <PlayerPanel game={game} youId={youId ?? null} />
          {asideExtra && <div className="mt-3">{asideExtra}</div>}
        </aside>

        <section className="order-1 flex w-full max-w-[34rem] flex-col gap-3 lg:order-2">
          <TurnIndicator
            game={game}
            isMyTurn={isMyTurn}
            deadline={deadline ?? null}
            timerSeconds={timerSeconds}
            busy={animation.rolling || isPaused}
          />
          <div className="relative">
            <GameBoard
              players={players}
              positions={animation.positions}
              durations={animation.durations}
              theme={theme}
              activePlayerId={current?.id ?? null}
              highlightTiles={highlightTiles}
            />
            <EventBanner banner={animation.banner} stamp={game.version} />

            {/* Pause Overlay */}
            {isPaused && (
              <div className="absolute inset-0 z-40 flex flex-col items-center justify-center rounded-2xl bg-slate-900/60 p-6 text-center backdrop-blur-xs animate-fade-in">
                <div className="card max-w-xs p-6 flex flex-col items-center gap-3 shadow-2xl border border-slate-200 bg-white">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 text-2xl shadow-inner">
                    ⏸️
                  </div>
                  <h3 className="font-display text-xl font-black text-slate-800">Game Paused</h3>
                  <p className="text-xs text-slate-500 font-medium">Take a break! Resume whenever you are ready to continue.</p>
                  <button
                    type="button"
                    onClick={() => setIsPaused(false)}
                    className="btn btn-primary w-full py-2.5 text-sm font-bold shadow-md"
                  >
                    ▶ Resume Game
                  </button>
                </div>
              </div>
            )}
          </div>

          <GameControls
            game={game}
            rolling={animation.rolling}
            canRoll={canRoll && !isPaused}
            onRoll={onRoll}
            hint={hint}
          />
        </section>

        <aside className="order-4 flex w-full min-h-0 flex-col gap-3 lg:order-3 lg:w-72 lg:shrink-0">
          <ChatEmotePanel
            messages={chatMessages.length > 0 ? chatMessages : localMessages}
            onSendMessage={handleSendMessage}
            onSendEmote={handleSendEmote}
          />
          <GameLog events={game.events} />
        </aside>
      </main>

      <ConfirmModal
        open={confirmExit}
        title={exitLabel}
        message={exitMessage}
        confirmText={exitLabel}
        danger
        onConfirm={() => {
          setConfirmExit(false);
          onExit();
        }}
        onCancel={() => setConfirmExit(false)}
      />

      {result && (
        <GameResultModal
          open={finished && !animation.animating}
          game={game}
          youId={youId ?? null}
          celebrate={celebrate}
          result={result}
        />
      )}
    </div>
  );
}
