import crypto from "crypto";
import { ModelRegistry } from "./ModelRegistry.ts";
import { modelRegistry } from "./ModelRegistry.ts";
import type {
  ExecutionPlan,
  ExecutionPlanShard,
  NodeRecord,
} from "../types.ts";

export class ExecutionPlanService {
  private readonly modelRegistry: ModelRegistry;

  constructor(modelRegistryInstance: ModelRegistry = modelRegistry) {
    this.modelRegistry = modelRegistryInstance;
  }

  buildStageGraph(modelVersion = "gemma-2b") {
    const model = this.modelRegistry.getModel(modelVersion);
    return model.stages.map((stage) => ({
      ...stage,
      modelVersion,
      shardId: `${modelVersion}-${stage.id}`,
      dependencies: stage.dependencies ?? [],
    }));
  }

  scoreNodeForShard(
    node: NodeRecord,
    shard: {
      requiredRamMb: number;
      requiredCpuTflops: number;
      requiredBandwidthMbps: number;
    },
  ): number {
    const ramScore =
      Math.min(node.ramMb / Math.max(shard.requiredRamMb, 1), 1.5) * 0.45;
    const cpuScore =
      Math.min(node.cpuTflops / Math.max(shard.requiredCpuTflops, 1), 1.5) *
      0.25;
    const bandwidthScore =
      Math.min(
        node.bandwidthMbps / Math.max(shard.requiredBandwidthMbps, 1),
        1.5,
      ) * 0.2;
    const healthScore = node.status === "active" ? 0.1 : 0.02;
    return ramScore + cpuScore + bandwidthScore + healthScore;
  }

  selectEligibleNodes(
    nodes: NodeRecord[],
    shard: {
      requiredRamMb: number;
      requiredCpuTflops: number;
      requiredBandwidthMbps: number;
    },
  ): NodeRecord[] {
    return nodes.filter((node) => {
      return (
        node.status === "active" &&
        node.ramMb >= shard.requiredRamMb &&
        node.cpuTflops >= shard.requiredCpuTflops &&
        node.bandwidthMbps >= shard.requiredBandwidthMbps
      );
    });
  }

  generateNodeSetHash(nodeIds: string[]): string {
    return crypto
      .createHash("sha256")
      .update(JSON.stringify([...nodeIds].sort()))
      .digest("hex");
  }

  schedulePromptExecution({
    promptId,
    modelVersion = "gemma-2b",
    nodes = [],
  }: {
    promptId: string;
    modelVersion?: string;
    nodes?: NodeRecord[];
  }): ExecutionPlan {
    if (!promptId) {
      throw new Error("promptId is required");
    }

    const shards = this.buildStageGraph(modelVersion);
    const assignedShards: ExecutionPlanShard[] = shards.map((shard) => {
      const eligibleNodes = this.selectEligibleNodes(nodes, shard);
      if (eligibleNodes.length === 0) {
        throw new Error(`No eligible nodes for shard ${shard.id}`);
      }

      const rankedNodes = [...eligibleNodes].sort((a, b) => {
        return (
          this.scoreNodeForShard(b, shard) - this.scoreNodeForShard(a, shard)
        );
      });

      const primaryNode = rankedNodes[0];
      const backupNode = rankedNodes[1] || primaryNode;

      return {
        ...shard,
        assignedNode: {
          wallet: primaryNode.wallet,
          nodeId: primaryNode.nodeId,
          role: primaryNode.role,
        },
        backupNode: {
          wallet: backupNode.wallet,
          nodeId: backupNode.nodeId,
          role: backupNode.role,
        },
        status: "queued",
      };
    });

    const finalAggregator =
      [...nodes].sort((a, b) => b.ramMb - a.ramMb)[0] ?? null;

    return {
      planId: `plan_${Date.now()}`,
      promptId,
      modelVersion,
      status: "queued",
      currentStageIndex: 0,
      awaitingNodeResults: false,
      resumeToken: crypto.randomUUID(),
      lastCheckpointAt: Date.now(),
      pausedReason: null,
      partialResults: {},
      finalAggregator: finalAggregator
        ? {
            wallet: finalAggregator.wallet,
            nodeId: finalAggregator.nodeId,
            role: finalAggregator.role,
          }
        : null,
      shards: assignedShards,
      nodeSetHash: this.generateNodeSetHash(
        assignedShards.map((shard) => shard.assignedNode.wallet),
      ),
      createdAt: Date.now(),
    };
  }
}
