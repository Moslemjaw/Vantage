import jsPDF from 'jspdf';

/**
 * Premium PDF Report Generator for Vantage Terminal
 * Creates professional financial-grade PDF reports
 */

const COLORS = {
<<<<<<< HEAD
  bg: [248, 250, 252],
  headerBg: [255, 255, 255],
  cardBg: [255, 255, 255],
  cyan: [34, 211, 238],
  violet: [167, 139, 250],
  emerald: [16, 185, 129],
  rose: [244, 63, 94],
  amber: [245, 158, 11],
  white: [255, 255, 255],
  textPrimary: [15, 23, 42],
  textSecondary: [71, 85, 105],
  textMuted: [148, 163, 184],
  border: [226, 232, 240],
  watermark: [241, 245, 249],
=======
  midnight: [10, 15, 28],
  darkBg: [15, 23, 42],
  cardBg: [30, 41, 59],
  cyan: [34, 211, 238],
  violet: [167, 139, 250],
  emerald: [52, 211, 153],
  rose: [251, 113, 133],
  amber: [251, 191, 36],
  white: [255, 255, 255],
  textPrimary: [248, 250, 252],
  textSecondary: [148, 163, 184],
  textMuted: [100, 116, 139],
  border: [51, 65, 85],
  watermark: [20, 29, 50],
>>>>>>> 3a8b1e6686ec63545d132c1c18b267cfa58c091a
};

function drawWatermark(doc) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(60);
  doc.setTextColor(...COLORS.watermark);
  doc.text('VANTAGE AI', 105, 140, { align: 'center' });
  doc.setFontSize(30);
  doc.text('CONFIDENTIAL REPORT', 105, 155, { align: 'center' });
}

function drawGradientHeader(doc) {
<<<<<<< HEAD
  doc.setFillColor(...COLORS.headerBg);
=======
  // Deep dark header background
  doc.setFillColor(...COLORS.midnight);
>>>>>>> 3a8b1e6686ec63545d132c1c18b267cfa58c091a
  doc.rect(0, 0, 210, 50, 'F');

  // Gradient accent line (top edge)
  for (let x = 0; x < 210; x++) {
    const ratio = x / 210;
    const r = Math.round(COLORS.cyan[0] * (1 - ratio) + COLORS.violet[0] * ratio);
    const g = Math.round(COLORS.cyan[1] * (1 - ratio) + COLORS.violet[1] * ratio);
    const b = Math.round(COLORS.cyan[2] * (1 - ratio) + COLORS.violet[2] * ratio);
    doc.setFillColor(r, g, b);
    doc.rect(x, 0, 1, 2, 'F');
  }

  // Logo area
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
<<<<<<< HEAD
  doc.setTextColor(...COLORS.textPrimary);
=======
  doc.setTextColor(...COLORS.white);
>>>>>>> 3a8b1e6686ec63545d132c1c18b267cfa58c091a
  doc.text('VANTAGE', 15, 25);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.cyan);
  doc.text('AI FINANCIAL TERMINAL  |  INTELLIGENCE DIVISION', 15, 32);

  // Security Classification Badge
<<<<<<< HEAD
  doc.setFillColor(254, 226, 226); // rose-100
  doc.roundedRect(15, 38, 30, 5, 1, 1, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.setTextColor(...COLORS.rose);
=======
  doc.setFillColor(...COLORS.rose);
  doc.roundedRect(15, 38, 30, 5, 1, 1, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.setTextColor(...COLORS.white);
>>>>>>> 3a8b1e6686ec63545d132c1c18b267cfa58c091a
  doc.text('CLASSIFIED', 30, 41.5, { align: 'center' });

  // Report Date & Time
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.textSecondary);
  const now = new Date();
  doc.text(now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), 195, 25, { align: 'right' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
<<<<<<< HEAD
  doc.setTextColor(...COLORS.textPrimary);
  doc.text(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }), 195, 33, { align: 'right' });
  
  // Bottom border for header
  doc.setFillColor(...COLORS.border);
  doc.rect(0, 50, 210, 0.5, 'F');
=======
  doc.setTextColor(...COLORS.white);
  doc.text(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }), 195, 33, { align: 'right' });
>>>>>>> 3a8b1e6686ec63545d132c1c18b267cfa58c091a
}

