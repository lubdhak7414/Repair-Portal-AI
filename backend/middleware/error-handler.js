export function errorHandler(err, req, res, next) {
  console.error(`[${new Date().toISOString()}] Unhandled Error:`, err.stack || err.message || err);

  // SQLite constraint errors
  if (err.message && err.message.includes('UNIQUE constraint failed')) {
    const match = err.message.match(/UNIQUE constraint failed: (\w+)\.(\w+)/);
    const field = match ? match[2] : 'unknown';
    return res.status(409).json({
      message: `Duplicate value for ${field}`,
    });
  }

  // SQLite errors
  if (err.code && err.code.startsWith('SQLITE_')) {
    return res.status(400).json({
      message: 'Database error',
    });
  }

  // Generic error with status
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
  });
}
