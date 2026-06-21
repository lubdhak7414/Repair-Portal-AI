import { describe, it, expect } from 'vitest';
import { app, request, registerAndLogin, createAdminAndLogin } from './helpers.js';

const sampleService = {
  name: 'Screen Repair',
  category: 'Mobile',
  description: 'Replace a cracked phone screen with a genuine part.',
  estimatedPrice: { min: 20, max: 80 },
  estimatedDuration: 60,
};

describe('Services', () => {
  it('serves the public catalog without auth (200)', async () => {
    const res = await request(app).get('/api/services');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.services)).toBe(true);
  });

  it('returns the health check at root', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.text).toMatch(/running/i);
  });

  it('blocks a non-admin from creating a service (403)', async () => {
    const { token } = await registerAndLogin();
    const res = await request(app)
      .post('/api/services')
      .set('Authorization', `Bearer ${token}`)
      .send(sampleService);
    expect(res.status).toBe(403);
  });

  it('lets an admin create a service (201/200) and it then appears in the catalog', async () => {
    const { token } = await createAdminAndLogin();
    const create = await request(app)
      .post('/api/services')
      .set('Authorization', `Bearer ${token}`)
      .send(sampleService);
    expect([200, 201]).toContain(create.status);

    const list = await request(app).get('/api/services');
    const names = list.body.services.map((s) => s.name);
    expect(names).toContain('Screen Repair');
  });

  it('validates the service body (400 on missing fields)', async () => {
    const { token } = await createAdminAndLogin();
    const res = await request(app)
      .post('/api/services')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'X' });
    expect(res.status).toBe(400);
  });
});
