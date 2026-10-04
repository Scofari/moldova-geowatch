import {
  Controller,
  Get,
  Inject,
  Injectable,
  Module,
  Query,
  NotFoundException,
} from '@nestjs/common';
import { readFile } from 'node:fs/promises';
import {
  countries,
  countryCodeSchema,
  type RiverObservation,
  type RiversResponse,
} from '@geowatch/shared';
import { z } from 'zod';
import { assetPath } from '../config.js';
import { SchemaPipe } from '../common/validation.js';
export interface RiverObservationProvider {
  observations(countryCode: string): Promise<RiverObservation[]>;
}
export function demoObservations(): RiverObservation[] {
  return [
    {
      riverId: 'dniester',
      stationId: 'DEMO-NISTRU-01',
      waterLevel: 2.14,
      status: 'normal' as const,
    },
    {
      riverId: 'prut',
      stationId: 'DEMO-PRUT-01',
      waterLevel: 1.08,
      status: 'low' as const,
    },
  ].map((item) => ({
    ...item,
    unit: 'm',
    observedAt: '2026-01-01T12:00:00.000Z',
    source: {
      provider: 'GeoWatch DEMO fixture',
      url: 'https://www.meteo.md/index.php/hidrologie/prognoze/',
      license: 'Synthetic fixtures; no real station readings',
      mode: 'DEMO',
      retrievedAt: '2026-01-01T12:00:00.000Z',
      notes:
        'Invented measurement at a synthetic station. Not a flood warning or official observation.',
    },
  }));
}
@Injectable()
export class DemoRiverObservationProvider implements RiverObservationProvider {
  async observations(countryCode: string) {
    return countryCode === 'MD' ? demoObservations() : [];
  }
}
@Injectable()
export class RiversService {
  constructor(
    @Inject(DemoRiverObservationProvider)
    private readonly provider: RiverObservationProvider,
  ) {}
  async get(countryCode: string): Promise<RiversResponse> {
    if (!countries[countryCode])
      throw new NotFoundException('Country geography has not been imported.');
    const geometry = JSON.parse(
      await readFile(
        assetPath(countryCode.toLowerCase() + '-rivers.json'),
        'utf8',
      ),
    ) as Pick<RiversResponse, 'features' | 'source'>;
    return {
      ...geometry,
      observations: await this.provider.observations(countryCode),
    };
  }
}
@Controller('rivers')
export class RiversController {
  constructor(@Inject(RiversService) private readonly service: RiversService) {}
  @Get()
  get(
    @Query(
      new SchemaPipe(
        z.object({ countryCode: countryCodeSchema.default('MD') }).strict(),
      ),
    )
    q: {
      countryCode: string;
    },
  ) {
    return this.service.get(q.countryCode);
  }
}
@Module({
  controllers: [RiversController],
  providers: [RiversService, DemoRiverObservationProvider],
})
export class RiversModule {}
