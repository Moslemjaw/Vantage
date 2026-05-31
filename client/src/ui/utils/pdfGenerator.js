import jsPDF from 'jspdf';

/**
 * Clean, simple PDF Report Generator for Vantage Terminal
 */

const COLORS = {
  bg: [248, 250, 252],
  white: [255, 255, 255],
  cyan: [34, 211, 238],
  violet: [167, 139, 250],
  emerald: [16, 185, 129],
  rose: [244, 63, 94],
  amber: [245, 158, 11],
  text: [15, 23, 42],
  textLight: [71, 85, 105],
  textMuted: [148, 163, 184],
  border: [226, 232, 240],
};

function drawHeader(doc) {
  // Thin gradient accent bar at top
  for (let x = 0; x < 210; x++) {
    const ratio = x / 210;
    const r = Math.round(COLORS.cyan[0] * (1 - ratio) + COLORS.violet[0] * ratio);
    const g = Math.round(COLORS.cyan[1] * (1 - ratio) + COLORS.violet[1] * ratio);
    const b = Math.round(COLORS.cyan[2] * (1 - ratio) + COLORS.violet[2] * ratio);
    doc.setFillColor(r, g, b);
    doc.rect(x, 0, 1, 3, 'F');
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(...COLORS.text);
  doc.text('VANTAGE', 15, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.textMuted);
  doc.text('AI Financial Terminal', 15, 23);

  const now = new Date();
  doc.setFontSize(8);
  doc.text(now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), 195, 18, { align: 'right' });
}

function drawFooter(doc, pageNum, totalPages) {
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.3);
  doc.line(15, 282, 195, 282);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.textMuted);
  doc.text('Vantage AI Terminal — Confidential', 15, 287);
  doc.text(`Page ${pageNum} of ${totalPages}`, 195, 287, { align: 'right' });
}

function newPage(doc) {
  doc.addPage();
  doc.setFillColor(...COLORS.bg);
  doc.rect(0, 0, 210, 297, 'F');
  drawHeader(doc);
  return 32;
}

function checkPage(doc, curY, needed = 30) {
  if (curY + needed > 275) {
    return newPage(doc);
  }
  return curY;
}

function wrapText(doc, text, x, y, maxW, lineH = 4.5) {
  const cleanText = (text || '')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/[→➔➡️]/g, '->')
    .replace(/[^\x20-\x7E\n\r]/g, '');

  const lines = doc.splitTextToSize(cleanText, maxW);
  lines.forEach((line, i) => {
    if (y + i * lineH < 278) {
      doc.text(line, x, y + i * lineH);
    }
  });
  return y + lines.length * lineH;
}

// ─── War Room / Agent Debate PDF ─────────────────────────────

