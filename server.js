const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3000;
// when using middleware `hostname` and `port` must be provided below
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      // Be sure to pass `true` as the second argument to `url.parse`.
      // This tells it to parse the query portion of the URL.
      const parsedUrl = parse(req.url, true);
      const { pathname, query } = parsedUrl;

      if (pathname === '/a') {
        await app.render(req, res, '/a', query);
      } else if (pathname === '/b') {
        await app.render(req, res, '/b', query);
      } else {
        await handle(req, res, parsedUrl);
      }
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  const io = new Server(httpServer);

  // Room management
  // roomID -> { sente: { id, name }, gote: { id, name } }
  const rooms = new Map();

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Join game with random matchmaking
    socket.on('join_game', ({ playerName }) => {
      // Find a room with 1 player or create new
      let joined = false;
      for (const [roomId, room] of rooms) {
        if (!room.gote) {
          room.gote = { id: socket.id, name: playerName };
          socket.join(roomId);
          socket.emit('game_start', {
            role: 'gote',
            roomId,
            opponentName: room.sente.name
          });
          io.to(room.sente.id).emit('opponent_joined', {
            opponentName: playerName
          });
          joined = true;
          console.log(`Room ${roomId} full. Game started. ${room.sente.name} vs ${playerName}`);
          break;
        }
      }

      if (!joined) {
        const roomId = Math.random().toString(36).substring(7);
        rooms.set(roomId, {
          sente: { id: socket.id, name: playerName },
          gote: null
        });
        socket.join(roomId);
        socket.emit('waiting', { role: 'sente', roomId });
        console.log(`Created room ${roomId}, ${playerName} waiting for opponent.`);
      }
    });

    // Join game with specific room ID
    socket.on('join_room', ({ roomId, playerName }) => {
      const room = rooms.get(roomId);

      if (!room) {
        // Create new room with specified ID
        rooms.set(roomId, {
          sente: { id: socket.id, name: playerName },
          gote: null
        });
        socket.join(roomId);
        socket.emit('waiting', { role: 'sente', roomId });
        console.log(`Created room ${roomId}, ${playerName} waiting for opponent.`);
      } else if (!room.gote) {
        // Join existing room as gote
        room.gote = { id: socket.id, name: playerName };
        socket.join(roomId);
        socket.emit('game_start', {
          role: 'gote',
          roomId,
          opponentName: room.sente.name
        });
        io.to(room.sente.id).emit('opponent_joined', {
          opponentName: playerName
        });
        console.log(`Room ${roomId} full. Game started. ${room.sente.name} vs ${playerName}`);
      } else {
        // Room is full
        socket.emit('room_full', { roomId });
        console.log(`Room ${roomId} is full. ${playerName} cannot join.`);
      }
    });

    socket.on('move', ({ roomId, move }) => {
      // Relay move to opponent
      socket.to(roomId).emit('opponent_move', move);
    });

    socket.on('drop', ({ roomId, drop }) => {
      console.log(`Drop received in room ${roomId}:`, drop);
      // Relay drop to opponent
      socket.to(roomId).emit('opponent_drop', drop);
      console.log(`Drop relayed to opponent in room ${roomId}`);
    });

    socket.on('game_over', ({ roomId, winner }) => {
      io.to(roomId).emit('game_over', { winner });
    });

    // Chat functionality
    socket.on('chat_message', ({ roomId, message }) => {
      const room = rooms.get(roomId);
      if (room) {
        const senderName = room.sente.id === socket.id ? room.sente.name : room.gote?.name || 'Unknown';
        io.to(roomId).emit('chat_message', {
          id: `${socket.id}-${Date.now()}`,
          sender: senderName,
          text: message,
          timestamp: Date.now()
        });
      }
    });

    socket.on('request_undo', ({ roomId }) => {
      socket.to(roomId).emit('undo_request', { requester: socket.id });
    });

    socket.on('respond_undo', ({ roomId, allow }) => {
      if (allow) {
        io.in(roomId).emit('undo_executed');
      } else {
        socket.to(roomId).emit('undo_denied');
      }
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      // Cleanup rooms logic
      for (const [roomId, room] of rooms) {
        if (room.sente.id === socket.id || room.gote?.id === socket.id) {
          io.to(roomId).emit('opponent_disconnected');
          rooms.delete(roomId);
        }
      }
    });
  });

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
