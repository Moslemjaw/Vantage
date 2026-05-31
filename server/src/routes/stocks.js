import express from 'express';
import { requireAuth } from '../lib/auth.js';
import { 
  KUWAIT_STOCKS, 
  fetchBulkQuotes, 
  fetchStockQuote, 
  fetchStockHistory, 
  fetchSectorPerformance 
} from '../services/market/kuwaitStocks.js';

export const stocksRouter = express.Router();

// Get all Kuwait stocks with live prices
stocksRouter.get('/all', async (req, res) => {
  try {
    const quotes = await fetchBulkQuotes();
    return res.json({ items: quotes });
  } catch (e) {
    console.error('[stocks/all] Error:', e.message);
    return res.status(500).json({ error: 'failed_to_fetch_stocks' });
  }
});

// Get sector performance
stocksRouter.get('/sectors', async (req, res) => {
  try {
    const sectors = await fetchSectorPerformance();
    return res.json({ items: sectors });
  } catch (e) {
    console.error('[stocks/sectors] Error:', e.message);
    return res.status(500).json({ error: 'failed_to_fetch_sectors' });
  }
});

// Get top gainers and losers
stocksRouter.get('/movers', async (req, res) => {
  try {
    const quotes = await fetchBulkQuotes();
    const sorted = [...quotes].sort((a, b) => b.changePercent - a.changePercent);
    
    return res.json({
      gainers: sorted.slice(0, 5),
      losers: sorted.slice(-5).reverse()
    });
  } catch (e) {
    return res.status(500).json({ error: 'failed_to_fetch_movers' });
  }
});

// Ticker tape fast endpoint
stocksRouter.get('/ticker-tape', async (req, res) => {
  try {
    // Only fetch top 15 by market cap for the ticker tape to keep it fast and relevant
    const topTickers = KUWAIT_STOCKS.slice(0, 15).map(s => s.ticker);
    const quotes = await fetchBulkQuotes(topTickers);
    return res.json({ items: quotes });
  } catch (e) {
    return res.status(500).json({ error: 'failed_to_fetch_ticker' });
  }
});

// Get single stock details with history
stocksRouter.get('/:ticker', async (req, res) => {
  try {
    const { ticker } = req.params;
    const period = req.query.period || '1mo';
    
    const [quote, history] = await Promise.all([
      fetchStockQuote(ticker),
      fetchStockHistory(ticker, period)
    ]);
    
    if (!quote) return res.status(404).json({ error: 'stock_not_found' });
    
    return res.json({ quote, history });
  } catch (e) {
    console.error('[stocks/:ticker] Error:', e.message);
    return res.status(500).json({ error: 'failed_to_fetch_stock' });
  }
});

// Get single stock history only
stocksRouter.get('/:ticker/history', async (req, res) => {
  try {
    const { ticker } = req.params;
    const period = req.query.period || '1mo';
    const history = await fetchStockHistory(ticker, period);
    return res.json({ items: history });
  } catch (e) {
    return res.status(500).json({ error: 'failed_to_fetch_history' });
  }
});
