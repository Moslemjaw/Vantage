import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  History, RefreshCw, Lock, Clock, Brain, Gauge, FileText
} from 'lucide-react';
import { SkeletonCard } from '../components/SharedComponents.jsx';
import { generateWarRoomPDF } from '../utils/pdfGenerator.js';

async function api(path, opts = {}) {
  const res = await fetch(path, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(opts.headers ?? {}) },
    credentials: 'include',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error ?? 'request_failed');
  return data;
}

export default function HistoryPage({ me }) {
  const [debateItems, setDebateItems] = useState([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    if (!me) return;
    setLoading(true);
    try {
      const debates = await api('/api/debate/history');
      setDebateItems(debates.items ?? []);
    } catch {}
    setLoading(false);
  }

  useEffect(() => { load(); }, [me]);

  if (!me) return (
    <div className="glass-card text-center py-12 animate-fade-in">
      <Lock size={24} className="text-slate-300 mx-auto mb-3" />
      <p className="text-sm text-slate-400">Sign in to view your analysis history</p>
    </div>
  );

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <History size={18} className="text-amber-500" />Analysis History
        </h2>
        <button onClick={load} disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-600 hover:text-slate-900 transition-all">
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />Refresh
        </button>
      </div>

      <div className="flex rounded-xl bg-slate-100 p-1 mb-4">
        <div className="flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 bg-white text-slate-800 shadow-sm">
          <Brain size={12} />
          Multi-Agent Debates
          <span className="text-[10px] font-mono bg-slate-100 px-1.5 py-0.5 rounded">{debateItems.length}</span>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <SkeletonCard key={i} />)}</div>
      ) : (
        <div className="space-y-3">
          {debateItems.map((it, idx) => (
            <motion.div key={it._id} className="glass-card"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono text-slate-400">
                  <Clock size={10} className="inline mr-1" />
                  {new Date(it.createdAt).toLocaleString()}
                </span>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    it.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                  }`}>{it.status}</span>
                  <button onClick={() => generateWarRoomPDF(it)}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-gradient-to-r from-cyan-50 to-violet-50 border border-cyan-200 text-[10px] text-cyan-600 hover:from-cyan-100 hover:to-violet-100 transition-all">
                    <FileText size={10} />PDF
                  </button>
                </div>
              </div>
              <p className="text-sm font-semibold text-slate-700 mb-2">{it.trigger}</p>
              
              <div className="flex flex-wrap gap-2 mb-3">
                {it.filters?.marketBias && <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-100 text-[10px] font-bold text-emerald-600">{it.filters.marketBias}</span>}
                {it.filters?.sectorFocus && <span className="px-2 py-0.5 rounded bg-violet-50 border border-violet-100 text-[10px] font-bold text-violet-600">{it.filters.sectorFocus}</span>}
                {it.filters?.timeHorizon && <span className="px-2 py-0.5 rounded bg-cyan-50 border border-cyan-100 text-[10px] font-bold text-cyan-600">{it.filters.timeHorizon}</span>}
              </div>

              {it.consensusReport?.summary && (
                <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">{it.consensusReport.summary}</p>
              )}
              {it.marketImpactRating && (
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
                  <Gauge size={12} className="text-slate-400" />
                  <span className="text-[10px] font-mono text-slate-500">Impact Score: {it.marketImpactRating}/10</span>
                  <span className="text-[10px] text-slate-300">•</span>
                  <span className="text-[10px] font-mono text-slate-500">{it.messages?.length || 0} Debate Messages</span>
                </div>
              )}
            </motion.div>
          ))}
          {!debateItems.length && (
            <div className="text-center py-10">
              <Brain size={24} className="mx-auto text-slate-300 mb-2" />
              <p className="text-sm text-slate-500 font-medium">No debate history yet</p>
              <p className="text-xs text-slate-400 mt-1">Run an analysis from the AI Agent Arena to see it here.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
