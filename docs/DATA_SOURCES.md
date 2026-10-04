# Data sources and usage

Research checked against primary documentation on 2026-10-04. Terms can change; check again before deployment or monetization.

## Base geographic data

**OpenStreetMap contributors** provide normal interactive raster tiles from https://tile.openstreetmap.org/{z}/{x}/{y}.png. Visible map attribution links to [OSM copyright](https://www.openstreetmap.org/copyright). OSM data is ODbL; access to the hosted tile service is governed by the separate [tile usage policy](https://operations.osmfoundation.org/policies/tiles/).

The client uses browser tile loading/cache behavior. No server-side tile proxy, bulk prefetch, download/offline feature or Referer suppression is implemented. No bypass of provider caching or usage limits. VITE_TILE_URL lets an operator replace the service. Preserve appropriate attribution if replacing it. The donated service has no uptime guarantee.

The tile update timestamp is not supplied by the frontend and is not invented.

## Border, places and river geometry

**Natural Earth**, [public-domain terms](https://www.naturalearthdata.com/about/terms-of-use/), 1:10m data. Upstream [natural-earth-vector](https://github.com/nvkelso/natural-earth-vector) tag **v5.1.2**:

- geojson/ne_10m_admin_0_countries.geojson
- geojson/ne_10m_populated_places.geojson
- geojson/ne_10m_rivers_lake_centerlines.geojson

The importer filters country/places ADM0_A3=MDA, extracts Dniester and Prut by upstream names, retains all matching real geometry parts, and normalizes feature properties. Chișinău display spelling is localized from Chisinau. It does not manually draw new river vertices or fabricate locations. Five populated places ship: Chișinău, Bălți, Cahul, Tiraspol and Dubăsari. Orhei, Soroca and Ungheni remain visible on underlying tiles and can be searched; they are not invented static weather stations.

Bundled files:

- apps/web/public/data/md-geography.json
- apps/api/data/md-rivers.json
- apps/api/data/provenance.json

The manifest records upstream version, complete source URLs, extraction time and transformations. retrievedAt is the **extraction** timestamp, not a claim about when geography changed. No original observation timestamp is provided. Geometry is labeled STATIC, generalized and unsuitable for navigation/surveying. Natural Earth uses its own boundary conventions; consult its disputed boundary guidance for additional countries.

`npm run data:refresh` performs a deliberate new extraction. It requires upstream network access but is not needed for normal local startup.

## Weather

**Open-Meteo**, [forecast/current docs](https://open-meteo.com/en/docs), [terms](https://open-meteo.com/en/terms). Endpoint:
https://api.open-meteo.com/v1/forecast

Requested current variables: temperature_2m, wind_speed_10m, precipitation, weather_code. Units are explicitly Celsius, km/h, mm. Unix provider time is converted to a UTC ISO string, avoiding ambiguous timezone parsing.

Current conditions are **weather model output**, not physical station observations. LIVE means retrieved from the real provider; observedAt holds its model-valid time and source.retrievedAt is the successful fetch time. The UI exposes both. Five-minute cache, bounded entries, concurrent request coalescing, eight-second provider timeout and schema validation. Failure produces HTTP 503 and a visible error, never demo weather.

Data license: CC BY 4.0, with visible Open-Meteo attribution. **Free hosted access is noncommercial only**, below 10,000 calls/day, 5,000/hour, 600/minute. The app shares a rolling single-process weather/search budget of 9,500/day, 4,500/hour, 500/minute. Restarting/multiple processes need persistent/shared accounting. Do not add advertising, subscriptions or other commercial use assuming these terms remain valid. Self-hosting/provider replacement needs separate technical and terms review.

## River observations

Official authority pages reviewed:

- [Hydrology forecasts](https://www.meteo.md/index.php/hidrologie/prognoze/)
- [Hydrology forecast directorate](https://www.meteo.md/index.php/despre-noi/hydrology_center_ro/hydro_forecast_ro)

Public human-readable bulletins and PDFs exist. This research did **not verify** a documented, freely reusable machine-readable API for current Moldova station levels. That is not proof none exists. No authority pages are scraped into purported live readings; no guessed API or flood-model discharge is relabeled as a measured water level.

**GeoWatch DEMO fixture** is local synthetic data: DEMO-NISTRU-01 at 2.14 m and DEMO-PRUT-01 at 1.08 m. These IDs do not represent real gauges. Fixed timestamp **2026-01-01T12:00:00Z**, with explicit DEMO status in the response, dashboard and detail panel. Every refresh returns the same fixture; no new timestamp is generated to make it look live. The authority URL is a reference for official information, not the source of the invented measurements.

RiverObservationProvider is independent of real geometry. A future live provider must retain units, station datum, station identifiers, permitted reuse, actual observation time, availability and source attribution. Water levels from different gauges cannot be compared without their datums.

## Geocoding

**Open-Meteo / GeoNames**, [primary geocoding documentation](https://open-meteo.com/en/docs/geocoding-api). Endpoint:
https://geocoding-api.open-meteo.com/v1/search

Explicit submit only, no autocomplete. The server supplies countryCode, limits results to eight, validates provider output, independently discards country mismatches and caches submitted queries for 24 hours. Data attribution links to the provider; GeoNames geographical data is CC BY 4.0. Open-Meteo hosted noncommercial-service restrictions still apply. A LIVE lookup label refers to the HTTP provider lookup, not real-time movement of a place.

**Public Nominatim is not integrated.** Its [policy](https://operations.osmfoundation.org/policies/nominatim/) requires a deliberate informed developer decision, application-wide maximum 1 request/second, identification, attribution, caching and no autocomplete. The selected provider avoids making such requests. A future provider change must obey its own policy.

## Community reports

Actual anonymous user-created local data, never seeded as fake incidents. createdAt/updatedAt come from PostgreSQL. A report is not an official observation even with confirmations. The app stores an HMAC of the network IP for deduplication rather than storing raw confirmation IPs. Administrators must decide retention, moderation and permitted user-content licensing before a public launch.
