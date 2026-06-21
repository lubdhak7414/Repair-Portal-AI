import bcrypt from 'bcryptjs';
import request from 'supertest';
import app from '../app.js';
import { createUser, getUserByEmail } from '../models/user.model.js';

export { app, request };

let counter = 0;
// Unique email per call so the shared test DB never hits a UNIQUE collision.
export function uniqueEmail(prefix = 'user') {
  counter += 1;
  return `${prefix}_${Date.now()}_${counter}@test.com`;
}

export const validPhone = '+12025550123';
export const defaultPassword = 'pass1234';

// Register a normal user through the real API and return { token, id, email }.
export async function registerAndLogin(overrides = {}) {
  const email = overrides.email || uniqueEmail();
  const password = overrides.password || defaultPassword;
  await request(app)
    .post('/api/users/')
    .send({
      name: overrides.name || 'Test User',
      email,
      phone: overrides.phone || validPhone,
      password,
      ...(overrides.role ? { role: overrides.role } : {}),
    });
  const res = await request(app).post('/api/users/login').send({ email, password });
  return { token: res.body.token, id: res.body.user?.id, email, password, body: res.body };
}

// Seed an admin directly via the model (the API intentionally forbids admin signup).
export async function createAdminAndLogin() {
  const email = uniqueEmail('admin');
  const password = defaultPassword;
  const hashed = await bcrypt.hash(password, 10);
  if (!getUserByEmail(email)) {
    createUser({ name: 'Admin', email, phone: validPhone, password: hashed, role: 'admin', address: {}, picture: '' });
  }
  const res = await request(app).post('/api/users/login').send({ email, password });
  return { token: res.body.token, id: res.body.user?.id, email };
}
