import test from "node:test";
import assert from "node:assert/strict";

import {
  validatePromptPayload,
  validateUserPayload,
} from "../server/src/utils/validators.ts";

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
