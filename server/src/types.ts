export type NodeRole = "root" | "normal";
export type PromptStatus =
  | "submitted"
  | "accepted"
  | "rejected"
  | "queued"
  | "assigned"
  | "waiting_for_results"
  | "paused"
  | "resumed"
  | "executing"
  | "completed"
  | "failed";

export interface UserRecord {
  wallet: string;
  userId: string;
  username: string;
  createdAt: number;
}

export interface NodeRecord {
  wallet: string;
  nodeId: string;
  role: NodeRole;
  ramMb: number;
  cpuTflops: number;
  storageGb: number;
  bandwidthMbps: number;
  status: "active" | "inactive";
  lastHeartbeat: number;
  createdAt: number;
}

export interface PromptRecord {
  id: string;
  userId: string;
  wallet: string;
  promptText: string;
  promptHash: string;
  status: PromptStatus;
  assignedNodeSetHash: string | null;
  createdAt: number;
}

export interface ModelStage {
  id: string;
  stageName: string;
  requiredRamMb: number;
  requiredCpuTflops: number;
  requiredBandwidthMbps: number;
  dependencies?: string[];
  replicationFactor?: number;
}

export interface ExecutionPlanShard extends ModelStage {
  modelVersion: string;
  shardId: string;
  assignedNode: {
    wallet: string;
    nodeId: string;
    role: string;
  };
  backupNode: {
    wallet: string;
    nodeId: string;
    role: string;
  };
  status: string;
  startedAt?: number;
  completedAt?: number;
}

export interface ExecutionPlan {
  planId: string;
  promptId: string;
  modelVersion: string;
  status:
    | "queued"
    | "paused"
    | "waiting_for_results"
    | "executing"
    | "completed"
    | "failed";
  currentStageIndex: number;
  awaitingNodeResults: boolean;
  resumeToken: string;
  lastCheckpointAt: number;
  pausedReason?: string | null;
  partialResults: Record<
    string,
    {
      nodeId: string;
      result: unknown;
      receivedAt: number;
    }
  >;
  finalAggregator: {
    wallet: string;
    nodeId: string;
    role: string;
  } | null;
  shards: ExecutionPlanShard[];
  nodeSetHash: string;
  createdAt: number;
}
