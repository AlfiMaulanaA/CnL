import type { BotDifficulty, PlayerType } from './player.ts';
import type { GameSettings, GameState, RollAction } from './game.ts';

export type RoomStatus = 'LOBBY' | 'PLAYING' | 'FINISHED';

export type RoomPlayer = {
  id: string;
  seat: number;
  name: string;
  avatar: string;
  color: string;
  type: PlayerType;
  botDifficulty?: BotDifficulty;
  isReady: boolean;
  isConnected: boolean;
};

export type ChatMessage = {
  id: string;
  senderId: string;
  sender: string;
  color: string;
  text: string;
  time: string;
};

export type RoomConfig = GameSettings & {
  maxPlayers: number;
  /** Fill empty seats with bots when the host starts. */
  fillWithBots: boolean;
};

export type RoomState = {
  code: string;
  hostId: string;
  status: RoomStatus;
  config: RoomConfig;
  players: RoomPlayer[];
  chat: ChatMessage[];
  createdAt: number;
  /** Player ids that voted for a rematch (online finished games). */
  rematchVotes: string[];
};

// ---------------------------------------------------------------------------
// Socket contract
// ---------------------------------------------------------------------------

export type Callback<T extends object = object> = (res: { success: boolean; error?: string } & T) => void;

export type CreateRoomPayload = {
  name: string;
  avatar: string;
  maxPlayers: number;
  fillWithBots: boolean;
  settings: Partial<GameSettings>;
};

export type JoinRoomPayload = { code: string; name: string; avatar: string };

export type RejoinRoomPayload = { code: string; playerId: string };

export type GameUpdatedPayload = {
  game: GameState;
  /** The roll that just resolved (null for state-only refreshes). */
  action: RollAction | null;
};

export type ClientToServerEvents = {
  CREATE_ROOM: (payload: CreateRoomPayload, cb: Callback<{ roomCode: string; playerId: string; roomState: RoomState }>) => void;
  JOIN_ROOM: (payload: JoinRoomPayload, cb: Callback<{ roomCode: string; playerId: string; roomState: RoomState }>) => void;
  QUICK_MATCH: (payload: { name: string; avatar: string }, cb: Callback<{ roomCode: string; playerId: string; roomState: RoomState }>) => void;
  REJOIN_ROOM: (
    payload: RejoinRoomPayload,
    cb: Callback<{ roomState: RoomState; game: GameState | null; playerId: string }>
  ) => void;
  UPDATE_NAME: (payload: { name: string }, cb?: Callback<{ name: string }>) => void;
  UPDATE_AVATAR: (payload: { avatar: string }, cb?: Callback<{ avatar: string }>) => void;
  TOGGLE_READY: () => void;
  ADD_BOT: (payload?: { difficulty?: BotDifficulty }, cb?: Callback) => void;
  REMOVE_BOT: (payload: { playerId: string }, cb?: Callback) => void;
  KICK_PLAYER: (payload: { playerId: string }, cb?: Callback) => void;
  UPDATE_SETTINGS: (payload: { settings: Partial<GameSettings> }, cb?: Callback) => void;
  START_GAME: (payload?: Record<string, never>, cb?: Callback) => void;
  ROLL_DICE: (payload?: { actionId?: string }) => void;
  VOTE_REMATCH: () => void;
  SEND_EMOTE: (payload: { emote: string }) => void;
  SEND_CHAT: (payload: { text: string }) => void;
  LEAVE_ROOM: () => void;
};

export type ServerToClientEvents = {
  ROOM_UPDATED: (payload: { roomState: RoomState }) => void;
  GAME_STARTED: (payload: { game: GameState }) => void;
  GAME_UPDATED: (payload: GameUpdatedPayload) => void;
  TURN_DEADLINE: (payload: { playerId: string; deadline: number | null }) => void;
  PLAYER_JOINED: (payload: { player: RoomPlayer; roomState: RoomState }) => void;
  PLAYER_LEFT: (payload: { playerId: string; name: string; reason: 'left' | 'kick' | 'AFK'; roomState: RoomState }) => void;
  PLAYER_RECONNECTED: (payload: { playerId: string; roomState: RoomState }) => void;
  REMATCH_STATUS: (payload: { votes: string[]; total: number }) => void;
  EMOTE_RECEIVED: (payload: { playerId: string; playerName: string; emote: string }) => void;
  CHAT_RECEIVED: (payload: ChatMessage) => void;
  ERROR: (payload: { message: string }) => void;
};
