import { z } from 'zod';
import type {
  Feature,
  LineString,
  MultiLineString,
  MultiPolygon,
  Polygon,
} from 'geojson';

export const categorySchema = z.enum([
  'road',
  'flood',
  'accident',
  'weather',
  'infrastructure',
  'other',
]);
export type ReportCategory = z.infer<typeof categorySchema>;
export const categoryLabels: Record<ReportCategory, string> = {
  road: 'Road problem',
  flood: 'Flooding',
  accident: 'Accident',
  weather: 'Weather',
  infrastructure: 'Infrastructure',
  other: 'Other',
};
export const positionSchema = z
  .object({
    latitude: z.number().finite().min(-90).max(90),
    longitude: z.number().finite().min(-180).max(180),
  })
  .strict();
export type GeoPosition = z.infer<typeof positionSchema>;
export const countryCodeSchema = z
  .string()
  .regex(/^[A-Z]{2}$/, 'Use an uppercase ISO alpha-2 country code')
  .refine((code) => {
    try {
      return (
        new Intl.DisplayNames(['en'], { type: 'region', fallback: 'none' }).of(
          code,
        ) !== undefined
      );
    } catch {
      return false;
    }
  }, 'Unknown ISO country code');
const plainText = (min: number, max: number) =>
  z
    .string()
    .trim()
    .min(min)
    .max(max)
    .refine(
      (text) =>
        !/[<>]/.test(text) &&
        !Array.from(text).some((character) => {
          const code = character.charCodeAt(0);
          return code < 32 && code !== 9 && code !== 10 && code !== 13;
        }),
      'Use plain text without markup or control characters',
    );
export const createReportSchema = z
  .object({
    position: positionSchema,
    countryCode: countryCodeSchema,
    category: categorySchema,
    title: plainText(5, 120),
    description: plainText(0, 1500).optional(),
  })
  .strict();
export type CreateReport = z.infer<typeof createReportSchema>;
export interface CommunityReport extends CreateReport {
  id: string;
  confirmations: number;
  createdAt: string;
  updatedAt: string;
}
export const bboxSchema = z
  .string()
  .refine(
    (value) => value.split(',').every((part) => part.trim().length > 0),
    'bbox coordinates cannot be blank',
  )
  .transform((value) => value.split(',').map(Number))
  .refine(
    (values) => values.length === 4 && values.every(Number.isFinite),
    'bbox needs four numbers',
  )
  .refine(
    ([west, south, east, north]) =>
      west !== undefined &&
      south !== undefined &&
      east !== undefined &&
      north !== undefined &&
      west >= -180 &&
      east <= 180 &&
      south >= -90 &&
      north <= 90 &&
      west < east &&
      south < north,
    'bbox must be ordered west,south,east,north within coordinate limits',
  )
  .transform((value) => value as [number, number, number, number]);
export const reportsQuerySchema = z
  .object({
    bbox: bboxSchema.optional(),
    category: categorySchema.optional(),
    countryCode: countryCodeSchema.optional(),
  })
  .strict();
export type ReportsQuery = z.infer<typeof reportsQuerySchema>;
const numericQuery = z
  .string()
  .trim()
  .min(1)
  .regex(/^-?\d+(\.\d+)?$/)
  .transform(Number);
export const weatherQuerySchema = z
  .object({
    lat: numericQuery.pipe(z.number().finite().min(-90).max(90)),
    lon: numericQuery.pipe(z.number().finite().min(-180).max(180)),
  })
  .strict();
export const searchQuerySchema = z
  .object({
    q: plainText(2, 100),
    countryCode: countryCodeSchema.default('MD'),
  })
  .strict();
export interface DataSource {
  provider: string;
  url: string;
  license: string;
  mode: 'LIVE' | 'DEMO' | 'STATIC';
  retrievedAt: string;
  notes: string;
}
export interface WeatherPoint {
  position: GeoPosition;
  temperature: number;
  windSpeed: number;
  precipitation: number;
  weatherCode: number;
  observedAt: string;
  source: DataSource;
  name?: string;
}
export type RiverStatus =
  'normal' | 'low' | 'very_low' | 'high' | 'flood_warning' | 'unknown';
export type RiverFeature = Feature<
  LineString | MultiLineString,
  {
    id: string;
    name: string;
    alternateNames: string[];
  }
>;
export interface RiverObservation {
  riverId: string;
  stationId: string;
  waterLevel: number | null;
  unit: 'm';
  status: RiverStatus;
  observedAt: string;
  source: DataSource;
}
export interface RiversResponse {
  features: RiverFeature[];
  observations: RiverObservation[];
  source: DataSource;
}
export interface LocationResult {
  id: string;
  name: string;
  countryCode: string;
  region?: string;
  position: GeoPosition;
}
export interface SearchResponse {
  results: LocationResult[];
  source: DataSource;
}
export interface CountryConfig {
  code: string;
  name: string;
  center: GeoPosition;
  zoom: number;
  bounds: [number, number, number, number];
}
export const countries: Record<string, CountryConfig> = {
  MD: {
    code: 'MD',
    name: 'Moldova',
    center: { latitude: 47.05, longitude: 28.65 },
    zoom: 7,
    bounds: [26.6, 45.45, 30.15, 48.55],
  },
};
export interface CountryGeography {
  border: Feature<Polygon | MultiPolygon>;
  cities: { name: string; position: GeoPosition }[];
  source: DataSource;
}
export interface ReportsResponse {
  reports: CommunityReport[];
  truncated: boolean;
}
export interface ReportEvents {
  'report.created': (report: CommunityReport) => void;
  'report.confirmed': (report: CommunityReport) => void;
}
export function weatherDescription(code: number): string {
  if (code === 0) return 'Clear sky';
  if (code <= 3) return 'Cloudy';
  if (code <= 48) return 'Fog';
  if (code <= 67) return 'Rain';
  if (code <= 77) return 'Snow';
  if (code <= 82) return 'Rain showers';
  if (code <= 86) return 'Snow showers';
  return 'Thunderstorm';
}
