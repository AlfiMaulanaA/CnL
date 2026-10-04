export type ChatMessage = {
  id: string;
  playerId: string;
  playerName: string;
  playerAvatar: string;
  playerColor: string;
  text: string;
  emote?: string;
  timestamp: number;
};

export type ActiveEmote = {
  id: string;
  playerId: string;
  emote: string;
  timestamp: number;
};
