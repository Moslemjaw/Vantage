import React from 'react';
import { FileText, Download } from 'lucide-react';
import { generateWarRoomPDF, generateNewsReportPDF } from '../utils/pdfGenerator.js';

/**
 * A reusable button for downloading PDF reports.
 * Used on history cards or detail views.
 */
export function ReportDownloader({ type = 'warroom', data, stats, articles, className = '' }) {
  function downloadPDF(e) {
    e.stopPropagation(); // prevent card clicks
    try {
      if (type === 'warroom' || type === 'debate') {
        generateWarRoomPDF(data);
      } else if (type === 'news') {
        generateNewsReportPDF(stats, articles);
      }
    } catch (err) {
      console.error('Failed to generate PDF:', err);
    }
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        onClick={downloadPDF}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500/10 to-violet-500/10 border border-cyan-500/20 text-xs text-cyan-400 hover:from-cyan-500/20 hover:to-violet-500/20 hover:text-white transition-all"
      >
        <Download size={12} />Export PDF
      </button>
    </div>
  );
}
