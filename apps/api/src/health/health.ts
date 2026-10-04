import {
  Controller,
  Get,
  Inject,
  Module,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Database } from '../db/database.js';
@Controller('health')
export class HealthController {
  constructor(@Inject(Database) private readonly db: Database) {}
  @Get() async get() {
    try {
      const result = await this.db.pool.query<{ version: string }>(
        'SELECT postgis_lib_version() AS version',
      );
      return {
        status: 'ok',
        database: 'connected',
        postgis: result.rows[0]?.version,
        mapProvider: 'oss-default',
        riverObservations: 'DEMO',
        timestamp: new Date().toISOString(),
      };
    } catch {
      throw new ServiceUnavailableException('Database is unavailable.');
    }
  }
}
@Module({ controllers: [HealthController] })
export class HealthModule {}
