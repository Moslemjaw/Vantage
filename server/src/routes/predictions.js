import express from 'express';
import { requireAuth } from '../lib/auth.js';
import { Prediction } from '../models/Prediction.js';

export const predictionsRouter = express.Router();

predictionsRouter.get('/leaderboard', requireAuth, async (req, res) => {
  try {
    const stats = await Prediction.aggregate([
      { $match: { status: 'resolved' } },
      {
        $group: {
          _id: '$agentName',
          totalPredictions: { $sum: 1 },
          avgScore: { $avg: '$score' },
          avgConfidence: { $avg: '$confidence' },
          correctDirection: {
            $sum: { $cond: [{ $gt: ['$score', 0] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          agentName: '$_id',
          totalPredictions: 1,
          avgScore: { $round: ['$avgScore', 1] },
          avgConfidence: { $round: ['$avgConfidence', 1] },
          winRate: {
            $round: [
              { $multiply: [{ $divide: ['$correctDirection', '$totalPredictions'] }, 100] },
              1
            ]
          }
        }
      },
      { $sort: { avgScore: -1 } }
    ]);

    return res.json({ leaderboard: stats });
  } catch (err) {
    console.error('[predictions] leaderboard error:', err.message);
    return res.status(500).json({ error: 'failed_to_fetch_leaderboard' });
  }
});
