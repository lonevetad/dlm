import { NodeRepository } from "./NodeRepository.ts";
import type { NodeRecord } from "../types.ts";

const nodeRepository = new NodeRepository();

export async function registerNode({
  wallet,
  nodeId,
  role,
  ramMb,
  cpuTflops,
  storageGb,
  bandwidthMbps,
}: {
  wallet: string;
  nodeId: string;
  role: "root" | "normal";
  ramMb: number;
  cpuTflops: number;
  storageGb: number;
  bandwidthMbps: number;
}): Promise<NodeRecord> {
  const normalizedRole = role === "root" ? "root" : "normal";
  const node: NodeRecord = {
    wallet,
    nodeId,
    role: normalizedRole,
    ramMb: Number(ramMb || 0),
    cpuTflops: Number(cpuTflops || 0),
    storageGb: Number(storageGb || 0),
    bandwidthMbps: Number(bandwidthMbps || 0),
    status: "active",
    lastHeartbeat: Date.now(),
    createdAt: Date.now(),
  };

  return nodeRepository.create(node);
}

export async function listNodes(): Promise<NodeRecord[]> {
  return nodeRepository.listAll();
}

export async function getNodeSummary(
  wallet: string,
): Promise<NodeRecord | null> {
  return nodeRepository.findByWallet(wallet);
}
