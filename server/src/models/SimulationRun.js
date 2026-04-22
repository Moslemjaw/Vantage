import mongoose from 'mongoose';

const SimulationRunSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    filters: {
      marketBias: { type: String, default: 'Neutral' },
      sectorFocus: { type: String, default: 'All Sectors' },
      timeHorizon: { type: String, default: 'Short-term (1-4 weeks)' },
    },
    itemsAnalyzed: { type: Number, default: 0 },
    report: { type: Object, required: true },
  },
  { timestamps: true }
);

SimulationRunSchema.index({ createdAt: -1 });

export const SimulationRun = mongoose.model('SimulationRun', SimulationRunSchema);

