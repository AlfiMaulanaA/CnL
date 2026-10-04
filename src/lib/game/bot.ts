import type { BotDifficulty } from '../../types/player.ts';
import type { RollAction } from '../../types/game.ts';

/**
 * Bots for a game that is almost pure chance (TASK §27): they roll on their
 * turn with a light delay and never touch the dice result. Difficulty only
 * changes the reaction delay, personalities add flavour reactions.
 */

export type BotPreset = {
  name: string;
  avatar: string;
  difficulty: BotDifficulty;
};

export const BOT_PRESETS: BotPreset[] = [
  { name: 'Nova', avatar: '🤖', difficulty: 'medium' },
  { name: 'Pixel', avatar: '🐸', difficulty: 'easy' },
  { name: 'Luna', avatar: '🐧', difficulty: 'hard' },
  { name: 'Bolt', avatar: '🐯', difficulty: 'medium' },
  { name: 'Momo', avatar: '🦊', difficulty: 'easy' }
];

export function pickBotPreset(index: number): BotPreset {
  return BOT_PRESETS[index % BOT_PRESETS.length] ?? { name: `Bot ${index + 1}`, avatar: '🤖', difficulty: 'medium' };
}

/** Server-side delay before a bot rolls. */
export function botDelayMs(difficulty: BotDifficulty = 'medium'): number {
  switch (difficulty) {
    case 'easy':
      return 2400;
    case 'hard':
      return 1100;
    default:
      return 1700;
  }
}

const POSITIVE = ['Nice roll!', "Let's go!", 'Wheee!', 'Climbing time!'];
const NEGATIVE = ['Oh no!', 'Ouch!', 'Not again!', 'So close!'];
const WIN = ['Champion!', 'Top of the world!'];

/** Optional speech-bubble flavour after a roll (TASK §28). */
export function botReaction(action: RollAction): string | null {
  if (action.winner) return WIN[Math.floor(Math.random() * WIN.length)] ?? null;
  if (action.event === 'ladder') return POSITIVE[Math.floor(Math.random() * POSITIVE.length)] ?? null;
  if (action.event === 'chute') return NEGATIVE[Math.floor(Math.random() * NEGATIVE.length)] ?? null;
  if (action.to >= 95) return 'So close!';
  if (Math.random() < 0.25) return POSITIVE[Math.floor(Math.random() * POSITIVE.length)] ?? null;
  return null;
}
