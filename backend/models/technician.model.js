import { getDb } from '../config/db.js';

function rowToTechnician(row) {
  if (!row) return null;
  return {
    id: row.id,
    user: row.user_id,
    experience: row.experience,
    rating: {
      average: row.rating_average,
      count: row.rating_count,
    },
    hourlyRate: row.hourly_rate,
    isVerified: !!row.is_verified,
    isAvailable: !!row.is_available,
    totalJobs: row.total_jobs,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function createTechnician({ userId, experience, hourlyRate }) {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO technicians (user_id, experience, hourly_rate)
    VALUES (?, ?, ?)
  `);
  const result = stmt.run(userId, experience, hourlyRate);
  return getTechnicianById(result.lastInsertRowid);
}

export function getTechnicianById(id) {
  const db = getDb();
  const row = db.prepare('SELECT * FROM technicians WHERE id = ?').get(id);
  if (!row) return null;
  const tech = rowToTechnician(row);
  tech.services = getTechnicianServices(id);
  tech.availability = getTechnicianAvailability(id);
  tech.serviceArea = getTechnicianServiceAreas(id);
  tech.certifications = getTechnicianCertifications(id);
  return tech;
}

export function getTechnicianByUserId(userId) {
  const db = getDb();
  const row = db.prepare('SELECT * FROM technicians WHERE user_id = ?').get(userId);
  if (!row) return null;
  return getTechnicianById(row.id);
}

function getTechnicianServices(technicianId) {
  const db = getDb();
  return db.prepare(`
    SELECT s.id, s.name, s.category FROM services s
    INNER JOIN technician_services ts ON s.id = ts.service_id
    WHERE ts.technician_id = ?
  `).all(technicianId);
}

function getTechnicianAvailability(technicianId) {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM technician_availability WHERE technician_id = ?').all(technicianId);
  const result = {};
  for (const r of rows) {
    result[r.day_of_week] = {
      start: r.start_time || '',
      end: r.end_time || '',
      available: !!r.available,
    };
  }
  return result;
}

function getTechnicianServiceAreas(technicianId) {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM technician_service_areas WHERE technician_id = ?').all(technicianId);
  const map = {};
  for (const r of rows) {
    if (!map[r.city]) map[r.city] = { city: r.city, areas: [] };
    if (r.area) map[r.city].areas.push(r.area);
  }
  return Object.values(map);
}

function getTechnicianCertifications(technicianId) {
  const db = getDb();
  return db.prepare('SELECT * FROM technician_certifications WHERE technician_id = ?').all(technicianId).map(r => ({
    name: r.name,
    issuedBy: r.issued_by,
    issuedDate: r.issued_date,
    expiryDate: r.expiry_date,
  }));
}

export function getAllTechnicians() {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM technicians').all();
  return rows.map(r => getTechnicianById(r.id));
}

export function searchTechnicians({ service, city, area, minRating, maxRate, minExperience, page = 1, limit = 10 } = {}) {
  const db = getDb();
  let sql = 'SELECT DISTINCT t.* FROM technicians t';
  const joins = [];
  const conditions = ['t.is_available = 1'];
  const params = [];

  if (service) {
    joins.push('INNER JOIN technician_services ts ON t.id = ts.technician_id');
    conditions.push('ts.service_id = ?');
    params.push(service);
  }
  if (city || area) {
    joins.push('LEFT JOIN technician_service_areas tsa ON t.id = tsa.technician_id');
    if (city) {
      conditions.push('tsa.city LIKE ?');
      params.push(`%${city}%`);
    }
    if (area) {
      conditions.push('tsa.area LIKE ?');
      params.push(`%${area}%`);
    }
  }
  if (minRating) {
    conditions.push('t.rating_average >= ?');
    params.push(parseFloat(minRating));
  }
  if (maxRate) {
    conditions.push('t.hourly_rate <= ?');
    params.push(parseFloat(maxRate));
  }
  if (minExperience) {
    conditions.push('t.experience >= ?');
    params.push(parseFloat(minExperience));
  }

  const fromClause = joins.length ? ` ${joins.join(' ')}` : '';
  const whereClause = conditions.length ? ` WHERE ${conditions.join(' AND ')}` : '';

  const countSql = `SELECT COUNT(*) as total FROM (SELECT DISTINCT t.id FROM technicians t${fromClause}${whereClause})`;
  const total = db.prepare(countSql).get(...params).total;

  const dataSql = `SELECT DISTINCT t.* FROM technicians t${fromClause}${whereClause} ORDER BY t.rating_average DESC, t.total_jobs DESC LIMIT ? OFFSET ?`;
  const dataParams = [...params, limit, (page - 1) * limit];
  const rows = db.prepare(dataSql).all(...dataParams);

  return {
    technicians: rows.map(r => getTechnicianById(r.id)),
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
  };
}

export function updateTechnician(id, fields) {
  const db = getDb();
  const fieldMap = {
    experience: 'experience',
    hourlyRate: 'hourly_rate',
    isVerified: 'is_verified',
    isAvailable: 'is_available',
    totalJobs: 'total_jobs',
    rating_average: 'rating_average',
    rating_count: 'rating_count',
  };
  const sets = [];
  const values = [];
  for (const [key, val] of Object.entries(fields)) {
    if (fieldMap[key]) {
      sets.push(`${fieldMap[key]} = ?`);
      values.push(val);
    }
  }
  if (sets.length === 0) return getTechnicianById(id);
  sets.push("updated_at = datetime('now')");
  values.push(id);
  db.prepare(`UPDATE technicians SET ${sets.join(', ')} WHERE id = ?`).run(...values);
  return getTechnicianById(id);
}

export function deleteTechnician(id) {
  const db = getDb();
  return db.prepare('DELETE FROM technicians WHERE id = ?').run(id);
}

export function addTechnicianService(technicianId, serviceId) {
  const db = getDb();
  db.prepare('INSERT OR IGNORE INTO technician_services (technician_id, service_id) VALUES (?, ?)').run(technicianId, serviceId);
}

export function addTechnicianAvailability(technicianId, dayOfWeek, start, end, available) {
  const db = getDb();
  db.prepare(`
    INSERT INTO technician_availability (technician_id, day_of_week, start_time, end_time, available)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(technician_id, day_of_week) DO UPDATE SET start_time = excluded.start_time, end_time = excluded.end_time, available = excluded.available
  `).run(technicianId, dayOfWeek, start || '', end || '', available ? 1 : 0);
}

export function addTechnicianServiceArea(technicianId, city, area) {
  const db = getDb();
  db.prepare('INSERT INTO technician_service_areas (technician_id, city, area) VALUES (?, ?, ?)').run(technicianId, city, area);
}

export function addTechnicianCertification(technicianId, { name, issuedBy, issuedDate, expiryDate }) {
  const db = getDb();
  db.prepare(`
    INSERT INTO technician_certifications (technician_id, name, issued_by, issued_date, expiry_date)
    VALUES (?, ?, ?, ?, ?)
  `).run(technicianId, name, issuedBy || null, issuedDate || null, expiryDate || null);
}

export function clearTechnicianServices(technicianId) {
  const db = getDb();
  db.prepare('DELETE FROM technician_services WHERE technician_id = ?').run(technicianId);
}

export function clearTechnicianAvailability(technicianId) {
  const db = getDb();
  db.prepare('DELETE FROM technician_availability WHERE technician_id = ?').run(technicianId);
}

export function clearTechnicianServiceAreas(technicianId) {
  const db = getDb();
  db.prepare('DELETE FROM technician_service_areas WHERE technician_id = ?').run(technicianId);
}

export function clearTechnicianCertifications(technicianId) {
  const db = getDb();
  db.prepare('DELETE FROM technician_certifications WHERE technician_id = ?').run(technicianId);
}

export function technicianHasService(technicianId, serviceId) {
  const db = getDb();
  const row = db.prepare('SELECT 1 FROM technician_services WHERE technician_id = ? AND service_id = ?').get(technicianId, serviceId);
  return !!row;
}
