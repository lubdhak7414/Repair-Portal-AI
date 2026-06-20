// backend/middleware/auth.js
import jwt from 'jsonwebtoken';
import { getUserById } from '../models/user.model.js';

/**
 * Verify JWT token from Authorization header.
 * Attaches user object to req.user.
 * Returns 401 if token is missing, invalid, or user is deactivated.
 *
 * Note: getUserById is SYNCHRONOUS (better-sqlite3) — do NOT await it.
 */
export function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Support both decoded.userId (current token shape) and decoded.id (alternative)
    const userId = decoded.userId || decoded.id;
    const user = getUserById(userId); // synchronous

    if (!user || !user.is_active) {
      return res.status(401).json({ message: 'User not found or inactive' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    return res.status(401).json({ message: 'Invalid token' });
  }
}

/**
 * Check that the authenticated user has one of the allowed roles.
 * Must be called AFTER authenticate.
 * Returns 403 if role doesn't match.
 */
export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: 'Insufficient permissions',
        requiredRole: roles.join(' or '),
        yourRole: req.user.role,
      });
    }
    next();
  };
}
