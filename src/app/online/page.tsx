'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Sparkles, Users, Zap } from 'lucide-react';

import { SiteHeader } from '@/components/layout/SiteHeader';
import { AVATARS } from '@/lib/game/players';

const THEME_OPTIONS = [
  { id: 'classic', name: 'Classic Rainbow', color: '#8B5CF6' },
  { id: 'candy', name: 'Bright Candy', color: '#EC4899' },
  { id: 'jungle', name: 'Vibrant Jungle', color: '#10B981' },
  { id: 'ocean', name: 'Deep Ocean', color: '#3B82F6' },
  { id: 'sunset', name: 'Warm Sunset', color: '#F59E0B' }
];

export default function OnlineLobbyPage() {
  const router = useRouter();
  const [playerName, setPlayerName] = useState('Player 1');
  const [avatar, setAvatar] = useState('🦁');
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [fillWithBots, setFillWithBots] = useState(true);
  const [selectedTheme, setSelectedTheme] = useState('classic');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [error, setError] = useState('');

  const generateRoomCode = () => {
    const randomHex = Math.floor(1000 + Math.random() * 9000);
    return `CS-${randomHex}`;
  };

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    const code = generateRoomCode();
    // Save host preferences in sessionStorage for the room route
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(`room_${code}_config`, JSON.stringify({
        name: playerName,
        avatar,
        maxPlayers,
        fillWithBots,
        theme: selectedTheme,
        isHost: true
      }));
    }
    router.push(`/room/${code}`);
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    const code = roomCodeInput.trim().toUpperCase();
    if (!code) {
      setError('Please enter a room code');
      return;
    }
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(`room_${code}_config`, JSON.stringify({
        name: playerName,
        avatar,
        isHost: false
      }));
    }
    router.push(`/room/${code}`);
  };

  const handleQuickMatch = () => {
    const code = generateRoomCode();
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(`room_${code}_config`, JSON.stringify({
        name: playerName,
        avatar,
        maxPlayers: 4,
        fillWithBots: true,
        theme: 'classic',
        isHost: true
      }));
    }
    router.push(`/room/${code}`);
  };

  return (
    <div className="min-h-dvh bg-scene flex flex-col">
      <SiteHeader backHref="/" backLabel="Home" />

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 flex flex-col items-center">
        <div className="w-full max-w-xl flex flex-col gap-6">
          {/* Header Card */}
          <div className="card p-6 flex flex-col items-center text-center shadow-card bg-white border border-slate-200/90 relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-brand-purple/10 rounded-full blur-xl pointer-events-none" />
            <img src="/app-logo.jpeg" alt="Ludo White Theme" className="w-16 h-16 rounded-2xl shadow-md border-2 border-purple-200 mb-3 object-cover" />
            <h1 className="font-display text-3xl font-black text-slate-800">Online Multiplayer</h1>
            <p className="text-sm font-medium text-slate-500 mt-1 max-w-md">
              Create a private room, share your code with friends, or jump into a quick match!
            </p>
          </div>

          {/* Profile Setup */}
          <div className="card p-5 shadow-card bg-white border border-slate-200/90 flex flex-col gap-4">
            <h2 className="font-display text-base font-extrabold text-slate-800 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-purple" /> Player Profile
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4 items-center">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Display Name
                </label>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  maxLength={16}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-800 focus:outline-none focus:border-brand-purple"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Avatar Icon
                </label>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-[240px]">
                  {AVATARS.map((av) => (
                    <button
                      key={av}
                      type="button"
                      onClick={() => setAvatar(av)}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-xl transition-all ${
                        avatar === av
                          ? 'bg-brand-purple text-white shadow-md scale-110 border-2 border-purple-300'
                          : 'bg-slate-100 hover:bg-slate-200 border border-slate-200'
                      }`}
                    >
                      {av}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Mode Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Create Room Box */}
            <div className="card p-5 shadow-card bg-white border border-slate-200/90 flex flex-col gap-3 hover:-translate-y-0.5 transition-transform">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                  <Plus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-base font-extrabold text-slate-800">Create Private Room</h3>
                  <p className="text-xs text-slate-500 font-medium">Host a game with your custom rules</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="btn btn-primary w-full mt-2 font-bold py-2.5 text-sm shadow-md"
              >
                Create Room
              </button>
            </div>

            {/* Quick Match Box */}
            <div className="card p-5 shadow-card bg-white border border-slate-200/90 flex flex-col gap-3 hover:-translate-y-0.5 transition-transform">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
                  <Zap className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-base font-extrabold text-slate-800">Quick Play</h3>
                  <p className="text-xs text-slate-500 font-medium">Instant room setup with AI bots</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleQuickMatch}
                className="btn btn-yellow w-full mt-2 font-bold py-2.5 text-sm shadow-md"
              >
                Instant Match ⚡
              </button>
            </div>
          </div>

          {/* Join Room Form */}
          <div className="card p-5 shadow-card bg-white border border-slate-200/90 flex flex-col gap-3">
            <h2 className="font-display text-base font-extrabold text-slate-800 flex items-center gap-2">
              <Users className="h-4 w-4 text-brand-blue" /> Join with Room Code
            </h2>
            <form onSubmit={handleJoinRoom} className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. CS-1234"
                value={roomCodeInput}
                onChange={(e) => {
                  setRoomCodeInput(e.target.value);
                  setError('');
                }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold uppercase tracking-wider text-slate-800 focus:outline-none focus:border-brand-purple"
              />
              <button type="submit" className="btn btn-blue font-bold px-6 py-2.5 text-sm shadow-md">
                Join Room
              </button>
            </form>
            {error && <p className="text-xs font-bold text-rose-600">{error}</p>}
          </div>
        </div>
      </main>

      {/* Create Room Options Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs animate-fade-in">
          <div className="card max-w-md w-full p-6 bg-white shadow-2xl border border-slate-200 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="font-display text-xl font-black text-slate-800 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-brand-purple" /> Room Settings
              </h2>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRoom} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Max Players
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[2, 3, 4].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setMaxPlayers(num)}
                      className={`py-2 rounded-xl text-sm font-extrabold border transition-all ${
                        maxPlayers === num
                          ? 'bg-brand-purple text-white border-purple-500 shadow-md'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {num} Players
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between py-2 border-y border-slate-100">
                <div>
                  <div className="text-xs font-extrabold text-slate-800">Fill Empty Seats with Bots</div>
                  <div className="text-[11px] text-slate-400 font-medium">Add smart AI players when starting</div>
                </div>
                <input
                  type="checkbox"
                  checked={fillWithBots}
                  onChange={(e) => setFillWithBots(e.target.checked)}
                  className="w-5 h-5 accent-brand-purple rounded"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Board Theme
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {THEME_OPTIONS.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedTheme(t.id)}
                      className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all ${
                        selectedTheme === t.id
                          ? 'border-brand-purple bg-purple-50/50 shadow-xs'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
                      <span className="text-xs font-bold text-slate-800">{t.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-ghost flex-1 py-2.5 text-sm font-bold"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary flex-1 py-2.5 text-sm font-bold shadow-md">
                  Launch Room 🚀
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
