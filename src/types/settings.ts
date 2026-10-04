import type { GameSettings } from './game.ts';
import type { ThemeId } from '../lib/game/themes.ts';

/** Device-level preferences (persisted in localStorage). */
export type DeviceSettings = {
  sound: boolean;
  music: boolean;
  /** Master animation switch — off = instant transitions. */
  animations: boolean;
  reducedMotion: boolean;
  /** 0..1 */
  volume: number;
  theme: ThemeId;
};

/** Default match rules used when creating a new game. */
export type RuleDefaults = GameSettings;

export type GuestProfile = {
  id: string;
  name: string;
  avatar: string;
};

export type ModeId = 'local' | 'bot' | 'online';

export type AppStats = {
  games: number;
  wins: number;
  rolls: number;
  ladders: number;
  chutes: number;
  modes: Record<ModeId, { games: number; wins: number }>;
  /** Game ids already recorded, to avoid double counting. */
  recorded: string[];
};
