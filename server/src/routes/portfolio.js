import express from 'express';
import { requireAuth } from '../lib/auth.js';
import { Portfolio } from '../models/Portfolio.js';

export const portfolioRouter = express.Router();

portfolioRouter.get('/', requireAuth, async (req, res) => {
  try {
    let portfolio = await Portfolio.findOne({ userId: req.auth.sub });
    if (!portfolio) {
      portfolio = await Portfolio.create({ userId: req.auth.sub, holdings: [] });
    }
    return res.json({ portfolio });
  } catch (err) {
    console.error('[portfolio] GET error:', err);
    return res.status(500).json({ error: 'failed_to_fetch_portfolio' });
  }
});

portfolioRouter.post('/', requireAuth, async (req, res) => {
  try {
    const { holdings } = req.body;
    if (!Array.isArray(holdings)) {
      return res.status(400).json({ error: 'invalid_holdings' });
    }

    let portfolio = await Portfolio.findOne({ userId: req.auth.sub });
    if (!portfolio) {
      portfolio = new Portfolio({ userId: req.auth.sub });
    }

    portfolio.holdings = holdings;
    await portfolio.save();

    return res.json({ portfolio });
  } catch (err) {
    console.error('[portfolio] POST error:', err);
    return res.status(500).json({ error: 'failed_to_save_portfolio' });
  }
});
