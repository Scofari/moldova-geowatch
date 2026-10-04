import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { Database } from './db/database.js';
import { WeatherModule } from './weather/weather.js';
import { RiversModule } from './rivers/rivers.js';
import { ReportsModule } from './reports/reports.controller.js';
import { GeocodingModule } from './geocoding/geocoding.js';
import { HealthModule } from './health/health.js';
@Global()
@Module({ providers: [Database], exports: [Database] })
class DatabaseModule {}
@Module({
  imports: [
    DatabaseModule,
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    WeatherModule,
    RiversModule,
    ReportsModule,
    GeocodingModule,
    HealthModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
