import { getDb } from '../config/db.js';

export function createMessage({ conversationId, sender, receiver, content, messageType, bookingId }) {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO messages (conversation_id, sender_id, receiver_id, content, message_type, booking_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    conversationId, sender, receiver, content,
    messageType || 'text',
    bookingId || null
  );
  return getMessageById(result.lastInsertRowid);
}

export function getMessageById(id) {
  const db = getDb();
  const row = db.prepare('SELECT * FROM messages WHERE id = ?').get(id);
  if (!row) return null;
  return rowToMessage(row);
}

function rowToMessage(row) {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    sender: row.sender_id,
    receiver: row.receiver_id,
    content: row.content,
    messageType: row.message_type,
    booking: row.booking_id,
    isRead: !!row.is_read,
    readAt: row.read_at,
    createdAt: row.created_at,
  };
}

export function getConversationMessages(userId, otherUserId, { page = 1, limit = 50 } = {}) {
  const db = getDb();
  const params = [userId, otherUserId, otherUserId, userId];
  const countSql = `
    SELECT COUNT(*) as total FROM messages
    WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
  `;
  const total = db.prepare(countSql).get(...params).total;

  const sql = `
    SELECT * FROM messages
    WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
    ORDER BY created_at DESC LIMIT ? OFFSET ?
  `;
  const dataParams = [...params, limit, (page - 1) * limit];
  const rows = db.prepare(sql).all(...dataParams).reverse();

  return {
    messages: rows.map(rowToMessage),
    total,
    currentPage: page,
    hasMore: rows.length === limit,
  };
}

export function getUserConversations(userId) {
  const db = getDb();
  const rows = db.prepare(`
    SELECT
      m.*,
      CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END AS other_user_id
    FROM messages m
    INNER JOIN (
      SELECT
        CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END AS other_user,
        MAX(created_at) as max_time
      FROM messages
      WHERE sender_id = ? OR receiver_id = ?
      GROUP BY other_user
    ) latest ON m.created_at = latest.max_time
      AND ((m.sender_id = ? AND m.receiver_id = latest.other_user)
        OR (m.receiver_id = ? AND m.sender_id = latest.other_user))
    ORDER BY m.created_at DESC
  `).all(userId, userId, userId, userId, userId, userId);

  return rows.map(row => ({
    otherUser: row.other_user_id,
    lastMessage: row.content,
    lastMessageTime: row.created_at,
    messageType: row.message_type,
    isRead: !!row.is_read,
  }));
}

export function getConversationByConversationId(conversationId) {
  const db = getDb();
  return db.prepare('SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC').all(conversationId).map(rowToMessage);
}

export function markMessagesAsRead(userId, otherUserId) {
  const db = getDb();
  const result = db.prepare(`
    UPDATE messages SET is_read = 1, read_at = datetime('now')
    WHERE sender_id = ? AND receiver_id = ? AND is_read = 0
  `).run(otherUserId, userId);
  return { changes: result.changes };
}

export function deleteConversation(userId, otherUserId) {
  const db = getDb();
  const result = db.prepare(`
    DELETE FROM messages
    WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
  `).run(userId, otherUserId, otherUserId, userId);
  return { changes: result.changes };
}

export function deleteUserConversations(userId) {
  const db = getDb();
  const result = db.prepare(`
    DELETE FROM messages WHERE sender_id = ? OR receiver_id = ?
  `).run(userId, userId);
  return { changes: result.changes };
}

export function getConversationsWithUnreadCount(userId) {
  const db = getDb();
  // Get unique conversation partners with last message and unread count
  const rows = db.prepare(`
    SELECT
      CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END AS other_user_id,
      m.conversation_id,
      m.content as last_message,
      m.created_at as last_message_time,
      m.sender_id,
      m.receiver_id,
      (
        SELECT COUNT(*) FROM messages m2
        WHERE m2.sender_id = CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END
          AND m2.receiver_id = ?
          AND m2.is_read = 0
      ) as unread_count
    FROM messages m
    INNER JOIN (
      SELECT
        CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END AS other_user,
        MAX(created_at) as max_time
      FROM messages
      WHERE sender_id = ? OR receiver_id = ?
      GROUP BY other_user
    ) latest ON m.created_at = latest.max_time
      AND ((m.sender_id = ? AND m.receiver_id = latest.other_user)
        OR (m.receiver_id = ? AND m.sender_id = latest.other_user))
    ORDER BY m.created_at DESC
  `).all(userId, userId, userId, userId, userId, userId, userId, userId);

  return rows;
}
