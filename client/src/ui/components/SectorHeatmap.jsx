import React from 'react';
import { motion } from 'framer-motion';

export default function SectorHeatmap({ sectors, onSectorClick }) {
  if (!sectors || sectors.length === 0) {
    return <div className="p-4 text-center text-slate-400 text-xs">No sector data available</div>;
  }

  const totalMarketCap = sectors.reduce((sum, s) => sum + (s.totalMarketCap || 0), 0) || 1;

  function getColorStyle(change) {
    if (change > 2) return 'bg-emerald-100 border-emerald-300 text-emerald-800';
    if (change > 0) return 'bg-emerald-50 border-emerald-200 text-emerald-700';
    if (change > -2) return 'bg-rose-50 border-rose-200 text-rose-700';
    return 'bg-rose-100 border-rose-300 text-rose-800';
  }

  return (
    <div className="flex flex-wrap gap-2 w-full">
      {sectors.map((sector, i) => {
        const flexBasis = Math.max(10, Math.min(40, (sector.totalMarketCap / totalMarketCap) * 100));
        
        return (
          <motion.div
            key={sector.name}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => onSectorClick && onSectorClick(sector.name)}
            className={`flex-grow flex flex-col justify-between p-3 rounded-xl border cursor-pointer hover:shadow-md transition-all ${getColorStyle(sector.avgChangePercent)}`}
            style={{ flexBasis: `${flexBasis}%`, minHeight: '80px' }}
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold truncate pr-2">{sector.name}</span>
              <span className="text-[10px] font-mono opacity-80 whitespace-nowrap">
                {sector.avgChangePercent > 0 ? '+' : ''}{sector.avgChangePercent.toFixed(2)}%
              </span>
            </div>
            
            {sector.topStock && (
              <div className="mt-auto">
                <p className="text-[9px] opacity-60 uppercase">Top Stock</p>
                <div className="flex justify-between items-end">
                  <span className="text-[11px] font-bold">{sector.topStock.ticker}</span>
                  <span className="text-[10px] font-mono opacity-80">
                    {sector.topStock.changePercent > 0 ? '+' : ''}{sector.topStock.changePercent.toFixed(2)}%
                  </span>
                </div>
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
