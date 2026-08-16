const nodes = new Map();

function registerNode({ wallet, nodeId, role, ramMb, cpuTflops, storageGb, bandwidthMbps }) {
  const normalizedRole = role === 'root' ? 'root' : 'normal';
  const node = {
    wallet,
    nodeId,
    role: normalizedRole,
    ramMb: Number(ramMb || 0),
    cpuTflops: Number(cpuTflops || 0),
    storageGb: Number(storageGb || 0),
    bandwidthMbps: Number(bandwidthMbps || 0),
    status: 'active',
    lastHeartbeat: Date.now(),
  };

  nodes.set(wallet, node);
  return node;
}

function listNodes() {
  return Array.from(nodes.values());
}

function getNodeSummary(wallet) {
  return nodes.get(wallet) || null;
}

module.exports = {
  registerNode,
  listNodes,
  getNodeSummary,
};
