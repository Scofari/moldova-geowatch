# API contracts

Base: http://127.0.0.1:3001/api. JSON only for report writes. API listens on localhost by default. Errors: 400 invalid input, 404 missing report/country import, 409 repeated network confirmation, 429 rate limit, 503 provider/database unavailable.

## Create report

```http
POST /api/reports
Content-Type: application/json

{
  "countryCode": "MD",
  "category": "road",
  "title": "Damaged surface near the bridge",
  "description": "Visible potholes in the northbound lane.",
  "position": { "latitude": 47.01, "longitude": 28.86 }
}
```

Returns HTTP 201 CommunityReport with UUID, position, category, normalized plain title/description, countryCode, confirmations=0 and UTC createdAt/updatedAt. Trimmed title 5–120 characters; optional description max 1500. Reject markup, control characters, unknown keys/categories/country codes and nonfinite/out-of-range coordinates. Geographic position is stored once as a PostGIS point.

Country is user-supplied context and validated as an ISO code; it is not independently inferred from an authoritative polygon. This avoids claiming political jurisdiction for cartographic edge cases. A verified jurisdiction check remains a future product decision.

## Read and filter

`GET /reports/:id`: UUID v4, 404 if absent.

`GET /reports?countryCode=MD&category=flood&bbox=26.6,45.45,30.15,48.55`

bbox order: **minLon,minLat,maxLon,maxLat**. Strict ordered coordinate limits, four finite numbers, no blank entries. Antimeridian-crossing boxes are not accepted; split into two boxes in a future worldwide client. Every filter is optional and SQL-parameterized. Exact rectangular geometry intersection includes boundaries. Results ordered newest first, then id; max 500, response `{ reports: CommunityReport[], truncated: boolean }`.

## Confirm

`POST /reports/:id/confirm`, empty JSON body permitted.

Returns HTTP 201 updated CommunityReport. A row-locked transaction inserts a unique (reportId, actorHash), increments the count and commits before broadcasting. Duplicate HMAC-network confirmation returns 409 without increasing count. One shared NAT address is one actor. TRUST_PROXY defaults false so clients cannot forge actor IPs through X-Forwarded-For.

## Weather

`GET /weather?lat=47.01&lon=28.86`

Returns position, temperature (°C), windSpeed (km/h), precipitation (mm), weatherCode (WMO), observedAt (model-valid UTC time) and source. The source includes provider, url, license, mode=LIVE, retrievedAt and notes explicitly stating modeled conditions. No raw provider structures reach the frontend. Cache five minutes; coalesced concurrent requests. Provider HTTP/network/shape failure returns 503.

## Rivers

`GET /rivers?countryCode=MD`

`{ features: RiverFeature[], observations: RiverObservation[], source: DataSource }`

Each GeoJSON Feature retains a real LineString/MultiLineString and normalized id/name/alternateNames. The response source is STATIC Natural Earth geometry. Each **observation** has independent source mode=DEMO, riverId, synthetic stationId, waterLevel, m unit, status and fixed observedAt. Never infer observation provenance from the geometry's source.

## Search

`GET /search?q=Orhei&countryCode=MD`

Query 2–100 trimmed plain-text characters. Country defaults MD. Returns normalized results with id, name, optional region, countryCode, position plus source. Empty arrays are valid. Only explicit submit is used by the client, with 24-hour caching.

## Health

`GET /health` verifies the DB and PostGIS extension, returns status=ok, database=connected, PostGIS version, riverObservations=DEMO, default map policy and server timestamp. It does not claim that all external providers are currently reachable.

## Events, origin and rate limits

Socket.IO uses /socket.io. Server-to-client events `report.created`, `report.confirmed` carry CommunityReport. Subscribe after connect; invalidate current filters on events and reconnect. Broadcasts are after database writes; delivery is best effort, reconciled by refetch. No inbound write socket events exist.

HTTP CORS accepts WEB_ORIGIN, methods GET/POST, Content-Type. Foreign Origin headers are explicitly rejected on unsafe writes. WebSocket handshakes check the same origin; non-browser clients without Origin can subscribe. There is no socket authentication or moderation.

Default HTTP budget 120 requests per minute/IP; create 5/minute/IP; confirm 20/minute/IP. Invalid attempts count too. Limits live in memory, so restart resets them. Weather/search provider requests share a rolling single-process quota below the free-service limits. Distributed/persistent rate limiting is required before horizontal scaling.
