import dotenv from "dotenv";
import { createServer } from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import { createMessage } from './models/message.model.js';
import eventEmitter from './services/eventEmitter.js';

dotenv.config();

const PORT = process.env.PORT || 3000;
const corsOrigin = process.env.CORS_ORIGIN || "http://localhost:5173";

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: corsOrigin,
    methods: ['GET', 'POST']
  }
});

// Track user-to-socket mapping for notifications
const userSocketMap = new Map();

// Dev-only socket logging (silenced in production to avoid noisy logs)
const logSocket = (...args) => {
  if (process.env.NODE_ENV !== 'production') console.log(...args);
};

// Socket.io Connection
io.on('connection', (socket) => {
  logSocket('User connected:', socket.id);

  // Register user for targeted notifications (Phase 8)
  socket.on('registerUser', (userId) => {
    userSocketMap.set(String(userId), socket.id);
    logSocket(`User ${userId} registered with socket ${socket.id}`);
  });

  // Join conversation room
  socket.on('joinConversation', (conversationId) => {
    socket.join(conversationId);
    logSocket(`User joined conversation: ${conversationId}`);
  });

  // Send message
  socket.on('sendMessage', (messageData) => {
    try {
      const { conversationId, sender, receiver, content } = messageData;

      // Save to database using SQLite model
      const newMessage = createMessage({
        conversationId,
        sender,
        receiver,
        content,
        messageType: 'text',
      });

      // Emit to conversation room
      io.to(conversationId).emit('receiveMessage', newMessage);
    } catch (error) {
      console.error('Error saving message:', error);
    }
  });

  // Leave conversation
  socket.on('leaveConversation', (conversationId) => {
    socket.leave(conversationId);
  });

  socket.on('disconnect', () => {
    // Remove from user-socket mapping
    for (const [userId, socketId] of userSocketMap.entries()) {
      if (socketId === socket.id) {
        userSocketMap.delete(userId);
        break;
      }
    }
    logSocket('User disconnected:', socket.id);
  });
});

// Listen for booking status change events from controllers (Phase 8)
eventEmitter.on('bookingStatusChanged', ({ booking, userId, newStatus }) => {
  const targetSocketId = userSocketMap.get(String(userId));
  if (targetSocketId) {
    io.to(targetSocketId).emit('bookingNotification', {
      title: 'Booking Update',
      message: `Your booking #${booking.id} status changed to "${newStatus}"`,
      bookingId: booking.id,
      status: newStatus,
      timestamp: new Date().toISOString(),
    });
  }
});

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
