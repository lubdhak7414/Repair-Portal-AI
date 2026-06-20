// routes/user.routes.js
import express from 'express';
import {
	createUser,
	getUserById,
	updateUser,
	deleteUser,
	getAllUsers,
	loginUser
} from '../controllers/user.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { registerSchema, loginSchema, updateUserSchema } from '../validators/user.validator.js';

const router = express.Router();

// Public
router.post('/', validate(registerSchema), createUser);
router.post('/login', validate(loginSchema), loginUser);

// Authenticated — user can read/update own profile, admin can read/update any
router.get('/:id', authenticate, getUserById);
router.put('/:id', authenticate, validate(updateUserSchema), updateUser);

// Admin only
router.delete('/:id', authenticate, authorize('admin'), deleteUser);
router.get('/', authenticate, authorize('admin'), getAllUsers);

export default router;
