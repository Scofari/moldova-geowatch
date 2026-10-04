import {
  Controller,
  Get,
  Inject,
  Injectable,
  Module,
  Query,
} from '@nestjs/common';
import {
  weatherQuerySchema,
  type GeoPosition,
  type WeatherPoint,
} from '@geowatch/shared';
import { z } from 'zod';
import { env } from '../config.js';
import { fetchJson, normalize, RequestCache } from '../common/provider.js';
import { SchemaPipe } from '../common/validation.js';
export interface WeatherProvider {
  current(position: GeoPosition): Promise<WeatherPoint>;
}
const responseSchema = z.object({
  current: z.object({
    time: z.string().datetime({ offset: true }),
    temperature_2m: z.number().finite(),
    wind_speed_10m: z.number().finite().nonnegative(),
    precipitation: z.number().finite().nonnegative(),
    weather_code: z.number().int().min(0).max(99),
  }),
});
export function normalizeWeather(
  raw: unknown,
  position: GeoPosition,
  now = new Date(),
): WeatherPoint {
  const c = normalize(responseSchema, raw).current;
  return {
    position,
    temperature: c.temperature_2m,
    windSpeed: c.wind_speed_10m,
    precipitation: c.precipitation,
    weatherCode: c.weather_code,
    observedAt: c.time,
    source: {
      provider: 'Open-Meteo',
      url: 'https://open-meteo.com/',
      license: 'CC BY 4.0; free endpoint noncommercial only',
      mode: 'LIVE',
      retrievedAt: now.toISOString(),
      notes:
        'Current modeled conditions, not a station measurement. °C, km/h, mm.',
    },
  };
}
@Injectable()
export class OpenMeteoWeatherProvider implements WeatherProvider {
  async current(position: GeoPosition): Promise<WeatherPoint> {
    const url = new URL(env.WEATHER_BASE_URL);
    url.search = new URLSearchParams({
      latitude: String(position.latitude),
      longitude: String(position.longitude),
      current: 'temperature_2m,wind_speed_10m,precipitation,weather_code',
      timezone: 'GMT',
      wind_speed_unit: 'kmh',
      temperature_unit: 'celsius',
      precipitation_unit: 'mm',
      timeformat: 'unixtime',
    }).toString();
    const raw = await fetchJson(url);
    // Unix timestamps avoid ambiguous timezone strings.
    const unixSchema = z.object({
      current: z.object({ time: z.number().int() }).passthrough(),
    });
    const data = normalize(unixSchema, raw);
    return normalizeWeather(
      {
        current: {
          ...data.current,
          time: new Date(data.current.time * 1000).toISOString(),
        },
      },
      position,
    );
  }
}
@Injectable()
export class WeatherService {
  private cache = new RequestCache<WeatherPoint>(5 * 60_000);
  constructor(
    @Inject(OpenMeteoWeatherProvider)
    private readonly provider: WeatherProvider,
  ) {}
  get(position: GeoPosition) {
    return this.cache.get(
      position.latitude.toFixed(4) + ',' + position.longitude.toFixed(4),
      () => this.provider.current(position),
    );
  }
}
@Controller('weather')
export class WeatherController {
  constructor(
    @Inject(WeatherService) private readonly service: WeatherService,
  ) {}
  @Get()
  get(
    @Query(new SchemaPipe(weatherQuerySchema))
    query: {
      lat: number;
      lon: number;
    },
  ) {
    return this.service.get({ latitude: query.lat, longitude: query.lon });
  }
}
@Module({
  controllers: [WeatherController],
  providers: [WeatherService, OpenMeteoWeatherProvider],
})
export class WeatherModule {}
