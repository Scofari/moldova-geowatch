# Production deployment

Status: publicly deployed and verified on 2026-10-05. Render Free serves the frontend, NestJS API and Socket.IO; Supabase Free provides PostgreSQL/PostGIS with verified TLS. Public E2E covered application commit `c34c19a`. Later documentation-only commits do not change the runtime.

- Frontend: [Moldova GeoWatch](https://moldova-geowatch.onrender.com/)
- Backend: [API health](https://moldova-geowatch.onrender.com/api/health), under the same HTTPS origin
- Source: [Scofari/moldova-geowatch](https://github.com/Scofari/moldova-geowatch), branch `main`
- Evidence: [public verification record](VERIFICATION.md)

## Architecture and decision

Use one **Render Free Node web service** for the compiled Vite frontend, NestJS API and Socket.IO on the same HTTPS origin. Use **Supabase Free PostgreSQL/PostGIS** in Frankfurt for persistence. Render's generated external URL supplies the exact HTTP/WebSocket origin. Relative frontend `/api` and `/socket.io` requests therefore use the deployed backend automatically; no database credentials or separate frontend API URL enter the browser bundle.

This keeps two providers and one application deployment. Render hosts persistent Node processes and WebSockets, unlike a serverless-only frontend platform. Render's free database was rejected because it expires after 30 days. Supabase's connection pooler avoids buying its IPv4 add-on. The checked organization-specific project cost was zero per month.

Official documentation checked on 2026-10-04:

- [Render Free services](https://render.com/docs/free), [pricing](https://render.com/pricing), [WebSockets](https://render.com/docs/websocket), [Node services and binding](https://render.com/docs/web-services).
- [Render Blueprint configuration](https://render.com/docs/blueprint-spec), [platform environment variables](https://render.com/docs/environment-variables), [secret configuration](https://render.com/docs/configure-environment-variables).
- [Supabase pricing](https://supabase.com/pricing), [PostGIS](https://supabase.com/docs/guides/database/extensions/postgis), [connection methods](https://supabase.com/docs/guides/database/connecting-to-postgres), [TLS verification](https://supabase.com/docs/guides/platform/ssl-enforcement), [project pausing](https://supabase.com/docs/guides/platform/free-project-pausing).

## Costs and operational limits

Expected cost is **€0/month only while both accounts remain on Free, no paid add-ons/resources are selected, and usage stays within allowances**. Do not add a payment method as part of this setup. Render can bill bandwidth/build overages when a payment method already exists; inspect workspace billing before provisioning. Without a payment method, exhaustion suspends services or builds instead. If any step requires payment details or a paid resource, stop and obtain the owner's approval.

| Component            | Free limitations                                                                                                                                                 |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Render app           | 0.1 CPU, 512 MB RAM; 750 running instance hours per workspace/month, shared with other free services; ephemeral filesystem; no persistent disk                   |
| Render idle behavior | Spins down after 15 minutes without incoming HTTP/WebSocket traffic; restart takes about a minute. Free service can restart at any time                          |
| Render usage         | Dashboard inspection showed 5 GB bandwidth and 500 pipeline minutes per month, shared across the workspace. Recheck billing/quotas before future changes         |
| WebSockets           | Supported over WSS on the HTTP port; no fixed connection-duration limit, but restarts/deploys disconnect clients; outgoing messages consume bandwidth            |
| Supabase             | 500 MB database, shared CPU/500 MB RAM, 5 GB egress, maximum two active free projects; inactive projects can pause after a week; automatic backups/PITR excluded |

The existing Socket.IO reconnect handling and polling reconcile missed updates. Polling and heartbeats can keep the service active and consume hours/bandwidth; they are not an uptime guarantee. Do not add artificial keep-awake jobs. The first browser load may require retrying after a cold start. A paused database requires owner restoration through Supabase.

The workspace billing inspection showed no card on file. No payment method, paid compute, disk, Render database, database branch or IPv4 add-on was created during this deployment.

## Database provision and migration

1. Choose the owner's authorized **Free** Supabase organization. Check its organization-specific cost and available project quota first. Create a PostgreSQL project in `eu-central-1`; do not choose paid compute, branching or the IPv4 add-on.
2. Obtain the Session pooler connection details from the project's **Connect** dialog. Copy the actual host; it cannot safely be inferred from the region. Use session mode on port 5432. A new project created by the connector does not expose its generated database password; the owner must set/reset it in Supabase if no usable private password is available. Do not paste passwords into chat.
3. Download the provider's public database CA certificate and configure verified TLS. Never disable certificate verification. Put the connection string and CA only in backend environment settings; percent-encode reserved password characters. Remove SSL query parameters from the URL because this application explicitly configures TLS verification.
4. Run `npm run db:migrate` with backend environment settings supplied privately. The runner creates a dedicated `gis` schema and enables PostGIS there on a fresh database, then applies numbered files from `apps/api/migrations` in one advisory-locked transaction. An existing local PostGIS installation is preserved. `001_reports.sql` is unchanged; `002_private_data_api.sql` enables RLS and revokes Data API access. The backend pool searches `public,gis,extensions`.
5. If only the connected Supabase SQL tool is available, apply those exact repository migration files in order within a transaction and record their versions in `schema_migrations`. Do not create an alternative hand-written reports schema. Supabase's tool also maintains its own migration history independently.
6. Verify the PostGIS version/schema, versions 1 and 2, all three application tables, `reports_location_idx` (GiST), category/country index and confirmation primary key. Confirm `anon` and `authenticated` cannot read/write the application tables.

The current cloud database was verified with PostgreSQL 17, PostGIS 3.3.7 in `gis`, migrations 1 and 2, the expected indexes, zero reports and no anonymous/authenticated table access. The Supabase security advisor has no error/warning findings; three informational “RLS enabled, no policy” findings are deliberate because browsers use NestJS, never the Data API. See [advisor explanation](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy).

The initial migration placed PostGIS in `public`. Before any application connection or report insertion, the empty application schema was transactionally rebuilt from the same migration files with PostGIS in `gis`. A guard refused rebuilding if any report or confirmation existed; the extension was dropped without CASCADE. No user data was removed.

The initial deployment can use the private database owner's connection for startup migrations. Keep it exclusively in backend secrets. Before broader/commercial use, separate migration-owner and least-privilege runtime roles and restrict database access. Export backups with a private database connection; never commit a dump.

## Backend environment settings

These are placeholders, not deployable credentials:

```dotenv
DATABASE_URL=<private-session-pooler-connection-url>
DATABASE_CA_CERT=<provider-public-ca-certificate-pem>
DATABASE_SSL=<verified-tls-enabled>
IP_HASH_SALT=<private-random-value-at-least-32-characters>
NODE_ENV=<production>
HOST=<public-service-bind-address>
PORT=<provider-assigned-port>
SERVE_WEB=<serve-compiled-frontend-enabled>
TRUST_PROXY=<enabled-only-behind-one-trusted-proxy>
WEB_ORIGIN=<exact-https-frontend-origin-if-overriding-render>
```

The committed `render.yaml` supplies safe nonsecret runtime values, the free plan, generated confirmation salt, build/start commands and health path. Render supplies `PORT` and `RENDER_EXTERNAL_URL`; the latter is used when `WEB_ORIGIN` is absent. The app accepts one exact origin and rejects arbitrary origins, default production salts, missing production database settings, public HTTP origins, unverified public DB connections and conflicting URL TLS options.

Optional backend provider settings are `WEATHER_BASE_URL` and `GEOCODING_BASE_URL`. Frontend settings are `VITE_MAP_PROVIDER` and `VITE_TILE_URL`; the current deployment uses their OSS defaults. **Never** create `VITE_DATABASE_URL`, copy database credentials into a Vite variable or add secrets to YAML.

## Render deploy / redeploy

1. Sign in to [Render](https://dashboard.render.com/login). The owner must complete authentication and any GitHub app authorization; restrict repository access to the GeoWatch repository. Inspect billing and stop before paid selections/payment prompts.
2. Create a Blueprint from the repository containing `render.yaml`. Inspect the resource preview: exactly one **Free Node web service**, no Render database, disk, cron, previews or paid add-ons. The Blueprint uses Frankfurt and Node 24.18.0.
3. Enter backend-only `DATABASE_URL` and `DATABASE_CA_CERT` into Render's secret fields. The Blueprint generates `IP_HASH_SALT` once; preserve it across redeploys so confirmations remain deduplicated.
4. Build: `npm ci --include=dev && npm run build`. Start: `node apps/api/dist/main.js`. The API binds the platform `PORT` on `HOST=0.0.0.0`, applies migrations, and serves `apps/web/dist` when `SERVE_WEB=true`. HTTPS/WSS termination is provided by Render. Do not run Vite's preview server publicly.
5. Verify the actual generated HTTPS URL, not a guessed hostname. Test `/api/health`, weather, rivers, search, reports and bbox querying; check deploy/runtime logs before calling it deployed.
6. Push normally to GitHub, then choose **Manual Deploy → Deploy latest commit** on the existing Render service. This deployment uses the public repository URL: Render's logs explicitly say it clones the public repository without Git provider access. Automatic push-triggered deployment is not verified. A future scoped GitHub connection can enable that workflow after owner authorization. Use one instance: expanding requires shared quotas/cache, a Socket.IO adapter and appropriate load-balancer settings.

If startup reports `self-signed certificate in certificate chain`, check that `DATABASE_CA_CERT` contains the complete official PEM, including real newlines. If it reports `password authentication failed`, the owner must correct the current URL/password in Render; do not disclose it or disable TLS. These issues were resolved before the successful live deployment.

Keep `Referrer-Policy: strict-origin-when-cross-origin` on the frontend. Helmet's `no-referrer` default caused OpenStreetMap tiles to return blocked images during public E2E. The corrected policy sends only the origin across sites; real tiles rendered after deployment. Attribution, browser caching and the provider's tile policy remain required.

## Public acceptance checklist

Completed on the public HTTPS deployment on 2026-10-05:

- HTTPS page load; Moldova geography, pan/zoom, actual modeled weather and details.
- Nistru and Prut real paths; visibly DEMO water levels; independent layer toggles and Orhei search.
- Create an explicitly identified temporary verification report; refresh and confirm persistence.
- Two separate clients receive creation/confirmation events without refresh; confirmation count updates, duplicate confirmation is rejected.
- Public bbox inclusion/exclusion and category filters; mobile viewport; no mixed content, critical console errors or unexpected backend errors.
- Remove only the temporary report's exact recorded ID using a private guarded database query. Final report and confirmation counts were zero. Never seed invented incidents or delete unrelated reports.
- Record actual URLs, deployed commit and evidence in README/verification documentation, rerun repository checks and push a normal follow-up commit.

Do not point the local integration runner at production. It deliberately submits several test reports and exercises limits. Public write tests require an isolated, clearly named temporary verification record and exact-ID cleanup.

## Data terms and upgrade path

Weather is LIVE provider **model-derived** data. Natural Earth geography is real static public-domain data. Water observations remain fixed DEMO fixtures. Reports are anonymous, user-generated and unverified. Leaflet is the actual renderer; LuciadRIA still requires legitimate SDK/license access.

Open-Meteo's free hosted weather/geocoding service is noncommercial. See [its terms](https://open-meteo.com/en/terms) and [data provenance](DATA_SOURCES.md); commercial launch requires permitted provider access. Standard OpenStreetMap tiles require attribution and [tile policy](https://operations.osmfoundation.org/policies/tiles/) compliance.

For a recruiter demo, this setup is reasonable while accepting cold starts. For paying customers or dependable monitoring, obtain approval for paid always-on compute/database backups, compliant providers, authentication/moderation, stronger abuse controls and operational monitoring. Verify prices at upgrade time; never enable upgrades automatically. This MVP is not an emergency warning system.
