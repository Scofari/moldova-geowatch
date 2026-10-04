import { describe, expect, it } from 'vitest';
import { parseEnvironment } from './environment.js';

const production = {
  NODE_ENV: 'production',
  DATABASE_URL: 'postgresql://example.invalid/geowatch',
  WEB_ORIGIN: 'https://example.invalid',
  IP_HASH_SALT: 'verification-only-salt-with-32-characters',
};

describe('deployment environment security', () => {
  it('keeps localhost development defaults usable without secrets', () => {
    expect(parseEnvironment({}).HOST).toBe('127.0.0.1');
    expect(parseEnvironment({}).DATABASE_SSL).toBe('false');
  });
  it('requires an explicit production database', () => {
    expect(() =>
      parseEnvironment({ ...production, DATABASE_URL: undefined }),
    ).toThrow('DATABASE_URL');
  });
  it('rejects the default production confirmation salt', () => {
    expect(() =>
      parseEnvironment({ ...production, IP_HASH_SALT: undefined }),
    ).toThrow('IP_HASH_SALT');
  });
  it('requires a known production origin', () => {
    expect(() =>
      parseEnvironment({ ...production, WEB_ORIGIN: undefined }),
    ).toThrow('WEB_ORIGIN');
  });
  it('derives the exact same origin from Render without hardcoding a URL', () => {
    expect(
      parseEnvironment({
        ...production,
        WEB_ORIGIN: undefined,
        RENDER_EXTERNAL_URL: 'https://render-example.invalid',
      }).WEB_ORIGIN,
    ).toBe('https://render-example.invalid');
  });
  it('rejects origin paths and wildcards', () => {
    expect(() =>
      parseEnvironment({
        ...production,
        WEB_ORIGIN: 'https://example.invalid/path',
      }),
    ).toThrow('exact origin');
    expect(() =>
      parseEnvironment({ ...production, WEB_ORIGIN: '*' }),
    ).toThrow();
  });
  it('requires HTTPS and verified database TLS publicly', () => {
    expect(() =>
      parseEnvironment({ ...production, WEB_ORIGIN: 'http://example.invalid' }),
    ).toThrow('HTTPS');
    expect(() =>
      parseEnvironment({ ...production, DATABASE_SSL: 'false' }),
    ).toThrow('verified TLS');
  });
  it('rejects URL options which can override certificate verification', () => {
    expect(() =>
      parseEnvironment({
        ...production,
        DATABASE_URL: 'postgresql://example.invalid/geowatch?sslmode=no-verify',
      }),
    ).toThrow('SSL URL options');
  });
  it('permits explicit local production smoke testing without database TLS', () => {
    expect(
      parseEnvironment({
        ...production,
        WEB_ORIGIN: 'http://127.0.0.1:3004',
        DATABASE_URL: 'postgresql://127.0.0.1/geowatch',
        DATABASE_SSL: 'false',
      }).DATABASE_SSL,
    ).toBe('false');
  });
});
