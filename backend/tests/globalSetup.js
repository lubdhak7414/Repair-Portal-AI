import { rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

const dbFile = join(tmpdir(), 'repair-portal-test.db');

function clean() {
  for (const suffix of ['', '-wal', '-shm']) {
    try {
      rmSync(dbFile + suffix);
    } catch {
      /* file may not exist — ignore */
    }
  }
}

// Remove any leftover test DB before the run and again after.
export function setup() {
  clean();
}

export function teardown() {
  clean();
}
