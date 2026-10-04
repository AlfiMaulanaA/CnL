export type PlayerType = 'human' | 'bot';

export type BotDifficulty = 'easy' | 'medium' | 'hard';

export type PlayerColorId = 'red' | 'blue' | 'green' | 'yellow' | 'purple' | 'pink';

export type PlayerColor = {
  id: PlayerColorId;
  hex: string;
  /** Readable text color when placed on a tile of this color. */
  ink: string;
};
