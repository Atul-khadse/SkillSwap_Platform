// socket.js
const socketIO = require('socket.io');

const initializeSocket = (server) => {
  const io = socketIO(server, {
    cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST"]
    }
  });

  const rooms = new Map();

  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // Join room
    socket.on('join-room', (roomId) => {
      socket.join(roomId);
      console.log(`Socket ${socket.id} joined room ${roomId}`);
      
      // Add user to room
      if (!rooms.has(roomId)) {
        rooms.set(roomId, new Set());
      }
      rooms.get(roomId).add(socket.id);
      
      // Notify other users in room
      socket.to(roomId).emit('user-joined', socket.id);
    });

    // WebRTC signaling
    socket.on('signal', ({ roomId, data }) => {
      socket.to(roomId).emit('signal', data);
    });

    // Chat messages
    socket.on('send-message', (messageData) => {
      // Broadcast message to room
      io.to(messageData.roomId).emit('receive-message', {
        ...messageData,
        id: Date.now(),
        sender: messageData.senderName === socket.handshake.query.userId ? 'You' : messageData.senderName
      });
    });

    // Screen sharing
    socket.on('screen-share', ({ roomId, streamId }) => {
      socket.to(roomId).emit('screen-share', { streamId });
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      
      // Remove from rooms and notify others
      for (const [roomId, users] of rooms) {
        if (users.has(socket.id)) {
          users.delete(socket.id);
          socket.to(roomId).emit('user-left', socket.id);
          
          if (users.size === 0) {
            rooms.delete(roomId);
          }
          break;
        }
      }
    });
  });

  return io;
};

module.exports = initializeSocket;