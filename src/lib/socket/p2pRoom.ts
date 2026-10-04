import Peer, { DataConnection } from 'peerjs';

class P2PRoomManager {
  private peer: Peer | null = null;
  private connections: Map<string, DataConnection> = new Map();
  private hostConnection: DataConnection | null = null;
  public isHost: boolean = false;
  public roomCode: string | null = null;
  private listeners: Map<string, Array<(data: any) => void>> = new Map();
  public myId: string | null = null;

  on(event: string, callback: (data: any) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback?: (data: any) => void) {
    if (!this.listeners.has(event)) return;
    if (!callback) {
      this.listeners.delete(event);
      return;
    }
    const list = this.listeners.get(event)!.filter(cb => cb !== callback);
    this.listeners.set(event, list);
  }

  emit(event: string, data: any) {
    const list = this.listeners.get(event);
    if (list) {
      list.forEach(cb => cb(data));
    }
  }

  createRoom({ roomId }: { roomId: string; name?: string; avatar?: string }, cb?: (res: any) => void) {
    const code = roomId.toUpperCase().trim();
    this.roomCode = code;
    this.isHost = true;
    this.myId = 'host_' + Date.now();

    const peerId = `cnl_room_${code}`;

    if (this.peer) this.peer.destroy();

    this.peer = new Peer(peerId, {
      debug: 1,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478' }
        ]
      }
    });

    this.peer.on('open', () => {
      this.emit('connect', { id: this.myId });
      cb?.({ success: true, roomCode: code, playerId: this.myId });
    });

    this.peer.on('connection', conn => {
      const connId = conn.peer;
      this.connections.set(connId, conn);

      conn.on('data', data => {
        this.emit('PEER_DATA', { conn, data });
      });

      conn.on('close', () => {
        this.connections.delete(connId);
        this.emit('PEER_DISCONNECTED', { connId });
      });
    });

    this.peer.on('error', err => {
      if (err.type === 'unavailable-id') {
        cb?.({ success: true, roomCode: code, playerId: this.myId });
      } else {
        cb?.({ success: false, error: err.message });
      }
    });
  }

  joinRoom({ roomId, name, avatar }: { roomId: string; name: string; avatar: string }, cb?: (res: any) => void) {
    const code = roomId.toUpperCase().trim();
    this.roomCode = code;
    this.isHost = false;
    this.myId = 'guest_' + Date.now();

    const hostPeerId = `cnl_room_${code}`;

    if (this.peer) this.peer.destroy();

    this.peer = new Peer({
      debug: 1,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478' }
        ]
      }
    });

    this.peer.on('open', () => {
      const conn = this.peer!.connect(hostPeerId, { reliable: true });
      this.hostConnection = conn;

      conn.on('open', () => {
        conn.send({
          type: 'JOIN_ROOM',
          payload: { name, avatar, socketId: this.myId }
        });
        this.emit('connect', { id: this.myId });
        cb?.({ success: true, roomCode: code, playerId: this.myId });
      });

      conn.on('data', data => {
        this.emit('PEER_DATA', { data });
      });

      conn.on('close', () => {
        this.emit('PEER_DISCONNECTED', { host: true });
      });

      conn.on('error', err => {
        cb?.({ success: false, error: 'Gagal terhubung ke host room ' + code + ': ' + (err?.message || 'error') });
      });
    });

    this.peer.on('error', err => {
      cb?.({ success: false, error: 'Ruangan ' + code + ' tidak ditemukan atau host offline: ' + (err?.message || 'error') });
    });
  }

  broadcast(type: string, payload: any) {
    const msg = { type, payload };
    for (const conn of this.connections.values()) {
      if (conn.open) {
        conn.send(msg);
      }
    }
    if (this.hostConnection && this.hostConnection.open) {
      this.hostConnection.send(msg);
    }
  }

  disconnect() {
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
    this.connections.clear();
    this.hostConnection = null;
  }
}

export const p2pManager = new P2PRoomManager();
