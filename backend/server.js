import express from "express";
import dotenv from "dotenv";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { getDb } from "./config/db.js";
import apiRoutes from "./routes/index.js";
import cors from "cors";
import { createMessage } from './models/message.model.js';
import { errorHandler } from './middleware/error-handler.js';
import eventEmitter from './services/eventEmitter.js';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

import { createServer } from 'http';
import { Server } from 'socket.io';

dotenv.config();
console.log("Loaded PORT from .env:", process.env.PORT);

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 3000;
const corsOrigin = process.env.CORS_ORIGIN || "http://localhost:5173";

// ---- Security Headers ----
app.use(helmet());

// ---- Rate Limiting ----
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' },
});
app.use(globalLimiter);

// Stricter limiter for AI diagnosis endpoint (5 req/min)
const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many diagnosis requests. Please wait before trying again.' },
});

// ---- CORS Configuration ----
const corsOptions = {
  origin: corsOrigin,
};

app.use(cors(corsOptions));

// Middleware — single express.json
app.use(express.json({ limit: '10mb' }));

// Serve uploaded files (invoices, warranties, booking images)
app.use('/uploads', express.static(join(__dirname, 'uploads')));

// Initialize DB
getDb();

// Apply AI rate limiter before the diagnosis route
app.use("/api/diagnosis", aiLimiter);

// API Routes — single mount point
app.use("/api", apiRoutes);

// Health check
app.get("/", (req, res) => {
  res.send("Server is up and running!");
});

// Error handler (must be last middleware, before server create)
app.use(errorHandler);

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: corsOrigin,
    methods: ['GET', 'POST']
  }
});

// Track user-to-socket mapping for notifications
const userSocketMap = new Map();

// Socket.io Connection
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Register user for targeted notifications (Phase 8)
  socket.on('registerUser', (userId) => {
    userSocketMap.set(String(userId), socket.id);
    console.log(`User ${userId} registered with socket ${socket.id}`);
  });

  // Join conversation room
  socket.on('joinConversation', (conversationId) => {
    socket.join(conversationId);
    console.log(`User joined conversation: ${conversationId}`);
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
    console.log('User disconnected:', socket.id);
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
