function sanitizeText(value, fallback = '') {
  if (typeof value !== 'string') {
    return fallback;
  }

  return value.trim().slice(0, 4096);
}

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function normalizeRole(rawRole) {
  const value = sanitizeText(rawRole, 'normal').toLowerCase();
  return value === 'root' ? 'root' : 'normal';
}

function validateWallet(value) {
  return typeof value === 'string' && value.trim().length > 0 && value.trim().length <= 128;
}

function validatePromptPayload(payload) {
  const userId = sanitizeText(payload?.userId, '');
  const wallet = sanitizeText(payload?.wallet, '');
  const promptText = sanitizeText(payload?.promptText, '');

  if (!userId || !wallet || !promptText) {
    throw new Error('userId, wallet, and promptText are required');
  }

  if (!validateWallet(wallet)) {
    throw new Error('wallet is invalid');
  }

  return {
    userId,
    wallet,
    promptText,
    promptHash: sanitizeText(payload?.promptHash, `hash:${Date.now()}`),
  };
}

function validateNodePayload(payload) {
  const wallet = sanitizeText(payload?.wallet, '');
  const nodeId = sanitizeText(payload?.nodeId, '');

  if (!wallet || !nodeId) {
    throw new Error('wallet and nodeId are required');
  }

  if (!validateWallet(wallet)) {
    throw new Error('wallet is invalid');
  }

  const status = sanitizeText(payload?.status, 'active').toLowerCase();

  return {
    wallet,
    nodeId,
    role: normalizeRole(payload?.role),
    ramMb: Math.max(0, toNumber(payload?.ramMb, 0)),
    cpuTflops: Math.max(0, toNumber(payload?.cpuTflops, 0)),
    storageGb: Math.max(0, toNumber(payload?.storageGb, 0)),
    bandwidthMbps: Math.max(0, toNumber(payload?.bandwidthMbps, 0)),
    status: status === 'active' ? 'active' : 'inactive',
  };
}

module.exports = {
  sanitizeText,
  toNumber,
  normalizeRole,
  validateWallet,
  validatePromptPayload,
  validateNodePayload,
};
