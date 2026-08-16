const prompts = new Map();

function registerUser({ wallet, userId, username }) {
  return {
    wallet,
    userId,
    username,
    createdAt: Date.now(),
  };
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
