import {
  Body,
  Controller,
  Get,
  Inject,
  Module,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  createReportSchema,
  reportsQuerySchema,
  type CreateReport,
  type ReportsQuery,
} from '@geowatch/shared';
import type { Request } from 'express';
import { SchemaPipe } from '../common/validation.js';
import { ReportsService } from './reports.service.js';
import { ReportsGateway } from './reports.gateway.js';
@Controller('reports')
export class ReportsController {
  constructor(
    @Inject(ReportsService) private readonly service: ReportsService,
  ) {}
  @Get() list(@Query(new SchemaPipe(reportsQuerySchema)) q: ReportsQuery) {
    return this.service.list(q);
  }
  @Get(':id') get(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    return this.service.get(id);
  }
  @Post()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  create(@Body(new SchemaPipe(createReportSchema)) input: CreateReport) {
    return this.service.create(input);
  }
  @Post(':id/confirm')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  confirm(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Req() req: Request,
  ) {
    return this.service.confirm(
      id,
      req.ip ?? req.socket.remoteAddress ?? 'unknown',
    );
  }
}
@Module({
  controllers: [ReportsController],
  providers: [ReportsService, ReportsGateway],
})
export class ReportsModule {}
