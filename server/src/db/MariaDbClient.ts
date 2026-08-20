import mariadb from "mariadb";
import type { Pool, PoolConnection } from "mariadb";
import type { IDbClient, IDbConnection } from "./DbClient.ts";
import { env } from "../config/env.ts";

export class MariaDbClient implements IDbClient {
  private pool?: Pool;
  private schemaReady = false;

  async connect(): Promise<void> {
    if (this.pool) return;
    this.pool = mariadb.createPool({
      host: env.dbHost,
      port: env.dbPort,
      user: env.dbUser,
      password: env.dbPassword,
      database: env.dbName,
      connectionLimit: env.dbConnectionLimit,
      multipleStatements: true,
      charset: "utf8mb4",
    });
  }

  async disconnect(): Promise<void> {
    if (!this.pool) return;
    try {
      await this.pool.end();
    } catch {
      // ignore
    }
    this.pool = undefined;
  }

  async ensureSchema(): Promise<void> {
    if (this.schemaReady) return;
    await this.connect();
    const connection = await (this.pool as Pool).getConnection();
    try {
      await connection.query(`
        CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          wallet VARCHAR(128) NOT NULL UNIQUE,
          user_id VARCHAR(128) NOT NULL,
          username VARCHAR(128) NOT NULL DEFAULT 'anonymous',
          created_at BIGINT NOT NULL
        );
      `);

      await connection.query(`
        CREATE TABLE IF NOT EXISTS nodes (
          id INT AUTO_INCREMENT PRIMARY KEY,
          wallet VARCHAR(128) NOT NULL UNIQUE,
          node_id VARCHAR(128) NOT NULL,
          role VARCHAR(32) NOT NULL,
          ram_mb BIGINT NOT NULL,
          cpu_tflops DOUBLE NOT NULL,
          storage_gb BIGINT NOT NULL,
          bandwidth_mbps DOUBLE NOT NULL,
          status VARCHAR(32) NOT NULL DEFAULT 'active',
          last_heartbeat BIGINT NOT NULL,
          created_at BIGINT NOT NULL
        );
      `);

      await connection.query(`
        CREATE TABLE IF NOT EXISTS prompts (
          id VARCHAR(128) PRIMARY KEY,
          user_id VARCHAR(128) NOT NULL,
          wallet VARCHAR(128) NOT NULL,
          prompt_text TEXT NOT NULL,
          prompt_hash VARCHAR(255) NOT NULL,
          status VARCHAR(32) NOT NULL DEFAULT 'submitted',
          assigned_node_set_hash VARCHAR(255) NULL,
          created_at BIGINT NOT NULL
        );
      `);

      await connection.query(`
        CREATE TABLE IF NOT EXISTS execution_plans (
          id VARCHAR(128) PRIMARY KEY,
          prompt_id VARCHAR(128) NOT NULL,
          model_version VARCHAR(128) NOT NULL,
          node_set_hash VARCHAR(255) NOT NULL,
          plan_json JSON NOT NULL,
          created_at BIGINT NOT NULL
        );
      `);

      this.schemaReady = true;
    } finally {
      connection.release();
    }
  }

  async query(sql: string, params: any[] = []): Promise<any> {
    if (!this.pool) await this.connect();
    const connection = await (this.pool as Pool).getConnection();
    try {
      return await connection.query(sql, params);
    } finally {
      connection.release();
    }
  }

  async withConnection<T>(
    handler: (conn: IDbConnection) => Promise<T>,
  ): Promise<T> {
    if (!this.pool) await this.connect();
    const connection = await (this.pool as Pool).getConnection();
    try {
      const conn: IDbConnection = {
        query: connection.query.bind(connection),
      } as any;
      return await handler(conn);
    } finally {
      connection.release();
    }
  }
}
