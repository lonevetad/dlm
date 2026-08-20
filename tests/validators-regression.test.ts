import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import fs from "node:fs";

import {
  validatePromptPayload,
  validateUserPayload,
} from "../server/src/utils/validators.ts";

// ensure tests use isolated data dir (no repo pollution)
const testRoot = path.resolve(
  process.cwd(),
  "server",
  "data",
  "test-artifacts",
  "validators-regression.test",
);
fs.mkdirSync(testRoot, { recursive: true });
process.env.DLM_TEST_DATA_DIR = testRoot;

test("validateUserPayload accepts registration payloads", () => {
  const payload = validateUserPayload({
    wallet: "0xabc123",
    userId: "alice",
    username: "Alice",
  });

  assert.deepEqual(payload, {
    wallet: "0xabc123",
    userId: "alice",
    username: "Alice",
  });
});

test("validatePromptPayload still requires promptText", () => {
  assert.throws(
    () =>
      validatePromptPayload({
        wallet: "0xabc123",
        userId: "alice",
      } as Record<string, unknown>),
    /userId, wallet, and promptText are required/,
  );
});
