import mongoose from 'mongoose';

const WatchlistSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    tickers: [{ type: String }],
  },
  { timestamps: true }
);

export const Watchlist = mongoose.model('Watchlist', WatchlistSchema);
