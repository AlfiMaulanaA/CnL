'use client';

import { use, useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, Copy, Crown, Play, Plus, Trash2, Users } from 'lucide-react';

import { MatchScreen } from '@/components/game/MatchScreen';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { useMatchAnimation } from '@/hooks/useMatchAnimation';
import { getTheme } from '@/lib/game/themes';
import { createGame, dispatch, getCurrentPlayer, type GamePlayerInit } from '@/lib/game/engine';
import { rollDice } from '@/lib/game/dice';
import { playSound } from '@/lib/sound';
import type { GameState } from '@/types/game';
import type { ChatMessage } from '@/types/chat';
import { p2pManager } from '@/lib/socket/p2pRoom';

type PlayerSlot = {
  id: string;
  name: string;
  avatar: string;
  color: string;
  type: 'human' | 'bot';
  isReady: boolean;
  isHost?: boolean;
};

const PLAYER_COLORS = ['#EF4444', '#3B82F6', '#10B981', '#F59E0B'];
const BOT_NAMES = ['Bot Nova 🤖', 'Bot Pixel 🤖', 'Bot Luna 🤖'];

export default function RoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const resolvedParams = use(params);
  const roomId = resolvedParams.roomId;
  const router = useRouter();

  const [copied, setCopied] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [game, setGame] = useState<GameState | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [myPlayerId] = useState('p1');

  // Load configuration stored from /online page if available
  const initialConfig = useMemo(() => {
    if (typeof window === 'undefined') return { name: 'Player 1', avatar: '🦁', isHost: true };
    const stored = sessionStorage.getItem(`room_${roomId}_config`);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        // fallback
      }
    }
    return { name: 'Player 1', avatar: '🦁', isHost: true };
  }, [roomId]);

  const [players, setPlayers] = useState<PlayerSlot[]>(() => [
    {
      id: 'p1',
      name: String(initialConfig.name || 'Player 1'),
      avatar: String(initialConfig.avatar || '🦁'),
      color: PLAYER_COLORS[0] ?? '#EF4444',
      type: 'human',
      isReady: true,
      isHost: true
    },
    {
      id: 'p2',
      name: BOT_NAMES[0] ?? 'Bot Nova 🤖',
      avatar: '🤖',
      color: PLAYER_COLORS[1] ?? '#3B82F6',
      type: 'bot',
      isReady: true
    }
  ]);

  const theme = getTheme(initialConfig.theme || 'classic');
  const animation = useMatchAnimation(game, { animations: true, playSound });

  // BroadcastChannel & PeerJS WebRTC P2P sync
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const channel = new BroadcastChannel(`room_${roomId}`);

    const handlePeerData = ({ data }: any) => {
      if (data?.type === 'SYNC_GAME') {
        setGame(data.game);
        setIsPlaying(true);
      } else if (data?.type === 'CHAT') {
        setChatMessages((prev) => [...prev, data.message]);
      } else if (data?.type === 'EMOTE') {
        playSound('emote');
      }
    };

    if (initialConfig.isHost) {
      p2pManager.createRoom({ roomId, name: initialConfig.name, avatar: initialConfig.avatar });
    } else {
      p2pManager.joinRoom({ roomId, name: initialConfig.name, avatar: initialConfig.avatar });
    }

    p2pManager.on('PEER_DATA', handlePeerData);

    channel.onmessage = (event) => {
      const data = event.data;
      if (data.type === 'SYNC_GAME') {
        setGame(data.game);
        setIsPlaying(true);
      } else if (data.type === 'CHAT') {
        setChatMessages((prev) => [...prev, data.message]);
      } else if (data.type === 'EMOTE') {
        playSound('emote');
      }
    };

    return () => {
      channel.close();
      p2pManager.off('PEER_DATA', handlePeerData);
    };
  }, [roomId, initialConfig]);

  const broadcastEvent = (event: any) => {
    if (typeof window === 'undefined') return;
    const channel = new BroadcastChannel(`room_${roomId}`);
    channel.postMessage(event);
    channel.close();

    if (event.type === 'SYNC_GAME') {
      p2pManager.broadcast('SYNC_GAME', event);
    } else if (event.type === 'CHAT') {
      p2pManager.broadcast('CHAT', event);
    } else if (event.type === 'EMOTE') {
      p2pManager.broadcast('EMOTE', event);
    }
  };

  const copyInviteLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleAddBot = () => {
    if (players.length >= 4) return;
    const nextIdx = players.length;
    const botSlot: PlayerSlot = {
      id: `bot_${Date.now()}`,
      name: BOT_NAMES[nextIdx - 1] || `Bot ${nextIdx} 🤖`,
      avatar: '🤖',
      color: PLAYER_COLORS[nextIdx] ?? '#10B981',
      type: 'bot',
      isReady: true
    };
    setPlayers((prev) => [...prev, botSlot]);
  };

  const handleRemoveSlot = (id: string) => {
    if (players.length <= 2) return;
    setPlayers((prev) => prev.filter((p) => p.id !== id));
  };

  const handleStartGame = () => {
    const gamePlayers: GamePlayerInit[] = players.map((p) => ({
      id: p.id,
      name: p.name,
      avatar: p.avatar,
      color: p.color,
      type: p.type
    }));

    const newGame = createGame(gamePlayers, {});
    setGame(newGame);
    setIsPlaying(true);
    broadcastEvent({ type: 'SYNC_GAME', game: newGame });
  };

  const handleRoll = () => {
    if (!game || game.status !== 'playing') return;
    const val = rollDice();
    const nextGame = structuredClone(game);
    const res = dispatch(nextGame, { roll: val });
    if (res.ok) {
      setGame(nextGame);
      broadcastEvent({ type: 'SYNC_GAME', game: nextGame });
    }
  };

  // Automated bot turns effect
  useEffect(() => {
    if (!game || game.status !== 'playing' || animation.animating) return;
    const current = getCurrentPlayer(game);
    if (current && current.type === 'bot') {
      const timer = setTimeout(() => {
        const val = rollDice();
        const nextGame = structuredClone(game);
        const res = dispatch(nextGame, { roll: val });
        if (res.ok) {
          setGame(nextGame);
          broadcastEvent({ type: 'SYNC_GAME', game: nextGame });
        }
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [game, animation.animating]);

  const handleSendChat = (text: string) => {
    const me = players.find((p) => p.id === myPlayerId) || players[0];
    if (!me) return;
    const newMsg: ChatMessage = {
      id: String(Date.now()),
      playerId: me.id,
      playerName: me.name,
      playerAvatar: me.avatar,
      playerColor: me.color,
      text,
      timestamp: Date.now()
    };
    setChatMessages((prev) => [...prev, newMsg]);
    broadcastEvent({ type: 'CHAT', message: newMsg });
  };

  const handleSendEmote = (emote: string) => {
    const me = players.find((p) => p.id === myPlayerId) || players[0];
    if (!me) return;
    const newMsg: ChatMessage = {
      id: String(Date.now()),
      playerId: me.id,
      playerName: me.name,
      playerAvatar: me.avatar,
      playerColor: me.color,
      text: '',
      emote,
      timestamp: Date.now()
    };
    setChatMessages((prev) => [...prev, newMsg]);
    broadcastEvent({ type: 'CHAT', message: newMsg });
    broadcastEvent({ type: 'EMOTE', emote });
    playSound('emote');
  };

  if (isPlaying && game) {
    return (
      <MatchScreen
        game={game}
        theme={theme}
        animation={animation}
        canRoll={getCurrentPlayer(game)?.type === 'human'}
        onRoll={handleRoll}
        title={`Room ${roomId}`}
        subtitle={`Match in progress (${game.players.length} Players)`}
        youId={myPlayerId}
        onExit={() => setIsPlaying(false)}
        chatMessages={chatMessages}
        onSendChat={handleSendChat}
        onSendEmote={handleSendEmote}
      />
    );
  }

  return (
    <div className="min-h-dvh bg-scene flex flex-col">
      <SiteHeader backHref="/online" backLabel="Lobby" />

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 flex flex-col items-center">
        <div className="w-full flex flex-col gap-6">
          {/* Room Header Card */}
          <div className="card p-6 bg-white border border-slate-200/90 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="chip bg-purple-100 text-purple-700 font-extrabold text-xs mb-1">
                Room Code
              </span>
              <h1 className="font-display text-4xl font-black text-slate-800 tracking-wider">
                {roomId}
              </h1>
              <p className="text-xs text-slate-500 font-semibold mt-1">
                Share this code with friends to join the match!
              </p>
            </div>

            <button
              type="button"
              onClick={copyInviteLink}
              className="btn btn-yellow font-bold py-2.5 px-5 text-xs shadow-md flex items-center gap-2 self-start sm:self-auto"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-700" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Link Copied!' : 'Copy Invite Link'}
            </button>
          </div>

          {/* Player Slots */}
          <div className="card p-6 bg-white border border-slate-200/90 shadow-card flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="font-display text-lg font-black text-slate-800 flex items-center gap-2">
                <Users className="h-5 w-5 text-brand-purple" /> Players ({players.length}/4)
              </h2>
              {players.length < 4 && (
                <button
                  type="button"
                  onClick={handleAddBot}
                  className="btn btn-ghost btn-sm text-xs font-bold text-brand-purple gap-1"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Bot Slot
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {players.map((p, idx) => (
                <div
                  key={p.id}
                  className="p-3.5 rounded-2xl border border-slate-200/80 bg-slate-50 flex items-center justify-between gap-3 shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-xl border-2 border-white shadow-sm"
                      style={{ backgroundColor: p.color }}
                    >
                      {p.avatar}
                    </div>
                    <div>
                      <div className="font-display text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
                        {p.name}
                        {p.isHost && <Crown className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />}
                      </div>
                      <span className="text-[11px] font-bold text-slate-400">
                        {p.type === 'bot' ? 'AI Bot Player' : 'Human Player'}
                      </span>
                    </div>
                  </div>

                  {idx > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveSlot(p.id)}
                      className="text-slate-400 hover:text-rose-500 p-1.5 transition-colors"
                      title="Remove Slot"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Launch Action */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.push('/online')}
              className="btn btn-ghost py-3 px-5 font-bold text-sm"
            >
              <ArrowLeft className="h-4 w-4 mr-1" /> Leave Room
            </button>
            <button
              type="button"
              onClick={handleStartGame}
              className="btn btn-primary flex-1 py-3 text-base font-extrabold shadow-lg flex items-center justify-center gap-2"
            >
              <Play className="h-5 w-5 fill-current" /> Start Game Now 🚀
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
