import { describe, it, expect } from 'vitest';
import { app, request, registerAndLogin, createAdminAndLogin, defaultPassword } from './helpers.js';

describe('Users: authorization', () => {
  it('blocks unauthenticated access to a profile (401)', async () => {
    const { id } = await registerAndLogin();
    const res = await request(app).get(`/api/users/${id}`);
    expect(res.status).toBe(401);
  });

  it('blocks a non-admin from listing all users (403)', async () => {
    const { token } = await registerAndLogin();
    const res = await request(app).get('/api/users').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('lets an admin list users (200)', async () => {
    const { token } = await createAdminAndLogin();
    const res = await request(app).get('/api/users').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe('Users: no password-hash leakage', () => {
  it('omits the password from getUserById', async () => {
    const { token, id } = await registerAndLogin();
    const res = await request(app).get(`/api/users/${id}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).not.toHaveProperty('password');
  });

  it('omits the password from updateUser', async () => {
    const { token, id } = await registerAndLogin();
    const res = await request(app)
      .put(`/api/users/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Renamed' });
    expect(res.status).toBe(200);
    expect(res.body).not.toHaveProperty('password');
    expect(res.body.name).toBe('Renamed');
  });

  it('omits the password from every entry in getAllUsers', async () => {
    const { token } = await createAdminAndLogin();
    const res = await request(app).get('/api/users').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    for (const u of res.body) {
      expect(u).not.toHaveProperty('password');
    }
  });
});

describe('Users: privilege escalation is blocked', () => {
  it('ignores a self-service role change to admin', async () => {
    const { token, id } = await registerAndLogin();
    const res = await request(app)
      .put(`/api/users/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ role: 'admin', name: 'Climber' });
    expect(res.status).toBe(200);
    expect(res.body.role).toBe('user'); // role unchanged
    expect(res.body.name).toBe('Climber'); // other fields still applied
  });

  it('prevents one user from editing another user’s profile (403)', async () => {
    const victim = await registerAndLogin();
    const attacker = await registerAndLogin();
    const res = await request(app)
      .put(`/api/users/${victim.id}`)
      .set('Authorization', `Bearer ${attacker.token}`)
      .send({ name: 'Hacked' });
    expect(res.status).toBe(403);
  });
});

describe('Users: password change requires current password', () => {
  it('rejects a password change without the current password (400)', async () => {
    const { token, id } = await registerAndLogin();
    const res = await request(app)
      .put(`/api/users/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ password: 'newpass123' });
    expect(res.status).toBe(400);
  });

  it('rejects a wrong current password (400)', async () => {
    const { token, id } = await registerAndLogin();
    const res = await request(app)
      .put(`/api/users/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ password: 'newpass123', currentPassword: 'wrong' });
    expect(res.status).toBe(400);
  });

  it('accepts a valid current password (200) and the new password works', async () => {
    const { token, id, email } = await registerAndLogin();
    const change = await request(app)
      .put(`/api/users/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ password: 'newpass123', currentPassword: defaultPassword });
    expect(change.status).toBe(200);

    const login = await request(app).post('/api/users/login').send({ email, password: 'newpass123' });
    expect(login.status).toBe(200);
    expect(typeof login.body.token).toBe('string');
  });
});
