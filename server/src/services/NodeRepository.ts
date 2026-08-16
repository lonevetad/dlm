import { withConnection } from "../db/mariaDb.ts";
import type { NodeRecord } from "../types.ts";

export class NodeRepository {
  async findByWallet(wallet: string): Promise<NodeRecord | null> {
    const rows = await withConnection(async (connection) => {
      return connection.query("SELECT * FROM nodes WHERE wallet = ?", [wallet]);
    });
    const row = Array.isArray(rows) ? rows[0] : null;
    if (!row) {
      return null;
    }

    return {
      wallet: row.wallet,
      nodeId: row.node_id,
      role: row.role === "root" ? "root" : "normal",
      ramMb: Number(row.ram_mb),
      cpuTflops: Number(row.cpu_tflops),
      storageGb: Number(row.storage_gb),
      bandwidthMbps: Number(row.bandwidth_mbps),
      status: row.status === "active" ? "active" : "inactive",
      lastHeartbeat: Number(row.last_heartbeat),
      createdAt: Number(row.created_at),
    };
  }

  async listAll(): Promise<NodeRecord[]> {
    const rows = await withConnection(async (connection) => {
      return connection.query("SELECT * FROM nodes ORDER BY created_at DESC");
    });
    return (Array.isArray(rows) ? rows : []).map((row) => ({
      wallet: row.wallet,
      nodeId: row.node_id,
      role: row.role === "root" ? "root" : "normal",
      ramMb: Number(row.ram_mb),
      cpuTflops: Number(row.cpu_tflops),
      storageGb: Number(row.storage_gb),
      bandwidthMbps: Number(row.bandwidth_mbps),
      status: row.status === "active" ? "active" : "inactive",
      lastHeartbeat: Number(row.last_heartbeat),
      createdAt: Number(row.created_at),
    }));
  }

  async create(node: NodeRecord): Promise<NodeRecord> {
    await withConnection(async (connection) => {
      await connection.query(
        `INSERT INTO nodes (wallet, node_id, role, ram_mb, cpu_tflops, storage_gb, bandwidth_mbps, status, last_heartbeat, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           node_id = VALUES(node_id),
           role = VALUES(role),
           ram_mb = VALUES(ram_mb),
           cpu_tflops = VALUES(cpu_tflops),
           storage_gb = VALUES(storage_gb),
           bandwidth_mbps = VALUES(bandwidth_mbps),
           status = VALUES(status),
           last_heartbeat = VALUES(last_heartbeat)`,
        [
          node.wallet,
          node.nodeId,
          node.role,
          node.ramMb,
          node.cpuTflops,
          node.storageGb,
          node.bandwidthMbps,
          node.status,
          node.lastHeartbeat,
          node.createdAt,
        ],
      );
    });

    return node;
  }
}
