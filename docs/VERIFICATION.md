# Verification record

Performed on 2026-10-04, Windows, Node 24.18.0 / npm 11.16.0, actual Docker PostgreSQL 17/PostGIS 3.5 container.

## Automated results

| Check                                      | Result                                                     |
| ------------------------------------------ | ---------------------------------------------------------- |
| npm run lint                               | Pass, no lint findings                                     |
| npm run typecheck                          | Pass, all three workspaces                                 |
| npm run test                               | 37 passed across five files                                |
| npm run build                              | Shared, Nest API and Vite production frontend pass         |
| npm run format:check                       | Pass                                                       |
| npm audit                                  | Zero reported advisories in final lockfile                 |
| npm run test:integration                   | 18 passed against development and compiled production APIs |
| Isolated lockfile npm ci                   | Pass                                                       |
| Isolated source build/tests/lint/typecheck | Pass; 37 tests                                             |

The production API was started from `apps/api/dist/main.js` with production environment validation, a private ephemeral salt, port 3003 and origin http://127.0.0.1:4173. Production frontend preview served compiled assets on 4173 and proxied to that API. The production browser showed real weather at all five imported places, connected real-time status and no captured error/warning console messages.

Integration checks verified: health/PostGIS; two independently connected WebSocket clients; invalid coordinates/category/markup rejection; report creation and two-client events; persistent read; bbox inclusion/exclusion; category filtering; invalid bbox rejection; atomic confirmation and two-client count updates; duplicate confirmation rejection; sixth-submission rate rejection; foreign-origin writes rejection; both real river geometries with DEMO observations; actual Open-Meteo weather; actual Orhei geocoding. The test runner removes only IDs it created.

## Manual browser checks

- Country map, pan/zoom controls and search-selected zoom/location.
- Five actual provider weather markers; Chișinău detail shows temperature, wind, precipitation, model time, retrieval time and attribution.
- Nistru and Prut real paths rendered; river detail and selector expose fixed synthetic water readings as DEMO.
- Independent weather toggle removes markers; turning it back on restores them. Layer state does not recreate the map.
- Report selection on the map, title/description submission and success notice. New marker/activity appeared in a second browser without refresh.
- Report remained after browser reload. Confirmation updated the first detail panel and second browser count without refresh.
- Mobile CSS viewport 390×844: no horizontal document overflow, map fills the workspace, layers/filter drawer opens and closes, river readings accessible, location selection expands the compact report panel.
- Marker clicks while reporting select that marker's position rather than silently swallowing the click.
- Data-source dialog focuses its close control, Escape closes it and focus returns to its opener. Mobile drawer focuses its close control.
- Map adapter reinitialization replays layers; verified all three real river path parts after the lifecycle correction.

Screenshots: [desktop](screenshots/dashboard.jpg), [mobile](screenshots/mobile.jpg). Screenshot weather is the provider result at capture time, not a fixed seeded weather fixture.

All temporary browser/integration reports were removed after verification; no incident data was seeded. No `.env`, API keys, customer SDK or license file was added. The initial workspace had no Git history; a repository was initialized for publication. Compose/backend defaults are intentional localhost-only examples; `.env.example` contains commented placeholders only.

## Publication audit

Repeated lint, formatting, typecheck, all 37 unit tests, production build and all 18 integration checks on 2026-10-04. The actual Docker PostGIS container was healthy; npm audit reported zero vulnerabilities. A lightweight scan of all 76 publishable files found no private keys, recognizable access tokens, nonlocal database credentials or machine-specific paths. Ignored files include dependencies, generated builds, local runtime/cache files, environment secrets, SDK licenses, private certificates, database dumps and IDE settings. There was no pre-existing Git history to scan.

## Unverified or unsupported

- Actual LuciadRIA rendering: unavailable SDK/license; only the legal integration boundary is supplied.
- Live river water observations: no verified permitted machine-readable source connected.
- Real mobile hardware/touch behavior, multi-instance operation and large-data performance were not tested. Public deployment was subsequently verified below.
- Clean installation/build/tests were repeated in an isolated source directory. Provider and DB flows were tested against the real local running stack, not a newly provisioned cloud environment.

The MVP is locally verified. These results do not establish suitability as an emergency warning system or a broadly public unmoderated service.

## Deployment preparation verification

On 2026-10-04, after deployment configuration changes:

