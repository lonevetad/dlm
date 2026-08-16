import { withConnection } from "../db/mariaDb.ts";
import type { PromptRecord, PromptStatus } from "../types.ts";

export class PromptRepository {
  async findById(promptId: string): Promise<PromptRecord | null> {
    const rows = await withConnection(async (connection) => {
      return connection.query("SELECT * FROM prompts WHERE id = ?", [promptId]);
    });
    const row = Array.isArray(rows) ? rows[0] : null;
    if (!row) {
      return null;
    }

    return {
      id: row.id,
      userId: row.user_id,
      wallet: row.wallet,
      promptText: row.prompt_text,
      promptHash: row.prompt_hash,
      status: row.status as PromptStatus,
      assignedNodeSetHash: row.assigned_node_set_hash,
      createdAt: Number(row.created_at),
    };
  }

  async listAll(): Promise<PromptRecord[]> {
    const rows = await withConnection(async (connection) => {
      return connection.query("SELECT * FROM prompts ORDER BY created_at DESC");
    });
    return (Array.isArray(rows) ? rows : []).map((row) => ({
      id: row.id,
      userId: row.user_id,
      wallet: row.wallet,
      promptText: row.prompt_text,
      promptHash: row.prompt_hash,
      status: row.status as PromptStatus,
      assignedNodeSetHash: row.assigned_node_set_hash,
      createdAt: Number(row.created_at),
    }));
  }

  async create(prompt: PromptRecord): Promise<PromptRecord> {
    await withConnection(async (connection) => {
      await connection.query(
        "INSERT INTO prompts (id, user_id, wallet, prompt_text, prompt_hash, status, assigned_node_set_hash, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE status = VALUES(status), assigned_node_set_hash = VALUES(assigned_node_set_hash)",
        [
          prompt.id,
          prompt.userId,
          prompt.wallet,
          prompt.promptText,
          prompt.promptHash,
          prompt.status,
          prompt.assignedNodeSetHash,
          prompt.createdAt,
        ],
      );
    });

    return prompt;
  }

  async updateStatus(
    promptId: string,
    status: PromptStatus,
  ): Promise<PromptRecord | null> {
    const prompt = await this.findById(promptId);
    if (!prompt) {
      return null;
    }

    prompt.status = status;
    await this.create(prompt);
    return prompt;
  }

  async setAssignedNodeSetHash(
    promptId: string,
    hash: string | null,
  ): Promise<PromptRecord | null> {
    const prompt = await this.findById(promptId);
    if (!prompt) {
      return null;
    }

    prompt.assignedNodeSetHash = hash;
    await this.create(prompt);
    return prompt;
  }
}