export function generateWarRoomPDF(debate) {
  const doc = new jsPDF('p', 'mm', 'a4');

  // Page 1 background
  doc.setFillColor(...COLORS.bg);
  doc.rect(0, 0, 210, 297, 'F');
  drawHeader(doc);

  let y = 35;

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...COLORS.text);
  doc.text('Multi-Agent Debate Analysis', 15, y);
  y += 10;

  // Trigger
  if (debate.trigger) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.cyan);
    doc.text('TRIGGER', 15, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.text);
    y = wrapText(doc, debate.trigger, 15, y, 180);
    y += 6;
  }

  // Status row
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.3);
  doc.line(15, y, 195, y);
  y += 6;

  const status = debate.status?.toUpperCase() || 'N/A';
  const impact = `${debate.marketImpactRating || '?'}/10`;
  const agents = debate.messages?.length || 0;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.textMuted);
  doc.text('STATUS', 15, y);
  doc.text('IMPACT', 75, y);
  doc.text('AGENTS', 135, y);
  y += 5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  const statusColor = status === 'COMPLETED' ? COLORS.emerald : COLORS.amber;
  doc.setTextColor(...statusColor);
  doc.text(status, 15, y);
  doc.setTextColor(...COLORS.rose);
  doc.text(impact, 75, y);
  doc.setTextColor(...COLORS.violet);
  doc.text(String(agents), 135, y);
  y += 8;

  doc.setDrawColor(...COLORS.border);
  doc.line(15, y, 195, y);
  y += 8;

  // ─── Agent Scoreboard ───
  if (debate.consensusReport?.agentScores?.length) {
    y = checkPage(doc, y, 40);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...COLORS.text);
    doc.text('Agent Scoreboard', 15, y);
    y += 8;

    const winner = debate.consensusReport.winnerAgent;
    
    debate.consensusReport.agentScores.forEach(scoreObj => {
      y = checkPage(doc, y, 10);
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      const isWinner = scoreObj.agentName === winner;
      const nameColor = isWinner ? COLORS.amber : COLORS.text;
      doc.setTextColor(...nameColor);
      doc.text(scoreObj.agentName + (isWinner ? ' (Top Analyst)' : ''), 15, y);
      
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...COLORS.textMuted);
      doc.text(String(scoreObj.score || 0), 195, y, { align: 'right' });
      
      y += 3;
      
      doc.setFillColor(...COLORS.border);
      doc.rect(15, y, 180, 2, 'F');
      
      const width = Math.min((scoreObj.score || 0) / 100 * 180, 180);
      if (width > 0) {
        const barColor = isWinner ? COLORS.amber : COLORS.cyan;
        doc.setFillColor(...barColor);
        doc.rect(15, y, width, 2, 'F');
      }
      
      y += 6;
    });
    
    doc.setDrawColor(...COLORS.border);
    doc.line(15, y, 195, y);
    y += 8;
  }

  // ─── Market Impact Score ───
  if (debate.marketImpactRating != null) {
    y = checkPage(doc, y, 20);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.textMuted);
    doc.text('MARKET IMPACT SCORE', 15, y);
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.text);
    doc.text(`${debate.marketImpactRating}/10`, 195, y, { align: 'right' });
    y += 4;
    
    doc.setFillColor(...COLORS.border);
    doc.rect(15, y, 180, 3, 'F');
    const width = Math.min((debate.marketImpactRating / 10) * 180, 180);
    if (width > 0) {
      doc.setFillColor(...COLORS.rose);
      doc.rect(15, y, width, 3, 'F');
    }
    y += 10;
  }

  // ─── Consensus Summary ───
  if (debate.consensusReport) {
    const cr = debate.consensusReport;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...COLORS.text);
    doc.text('Consensus Summary', 15, y);
    y += 7;

    if (cr.summary) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...COLORS.textLight);
      y = wrapText(doc, cr.summary, 15, y, 180, 5);
      y += 6;
    }

    if (cr.marketBias) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...COLORS.textMuted);
      doc.text('MARKET BIAS', 15, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...COLORS.text);
      doc.text(cr.marketBias, 50, y);
      y += 6;
    }

    if (cr.confidenceLevel) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...COLORS.textMuted);
      doc.text('CONFIDENCE', 15, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...COLORS.text);
      doc.text(String(cr.confidenceLevel), 50, y);
      y += 6;
    }

    if (cr.keyPoints?.length) {
      y = checkPage(doc, y, 20);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...COLORS.cyan);
      doc.text('Key Points', 15, y);
      y += 5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...COLORS.textLight);
      cr.keyPoints.forEach(pt => {
        y = checkPage(doc, y, 12);
        doc.text('•', 17, y);
        y = wrapText(doc, pt, 22, y, 170, 4.5);
        y += 2;
      });
      y += 4;
    }

    if (cr.risks?.length) {
      y = checkPage(doc, y, 20);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...COLORS.rose);
      doc.text('Risks', 15, y);
      y += 5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...COLORS.textLight);
      cr.risks.forEach(r => {
        y = checkPage(doc, y, 12);
        doc.text('•', 17, y);
        y = wrapText(doc, r, 22, y, 170, 4.5);
        y += 2;
      });
      y += 4;
    }

    if (cr.actionItems?.length) {
      y = checkPage(doc, y, 20);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...COLORS.emerald);
      doc.text('Action Items', 15, y);
      y += 5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...COLORS.textLight);
      cr.actionItems.forEach(a => {
        y = checkPage(doc, y, 12);
        doc.text('•', 17, y);
        y = wrapText(doc, a, 22, y, 170, 4.5);
        y += 2;
      });
      y += 4;
    }

    // Separator
    y = checkPage(doc, y, 10);
    doc.setDrawColor(...COLORS.border);
    doc.line(15, y, 195, y);
    y += 8;
  }

  // ─── Agent Transcripts ───
  if (debate.messages?.length) {
    // Always start transcripts on a new page
    y = newPage(doc);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...COLORS.text);
    doc.text('Agent Transcripts', 15, y);
    y += 8;

    debate.messages.forEach((msg, idx) => {
      const content = (msg.content || '').trim();
      const lines = doc.splitTextToSize(content, 170);
      const needed = lines.length * 4.2 + 14;

      y = checkPage(doc, y, Math.min(needed, 60));

      // Agent name
      const color = idx % 2 === 0 ? COLORS.cyan : COLORS.violet;
      doc.setFillColor(...color);
      doc.rect(15, y - 3, 2, 8, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...color);
      doc.text(msg.agentName || `Agent ${idx + 1}`, 20, y);

      if (msg.role) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(...COLORS.textMuted);
        doc.text(msg.role, 20, y + 4);
      }
      y += 8;

      // Content
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...COLORS.text);
      y = wrapText(doc, content, 20, y, 170, 4.2);
      y += 8;
    });
  }

  // Fix page numbers
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawFooter(doc, i, totalPages);
  }

  doc.save(`vantage-analysis-${debate._id || Date.now()}.pdf`);
}

