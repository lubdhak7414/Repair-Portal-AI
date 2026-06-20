import { getDb } from '../config/db.js';

function rowToBooking(row) {
  if (!row) return null;
  return {
    id: row.id,
    user: row.user_id,
    technician: row.technician_id,
    service: row.service_id,
    description: row.description,
    images: [], // populated separately
    preferredDate: row.preferred_date,
    preferredTime: row.preferred_time,
    urgency: row.urgency,
    status: row.status,
    address: row.address,
    estimatedCost: row.estimated_cost,
    finalCost: row.final_cost,
    completedAt: row.completed_at,
    cancelledAt: row.cancelled_at,
    cancellationReason: row.cancellation_reason,
    isBidding: !!row.is_bidding,
    biddingDeadline: row.bidding_deadline,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function getBookingImages(bookingId) {
  const db = getDb();
  return db.prepare('SELECT image_url FROM booking_images WHERE booking_id = ?').all(bookingId).map(r => r.image_url);
}

export function createBooking(data) {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO bookings (user_id, technician_id, service_id, description, preferred_date, preferred_time, urgency, status, address, estimated_cost, is_bidding, bidding_deadline)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    data.user, data.technician || null, data.service, data.description,
    data.preferredDate, data.preferredTime,
    data.urgency || 'medium',
    data.status || 'pending',
    data.address || null,
    data.estimatedCost || null,
    data.isBidding ? 1 : 0,
    data.biddingDeadline || null
  );

  if (data.images && Array.isArray(data.images)) {
    const imgStmt = db.prepare('INSERT INTO booking_images (booking_id, image_url) VALUES (?, ?)');
    for (const img of data.images) {
      imgStmt.run(result.lastInsertRowid, img);
    }
  }

  return getBookingById(result.lastInsertRowid);
}

export function getBookingById(id) {
  const db = getDb();
  const row = db.prepare('SELECT * FROM bookings WHERE id = ?').get(id);
  if (!row) return null;
  const booking = rowToBooking(row);
  booking.images = getBookingImages(id);
  return booking;
}

export function getAllBookings({ status, userId, technicianId, serviceId, isBidding, page, limit, excludeStatuses } = {}) {
  const db = getDb();
  let sql = 'SELECT * FROM bookings WHERE 1=1';
  const params = [];

  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }
  if (userId) {
    sql += ' AND user_id = ?';
    params.push(userId);
  }
  if (technicianId) {
    sql += ' AND technician_id = ?';
    params.push(technicianId);
  }
  if (serviceId) {
    sql += ' AND service_id = ?';
    params.push(serviceId);
  }
  if (isBidding !== undefined) {
    sql += ' AND is_bidding = ?';
    params.push(isBidding ? 1 : 0);
  }
  if (excludeStatuses && Array.isArray(excludeStatuses)) {
    sql += ` AND status NOT IN (${excludeStatuses.map(() => '?').join(',')})`;
    params.push(...excludeStatuses);
  }

  if (page && limit) {
    const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as total');
    const total = db.prepare(countSql).get(...params).total;
    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, (page - 1) * limit);
    const rows = db.prepare(sql).all(...params);
    return {
      bookings: rows.map(rowToBooking).map(b => { b.images = getBookingImages(b.id); return b; }),
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    };
  }

  sql += ' ORDER BY created_at DESC';
  const rows = db.prepare(sql).all(...params);
  return rows.map(rowToBooking).map(b => { b.images = getBookingImages(b.id); return b; });
}

export function updateBooking(id, fields) {
  const db = getDb();
  const fieldMap = {
    technician: 'technician_id',
    service: 'service_id',
    description: 'description',
    preferredDate: 'preferred_date',
    preferredTime: 'preferred_time',
    urgency: 'urgency',
    status: 'status',
    address: 'address',
    estimatedCost: 'estimated_cost',
    finalCost: 'final_cost',
    completedAt: 'completed_at',
    cancelledAt: 'cancelled_at',
    cancellationReason: 'cancellation_reason',
    isBidding: 'is_bidding',
    biddingDeadline: 'bidding_deadline',
  };
  const sets = [];
  const values = [];
  for (const [key, val] of Object.entries(fields)) {
    if (fieldMap[key]) {
      sets.push(`${fieldMap[key]} = ?`);
      values.push(val);
    }
  }
  if (sets.length === 0) return getBookingById(id);
  sets.push("updated_at = datetime('now')");
  values.push(id);
  db.prepare(`UPDATE bookings SET ${sets.join(', ')} WHERE id = ?`).run(...values);

  if (fields.images && Array.isArray(fields.images)) {
    db.prepare('DELETE FROM booking_images WHERE booking_id = ?').run(id);
    const imgStmt = db.prepare('INSERT INTO booking_images (booking_id, image_url) VALUES (?, ?)');
    for (const img of fields.images) {
      imgStmt.run(id, img);
    }
  }

  return getBookingById(id);
}

export function updateManyBookings(ids, fields) {
  const db = getDb();
  const fieldMap = {
    status: 'status',
    cancellationReason: 'cancellation_reason',
    cancelledAt: 'cancelled_at',
  };
  const sets = [];
  const values = [];
  for (const [key, val] of Object.entries(fields)) {
    if (fieldMap[key]) {
      sets.push(`${fieldMap[key]} = ?`);
      values.push(val);
    }
  }
  if (sets.length === 0 || !ids || ids.length === 0) return { changes: 0 };
  sets.push("updated_at = datetime('now')");
  const placeholders = ids.map(() => '?');
  const sql = `UPDATE bookings SET ${sets.join(', ')} WHERE id IN (${placeholders.join(',')})`;
  const result = db.prepare(sql).run(...values, ...ids);
  return { changes: result.changes };
}

export function deleteBooking(id) {
  const db = getDb();
  db.prepare('DELETE FROM booking_images WHERE booking_id = ?').run(id);
  return db.prepare('DELETE FROM bookings WHERE id = ?').run(id);
}

export function getBookingsForTechnician(technicianId, statusFilter) {
  const db = getDb();
  let sql = 'SELECT * FROM bookings WHERE technician_id = ?';
  const params = [technicianId];
  if (statusFilter) {
    sql += ' AND status = ?';
    params.push(statusFilter);
  }
  sql += ' ORDER BY created_at DESC';
  const rows = db.prepare(sql).all(...params);
  return rows.map(rowToBooking).map(b => { b.images = getBookingImages(b.id); return b; });
}

export function getPendingBookingsForTechnicianServices(technicianId) {
  const db = getDb();
  const rows = db.prepare(`
    SELECT b.* FROM bookings b
    INNER JOIN technician_services ts ON b.service_id = ts.service_id
    WHERE ts.technician_id = ? AND b.status = 'pending'
    ORDER BY b.created_at DESC
  `).all(technicianId);
  return rows.map(rowToBooking).map(b => { b.images = getBookingImages(b.id); return b; });
}

export function getBookingsForTechnicianOrPendingServices(technicianId, serviceIds) {
  const db = getDb();
  if (!serviceIds || serviceIds.length === 0) {
    return getBookingsForTechnician(technicianId);
  }
  const placeholders = serviceIds.map(() => '?').join(',');
  const sql = `
    SELECT * FROM bookings
    WHERE technician_id = ?
       OR (status = 'pending' AND service_id IN (${placeholders}))
    ORDER BY created_at DESC
  `;
  const rows = db.prepare(sql).all(technicianId, ...serviceIds);
  return rows.map(rowToBooking).map(b => { b.images = getBookingImages(b.id); return b; });
}
