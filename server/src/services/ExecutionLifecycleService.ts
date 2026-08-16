import { ExecutionPlanRepository } from "./ExecutionPlanRepository.ts";
import { ExecutionPlanService } from "./ExecutionPlanService.ts";
import { PromptLifecycleService } from "./promptLifecycle.ts";

export class ExecutionLifecycleService {
  private readonly executionPlanService: ExecutionPlanService;
  private readonly promptLifecycleService: PromptLifecycleService;
  private readonly executionPlanRepository: ExecutionPlanRepository;

  constructor({
    executionPlanService,
    promptLifecycleService,
  }: {
    executionPlanService: ExecutionPlanService;
    promptLifecycleService: PromptLifecycleService;
  }) {
    this.executionPlanService = executionPlanService;
    this.promptLifecycleService = promptLifecycleService;
    this.executionPlanRepository = new ExecutionPlanRepository();
  }

  private normaliseStatus(status: unknown): string {
    const mapped = String(status ?? "").toLowerCase();
    const valid = new Set([
      "submitted",
      "accepted",
      "rejected",
      "queued",
      "assigned",
      "waiting_for_results",
      "paused",
      "resumed",
      "executing",
      "completed",
      "failed",
    ]);

    if (!valid.has(mapped)) {
      throw new Error(`Unsupported prompt status: ${String(status)}`);
    }

    return mapped;
  }

  private async persistPlanState(
    plan: ReturnType<ExecutionPlanService["schedulePromptExecution"]>,
  ) {
    await this.executionPlanRepository.create(plan);
  }

  async buildExecutionPlan({
    promptId,
    modelVersion = "gemma-2b",
    nodes = [],
  }: {
    promptId: string;
    modelVersion?: string;
    nodes?: any[];
  }) {
    const existingPrompt =
      await this.promptLifecycleService.getPrompt(promptId);
    if (!existingPrompt) {
      await this.promptLifecycleService.submitPrompt({
        id: promptId,
        userId: "system",
        wallet: "system",
        promptText: `Execution plan for ${promptId}`,
        promptHash: `plan:${promptId}`,
      });
    }

    const plan = this.executionPlanService.schedulePromptExecution({
      promptId,
      modelVersion,
      nodes,
    });
    await this.persistPlanState(plan);
    await this.promptLifecycleService.updatePromptStatus(promptId, "queued");
    await this.promptLifecycleService.setAssignedNodeSetHash(
      promptId,
      plan.nodeSetHash,
    );
    return plan;
  }

  async pauseExecution(promptId: string, reason = "execution paused") {
    const prompt = await this.promptLifecycleService.getPrompt(promptId);
    if (!prompt) {
      throw new Error(`Prompt not found: ${promptId}`);
    }

    const plan =
      (await this.executionPlanRepository.findByPromptId(promptId)) ??
      this.executionPlanService.schedulePromptExecution({
        promptId,
        modelVersion: "gemma-2b",
        nodes: [],
      });

    const pausedPlan = {
      ...plan,
      status: "paused",
      awaitingNodeResults: false,
      pausedReason: reason,
      lastCheckpointAt: Date.now(),
    } as typeof plan;

    await this.persistPlanState(pausedPlan);
    await this.promptLifecycleService.updatePromptStatus(promptId, "paused");
    return pausedPlan;
  }

  async waitForNodeResults(promptId: string, stageId?: string) {
    const prompt = await this.promptLifecycleService.getPrompt(promptId);
    if (!prompt) {
      throw new Error(`Prompt not found: ${promptId}`);
    }

    const plan =
      (await this.executionPlanRepository.findByPromptId(promptId)) ??
      this.executionPlanService.schedulePromptExecution({
        promptId,
        modelVersion: "gemma-2b",
        nodes: [],
      });

    const updatedPlan = {
      ...plan,
      status: "waiting_for_results",
      awaitingNodeResults: true,
      currentStageIndex:
        typeof stageId === "string"
          ? Math.max(
              0,
              plan.shards.findIndex((shard) => shard.shardId === stageId),
            )
          : plan.currentStageIndex,
      lastCheckpointAt: Date.now(),
    } as typeof plan;

    await this.persistPlanState(updatedPlan);
    await this.promptLifecycleService.updatePromptStatus(
      promptId,
      "waiting_for_results",
    );
    return updatedPlan;
  }

