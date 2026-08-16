const { readJson, writeJson } = require('../store');

const STORAGE_FILE = 'prompts.json';
let prompts = new Map();

function loadPrompts() {
  const data = readJson(STORAGE_FILE, {});
  prompts = new Map(Object.entries(data));
}

function savePrompts() {
  writeJson(STORAGE_FILE, Object.fromEntries(prompts));
}

loadPrompts();

function registerUser({ wallet, userId, username }) {
  const user = {
    wallet,
    userId,
    username,
    createdAt: Date.now(),
  };

  writeJson('users.json', {
    ...readJson('users.json', {}),
    [wallet]: user,
  });

  return user;
}

function submitPrompt({ userId, wallet, promptText, promptHash }) {
  const prompt = {
    id: `p_${Date.now()}`,
    userId,
    wallet,
    promptText,
    promptHash,
    status: 'queued',
    createdAt: Date.now(),
  };

  prompts.set(prompt.id, prompt);
  savePrompts();
  return prompt;
}

function listPrompts() {
  return Array.from(prompts.values());
}

module.exports = {
  registerUser,
  submitPrompt,
  listPrompts,
};
