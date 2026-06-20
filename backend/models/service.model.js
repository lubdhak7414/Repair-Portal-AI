import { getDb } from '../config/db.js';

function rowToService(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    description: row.description,
    estimatedPrice: {
      min: row.estimated_price_min,
      max: row.estimated_price_max,
    },
    estimatedDuration: row.estimated_duration,
    image: row.image || '',
    isActive: !!row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function createService({ name, category, description, estimatedPrice, estimatedDuration, image }) {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO services (name, category, description, estimated_price_min, estimated_price_max, estimated_duration, image)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    name, category, description,
    estimatedPrice?.min || 0, estimatedPrice?.max || 0,
    estimatedDuration || 0,
    image || ''
  );
  return getServiceById(result.lastInsertRowid);
}

export function getServiceById(id) {
  const db = getDb();
  return rowToService(db.prepare('SELECT * FROM services WHERE id = ?').get(id));
}

export function getServiceByName(name) {
  const db = getDb();
  return rowToService(db.prepare('SELECT * FROM services WHERE name = ? COLLATE NOCASE').get(name));
}

export function getAllServices({ category, search, isActive, page = 1, limit = 10 } = {}) {
  const db = getDb();
  let sql = 'SELECT * FROM services WHERE 1=1';
  const params = [];

  if (isActive !== undefined) {
    sql += ' AND is_active = ?';
    params.push(isActive ? 1 : 0);
  }
  if (category) {
    sql += ' AND category = ?';
    params.push(category);
  }
  if (search) {
    sql += ' AND (name LIKE ? OR description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as total');
  const total = db.prepare(countSql).get(...params).total;

  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, (page - 1) * limit);

  const rows = db.prepare(sql).all(...params);
  return {
    services: rows.map(rowToService),
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
  };
}

export function getAllServicesRaw() {
  const db = getDb();
  return db.prepare('SELECT * FROM services').all().map(rowToService);
}

export function updateService(id, fields) {
  const db = getDb();
  const fieldMap = {
    name: 'name',
    category: 'category',
    description: 'description',
    image: 'image',
    isActive: 'is_active',
    estimatedPrice_min: 'estimated_price_min',
    estimatedPrice_max: 'estimated_price_max',
    estimatedDuration: 'estimated_duration',
  };
  const sets = [];
  const values = [];
  for (const [key, val] of Object.entries(fields)) {
    if (fieldMap[key]) {
      sets.push(`${fieldMap[key]} = ?`);
      values.push(val);
    }
  }
  if (sets.length === 0) return getServiceById(id);
  sets.push("updated_at = datetime('now')");
  values.push(id);
  db.prepare(`UPDATE services SET ${sets.join(', ')} WHERE id = ?`).run(...values);
  return getServiceById(id);
}

export function deleteService(id) {
  const db = getDb();
  return db.prepare('DELETE FROM services WHERE id = ?').run(id);
}

export function getDistinctCategories() {
  const db = getDb();
  return db.prepare('SELECT DISTINCT category FROM services WHERE is_active = 1 ORDER BY category').all().map(r => r.category);
}
