import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Pool } from 'pg';
import { env } from '../config.js';
import { migrate } from './migrate.js';
@Injectable()
export class Database implements OnModuleInit, OnModuleDestroy {
  readonly pool = new Pool({
    connectionString: env.DATABASE_URL,
    options: '-c search_path=public,gis,extensions',
    ssl:
      env.DATABASE_SSL === 'true'
        ? {
            rejectUnauthorized: true,
            ...(env.DATABASE_CA_CERT ? { ca: env.DATABASE_CA_CERT } : {}),
          }
        : false,
    max: 10,
    connectionTimeoutMillis: 5000,
    statement_timeout: 10000,
    idleTimeoutMillis: 30000,
  });
  async onModuleInit() {
    await migrate(this.pool);
  }
  async onModuleDestroy() {
    await this.pool.end();
  }
}
