import { getDb } from '../config/db.js';

function rowToPayment(row) {
  if (!row) return null;
  return {
    id: row.id,
    booking: row.booking_id,
    user: row.user_id,
    technician: row.technician_id,
    amount: row.amount,
    paymentMethod: row.payment_method,
    transactionId: row.transaction_id,
    gatewayResponse: row.gateway_response ? JSON.parse(row.gateway_response) : null,
    status: row.status,
    paidAt: row.paid_at,
    refundedAt: row.refunded_at,
    refundAmount: row.refund_amount,
    platformFee: row.platform_fee,
    technicianAmount: row.technician_amount,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function createPayment({ booking, user, technician, amount, paymentMethod, platformFee, technicianAmount }) {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO payments (booking_id, user_id, technician_id, amount, payment_method, platform_fee, technician_amount)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(booking, user, technician, amount, paymentMethod, platformFee || 0, technicianAmount || null);
  return getPaymentById(result.lastInsertRowid);
}

export function getPaymentById(id) {
  const db = getDb();
  return rowToPayment(db.prepare('SELECT * FROM payments WHERE id = ?').get(id));
}

export function getPaymentByBooking(bookingId) {
  const db = getDb();
  return rowToPayment(db.prepare('SELECT * FROM payments WHERE booking_id = ?').get(bookingId));
}

export function updatePayment(id, fields) {
  const db = getDb();
  const fieldMap = {
    status: 'status',
    transactionId: 'transaction_id',
    gatewayResponse: 'gateway_response',
    paidAt: 'paid_at',
    refundedAt: 'refunded_at',
    refundAmount: 'refund_amount',
  };
  const sets = [];
  const values = [];
  for (const [key, val] of Object.entries(fields)) {
    if (fieldMap[key]) {
      if (key === 'gatewayResponse' && typeof val === 'object') {
        sets.push(`${fieldMap[key]} = ?`);
        values.push(JSON.stringify(val));
      } else {
        sets.push(`${fieldMap[key]} = ?`);
        values.push(val);
      }
    }
  }
  if (sets.length === 0) return getPaymentById(id);
  sets.push("updated_at = datetime('now')");
  values.push(id);
  db.prepare(`UPDATE payments SET ${sets.join(', ')} WHERE id = ?`).run(...values);
  return getPaymentById(id);
}
