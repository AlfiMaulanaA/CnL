// Custom server: Next.js + Socket.io in a single process.
//
//   npm run dev       -> Next dev mode + live socket server
//   npm start         -> production (`npm run build` first)
//
// On Vercel the UI is deployed serverless and cannot host WebSockets, so the
// same socket server runs standalone instead — see realtime-server.js.
import { createServer } from 'http';
import next from 'next';
import { Server } from 'socket.io';
import { initSocketServer } from './src/server/socketServer.ts';

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOST || '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    handle(req, res);
  });

  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  initSocketServer(io);

  httpServer.listen(port, hostname, () => {
    console.log(`> Climb & Slide running on http://${hostname}:${port}`);
  });
});
