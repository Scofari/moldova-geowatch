import { describe, expect, it } from 'vitest';
import {
  bboxSchema,
  createReportSchema,
  countryCodeSchema,
  positionSchema,
  reportsQuerySchema,
  weatherDescription,
  weatherQuerySchema,
} from './index.js';
const valid = {
  position: { latitude: 47, longitude: 28 },
  countryCode: 'MD',
  category: 'road',
  title: 'Damaged road',
};
describe('report contracts', () => {
  it('trims plain text and keeps country-neutral coordinates', () => {
    expect(
      createReportSchema.parse({
        ...valid,
        countryCode: 'RO',
        title: '  Damaged road  ',
      }).title,
    ).toBe('Damaged road');
  });
  it.each([
    { latitude: 91, longitude: 28 },
    { latitude: 47, longitude: -181 },
    { latitude: NaN, longitude: 28 },
    { latitude: '47', longitude: 28 },
  ])('rejects invalid position %j', (position) => {
    expect(createReportSchema.safeParse({ ...valid, position }).success).toBe(
      false,
    );
  });
  it.each([
    { category: 'invalid' },
    { title: '<b>Road</b>' },
    { title: 'tiny' },
    { description: 'x'.repeat(1501) },
    { unexpected: true },
  ])('rejects invalid fields %j', (fields) => {
    expect(createReportSchema.safeParse({ ...valid, ...fields }).success).toBe(
      false,
    );
  });
  it('accepts world edge coordinates', () => {
    expect(
      positionSchema.parse({ latitude: 90, longitude: -180 }),
    ).toBeTruthy();
  });
  it('requires recognized ISO country codes', () => {
    expect(countryCodeSchema.safeParse('XX').success).toBe(false);
  });
});
describe('query contracts', () => {
  it('normalizes an ordered bbox', () => {
    expect(bboxSchema.parse('26,45,30,49')).toEqual([26, 45, 30, 49]);
  });
  it.each([
    '30,49,26,45',
    '-181,45,30,49',
    '26,45,30',
    '26,45,NaN,49',
    '26,,30,49',
  ])('rejects bad bbox %s', (value) => {
    expect(bboxSchema.safeParse(value).success).toBe(false);
  });
  it('preserves category filtering', () => {
    expect(reportsQuerySchema.parse({ category: 'flood' }).category).toBe(
      'flood',
    );
  });
  it('rejects unknown category', () => {
    expect(reportsQuerySchema.safeParse({ category: 'spam' }).success).toBe(
      false,
    );
  });
  it('normalizes numeric query coordinates', () => {
    expect(weatherQuerySchema.parse({ lat: '47.01', lon: '28.86' })).toEqual({
      lat: 47.01,
      lon: 28.86,
    });
  });
  it('rejects blank query coordinates', () => {
    expect(weatherQuerySchema.safeParse({ lat: '', lon: '28' }).success).toBe(
      false,
    );
  });
  it('describes WMO codes', () => {
    expect(weatherDescription(0)).toBe('Clear sky');
    expect(weatherDescription(95)).toBe('Thunderstorm');
  });
});
