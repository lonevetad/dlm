# DLM

## Brief overview

DLM is a DAO-backed distributed language model network: open-source model shards are distributed across independent nodes, coordinated by a backend scheduler, and validated against a Solidity governance/identity layer. The project is built to support a user-facing LLM service without centralizing execution in one data center.

## Current architecture

- DAO layer: Solidity contract in [contracts/DLMDAO.sol](contracts/DLMDAO.sol)
- Backend: TypeScript-based server in [server/app.ts](server/app.ts)
- Persistence: MariaDB schema under [server/src/db/schema.sql](server/src/db/schema.sql)
- Configuration: environment variables via [server/src/config/env.ts](server/src/config/env.ts) and [.env.example](.env.example)
- Scheduling: model registry + plan engine in [server/src/services/ModelRegistry.ts](server/src/services/ModelRegistry.ts) and [server/src/services/ExecutionPlanService.ts](server/src/services/ExecutionPlanService.ts)

## Key constraints now enforced

- TypeScript instead of plain JavaScript for backend code
- Local MariaDB storage with credentials loaded from environment variables
- Solidity DAO as the source of truth for wallet and identity registration checks
- User and node validation includes DAO membership verification before registration or prompt submission

## Working stack

- Node.js + Express in TypeScript
- MariaDB for users, nodes, prompts, execution plans
- Ethers.js for DAO reads
- Solidity DAO for on-chain identity/accounting

## Status

This repository is now in a refactored, architecture-first phase with a real DAO contract, a TypeScript API, and a MariaDB-backed persistence plan. The codebase is in active evolution toward a more production-oriented distributed scheduling architecture.

## Test artifacts and local test data

- **What changed**: Tests now write runtime artifacts into per-test subfolders under `server/data/test-artifacts/` to avoid committing generated files.
- **Ignored paths**: The repository `.gitignore` now excludes `server/data/test-artifacts/` and its contents.
- **Modified tests**: The following tests were updated to isolate outputs:
  - [tests/prompt-artifact-service.test.ts](tests/prompt-artifact-service.test.ts)
  - [tests/execution-lifecycle.test.ts](tests/execution-lifecycle.test.ts)
  - [tests/validators-regression.test.ts](tests/validators-regression.test.ts)

If you need to inspect test outputs, look under `server/data/test-artifacts/`.

## Notes and recommendations

- DB backend selection: set `DLM_DB_MODE` (or pass `--db-mode=`) to choose the database backend. Supported values:
  - `mock` or `json` — use the lightweight JSON-backed test DB (no MariaDB required).
  - `mariadb` — use a real MariaDB instance (default).

DB client architecture:

- The repository now exposes a generic DB client interface implemented with OOP patterns under `server/src/db/`.
- Implementations available:
  - `JsonDbClient` — file-backed JSON mock used for `DLM_DB_MODE=mock`.
  - `MariaDbClient` — real MariaDB-backed implementation used for `DLM_DB_MODE=mariadb`.
  - `SqliteDbClient` — SQLite-backed implementation (requires `better-sqlite3`) for `DLM_DB_MODE=sqlite`.
  - `InMemoryDbClient` — in-memory mock for `DLM_DB_MODE=memory`.

Tests and services use the exported `withConnection()` and `ensureDatabaseSchema()` helpers which delegate to the selected client implementation. Prefer setting `DLM_DB_MODE` before importing server modules so the correct client is selected at runtime.

- For CI: set `DLM_DB_MODE=mariadb` (or leave unset and ensure DB envs are provided) in your test job environment to run integration tests against MariaDB, or set `DLM_DB_MODE=mock` to run with the JSON mock.
- Fast-fail on DB: consider adding a short connection timeout or retry/backoff in `ensureDatabaseSchema()` so that CI or local runs fail quickly when MariaDB is unreachable instead of hanging.
- Local mock DB: the lightweight mock stores JSON files under `server/data/test-db/` when `DLM_DB_MODE=mock`. These files are for local debugging and are ignored by `.gitignore`.
- Test setup: tests that interact with storage should set `DLM_DB_MODE=mock` (or otherwise configure a test DB) before importing server modules. Prefer setting environment variables at the top of test files or in a test setup script so the mariadb client is not initialized during module evaluation. CLI alternative: pass `--db-mode=mock` when invoking Node to run tests with the mock.
- Alternatives: if you prefer a single-file SQL database for faster, predictable tests, consider switching the mock to SQLite for closer integration semantics, or run a transient MariaDB instance in CI (docker) for full integration coverage.

## CI example: transient MariaDB (GitHub Actions)

This repository includes a sample GitHub Actions workflow that starts a transient MariaDB service and runs the test suite against it: [.github/workflows/ci.yml](.github/workflows/ci.yml).

Key points:

- The workflow starts a `mariadb:10.11` container and waits for it to become healthy.
- Environment variables used by the tests are set in the workflow (`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`).
- To run tests against the real MariaDB service, ensure `DLM_TEST_MODE` is not set (or set to `0`) so the code uses the real DB connection.

Use the workflow as a starting point for CI that requires full integration testing against MariaDB.
