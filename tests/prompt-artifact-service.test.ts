import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { PromptArtifactService } from "../server/src/services/PromptArtifactService.ts";

const root = path.resolve(process.cwd(), "server", "data", "test-artifacts");

test("writes prompt, response and elected node files under the user folder only", () => {
  const wallet = "0xuser123";
  const promptId = "p_test_001";

  // Create a per-test subfolder so each test stores artifacts separately
  const testRoot = path.resolve(root, "prompt-artifact-service.test", promptId);
  const service = new PromptArtifactService(testRoot);

  service.writePromptContent(wallet, promptId, "hello from user");
  service.writeResponse(wallet, promptId, "hello back");
  service.writeElectedNodes(wallet, promptId, [
    { wallet: "0xnode1", nodeId: "n1" },
  ]);

  const promptPath = path.join(testRoot, wallet, "prompts", `${promptId}.txt`);
  const responsePath = path.join(
    testRoot,
    wallet,
    "responses",
    `${promptId}.txt`,
  );
  const nodesPath = path.join(
    testRoot,
    wallet,
    "elected-nodes",
    `${promptId}.json`,
  );

  assert.equal(fs.existsSync(promptPath), true);
  assert.equal(fs.existsSync(responsePath), true);
  assert.equal(fs.existsSync(nodesPath), true);

  assert.equal(fs.readFileSync(promptPath, "utf8"), "hello from user");
  assert.equal(fs.readFileSync(responsePath, "utf8"), "hello back");
  assert.deepEqual(JSON.parse(fs.readFileSync(nodesPath, "utf8")), [
    { wallet: "0xnode1", nodeId: "n1" },
  ]);
});
