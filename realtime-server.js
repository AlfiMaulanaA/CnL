// Standalone realtime (Socket.io) server — deploy this on a host that supports
// long-lived WebSocket connections (Render, Railway, Fly.io, a VPS...).
// Vercel serves only the Next.js UI, pointed here via NEXT_PUBLIC_SOCKET_URL.
//
// Env:
//   PORT         port to listen on (default 4000)
//   CORS_ORIGIN  comma-separated allowed origins (default *)
import { createServer } from 'http';
import { Server } from 'socket.io';
import { initSocketServer } from './src/server/socketServer.ts';

const port = parseInt(process.env.PORT || '4000', 10);
const origins = (process.env.CORS_ORIGIN || '*').split(',').map(s => s.trim()).filter(Boolean);

const httpServer = createServer((req, res) => {
  if (req.url === '/health' || req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, service: 'climb-and-slide-realtime' }));
    return;
  }
  res.writeHead(404);
  res.end();
});

const io = new Server(httpServer, {
  cors: { origin: origins.includes('*') ? '*' : origins, methods: ['GET', 'POST'] }
});

initSocketServer(io);

httpServer.listen(port, '0.0.0.0', () => {
  console.log(`> Climb & Slide realtime server on :${port} (CORS: ${origins.join(', ')})`);
});