- Lint, all-workspace typecheck, formatting and production build passed. All **46 tests** across six files passed, including nine deployment environment security tests.
- All **18 integration checks** passed against the compiled production API serving the compiled frontend on the same local origin. A first attempt had no provider network access under the local sandbox and correctly returned 503; the unchanged checks passed after the API was restarted with authorized network access.
- Frontend HTML and hashed assets returned 200; hashed assets had immutable caching. Unknown API routes and `.env` returned JSON 404 instead of leaking files or serving HTML.
- Same-origin browser smoke check showed all five real modeled weather markers, rendered river paths, visibly DEMO river detail and connected real-time status. Captured browser error/warning logs were empty. A 390×844 viewport had no horizontal overflow; temporary viewport overrides were cleared.
- An isolated, initially extension-free local database passed fresh `gis` PostGIS setup, both migrations, repeated idempotent migration runs, GiST-index/RLS verification and a real spatial intersection. That temporary database was removed after the check.
- Supabase Free project is active: PostgreSQL 17/PostGIS 3.3.7 in `gis`, migrations 1 and 2, expected tables/indexes, successful spatial query and zero reports. Anonymous/authenticated Data API table access is revoked. Security advisor has no error/warning findings; three informational no-policy findings reflect deliberate denial of direct browser database access.
- MVP commit `9112080` was pushed normally to the public GitHub repository and its remote SHA matched local HEAD. The initial publication scan covered all 76 publishable files with zero findings.

## Public deployment verification

Completed on 2026-10-05 against **https://moldova-geowatch.onrender.com/**. The report workflow was tested on `8b737bc`; the map-header correction `c34c19a` was subsequently deployed and verified. Documentation-only commits preserve the verified application runtime.

| Check                   | Result                                                                                                                                                    |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Public HTTPS health     | 200; database connected, PostGIS 3.3.7, OSS map provider, DEMO river observations                                                                         |
| Public endpoints        | Weather, Orhei search, rivers, reports and bbox queries return expected real data                                                                         |
| WebSockets              | Two independent WSS-only clients connect and receive creation/confirmation events                                                                         |
| Browser report workflow | One explicitly labelled temporary Other report created through the public UI; reload preserves title, coordinates and description                         |
| Second browser          | Creation and confirmation count appear without reload; first detail panel records confirmation                                                            |
| Spatial/filter rules    | Bbox inclusion/exclusion and category exclusion pass; reversed bbox returns 400; UI Flooding filter hides the Other record                                |
| Write protections       | Duplicate confirmation returns 409; foreign-origin confirmation returns 403                                                                               |
| Map and layers          | Actual OSM tiles render; map drag changes pane position; Orhei selection zooms from 50 km to 2 km; weather and river toggles work                         |
| Data provenance         | Five actual modeled weather markers and weather details; Nistru/Prut geometry; fixed water readings visibly DEMO                                          |
| Mobile                  | 390×844 viewport, scroll width 390; layers drawer opens/focuses its close control; river details accessible                                               |
| Browser security        | No captured warning/error messages after final reload; HTTPS/WSS and HTTPS tiles; no mixed-content issues observed                                        |
| Backend logs            | Successful deploy/startup and current application logs reviewed; no unexpected runtime errors observed                                                    |
| Test cleanup            | Exact test UUID plus title/description guard removed only the temporary report; reports and confirmations both zero afterwards; migrations remain 1 and 2 |
| Repository checks       | Lint, typecheck, all 46 tests, build and formatting pass after the header correction                                                                      |

The initial deploy failed because the CA certificate was missing, then PostgreSQL rejected the configured password. The official CA was added with certificate validation intact, and the owner corrected the private connection credentials. The live application has no database secrets in its browser bundle or repository.

The first public screenshot exposed blocked OSM tiles: the production server used Helmet's default `no-referrer` policy. The fix explicitly sets `strict-origin-when-cross-origin`. The public response header, actual tile rendering and empty captured console error/warning list were verified after redeploy. No proxy, user-agent spoofing or alternative paid tile service was introduced.

Public screenshots: [desktop](screenshots/public-desktop.jpg), [mobile](screenshots/public-mobile.jpg). They show the live public site after test cleanup, with actual weather at capture time. Temporary viewport overrides were cleared. See [deployment instructions and free-tier limits](DEPLOYMENT.md).

The final publication scan covered repository text and existing commit history with no private-key, recognizable-token, nonlocal database-credential or machine-path matches. Public screenshots were visually reviewed; local runtime files and the downloaded public CA remain ignored.
