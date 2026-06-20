// backend/scripts/backup-db.js
// Run: node backend/scripts/backup-db.js
// Creates a timestamped backup of the SQLite database

import { copyFileSync, existsSync, mkdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const DB_PATH = process.env.DB_PATH || join(__dirname, '..', 'data', 'repair-portal.db');
const BACKUP_DIR = join(__dirname, '..', 'data', 'backups');

// Ensure backup directory exists
if (!existsSync(BACKUP_DIR)) {
  mkdirSync(BACKUP_DIR, { recursive: true });
}

// Check source database exists
if (!existsSync(DB_PATH)) {
  console.error(`Database file not found at: ${DB_PATH}`);
  process.exit(1);
}

// Generate timestamped backup filename
const timestamp = new Date()
  .toISOString()
  .replace(/[:.]/g, '-')
  .replace('T', '_')
  .slice(0, 19);

const backupPath = join(BACKUP_DIR, `repair-portal-${timestamp}.db`);

try {
  copyFileSync(DB_PATH, backupPath);
  console.log('Backup created successfully:');
  console.log(`  Source: ${DB_PATH}`);
  console.log(`  Backup: ${backupPath}`);

  // Log file sizes
  const sourceSize = (statSync(DB_PATH).size / 1024).toFixed(2);
  const backupSize = (statSync(backupPath).size / 1024).toFixed(2);
  console.log(`  Source size: ${sourceSize} KB`);
  console.log(`  Backup size: ${backupSize} KB`);
} catch (error) {
  console.error('Backup failed:', error.message);
  process.exit(1);
}
