import { Pool } from 'pg';
import { env } from '../config.js';
import { migrate } from './migrate.js';
const pool = new Pool({ connectionString: env.DATABASE_URL });
try {
  await migrate(pool);
  console.log('Database migrations applied.');
} finally {
  await pool.end();
}
