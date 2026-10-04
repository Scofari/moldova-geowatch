import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  CommunityReport,
  CreateReport,
  ReportsQuery,
  ReportsResponse,
} from '@geowatch/shared';
import { createHmac } from 'node:crypto';
import { Database } from '../db/database.js';
import { env } from '../config.js';
import { ReportsGateway } from './reports.gateway.js';
const select = `SELECT id, country_code AS "countryCode", category, title, description,
 ST_Y(location::geometry) AS latitude, ST_X(location::geometry) AS longitude,
 confirmations, created_at AS "createdAt", updated_at AS "updatedAt" FROM reports`;
interface Row extends Omit<
  CommunityReport,
  'position' | 'createdAt' | 'updatedAt'
> {
  latitude: number;
  longitude: number;
  createdAt: Date;
  updatedAt: Date;
}
function mapRow(row: Row): CommunityReport {
  return {
    id: row.id,
    countryCode: row.countryCode,
    category: row.category,
    title: row.title,
    description: row.description ?? undefined,
    position: { latitude: row.latitude, longitude: row.longitude },
    confirmations: row.confirmations,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
@Injectable()
export class ReportsService {
  constructor(
    @Inject(Database) private readonly db: Database,
    @Inject(ReportsGateway) private readonly gateway: ReportsGateway,
  ) {}
  async get(id: string): Promise<CommunityReport> {
    const result = await this.db.pool.query<Row>(select + ' WHERE id=$1', [id]);
    if (!result.rows[0]) throw new NotFoundException('Report not found.');
    return mapRow(result.rows[0]);
  }
  async list(query: ReportsQuery): Promise<ReportsResponse> {
    const values: unknown[] = [];
    const where: string[] = [];
    const param = (v: unknown) => {
      values.push(v);
      return '$' + values.length;
    };
    if (query.countryCode)
      where.push('country_code=' + param(query.countryCode));
    if (query.category) where.push('category=' + param(query.category));
    if (query.bbox) {
      const [west, south, east, north] = query.bbox;
      // Cartesian envelopes keep bbox semantics consistent even above 180 degrees wide.
      where.push(
        'ST_Intersects(location::geometry, ST_MakeEnvelope(' +
          [west, south, east, north].map(param).join(',') +
          ',4326))',
      );
    }
    const result = await this.db.pool.query<Row>(
      select +
        (where.length ? ' WHERE ' + where.join(' AND ') : '') +
        ' ORDER BY created_at DESC,id LIMIT 501',
      values,
    );
    return {
      reports: result.rows.slice(0, 500).map(mapRow),
      truncated: result.rows.length > 500,
    };
  }
  async create(input: CreateReport): Promise<CommunityReport> {
    const result = await this.db.pool.query<{ id: string }>(
      `INSERT INTO reports(country_code,category,title,description,location)
   VALUES ($1,$2,$3,$4,ST_SetSRID(ST_MakePoint($5,$6),4326)::geography) RETURNING id`,
      [
        input.countryCode,
        input.category,
        input.title,
        input.description ?? null,
        input.position.longitude,
        input.position.latitude,
      ],
    );
    const report = await this.get(result.rows[0]!.id);
    this.gateway.created(report);
    return report;
  }
  async confirm(id: string, ip: string): Promise<CommunityReport> {
    const actor = createHmac('sha256', env.IP_HASH_SALT)
      .update(ip)
      .digest('hex');
    const client = await this.db.pool.connect();
    try {
      await client.query('BEGIN');
      const existing = await client.query(
        'SELECT id FROM reports WHERE id=$1 FOR UPDATE',
        [id],
      );
      if (!existing.rowCount) throw new NotFoundException('Report not found.');
      const inserted = await client.query(
        'INSERT INTO report_confirmations(report_id,actor_hash) VALUES ($1,$2) ON CONFLICT DO NOTHING RETURNING report_id',
        [id, actor],
      );
      if (!inserted.rowCount)
        throw new ConflictException(
          'You have already confirmed this report from this network.',
        );
      await client.query(
        'UPDATE reports SET confirmations=confirmations+1,updated_at=now() WHERE id=$1',
        [id],
      );
      const result = await client.query<Row>(select + ' WHERE id=$1', [id]);
      await client.query('COMMIT');
      const report = mapRow(result.rows[0]!);
      this.gateway.confirmed(report);
      return report;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
