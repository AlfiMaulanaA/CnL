import type { GameState } from '../types/game.ts';
import type { AppStats, DeviceSettings, GuestProfile, ModeId, RuleDefaults } from '../types/settings.ts';
import { DEFAULT_SETTINGS } from './game/engine.ts';
import { DEFAULT_THEME } from './game/themes.ts';
import { AVATARS, PLAYER_COLORS } from './game/players.ts';

/** Tiny typed wrapper around localStorage with an app-wide key prefix. */

const PREFIX = 'climb-slide-v1-';

export function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const item = window.localStorage.getItem(PREFIX + key);
    return item ? (JSON.parse(item) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeStorage<T>(key: string, value: T): boolean {
  if (typeof window === 'undefined') return false;
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function removeStorage(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(PREFIX + key);
  } catch {
    /* ignore */
  }
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export const DEFAULT_DEVICE_SETTINGS: DeviceSettings = {
  sound: true,
  music: false,
  animations: true,
  reducedMotion: false,
  volume: 0.7,
  theme: DEFAULT_THEME
};

export function loadDeviceSettings(): DeviceSettings {
  return { ...DEFAULT_DEVICE_SETTINGS, ...readStorage<Partial<DeviceSettings>>('settings', {}) };
}

export function saveDeviceSettings(settings: DeviceSettings): void {
  writeStorage('settings', settings);
}

export function loadRuleDefaults(): RuleDefaults {
  return { ...DEFAULT_SETTINGS, ...readStorage<Partial<RuleDefaults>>('rules', {}) };
}

export function saveRuleDefaults(rules: RuleDefaults): void {
  writeStorage('rules', rules);
}

// ---------------------------------------------------------------------------
// Guest identity (no login required)
// ---------------------------------------------------------------------------

export function makeGuestId(): string {
  const n = Math.floor(1000 + Math.random() * 9000);
  return `Guest${n}`;
}

export function loadGuest(): GuestProfile {
  const saved = readStorage<GuestProfile | null>('guest', null);
  if (saved && saved.id && saved.name) return saved;
  const guest: GuestProfile = { id: makeGuestId(), name: makeGuestId(), avatar: AVATARS[0] ?? '🐼' };
  saveGuest(guest);
  return guest;
}

export function saveGuest(guest: GuestProfile): void {
  writeStorage('guest', guest);
}

export function guestColor(): string {
  return PLAYER_COLORS[0]?.hex ?? '#EF4444';
}

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

export function emptyStats(): AppStats {
  return {
    games: 0,
    wins: 0,
    rolls: 0,
    ladders: 0,
    chutes: 0,
    modes: {
      local: { games: 0, wins: 0 },
      bot: { games: 0, wins: 0 },
      online: { games: 0, wins: 0 }
    },
    recorded: []
  };
}

export function loadStats(): AppStats {
  return { ...emptyStats(), ...readStorage<Partial<AppStats>>('stats', {}) };
}

/** Record a finished match once (idempotent by game id). */
export function recordGameStats(game: GameState, mode: ModeId): AppStats {
  const stats = loadStats();
  if (stats.recorded.includes(game.id)) return stats;

  stats.games += 1;
  stats.rolls += game.turnNumber;
  for (const p of game.players) {
    const s = game.stats[p.id];
    if (!s) continue;
    stats.ladders += s.ladders;
    stats.chutes += s.chutes;
  }

  const modeStats = stats.modes[mode] ?? { games: 0, wins: 0 };
  modeStats.games += 1;

  const winner = game.players.find(p => p.id === game.winnerId);
  const humanWon = winner?.type === 'human';
  if (humanWon) {
    stats.wins += 1;
    modeStats.wins += 1;
  }
  stats.modes[mode] = modeStats;
  stats.recorded.push(game.id);
  if (stats.recorded.length > 200) stats.recorded = stats.recorded.slice(-200);

  writeStorage('stats', stats);
  return stats;
}

// ---------------------------------------------------------------------------
// Offline save-game (local & bot modes)
// ---------------------------------------------------------------------------

export type SavedMatch = {
  game: GameState;
  mode: 'local' | 'bot';
  savedAt: number;
};

export function saveMatch(match: SavedMatch): void {
  writeStorage('match', match);
}

export function loadMatch(): SavedMatch | null {
  const saved = readStorage<SavedMatch | null>('match', null);
  if (!saved || typeof saved !== 'object' || !saved.game) return null;
  if (saved.game.status !== 'playing') return null;
  return saved;
}

export function clearMatch(): void {
  removeStorage('match');
}
