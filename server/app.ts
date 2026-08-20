import express, { Express, Request, Response } from "express";
import { ensureDatabaseSchema, connectDatabase } from "./src/db/mariaDb.ts";
import { env } from "./src/config/env.ts";
import { DaoIdentityService } from "./src/services/DaoIdentityService.ts";
import {
  validateNodePayload,
  validatePromptPayload,
  validateUserPayload,
} from "./src/utils/validators.ts";
import { ExecutionPlanService } from "./src/services/ExecutionPlanService.ts";
import { ExecutionLifecycleService } from "./src/services/ExecutionLifecycleService.ts";
import { promptLifecycleService } from "./src/services/promptLifecycle.ts";
import { modelRegistry } from "./src/services/ModelRegistry.ts";

const app: Express = express();
const daoIdentityService = new DaoIdentityService();
const executionPlanService = new ExecutionPlanService();
const executionLifecycleService = new ExecutionLifecycleService({
  executionPlanService,
  promptLifecycleService,
});

app.use(express.json({ limit: "1mb" }));

const handleError = (res: Response, err: unknown) => {
  if (err instanceof Error) {
    return res.status(400).json({ error: err.message });
  }

  return res.status(500).json({ error: "internal server error" });
};

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", service: "dlm-server", version: "0.2.0-ts" });
});

app.post("/api/users/register", async (req: Request, res: Response) => {
  try {
    const payload = validateUserPayload(req.body as Record<string, unknown>);
    const userExists = await daoIdentityService.userExists(payload.wallet);
    if (!userExists) {
      throw new Error("wallet is not registered in the DAO");
    }

    const user = await promptLifecycleService.registerUser({
      wallet: payload.wallet,
      userId: payload.userId,
      username: payload.username,
    });

    return res.status(201).json({ message: "user registered", user });
  } catch (error) {
    return handleError(res, error);
  }
});

app.post("/api/nodes/register", async (req: Request, res: Response) => {
  try {
    const payload = validateNodePayload(req.body as Record<string, unknown>);
    const nodeExists = await daoIdentityService.nodeExists(payload.wallet);
    if (!nodeExists) {
      throw new Error("wallet is not registered in the DAO as a node");
    }

    const node = await promptLifecycleService.registerNode({
      ...payload,
      status: payload.status === "active" ? "active" : "inactive",
      lastHeartbeat: Date.now(),
      createdAt: Date.now(),
    });
    return res.status(201).json({ message: "node registered", node });
  } catch (error) {
    return handleError(res, error);
  }
});

app.post("/api/prompts/submit", async (req: Request, res: Response) => {
  try {
    const payload = validatePromptPayload(req.body as Record<string, unknown>);
    const userExists = await daoIdentityService.userExists(payload.wallet);
    if (!userExists) {
      throw new Error("wallet is not registered in the DAO");
    }

    const prompt = await promptLifecycleService.submitPrompt({
      id: `p_${Date.now()}`,
      userId: payload.userId,
      wallet: payload.wallet,
      promptText: payload.promptText,
      promptHash: payload.promptHash,
    });

    return res
      .status(201)
      .json({ message: "prompt accepted into queue", prompt });
  } catch (error) {
    return handleError(res, error);
  }
});

app.post("/api/prompts/plan", async (req: Request, res: Response) => {
  try {
    const { promptId, modelVersion, nodes } = req.body as {
      promptId?: string;
      modelVersion?: string;
      nodes?: unknown[];
    };

    if (!promptId || typeof promptId !== "string") {
      return res.status(400).json({ error: "promptId is required" });
    }

    const plan = await executionLifecycleService.buildExecutionPlan({
      promptId,
      modelVersion: modelVersion ?? "gemma-2b",
      nodes: Array.isArray(nodes)
        ? nodes.map((node) =>
            validateNodePayload(node as Record<string, unknown>),
          )
        : [],
    });

    return res.status(201).json({ message: "execution plan created", plan });
  } catch (error) {
    return handleError(res, error);
  }
});

app.patch(
  "/api/prompts/:promptId/status",
  async (req: Request, res: Response) => {
    try {
      const promptId = Array.isArray(req.params.promptId)
        ? req.params.promptId[0]
        : req.params.promptId;
      const prompt = await executionLifecycleService.advanceStatus(
        promptId,
        req.body?.status,
      );
      return res.json({ message: "prompt status updated", prompt });
    } catch (error) {
      return handleError(res, error);
    }
  },
);

app.get("/api/models", (_req: Request, res: Response) => {
  res.json({ models: modelRegistry.listModels() });
});

export async function startServer() {
  await connectDatabase();
  await ensureDatabaseSchema();
  server = app.listen(env.port, () => {
    console.log(`DLM server running on http://localhost:${env.port}`);
  });
}

let server: any = null;

export async function stopServer() {
  try {
    if (server && server.close) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  } finally {
    await disconnectDatabase();
  }
}

// graceful shutdown
import { disconnectDatabase } from "./src/db/mariaDb.ts";

process.on("SIGINT", async () => {
  console.log("SIGINT received, shutting down...");
  try {
    await disconnectDatabase();
  } catch (e) {
    // ignore
  }
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down...");
  try {
    await disconnectDatabase();
  } catch (e) {
    // ignore
  }
  process.exit(0);
});
