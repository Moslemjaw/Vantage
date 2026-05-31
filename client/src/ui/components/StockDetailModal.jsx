import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, TrendingDown, Clock, Activity, MessageSquare, AlertTriangle, BookmarkPlus, Star } from 'lucide-react';
import SparklineChart from './SparklineChart.jsx';

export default function StockDetailModal({ ticker, onClose, me }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inWatchlist, setInWatchlist] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/stocks/${ticker}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (e) {
        console.error('Failed to fetch stock details', e);
      }
      setLoading(false);
    }
    fetchData();
  }, [ticker]);

  if (!ticker) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative z-10 w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-2xl bg-white border border-slate-200 shadow-2xl"
      >
        <div className="sticky top-0 z-20 flex items-start justify-between p-5 pb-4 bg-white/95 backdrop-blur-md border-b border-slate-100">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-2xl font-bold text-slate-900">{ticker}</h2>
              {data?.quote?.sector && (
                <span className="px-2 py-0.5 rounded bg-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider border border-slate-200">
                  {data.quote.sector}
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500">{data?.quote?.name} <span className="mr-2" dir="rtl">{data?.quote?.arabicName}</span></p>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              className={`p-2 rounded-xl transition-colors border ${inWatchlist ? 'bg-amber-50 border-amber-200 text-amber-500' : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-100'}`}
              onClick={() => setInWatchlist(!inWatchlist)}
            >
              {inWatchlist ? <Star size={18} className="fill-current" /> : <BookmarkPlus size={18} />}
            </button>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors shrink-0">
              <X size={18} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-2 border-cyan-200 border-t-cyan-500 rounded-full animate-spin mb-4" />
            <p className="text-sm text-slate-400 animate-pulse">Loading market data...</p>
          </div>
        ) : !data || !data.quote ? (
          <div className="p-12 text-center text-rose-400">
            <AlertTriangle size={32} className="mx-auto mb-3 opacity-50" />
            <p>Failed to load data for {ticker}</p>
          </div>
        ) : (
          <div className="p-5 space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Current Price (KWD)</p>
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-mono font-black text-slate-900">{data.quote.price?.toFixed(3)}</span>
                  <span className={`text-lg font-mono font-bold flex items-center gap-1 ${data.quote.changePercent > 0 ? 'text-emerald-600' : data.quote.changePercent < 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                    {data.quote.changePercent > 0 ? <TrendingUp size={18} /> : data.quote.changePercent < 0 ? <TrendingDown size={18} /> : null}
                    {data.quote.changePercent > 0 ? '+' : ''}{data.quote.changePercent?.toFixed(2)}%
                  </span>
                  <span className="text-sm font-mono text-slate-400 ml-1">
                    {data.quote.change > 0 ? '+' : ''}{data.quote.change?.toFixed(3)}
                  </span>
                </div>
              </div>
              
              <div className="text-right">
                <p className="text-[9px] text-slate-400 mb-1 flex items-center justify-end gap-1"><Clock size={10} /> {new Date(data.quote.timestamp).toLocaleTimeString()}</p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs font-bold text-slate-500 flex items-center gap-1.5"><Activity size={14} /> 1-Month History</h4>
              </div>
              <div className="h-48 w-full flex items-center justify-center">
                {data.history && data.history.length > 0 ? (
                  <SparklineChart 
                    data={data.history} 
                    width={600} 
                    height={180} 
                    color={data.quote.changePercent >= 0 ? '#059669' : '#e11d48'} 
                    lineWidth={3}
                  />
                ) : (
                  <p className="text-xs text-slate-400">Historical data unavailable</p>
                )}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-500 mb-3 border-b border-slate-100 pb-2">Key Statistics</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <p className="text-[10px] text-slate-400 uppercase mb-1">Volume</p>
                  <p className="text-sm font-mono text-slate-800">{(data.quote.volume || 0).toLocaleString()}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <p className="text-[10px] text-slate-400 uppercase mb-1">Market Cap</p>
                  <p className="text-sm font-mono text-slate-800">{(data.quote.marketCap / 1e9).toFixed(2)}B</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <p className="text-[10px] text-slate-400 uppercase mb-1">P/E Ratio</p>
                  <p className="text-sm font-mono text-slate-800">{data.quote.pe ? data.quote.pe.toFixed(2) : 'N/A'}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <p className="text-[10px] text-slate-400 uppercase mb-1">Div Yield</p>
                  <p className="text-sm font-mono text-slate-800">{data.quote.dividendYield ? (data.quote.dividendYield * 100).toFixed(2) + '%' : 'N/A'}</p>
                </div>
              </div>
            </div>
            
            <div className="mt-6 border-t border-slate-100 pt-4">
              <h4 className="text-xs font-bold text-cyan-600 mb-3 flex items-center gap-1.5"><MessageSquare size={14} /> AI News Impact</h4>
              <div className="bg-gradient-to-r from-cyan-50 to-violet-50 border border-cyan-200 rounded-xl p-4">
                <p className="text-sm text-slate-600">
                  Select news articles from the News feed to see AI-generated impact analysis specifically for {ticker}.
                </p>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
