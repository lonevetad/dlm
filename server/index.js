const express = require('express');
const {
  registerNode,
  listNodes,
  getNodeSummary,
} = require('./src/services/nodeRegistry');
const {
  registerUser,
  submitPrompt,
  listPrompts,
} = require('./src/services/promptLifecycle');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'dlm-server',
    version: '0.1.0',
  });
});

app.post('/api/users/register', (req, res) => {
  const { userId, username, wallet } = req.body;

  if (!userId || !wallet) {
    return res.status(400).json({ error: 'userId and wallet are required' });
  }

  const user = registerUser({ userId, username: username || 'anonymous', wallet });
  return res.status(201).json({ message: 'user registered', user });
});

app.post('/api/nodes/register', (req, res) => {
  const { wallet, nodeId, role, ramMb, cpuTflops, storageGb, bandwidthMbps } = req.body;

  if (!wallet || !nodeId) {
    return res.status(400).json({ error: 'wallet and nodeId are required' });
  }

  const node = registerNode({
    wallet,
    nodeId,
    role: role || 'normal',
    ramMb: Number(ramMb || 0),
    cpuTflops: Number(cpuTflops || 0),
    storageGb: Number(storageGb || 0),
    bandwidthMbps: Number(bandwidthMbps || 0),
  });

  return res.status(201).json({ message: 'node registered', node });
});

app.get('/api/nodes', (req, res) => {
  res.json({ nodes: listNodes() });
});

app.get('/api/nodes/:wallet', (req, res) => {
  const node = getNodeSummary(req.params.wallet);

  if (!node) {
    return res.status(404).json({ error: 'node not found' });
  }

  return res.json({ node });
});

app.post('/api/prompts/submit', (req, res) => {
  const { userId, wallet, promptText, promptHash } = req.body;

  if (!userId || !wallet || !promptText) {
    return res.status(400).json({ error: 'userId, wallet, and promptText are required' });
  }

  const prompt = submitPrompt({
    userId,
    wallet,
    promptText,
    promptHash: promptHash || `hash:${Date.now()}`,
  });

  return res.status(201).json({ message: 'prompt accepted into queue', prompt });
});

app.get('/api/prompts', (req, res) => {
  res.json({ prompts: listPrompts() });
});

app.listen(PORT, () => {
  console.log(`DLM server running on http://localhost:${PORT}`);
});
