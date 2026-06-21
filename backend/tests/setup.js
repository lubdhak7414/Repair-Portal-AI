import { join } from 'path';
import { tmpdir } from 'os';

// Must be set before app.js / config/db.js is imported by any test file.
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';
process.env.DB_PATH = join(tmpdir(), 'repair-portal-test.db');