function drawFooter(doc, pageNum, totalPages) {
  const y = 285;
<<<<<<< HEAD
  doc.setFillColor(...COLORS.headerBg);
=======
  doc.setFillColor(...COLORS.midnight);
>>>>>>> 3a8b1e6686ec63545d132c1c18b267cfa58c091a
  doc.rect(0, y - 5, 210, 17, 'F');

  // Subtle accent line
  doc.setFillColor(...COLORS.border);
  doc.rect(0, y - 5, 210, 0.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.textMuted);
  doc.text('VANTAGE AI TERMINAL', 15, y + 2);
  
  doc.setFont('helvetica', 'normal');
  doc.text('Generated strictly for authorized personnel only.', 15, y + 6);
  
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.cyan);
  doc.text(`PAGE ${pageNum} OF ${totalPages}`, 195, y + 4, { align: 'right' });
}

function drawCard(doc, x, y, w, h, borderColor) {
  doc.setFillColor(...COLORS.cardBg);
  doc.roundedRect(x, y, w, h, 2, 2, 'F');
  
  if (borderColor) {
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.5);
  } else {
    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.2);
  }
  doc.roundedRect(x, y, w, h, 2, 2, 'S');
}

function drawKPI(doc, x, y, label, value, color = COLORS.cyan) {
  drawCard(doc, x, y, 42, 24);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...color);
  doc.text(String(value), x + 21, y + 13, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
<<<<<<< HEAD
  doc.setTextColor(...COLORS.textSecondary);
=======
  doc.setTextColor(...COLORS.textMuted);
>>>>>>> 3a8b1e6686ec63545d132c1c18b267cfa58c091a
  doc.text(label.toUpperCase(), x + 21, y + 19, { align: 'center' });
}

function drawSentimentBar(doc, x, y, w, bull, neutral, bear, total) {
  if (total === 0) return;
  const bullW = (bull / total) * w;
  const neutralW = (neutral / total) * w;
  const bearW = (bear / total) * w;
  const h = 4;

  if (bullW > 0) {
    doc.setFillColor(...COLORS.emerald);
    doc.rect(x, y, bullW, h, 'F');
  }
  if (neutralW > 0) {
    doc.setFillColor(...COLORS.textMuted);
    doc.rect(x + bullW, y, neutralW, h, 'F');
  }
  if (bearW > 0) {
    doc.setFillColor(...COLORS.rose);
    doc.rect(x + bullW + neutralW, y, bearW, h, 'F');
  }
}

function addWrappedText(doc, text, x, y, maxWidth, lineHeight = 4.5) {
  const lines = doc.splitTextToSize(text || '', maxWidth);
  lines.forEach((line, i) => {
    if (y + i * lineHeight < 280) {
      doc.text(line, x, y + i * lineHeight);
    }
  });
  return y + lines.length * lineHeight;
}

// ─── War Room / Agent Debate PDF ─────────────────────────────────────────

export function generateWarRoomPDF(debate) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pw = 180; // page width minus margins

  // Initialize Page 1
<<<<<<< HEAD
  doc.setFillColor(...COLORS.bg);
=======
  doc.setFillColor(...COLORS.darkBg);
>>>>>>> 3a8b1e6686ec63545d132c1c18b267cfa58c091a
  doc.rect(0, 0, 210, 297, 'F');
  drawWatermark(doc);
  drawGradientHeader(doc);

  let curY = 60;

  // Report Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
<<<<<<< HEAD
  doc.setTextColor(...COLORS.textPrimary);
=======
  doc.setTextColor(...COLORS.white);
>>>>>>> 3a8b1e6686ec63545d132c1c18b267cfa58c091a
  doc.text('Multi-Agent Debate Analysis', 15, curY);
  curY += 10;

  // Trigger / Topic
  if (debate.trigger) {
    drawCard(doc, 15, curY, pw, 18, COLORS.cyan);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.cyan);
    doc.text('ANALYSIS TRIGGER', 20, curY + 6);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.textPrimary);
    const lines = doc.splitTextToSize(debate.trigger, pw - 12);
    doc.text(lines[0] || '', 20, curY + 12);
    curY += 24;
  }

  // Meta Row (KPIs)
  const isCompleted = debate.status === 'completed';
  drawKPI(doc, 15, curY, 'Status', debate.status?.toUpperCase() || 'N/A', isCompleted ? COLORS.emerald : COLORS.amber);
  drawKPI(doc, 60, curY, 'Impact Score', `${debate.marketImpactRating || '?'}/10`, COLORS.rose);
  drawKPI(doc, 105, curY, 'Total Agents', debate.messages?.length || 0, COLORS.violet);
