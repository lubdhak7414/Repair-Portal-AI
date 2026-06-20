import { getDb } from '../config/db.js';

function rowToWarranty(row) {
  if (!row) return null;
  return {
    id: row.id,
    booking: row.booking_id,
    invoice: row.invoice_id,
    warrantyNumber: row.warranty_number,
    user: row.user_id,
    technician: row.technician_id,
    service: {
      name: row.service_name,
      category: row.service_category,
    },
    warrantyPeriod: {
      duration: row.warranty_duration,
      unit: row.warranty_unit,
    },
    warrantyType: row.warranty_type,
    coverageDetails: row.coverage_details ? JSON.parse(row.coverage_details) : [],
    terms: row.terms ? JSON.parse(row.terms) : [],
    serviceDate: row.service_date,
    expiryDate: row.expiry_date,
    isActive: !!row.is_active,
    claimsHistory: row.claims_history ? JSON.parse(row.claims_history) : [],
    qrCode: row.qr_code,
    pdfUrl: row.pdf_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function calculateExpiryDate(serviceDate, duration, unit) {
  if (!serviceDate) return null;
  const d = new Date(serviceDate);
  if (unit === 'days') d.setDate(d.getDate() + duration);
  else if (unit === 'months') d.setMonth(d.getMonth() + duration);
  else if (unit === 'years') d.setFullYear(d.getFullYear() + duration);
  return d.toISOString();
}

export function createWarranty(data) {
  const db = getDb();
  const expiryDate = calculateExpiryDate(data.serviceDate, data.warrantyDuration, data.warrantyUnit);
  const stmt = db.prepare(`
    INSERT INTO warranties (booking_id, invoice_id, warranty_number, user_id, technician_id, service_name, service_category, warranty_duration, warranty_unit, warranty_type, coverage_details, terms, service_date, expiry_date, qr_code)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    data.booking, data.invoice, data.warrantyNumber,
    data.user, data.technician,
    data.serviceName || '', data.serviceCategory || '',
    data.warrantyDuration, data.warrantyUnit || 'months',
    data.warrantyType || 'full-service',
    data.coverageDetails ? JSON.stringify(data.coverageDetails) : '[]',
    data.terms ? JSON.stringify(data.terms) : '[]',
    data.serviceDate, expiryDate,
    data.qrCode || null
  );
  return getWarrantyById(result.lastInsertRowid);
}

export function getWarrantyById(id) {
  const db = getDb();
  return rowToWarranty(db.prepare('SELECT * FROM warranties WHERE id = ?').get(id));
}

export function getWarrantyByBooking(bookingId) {
  const db = getDb();
  return rowToWarranty(db.prepare('SELECT * FROM warranties WHERE booking_id = ?').get(bookingId));
}

export function getUserWarranties(userId, { status, page = 1, limit = 10 } = {}) {
  const db = getDb();
  let sql = 'SELECT * FROM warranties WHERE user_id = ?';
  const params = [userId];

  if (status === 'active') {
    sql += ' AND is_active = 1 AND expiry_date > datetime("now")';
  } else if (status === 'expired') {
    sql += ' AND expiry_date < datetime("now")';
  }

  const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as total');
  const total = db.prepare(countSql).get(...params).total;

  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, (page - 1) * limit);

  return {
    warranties: db.prepare(sql).all(...params).map(rowToWarranty),
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
  };
}

export function updateWarranty(id, fields) {
  const db = getDb();
  const fieldMap = {
    pdfUrl: 'pdf_url',
    qrCode: 'qr_code',
    isActive: 'is_active',
    claimsHistory: 'claims_history',
  };
  const sets = [];
  const values = [];
  for (const [key, val] of Object.entries(fields)) {
    if (fieldMap[key]) {
      if (key === 'claimsHistory' && typeof val === 'object') {
        sets.push(`${fieldMap[key]} = ?`);
        values.push(JSON.stringify(val));
      } else {
        sets.push(`${fieldMap[key]} = ?`);
        values.push(val);
      }
    }
  }
  if (sets.length === 0) return getWarrantyById(id);
  sets.push("updated_at = datetime('now')");
  values.push(id);
  db.prepare(`UPDATE warranties SET ${sets.join(', ')} WHERE id = ?`).run(...values);
  return getWarrantyById(id);
}
