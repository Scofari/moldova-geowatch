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
- Real mobile hardware/touch behavior, public deployment, multi-instance operation and large-data performance were not tested.
- Clean installation/build/tests were repeated in an isolated source directory. Provider and DB flows were tested against the real local running stack, not a newly provisioned cloud environment.

The MVP is locally verified. These results do not establish suitability as an emergency warning system or a broadly public unmoderated service.
