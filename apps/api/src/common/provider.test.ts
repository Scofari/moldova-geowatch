import { describe, expect, it, vi } from 'vitest';
import { fetchJson, RequestCache } from './provider.js';
describe('provider resilience', () => {
  it('turns network failure into an explicit availability error', async () => {
    await expect(
      fetchJson(
        new URL('https://example.com'),
        vi.fn().mockRejectedValue(new Error('offline')),
      ),
    ).rejects.toThrow('unavailable');
  });
  it('does not cache failures', async () => {
    const cache = new RequestCache<number>(1000);
    const loader = vi
      .fn()
      .mockRejectedValueOnce(new Error('failure'))
      .mockResolvedValueOnce(42);
    await expect(cache.get('k', loader)).rejects.toThrow();
    expect(await cache.get('k', loader)).toBe(42);
  });
  it('expires cached responses', async () => {
    const cache = new RequestCache<number>(10);
    const loader = vi.fn().mockResolvedValue(42);
    vi.useFakeTimers();
    try {
      await cache.get('k', loader);
      vi.advanceTimersByTime(11);
      await cache.get('k', loader);
      expect(loader).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });
});
