import { config as dotenv } from 'dotenv';
import { fileURLToPath } from 'node:url';
import { parseEnvironment } from './environment.js';
dotenv({
  path: fileURLToPath(new URL('../../../.env', import.meta.url)),
  quiet: true,
});
export const env = parseEnvironment(process.env);
export const assetPath = (name: string) =>
  fileURLToPath(new URL('../data/' + name, import.meta.url));
// src/config.ts -> apps/api/data; compiled dist/config.js -> apps/api/data
