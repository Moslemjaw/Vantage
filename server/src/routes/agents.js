import express from 'express';
import { z } from 'zod';
import { requireAuth } from '../lib/auth.js';
import { CustomAgent } from '../models/CustomAgent.js';

export const agentsRouter = express.Router();

const CreateAgentSchema = z.object({
  name: z.string().min(2).max(50),
  icon: z.string().default('🤖'),
  role: z.string().min(2).max(50),
  brief: z.string().min(10).max(2000),
  temperature: z.number().min(0).max(1).default(0.5),
  defaultPhase: z.enum(['catalyst', 'discuss', 'challenge', 'verdict']).default('discuss'),
});

agentsRouter.get('/', requireAuth, async (req, res) => {
  try {
    const customAgents = await CustomAgent.find({ userId: req.auth.sub }).sort({ createdAt: -1 });
    return res.json({ items: customAgents });
  } catch (err) {
    console.error('[agents] GET error:', err);
    return res.status(500).json({ error: 'failed_to_fetch_agents' });
  }
});

agentsRouter.post('/', requireAuth, async (req, res) => {
  try {
    const parsed = CreateAgentSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'invalid_input', details: parsed.error.errors });
    }

    const count = await CustomAgent.countDocuments({ userId: req.auth.sub });
    if (count >= 10) {
      return res.status(400).json({ error: 'max_custom_agents_reached' });
    }

    const agent = await CustomAgent.create({
      userId: req.auth.sub,
      ...parsed.data
    });

    return res.json({ agent });
  } catch (err) {
    console.error('[agents] POST error:', err);
    return res.status(500).json({ error: 'failed_to_create_agent' });
  }
});

agentsRouter.delete('/:id', requireAuth, async (req, res) => {
  try {
    const result = await CustomAgent.deleteOne({ _id: req.params.id, userId: req.auth.sub });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'not_found_or_unauthorized' });
    }
    return res.json({ success: true });
  } catch (err) {
    console.error('[agents] DELETE error:', err);
    return res.status(500).json({ error: 'failed_to_delete_agent' });
  }
});
