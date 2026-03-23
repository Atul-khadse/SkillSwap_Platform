// server.js (or your main file)
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');
const connectDB = require('./config/db');

// Route imports
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const exchangeRoutes = require('./routes/exchangeRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const pairRoutes = require('./routes/pairRoutes');
const ratingRoutes = require('./routes/ratingRoutes');

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);

// Middleware
// CORS Configuration - Fixed version
const allowedOrigins = [
  'http://localhost:5173',
  'https://skillswap-platform-frontend.onrender.com'
];

// Add environment variable if it exists
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked for origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));


// Add this after CORS middleware


app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// ✅ Use regex instead of string for wildcard




// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/exchange', exchangeRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/pairs', pairRoutes);
app.use('/api/ratings', ratingRoutes);

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Skill Swap API is running' });
});

// Initialize Socket.io with CORS
const io = socketIo(server, {
  cors: {
    origin:  allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Store active rooms and users
const rooms = new Map();

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Join a session room
  socket.on('join-room', ({ roomId, userId, userName }) => {
    socket.join(roomId);
    console.log(`User ${userName} (${userId}) joined room: ${roomId}`);
    
    // Store user in room
    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Map());
    }
    rooms.get(roomId).set(socket.id, { userId, userName });
    
    // Notify other users in the room
    socket.to(roomId).emit('user-joined', {
      userId,
      userName,
      socketId: socket.id
    });
    
    // Send list of current users in the room to the new user
    const usersInRoom = Array.from(rooms.get(roomId).values());
    socket.emit('room-users', usersInRoom);
  });

  // WebRTC signaling
  socket.on('signal', ({ roomId, data }) => {
    socket.to(roomId).emit('signal', data);
  });

  // Chat messages
  socket.on('send-message', (messageData) => {
    const { roomId, userId, userName, content, timestamp } = messageData;
    
    const message = {
      id: Date.now(),
      roomId,
      senderId: userId,
      senderName: userName,
      content,
      timestamp: timestamp || new Date().toISOString(),
      type: 'text'
    };
    
    // Broadcast message to all in the room
    io.to(roomId).emit('receive-message', message);
    
    // Optional: Save to database
    saveMessageToDB(message);
  });

  // Screen sharing status
  socket.on('screen-sharing', ({ roomId, userId, isSharing }) => {
    socket.to(roomId).emit('screen-sharing', { userId, isSharing });
  });

  // Typing indicator
  socket.on('typing', ({ roomId, userId, userName, isTyping }) => {
    socket.to(roomId).emit('typing', { userId, userName, isTyping });
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    
    // Remove from all rooms
    for (const [roomId, users] of rooms) {
      if (users.has(socket.id)) {
        const user = users.get(socket.id);
        socket.to(roomId).emit('user-left', {
          userId: user.userId,
          userName: user.userName
        });
        
        users.delete(socket.id);
        
        if (users.size === 0) {
          rooms.delete(roomId);
        }
        break;
      }
    }
  });

  // Error handling
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
});

// Function to save message to database (optional)
async function saveMessageToDB(message) {
  try {
    // You would save to your Message model here
    // Example: await Message.create(message);
  } catch (error) {
    console.error('Error saving message:', error);
  }
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});