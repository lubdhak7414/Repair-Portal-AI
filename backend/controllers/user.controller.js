import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createUser as createUserModel, getUserById as getUserByIdModel, getUserByEmail, getAllUsers as getAllUsersModel, updateUser as updateUserModel, deleteUser as deleteUserModel } from '../models/user.model.js';

// Create a new user
export const createUser = async (req, res) => {
  try {
    const { name, email, phone, password, address, picture, role } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ message: "Please provide all required fields" });
    }

    const existingUser = getUserByEmail(email.toLowerCase().trim());
    if (existingUser) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = createUserModel({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      password: hashedPassword,
      address: address || {},
      picture: picture || "",
      role: role && ["user", "technician"].includes(role) ? role : "user",
    });

    const { password: _, ...userWithoutPassword } = user;
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    console.error("Create User Error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Get user by ID
export const getUserById = async (req, res) => {
  try {
    // Owner check: user can read own profile; admin can read any
    if (req.user.role !== 'admin' && String(req.user.id) !== req.params.id) {
      return res.status(403).json({ message: 'Not authorized to view this profile' });
    }

    const user = getUserByIdModel(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const { password: _pw, ...userWithoutPassword } = user;
    res.status(200).json(userWithoutPassword);
  } catch (error) {
    console.error('Get User Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Update user — merged: role handling (Phase 8) + currentPassword verification (Phase 9)
export const updateUser = async (req, res) => {
  try {
    // Owner check: user can update own profile; admin can update any
    if (req.user.role !== 'admin' && String(req.user.id) !== req.params.id) {
      return res.status(403).json({ message: 'Not authorized to update this profile' });
    }

    const { name, phone, address, picture, isActive, role, password, currentPassword } = req.body;
    const fields = {};
    if (name !== undefined) fields.name = name;
    if (phone !== undefined) fields.phone = phone;
    if (picture !== undefined) fields.picture = picture;
    if (isActive !== undefined) fields.is_active = isActive ? 1 : 0;

    // Phase 8: Allow role update only to valid roles — admins only (prevents self-escalation)
    if (role && ['user', 'technician', 'admin'].includes(role) && req.user.role === 'admin') {
      fields.role = role;
    }

    if (address) {
      if (address.street !== undefined) fields.address_street = address.street;
      if (address.city !== undefined) fields.address_city = address.city;
      if (address.area !== undefined) fields.address_area = address.area;
      if (address.postalCode !== undefined) fields.address_postal_code = address.postalCode;
    }

    // Phase 9: Password change requires current password verification
    if (password) {
      if (!currentPassword) {
        return res.status(400).json({ message: 'Current password is required to set a new password' });
      }
      // Fetch full user record (with password hash) — synchronous SQLite
      const existingUser = getUserByIdModel(req.params.id);
      if (!existingUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      const isMatch = await bcrypt.compare(currentPassword, existingUser.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }
      const salt = await bcrypt.genSalt(10);
      fields.password = await bcrypt.hash(password, salt);
    }

    const updatedUser = updateUserModel(req.params.id, fields);
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    const { password: _pw, ...userWithoutPassword } = updatedUser;
    res.status(200).json(userWithoutPassword);
  } catch (error) {
    console.error('Update User Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Delete user (soft delete — sets is_active = 0)
export const deleteUser = async (req, res) => {
  try {
    const existingUser = getUserByIdModel(req.params.id);
    if (!existingUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    updateUserModel(req.params.id, { is_active: 0 });
    res.status(200).json({ message: 'User deactivated successfully' });
  } catch (error) {
    console.error('Delete User Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Get all users (for admin panel or analytics)
export const getAllUsers = async (req, res) => {
  try {
    const users = getAllUsersModel();
    // Filter out deactivated users unless admin explicitly requests them
    const includeInactive = req.query.includeInactive === 'true' && req.user?.role === 'admin';
    const filteredUsers = includeInactive ? users : users.filter(u => u.is_active !== false);
    const sanitized = filteredUsers.map(({ password: _pw, ...rest }) => rest);
    res.status(200).json(sanitized);
  } catch (error) {
    console.error('Get All Users Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Login user controller
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = getUserByEmail(email);
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (!user.is_active) {
      return res.status(403).json({ message: 'Account is deactivated' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        picture: user.picture,
        role: user.role,
      }
    });
  } catch (error) {
    console.error('Login User Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};
