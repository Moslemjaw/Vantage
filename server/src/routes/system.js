import express from 'express';
import { News } from '../models/News.js';
import { getAiLatency, getLastNewsFetchAt } from '../lib/metrics.js';

export const systemRouter = express.Router();

systemRouter.get('/health', async (_req, res) => {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const weeklyCount = await News.countDocuments({ publishedAt: { $gte: since } });
  const latest = await News.findOne().sort({ publishedAt: -1, createdAt: -1 }).select('publishedAt createdAt');

  return res.json({
    databaseSyncStatus: weeklyCount > 0 ? 'healthy' : 'empty',
    weeklyNewsCount: weeklyCount,
    aiLatencyMs: getAiLatency(),
    lastNewsFetchAt: getLastNewsFetchAt(),
    latestNewsTimestamp: latest?.publishedAt ?? latest?.createdAt ?? null,
  });
});

