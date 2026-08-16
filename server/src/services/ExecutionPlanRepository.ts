import { withConnection } from "../db/mariaDb.ts";
import type { ExecutionPlan } from "../types.ts";

export class ExecutionPlanRepository {
  async findByPromptId(promptId: string): Promise<ExecutionPlan | null> {
    const rows = await withConnection(async (connection) => {
      return connection.query(
        "SELECT * FROM execution_plans WHERE prompt_id = ? ORDER BY created_at DESC LIMIT 1",
        [promptId],
      );
    });
    const row = Array.isArray(rows) ? rows[0] : null;
    if (!row) {
      return null;
    }

    const rawPlan = row.plan_json as unknown;
    return (
      typeof rawPlan === "string" ? JSON.parse(rawPlan) : rawPlan
    ) as ExecutionPlan;
  }

  async listAll(): Promise<ExecutionPlan[]> {
    const rows = await withConnection(async (connection) => {
      return connection.query(
        "SELECT * FROM execution_plans ORDER BY created_at DESC",
      );
    });
    return (Array.isArray(rows) ? rows : []).map((row) => {
      const rawPlan = row.plan_json as unknown;
      return (
        typeof rawPlan === "string" ? JSON.parse(rawPlan) : rawPlan
      ) as ExecutionPlan;
    });
  }

  async create(plan: ExecutionPlan): Promise<ExecutionPlan> {
    await withConnection(async (connection) => {
      await connection.query(
        "INSERT INTO execution_plans (id, prompt_id, model_version, node_set_hash, plan_json, created_at) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE model_version = VALUES(model_version), node_set_hash = VALUES(node_set_hash), plan_json = VALUES(plan_json)",
        [
          plan.planId,
          plan.promptId,
          plan.modelVersion,
          plan.nodeSetHash,
          JSON.stringify(plan),
          plan.createdAt,
        ],
      );
    });

    return plan;
  }
}
