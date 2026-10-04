# Contributing

Use Node >=22, npm workspaces and a local PostGIS database. Follow README setup and verify lint, typecheck, tests, formatting and build before proposing changes.

Keep external integrations behind providers/MapAdapter, validate inputs with shared contracts, use parameterized SQL and versioned migrations, and preserve per-dataset provenance. Never commit .env, SDK license files, tokens or customer packages. Clearly label synthetic data.

For a new country, add reviewed metadata to the country registry and a reproducible real-data import; test coordinate order, bbox and provider coverage. Do not manually invent geography or readings.

Integration checks must run against a local development database. They create and clean up only their own IDs. Test browser workflows when changing map, reports or real-time behavior.