  async resumeExecution(promptId: string) {
    const prompt = await this.promptLifecycleService.getPrompt(promptId);
    if (!prompt) {
      throw new Error(`Prompt not found: ${promptId}`);
    }

    const plan =
      (await this.executionPlanRepository.findByPromptId(promptId)) ??
      this.executionPlanService.schedulePromptExecution({
        promptId,
        modelVersion: "gemma-2b",
        nodes: [],
      });

    const resumedPlan = {
      ...plan,
      status: "queued",
      awaitingNodeResults: false,
      pausedReason: null,
      lastCheckpointAt: Date.now(),
    } as typeof plan;

    await this.persistPlanState(resumedPlan);
    await this.promptLifecycleService.updatePromptStatus(promptId, "resumed");
    return resumedPlan;
  }

  async notifyShardResult(
    promptId: string,
    shardId: string,
    payload: { nodeId: string; result: unknown },
  ) {
    const plan =
      (await this.executionPlanRepository.findByPromptId(promptId)) ??
      this.executionPlanService.schedulePromptExecution({
        promptId,
        modelVersion: "gemma-2b",
        nodes: [],
      });

    const shardIndex = plan.shards.findIndex(
      (shard) => shard.shardId === shardId,
    );
    if (shardIndex < 0) {
      throw new Error(`Shard not found for prompt ${promptId}: ${shardId}`);
    }

    const updatedShards = plan.shards.map((shard, index) =>
      index === shardIndex
        ? {
            ...shard,
            status: "completed",
            startedAt: shard.startedAt ?? Date.now(),
            completedAt: Date.now(),
          }
        : shard,
    );

    const partialResults = { ...(plan.partialResults ?? {}) };
    partialResults[shardId] = {
      nodeId: payload.nodeId,
      result: payload.result,
      receivedAt: Date.now(),
    };

    const updatedPlan = {
      ...plan,
      shards: updatedShards,
      partialResults,
      currentStageIndex: Math.max(plan.currentStageIndex, shardIndex + 1),
      awaitingNodeResults: true,
      lastCheckpointAt: Date.now(),
    } as typeof plan;

    const allShardsCompleted = updatedPlan.shards.every(
      (shard) => shard.status === "completed" || shard.completedAt != null,
    );

    if (allShardsCompleted) {
      updatedPlan.status = "completed";
      updatedPlan.awaitingNodeResults = false;
      updatedPlan.lastCheckpointAt = Date.now();
      await this.promptLifecycleService.updatePromptStatus(
        promptId,
        "completed",
      );
    } else {
      updatedPlan.status = "waiting_for_results";
      updatedPlan.awaitingNodeResults = true;
      updatedPlan.lastCheckpointAt = Date.now();
      await this.promptLifecycleService.updatePromptStatus(
        promptId,
        "waiting_for_results",
      );
    }

    await this.persistPlanState(updatedPlan);
    return updatedPlan;
  }

  async advanceStatus(promptId: string, status: unknown) {
    const nextStatus = this.normaliseStatus(status);
    const prompt = await this.promptLifecycleService.updatePromptStatus(
      promptId,
      nextStatus,
    );

    if (nextStatus === "paused") {
      await this.pauseExecution(promptId, "manual pause");
    }

    if (nextStatus === "waiting_for_results") {
      await this.waitForNodeResults(promptId);
    }

    if (nextStatus === "resumed") {
      await this.resumeExecution(promptId);
    }

    return prompt;
  }
}
