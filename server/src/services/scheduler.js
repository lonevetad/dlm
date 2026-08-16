const crypto = require('crypto');
const { readJson, writeJson } = require('../store');

const STORAGE_FILE = 'execution-plans.json';
const executionPlans = new Map();

function loadExecutionPlans() {
  const data = readJson(STORAGE_FILE, {});
  for (const [key, value] of Object.entries(data)) {
    executionPlans.set(key, value);
  }
}

function saveExecutionPlans() {
  writeJson(STORAGE_FILE, Object.fromEntries(executionPlans));
}

loadExecutionPlans();

const MODEL_STAGE_TEMPLATE = [
  { id: 'prompt_embedding', stageName: 'prompt_embedding', requiredRamMb: 512, requiredCpuTflops: 1, requiredBandwidthMbps: 10 },
  { id: 'layer_block_01', stageName: 'layer_block_01', requiredRamMb: 2048, requiredCpuTflops: 3, requiredBandwidthMbps: 15 },
  { id: 'layer_block_02', stageName: 'layer_block_02', requiredRamMb: 2048, requiredCpuTflops: 3, requiredBandwidthMbps: 15 },
  { id: 'attention_merge', stageName: 'attention_merge', requiredRamMb: 1024, requiredCpuTflops: 2, requiredBandwidthMbps: 12 },
  { id: 'output_projection', stageName: 'output_projection', requiredRamMb: 1024, requiredCpuTflops: 2, requiredBandwidthMbps: 10 },
  { id: 'final_output_node', stageName: 'final_output_node', requiredRamMb: 2048, requiredCpuTflops: 4, requiredBandwidthMbps: 20 },
];

function buildStageGraph(modelVersion = 'gemma-2b') {
  const shards = MODEL_STAGE_TEMPLATE.map((stage, index) => ({
    ...stage,
    modelVersion,
    shardId: `${modelVersion}-${stage.id}`,
    dependencies: index === 0 ? [] : [MODEL_STAGE_TEMPLATE[index - 1].id],
    replicationFactor: 1,
  }));

  return shards;
}

function scoreNodeForShard(node, shard) {
  const ramScore = Math.min(node.ramMb / Math.max(shard.requiredRamMb, 1), 1.5) * 0.45;
  const cpuScore = Math.min(node.cpuTflops / Math.max(shard.requiredCpuTflops, 1), 1.5) * 0.25;
  const bandwidthScore = Math.min(node.bandwidthMbps / Math.max(shard.requiredBandwidthMbps, 1), 1.5) * 0.2;
  const healthScore = node.status === 'active' ? 0.1 : 0.02;
  return ramScore + cpuScore + bandwidthScore + healthScore;
}

function selectEligibleNodes(nodes, shard) {
  return nodes.filter((node) => {
    return (
      node.status === 'active' &&
      node.ramMb >= shard.requiredRamMb &&
      node.cpuTflops >= shard.requiredCpuTflops &&
      node.bandwidthMbps >= shard.requiredBandwidthMbps
    );
  });
}

function generateNodeSetHash(nodeIds) {
  return crypto
    .createHash('sha256')
    .update(JSON.stringify(nodeIds.sort()))
    .digest('hex');
}

function schedulePromptExecution({ promptId, modelVersion = 'gemma-2b', nodes = [] }) {
  if (!promptId) {
    throw new Error('promptId is required');
  }

  const shards = buildStageGraph(modelVersion);
  const assignedShards = shards.map((shard) => {
    const eligibleNodes = selectEligibleNodes(nodes, shard);
    if (eligibleNodes.length === 0) {
      throw new Error(`No eligible nodes for shard ${shard.id}`);
    }

    const rankedNodes = [...eligibleNodes].sort((a, b) => {
      return scoreNodeForShard(b, shard) - scoreNodeForShard(a, shard);
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
      status: 'queued',
    };
  });

  const finalAggregator = [...nodes].sort((a, b) => b.ramMb - a.ramMb)[0] || null;
  const plan = {
    planId: `plan_${Date.now()}`,
    promptId,
    modelVersion,
    finalAggregator: finalAggregator
      ? {
          wallet: finalAggregator.wallet,
          nodeId: finalAggregator.nodeId,
          role: finalAggregator.role,
        }
      : null,
    shards: assignedShards,
    nodeSetHash: generateNodeSetHash(assignedShards.map((shard) => shard.assignedNode.wallet)),
    createdAt: Date.now(),
  };

  executionPlans.set(promptId, plan);
  saveExecutionPlans();
  return plan;
}

function getExecutionPlan(promptId) {
  return executionPlans.get(promptId) || null;
}

function listExecutionPlans() {
  return Array.from(executionPlans.values());
}

module.exports = {
  schedulePromptExecution,
  getExecutionPlan,
  listExecutionPlans,
  buildStageGraph,
};
