import { getDb } from '../config/db.js';

function rowToInvoice(row) {
  if (!row) return null;
  return {
    id: row.id,
    booking: row.booking_id,
    payment: row.payment_id,
    invoiceNumber: row.invoice_number,
    user: row.user_id,
    technician: row.technician_id,
    service: {
      name: row.service_name,
      description: row.service_description,
    },
    itemsBreakdown: row.items_breakdown ? JSON.parse(row.items_breakdown) : [],
    subtotal: row.subtotal,
    platformFee: row.platform_fee,
    tax: row.tax,
    discount: row.discount,
    totalAmount: row.total_amount,
    billingAddress: {
      street: row.billing_street || '',
      city: row.billing_city || '',
      area: row.billing_area || '',
      postalCode: row.billing_postal_code || '',
    },
    serviceDate: row.service_date,
    pdfUrl: row.pdf_url,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function createInvoice(data) {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO invoices (booking_id, payment_id, invoice_number, user_id, technician_id, service_name, service_description, items_breakdown, subtotal, platform_fee, tax, discount, total_amount, billing_street, billing_city, billing_area, billing_postal_code, service_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    data.booking,
    data.payment,
    data.invoiceNumber,
    data.user,
    data.technician,
    data.service?.name || '',
    data.service?.description || '',
    data.itemsBreakdown ? JSON.stringify(data.itemsBreakdown) : '[]',
    data.subtotal,
    data.platformFee || 0,
    data.tax || 0,
    data.discount || 0,
    data.totalAmount,
    data.billingAddress?.street || '',
    data.billingAddress?.city || '',
    data.billingAddress?.area || '',
    data.billingAddress?.postalCode || '',
    data.serviceDate
  );
  return getInvoiceById(result.lastInsertRowid);
}

export function getInvoiceById(id) {
  const db = getDb();
  return rowToInvoice(db.prepare('SELECT * FROM invoices WHERE id = ?').get(id));
}

export function getInvoiceByBooking(bookingId) {
  const db = getDb();
  return rowToInvoice(db.prepare('SELECT * FROM invoices WHERE booking_id = ?').get(bookingId));
}

export function getUserInvoices(userId, { status, page = 1, limit = 10 } = {}) {
  const db = getDb();
  let sql = 'SELECT * FROM invoices WHERE user_id = ?';
  const params = [userId];

  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }

  const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as total');
  const total = db.prepare(countSql).get(...params).total;

  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, (page - 1) * limit);

  return {
    invoices: db.prepare(sql).all(...params).map(rowToInvoice),
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
  };
}

export function updateInvoice(id, fields) {
  const db = getDb();
  const fieldMap = {
    pdfUrl: 'pdf_url',
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
  if (sets.length === 0) return getInvoiceById(id);
  sets.push("updated_at = datetime('now')");
  values.push(id);
  db.prepare(`UPDATE invoices SET ${sets.join(', ')} WHERE id = ?`).run(...values);
  return getInvoiceById(id);
}
