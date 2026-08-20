# DB clients

This folder implements a small object-oriented DB client layer used by services and repositories.

Key points

- `IDbClient` (in `DbClient.ts`) is the generic interface: `connect()`, `disconnect()`, `query()`, `withConnection()` and optional `ensureSchema()`.
- Code should use the exported helpers in `server/src/db/mariaDb.ts`: `withConnection()` and `ensureDatabaseSchema()` — they delegate to the selected client.

Available client implementations

- `JsonDbClient` — file-backed JSON mock used for local unit tests (`DLM_DB_MODE=mock`). Writes under `server/data/test-db/`.
- `InMemoryDbClient` — simple volatile in-memory tables (`DLM_DB_MODE=memory`).
- `MariaDbClient` — real MariaDB connection pool and schema creation (`DLM_DB_MODE=mariadb`).
- `SqliteDbClient` — SQLite (in-memory) client for SQL-like local testing (`DLM_DB_MODE=sqlite`). Requires the `better-sqlite3` package.

Selecting a client

- Use the environment variable `DLM_DB_MODE` or the CLI flag `--db-mode=` to pick a client before importing server modules. Example:

```bash
export DLM_DB_MODE=mock
node --test
```

Notes

- Set `DLM_DB_MODE` early (top of test files or a setup script) so the correct client is chosen when modules initialize.
- `SqliteDbClient` is optional and only needed when you want closer SQL semantics in tests; install `better-sqlite3` if you plan to use it.
