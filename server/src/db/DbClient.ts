export interface IDbConnection {
  query(sql: string, params?: any[]): Promise<any>;
}

export interface IDbClient {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  query(sql: string, params?: any[]): Promise<any>;
  withConnection<T>(handler: (conn: IDbConnection) => Promise<T>): Promise<T>;
  ensureSchema?(): Promise<void>;
}

export const DbMode = {
  Mariadb: "mariadb",
  Mock: "mock",
  Json: "json",
  Sqlite: "sqlite",
  Memory: "memory",
} as const;

export type DbMode = (typeof DbMode)[keyof typeof DbMode];

export function normalizeMode(mode?: string): DbMode {
  if (!mode) return DbMode.Mariadb;
  const m = mode.toLowerCase();
  if (m === "mock" || m === "json") return DbMode.Mock;
  if (m === "sqlite") return DbMode.Sqlite;
  if (m === "memory") return DbMode.Memory;
  return DbMode.Mariadb;
}
