// In-memory Socket.io game server (mirrors the Ludo architecture).
//
// - Rooms live in a Map keyed by a 5-letter code — no database.
// - The server owns the dice: clients only send ROLL_DICE actions.
// - Per-room timers handle bot turns, turn deadlines (auto-roll on timeout),
//   and disconnect grace (human -> bot takeover after 30s).
import type { Server, Socket } from 'socket.io';

import type {
  ChatMessage,
  ClientToServerEvents,
  RoomConfig,
  RoomPlayer,
  RoomState,
  ServerToClientEvents
} from '../types/room.ts';
import type { GameSettings, GameState, RollAction } from '../types/game.ts';
import type { PlayerType } from '../types/player.ts';
import {
  DEFAULT_SETTINGS,
  createGame,
  dispatch,
  getNextPlayerIndex,
  rematchGame,
  type GamePlayerInit
} from '../lib/game/engine.ts';
import { PLAYER_COLORS } from '../lib/game/players.ts';
import { botDelayMs, pickBotPreset } from '../lib/game/bot.ts';

type SocketData = {
  playerId?: string;
  roomId?: string;
  lastEmote?: number;
  lastChat?: number;
};

type IO = Server<ClientToServerEvents, ServerToClientEvents, Record<never, never>, SocketData>;
type Sock = Socket<ClientToServerEvents, ServerToClientEvents, Record<never, never>, SocketData>;
type Timer = ReturnType<typeof setTimeout>;

type RoomRecord = {
  state: RoomState;
  game: GameState | null;
  deadline: number | null;
  botTimer: Timer | null;
  turnTimer: Timer | null;
  graceTimers: Map<string, Timer>;
  sockets: Map<string, string>;
  /** Humans converted to bots after a grace period (can take control back on rejoin). */
  converted: Set<string>;
};

const GRACE_MS = 30_000;
const DISCARD_AFTER_MS = 30 * 60_000;
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const SETTINGS_KEYS: (keyof GameSettings)[] = [
  'exactFinish',
  'extraTurnOnSix',
  'maxExtraRolls',
  'turnTimer',
  'autoRollOnTimeout',
  'requireReady'
];

function chan(code: string): string {
  return `room:${code}`;
}

function makeCode(): string {
  let out = '';
  for (let i = 0; i < 5; i += 1) out += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  return out;
}

