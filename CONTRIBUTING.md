# Contributing

Thanks for contributing to DLM. This short guide explains how to run tests locally and how CI runs integration tests with a transient MariaDB container.

## Running tests locally

```bash
# use the lightweight JSON-backed mock DB
export DLM_DB_MODE=mock
export DLM_TEST_DATA_DIR=server/data/test-artifacts/local
# or: node --db-mode=mock --test
node --test
```

DB client classes

- To run with the file-backed JSON mock: `export DLM_DB_MODE=mock` (uses `JsonDbClient`).
- To run against a real MariaDB: unset `DLM_DB_MODE` or set `DLM_DB_MODE=mariadb` (uses `MariaDbClient`).
- To run with an in-memory DB for fast experiments: `export DLM_DB_MODE=memory` (uses `InMemoryDbClient`).
- To run against SQLite (local in-memory DB): `export DLM_DB_MODE=sqlite` (requires `better-sqlite3`; uses `SqliteDbClient`).
  - To run against SQLite (local in-memory DB): `export DLM_DB_MODE=sqlite` (requires `better-sqlite3`; uses `SqliteDbClient`).
    - Install on-demand: `npm run install-sqlite` will install `better-sqlite3` without saving to package.json.
    - Or install permanently: `npm i better-sqlite3 --save-dev`.

- Integration tests (transient MariaDB via Docker):

  ```bash
  # start mariadb (example)
  docker run --name dlm-mariadb -e MYSQL_ROOT_PASSWORD=rootpass -e MYSQL_DATABASE=dlm \
    -e MYSQL_USER=dlm_user -e MYSQL_PASSWORD=dlm_password -p 3306:3306 -d mariadb:10.11

  # wait for readiness
  for i in {1..60}; do
    mysqladmin ping -h 127.0.0.1 -P 3306 -u root -prootpass &>/dev/null && break || sleep 1
  done

  # run tests against the real DB
  export DB_HOST=127.0.0.1
  export DB_PORT=3306
  export DB_NAME=dlm
  export DB_USER=dlm_user
  export DB_PASSWORD=dlm_password
  unset DLM_DB_MODE
  node --test

  # stop and remove when done
  docker rm -f dlm-mariadb
  ```

## CI (GitHub Actions)

- The repository includes a sample workflow at `.github/workflows/ci.yml` that starts a transient MariaDB service and runs `node --test` against it. Use that as a starting point for CI integration tests.

## Notes

- Prefer the mock DB (`DLM_TEST_MODE=1`) for quick local runs and unit tests.
- Use the transient MariaDB in CI or for integration testing that needs SQL features.
- If you add new tests that touch DB initialization, ensure they set `DLM_TEST_MODE` early (before importing server modules) or run against the integration DB.

Thanks — and feel free to open a PR if you want to extend these instructions.
