import express from 'express';
import { requireAuth, requireAdmin } from '../lib/auth.js';
import { User } from '../models/User.js';
import { News } from '../models/News.js';
import { SimulationRun } from '../models/SimulationRun.js';
import { DebateSession } from '../models/DebateSession.js';
import { getAiLatency, getLastNewsFetchAt } from '../lib/metrics.js';

export const adminRouter = express.Router();

adminRouter.get('/dashboard', requireAuth, requireAdmin, async (_req, res) => {
  try {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      totalNews,
      weeklyNews,
      analyzedNews,
      totalSimulations,
      totalDebates,
      recentUsers,
      recentSimulations,
    ] = await Promise.all([
      User.countDocuments(),
      News.countDocuments(),
      News.countDocuments({ publishedAt: { $gte: since } }),
      News.countDocuments({ analyzed: true }),
      SimulationRun.countDocuments(),
      DebateSession.countDocuments(),
      User.find().sort({ createdAt: -1 }).limit(10).select('name email role createdAt'),
      SimulationRun.find().sort({ createdAt: -1 }).limit(10).select('userId filters itemsAnalyzed createdAt'),
    ]);

    return res.json({
      stats: {
        totalUsers,
        totalNews,
        weeklyNews,
        analyzedNews,
        totalSimulations,
        totalDebates,
      },
      aiLatency: getAiLatency(),
      lastNewsFetch: getLastNewsFetchAt(),
      recentUsers,
      recentSimulations,
    });
  } catch (err) {
    console.error('Admin Dashboard Error:', err);
    return res.status(500).json({ error: err.message });
  }
});

adminRouter.get('/users', requireAuth, requireAdmin, async (_req, res) => {
  const users = await User.find().sort({ createdAt: -1 }).limit(100).select('name email role createdAt');
  return res.json({ items: users });
});

adminRouter.get('/activity', requireAuth, requireAdmin, async (_req, res) => {
  const [sims, debates] = await Promise.all([
    SimulationRun.find().sort({ createdAt: -1 }).limit(30)
      .select('userId filters itemsAnalyzed createdAt'),
    DebateSession.find().sort({ createdAt: -1 }).limit(30)
      .select('userId trigger status marketImpactRating createdAt'),
  ]);
  return res.json({ simulations: sims, debates });
});

adminRouter.put('/users/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin', 'publisher'].includes(role)) {
      return res.status(400).json({ error: 'invalid_role' });
    }
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('name email role createdAt');
    if (!user) return res.status(404).json({ error: 'not_found' });
    return res.json({ user });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

adminRouter.delete('/users/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    if (req.params.id === req.auth.sub) {
      return res.status(400).json({ error: 'cannot_delete_self' });
    }
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: 'not_found' });
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});
