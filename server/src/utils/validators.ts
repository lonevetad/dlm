export function sanitizeText(value: unknown, fallback = ""): string {
  if (typeof value !== "string") {
    return fallback;
  }

  return value.trim().slice(0, 4096);
}

export function toNumber(value: unknown, fallback = 0): number {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function normalizeRole(rawRole: unknown): "root" | "normal" {
  const value = sanitizeText(rawRole, "normal").toLowerCase();
  return value === "root" ? "root" : "normal";
}

export function validateWallet(value: unknown): boolean {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.trim().length <= 128
  );
}

export function validateUserPayload(payload: Record<string, unknown>) {
  const userId = sanitizeText(payload?.userId, "");
  const wallet = sanitizeText(payload?.wallet, "");
  const username = sanitizeText(payload?.username, "anonymous");

  if (!userId || !wallet) {
    throw new Error("userId and wallet are required");
  }

  if (!validateWallet(wallet)) {
    throw new Error("wallet is invalid");
  }

  return {
    userId,
    wallet,
    username,
  };
}

export function validatePromptPayload(payload: Record<string, unknown>) {
  const userId = sanitizeText(payload?.userId, "");
  const wallet = sanitizeText(payload?.wallet, "");
  const promptText = sanitizeText(payload?.promptText, "");

  if (!userId || !wallet || !promptText) {
    throw new Error("userId, wallet, and promptText are required");
  }

  if (!validateWallet(wallet)) {
    throw new Error("wallet is invalid");
  }

  return {
    userId,
    wallet,
    promptText,
    promptHash: sanitizeText(payload?.promptHash, `hash:${Date.now()}`),
  };
}

export function validateNodePayload(payload: Record<string, unknown>) {
  const wallet = sanitizeText(payload?.wallet, "");
  const nodeId = sanitizeText(payload?.nodeId, "");

  if (!wallet || !nodeId) {
    throw new Error("wallet and nodeId are required");
  }

  if (!validateWallet(wallet)) {
    throw new Error("wallet is invalid");
  }

  const status = sanitizeText(payload?.status, "active").toLowerCase();

  return {
    wallet,
    nodeId,
    role: normalizeRole(payload?.role),
    ramMb: Math.max(0, toNumber(payload?.ramMb, 0)),
    cpuTflops: Math.max(0, toNumber(payload?.cpuTflops, 0)),
    storageGb: Math.max(0, toNumber(payload?.storageGb, 0)),
    bandwidthMbps: Math.max(0, toNumber(payload?.bandwidthMbps, 0)),
    status: status === "active" ? "active" : "inactive",
  };
}
