import { ServiceUnavailableException } from '@nestjs/common';
import { z } from 'zod';
export async function fetchJson(
  url: URL,
  fetcher: typeof fetch = fetch,
): Promise<unknown> {
  enforceProviderBudget();
  try {
    const response = await fetcher(url, {
      signal: AbortSignal.timeout(8000),
      headers: {
        'User-Agent': 'MoldovaGeoWatch/0.1 (local open-data dashboard)',
      },
    });
    if (!response.ok) throw new Error('Provider HTTP ' + response.status);
    return await response.json();
  } catch {
    throw new ServiceUnavailableException(
      'External data provider is unavailable. Please retry later.',
    );
  }
}
// Combined weather/search budget below Open-Meteo free service ceilings.
// Single-process only: distributed deployment needs a shared quota store.
const windows = [
  { duration: 60_000, limit: 500 },
  { duration: 3_600_000, limit: 4500 },
  { duration: 86_400_000, limit: 9500 },
];
let requestTimes: number[] = [];
function enforceProviderBudget() {
  const now = Date.now();
  requestTimes = requestTimes.filter((time) => now - time < 86_400_000);
  for (const window of windows) {
    const cutoff = requestTimes[requestTimes.length - window.limit];
    if (cutoff !== undefined && now - cutoff < window.duration)
      throw new ServiceUnavailableException(
        'External provider request budget reached. Try later.',
      );
  }
  requestTimes.push(now);
}
export function normalize<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success)
    throw new ServiceUnavailableException(
      'External data provider returned an invalid response.',
    );
  return result.data;
}
export class RequestCache<T> {
  private entries = new Map<string, { value: T; expires: number }>();
  private pending = new Map<string, Promise<T>>();
  constructor(
    private readonly ttl: number,
    private readonly max = 1000,
  ) {}
  async get(key: string, loader: () => Promise<T>): Promise<T> {
    const hit = this.entries.get(key);
    if (hit && hit.expires > Date.now()) return hit.value;
    const running = this.pending.get(key);
    if (running) return running;
    const promise = loader()
      .then((value) => {
        if (this.entries.size >= this.max)
          this.entries.delete(this.entries.keys().next().value!);
        this.entries.set(key, { value, expires: Date.now() + this.ttl });
        return value;
      })
      .finally(() => this.pending.delete(key));
    this.pending.set(key, promise);
    return promise;
  }
}
