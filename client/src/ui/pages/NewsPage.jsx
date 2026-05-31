import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Newspaper, RefreshCw, BookmarkPlus, Star, ExternalLink,
  CheckCircle2, TrendingUp, TrendingDown, Minus, BarChart3, Globe,
  FileText, Layers, Activity, X, MessageSquare, ArrowRight
} from 'lucide-react';
import { SentimentPill, SkeletonCard } from '../components/SharedComponents.jsx';
import { useMarketSentiment } from '../contexts/MarketSentimentContext.jsx';
import { generateNewsReportPDF } from '../utils/pdfGenerator.js';
import StockDetailModal from '../components/StockDetailModal.jsx';

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

function formatAgo(iso) {
  if (!iso) return 'just now';
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.max(1, Math.floor(ms / 60000));
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function sentimentFromText(t) {
  const low = (t || '').toLowerCase();
  if (/(risk|war|attack|decline|drop|downgrade|inflation|crisis|disruption|volatility|loss|weak|fall|crash)/.test(low))
    return 'Bearish';
  if (/(growth|gain|surge|upgrade|strong|profit|recovery|expansion|optimism|rally|boost|rise)/.test(low))
    return 'Bullish';
  return 'Neutral';
}

const SECTOR_COLORS = {
  'Energy': 'from-amber-100 to-amber-50 border-amber-200 text-amber-700',
  'Banking': 'from-emerald-100 to-emerald-50 border-emerald-200 text-emerald-700',
  'Government': 'from-blue-100 to-blue-50 border-blue-200 text-blue-700',
  'Logistics': 'from-violet-100 to-violet-50 border-violet-200 text-violet-700',
  'Consumer': 'from-rose-100 to-rose-50 border-rose-200 text-rose-700',
  'Real Estate': 'from-cyan-100 to-cyan-50 border-cyan-200 text-cyan-700',
  'Insurance': 'from-indigo-100 to-indigo-50 border-indigo-200 text-indigo-700',
  'Healthcare': 'from-teal-100 to-teal-50 border-teal-200 text-teal-700',
};
function getSectorStyle(name) {
  return SECTOR_COLORS[name] || 'from-slate-100 to-slate-50 border-slate-200 text-slate-600';
}

function ArticleDetailModal({ article, onClose }) {
  if (!article) return null;
  const s = article.sentimentLabel || (article.sentimentScore > 0.15 ? 'Bullish' : article.sentimentScore < -0.15 ? 'Bearish' : 'Neutral');

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative z-10 w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl bg-white border border-slate-200 shadow-2xl"
      >
        <div className="sticky top-0 z-10 flex items-start justify-between p-5 pb-3 bg-white/95 backdrop-blur-md border-b border-slate-100">
          <div className="flex-1 mr-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                {article.tag || 'GCC'}
              </span>
              {article.analyzed && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-cyan-50 text-[9px] font-bold text-cyan-600">
                  <CheckCircle2 size={8} />AI Analyzed
                </span>
              )}
              <SentimentPill sentiment={s} />
            </div>
            <h2 className="text-lg font-bold text-slate-900 leading-snug">{article.headline}</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors shrink-0">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span>{article.source}</span>
            <span>•</span>
            <span>{formatAgo(article.publishedAt || article.createdAt)}</span>
            {article.sentimentScore != null && (
              <>
                <span>•</span>
                <span className={`font-mono font-bold ${article.sentimentScore > 0 ? 'text-emerald-600' : article.sentimentScore < 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                  Score: {article.sentimentScore > 0 ? '+' : ''}{article.sentimentScore.toFixed(2)}
                </span>
              </>
            )}
          </div>

          {article.body && (
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{article.body}</p>
            </div>
          )}

          {article.aiAnalysis && (
            <div className="bg-gradient-to-r from-cyan-50 to-violet-50 rounded-xl p-4 border border-cyan-100">
              <h4 className="text-xs font-bold text-cyan-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <MessageSquare size={12} />AI Market Impact Analysis
              </h4>
              <p className="text-sm text-slate-700 leading-relaxed">{article.aiAnalysis}</p>
            </div>
          )}

          {article.aiSectors?.length > 0 && (
            <div>
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Affected Sectors</h4>
              <div className="flex flex-wrap gap-2">
                {article.aiSectors.map((sec, i) => (
                  <span key={i} className={`px-3 py-1.5 rounded-xl bg-gradient-to-r border text-xs font-bold ${getSectorStyle(sec)}`}>
                    {sec}
                  </span>
                ))}
              </div>
            </div>
          )}

          {article.originalHeadline && (
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <h4 className="text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-2">Original (Arabic)</h4>
              <p className="text-sm text-slate-500 leading-relaxed" dir="rtl">{article.originalHeadline}</p>
              {article.originalBody && (
                <p className="text-xs text-slate-400 leading-relaxed mt-2 line-clamp-4" dir="rtl">{article.originalBody}</p>
              )}
            </div>
          )}

          {article.url && (
            <a href={article.url} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all">
              <ExternalLink size={12} />Read Full Article
              <ArrowRight size={12} />
            </a>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default function NewsPage({ me }) {
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState({ total: 0, bull: 0, bear: 0, neutral: 0, sources: 0, topSectors: [], avgScore: 0 });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [savedIds, setSavedIds] = useState({});
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [selectedStock, setSelectedStock] = useState(null);
  const { isRedAlert, gaugeScore, label: sentimentLabel } = useMarketSentiment();

  const loadStats = useCallback(async () => {
    try {
      const d = await api('/api/news/stats');
      setStats(d);
    } catch {}
  }, []);

  const loadPage = useCallback(async (p = page, forceSync = false) => {
    setLoading(true);
    try {
      const d = await api(`/api/news/weekly?page=${p}&pageSize=12&autoSync=${p === 1 ? '1' : '0'}${forceSync ? '&forceSync=1' : ''}`);
      setItems(d.items ?? []);
      setPage(d.page ?? 1);
      setTotalPages(d.totalPages ?? 1);
    } catch {}
    setLoading(false);
  }, [page]);

  useEffect(() => {
    loadStats();
    loadPage(1);
  }, []);

  function getItemSentiment(n) {
    return n.sentimentLabel
      || (n.sentimentScore !== undefined
        ? (n.sentimentScore > 0.15 ? 'Bullish' : n.sentimentScore < -0.15 ? 'Bearish' : 'Neutral')
        : sentimentFromText(`${n.headline} ${n.body}`));
  }

  async function saveItem(e, n) {
    e.stopPropagation();
    try {
      const created = await api('/api/articles', {
        method: 'POST',
        body: JSON.stringify({
          title: n.headline, excerpt: n.body, source: n.source,
          url: n.url || '', tags: [n.tag ?? 'KUWAIT'],
          publishedAt: n.publishedAt ? new Date(n.publishedAt).toISOString() : undefined,
        }),
      });
      await api(`/api/articles/${created.item._id}/save`, { method: 'POST' });
      setSavedIds(prev => ({ ...prev, [n._id]: true }));
    } catch {}
  }

  const bullPct = stats.total ? Math.round(stats.bull / stats.total * 100) : 0;
  const bearPct = stats.total ? Math.round(stats.bear / stats.total * 100) : 0;
  const neutralPct = stats.total ? 100 - bullPct - bearPct : 0;
  const gaugeColor = gaugeScore > 60 ? 'text-emerald-600' : gaugeScore < 40 ? 'text-rose-600' : 'text-amber-600';

  return (
    <div className="space-y-5 animate-fade-in">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card !p-0 overflow-hidden"
      >
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-100 to-violet-100 flex items-center justify-center border border-cyan-200">
                <BarChart3 size={16} className="text-cyan-600" />
              </div>
              Market Intelligence
            </h3>
            <div className="flex items-center gap-2">
              <button onClick={() => generateNewsReportPDF(stats, items)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-50 to-violet-50 border border-cyan-200 text-[11px] text-cyan-600 hover:from-cyan-100 hover:to-violet-100 transition-all">
                <FileText size={11} />Export PDF
              </button>
              <button onClick={() => { loadStats(); loadPage(1, true); }} disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all disabled:opacity-40">
                <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />Refresh
              </button>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3">
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-center">
              <p className="text-[9px] text-slate-400 uppercase tracking-wider mb-1.5">Articles</p>
              <p className="text-3xl font-mono font-black text-cyan-600">{stats.total}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-center">
              <p className="text-[9px] text-slate-400 uppercase tracking-wider mb-1.5">Bullish</p>
              <p className="text-3xl font-mono font-black text-emerald-600">{stats.bull}</p>
              <p className="text-[10px] text-emerald-500/70 font-mono mt-0.5">{bullPct}%</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-center">
              <p className="text-[9px] text-slate-400 uppercase tracking-wider mb-1.5">Bearish</p>
              <p className="text-3xl font-mono font-black text-rose-600">{stats.bear}</p>
              <p className="text-[10px] text-rose-500/70 font-mono mt-0.5">{bearPct}%</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-center">
              <p className="text-[9px] text-slate-400 uppercase tracking-wider mb-1.5">Sources</p>
              <p className="text-3xl font-mono font-black text-violet-600">{stats.sources}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-xl p-5 border border-slate-100 relative overflow-hidden shadow-sm">
              <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-20" style={{
                background: `radial-gradient(circle, ${gaugeScore > 60 ? 'rgba(16,185,129,0.4)' : gaugeScore < 40 ? 'rgba(244,63,94,0.4)' : 'rgba(245,158,11,0.4)'}, transparent 70%)`
              }} />
              <div className="flex items-center gap-5 relative z-10">
                <div className="relative w-20 h-20 shrink-0">
                  <svg width="80" height="80" className="-rotate-90">
                    <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(0,0,0,0.04)" strokeWidth="6" />
                    <circle cx="40" cy="40" r="34" fill="none"
                      stroke={gaugeScore > 60 ? '#059669' : gaugeScore < 40 ? '#e11d48' : '#d97706'}
                      strokeWidth="6" strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 34}`}
                      strokeDashoffset={`${2 * Math.PI * 34 * (1 - gaugeScore / 100)}`}
                      style={{ transition: 'stroke-dashoffset 1s ease-out' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <motion.span
                      className={`text-2xl font-mono font-black ${gaugeColor}`}
                      key={gaugeScore}
                      initial={{ scale: 1.2, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                    >
                      {gaugeScore}
                    </motion.span>
                    <span className="text-[8px] text-slate-300 font-mono uppercase">/ 100</span>
                  </div>
                </div>
                <div className="flex-1">
                  <p className={`text-lg font-bold ${gaugeColor}`}>{sentimentLabel}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5 mb-3">Market Sentiment Index</p>
                  <div className="flex rounded-full overflow-hidden h-2.5 bg-slate-100">
                    {stats.bull > 0 && <div className="bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-700" style={{ width: `${bullPct}%` }} />}
                    {(stats.neutral || 0) > 0 && <div className="bg-slate-300 transition-all duration-700" style={{ width: `${neutralPct}%` }} />}
                    {stats.bear > 0 && <div className="bg-gradient-to-r from-rose-500 to-rose-400 transition-all duration-700" style={{ width: `${bearPct}%` }} />}
                  </div>
                  <div className="flex justify-between mt-1.5">
                    <span className="text-[9px] text-emerald-600 font-mono font-bold">{bullPct}% bull</span>
                    <span className="text-[9px] text-slate-300 font-mono">{neutralPct}%</span>
                    <span className="text-[9px] text-rose-600 font-mono font-bold">{bearPct}% bear</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 border border-slate-100 relative overflow-hidden shadow-sm">
              <div className="relative z-10">
                <p className="text-[9px] text-slate-400 uppercase tracking-wider mb-3">Average Sentiment Score</p>
                <div className="flex items-baseline gap-2 mb-3">
                  <p className={`text-4xl font-mono font-black ${stats.avgScore > 0.1 ? 'text-emerald-600' : stats.avgScore < -0.1 ? 'text-rose-600' : 'text-amber-600'}`}>
                    {stats.avgScore > 0 ? '+' : ''}{(stats.avgScore || 0).toFixed(2)}
                  </p>
                  <span className="text-xs text-slate-400 font-mono">
                    {stats.avgScore > 0.1 ? 'Bullish' : stats.avgScore < -0.1 ? 'Bearish' : 'Neutral'}
                  </span>
                </div>
                <div className="relative h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div className="absolute inset-0 flex">
                    <div className="flex-1 bg-gradient-to-r from-rose-200 to-transparent" />
                    <div className="flex-1 bg-gradient-to-l from-emerald-200 to-transparent" />
                  </div>
                  <div className="absolute top-0 h-full w-1 bg-slate-800 rounded-full shadow-lg transition-all duration-700"
                    style={{ left: `${Math.max(2, Math.min(98, ((stats.avgScore || 0) + 1) / 2 * 100))}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1.5">
                  <span className="text-[8px] text-rose-400 font-mono">-1.0 BEAR</span>
                  <span className="text-[8px] text-slate-300 font-mono">0</span>
                  <span className="text-[8px] text-emerald-400 font-mono">+1.0 BULL</span>
                </div>
                {isRedAlert && (
                  <div className="flex items-center gap-1.5 mt-3 px-2.5 py-1.5 rounded-lg bg-rose-50 border border-rose-200">
                    <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                    <span className="text-[9px] font-bold text-rose-600 uppercase tracking-wider">Market Alert Active</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {stats.topSectors?.length > 0 && (
            <div>
              <p className="text-[9px] text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1">
                <Layers size={9} />Sector Distribution
              </p>
              <div className="grid grid-cols-4 gap-2">
                {stats.topSectors.map((sec) => (
                  <div key={sec.name}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl bg-gradient-to-r border ${getSectorStyle(sec.name)}`}>
                    <span className="flex items-center gap-1.5 text-[11px] font-bold">
                      <Globe size={10} />{sec.name}
                    </span>
                    <span className="text-[11px] font-mono font-bold opacity-60">{sec.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Newspaper size={18} className="text-cyan-500" />Market Intelligence Feed
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">7-day rolling window · Page {page}/{totalPages}</p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[1,2,3,4,5,6].map(i => <SkeletonCard key={i} lines={4} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <AnimatePresence>
            {items.map((n, idx) => {
              const s = getItemSentiment(n);
              return (
                <motion.div
                  key={n._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  onClick={() => setSelectedArticle(n)}
                  className="glass-card group cursor-pointer hover:border-cyan-300 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      {n.tag || 'GCC'}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {n.analyzed && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-cyan-50 text-[9px] font-bold text-cyan-600">
                          <CheckCircle2 size={8} />AI
                        </span>
                      )}
                      <SentimentPill sentiment={s} />
                    </div>
                  </div>
                  <h3 className="font-bold text-slate-800 leading-snug mb-2 text-sm line-clamp-2">
                    {n.headline}
                  </h3>
                  <p className="text-[11px] text-slate-400 mb-2">
                    {n.source} · {formatAgo(n.publishedAt || n.createdAt)}
                    {n.sentimentScore != null && (
                      <span className={`ml-1.5 font-mono ${n.sentimentScore > 0 ? 'text-emerald-500' : n.sentimentScore < 0 ? 'text-rose-500' : 'text-slate-400'}`}>
                        ({n.sentimentScore > 0 ? '+' : ''}{n.sentimentScore.toFixed(1)})
                      </span>
                    )}
                  </p>
                  {n.body && (
                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{n.body}</p>
                  )}

                  {n.aiAnalysis && (
                    <div className="mt-2 px-2 py-1.5 rounded-lg bg-cyan-50 border border-cyan-100">
                      <p className="text-[10px] text-cyan-600 line-clamp-1 flex items-center gap-1">
                        <MessageSquare size={9} />{n.aiAnalysis}
                      </p>
                    </div>
                  )}

                  {n.affectedStocks?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {n.affectedStocks.map((stk, si) => (
                        <button
                          key={si}
                          onClick={(e) => { e.stopPropagation(); setSelectedStock(stk.ticker); }}
                          className={`flex items-center gap-1 px-2 py-1 rounded border text-[9px] font-bold transition-colors ${
                            stk.impact === 'positive' ? 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100' : 
                            stk.impact === 'negative' ? 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100' :
                            'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                          }`}
                        >
                          <Activity size={9} />
                          {stk.ticker.replace('.KW', '')}
                        </button>
                      ))}
                    </div>
                  )}

                  {n.aiSectors?.length > 0 && !n.affectedStocks?.length && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {n.aiSectors.slice(0, 3).map((sec, si) => (
                        <span key={si} className="px-1.5 py-0.5 rounded bg-violet-50 text-[9px] font-bold text-violet-600 uppercase">{sec}</span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-100">
                    <span className="text-[10px] text-slate-300 group-hover:text-cyan-500 transition-colors flex items-center gap-1">
                      Click for details <ArrowRight size={10} />
                    </span>
                    <div className="flex-1" />
                    <button onClick={(e) => saveItem(e, n)} className="p-1.5 rounded-lg hover:bg-slate-50 text-slate-300 hover:text-cyan-500 transition-colors">
                      {savedIds[n._id] ? <Star size={14} className="fill-current text-amber-400" /> : <BookmarkPlus size={14} />}
                    </button>
                    {n.url && (
                      <a href={n.url} target="_blank" rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="p-1.5 rounded-lg hover:bg-slate-50 text-slate-300 hover:text-cyan-500 transition-colors">
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          {page > 1 && (
            <button onClick={() => loadPage(page - 1)}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-600 hover:bg-slate-50 transition-all">
              ← Prev
            </button>
          )}
          <span className="text-xs text-slate-400 font-mono px-3">{page} / {totalPages}</span>
          {page < totalPages && (
            <button onClick={() => loadPage(page + 1)}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-600 hover:bg-slate-50 transition-all">
              Next →
            </button>
          )}
        </div>
      )}

      <AnimatePresence>
        {selectedArticle && (
          <ArticleDetailModal article={selectedArticle} onClose={() => setSelectedArticle(null)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedStock && (
          <StockDetailModal ticker={selectedStock} onClose={() => setSelectedStock(null)} me={me} />
        )}
      </AnimatePresence>
    </div>
  );
}
