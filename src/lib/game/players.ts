import type { PlayerColor, PlayerColorId } from '../../types/player.ts';

/** Emoji tokens offered to players (TASK §18). */
export const AVATARS = ['🐼', '🦊', '🐸', '🐯', '🐧', '🤖'] as const;

export const PLAYER_COLORS: PlayerColor[] = [
  { id: 'red', hex: '#EF4444', ink: '#FFFFFF' },
  { id: 'blue', hex: '#3B82F6', ink: '#FFFFFF' },
  { id: 'green', hex: '#22C55E', ink: '#FFFFFF' },
  { id: 'yellow', hex: '#FACC15', ink: '#1F2937' },
  { id: 'purple', hex: '#8B5CF6', ink: '#FFFFFF' },
  { id: 'pink', hex: '#EC4899', ink: '#FFFFFF' }
];

export function colorHex(id: PlayerColorId | string): string {
  return PLAYER_COLORS.find(c => c.id === id)?.hex ?? '#8B5CF6';
}

export function colorInk(id: PlayerColorId | string): string {
  return PLAYER_COLORS.find(c => c.id === id)?.ink ?? '#FFFFFF';
}

export function defaultPlayerName(seat: number): string {
  return `Player ${seat + 1}`;
}