function makeId(prefix: string): string {
  const rand =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}_${rand}`;
}

function sanitizeName(raw: unknown): string {
  const t = String(raw ?? '')
    .replace(/[<>\n\r\t]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 15);
  return t || 'Guest';
}

function sanitizeAvatar(raw: unknown): string {
  const t = String(raw ?? '').trim();
  const m = t.match(/^(\p{Extended_Pictographic}(\uFE0F|\u200D\p{Extended_Pictographic})*)/u);
  return m?.[0] ?? '🐼';
}

function sanitizeChat(raw: unknown): string {
  return String(raw ?? '')
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 160);
}

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const n = typeof value === 'number' ? Math.round(value) : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

export function initSocketServer(ioIn: unknown): void {
  const io = ioIn as IO;
  const rooms = new Map<string, RoomRecord>();

  // ---- helpers -------------------------------------------------------------

  function emitRoomUpdate(room: RoomRecord): void {
    io.to(chan(room.state.code)).emit('ROOM_UPDATED', { roomState: room.state });
  }

  function fail(cb: unknown, error: string): void {
    (cb as ((res: { success: boolean; error?: string }) => void) | undefined)?.({ success: false, error });
  }

  function freeSeat(state: RoomState): number | null {
    for (let s = 0; s < state.config.maxPlayers; s += 1) {
      if (!state.players.some(p => p.seat === s)) return s;
    }
    return null;
  }

  function makePlayer(seat: number, name: string, avatar: string, type: PlayerType): RoomPlayer {
    return {
      id: makeId(type === 'bot' ? 'bot' : 'pl'),
      seat,
      name,
      avatar,
      color: PLAYER_COLORS[seat % PLAYER_COLORS.length]?.hex ?? '#8B5CF6',
      type,
      isReady: true,
      isConnected: true
    };
  }

  function attach(sock: Sock, room: RoomRecord, playerId: string): void {
    sock.data.playerId = playerId;
    sock.data.roomId = room.state.code;
    room.sockets.set(playerId, sock.id);
    void sock.join(chan(room.state.code));
  }

  function destroyRoom(room: RoomRecord): void {
    clearTurnTimers(room);
    for (const t of room.graceTimers.values()) clearTimeout(t);
    room.graceTimers.clear();
    rooms.delete(room.state.code);
  }

  function removePlayer(room: RoomRecord, player: RoomPlayer, reason: 'left' | 'kick'): void {
    const state = room.state;
    const socketId = room.sockets.get(player.id);
    room.sockets.delete(player.id);
    if (socketId) {
      const s = io.sockets.sockets.get(socketId);
      s?.leave(chan(state.code));
      if (s && s.data) {
        delete s.data.playerId;
        delete s.data.roomId;
      }
    }

    state.players = state.players.filter(p => p.id !== player.id);
    io.to(chan(state.code)).emit('PLAYER_LEFT', {
      playerId: player.id,
      name: player.name,
      reason,
      roomState: state
    });

    if (state.hostId === player.id) {
      const next = [...state.players].sort((a, b) => a.seat - b.seat)[0];
      state.hostId = next?.id ?? '';
    }
    emitRoomUpdate(room);
    if (state.players.length === 0) destroyRoom(room);
  }

  function convertToBot(room: RoomRecord, player: RoomPlayer): void {
    player.type = 'bot';
    player.botDifficulty = player.botDifficulty ?? 'medium';
    player.isConnected = false;
    room.converted.add(player.id);
    if (room.game) {
      const gp = room.game.players.find(p => p.id === player.id);
      if (gp) {
        gp.type = 'bot';
        gp.botDifficulty = gp.botDifficulty ?? 'medium';
        gp.isConnected = false;
      }
    }
  }

  function clearTurnTimers(room: RoomRecord): void {
    if (room.botTimer) {
      clearTimeout(room.botTimer);
      room.botTimer = null;
    }
    if (room.turnTimer) {
      clearTimeout(room.turnTimer);
      room.turnTimer = null;
    }
  }

  function scheduleTurn(room: RoomRecord): void {
    clearTurnTimers(room);
    const game = room.game;
    if (!game || game.status !== 'playing') return;
    const cur = game.players[game.currentPlayerIndex];
    if (!cur) return;

    const timerSec = room.state.config.turnTimer;
    room.deadline = timerSec > 0 ? Date.now() + timerSec * 1000 : null;
    io.to(chan(room.state.code)).emit('TURN_DEADLINE', { playerId: cur.id, deadline: room.deadline });

    if (cur.type === 'bot') {
      room.botTimer = setTimeout(() => {
        room.botTimer = null;
        if (room.game !== game || game.status !== 'playing') return;
        if (game.players[game.currentPlayerIndex]?.id !== cur.id) return;
        const res = dispatch(game, { playerId: cur.id });
        if (res.ok) finishTurn(room, res.action);
      }, botDelayMs(cur.botDifficulty));
      return;
    }

    if (room.deadline) {
      room.turnTimer = setTimeout(
        () => {
          room.turnTimer = null;
          if (room.game !== game || game.status !== 'playing') return;
          if (game.players[game.currentPlayerIndex]?.id !== cur.id) return;
          if (room.state.config.autoRollOnTimeout) {
            const res = dispatch(game, { playerId: cur.id });
            if (res.ok) {
              finishTurn(room, res.action);
              return;
            }
          }
          passTurn(room);
        },
        timerSec * 1000 + 1200 // small grace so the previous roll can animate
      );
    }
  }

  function finishTurn(room: RoomRecord, action: RollAction): void {
    clearTurnTimers(room);
    const game = room.game;
    if (!game) return;
    io.to(chan(room.state.code)).emit('GAME_UPDATED', { game, action });
    if (game.status === 'finished') {
      room.state.status = 'FINISHED';
      room.deadline = null;
      emitRoomUpdate(room);
      return;
    }
    scheduleTurn(room);
  }

  function passTurn(room: RoomRecord): void {
    const game = room.game;
    if (!game || game.status !== 'playing') return;
    clearTurnTimers(room);
    game.currentPlayerIndex = getNextPlayerIndex(game.currentPlayerIndex, game.players.length);
    game.consecutiveExtraRolls = 0;
    game.diceValue = null;
    game.lastAction = null;
    game.version += 1;
    io.to(chan(room.state.code)).emit('GAME_UPDATED', { game, action: null });
    scheduleTurn(room);
  }

  function pickSettings(config: RoomConfig): Partial<GameSettings> {
    const out: Record<string, boolean | number> = {};
    for (const k of SETTINGS_KEYS) {
      const v = config[k];
      if (typeof v === 'boolean' || typeof v === 'number') out[k] = v;
    }
    return out as Partial<GameSettings>;
  }

  function addBotToLobby(room: RoomRecord, difficulty?: string): RoomPlayer | null {
    const seat = freeSeat(room.state);
    if (seat === null) return null;
    const existing = room.state.players.filter(p => p.type === 'bot').length;
    const preset = pickBotPreset(existing);
    const bot = makePlayer(seat, preset.name, preset.avatar, 'bot');
    bot.botDifficulty =
      difficulty === 'easy' || difficulty === 'medium' || difficulty === 'hard' ? difficulty : preset.difficulty;
    room.state.players.push(bot);
    return bot;
  }

  function createRoom(
    sock: Sock,
    opts: { name: string; avatar: string; maxPlayers: number; fillWithBots: boolean; settings: Partial<GameSettings> }
  ): { room: RoomRecord; player: RoomPlayer } | null {
    let code = makeCode();
    while (rooms.has(code)) code = makeCode();

    const config: RoomConfig = {
      ...DEFAULT_SETTINGS,
      ...(opts.settings ?? {}),
      maxPlayers: clampInt(opts.maxPlayers, 2, 6, 4),
      fillWithBots: !!opts.fillWithBots
    };
    config.turnTimer = [0, 15, 30].includes(config.turnTimer) ? config.turnTimer : 30;

    const state: RoomState = {
      code,
      hostId: '',
      status: 'LOBBY',
      config,
      players: [],
      chat: [],
      createdAt: Date.now(),
      rematchVotes: []
    };
    const host = makePlayer(0, sanitizeName(opts.name), sanitizeAvatar(opts.avatar), 'human');
    state.players.push(host);
    state.hostId = host.id;

    const room: RoomRecord = {
      state,
      game: null,
      deadline: null,
      botTimer: null,
      turnTimer: null,
      graceTimers: new Map(),
      sockets: new Map(),
      converted: new Set()
    };
    rooms.set(code, room);
    attach(sock, room, host.id);
    return { room, player: host };
  }

  function leaveRoom(sock: Sock): void {
    const roomId = sock.data.roomId;
    const playerId = sock.data.playerId;
    if (!roomId || !playerId) return;
    const room = rooms.get(roomId);
    sock.leave(chan(roomId));
    delete sock.data.playerId;
    delete sock.data.roomId;
    if (!room) return;
    room.sockets.delete(playerId);
    const player = room.state.players.find(p => p.id === playerId);
    if (!player) return;

    player.isConnected = false;
    if (room.state.status === 'LOBBY') {
      removePlayer(room, player, 'left');
      return;
    }
    if (room.state.status === 'PLAYING') {
      // Deliberate leave mid-game -> bot takeover so the match keeps going.
      convertToBot(room, player);
      io.to(chan(roomId)).emit('PLAYER_LEFT', {
        playerId: player.id,
        name: player.name,
        reason: 'left',
        roomState: room.state
      });
      emitRoomUpdate(room);
      const cur = room.game?.players[room.game.currentPlayerIndex];
      if (cur?.id === player.id) scheduleTurn(room);
      return;
    }
    io.to(chan(roomId)).emit('PLAYER_LEFT', {
      playerId: player.id,
      name: player.name,
      reason: 'left',
      roomState: room.state
    });
    emitRoomUpdate(room);
    scheduleDiscard(room);
  }

  function scheduleDiscard(room: RoomRecord): void {
    const anyConnected = room.state.players.some(p => p.isConnected);
    if (anyConnected) return;
    setTimeout(() => {
      if (!rooms.has(room.state.code)) return;
      const stillEmpty = !room.state.players.some(p => p.isConnected);
      if (stillEmpty) destroyRoom(room);
    }, DISCARD_AFTER_MS);
  }

  function currentRoom(sock: Sock): RoomRecord | null {
    const roomId = sock.data.roomId;
    if (!roomId) return null;
    return rooms.get(roomId) ?? null;
  }

  function requireHost(room: RoomRecord, sock: Sock): boolean {
    return sock.data.playerId === room.state.hostId;
  }

  const dispatchErrors: Record<string, string> = {
    NOT_YOUR_TURN: "It's not your turn",
    GAME_OVER: 'The game is already over',
    ALREADY_ROLLED: 'Hold on — the dice are still moving'
  };

  // ---- event handlers ------------------------------------------------------

  io.on('connection', (sock: Sock) => {
    sock.on('CREATE_ROOM', (payload, cb) => {
      leaveRoom(sock);
      const created = createRoom(sock, {
        name: payload?.name ?? '',
        avatar: payload?.avatar ?? '',
        maxPlayers: payload?.maxPlayers ?? 4,
        fillWithBots: payload?.fillWithBots ?? false,
        settings: payload?.settings ?? {}
      });
      if (!created) {
        fail(cb, 'Could not create room');
        return;
      }
      cb?.({
        success: true,
        roomCode: created.room.state.code,
        playerId: created.player.id,
        roomState: created.room.state
      });
    });

    sock.on('JOIN_ROOM', (payload, cb) => {
      const code = String(payload?.code ?? '')
        .toUpperCase()
        .trim();
      const room = rooms.get(code);
      if (!room) {
        fail(cb, 'Room not found');
        return;
      }
      if (room.state.status !== 'LOBBY') {
        fail(cb, 'That game already started — try Rejoin');
        return;
      }
      if (room.state.players.length >= room.state.config.maxPlayers) {
        fail(cb, 'Room is full');
        return;
      }
      leaveRoom(sock);
      const seat = freeSeat(room.state);
      if (seat === null) {
        fail(cb, 'Room is full');
        return;
      }
      const player = makePlayer(seat, sanitizeName(payload?.name), sanitizeAvatar(payload?.avatar), 'human');
      room.state.players.push(player);
      attach(sock, room, player.id);
      io.to(chan(code)).emit('PLAYER_JOINED', { player, roomState: room.state });
      cb?.({ success: true, roomCode: code, playerId: player.id, roomState: room.state });
    });

    sock.on('QUICK_MATCH', (payload, cb) => {
      leaveRoom(sock);
      const open = [...rooms.values()].find(
        r => r.state.status === 'LOBBY' && r.state.players.length < r.state.config.maxPlayers
      );
      if (open) {
        const seat = freeSeat(open.state);
        if (seat !== null) {
          const player = makePlayer(seat, sanitizeName(payload?.name), sanitizeAvatar(payload?.avatar), 'human');
          open.state.players.push(player);
          attach(sock, open, player.id);
          io.to(chan(open.state.code)).emit('PLAYER_JOINED', { player, roomState: open.state });
          cb?.({
            success: true,
            roomCode: open.state.code,
            playerId: player.id,
            roomState: open.state
          });
          return;
        }
      }
      const created = createRoom(sock, {
        name: payload?.name ?? '',
        avatar: payload?.avatar ?? '',
        maxPlayers: 4,
        fillWithBots: true, // solo quick match can start immediately vs bots
        settings: {}
      });
      if (!created) {
        fail(cb, 'Could not start quick match');
        return;
      }
      cb?.({
        success: true,
        roomCode: created.room.state.code,
        playerId: created.player.id,
        roomState: created.room.state
      });
    });

    sock.on('REJOIN_ROOM', (payload, cb) => {
      const code = String(payload?.code ?? '')
        .toUpperCase()
        .trim();
      const room = rooms.get(code);
      const player = room?.state.players.find(p => p.id === payload?.playerId);
      if (!room || !player) {
        fail(cb, 'Room not found');
        return;
      }
      const grace = room.graceTimers.get(player.id);
      if (grace) {
        clearTimeout(grace);
        room.graceTimers.delete(player.id);
      }
      if (room.converted.delete(player.id)) {
        player.type = 'human';
        delete player.botDifficulty;
        if (room.game) {
          const gp = room.game.players.find(p => p.id === player.id);
          if (gp) {
            gp.type = 'human';
            delete gp.botDifficulty;
            gp.isConnected = true;
          }
        }
        const cur = room.game?.players[room.game.currentPlayerIndex];
        if (cur?.id === player.id) clearTurnTimers(room);
      }
      player.isConnected = true;
      attach(sock, room, player.id);
      io.to(chan(code)).emit('PLAYER_RECONNECTED', { playerId: player.id, roomState: room.state });
      if (room.deadline && room.game?.status === 'playing') {
        const cur = room.game.players[room.game.currentPlayerIndex];
        if (cur) sock.emit('TURN_DEADLINE', { playerId: cur.id, deadline: room.deadline });
      }
      if (player.type === 'human') {
        const cur = room.game?.players[room.game.currentPlayerIndex];
        if (room.game?.status === 'playing' && cur?.id === player.id) scheduleTurn(room);
      }
      cb?.({ success: true, roomState: room.state, game: room.game, playerId: player.id });
    });

    sock.on('UPDATE_NAME', (payload, cb) => {
      const room = currentRoom(sock);
      const player = room?.state.players.find(p => p.id === sock.data.playerId);
      if (!room || !player) return;
      player.name = sanitizeName(payload?.name);
      if (room.game) {
        const gp = room.game.players.find(p => p.id === player.id);
        if (gp) gp.name = player.name;
      }
      emitRoomUpdate(room);
      cb?.({ success: true, name: player.name });
    });

    sock.on('UPDATE_AVATAR', (payload, cb) => {
      const room = currentRoom(sock);
      const player = room?.state.players.find(p => p.id === sock.data.playerId);
      if (!room || !player) return;
      player.avatar = sanitizeAvatar(payload?.avatar);
      if (room.game) {
        const gp = room.game.players.find(p => p.id === player.id);
        if (gp) gp.avatar = player.avatar;
      }
      emitRoomUpdate(room);
      cb?.({ success: true, avatar: player.avatar });
    });

    sock.on('TOGGLE_READY', () => {
      const room = currentRoom(sock);
      const player = room?.state.players.find(p => p.id === sock.data.playerId);
      if (!room || !player || room.state.status !== 'LOBBY') return;
      player.isReady = !player.isReady;
      emitRoomUpdate(room);
    });

    sock.on('ADD_BOT', (payload, cb) => {
      const room = currentRoom(sock);
      if (!room) return fail(cb, 'Not in a room');
      if (!requireHost(room, sock)) return fail(cb, 'Only the host can add bots');
      if (room.state.status !== 'LOBBY') return fail(cb, 'Game already started');
      const bot = addBotToLobby(room, payload?.difficulty);
      if (!bot) return fail(cb, 'Room is full');
      emitRoomUpdate(room);
      cb?.({ success: true });
    });

    sock.on('REMOVE_BOT', (payload, cb) => {
      const room = currentRoom(sock);
      if (!room) return fail(cb, 'Not in a room');
      if (!requireHost(room, sock)) return fail(cb, 'Only the host manages the room');
      if (room.state.status !== 'LOBBY') return fail(cb, 'Game already started');
      const target = room.state.players.find(p => p.id === payload?.playerId);
      if (!target || target.type !== 'bot') return fail(cb, 'Bot not found');
      removePlayer(room, target, 'kick');
      cb?.({ success: true });
    });

    sock.on('KICK_PLAYER', (payload, cb) => {
      const room = currentRoom(sock);
      if (!room) return fail(cb, 'Not in a room');
      if (!requireHost(room, sock)) return fail(cb, 'Only the host can kick players');
      if (room.state.status !== 'LOBBY') return fail(cb, 'Game already started');
      const target = room.state.players.find(p => p.id === payload?.playerId);
      if (!target || target.type !== 'human') return fail(cb, 'Player not found');
      if (target.id === room.state.hostId) return fail(cb, 'You cannot kick yourself');
      const socketId = room.sockets.get(target.id);
      if (socketId) {
        const s = io.sockets.sockets.get(socketId);
        s?.emit('ERROR', { message: 'You were removed from the room' });
      }
      removePlayer(room, target, 'kick');
      cb?.({ success: true });
    });

    sock.on('UPDATE_SETTINGS', (payload, cb) => {
      const room = currentRoom(sock);
      if (!room) return fail(cb, 'Not in a room');
      if (!requireHost(room, sock)) return fail(cb, 'Only the host can change settings');
      if (room.state.status !== 'LOBBY') return fail(cb, 'Game already started');
      const incoming = payload?.settings ?? {};
      const cfg = room.state.config as Record<string, boolean | number>;
      for (const key of SETTINGS_KEYS) {
        if (key in incoming) {
          const v = incoming[key];
          if (typeof v === 'boolean' || typeof v === 'number') cfg[key] = v;
        }
      }
      room.state.config.turnTimer = [0, 15, 30].includes(room.state.config.turnTimer)
        ? room.state.config.turnTimer
        : 30;
      room.state.config.maxExtraRolls = clampInt(room.state.config.maxExtraRolls, 1, 5, 3);
      emitRoomUpdate(room);
      cb?.({ success: true });
    });

    sock.on('START_GAME', (_payload, cb) => {
      const room = currentRoom(sock);
      if (!room) return fail(cb, 'Not in a room');
      if (!requireHost(room, sock)) return fail(cb, 'Only the host can start the game');
      if (room.state.status !== 'LOBBY') return fail(cb, 'Game already started');

      if (room.state.config.fillWithBots) {
        while (room.state.players.length < room.state.config.maxPlayers) {
          if (!addBotToLobby(room)) break;
        }
      }

      const players = [...room.state.players].sort((a, b) => a.seat - b.seat);
      if (players.length < 2) return fail(cb, 'Need at least 2 players');
      if (room.state.config.requireReady && players.some(p => !p.isReady)) {
        return fail(cb, 'Waiting for players to be ready');
      }

      const inits: GamePlayerInit[] = players.map(p => ({
        id: p.id,
        name: p.name,
        avatar: p.avatar,
        color: p.color,
        type: p.type,
        ...(p.botDifficulty ? { botDifficulty: p.botDifficulty } : {}),
        isConnected: p.isConnected
      }));

      room.game = createGame(inits, pickSettings(room.state.config));
      room.state.status = 'PLAYING';
      room.state.rematchVotes = [];
      io.to(chan(room.state.code)).emit('GAME_STARTED', { game: room.game });
      emitRoomUpdate(room);
      scheduleTurn(room);
      cb?.({ success: true });
    });

    sock.on('ROLL_DICE', () => {
      const room = currentRoom(sock);
      const game = room?.game;
      if (!room || !game) return;
      if (game.status !== 'playing') return;
      const cur = game.players[game.currentPlayerIndex];
      if (!cur) return;
      if (cur.type === 'bot') return; // bots roll on the server clock
      if (cur.id !== sock.data.playerId) {
        sock.emit('ERROR', { message: "It's not your turn" });
        return;
      }
      const res = dispatch(game, { playerId: cur.id });
      if (!res.ok) {
        sock.emit('ERROR', { message: dispatchErrors[res.error] ?? 'Cannot roll right now' });
        return;
      }
      finishTurn(room, res.action);
    });

    sock.on('VOTE_REMATCH', () => {
      const room = currentRoom(sock);
      if (!room || room.state.status !== 'FINISHED' || !room.game) return;
      const pid = sock.data.playerId;
      if (!pid || !room.state.players.some(p => p.id === pid)) return;
      if (!room.state.rematchVotes.includes(pid)) room.state.rematchVotes.push(pid);

      const needed = room.state.players.filter(p => p.type === 'human' && p.isConnected);
      const ready = needed.length > 0 && needed.every(p => room.state.rematchVotes.includes(p.id));
      if (ready) {
        room.game = rematchGame(room.game);
        room.state.status = 'PLAYING';
        room.state.rematchVotes = [];
        io.to(chan(room.state.code)).emit('GAME_STARTED', { game: room.game });
        io.to(chan(room.state.code)).emit('REMATCH_STATUS', { votes: [], total: needed.length });
        emitRoomUpdate(room);
        scheduleTurn(room);
        return;
      }
      io.to(chan(room.state.code)).emit('REMATCH_STATUS', {
        votes: [...room.state.rematchVotes],
        total: needed.length
      });
    });

    sock.on('SEND_EMOTE', payload => {
      const room = currentRoom(sock);
      const player = room?.state.players.find(p => p.id === sock.data.playerId);
      if (!room || !player) return;
      const now = Date.now();
      if (sock.data.lastEmote && now - sock.data.lastEmote < 800) return;
      sock.data.lastEmote = now;
      const emote = String(payload?.emote ?? '')
        .replace(/[<>]/g, '')
        .trim()
        .slice(0, 12);
      if (!emote) return;
      io.to(chan(room.state.code)).emit('EMOTE_RECEIVED', {
        playerId: player.id,
        playerName: player.name,
        emote
      });
    });

    sock.on('SEND_CHAT', payload => {
      const room = currentRoom(sock);
      const player = room?.state.players.find(p => p.id === sock.data.playerId);
      if (!room || !player) return;
      const now = Date.now();
      if (sock.data.lastChat && now - sock.data.lastChat < 500) return;
      sock.data.lastChat = now;
      const text = sanitizeChat(payload?.text);
      if (!text) return;
      const msg: ChatMessage = {
        id: `c${now.toString(36)}${Math.random().toString(36).slice(2, 6)}`,
        senderId: player.id,
        sender: player.name,
        color: player.color,
        text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      room.state.chat.push(msg);
      if (room.state.chat.length > 50) room.state.chat.shift();
      io.to(chan(room.state.code)).emit('CHAT_RECEIVED', msg);
    });

    sock.on('LEAVE_ROOM', () => {
      leaveRoom(sock);
    });

    sock.on('disconnect', () => {
      const roomId = sock.data.roomId;
      const playerId = sock.data.playerId;
      if (!roomId || !playerId) return;
      const room = rooms.get(roomId);
      if (!room) return;
      room.sockets.delete(playerId);
      const player = room.state.players.find(p => p.id === playerId);
      if (!player || !player.isConnected) return;
      player.isConnected = false;

      if (room.state.status === 'LOBBY') {
        removePlayer(room, player, 'left');
        return;
      }
      emitRoomUpdate(room);

      if (room.state.status === 'PLAYING') {
        const grace = setTimeout(() => {
          room.graceTimers.delete(playerId);
          const pp = room.state.players.find(x => x.id === playerId);
          if (!pp || pp.isConnected) return;
          convertToBot(room, pp);
          io.to(chan(roomId)).emit('PLAYER_LEFT', {
            playerId,
            name: pp.name,
            reason: 'AFK',
            roomState: room.state
          });
          emitRoomUpdate(room);
          const cur = room.game?.players[room.game.currentPlayerIndex];
          if (cur?.id === playerId) scheduleTurn(room);
        }, GRACE_MS);
        room.graceTimers.set(playerId, grace);
        return;
      }

      io.to(chan(roomId)).emit('PLAYER_LEFT', {
        playerId,
        name: player.name,
        reason: 'left',
        roomState: room.state
      });
      scheduleDiscard(room);
    });
  });

  console.warn(`[climb-slide] socket server ready (rooms in-memory)`);
}
