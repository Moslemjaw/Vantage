import mongoose from 'mongoose';

const PortfolioSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    holdings: [
      {
        ticker: { type: String, required: true },
        weight: { type: Number, required: true, min: 0, max: 100 },
        avgCost: { type: Number, default: null },
      }
    ],
  },
  { timestamps: true }
);

export const Portfolio = mongoose.model('Portfolio', PortfolioSchema);
