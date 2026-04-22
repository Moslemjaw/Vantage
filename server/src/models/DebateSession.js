import mongoose from 'mongoose';

const DebateMessageSchema = new mongoose.Schema({
  agentId: { type: Number, required: true },
  agentName: { type: String, required: true },
  provider: { type: String, enum: ['deepseek', 'gemini'], required: true },
  role: { type: String, required: true },
  content: { type: String, required: true },
  sentiment: { type: String, enum: ['Bullish', 'Bearish', 'Neutral'], default: 'Neutral' },
  confidence: { type: Number, min: 0, max: 100, default: 50 },
  timestamp: { type: Date, default: Date.now },
});

const DebateSessionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: { type: String, enum: ['active', 'completed'], default: 'active' },
    trigger: { type: String, default: '' },
    messages: [DebateMessageSchema],
    consensusReport: { type: Object, default: null },
    marketImpactRating: { type: Number, min: 1, max: 10, default: null },
    filters: {
      marketBias: { type: String, default: 'Neutral' },
      sectorFocus: { type: String, default: 'All Sectors' },
    },
  },
  { timestamps: true }
);

DebateSessionSchema.index({ createdAt: -1 });

export const DebateSession = mongoose.model('DebateSession', DebateSessionSchema);
