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
const {
  schedulePromptExecution,
  getExecutionPlan,
  listExecutionPlans,
} = require('./src/services/scheduler');
const {
  validateNodePayload,
  validatePromptPayload,
  sanitizeText,
} = require('./src/utils/validators');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json({ limit: '1mb' }));

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'dlm-server',
    version: '0.1.0',
  });
});

const handleError = (res, err) => {
  if (err instanceof Error) {
    return res.status(400).json({ error: err.message });
  }

  return res.status(500).json({ error: 'internal server error' });
};

app.post('/api/users/register', (req, res) => {
  try {
    const { userId, username, wallet } = req.body;
    const payload = {
      userId,
      username,
      wallet,
    };

    if (!payload.userId || !payload.wallet) {
      return res.status(400).json({ error: 'userId and wallet are required' });
    }

    const user = registerUser({
      userId: sanitizeText(payload.userId),
      username: sanitizeText(payload.username, 'anonymous'),
      wallet: sanitizeText(payload.wallet),
    });

    return res.status(201).json({ message: 'user registered', user });
  } catch (error) {
    return handleError(res, error);
  }
});

app.post('/api/nodes/register', (req, res) => {
  try {
    const payload = validateNodePayload(req.body);
    const node = registerNode(payload);
    return res.status(201).json({ message: 'node registered', node });
  } catch (error) {
    return handleError(res, error);
  }
});

app.get('/api/nodes', (req, res) => {
  try {
    res.json({ nodes: listNodes() });
  } catch (error) {
    return handleError(res, error);
  }
});

app.get('/api/nodes/:wallet', (req, res) => {
  try {
    const node = getNodeSummary(req.params.wallet);

    if (!node) {
      return res.status(404).json({ error: 'node not found' });
    }

    return res.json({ node });
  } catch (error) {
    return handleError(res, error);
  }
});

app.post('/api/prompts/submit', (req, res) => {
  try {
    const payload = validatePromptPayload(req.body);
    const prompt = submitPrompt(payload);
    return res.status(201).json({ message: 'prompt accepted into queue', prompt });
  } catch (error) {
    return handleError(res, error);
  }
});

app.get('/api/prompts', (req, res) => {
  try {
    res.json({ prompts: listPrompts() });
  } catch (error) {
    return handleError(res, error);
  }
});

app.post('/api/prompts/plan', (req, res) => {
  try {
    const { promptId, modelVersion, nodes } = req.body;

    if (!promptId || typeof promptId !== 'string') {
      return res.status(400).json({ error: 'promptId is required' });
    }

    const plan = schedulePromptExecution({
      promptId: sanitizeText(promptId),
      modelVersion: sanitizeText(modelVersion, 'gemma-2b'),
      nodes: Array.isArray(nodes) ? nodes.map((node) => validateNodePayload(node)) : [],
    });

    return res.status(201).json({ message: 'execution plan created', plan });
  } catch (error) {
    return handleError(res, error);
  }
});

app.get('/api/prompts/:promptId/plan', (req, res) => {
  try {
    const plan = getExecutionPlan(req.params.promptId);

    if (!plan) {
      return res.status(404).json({ error: 'execution plan not found' });
    }

    return res.json({ plan });
  } catch (error) {
    return handleError(res, error);
  }
});

app.get('/api/prompts/plans', (req, res) => {
  try {
    res.json({ plans: listExecutionPlans() });
  } catch (error) {
    return handleError(res, error);
  }
});

app.listen(PORT, () => {
  console.log(`DLM server running on http://localhost:${PORT}`);
});
