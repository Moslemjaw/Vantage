import React, { useState, useEffect } from 'react';
import { Trophy, Target, TrendingUp, AlertCircle, BarChart2 } from 'lucide-react';

async function api(path, opts = {}) {
  const res = await fetch(path, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(opts.headers ?? {}) },
    credentials: 'include',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error ?? 'request_failed');
  }
  return data;
}

export default function LeaderboardPage({ me, onLogout }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const data = await api('/api/predictions/leaderboard');
        setLeaderboard(data.leaderboard || []);
      } catch (e) {
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Trophy size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Agent Leaderboard</h1>
            <p className="text-sm text-slate-500">Historical accuracy and prediction tracking across all debates</p>
          </div>
        </div>

        {err && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-rose-600">
            <AlertCircle size={18} />
            <span className="text-sm font-medium">{err}</span>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-xs uppercase tracking-wider font-bold text-slate-500">
                <th className="px-6 py-4 font-semibold">Rank</th>
                <th className="px-6 py-4 font-semibold">Agent</th>
                <th className="px-6 py-4 font-semibold">Avg Score</th>
                <th className="px-6 py-4 font-semibold">Win Rate</th>
                <th className="px-6 py-4 font-semibold">Total Predictions</th>
                <th className="px-6 py-4 font-semibold">Avg Confidence</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-slate-200 border-t-violet-500 rounded-full animate-spin mx-auto mb-2" />
                    Loading leaderboard...
                  </td>
                </tr>
              ) : leaderboard.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    No resolved predictions yet. Check back later once predictions mature.
                  </td>
                </tr>
              ) : (
                leaderboard.map((row, idx) => (
                  <tr key={row.agentName} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${idx === 0 ? 'bg-amber-100 text-amber-600' : idx === 1 ? 'bg-slate-100 text-slate-600' : idx === 2 ? 'bg-orange-100 text-orange-600' : 'bg-slate-50 text-slate-400'}`}>
                        #{idx + 1}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-800">
                      {row.agentName}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 font-mono font-bold text-violet-600 text-lg">
                        {row.avgScore}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <Target size={16} className={row.winRate >= 50 ? 'text-emerald-500' : 'text-rose-500'} />
                        <span className={`font-semibold ${row.winRate >= 50 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {row.winRate}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium">
                      {row.totalPredictions}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {row.avgConfidence}%
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
