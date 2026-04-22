import express from 'express';
import { z } from 'zod';
import { News } from '../models/News.js';
import { requireAdmin, requireAuth } from '../lib/auth.js';
import { fetchNewsDataLatest } from '../services/news/newsdata.js';
import { fetchGNewsLatest } from '../services/news/gnews.js';
import { syncNewsDataToDb } from '../services/news/syncNewsData.js';

export const newsRouter = express.Router();

newsRouter.get('/weekly', async (req, res) => {
  const page = Math.max(1, Number(req.query.page ?? 1) || 1);
  const pageSize = Math.max(1, Math.min(10, Number(req.query.pageSize ?? 5) || 5));
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const autoSync = String(req.query.autoSync ?? '1') !== '0';

  try {
    const count = await News.countDocuments({ publishedAt: { $gte: since } });

    // Keep live-week DB populated for production homepage.
    if (autoSync && count < pageSize && process.env.NEWSDATA_API_KEY) {
      await syncNewsDataToDb({ q: 'kuwait', days: 7 });
    }

    const total = await News.countDocuments({ publishedAt: { $gte: since } });
    const items = await News.find({ publishedAt: { $gte: since } })
      .sort({ publishedAt: -1, createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize);

    return res.json({
      windowDays: 7,
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
      items,
    });
  } catch (e) {
    return res.status(500).json({ error: 'weekly_news_failed' });
  }
});

newsRouter.get('/external/newsdata', async (req, res) => {
  const q = typeof req.query.q === 'string' && req.query.q.trim() ? req.query.q.trim() : 'kuwait';
  const days = Math.max(1, Math.min(14, Number(req.query.days ?? 7) || 7));
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  try {
    const [newsDataItems, gnewsItems] = await Promise.all([
      fetchNewsDataLatest({ q }),
      fetchGNewsLatest(q, 15)
    ]);
    const items = [...newsDataItems, ...gnewsItems];
    const filtered = items
      .filter((i) => i.publishedAt && i.publishedAt >= since)
      .sort((a, b) => (b.publishedAt?.getTime?.() ?? 0) - (a.publishedAt?.getTime?.() ?? 0))
      .slice(0, 50)
      .map((i) => ({
        _id: i.externalId,
        tag: i.tag,
        source: i.source,
        headline: i.headline,
        body: i.body,
        url: i.url,
        publishedAt: i.publishedAt,
        external: true,
      }));

    return res.json({ items: filtered });
  } catch (e) {
    return res.status(500).json({ error: 'newsdata_failed' });
  }
});

newsRouter.get('/', async (_req, res) => {
  const items = await News.find().sort({ publishedAt: -1, createdAt: -1 }).limit(50);
  res.json({ items });
});

const CreateNewsSchema = z.object({
  tag: z.string().min(1).max(40).optional(),
  source: z.string().min(2).max(120),
  headline: z.string().min(5).max(240),
  body: z.string().max(8000).optional(),
  url: z.string().url().optional().or(z.literal('')),
  publishedAt: z.string().datetime().optional(),
});

// Admin or Publisher can create news
function requirePublisherOrAdmin(req, res, next) {
  if (!req.auth) return res.status(401).json({ error: 'unauthorized' });
  if (req.auth.role !== 'admin' && req.auth.role !== 'publisher') {
    return res.status(403).json({ error: 'forbidden' });
  }
  return next();
}

newsRouter.post('/', requireAuth, requirePublisherOrAdmin, async (req, res) => {
  const parsed = CreateNewsSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_input' });

  const created = await News.create({
    ...parsed.data,
    publishedAt: parsed.data.publishedAt ? new Date(parsed.data.publishedAt) : new Date(),
    createdByUserId: req.auth.sub,
  });
  res.json({ item: created });
});

const ImportSchema = z.object({
  q: z.string().min(1).max(80).default('kuwait'),
});

newsRouter.post('/import/newsdata', requireAuth, requireAdmin, async (req, res) => {
  const parsed = ImportSchema.safeParse(req.body ?? {});
  if (!parsed.success) return res.status(400).json({ error: 'invalid_input' });

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const sync = await syncNewsDataToDb({ q: parsed.data.q, days: 7, createdByUserId: req.auth.sub });
  const latest = await News.find().sort({ publishedAt: -1, createdAt: -1 }).limit(50);
  res.json({
    imported: sync.upserted,
    totalFetched: sync.fetched,
    totalLastWeek: sync.inWindow,
    sync,
    items: latest,
  });
});