<<<<<<< HEAD
  drawKPI(doc, 150, curY, 'Date', debate.createdAt ? new Date(debate.createdAt).toLocaleDateString() : 'N/A', COLORS.textPrimary);
=======
  drawKPI(doc, 150, curY, 'Date', debate.createdAt ? new Date(debate.createdAt).toLocaleDateString() : 'N/A', COLORS.white);
>>>>>>> 3a8b1e6686ec63545d132c1c18b267cfa58c091a
  curY += 32;

  // Consensus Report
  if (debate.consensusReport) {
    const cr = debate.consensusReport;
    drawCard(doc, 15, curY, pw, 8, COLORS.violet);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.violet);
    doc.text('EXECUTIVE CONSENSUS', 20, curY + 6);
    curY += 12;

    if (cr.summary) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...COLORS.textPrimary);
      curY = addWrappedText(doc, cr.summary, 20, curY, pw - 10, 5);
      curY += 6;
    }

    if (cr.keyPoints?.length) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...COLORS.cyan);
      doc.text('KEY STRATEGIC POINTS', 20, curY);
      curY += 6;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...COLORS.textSecondary);
      cr.keyPoints.forEach(pt => {
        if (curY > 265) {
          drawFooter(doc, doc.getNumberOfPages(), '?');
          doc.addPage();
<<<<<<< HEAD
          doc.setFillColor(...COLORS.bg);
=======
          doc.setFillColor(...COLORS.darkBg);
>>>>>>> 3a8b1e6686ec63545d132c1c18b267cfa58c091a
          doc.rect(0, 0, 210, 297, 'F');
          drawWatermark(doc);
          curY = 20;
        }
        doc.setFillColor(...COLORS.cyan);
        doc.circle(21, curY - 1.2, 0.8, 'F');
        curY = addWrappedText(doc, pt, 25, curY, pw - 15, 4.5);
        curY += 2;
      });
      curY += 6;
    }
  }

  // Agent Messages
  if (debate.messages?.length) {
    if (curY > 230) {
      drawFooter(doc, doc.getNumberOfPages(), '?');
      doc.addPage();
<<<<<<< HEAD
      doc.setFillColor(...COLORS.bg);
=======
      doc.setFillColor(...COLORS.darkBg);
>>>>>>> 3a8b1e6686ec63545d132c1c18b267cfa58c091a
      doc.rect(0, 0, 210, 297, 'F');
      drawWatermark(doc);
      curY = 20;
    }

    // Divider Line
    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.5);
    doc.line(15, curY, 195, curY);
    curY += 10;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...COLORS.amber);
    doc.text('RAW AGENT TRANSCRIPTS', 15, curY);
    curY += 10;

    debate.messages.forEach((msg, idx) => {
      // Calculate height of message card
      const content = (msg.content || '').trim();
      const lines = doc.splitTextToSize(content, pw - 16);
      const textHeight = lines.length * 4.2;
      const cardHeight = textHeight + 16;

      if (curY + cardHeight > 270) {
        drawFooter(doc, doc.getNumberOfPages(), '?');
        doc.addPage();
<<<<<<< HEAD
        doc.setFillColor(...COLORS.bg);
=======
        doc.setFillColor(...COLORS.darkBg);
>>>>>>> 3a8b1e6686ec63545d132c1c18b267cfa58c091a
        doc.rect(0, 0, 210, 297, 'F');
        drawWatermark(doc);
        curY = 20;
      }

      const agentColor = idx % 2 === 0 ? COLORS.cyan : COLORS.violet;
      
      // Draw message card
      drawCard(doc, 15, curY, pw, cardHeight);
      
      // Agent Avatar/Icon
      doc.setFillColor(agentColor[0], agentColor[1], agentColor[2]);
      doc.roundedRect(20, curY + 4, 6, 6, 1, 1, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6);
<<<<<<< HEAD
      doc.setTextColor(...COLORS.white);
=======
      doc.setTextColor(...COLORS.darkBg);
>>>>>>> 3a8b1e6686ec63545d132c1c18b267cfa58c091a
      const initial = (msg.agentName || 'A').charAt(0).toUpperCase();
      doc.text(initial, 23, curY + 8, { align: 'center' });

      // Agent Name & Role
      doc.setFontSize(8);
      doc.setTextColor(...agentColor);
      doc.text(msg.agentName || `Agent ${idx + 1}`, 29, curY + 7);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.setTextColor(...COLORS.textMuted);
      doc.text(msg.role || '', 29, curY + 10);

      // Message Content
      doc.setFontSize(8);
      doc.setTextColor(...COLORS.textPrimary);
      addWrappedText(doc, content, 20, curY + 16, pw - 10, 4.2);

      curY += cardHeight + 6;
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
  const pw = 180;

<<<<<<< HEAD
  doc.setFillColor(...COLORS.bg);
=======
  doc.setFillColor(...COLORS.darkBg);
>>>>>>> 3a8b1e6686ec63545d132c1c18b267cfa58c091a
  doc.rect(0, 0, 210, 297, 'F');
  drawWatermark(doc);
  drawGradientHeader(doc);

  let curY = 60;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
<<<<<<< HEAD
  doc.setTextColor(...COLORS.textPrimary);
=======
  doc.setTextColor(...COLORS.white);
>>>>>>> 3a8b1e6686ec63545d132c1c18b267cfa58c091a
  doc.text('Market Intelligence Brief', 15, curY);
  curY += 10;

  // KPIs
  drawKPI(doc, 15, curY, 'Total Articles', stats.total || 0, COLORS.cyan);
  drawKPI(doc, 60, curY, 'Bullish', stats.bull || 0, COLORS.emerald);
  drawKPI(doc, 105, curY, 'Bearish', stats.bear || 0, COLORS.rose);
  drawKPI(doc, 150, curY, 'Sources', stats.sources || 0, COLORS.violet);
  curY += 32;

  // Sentiment overview
  drawCard(doc, 15, curY, pw, 22);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.cyan);
  doc.text('SENTIMENT DISTRIBUTION', 20, curY + 6);

  const avgS = stats.avgScore || 0;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.textSecondary);
  doc.text(`Market Momentum Score: ${avgS > 0 ? '+' : ''}${avgS.toFixed(2)}`, 20, curY + 12);

  drawSentimentBar(doc, 20, curY + 16, pw - 10, stats.bull || 0, stats.neutral || 0, stats.bear || 0, stats.total || 1);
  curY += 28;

  // Article List
  if (articles.length) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.amber);
    doc.text('LATEST MARKET DEVELOPMENTS', 15, curY);
    curY += 8;

    articles.slice(0, 25).forEach((art, i) => {
      if (curY > 270) {
        drawFooter(doc, doc.getNumberOfPages(), '?');
        doc.addPage();
<<<<<<< HEAD
        doc.setFillColor(...COLORS.bg);
=======
        doc.setFillColor(...COLORS.darkBg);
>>>>>>> 3a8b1e6686ec63545d132c1c18b267cfa58c091a
        doc.rect(0, 0, 210, 297, 'F');
        drawWatermark(doc);
        curY = 20;
      }

      // Sentiment indicator
      const sentColor = art.sentimentScore > 0.15 ? COLORS.emerald : art.sentimentScore < -0.15 ? COLORS.rose : COLORS.textMuted;
      doc.setFillColor(...sentColor);
      doc.rect(15, curY - 2.5, 1.5, 6, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...COLORS.textPrimary);
      const headline = (art.headline || '').slice(0, 95);
      doc.text(headline, 19, curY);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.setTextColor(...COLORS.textMuted);
      doc.text(`${art.source || 'Intelligence Feed'}  ·  Sentiment: ${art.sentimentScore != null ? (art.sentimentScore > 0 ? '+' : '') + art.sentimentScore.toFixed(2) : 'N/A'}`, 19, curY + 3.5);
      
      curY += 8.5;
    });
  }

  // Fix page numbers
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawFooter(doc, i, totalPages);
  }

  doc.save(`vantage-market-intel-${Date.now()}.pdf`);
}
