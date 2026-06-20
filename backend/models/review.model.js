import { getDb } from '../config/db.js';

function rowToReview(row) {
  if (!row) return null;
  return {
    id: row.id,
    booking: row.booking_id,
    user: row.user_id,
    technician: row.technician_id,
    rating: {
      overall: row.rating_overall,
      punctuality: row.rating_punctuality,
      workQuality: row.rating_work_quality,
      communication: row.rating_communication,
      cleanliness: row.rating_cleanliness,
    },
    comment: row.comment,
    images: [], // populated separately
    wouldRecommend: !!row.would_recommend,
    isAnonymous: !!row.is_anonymous,
    technicianResponse: row.technician_response ? {
      comment: row.technician_response,
      respondedAt: row.technician_responded_at,
    } : null,
    isVisible: !!row.is_visible,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function getReviewImages(reviewId) {
  const db = getDb();
  return db.prepare('SELECT image_url FROM review_images WHERE review_id = ?').all(reviewId).map(r => r.image_url);
}

export function createReview({ booking, user, technician, rating, comment, images, wouldRecommend, isAnonymous }) {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO reviews (booking_id, user_id, technician_id, rating_overall, rating_punctuality, rating_work_quality, rating_communication, rating_cleanliness, comment, would_recommend, is_anonymous)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    booking, user, technician,
    rating?.overall || rating || 5,
    rating?.punctuality || null,
    rating?.workQuality || null,
    rating?.communication || null,
    rating?.cleanliness || null,
    comment || null,
    wouldRecommend !== undefined ? (wouldRecommend ? 1 : 0) : 1,
    isAnonymous ? 1 : 0
  );

  if (images && Array.isArray(images)) {
    const imgStmt = db.prepare('INSERT INTO review_images (review_id, image_url) VALUES (?, ?)');
    for (const img of images) {
      imgStmt.run(result.lastInsertRowid, img);
    }
  }

  return getReviewById(result.lastInsertRowid);
}

export function getReviewById(id) {
  const db = getDb();
  const row = db.prepare('SELECT * FROM reviews WHERE id = ?').get(id);
  if (!row) return null;
  const review = rowToReview(row);
  review.images = getReviewImages(id);
  return review;
}

export function getReviewByBooking(bookingId) {
  const db = getDb();
  const row = db.prepare('SELECT * FROM reviews WHERE booking_id = ?').get(bookingId);
  if (!row) return null;
  const review = rowToReview(row);
  review.images = getReviewImages(row.id);
  return review;
}

export function getTechnicianReviews(technicianId, { isVisible, page = 1, limit = 10 } = {}) {
  const db = getDb();
  let sql = 'SELECT * FROM reviews WHERE technician_id = ?';
  const params = [technicianId];

  if (isVisible !== undefined) {
    sql += ' AND is_visible = ?';
    params.push(isVisible ? 1 : 0);
  }

  const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as total');
  const total = db.prepare(countSql).get(...params).total;

  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, (page - 1) * limit);

  const rows = db.prepare(sql).all(...params);
  return {
    reviews: rows.map(rowToReview).map(r => { r.images = getReviewImages(r.id); return r; }),
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
  };
}

export function getAllReviewsByTechnician(technicianId) {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM reviews WHERE technician_id = ?').all(technicianId);
  return rows.map(rowToReview);
}

export function updateReview(id, fields) {
  const db = getDb();
  const fieldMap = {
    comment: 'comment',
    isVisible: 'is_visible',
    wouldRecommend: 'would_recommend',
    isAnonymous: 'is_anonymous',
    technicianResponse_comment: 'technician_response',
    technicianResponse_respondedAt: 'technician_responded_at',
  };
  const sets = [];
  const values = [];
  for (const [key, val] of Object.entries(fields)) {
    if (fieldMap[key]) {
      sets.push(`${fieldMap[key]} = ?`);
      values.push(val);
    }
  }
  if (sets.length === 0) return getReviewById(id);
  sets.push("updated_at = datetime('now')");
  values.push(id);
  db.prepare(`UPDATE reviews SET ${sets.join(', ')} WHERE id = ?`).run(...values);
  return getReviewById(id);
}

export function getTechnicianRatingStats(technicianId) {
  const db = getDb();
  const row = db.prepare(`
    SELECT
      COUNT(*) as count,
      AVG(rating_overall) as avg_overall,
      AVG(rating_punctuality) as avg_punctuality,
      AVG(rating_work_quality) as avg_quality,
      AVG(rating_communication) as avg_communication,
      AVG(rating_cleanliness) as avg_cleanliness
    FROM reviews WHERE technician_id = ?
  `).get(technicianId);
  return row;
}
