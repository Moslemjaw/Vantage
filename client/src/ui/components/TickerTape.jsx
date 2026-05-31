import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function TickerTape() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchTicker() {
      try {
        const res = await fetch('/api/stocks/ticker-tape');
        if (!res.ok) throw new Error('Failed');
        const data = await res.json();
        if (data.items && data.items.length > 0) {
          setItems(data.items);
        }
      } catch (e) {
        console.error('Ticker tape error:', e);
        setError(true);
      }
    }
    
    fetchTicker();
    const interval = setInterval(fetchTicker, 60000);
    return () => clearInterval(interval);
  }, []);

  if (error || items.length === 0) return null;

  const displayItems = [...items, ...items, ...items];

  return (
    <div className="w-full bg-slate-50 border-y border-slate-200/60 overflow-hidden h-9 flex items-center">
      <div className="flex animate-ticker-scroll whitespace-nowrap py-1.5 min-w-max">
        {displayItems.map((item, i) => {
          const isUp = item.changePercent > 0;
          const isDown = item.changePercent < 0;
          const colorClass = isUp ? 'text-emerald-600' : isDown ? 'text-rose-600' : 'text-slate-400';
          const icon = isUp ? '▲' : isDown ? '▼' : '−';
          
          return (
            <div key={`${item.ticker}-${i}`} className="flex items-center mx-4 gap-2">
              <span className="text-[11px] font-bold text-slate-700">{item.ticker.replace('.KW', '')}</span>
              <span className="text-[11px] font-mono text-slate-900">{item.price.toFixed(3)}</span>
              <span className={`text-[10px] font-mono font-bold flex items-center gap-0.5 ${colorClass}`}>
                <span className="text-[8px]">{icon}</span>
                {Math.abs(item.changePercent).toFixed(2)}%
              </span>
              <div className="w-1 h-1 rounded-full bg-slate-200 mx-2" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
