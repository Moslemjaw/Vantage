const aiLatencyMs = {
  deepseek: null,
  gemini: null,
  synthesis: null,
};

let lastNewsFetchAt = null;

export function setAiLatency(kind, ms) {
  if (!(kind in aiLatencyMs)) return;
  aiLatencyMs[kind] = ms;
}

export function getAiLatency() {
  return { ...aiLatencyMs };
}

export function markNewsFetchNow() {
  lastNewsFetchAt = new Date();
}

export function getLastNewsFetchAt() {
  return lastNewsFetchAt;
}

