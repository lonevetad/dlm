import test from "node:test";
import assert from "node:assert/strict";

import { ExecutionLifecycleService } from "../server/src/services/ExecutionLifecycleService.ts";
import { ExecutionPlanService } from "../server/src/services/ExecutionPlanService.ts";
import { PromptLifecycleService } from "../server/src/services/promptLifecycle.ts";

const executionPlanService = new ExecutionPlanService();
const promptLifecycleService = new PromptLifecycleService();
const lifecycle = new ExecutionLifecycleService({
  executionPlanService,
  promptLifecycleService,
});

test("creates and advances execution lifecycle states", async () => {
  const prompt = await promptLifecycleService.submitPrompt({
    userId: "alice",
    wallet: "0x123",
    promptText: "hello world",
    promptHash: "abc123",
  });

  const plan = await lifecycle.buildExecutionPlan({
    promptId: prompt.id,
    modelVersion: "gemma-2b",
    nodes: [
      {
        wallet: "0xaaa",
        nodeId: "root-a",
        role: "root",
        ramMb: 16384,
        cpuTflops: 20,
        bandwidthMbps: 1000,
        status: "active",
      },
      {
        wallet: "0xbbb",
        nodeId: "node-b",
        role: "normal",
        ramMb: 8192,
        cpuTflops: 10,
        bandwidthMbps: 500,
        status: "active",
      },
      {
        wallet: "0xccc",
        nodeId: "node-c",
        role: "normal",
        ramMb: 8192,
        cpuTflops: 12,
        bandwidthMbps: 600,
        status: "active",
      },
    ],
  });

  assert.equal(plan.promptId, prompt.id);
  const queuedPrompt = await promptLifecycleService.getPrompt(prompt.id);
  assert.equal(queuedPrompt?.status, "queued");

  const started = await lifecycle.advanceStatus(prompt.id, "executing");
  assert.equal(started.status, "executing");

  const complete = await lifecycle.advanceStatus(prompt.id, "completed");
  assert.equal(complete.status, "completed");
});

test("collects shard results through an event-based completion trigger", async () => {
  const prompt = await promptLifecycleService.submitPrompt({
    userId: "bob",
    wallet: "0x999",
    promptText: "event-triggered execution",
    promptHash: "hash-999",
  });

  const plan = await lifecycle.buildExecutionPlan({
    promptId: prompt.id,
    modelVersion: "gemma-2b",
    nodes: [
      {
        wallet: "0xaaa",
        nodeId: "root-a",
        role: "root",
        ramMb: 16384,
        cpuTflops: 20,
        bandwidthMbps: 1000,
        status: "active",
      },
      {
        wallet: "0xbbb",
        nodeId: "node-b",
        role: "normal",
        ramMb: 8192,
        cpuTflops: 10,
        bandwidthMbps: 500,
        status: "active",
      },
      {
        wallet: "0xccc",
        nodeId: "node-c",
        role: "normal",
        ramMb: 8192,
        cpuTflops: 12,
        bandwidthMbps: 600,
        status: "active",
      },
    ],
  });

  for (let index = 0; index < plan.shards.length; index += 1) {
    const shard = plan.shards[index];
    const result = await lifecycle.notifyShardResult(prompt.id, shard.shardId, {
      nodeId: shard.assignedNode.nodeId,
      result: `partial-${shard.shardId}`,
    });

    if (index < plan.shards.length - 1) {
      assert.equal(result.status, "waiting_for_results");
    }
  }

  const currentPrompt = await promptLifecycleService.getPrompt(prompt.id);
  assert.equal(currentPrompt?.status, "completed");

  const storedPrompt = await promptLifecycleService.getPrompt(prompt.id);
  assert.equal(storedPrompt?.status, "completed");
});
