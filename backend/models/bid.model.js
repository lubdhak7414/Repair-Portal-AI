import { getDb } from '../config/db.js';

function rowToBid(row) {
  if (!row) return null;
  return {
    id: row.id,
    booking: row.booking_id,
    technician: row.technician_id,
    bidAmount: row.bid_amount,
    message: row.message,
    estimatedDuration: row.estimated_duration,
    status: row.status,
    acceptedAt: row.accepted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function createBid({ booking, technician, bidAmount, message, estimatedDuration }) {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO bids (booking_id, technician_id, bid_amount, message, estimated_duration)
    VALUES (?, ?, ?, ?, ?)
  `);
  const result = stmt.run(booking, technician, bidAmount, message || null, estimatedDuration || null);
  return getBidById(result.lastInsertRowid);
}

export function getBidById(id) {
  const db = getDb();
  return rowToBid(db.prepare('SELECT * FROM bids WHERE id = ?').get(id));
}

export function getBidsByBooking(bookingId, { status, sortBy, sortOrder = 'ASC' } = {}) {
  const db = getDb();
  let sql = 'SELECT * FROM bids WHERE booking_id = ?';
  const params = [bookingId];

  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }

  const sortColumns = { bidAmount: 'bid_amount', createdAt: 'created_at', estimatedDuration: 'estimated_duration' };
  const col = sortColumns[sortBy] || 'bid_amount';
  sql += ` ORDER BY ${col} ${sortOrder === 'DESC' ? 'DESC' : 'ASC'}`;

  return db.prepare(sql).all(...params).map(rowToBid);
}

export function getBidsByTechnician(technicianId, { status, page = 1, limit = 10 } = {}) {
  const db = getDb();
  let sql = 'SELECT * FROM bids WHERE technician_id = ?';
  const params = [technicianId];

  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }

  const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as total');
  const total = db.prepare(countSql).get(...params).total;

  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, (page - 1) * limit);

  const rows = db.prepare(sql).all(...params);
  return {
    bids: rows.map(rowToBid),
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
  };
}

export function getBidByBookingAndTechnician(bookingId, technicianId) {
  const db = getDb();
  return rowToBid(db.prepare('SELECT * FROM bids WHERE booking_id = ? AND technician_id = ?').get(bookingId, technicianId));
}

export function updateBid(id, fields) {
  const db = getDb();
  const fieldMap = {
    bidAmount: 'bid_amount',
    message: 'message',
    estimatedDuration: 'estimated_duration',
    status: 'status',
    acceptedAt: 'accepted_at',
  };
  const sets = [];
  const values = [];
  for (const [key, val] of Object.entries(fields)) {
    if (fieldMap[key]) {
      sets.push(`${fieldMap[key]} = ?`);
      values.push(val);
    }
  }
  if (sets.length === 0) return getBidById(id);
  sets.push("updated_at = datetime('now')");
  values.push(id);
  db.prepare(`UPDATE bids SET ${sets.join(', ')} WHERE id = ?`).run(...values);
  return getBidById(id);
}

export function updateBidsByBooking(bookingId, excludeBidId, fields) {
  const db = getDb();
  const fieldMap = {
    status: 'status',
  };
  const sets = [];
  const values = [];
  for (const [key, val] of Object.entries(fields)) {
    if (fieldMap[key]) {
      sets.push(`${fieldMap[key]} = ?`);
      values.push(val);
    }
  }
  if (sets.length === 0) return { changes: 0 };
  sets.push("updated_at = datetime('now')");
  let sql = `UPDATE bids SET ${sets.join(', ')} WHERE booking_id = ?`;
  const params = [...values, bookingId];
  if (excludeBidId) {
    sql += ' AND id != ?';
    params.push(excludeBidId);
  }
  const result = db.prepare(sql).run(...params);
  return { changes: result.changes };
}
