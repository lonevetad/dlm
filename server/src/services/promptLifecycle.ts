import { PromptRepository } from "./PromptRepository.ts";
import { UserRepository } from "./UserRepository.ts";
import { NodeRepository } from "./NodeRepository.ts";
import { PromptArtifactService } from "./PromptArtifactService.ts";
import type { NodeRecord, PromptRecord, PromptStatus } from "../types.ts";

const promptRepository = new PromptRepository();
const userRepository = new UserRepository();
const nodeRepository = new NodeRepository();
const promptArtifactService = new PromptArtifactService();

export class PromptLifecycleService {
  private readonly promptRepository: PromptRepository;
  private readonly userRepository: UserRepository;
  private readonly nodeRepository: NodeRepository;
  private readonly promptArtifactService: PromptArtifactService;

  constructor() {
    this.promptRepository = promptRepository;
    this.userRepository = userRepository;
    this.nodeRepository = nodeRepository;
    this.promptArtifactService = promptArtifactService;
  }

  async registerUser({
    wallet,
    userId,
    username,
  }: {
    wallet: string;
    userId: string;
    username: string;
  }) {
    const user = {
      wallet,
      userId,
      username,
      createdAt: Date.now(),
    };

    return this.userRepository.create(user);
  }

  async registerNode(node: NodeRecord): Promise<NodeRecord> {
    const normalized: NodeRecord = {
      ...node,
      role: node.role === "root" ? "root" : "normal",
      status: node.status === "active" ? "active" : "inactive",
      lastHeartbeat: Date.now(),
      createdAt: node.createdAt ?? Date.now(),
    };

    return this.nodeRepository.create(normalized);
  }

  async submitPrompt({
    id,
    userId,
    wallet,
    promptText,
    promptHash,
  }: {
    id?: string;
    userId: string;
    wallet: string;
    promptText: string;
    promptHash: string;
  }): Promise<PromptRecord> {
    const promptId = id ?? `p_${Date.now()}`;
    const prompt: PromptRecord = {
      id: promptId,
      userId,
      wallet,
      promptText,
      promptHash,
      status: "submitted",
      assignedNodeSetHash: null,
      createdAt: Date.now(),
    };

    this.promptArtifactService.writePromptContent(wallet, promptId, promptText);
    return this.promptRepository.create(prompt);
  }

  async getPrompt(promptId: string): Promise<PromptRecord | null> {
    return this.promptRepository.findById(promptId);
  }

  async updatePromptStatus(
    promptId: string,
    status: string,
  ): Promise<PromptRecord> {
    const existing = await this.promptRepository.findById(promptId);
    if (!existing) {
      throw new Error(`Prompt not found: ${promptId}`);
    }

    const nextStatus = String(status || "").toLowerCase();
    const allowed = new Set([
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

    if (!allowed.has(nextStatus)) {
      throw new Error(`Unsupported status: ${status}`);
    }

    const updated = { ...existing, status: nextStatus as PromptStatus };
    await this.promptRepository.create(updated);
    return updated;
  }

  async setAssignedNodeSetHash(
    promptId: string,
    hash: string | null,
  ): Promise<PromptRecord> {
    const prompt = await this.promptRepository.findById(promptId);
    if (!prompt) {
      throw new Error(`Prompt not found: ${promptId}`);
    }

    const updated = { ...prompt, assignedNodeSetHash: hash ?? null };
    await this.promptRepository.create(updated);
    return updated;
  }

  async listPrompts(): Promise<PromptRecord[]> {
    return this.promptRepository.listAll();
  }
}

export const promptLifecycleService = new PromptLifecycleService();

export const registerUser = (
  ...args: Parameters<PromptLifecycleService["registerUser"]>
) => promptLifecycleService.registerUser(...args);
export const registerNode = (
  ...args: Parameters<PromptLifecycleService["registerNode"]>
) => promptLifecycleService.registerNode(...args);
export const submitPrompt = (
  ...args: Parameters<PromptLifecycleService["submitPrompt"]>
) => promptLifecycleService.submitPrompt(...args);
export const listPrompts = () => promptLifecycleService.listPrompts();
export const getPrompt = (promptId: string) =>
  promptLifecycleService.getPrompt(promptId);
export const updatePromptStatus = (promptId: string, status: string) =>
  promptLifecycleService.updatePromptStatus(promptId, status);
export const setAssignedNodeSetHash = (promptId: string, hash: string | null) =>
  promptLifecycleService.setAssignedNodeSetHash(promptId, hash);
