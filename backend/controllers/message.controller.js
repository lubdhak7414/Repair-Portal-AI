// backend/controllers/message.controller.js
import {
  createMessage,
  getConversationMessages,
  getUserConversations as getUserConversationsModel,
  getConversationsWithUnreadCount,
  markMessagesAsRead as markMessagesAsReadModel,
  deleteConversation as deleteConversationModel,
  deleteUserConversations as deleteUserConversationsModel,
} from '../models/message.model.js';
import { getUserById } from '../models/user.model.js';

// Send a message (from chat.controller.js)
export const sendMessage = async (req, res) => {
  try {
    const { sender, receiver, message, content, messageType, booking, conversationId } = req.body;

    // Owner check: sender must match authenticated user
    if (String(req.user.id) !== String(sender)) {
      return res.status(403).json({ message: 'Cannot send message as another user' });
    }

    const convId = conversationId || [sender, receiver].sort().join('-');

    const newMessage = createMessage({
      conversationId: convId,
      sender,
      receiver,
      content: message || content,
      messageType: messageType || 'text',
      bookingId: booking,
    });

    // Enrich with sender/receiver data
    const senderData = getUserById(newMessage.sender);
    const receiverData = getUserById(newMessage.receiver);
    newMessage.senderData = senderData
      ? { id: senderData.id, name: senderData.name, picture: senderData.picture, role: senderData.role }
      : null;
    newMessage.receiverData = receiverData
      ? { id: receiverData.id, name: receiverData.name, picture: receiverData.picture, role: receiverData.role }
      : null;

    res.status(201).json({
      message: 'Message sent successfully',
      chat: newMessage,
    });
  } catch (error) {
    console.error('Send Message Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Get chat history between two users (from chat.controller.js)
export const getChatHistory = async (req, res) => {
  try {
    const { userId, otherUserId } = req.params;

    // Participant check
    if (String(req.user.id) !== userId && String(req.user.id) !== otherUserId) {
      return res.status(403).json({ message: 'Not authorized to view this conversation' });
    }

    const { page = 1, limit = 50 } = req.query;

    const result = getConversationMessages(Number(userId), Number(otherUserId), {
      page: Number(page),
      limit: Number(limit),
    });

    // Enrich messages with sender/receiver data
    const enrichedMessages = result.messages.map((msg) => {
      const senderData = getUserById(msg.sender);
      const receiverData = getUserById(msg.receiver);
      msg.senderData = senderData
        ? { id: senderData.id, name: senderData.name, picture: senderData.picture, role: senderData.role }
        : null;
      msg.receiverData = receiverData
        ? { id: receiverData.id, name: receiverData.name, picture: receiverData.picture, role: receiverData.role }
        : null;
      return msg;
    });

    res.status(200).json({
      messages: enrichedMessages,
      currentPage: result.currentPage,
      hasMore: result.hasMore,
    });
  } catch (error) {
    console.error('Get Chat History Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Get user conversations list (from chat.controller.js)
export const getUserConversations = async (req, res) => {
  try {
    const { userId } = req.params;

    const conversations = getUserConversationsModel(Number(userId));

    // Enrich with other user data
    const enrichedConversations = conversations.map((conv) => {
      const otherUserData = getUserById(conv.otherUser);
      conv.otherUserData = otherUserData
        ? {
            id: otherUserData.id,
            name: otherUserData.name,
            picture: otherUserData.picture,
            role: otherUserData.role,
          }
        : null;
      return conv;
    });

    res.status(200).json(enrichedConversations);
  } catch (error) {
    console.error('Get Conversations Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Get conversations with unread count and details (from MessageRoutes.js)
export const getUserConversationsWithDetails = async (req, res) => {
  const { userId } = req.params;

  // Owner check
  if (String(req.user.id) !== userId) {
    return res.status(403).json({ message: 'Not authorized to view these conversations' });
  }

  if (!/^\d+$/.test(userId)) {
    return res.status(400).json({ message: 'Invalid user ID' });
  }

  try {
    const conversations = getConversationsWithUnreadCount(Number(userId));

    // Enrich with user data
    const populatedConversations = conversations.map((conv) => {
      const senderData = getUserById(conv.sender_id);
      const receiverData = getUserById(conv.receiver_id);
      const otherUserData = getUserById(conv.other_user_id);

      return {
        _id: conv.conversation_id,
        lastMessage: {
          content: conv.last_message,
          sender: senderData
            ? { id: senderData.id, name: senderData.name, picture: senderData.picture }
            : { id: conv.sender_id },
          receiver: receiverData
            ? { id: receiverData.id, name: receiverData.name, picture: receiverData.picture }
            : { id: conv.receiver_id },
          timestamp: conv.last_message_time,
          created_at: conv.last_message_time,
        },
        unreadCount: conv.unread_count,
        otherUser: otherUserData
          ? { id: otherUserData.id, name: otherUserData.name, picture: otherUserData.picture }
          : null,
      };
    });

    // Sort by last message time descending
    populatedConversations.sort(
      (a, b) => new Date(b.lastMessage.timestamp || 0) - new Date(a.lastMessage.timestamp || 0)
    );

    res.json(populatedConversations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Mark messages as read (from both sources)
export const markMessagesAsRead = async (req, res) => {
  try {
    const { userId, otherUserId } = req.params;

    // Owner check: must be the receiver
    if (String(req.user.id) !== userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    markMessagesAsReadModel(Number(userId), Number(otherUserId));
    res.status(200).json({ message: 'Messages marked as read', success: true });
  } catch (error) {
    console.error('Mark Messages Read Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Delete all conversations for a user (from MessageRoutes.js)
export const deleteUserConversations = async (req, res) => {
  const { userId } = req.params;

  // Owner check
  if (String(req.user.id) !== userId) {
    return res.status(403).json({ message: 'Not authorized' });
  }

  if (!/^\d+$/.test(userId)) {
    return res.status(400).json({ message: 'Invalid user ID' });
  }

  try {
    deleteUserConversationsModel(Number(userId));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete conversation between two users (from MessageRoutes.js)
export const deleteConversation = async (req, res) => {
  const { userId, otherUserId } = req.params;

  // Participant check
  if (String(req.user.id) !== userId && String(req.user.id) !== otherUserId) {
    return res.status(403).json({ message: 'Not authorized' });
  }

  if (!/^\d+$/.test(userId) || !/^\d+$/.test(otherUserId)) {
    return res.status(400).json({ message: 'Invalid user ID' });
  }

  try {
    deleteConversationModel(Number(userId), Number(otherUserId));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
