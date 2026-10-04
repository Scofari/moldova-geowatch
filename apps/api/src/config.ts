import { config as dotenv } from 'dotenv';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
dotenv({
  path: fileURLToPath(new URL('../../../.env', import.meta.url)),
  quiet: true,
});
const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  DATABASE_URL: z
    .string()
    .url()
    .default('postgresql://geowatch:geowatch_local@127.0.0.1:5432/geowatch'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  WEB_ORIGIN: z.string().url().default('http://127.0.0.1:5173'),
  IP_HASH_SALT: z
    .string()
    .min(32)
    .default('local-development-only-change-before-deploy'),
  TRUST_PROXY: z.enum(['true', 'false']).default('false'),
  WEATHER_BASE_URL: z
    .string()
    .url()
    .default('https://api.open-meteo.com/v1/forecast'),
  GEOCODING_BASE_URL: z
    .string()
    .url()
    .default('https://geocoding-api.open-meteo.com/v1/search'),
});
export const env = envSchema.parse(process.env);
if (
  env.NODE_ENV === 'production' &&
  env.IP_HASH_SALT === 'local-development-only-change-before-deploy'
)
  throw new Error('Set a private IP_HASH_SALT before production startup.');
export const assetPath = (name: string) =>
  fileURLToPath(new URL('../data/' + name, import.meta.url));
// src/config.ts -> apps/api/data; compiled dist/config.js -> apps/api/data
