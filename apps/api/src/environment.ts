import { z } from 'zod';

const localSalt = 'local-development-only-change-before-deploy';
const schema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  DATABASE_URL: z
    .string()
    .url()
    .default('postgresql://geowatch:geowatch_local@127.0.0.1:5432/geowatch'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  HOST: z.string().min(1).default('127.0.0.1'),
  WEB_ORIGIN: z.string().url().default('http://127.0.0.1:5173'),
  IP_HASH_SALT: z.string().min(32).default(localSalt),
  TRUST_PROXY: z.enum(['true', 'false']).default('false'),
  SERVE_WEB: z.enum(['true', 'false']).default('false'),
  DATABASE_SSL: z.enum(['true', 'false']).default('false'),
  DATABASE_CA_CERT: z.string().min(1).optional(),
  WEATHER_BASE_URL: z
    .string()
    .url()
    .default('https://api.open-meteo.com/v1/forecast'),
  GEOCODING_BASE_URL: z
    .string()
    .url()
    .default('https://geocoding-api.open-meteo.com/v1/search'),
});

export function parseEnvironment(input: Record<string, string | undefined>) {
  const production = input.NODE_ENV === 'production';
  const env = schema.parse({
    ...input,
    WEB_ORIGIN:
      input.WEB_ORIGIN ?? (production ? input.RENDER_EXTERNAL_URL : undefined),
    DATABASE_SSL: input.DATABASE_SSL ?? (production ? 'true' : 'false'),
  });
  const origin = new URL(env.WEB_ORIGIN);
  const database = new URL(env.DATABASE_URL);
  if (!['postgres:', 'postgresql:'].includes(database.protocol))
    throw new Error('DATABASE_URL must be a PostgreSQL connection URL.');
  if (origin.origin !== env.WEB_ORIGIN)
    throw new Error(
      'WEB_ORIGIN must be one exact origin without a path or trailing slash.',
    );
  if (production) {
    if (!input.DATABASE_URL)
      throw new Error('Set a private DATABASE_URL before production startup.');
    if (env.IP_HASH_SALT === localSalt)
      throw new Error('Set a private IP_HASH_SALT before production startup.');
    if (!input.WEB_ORIGIN && !input.RENDER_EXTERNAL_URL)
      throw new Error('Set WEB_ORIGIN before production startup.');
    const local = ['127.0.0.1', 'localhost', '[::1]'].includes(origin.hostname);
    if (origin.protocol !== 'https:' && !local)
      throw new Error('Public production WEB_ORIGIN must use HTTPS.');
    const localDatabase = ['127.0.0.1', 'localhost', '[::1]'].includes(
      database.hostname,
    );
    if (env.DATABASE_SSL !== 'true' && !localDatabase)
      throw new Error(
        'Public production database connections must use verified TLS.',
      );
  }
  // URL SSL options otherwise override node-postgres certificate verification.
  if (
    env.DATABASE_SSL === 'true' &&
    ['sslmode', 'sslcert', 'sslkey', 'sslrootcert', 'ssl'].some((key) =>
      database.searchParams.has(key),
    )
  )
    throw new Error(
      'Remove SSL URL options; use DATABASE_SSL and DATABASE_CA_CERT for verified TLS.',
    );
  return env;
}
