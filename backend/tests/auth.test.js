import { describe, it, expect } from 'vitest';
import { app, request, uniqueEmail, validPhone, defaultPassword, registerAndLogin } from './helpers.js';

describe('Auth: registration', () => {
  it('registers a new user and returns it without the password hash', async () => {
    const email = uniqueEmail();
    const res = await request(app)
      .post('/api/users/')
      .send({ name: 'Alice', email, phone: validPhone, password: defaultPassword });

    expect(res.status).toBe(201);
    expect(res.body.email).toBe(email);
    expect(res.body.role).toBe('user');
    expect(res.body).not.toHaveProperty('password');
  });

  it('rejects an invalid phone number with 400', async () => {
    const res = await request(app)
      .post('/api/users/')
      .send({ name: 'Bad', email: uniqueEmail(), phone: '123', password: defaultPassword });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/validation/i);
  });

  it('refuses to create an admin account through registration', async () => {
    const res = await request(app)
      .post('/api/users/')
      .send({ name: 'Eve', email: uniqueEmail(), phone: validPhone, password: defaultPassword, role: 'admin' });

    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body)).toMatch(/role/i);
  });

  it('allows technician self-signup', async () => {
    const res = await request(app)
      .post('/api/users/')
      .send({ name: 'Tek', email: uniqueEmail('tech'), phone: validPhone, password: defaultPassword, role: 'technician' });

    expect(res.status).toBe(201);
    expect(res.body.role).toBe('technician');
  });

  it('rejects duplicate emails', async () => {
    const email = uniqueEmail();
    await request(app).post('/api/users/').send({ name: 'A', email, phone: validPhone, password: defaultPassword });
    const res = await request(app).post('/api/users/').send({ name: 'B', email, phone: validPhone, password: defaultPassword });
    expect(res.status).toBe(400);
  });
});

describe('Auth: login', () => {
  it('logs in with valid credentials and returns a token', async () => {
    const { token, body } = await registerAndLogin();
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(20);
    expect(body).not.toHaveProperty('password');
  });

  it('rejects wrong password with 400', async () => {
    const { email } = await registerAndLogin();
    const res = await request(app).post('/api/users/login').send({ email, password: 'wrongpass' });
    expect(res.status).toBe(400);
  });
});
