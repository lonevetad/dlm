import path from "path";
import fs from "fs";
import type { IDbClient, IDbConnection } from "./DbClient.ts";

function tableFile(table: string) {
  const DB_DIR = path.resolve(process.cwd(), "server", "data", "test-db");
  fs.mkdirSync(DB_DIR, { recursive: true });
  return path.join(DB_DIR, `${table}.json`);
}

function readTable(table: string): any[] {
  const f = tableFile(table);
  if (!fs.existsSync(f)) return [];
  try {
    return JSON.parse(fs.readFileSync(f, "utf8")) as any[];
  } catch {
    return [];
  }
}

function writeTable(table: string, rows: any[]) {
  fs.writeFileSync(tableFile(table), JSON.stringify(rows, null, 2), "utf8");
}

export class JsonDbClient implements IDbClient {
  async connect(): Promise<void> {
    return;
  }
  async disconnect(): Promise<void> {
    return;
  }

  async query(sql: string, params: any[] = []): Promise<any> {
    const q = sql.trim().toLowerCase();
    if (q.startsWith("create table")) return [];

    if (q.startsWith("select")) {
      const m = q.match(/from\s+([a-z_]+)/);
      if (!m) return [];
      const table = m[1];
      const rows = readTable(table);
      if (q.includes("where") && params.length > 0) {
        const whereMatch = q.match(/where\s+([a-z_]+)\s*=\s*\?/);
        if (whereMatch) {
          const col = whereMatch[1];
          return rows.filter((r) => String(r[col]) === String(params[0]));
        }
      }
      return rows;
    }

    if (q.startsWith("insert into")) {
      const m = q.match(/insert into\s+([a-z_]+)/);
      if (!m) return [];
      const table = m[1];
      const rows = readTable(table);

      if (table === "prompts") {
        const [
          id,
          user_id,
          wallet,
          prompt_text,
          prompt_hash,
          status,
          assigned_node_set_hash,
          created_at,
        ] = params;
        const existingIndex = rows.findIndex((r) => r.id === id);
        const record = {
          id,
          user_id,
          wallet,
          prompt_text,
          prompt_hash,
          status,
          assigned_node_set_hash,
          created_at,
        };
        if (existingIndex >= 0)
          rows[existingIndex] = { ...rows[existingIndex], ...record };
        else rows.push(record);
        writeTable(table, rows);
        return [];
      }

      if (table === "execution_plans") {
        const [
          id,
          prompt_id,
          model_version,
          node_set_hash,
          plan_json,
          created_at,
        ] = params;
        const existingIndex = rows.findIndex(
          (r) => r.id === id || r.prompt_id === prompt_id,
        );
        const record = {
          id,
          prompt_id,
          model_version,
          node_set_hash,
          plan_json,
          created_at,
        };
        if (existingIndex >= 0)
          rows[existingIndex] = { ...rows[existingIndex], ...record };
        else rows.push(record);
        writeTable(table, rows);
        return [];
      }

      if (table === "users") {
        const [wallet, user_id, username, created_at] = params;
        const existingIndex = rows.findIndex((r) => r.wallet === wallet);
        const record = { wallet, user_id, username, created_at };
        if (existingIndex >= 0)
          rows[existingIndex] = { ...rows[existingIndex], ...record };
        else rows.push(record);
        writeTable(table, rows);
        return [];
      }

      if (table === "nodes") {
        const [
          wallet,
          node_id,
          role,
          ram_mb,
          cpu_tflops,
          storage_gb,
          bandwidth_mbps,
          status,
          last_heartbeat,
          created_at,
        ] = params;
        const existingIndex = rows.findIndex((r) => r.wallet === wallet);
        const record = {
          wallet,
          node_id,
          role,
          ram_mb,
          cpu_tflops,
          storage_gb,
          bandwidth_mbps,
          status,
          last_heartbeat,
          created_at,
        };
        if (existingIndex >= 0)
          rows[existingIndex] = { ...rows[existingIndex], ...record };
        else rows.push(record);
        writeTable(table, rows);
        return [];
      }
    }

    return [];
  }

  async withConnection<T>(
    handler: (conn: IDbConnection) => Promise<T>,
  ): Promise<T> {
    const conn: IDbConnection = { query: this.query.bind(this) };
    return handler(conn);
  }

  async ensureSchema(): Promise<void> {
    // no-op for json mock
    return;
  }
}
