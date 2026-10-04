import { readFile } from 'node:fs/promises';
import type { Pool } from 'pg';
export async function migrate(pool: Pool): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(847229)');
    await client.query(
      'CREATE TABLE IF NOT EXISTS schema_migrations (version integer PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())',
    );
    const result = await client.query(
      'SELECT version FROM schema_migrations WHERE version=1',
    );
    if (!result.rowCount) {
      const sql = await readFile(
        new URL('../../migrations/001_reports.sql', import.meta.url),
        'utf8',
      );
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations(version) VALUES (1)');
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
