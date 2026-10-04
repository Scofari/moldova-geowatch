import { readFile, readdir } from 'node:fs/promises';
import type { Pool } from 'pg';
export async function migrate(pool: Pool): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(847229)');
    // Fresh hosted databases keep extension objects outside the exposed schema.
    // An existing local PostGIS installation is preserved in its original schema.
    await client.query('CREATE SCHEMA IF NOT EXISTS gis');
    await client.query(
      'CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA gis',
    );
    await client.query('SET LOCAL search_path=public,gis,extensions');
    await client.query(
      'CREATE TABLE IF NOT EXISTS schema_migrations (version integer PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())',
    );
    const directory = new URL('../../migrations/', import.meta.url);
    const files = (await readdir(directory))
      .filter((file) => /^\d+_[a-z_]+\.sql$/.test(file))
      .sort();
    const versions = new Set<number>();
    for (const file of files) {
      const version = Number(file.split('_')[0]);
      if (versions.has(version))
        throw new Error('Duplicate migration version.');
      versions.add(version);
      const result = await client.query(
        'SELECT version FROM schema_migrations WHERE version=$1',
        [version],
      );
      if (!result.rowCount) {
        await client.query(await readFile(new URL(file, directory), 'utf8'));
        await client.query(
          'INSERT INTO schema_migrations(version) VALUES ($1)',
          [version],
        );
      }
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
