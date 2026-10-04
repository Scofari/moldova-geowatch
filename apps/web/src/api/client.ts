import type {
  CommunityReport,
  CreateReport,
  RiversResponse,
  SearchResponse,
  WeatherPoint,
  ReportsResponse,
  CountryGeography,
  GeoPosition,
} from '@geowatch/shared';
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}
async function request<T>(url: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      signal: AbortSignal.timeout(12_000),
      headers: { 'Content-Type': 'application/json', ...init?.headers },
    });
  } catch {
    throw new ApiError(
      'Cannot reach the data service. Check your connection and retry.',
      0,
    );
  }
  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as {
      message?: string | string[];
    };
    throw new ApiError(
      typeof data.message === 'string'
        ? data.message
        : 'Request failed. Please try again.',
      response.status,
    );
  }
  return response.json() as Promise<T>;
}
export const api = {
  health: () => request<{ status: string }>('/api/health'),
  geography: (country: string) =>
    request<CountryGeography>(
      '/data/' + country.toLowerCase() + '-geography.json',
    ),
  weather: (p: GeoPosition) =>
    request<WeatherPoint>(
      '/api/weather?lat=' + p.latitude + '&lon=' + p.longitude,
    ),
  rivers: (country: string) =>
    request<RiversResponse>('/api/rivers?countryCode=' + country),
  reports: (params: URLSearchParams) =>
    request<ReportsResponse>('/api/reports?' + params),
  report: (id: string) => request<CommunityReport>('/api/reports/' + id),
  createReport: (input: CreateReport) =>
    request<CommunityReport>('/api/reports', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  confirm: (id: string) =>
    request<CommunityReport>('/api/reports/' + id + '/confirm', {
      method: 'POST',
    }),
  search: (q: string, country: string) =>
    request<SearchResponse>(
      '/api/search?' + new URLSearchParams({ q, countryCode: country }),
    ),
};
