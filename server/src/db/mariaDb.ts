import { normalizeMode, DbMode } from "./DbClient.ts";
import type { IDbClient } from "./DbClient.ts";
import { JsonDbClient } from "./JsonDbClient.ts";
import { MariaDbClient } from "./MariaDbClient.ts";
import { InMemoryDbClient } from "./InMemoryDbClient.ts";
import { SqliteDbClient } from "./SqliteDbClient.ts";

const mode = normalizeMode(
  process.argv.find((a) => a.startsWith("--db-mode="))?.split("=")[1] ??
    process.env.DLM_DB_MODE ??
    process.env.DB_MODE ??
    (process.env.DLM_TEST_MODE === "1" ? DbMode.Mock : DbMode.Mariadb),
);

export const DB_MODE = mode;
export const IS_MOCK = mode === DbMode.Mock;

let client: IDbClient;
switch (mode) {
  case DbMode.Mock:
    client = new JsonDbClient();
    break;
  case DbMode.Sqlite:
    client = new SqliteDbClient();
    break;
  case DbMode.Memory:
    client = new InMemoryDbClient();
    break;
  default:
    client = new MariaDbClient();
}

export async function ensureDatabaseSchema(): Promise<void> {
  if (client.connect) await client.connect();
  if (client.ensureSchema) return client.ensureSchema();
  return Promise.resolve();
}

export async function withConnection<T>(
  handler: (conn: any) => Promise<T>,
): Promise<T> {
  if (client.connect) await client.connect();
  return client.withConnection(handler as any);
}

export async function connectDatabase(): Promise<void> {
  if (client.connect) return client.connect();
  return Promise.resolve();
}

export async function disconnectDatabase(): Promise<void> {
  if (client.disconnect) return client.disconnect();
  return Promise.resolve();
}
