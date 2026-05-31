import express from 'express';
import { requireAuth } from '../lib/auth.js';
import { Watchlist } from '../models/Watchlist.js';
import { fetchBulkQuotes } from '../services/market/kuwaitStocks.js';

export const watchlistRouter = express.Router();

watchlistRouter.use(requireAuth);

// Get user's watchlist
watchlistRouter.get('/', async (req, res) => {
  try {
    const list = await Watchlist.findOne({ userId: req.user._id });
    if (!list || !list.tickers || list.tickers.length === 0) {
      return res.json({ items: [] });
    }
    
    const quotes = await fetchBulkQuotes(list.tickers);
    return res.json({ items: quotes });
  } catch (e) {
    console.error('[watchlist/get] Error:', e.message);
    return res.status(500).json({ error: 'failed_to_fetch_watchlist' });
  }
});

// Get user's raw watchlist tickers
watchlistRouter.get('/raw', async (req, res) => {
  try {
    const list = await Watchlist.findOne({ userId: req.user._id });
    return res.json({ tickers: list ? list.tickers : [] });
  } catch (e) {
    return res.status(500).json({ error: 'failed_to_fetch' });
  }
});

// Add to watchlist
watchlistRouter.post('/add', async (req, res) => {
  try {
    const { ticker } = req.body;
    if (!ticker) return res.status(400).json({ error: 'ticker_required' });
    
    let list = await Watchlist.findOne({ userId: req.user._id });
    if (!list) {
      list = new Watchlist({ userId: req.user._id, tickers: [] });
    }
    
    if (!list.tickers.includes(ticker)) {
      list.tickers.push(ticker);
      await list.save();
    }
    
    return res.json({ success: true, tickers: list.tickers });
  } catch (e) {
    console.error('[watchlist/add] Error:', e.message);
    return res.status(500).json({ error: 'failed_to_add' });
  }
});

// Remove from watchlist
watchlistRouter.delete('/:ticker', async (req, res) => {
  try {
    const { ticker } = req.params;
    
    const list = await Watchlist.findOne({ userId: req.user._id });
    if (list) {
      list.tickers = list.tickers.filter(t => t !== ticker);
      await list.save();
      return res.json({ success: true, tickers: list.tickers });
    }
    
    return res.json({ success: true, tickers: [] });
  } catch (e) {
    console.error('[watchlist/remove] Error:', e.message);
    return res.status(500).json({ error: 'failed_to_remove' });
  }
});
