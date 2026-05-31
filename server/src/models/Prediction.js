import mongoose from 'mongoose';

const PredictionSchema = new mongoose.Schema(
  {
    debateSessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'DebateSession', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    agentId: { type: Number, required: true },
    agentName: { type: String, required: true },
    ticker: { type: String, default: null },
    direction: { type: String, enum: ['Bullish', 'Bearish', 'Neutral'], required: true },
    magnitude: { type: String, default: null },
    keyPoint: { type: String, default: '' },
    confidence: { type: Number, min: 0, max: 100, default: 50 },
    timeframe: { type: String, default: null },
    resolveBy: { type: Date, default: null },
    status: { type: String, enum: ['pending', 'resolved', 'expired'], default: 'pending' },
    actualOutcome: { type: String, default: null },
    score: { type: Number, default: null },
  },
  { timestamps: true }
);

PredictionSchema.index({ resolveBy: 1, status: 1 });
PredictionSchema.index({ agentName: 1, status: 1 });

export const Prediction = mongoose.model('Prediction', PredictionSchema);
