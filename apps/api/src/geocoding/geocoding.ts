import {
  Controller,
  Get,
  Inject,
  Injectable,
  Module,
  Query,
} from '@nestjs/common';
import { searchQuerySchema, type SearchResponse } from '@geowatch/shared';
import { z } from 'zod';
import { env } from '../config.js';
import { fetchJson, normalize, RequestCache } from '../common/provider.js';
import { SchemaPipe } from '../common/validation.js';
export interface GeocodingProvider {
  search(query: string, countryCode: string): Promise<SearchResponse>;
}
const responseSchema = z.object({
  results: z
    .array(
      z.object({
        id: z.number(),
        name: z.string(),
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
        country_code: z.string().length(2),
        admin1: z.string().optional(),
      }),
    )
    .optional(),
});
@Injectable()
export class OpenMeteoGeocodingProvider implements GeocodingProvider {
  async search(query: string, countryCode: string): Promise<SearchResponse> {
    const url = new URL(env.GEOCODING_BASE_URL);
    url.search = new URLSearchParams({
      name: query,
      count: '8',
      language: 'en',
      countryCode,
    }).toString();
    const data = normalize(responseSchema, await fetchJson(url));
    return {
      results: (data.results ?? [])
        .filter((r) => r.country_code.toUpperCase() === countryCode)
        .map((r) => ({
          id: String(r.id),
          name: r.name,
          region: r.admin1,
          countryCode: r.country_code.toUpperCase(),
          position: { latitude: r.latitude, longitude: r.longitude },
        })),
      source: {
        provider: 'Open-Meteo / GeoNames',
        url: 'https://open-meteo.com/en/docs/geocoding-api',
        license: 'GeoNames CC BY 4.0; Open-Meteo free service noncommercial',
        mode: 'LIVE',
        retrievedAt: new Date().toISOString(),
        notes:
          'Place index; LIVE indicates a provider lookup, not changing place coordinates.',
      },
    };
  }
}
@Injectable()
export class GeocodingService {
  private cache = new RequestCache<SearchResponse>(24 * 60 * 60_000, 500);
  constructor(
    @Inject(OpenMeteoGeocodingProvider)
    private readonly provider: GeocodingProvider,
  ) {}
  search(q: string, countryCode: string) {
    return this.cache.get(countryCode + ':' + q.toLocaleLowerCase(), () =>
      this.provider.search(q, countryCode),
    );
  }
}
@Controller('search')
export class GeocodingController {
  constructor(
    @Inject(GeocodingService) private readonly service: GeocodingService,
  ) {}
  @Get()
  get(
    @Query(new SchemaPipe(searchQuerySchema))
    q: {
      q: string;
      countryCode: string;
    },
  ) {
    return this.service.search(q.q, q.countryCode);
  }
}
@Module({
  controllers: [GeocodingController],
  providers: [GeocodingService, OpenMeteoGeocodingProvider],
})
export class GeocodingModule {}
