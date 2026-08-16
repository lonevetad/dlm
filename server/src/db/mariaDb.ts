import mariadb from "mariadb";
import type { Pool, PoolConnection } from "mariadb";
import { env } from "../config/env.ts";

export const pool: Pool = mariadb.createPool({
  host: env.dbHost,
  port: env.dbPort,
  user: env.dbUser,
  password: env.dbPassword,
  database: env.dbName,
  connectionLimit: env.dbConnectionLimit,
  multipleStatements: true,
  charset: "utf8mb4",
});

let schemaReady = false;

export async function ensureDatabaseSchema(): Promise<void> {
  if (schemaReady) {
    return;
  }

  try {
    const connection = await pool.getConnection();
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

      schemaReady = true;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.warn(
      "MariaDB schema setup skipped or failed:",
      (error as Error).message,
    );
    throw error;
  }
}

export async function withConnection<T>(
  handler: (connection: PoolConnection) => Promise<T>,
): Promise<T> {
  await ensureDatabaseSchema();
  const connection = await pool.getConnection();
  try {
    return await handler(connection);
  } finally {
    connection.release();
  }
}
