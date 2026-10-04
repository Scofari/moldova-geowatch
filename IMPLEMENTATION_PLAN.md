# Moldova GeoWatch implementation plan

## Repository audit

The workspace was empty on 2026-10-04: no source, package manager configuration, Git repository, LuciadRIA installation or license. Node 24 and npm 11 are available. Docker CLI is installed; engine availability must be verified. No existing tooling to preserve.

## Scope and architecture

Build an npm workspace with React/Vite in `apps/web`, NestJS in `apps/api`, and shared Zod-validated domain contracts in `packages/shared`. Leaflet is the freely licensed runtime map implementation. Keep rendering isolated behind MapAdapter; LuciadMapAdapter delegates to a separately supplied, licensed integration and fails explicitly if absent. Never emulate LuciadRIA or bundle a license.

Nest modules own weather, rivers, search, health, reports and WebSocket events. PostgreSQL/PostGIS stores reports as geography points, with parameterized SQL, a GiST index and transactional, unique hashed-IP confirmations. A versioned migration runner runs before the API starts. React Query manages remote state; React manages lightweight UI state. Socket.IO events invalidate report queries, including reconnect reconciliation.

## Data and licensing decisions

- OpenStreetMap standard tiles: visible attribution, normal interactive use, no bulk downloads/offline caching; configurable tile URL.
- Natural Earth public-domain country borders, populated places and river centerlines: reproducible extraction from upstream GeoJSON, with pinned revision and provenance manifest. Generalized geometry is context, not navigation-grade.
- Open-Meteo current modeled conditions, not physical station observations: server cache, normalized responses, units and attribution. Its free service is noncommercial only; commercial launch requires a different permitted provider or self-hosting.
- Open-Meteo geocoding (GeoNames attribution): explicit submitted searches, cache and country filter. Avoid public Nominatim integration because of its constrained service policy. No aggressive autocomplete.
- Moldova official hydrology publishes human-readable bulletins; no verified public machine-readable observation API with explicit reuse terms was found. A deterministic, conspicuously DEMO provider uses fixed timestamps and synthetic station IDs. Real river geometry is independent of observations.

## Dependencies

React, Vite, Leaflet, TanStack Query, Socket.IO client, lucide-react; NestJS, pg, helmet, throttler, Socket.IO, Zod; TypeScript, tsx, Vitest, ESLint, Prettier, concurrently. Use Node >=22. PostGIS Docker image. No paid services, auth vendor, mandatory cloud or map key.

## Implementation phases and verification

1. Workspaces/configuration/shared contracts, validated environment, PostGIS Compose, migration runner, health endpoint; install and typecheck.
2. Map adapter, country context, real open geography, accessible dashboard/layers.
3. Weather provider with bounded cache, timeout, response validation, model-data labels.
4. Rivers endpoint with real geometry and independently labeled DEMO observations.
5. PostGIS reports, input contracts, selection/form, persisted markers.
6. Atomic deduplicated confirmations, typed WebSocket events, filters and bbox.
7. Submitted location search, responsive drawer, errors/empty/loading states.
8. Shared/provider/API/PostGIS/WebSocket tests; lint, typecheck, production builds; local browser smoke tests including second client and mobile; finish documentation.

## Risks and missing requirements resolved for v0.1

- Country expansion uses ISO alpha-2 contracts plus a country registry; only MD data ships initially.
- Anonymous reports are unverified user statements; no implied official warnings. IP hashing limits casual confirmation abuse, not determined attackers; shared networks collide. Rate limits use socket IP by default; reverse proxy trust must be explicitly configured.
- No moderation/auth in v0.1: unsuitable for an unmoderated large public deployment. Retention/privacy and moderation remain launch requirements.
- API returns capped viewport lists and truncated flag; dense deployments need clustering/pagination.
- Single API instance owns in-memory provider caches/throttling and broadcasts. Multi-instance requires distributed cache/rate limiting and event fanout.
- A licensed LuciadRIA build cannot be tested without a customer SDK/license; the integration boundary and instructions can be verified only.
- External services may fail or block traffic. Return explicit errors; never silently substitute demo weather or reports.
- Local Docker may be unavailable on this host. Do not claim database verification if the runtime cannot start.

## Acceptance

Root install/dev/build/test/lint/typecheck commands work. App exposes actual provider provenance, independent layer toggles, location search, report submission/detail/confirmation and real-time updates. All core failure paths are explicit. PostGIS and browser integration verification must be separately reported from unit/build results.