// ─── News Report PDF ─────────────────────────────────────────

export function generateNewsReportPDF(stats, articles = []) {
  const doc = new jsPDF('p', 'mm', 'a4');

  doc.setFillColor(...COLORS.bg);
  doc.rect(0, 0, 210, 297, 'F');
  drawHeader(doc);

  let y = 35;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...COLORS.text);
  doc.text('Market Intelligence Brief', 15, y);
  y += 10;

  // Stats row
  doc.setDrawColor(...COLORS.border);
  doc.line(15, y, 195, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.textMuted);
  doc.text('ARTICLES', 15, y);
  doc.text('BULLISH', 55, y);
  doc.text('BEARISH', 95, y);
  doc.text('SOURCES', 135, y);
  y += 5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.cyan);
  doc.text(String(stats.total || 0), 15, y);
  doc.setTextColor(...COLORS.emerald);
  doc.text(String(stats.bull || 0), 55, y);
  doc.setTextColor(...COLORS.rose);
  doc.text(String(stats.bear || 0), 95, y);
  doc.setTextColor(...COLORS.violet);
  doc.text(String(stats.sources || 0), 135, y);
  y += 8;

  doc.setDrawColor(...COLORS.border);
  doc.line(15, y, 195, y);
  y += 8;

  // Sentiment bar
  const total = stats.total || 1;
  const bullW = ((stats.bull || 0) / total) * 170;
  const neutralW = ((stats.neutral || 0) / total) * 170;
  const bearW = ((stats.bear || 0) / total) * 170;

  if (bullW > 0) { doc.setFillColor(...COLORS.emerald); doc.rect(15, y, bullW, 3, 'F'); }
  if (neutralW > 0) { doc.setFillColor(...COLORS.textMuted); doc.rect(15 + bullW, y, neutralW, 3, 'F'); }
  if (bearW > 0) { doc.setFillColor(...COLORS.rose); doc.rect(15 + bullW + neutralW, y, bearW, 3, 'F'); }
  y += 10;

  // Articles
  if (articles.length) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.text);
    doc.text('Latest Headlines', 15, y);
    y += 7;

    articles.slice(0, 25).forEach(art => {
      y = checkPage(doc, y, 10);

      const sentColor = art.sentimentScore > 0.15 ? COLORS.emerald : art.sentimentScore < -0.15 ? COLORS.rose : COLORS.textMuted;
      doc.setFillColor(...sentColor);
      doc.rect(15, y - 2.5, 1.5, 5, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...COLORS.text);
      doc.text((art.headline || '').slice(0, 95), 19, y);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.setTextColor(...COLORS.textMuted);
      const score = art.sentimentScore != null ? (art.sentimentScore > 0 ? '+' : '') + art.sentimentScore.toFixed(2) : 'N/A';
      doc.text(`${art.source || 'Feed'}  ·  ${score}`, 19, y + 3.5);

      y += 8.5;
    });
  }

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawFooter(doc, i, totalPages);
  }

  doc.save(`vantage-market-intel-${Date.now()}.pdf`);
}
