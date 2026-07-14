import express from 'express';
import { z } from 'zod';
import { requireAuth } from '../lib/auth.js';
import { Article } from '../models/Article.js';
import { SavedArticle } from '../models/SavedArticle.js';

export const articlesRouter = express.Router();

articlesRouter.get('/', async (_req, res) => {
  const items = await Article.find().sort({ publishedAt: -1, createdAt: -1 }).limit(50);
  res.json({ items });
});

const UpsertArticleSchema = z.object({
  title: z.string().min(1),
  excerpt: z.string().optional(),
  content: z.string().optional(),
  source: z.string().optional(),
  url: z.string().url().optional().or(z.literal('')),
  tags: z.array(z.string()).optional(),
  publishedAt: z.string().datetime().optional(),
});

articlesRouter.post('/', requireAuth, async (req, res) => {
  const parsed = UpsertArticleSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_input' });

  const created = await Article.create({
    ...parsed.data,
    publishedAt: parsed.data.publishedAt ? new Date(parsed.data.publishedAt) : undefined,
  });
  res.json({ item: created });
});

articlesRouter.post('/:id/save', requireAuth, async (req, res) => {
  const articleId = req.params.id;
  await SavedArticle.updateOne(
    { userId: req.auth.sub, articleId },
    { $setOnInsert: { userId: req.auth.sub, articleId } },
    { upsert: true }
  );
  res.json({ ok: true });
});

articlesRouter.post('/:id/unsave', requireAuth, async (req, res) => {
  const articleId = req.params.id;
  await SavedArticle.deleteOne({ userId: req.auth.sub, articleId });
  res.json({ ok: true });
});

articlesRouter.get('/saved/mine', requireAuth, async (req, res) => {
  const saved = await SavedArticle.find({ userId: req.auth.sub }).sort({ createdAt: -1 }).limit(100);
  const ids = saved.map((s) => s.articleId);
  const items = await Article.find({ _id: { $in: ids } });
  res.json({ items });
});

