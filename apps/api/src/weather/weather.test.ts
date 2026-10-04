import { describe, expect, it, vi } from 'vitest';
import {
  normalizeWeather,
  OpenMeteoWeatherProvider,
  WeatherService,
} from './weather.js';
const position = { latitude: 47, longitude: 28 };
const raw = {
  current: {
    time: '2026-01-01T12:00:00Z',
    temperature_2m: 15,
    wind_speed_10m: 12,
    precipitation: 0,
    weather_code: 3,
  },
};
describe('weather integration contract', () => {
  it('normalizes units and labels actual provider data LIVE', () => {
    const data = normalizeWeather(raw, position);
    expect(data).toMatchObject({
      temperature: 15,
      windSpeed: 12,
      precipitation: 0,
      weatherCode: 3,
      position,
    });
    expect(data.source.mode).toBe('LIVE');
    expect(data.source.notes).toContain('modeled');
  });
  it('rejects incomplete provider data instead of inventing readings', () => {
    expect(() => normalizeWeather({ current: {} }, position)).toThrow(
      'invalid response',
    );
  });
  it('rejects impossible precipitation', () => {
    expect(() =>
      normalizeWeather(
        { current: { ...raw.current, precipitation: -1 } },
        position,
      ),
    ).toThrow();
  });
  it('caches normalized results and coalesces concurrent loads', async () => {
    const provider = {
      current: vi.fn().mockResolvedValue(normalizeWeather(raw, position)),
    };
    const service = new WeatherService(provider);
    await Promise.all([service.get(position), service.get(position)]);
    expect(provider.current).toHaveBeenCalledTimes(1);
  });
  it('converts real endpoint Unix time to UTC', async () => {
    const fetcher = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(
          JSON.stringify({ current: { ...raw.current, time: 1767268800 } }),
        ),
      );
    try {
      const data = await new OpenMeteoWeatherProvider().current(position);
      expect(data.observedAt).toBe('2026-01-01T12:00:00.000Z');
    } finally {
      fetcher.mockRestore();
    }
  });
  it('surfaces HTTP failures without demo fallback', async () => {
    const fetcher = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('{}', { status: 503 }));
    try {
      await expect(
        new OpenMeteoWeatherProvider().current(position),
      ).rejects.toThrow('unavailable');
    } finally {
      fetcher.mockRestore();
    }
  });
});
