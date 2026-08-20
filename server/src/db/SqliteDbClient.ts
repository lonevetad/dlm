import type { IDbClient, IDbConnection } from "./DbClient.ts";

export class SqliteDbClient implements IDbClient {
  private db: any | null = null;

  async connect(): Promise<void> {
    if (this.db) return;
    let BetterSqlite3: any;
    try {
      BetterSqlite3 = await import("better-sqlite3");
    } catch {
      throw new Error("better-sqlite3 is required for sqlite mode");
    }
    this.db = new BetterSqlite3.default(":memory:");
  }

  async disconnect(): Promise<void> {
    if (!this.db) return;
    try {
      this.db.close();
    } catch {}
    this.db = null;
  }

  async query(sql: string, params: any[] = []): Promise<any> {
    if (!this.db) await this.connect();
    const stmt = this.db.prepare(sql);
    if (sql.trim().toLowerCase().startsWith("select")) {
      return stmt.all(params);
    }
    const info = stmt.run(params);
    return info;
  }

  async withConnection<T>(
    handler: (conn: IDbConnection) => Promise<T>,
  ): Promise<T> {
    const conn: IDbConnection = { query: this.query.bind(this) };
    return handler(conn);
  }

  async ensureSchema(): Promise<void> {
    if (!this.db) await this.connect();
    const exec = (sql: string) => {
      try {
        this.db.prepare(sql).run();
      } catch (e) {
        // ignore
      }
    };

    exec(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      wallet TEXT NOT NULL UNIQUE,
      user_id TEXT NOT NULL,
      username TEXT NOT NULL DEFAULT 'anonymous',
      created_at INTEGER NOT NULL
    );`);

    exec(`CREATE TABLE IF NOT EXISTS nodes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      wallet TEXT NOT NULL UNIQUE,
      node_id TEXT NOT NULL,
      role TEXT NOT NULL,
      ram_mb INTEGER NOT NULL,
      cpu_tflops REAL NOT NULL,
      storage_gb INTEGER NOT NULL,
      bandwidth_mbps REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      last_heartbeat INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    );`);

    exec(`CREATE TABLE IF NOT EXISTS prompts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      wallet TEXT NOT NULL,
      prompt_text TEXT NOT NULL,
      prompt_hash TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'submitted',
      assigned_node_set_hash TEXT NULL,
      created_at INTEGER NOT NULL
    );`);

    exec(`CREATE TABLE IF NOT EXISTS execution_plans (
      id TEXT PRIMARY KEY,
      prompt_id TEXT NOT NULL,
      model_version TEXT NOT NULL,
      node_set_hash TEXT NOT NULL,
      plan_json TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );`);
  }
}
