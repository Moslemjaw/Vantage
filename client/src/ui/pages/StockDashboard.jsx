import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, TrendingDown, Activity, BarChart3, 
  Layers, Search, Globe, ChevronRight 
} from 'lucide-react';
import { SkeletonCard } from '../components/SharedComponents.jsx';
import SectorHeatmap from '../components/SectorHeatmap.jsx';
import SparklineChart from '../components/SparklineChart.jsx';
import StockDetailModal from '../components/StockDetailModal.jsx';

export default function StockDashboard({ me }) {
  const [stocks, setStocks] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [movers, setMovers] = useState({ gainers: [], losers: [] });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSector, setSelectedSector] = useState(null);
  const [selectedStock, setSelectedStock] = useState(null);
  
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [stocksRes, sectorsRes, moversRes] = await Promise.all([
          fetch('/api/stocks/all'),
          fetch('/api/stocks/sectors'),
          fetch('/api/stocks/movers')
        ]);
        
        if (stocksRes.ok) {
          const json = await stocksRes.json();
          setStocks(json.items || []);
        }
        
        if (sectorsRes.ok) {
          const json = await sectorsRes.json();
          setSectors(json.items || []);
        }
        
        if (moversRes.ok) {
          const json = await moversRes.json();
          setMovers(json);
        }
      } catch (e) {
        console.error('Failed to fetch stock dashboard data', e);
      }
      setLoading(false);
    }
    
    fetchData();
  }, []);

  const filteredStocks = stocks.filter(s => {
    const matchesSearch = s.ticker.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSector = selectedSector ? s.sector === selectedSector : true;
    return matchesSearch && matchesSector;
  });

  const totalMarketCap = stocks.reduce((sum, s) => sum + (s.marketCap || 0), 0);
  const upStocks = stocks.filter(s => s.changePercent > 0).length;
  const downStocks = stocks.filter(s => s.changePercent < 0).length;

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card !p-5">
          <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Globe size={12} /> Total Market Cap</p>
          <p className="text-2xl font-mono font-black text-slate-900">
            {(totalMarketCap / 1e9).toFixed(2)}<span className="text-sm text-slate-400">B KWD</span>
          </p>
        </div>
        
        <div className="glass-card !p-5">
          <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Activity size={12} /> Market Breadth</p>
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <span className="text-xl font-mono font-bold text-emerald-600">{upStocks}</span>
              <span className="text-[9px] text-emerald-500/70 uppercase">Advancers</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-mono font-bold text-rose-600">{downStocks}</span>
              <span className="text-[9px] text-rose-500/70 uppercase">Decliners</span>
            </div>
          </div>
        </div>

        <div className="glass-card !p-5 col-span-1 sm:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2"><Layers size={14} className="text-cyan-500" /> Sector Performance</h3>
            {selectedSector && (
              <button 
                onClick={() => setSelectedSector(null)}
                className="text-[10px] text-cyan-600 hover:text-cyan-700 px-2 py-0.5 rounded bg-cyan-50 border border-cyan-200"
              >
                Clear Filter: {selectedSector}
              </button>
            )}
          </div>
          {loading ? (
            <div className="h-[80px] animate-pulse bg-slate-100 rounded-xl"></div>
          ) : (
            <SectorHeatmap sectors={sectors} onSectorClick={setSelectedSector} />
          )}
        </div>
      </div>

      {/* Top Movers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Gainers */}
        <div className="glass-card !p-0 overflow-hidden !border-emerald-200">
          <div className="bg-emerald-50 p-3 border-b border-emerald-100 flex items-center justify-between">
            <h3 className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5"><TrendingUp size={14} /> Top Gainers</h3>
          </div>
          <div className="p-2">
            {loading ? (
              <div className="space-y-2 p-2">{[1,2,3].map(i => <div key={i} className="h-10 bg-slate-50 rounded animate-pulse" />)}</div>
            ) : movers.gainers.slice(0, 4).map((stock, i) => (
              <div 
                key={stock.ticker} 
                onClick={() => setSelectedStock(stock.ticker)}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-emerald-50/60 cursor-pointer transition-colors"
              >
                <div>
                  <p className="font-bold text-sm text-slate-800">{stock.ticker.replace('.KW', '')}</p>
                  <p className="text-[10px] text-slate-400">{stock.name}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm text-slate-900">{stock.price.toFixed(3)}</p>
                  <p className="font-mono text-[11px] text-emerald-600 font-bold">+{stock.changePercent.toFixed(2)}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Losers */}
        <div className="glass-card !p-0 overflow-hidden !border-rose-200">
          <div className="bg-rose-50 p-3 border-b border-rose-100 flex items-center justify-between">
            <h3 className="text-xs font-bold text-rose-700 uppercase tracking-wider flex items-center gap-1.5"><TrendingDown size={14} /> Top Losers</h3>
          </div>
          <div className="p-2">
            {loading ? (
              <div className="space-y-2 p-2">{[1,2,3].map(i => <div key={i} className="h-10 bg-slate-50 rounded animate-pulse" />)}</div>
            ) : movers.losers.slice(0, 4).map((stock, i) => (
              <div 
                key={stock.ticker} 
                onClick={() => setSelectedStock(stock.ticker)}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-rose-50/60 cursor-pointer transition-colors"
              >
                <div>
                  <p className="font-bold text-sm text-slate-800">{stock.ticker.replace('.KW', '')}</p>
                  <p className="text-[10px] text-slate-400">{stock.name}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm text-slate-900">{stock.price.toFixed(3)}</p>
                  <p className="font-mono text-[11px] text-rose-600 font-bold">{stock.changePercent.toFixed(2)}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Stock Table */}
      <div className="glass-card !p-0 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <BarChart3 size={18} className="text-cyan-500" /> Boursa Kuwait Watch
          </h2>
          
          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
            <input 
              type="text" 
              placeholder="Search stocks..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-900 placeholder-slate-300 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100">
                <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ticker</th>
                <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Name / Sector</th>
                <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Price</th>
                <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Change</th>
                <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right hidden md:table-cell">Market Cap</th>
                <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="border-b border-slate-50">
                    <td className="p-4"><div className="h-4 w-16 bg-slate-100 rounded animate-pulse" /></td>
                    <td className="p-4"><div className="h-4 w-32 bg-slate-100 rounded animate-pulse" /></td>
                    <td className="p-4"><div className="h-4 w-16 bg-slate-100 rounded animate-pulse ml-auto" /></td>
                    <td className="p-4"><div className="h-4 w-16 bg-slate-100 rounded animate-pulse ml-auto" /></td>
                    <td className="p-4 hidden md:table-cell"><div className="h-4 w-20 bg-slate-100 rounded animate-pulse ml-auto" /></td>
                    <td className="p-4"><div className="h-6 w-16 bg-slate-100 rounded animate-pulse mx-auto" /></td>
                  </tr>
                ))
              ) : filteredStocks.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-400 text-sm">No stocks found matching your criteria.</td>
                </tr>
              ) : (
                filteredStocks.map((stock) => {
                  const isUp = stock.changePercent > 0;
                  const isDown = stock.changePercent < 0;
                  
                  return (
                    <tr 
                      key={stock.ticker} 
                      className="border-b border-slate-50 hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      onClick={() => setSelectedStock(stock.ticker)}
                    >
                      <td className="p-4">
                        <span className="font-bold text-slate-800">{stock.ticker.replace('.KW', '')}</span>
                      </td>
                      <td className="p-4">
                        <p className="text-sm text-slate-700">{stock.name}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{stock.sector}</p>
                      </td>
                      <td className="p-4 text-right">
                        <span className="font-mono font-bold text-slate-900">{stock.price.toFixed(3)}</span>
                      </td>
                      <td className="p-4 text-right">
                        <div className={`flex flex-col items-end ${isUp ? 'text-emerald-600' : isDown ? 'text-rose-600' : 'text-slate-400'}`}>
                          <span className="font-mono font-bold text-sm">
                            {isUp ? '+' : ''}{stock.changePercent.toFixed(2)}%
                          </span>
                          <span className="font-mono text-[10px] opacity-70">
                            {isUp ? '+' : ''}{stock.change.toFixed(3)}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-right hidden md:table-cell">
                        <span className="font-mono text-xs text-slate-500">{(stock.marketCap / 1e9).toFixed(2)}B</span>
                      </td>
                      <td className="p-4 text-center">
                        <button className="text-[10px] px-3 py-1.5 rounded-lg bg-slate-50 text-cyan-600 border border-slate-200 group-hover:border-cyan-300 group-hover:bg-cyan-50 transition-all flex items-center gap-1 mx-auto">
                          View <ChevronRight size={12} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedStock && (
          <StockDetailModal 
            ticker={selectedStock} 
            onClose={() => setSelectedStock(null)} 
            me={me} 
          />
        )}
      </AnimatePresence>

    </div>
  );
}
