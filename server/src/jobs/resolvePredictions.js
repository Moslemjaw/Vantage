import mongoose from 'mongoose';
import { Prediction } from '../models/Prediction.js';
import { fetchAlphaVantageData } from '../services/market/alphavantage.js'; // Adjust based on actual fetcher

// In a real app with Boursa Kuwait, we would fetch historical prices.
// We will mock the historical fetcher or use a placeholder here.
async function getHistoricalPrice(ticker, date) {
  // Try to use AlphaVantage or just return a mock random price change for now
  // since Boursa Kuwait doesn't have a reliable free historical API
  const mockReturn = (Math.random() * 10) - 5; // -5% to +5%
  return mockReturn;
}

export async function resolvePendingPredictions() {
  console.log('[jobs] Running prediction resolver...');
  try {
    const pending = await Prediction.find({
      status: 'pending',
      resolveBy: { $lte: new Date() }
    });

    if (!pending.length) {
      console.log('[jobs] No pending predictions to resolve.');
      return;
    }

    for (const pred of pending) {
      if (!pred.ticker) {
        // If there's no specific ticker, we can't objectively grade it automatically.
        pred.status = 'expired';
        await pred.save();
        continue;
      }

      const actualReturn = await getHistoricalPrice(pred.ticker, pred.resolveBy);
      
      let isCorrect = false;
      if (pred.direction === 'Bullish' && actualReturn > 0) isCorrect = true;
      if (pred.direction === 'Bearish' && actualReturn < 0) isCorrect = true;
      if (pred.direction === 'Neutral' && Math.abs(actualReturn) < 1.5) isCorrect = true;

      // Score 0-100 based on direction correctness and confidence calibration
      let score = 0;
      if (isCorrect) {
        score = 100 - Math.abs(pred.confidence - 100) * 0.5; // High confidence = better score if right
      } else {
        score = 0; // Completely wrong
      }

      pred.score = Math.max(0, Math.min(100, Math.round(score)));
      pred.actualOutcome = `Actual Return: ${actualReturn > 0 ? '+' : ''}${actualReturn.toFixed(2)}%`;
      pred.status = 'resolved';

      await pred.save();
      console.log(`[jobs] Resolved prediction for ${pred.agentName} on ${pred.ticker}: ${pred.score}/100`);
    }

    console.log(`[jobs] Resolved ${pending.length} predictions.`);
  } catch (err) {
    console.error('[jobs] Error resolving predictions:', err);
  }
}
