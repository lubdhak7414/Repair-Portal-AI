import express from "express";
import dotenv from "dotenv";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { getDb } from "./config/db.js";
import apiRoutes from "./routes/index.js";
import cors from "cors";
import { createMessage } from './models/message.model.js';
import { errorHandler } from './middleware/error-handler.js';

import { createServer } from 'http';
import { Server } from 'socket.io';

dotenv.config();
console.log("Loaded PORT from .env:", process.env.PORT);

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

// Socket.io Connection
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

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
    console.log('User disconnected:', socket.id);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
