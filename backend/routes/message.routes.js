// backend/routes/message.routes.js
import express from 'express';
import {
  sendMessage,
  getChatHistory,
  getUserConversationsWithDetails,
  markMessagesAsRead,
  deleteUserConversations,
  deleteConversation,
} from '../controllers/message.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { sendMessageSchema } from '../validators/message.validator.js';

const router = express.Router();

// All message routes require authentication
router.post('/', authenticate, validate(sendMessageSchema), sendMessage);
router.get('/:userId/conversations', authenticate, getUserConversationsWithDetails);
router.get('/:userId/:otherUserId', authenticate, getChatHistory);
router.put('/markRead/:userId/:otherUserId', authenticate, markMessagesAsRead);
router.delete('/:userId/conversations', authenticate, deleteUserConversations);
router.delete('/:userId/:otherUserId', authenticate, deleteConversation);

export default router;
