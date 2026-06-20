import { getDb } from '../config/db.js';

function rowToUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    password: row.password,
    address: {
      street: row.address_street || '',
      city: row.address_city || '',
      area: row.address_area || '',
      postalCode: row.address_postal_code || '',
    },
    picture: row.picture || '',
    role: row.role,
    is_active: !!row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function createUser({ name, email, phone, password, role, address, picture }) {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO users (name, email, phone, password, role, address_street, address_city, address_area, address_postal_code, picture)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    name, email, phone, password,
    role || 'user',
    address?.street || '', address?.city || '', address?.area || '', address?.postalCode || '',
    picture || ''
  );
  return getUserById(result.lastInsertRowid);
}

export function getUserById(id) {
  const db = getDb();
  return rowToUser(db.prepare('SELECT * FROM users WHERE id = ?').get(id));
}

export function getUserByEmail(email) {
  const db = getDb();
  return rowToUser(db.prepare('SELECT * FROM users WHERE email = ?').get(email));
}

export function getAllUsers() {
  const db = getDb();
  return db.prepare('SELECT * FROM users').all().map(rowToUser);
}

export function getUsersByRole(role) {
  const db = getDb();
  return db.prepare('SELECT * FROM users WHERE role = ?').all(role).map(rowToUser);
}

export function updateUser(id, fields) {
  const db = getDb();
  const allowed = ['name', 'phone', 'picture', 'address_street', 'address_city', 'address_area', 'address_postal_code', 'is_active', 'password'];
  const sets = [];
  const values = [];
  for (const [key, val] of Object.entries(fields)) {
    if (allowed.includes(key)) {
      sets.push(`${key} = ?`);
      values.push(val);
    }
  }
  if (sets.length === 0) return getUserById(id);
  sets.push("updated_at = datetime('now')");
  values.push(id);
  db.prepare(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`).run(...values);
  return getUserById(id);
}

export function deleteUser(id) {
  const db = getDb();
  return db.prepare('DELETE FROM users WHERE id = ?').run(id);
}

export function searchUsersByName(name) {
  const db = getDb();
  return db.prepare('SELECT * FROM users WHERE name LIKE ?').all(`%${name}%`).map(rowToUser);
}
