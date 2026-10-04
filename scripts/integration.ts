import assert from 'node:assert/strict';
import { once } from 'node:events';
import { io, type Socket } from 'socket.io-client';
import { Pool } from 'pg';
import { env } from '../apps/api/src/config.js';
import type {
  CommunityReport,
  ReportEvents,
  ReportsResponse,
  WeatherPoint,
  RiversResponse,
  SearchResponse,
} from '@geowatch/shared';
const base = 'http://127.0.0.1:' + env.PORT;
const db = new Pool({ connectionString: env.DATABASE_URL });
const sockets: Socket<ReportEvents, Record<string, never>>[] = [];
let id: string | undefined;
const createdIds: string[] = [];
let checks = 0;
async function request(path: string, init?: RequestInit) {
  return fetch(base + '/api' + path, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    signal: AbortSignal.timeout(15_000),
  });
}
function pass(name: string) {
  checks++;
  console.log('PASS ' + name);
}
function event(
  socket: Socket<ReportEvents, Record<string, never>>,
  name: 'report.created' | 'report.confirmed',
): Promise<CommunityReport> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      socket.off(name, handler);
      reject(new Error('WebSocket event timed out: ' + name));
    }, 5000);
    const handler = (r: CommunityReport) => {
      clearTimeout(timeout);
      socket.off(name, handler);
      resolve(r);
    };
    socket.on(name, handler);
  });
}
try {
  assert.equal((await request('/health')).status, 200);
  pass('health and PostGIS connection');
  for (let i = 0; i < 2; i++) {
    const socket: Socket<ReportEvents, Record<string, never>> = io(base, {
      transports: ['websocket'],
      extraHeaders: { Origin: env.WEB_ORIGIN },
      timeout: 5000,
    });
    sockets.push(socket);
    await once(socket, 'connect', { signal: AbortSignal.timeout(6000) });
  }
  pass('two independent WebSocket clients connect');
  const valid = {
    countryCode: 'MD',
    category: 'road',
    title: 'Integration verification report',
    description: 'Temporary automated verification entry.',
    position: { latitude: 47.01, longitude: 28.86 },
  };
  assert.equal(
    (
      await request('/reports', {
        method: 'POST',
        body: JSON.stringify({
          ...valid,
          position: { latitude: 91, longitude: 28 },
        }),
      })
    ).status,
    400,
  );
  pass('invalid coordinates rejected');
  assert.equal(
    (
      await request('/reports', {
        method: 'POST',
        body: JSON.stringify({ ...valid, category: 'spam' }),
      })
    ).status,
    400,
  );
  pass('invalid category rejected');
  assert.equal(
    (
      await request('/reports', {
        method: 'POST',
        body: JSON.stringify({ ...valid, title: '<script>spam</script>' }),
      })
    ).status,
    400,
  );
  pass('markup rejected');
  const createdEvents = sockets.map((s) => event(s, 'report.created'));
  const created = await request('/reports', {
    method: 'POST',
    body: JSON.stringify(valid),
  });
  assert.equal(created.status, 201);
  const report = (await created.json()) as CommunityReport;
  id = report.id;
  createdIds.push(id);
  assert.equal(report.confirmations, 0);
  const received = await Promise.all(createdEvents);
  assert.ok(received.every((r) => r.id === id));
  pass('creation broadcasts to both clients');
  const detail = (await (
    await request('/reports/' + id)
  ).json()) as CommunityReport;
  assert.equal(detail.title, valid.title);
  pass('report persists in API read');
  const listed = (await (
    await request(
      '/reports?bbox=28.8,46.9,28.9,47.1&category=road&countryCode=MD',
    )
  ).json()) as ReportsResponse;
  assert.ok(listed.reports.some((r) => r.id === id));
  pass('PostGIS bbox and category inclusion');
  const excluded = (await (
    await request('/reports?bbox=26,45,27,46')
  ).json()) as ReportsResponse;
  assert.ok(!excluded.reports.some((r) => r.id === id));
  pass('PostGIS bbox exclusion');
  const filtered = (await (
    await request('/reports?category=flood')
  ).json()) as ReportsResponse;
  assert.ok(!filtered.reports.some((r) => r.id === id));
  pass('category exclusion');
  assert.equal((await request('/reports?bbox=30,49,26,45')).status, 400);
  pass('reversed bbox rejected');
  const confirmedEvents = sockets.map((s) => event(s, 'report.confirmed'));
  const confirmation = await request('/reports/' + id + '/confirm', {
    method: 'POST',
  });
  assert.equal(confirmation.status, 201);
  assert.equal(
    ((await confirmation.json()) as CommunityReport).confirmations,
    1,
  );
  assert.ok(
    (await Promise.all(confirmedEvents)).every((r) => r.confirmations === 1),
  );
  pass('atomic confirmation broadcasts to both clients');
  assert.equal(
    (await request('/reports/' + id + '/confirm', { method: 'POST' })).status,
    409,
  );
  pass('repeated network confirmation rejected');
  const fifth = await request('/reports', {
    method: 'POST',
    body: JSON.stringify(valid),
  });
  assert.equal(fifth.status, 201);
  createdIds.push(((await fifth.json()) as CommunityReport).id);
  assert.equal(
    (await request('/reports', { method: 'POST', body: JSON.stringify(valid) }))
      .status,
    429,
  );
  pass('submission IP rate limiting');
  assert.equal(
    (
      await request('/reports/' + id + '/confirm', {
        method: 'POST',
        headers: { Origin: 'https://untrusted.example' },
      })
    ).status,
    403,
  );
  pass('foreign-origin writes rejected');
  const river = (await (await request('/rivers')).json()) as RiversResponse;
  assert.ok(river.features.some((f) => f.properties.id === 'prut'));
  assert.ok(river.features.some((f) => f.properties.id === 'dniester'));
  assert.ok(river.observations.every((o) => o.source.mode === 'DEMO'));
  pass('real river geometry and DEMO observation distinction');
  const weatherResponse = await request('/weather?lat=47.01&lon=28.86');
  assert.equal(
    weatherResponse.status,
    200,
    await weatherResponse.clone().text(),
  );
  const weather = (await weatherResponse.json()) as WeatherPoint;
  assert.equal(weather.source.mode, 'LIVE');
  assert.equal(typeof weather.temperature, 'number');
  pass('actual Open-Meteo weather request and normalization');
  const searchResponse = await request('/search?q=Orhei&countryCode=MD');
  assert.equal(searchResponse.status, 200);
  const search = (await searchResponse.json()) as SearchResponse;
  assert.ok(search.results.some((r) => /orhei/i.test(r.name)));
  pass('actual location search');
  console.log(checks + ' integration checks passed.');
} finally {
  sockets.forEach((s) => s.disconnect());
  for (const createdId of createdIds)
    await db.query('DELETE FROM reports WHERE id=$1', [createdId]);
  await db.end();
}
