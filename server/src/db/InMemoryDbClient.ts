import type { IDbClient, IDbConnection } from "./DbClient.ts";

export class InMemoryDbClient implements IDbClient {
  private tables: Map<string, any[]> = new Map();

  async connect(): Promise<void> {
    this.tables.clear();
  }

  async disconnect(): Promise<void> {
    this.tables.clear();
  }

  private readTable(table: string) {
    return (this.tables.get(table) ?? []) as any[];
  }

  private writeTable(table: string, rows: any[]) {
    this.tables.set(table, rows.slice());
  }

  async query(sql: string, params: any[] = []): Promise<any> {
    const q = sql.trim().toLowerCase();
    if (q.startsWith("create table")) return [];
    if (q.startsWith("select")) {
      const m = q.match(/from\s+([a-z_]+)/);
      if (!m) return [];
      const table = m[1];
      const rows = this.readTable(table).slice();
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
      const rows = this.readTable(table).slice();

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
        this.writeTable(table, rows);
        return [];
      }

      // Generic append fallback
      rows.push(params);
      this.writeTable(table, rows);
      return [];
    }

    return [];
  }

  async withConnection<T>(
    handler: (conn: IDbConnection) => Promise<T>,
  ): Promise<T> {
    const conn: IDbConnection = { query: this.query.bind(this) };
    return handler(conn);
  }
}
