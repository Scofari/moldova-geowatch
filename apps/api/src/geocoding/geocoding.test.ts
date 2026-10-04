import { describe, expect, it, vi } from 'vitest';
import { OpenMeteoGeocodingProvider } from './geocoding.js';
describe('geocoding normalization', () => {
  it('normalizes coordinates and discards results from other countries', async () => {
    const fetcher = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          results: [
            {
              id: 1,
              name: 'Orhei',
              latitude: 47.3,
              longitude: 28.8,
              country_code: 'MD',
            },
            {
              id: 2,
              name: 'Elsewhere',
              latitude: 47,
              longitude: 28,
              country_code: 'RO',
            },
          ],
        }),
      ),
    );
    try {
      const result = await new OpenMeteoGeocodingProvider().search(
        'Orhei',
        'MD',
      );
      expect(result.results).toHaveLength(1);
      expect(result.results[0]?.position.latitude).toBe(47.3);
    } finally {
      fetcher.mockRestore();
    }
  });
  it('returns an honest empty result', async () => {
    const fetcher = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('{}'));
    try {
      expect(
        (await new OpenMeteoGeocodingProvider().search('Nothing', 'MD'))
          .results,
      ).toEqual([]);
    } finally {
      fetcher.mockRestore();
    }
  });
});
