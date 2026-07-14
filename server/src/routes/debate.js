import express from 'express';
import { z } from 'zod';
import { requireAuth } from '../lib/auth.js';
import { News } from '../models/News.js';
import { Article } from '../models/Article.js';
import { DebateSession } from '../models/DebateSession.js';
import { Portfolio } from '../models/Portfolio.js';
import { CustomAgent } from '../models/CustomAgent.js';
import { Prediction } from '../models/Prediction.js';
import { runDeepSeekJsonPrompt } from '../services/llm/deepseek.js';
import { fetchAlphaVantageData } from '../services/market/alphavantage.js';
import { fetchBulkQuotes } from '../services/market/kuwaitStocks.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { extractRelevantParagraphs } from '../services/market/rag.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const debateRouter = express.Router();

/*
  AGENT DEFINITIONS — 6 Agents
  Agents 1,3,5 → DeepSeek (rapid sentiment, macro)
  Agents 2,4,6 → Gemini 1.5-Pro (structural analysis, risk)
*/
const AGENTS = [
  { id: 1, name: 'Retail Sentiment', provider: 'deepseek', role: 'retail',
    brief: `You are the Retail Sentiment Pulse Tracker for Kuwait & GCC markets. Your expertise:
- Track social media sentiment across Twitter/X, Reddit (r/Kuwait, r/UAE), Telegram trading groups, and local forums (e.g., Hawalli Trading Circle)
- Monitor retail brokerage flow data: net buy/sell ratios, margin utilization, IPO subscription rates
- Identify herding behavior, FOMO waves, and panic selling patterns among individual investors
- Track search trends (Google Trends for "Boursa Kuwait", "KSE stocks") as leading sentiment indicators
- Analyze retail-favorite stocks vs institutional holdings divergence
Your tone: Street-smart, data-aware, occasionally contrarian. You speak for the everyday Kuwaiti investor.`,
    temperature: 0.7 },
  { id: 2, name: 'Institutional PM', provider: 'deepseek', role: 'institutional',
    brief: `You are a seasoned Institutional Portfolio Manager managing a $2B GCC-focused sovereign wealth allocation. Your expertise:
- Deep fundamental analysis: P/E, P/B, EV/EBITDA, ROE decomposition (DuPont) for Boursa Kuwait large-caps
- Capital flow analysis: MSCI/FTSE index rebalancing impacts, foreign institutional investor (FII) flows, ETF creation/redemption
- Earnings quality scoring: accrual ratios, cash conversion cycles, related-party transaction scrutiny
- Portfolio construction: sector allocation, beta-adjusted returns, Sharpe optimization within GCC mandate
- Benchmark-aware: track performance vs S&P GCC Composite, MSCI Kuwait Index
Your tone: Formal, measured, evidence-heavy. You cite exact multiples and compare to historical ranges.`,
    temperature: 0.3 },
  { id: 3, name: 'Dividend Strategist', provider: 'deepseek', role: 'dividend',
    brief: `You are a Dividend Income Strategist specializing in Kuwait & GCC yield plays. Your expertise:
- Payout ratio sustainability analysis: compare dividends to free cash flow (not just earnings)
- Dividend growth rate modeling: 3-year, 5-year CAGR tracking for consistent payers
- Yield curve comparison: stock dividend yields vs Kuwait T-bills (CBK rates), sukuk yields, GCC sovereign bonds
- Ex-dividend date arbitrage and dividend capture strategies specific to Boursa Kuwait settlement cycles (T+3)
- Special dividend probability from Kuwait holding companies (e.g., IFA, KIPCO) with large cash reserves
Your tone: Precise, income-focused, conservative. You always anchor to yield spreads and cash flow coverage ratios.`,
    temperature: 0.4 },
  { id: 4, name: 'Real Estate Analyst', provider: 'deepseek', role: 'realestate',
    brief: `You are a GCC Real Estate & Infrastructure Specialist covering Kuwait property markets. Your expertise:
- Track Kuwait residential/commercial property price indices, rental yields by area (Salmiya, Hawalli, Jahra, Kuwait City)
- Monitor mega-project pipelines: Silk City (Madinat al-Hareer), South Saad Al-Abdullah, Jaber Al-Ahmad City, Mubarak Al-Kabeer Port
- REIT valuation: NAV discounts, occupancy rates, lease expiry profiles for listed Kuwait real estate companies
- Construction sector supply chain: cement prices, steel costs, labor availability from South Asian markets
- Government land distribution policies and their impact on private developers
Your tone: Data-heavy, structural, and project-timeline focused. You reference specific developments and completion dates.`,
    temperature: 0.3 },
  { id: 5, name: 'GCC Macro Strategist', provider: 'deepseek', role: 'macro',
    brief: `You are a GCC Macro Strategist with deep expertise in Kuwait's economic fundamentals. Your expertise:
- Oil price transmission: Brent/WTI \u2192 Kuwait fiscal breakeven \u2192 government spending \u2192 listed company revenues
- Central Bank of Kuwait (CBK) policy: KD peg to basket (USD-heavy), discount rate decisions, reserve adequacy
- Fiscal analysis: Kuwait's budget deficit/surplus, FGF (Future Generations Fund) drawdowns, debt issuance plans
- Regional capital flows: Kuwait \u2194 Saudi/UAE/Qatar investment corridors, GCC customs union impacts
- Demographic drivers: Kuwait 2035 Vision spending, PPP projects, expatriate population policy changes
- OPEC+ quota compliance and its second-order effects on Kuwait Petroleum Corporation subsidiaries
Your tone: Bold, forward-looking, macro-first. You connect global commodity moves to specific Kuwait budget line items.`,
    temperature: 0.6 },
  { id: 6, name: 'Risk Manager', provider: 'deepseek', role: 'risk',
    brief: `You are the Chief Risk Officer and Devil's Advocate for this debate. Your mandate:
- CHALLENGE every bullish thesis: find the tail risk, the hidden fragility, the overlooked contagion path
- Stress-test assumptions: what if oil drops to $50? What if CBK breaks the peg? What if MSCI downgrades Kuwait?
- Track geopolitical risk vectors: Iran tensions, GCC diplomatic fractures, US sanctions secondary effects
- Monitor liquidity risk: Boursa Kuwait daily turnover trends, bid-ask spreads, circuit breaker proximity
- Identify corporate governance red flags: related-party transactions, board concentration, auditor changes
- Scenario analysis: bull/base/bear with probability weights and specific trigger events
Your tone: Contrarian, rigorous, skeptical. You are the one who prevented the fund from buying before the crash.`,
    temperature: 0.25 },
  { id: 7, name: 'Sharia Compliance', provider: 'deepseek', role: 'sharia',
    brief: `You are the Sharia Compliance Analyst for Kuwait & GCC investments. Your expertise:
- Screen stocks against AAOIFI Sharia standards (debt/asset ratio < 30%, impure income < 5%)
- Track sukuk issuance pipeline and secondary market yields across GCC
- Monitor KFH, Boubyan Bank, Warba Bank as Sharia-compliant bellwethers
- Flag conventional banking exposure risks for Islamic fund managers
- Compare Islamic vs conventional banking NIM spreads as rate cycle indicators
- Evaluate takaful (Islamic insurance) sector growth and pricing dynamics
Your tone: Methodical, compliance-focused, and precise. You always anchor to AAOIFI standards and cite specific compliance thresholds.`,
    temperature: 0.3 },
  { id: 8, name: 'Energy Specialist', provider: 'deepseek', role: 'energy',
    brief: `You are the dedicated Energy Sector Specialist for Kuwait markets. Your expertise:
- KPC subsidiary analysis: KNPC, PIC, KOTC revenue and capex cycles
- OPEC+ quota compliance tracking and its impact on listed energy service companies
- Kuwait's 2040 energy strategy: downstream expansion, clean energy pivot, LNG import terminal
- Petrochemical cycle tracking: ethylene, polyethylene, urea margins and capacity utilization
- Oil field services sector: drilling activity, maintenance cycles, contractor margins
- Energy subsidy reform timeline and second-order impact on consumer and transport stocks
Your tone: Technical, commodity-cycle aware, and forward-looking. You always connect oil price moves to specific Kuwait fiscal and corporate revenue impacts.`,
    temperature: 0.5 },
  { id: 9, name: 'Sovereign Wealth (KIA)', provider: 'deepseek', role: 'sovereign',
    brief: `You are the Sovereign Wealth Fund Perspective analyst, modeling how KIA (Kuwait Investment Authority) thinks. Your expertise:
- KIA's known allocation philosophy: long-term, diversified, counter-cyclical value investing
- Track government stake management in key listed companies (KIPCO, Zain, NBK, KFH)
- Model FGF (Future Generations Fund) drawdown scenarios and their impact on market liquidity
- Interpret KIA-linked board appointments and strategic directives as investment signals
- Compare Kuwait's sovereign wealth strategy vs ADIA (Abu Dhabi), PIF (Saudi), QIA (Qatar)
- Analyze privatization pipeline and IPO candidates from government-linked entities
Your tone: Patient, long-term oriented, and strategic. You represent the 30-year view and often disagree with short-term traders.`,
    temperature: 0.4 },
  { id: 10, name: 'GCC Comparator', provider: 'deepseek', role: 'regional',
    brief: `You are the GCC Regional Comparator, contextualizing Kuwait's market moves relative to Saudi, UAE, and Qatar. Your expertise:
- Cross-listed stock arbitrage opportunities across GCC exchanges
- Relative valuation analysis: Kuwait P/E, P/B vs Tadawul, DFM, ADX, QSE benchmarks
- Capital flow rotation patterns: when Saudi rallies, does Kuwait lag or follow?
- MSCI/FTSE index rebalancing cross-GCC effects and passive flow estimation
- GCC customs union, trade flow, and regulatory convergence impacts
- Regional sector comparisons: Kuwait banks vs Saudi banks, Kuwait telecom vs UAE telecom
Your tone: Comparative, data-heavy, and benchmark-aware. You always ask 'is this a Kuwait story or a GCC-wide story?'`,
    temperature: 0.5 },
];

// Max tokens per agent response — increased for depth
const AGENT_MAX_TOKENS = 2200;
const CONSENSUS_MAX_TOKENS = 2800;

function buildAgentPrompt(agent, newsContext, priorMessages, debatePhase, countryFocus, sectorFocus, agentStats = '', language = 'en') {
  const history = priorMessages.map(m =>
    `[${m.agentName}]: ${m.content}`
  ).join('\n\n');

  const sectorContext = sectorFocus && sectorFocus !== 'All Sectors'
    ? `\n\nSECTOR FOCUS: ${sectorFocus}\nYou MUST orient your analysis primarily around the ${sectorFocus} sector in Kuwait/GCC. Reference specific companies, sub-sectors, and value chain dynamics within ${sectorFocus}. If this sector is outside your primary expertise, explain the cross-sector transmission effects (e.g., how banking policy impacts real estate lending).`
    : '';

  const languageInstruction = language === 'ar'
    ? `\n\n=== LANGUAGE REQUIREMENT ===\nYou MUST respond ENTIRELY in professional Arabic (العربية الفصحى). Your analysis, logic, key points, catalysts, risk factors, and stock picks must all be written in Arabic suitable for Kuwaiti institutional investors. JSON keys remain in English but all string values must be in Arabic.\n`
    : '';

  const phaseInstruction = {
    catalyst: `You are the ${agent.name} agent. You are OPENING the debate on ${countryFocus !== 'GCC (All)' ? countryFocus : 'the GCC market'}.${sectorContext}

Your opening statement must:
1. Identify the single most impactful news item from the context and explain WHY it matters most
2. State a clear, falsifiable thesis (e.g., "NBK will outperform the banking index by 5% over the next month because...")
3. Quantify your conviction with a specific probability or confidence range
4. Name the ONE data point that would change your mind`,

    challenge: `You must AGGRESSIVELY CHALLENGE the emerging consensus.${sectorContext}

Your challenge must:
1. Identify the weakest argument made so far and dismantle it with counter-evidence
2. Present a specific historical analogy where similar consensus was wrong (cite the year and what happened)
3. Quantify the downside scenario that others are ignoring
4. Name the specific risk catalyst and its probability of occurring within the time horizon`,

    verdict: `You are delivering the INSTITUTIONAL FINAL VERDICT.${sectorContext}

Your verdict must:
1. Score each prior agent's argument on a 1-10 scale for evidence quality
2. Identify which agent had the strongest thesis and why
3. Synthesize a weighted view based on evidence strength, not just sentiment counting
4. Provide a specific, actionable trade idea with entry/exit levels and risk management`,

    discuss: `Continue the debate by building on or challenging previous arguments.${sectorContext}

Your contribution must:
1. Directly reference and respond to at least ONE specific claim from a previous speaker
2. Introduce NEW evidence not yet discussed (a different article or data point)
3. Refine your position based on what you've heard — show intellectual flexibility
4. Identify areas of genuine agreement vs. irreconcilable disagreement`,
  }[debatePhase] || 'Contribute your expert perspective to the market debate.';

  return `
${agent.brief}
${agentStats ? `\n=== YOUR HISTORICAL ACCURACY ===\n${agentStats}\nUse this context to calibrate your confidence score.\n` : ''}

${phaseInstruction}
${languageInstruction}
MARKET NEWS CONTEXT:
${newsContext}

${history ? `PRIOR DEBATE MESSAGES:\n${history}` : '(You are the first to speak.)'}

=== RESPONSE REQUIREMENTS ===

**EVIDENCE STANDARD (MANDATORY):** Your response will be REJECTED if it fails these checks:
1. Cite AT LEAST 3 specific news articles by using their actual titles. You MUST format citations as Markdown links using the provided URL, like this: [Article Title](URL). If no URL is provided, just use the title.
2. Include AT LEAST 2 exact figures from the data (prices, percentages, dates, amounts)
3. Explain the causal chain: Specific Event \u2192 Transmission Mechanism \u2192 Market Impact \u2192 Your Conclusion
4. If live stock data is available, reference specific tickers with their current price and change %
5. If macro data (oil, commodities) is available, reference exact values and trend direction

Do NOT make generic statements. Every sentence must earn its place with evidence or logic.

Respond with ONLY valid JSON in this exact shape:
{
  "analysis": "Your 6-12 sentence market analysis. Each claim must reference a specific article number and cite actual data points. Be thorough, specific, and institutional-grade.",
  "detailedLogic": "4-6 sentences explaining your complete reasoning chain: which specific facts (with article numbers and exact figures) led to your conclusion, the transmission mechanism, and what would invalidate your thesis.",
  "sentiment": "Bullish" or "Bearish" or "Neutral",
  "confidence": 50 (number 0-100),
  "keyPoint": "One-sentence thesis backed by a specific data point and quantified outcome expectation",
  "catalysts": ["3-4 near-term catalysts with approximate dates/timeframes"],
  "riskFactors": ["2-3 key risks with probability estimates"],
  "stocksToWatch": ["2-4 tickers with brief reasoning (e.g., 'NBK.KW @ 980 fils: Benefiting from CBK rate hold, yield 4.2%')"]
}
`.trim();
}

const StartDebateSchema = z.object({
  marketBias: z.string().default('Neutral'),
  sectorFocus: z.string().default('All Sectors'),
  timeHorizon: z.string().default('Short-term (1-4 weeks)'),
  countryFocus: z.string().default('GCC (All)'),
  agentWeights: z.record(z.string(), z.number()).optional(),
  enabledAgents: z.array(z.string()).optional(),
  language: z.enum(['en', 'ar']).default('en'),
  articleIds: z.array(z.string()).optional(),
});

debateRouter.post('/start', requireAuth, async (req, res) => {
  const parsed = StartDebateSchema.safeParse(req.body);
  if (!parsed.success) {
    console.error('Validation error:', parsed.error);
    return res.status(400).json({ error: 'invalid_input', details: parsed.error.errors });
  }

  const { marketBias, sectorFocus, timeHorizon, countryFocus, agentWeights, enabledAgents, language, articleIds } = parsed.data;
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  
  const query = { publishedAt: { $gte: since } };
  if (countryFocus !== 'GCC (All)') {
    const regex = new RegExp(countryFocus, 'i');
    query.$or = [{ tag: regex }, { headline: regex }, { body: regex }];
  }

  const [newsItems, macroData, stockQuotes, userPortfolio, customAgents] = await Promise.all([
    News.find(query)
      .sort({ publishedAt: -1 })
      .limit(50)
      .select('tag source headline body publishedAt sentimentScore sentimentLabel aiAnalysis aiSectors affectedStocks analyzed url'),
    fetchAlphaVantageData(),
    fetchBulkQuotes(), // Fetch live stock quotes
    Portfolio.findOne({ userId: req.auth.sub }),
    CustomAgent.find({ userId: req.auth.sub })
  ]);

  if (!newsItems.length) {
    return res.status(400).json({ error: 'no_news_available' });
  }

  const ragExtracts = extractRelevantParagraphs(newsItems, newsItems[0]?.headline || '', sectorFocus);

  // Build user-selected articles context (if any)
  let selectedArticlesContext = '';
  if (articleIds?.length) {
    const savedArticles = await Article.find({ _id: { $in: articleIds } });
    if (savedArticles.length) {
      selectedArticlesContext = savedArticles.map((a) => {
        const when = a.publishedAt ? new Date(a.publishedAt).toISOString().slice(0, 10) : '';
        return `[${when}] [${a.source || 'Saved'}] TITLE: "${a.title}" URL: ${a.url || 'None'}\n${(a.excerpt || a.content || '').slice(0, 600)}`;
      }).join('\n\n');
    }
  }

  let newsContext = newsItems.map((n) => {
    const when = n.publishedAt ? new Date(n.publishedAt).toISOString().slice(0, 10) : '';
    const aiNote = n.analyzed && n.aiAnalysis
      ? `\n   [AI: ${n.sentimentLabel} (${n.sentimentScore}) — ${n.aiAnalysis}${n.aiSectors?.length ? ` | Sectors: ${n.aiSectors.join(', ')}` : ''}]`
      : '';
    return `[${when}] [${n.source}] TITLE: "${n.headline}" URL: ${n.url || 'None'}\n${(n.body || '').slice(0, 400)}${aiNote}`;
  }).join('\n\n');

  // Prepend selected articles with priority
  if (selectedArticlesContext) {
    newsContext = `=== USER-SELECTED ARTICLES (PRIORITIZE THESE — the user specifically chose these articles for analysis) ===\n${selectedArticlesContext}\n\n` + newsContext;
  }

  if (ragExtracts) {
    newsContext = `=== DEEP DIVE: HIGHLY RELEVANT EXTRACTS ===\n${ragExtracts}\n\n` + newsContext;
  } else {
    newsContext = `=== MARKET NEWS ===\n` + newsContext;
  }

  if (macroData) {
    newsContext = `=== LATEST COMMODITY DATA (ALPHA VANTAGE) ===\nIndicator: ${macroData.indicator}\nDate: ${macroData.date}\nValue: ${macroData.value} ${macroData.unit}\n\n` + newsContext;
  }

  if (stockQuotes && stockQuotes.length > 0) {
    const stockString = stockQuotes.slice(0, 15).map(q => 
      `${q.ticker}: ${q.price.toFixed(3)} KWD (${q.changePercent > 0 ? '+' : ''}${q.changePercent.toFixed(2)}%)`
    ).join(' | ');
    newsContext = `=== LIVE BOURSA KUWAIT DATA ===\n${stockString}\n\n` + newsContext;
  }

  if (userPortfolio && userPortfolio.holdings.length > 0) {
    const pString = userPortfolio.holdings.map(h => `${h.ticker} (${h.weight}%)`).join(', ');
    
    let crossHoldingsText = '';
    try {
      const chPath = path.join(__dirname, '../data/crossHoldings.json');
      const chData = JSON.parse(fs.readFileSync(chPath, 'utf8'));
      crossHoldingsText = `\n\n=== CONGLOMERATE CROSS-HOLDING RISKS ===\n` + chData.map(g => 
        `Group: ${g.groupName}\nTransmission: ${g.riskTransmission}\nKey Holdings: ${g.keyHoldings.map(k => k.ticker).join(', ')}`
      ).join('\n\n');
    } catch (err) {
      console.warn('[debate] crossHoldings.json not found or invalid');
    }

    newsContext = `=== USER PORTFOLIO ===\nYour top holdings: ${pString}\nAGENTS MUST comment on how the news impacts these specific holdings and flag concentration risks.${crossHoldingsText}\n\n` + newsContext;
  }

  // Add simulation context
  newsContext = `=== DEBATE PARAMETERS ===\nMarket Bias: ${marketBias}\nSector Focus: ${sectorFocus}\nTime Horizon: ${timeHorizon}\nCountry Focus: ${countryFocus}\n\n` + newsContext;

  // CBK Policy Data (semi-static)
  newsContext = `=== CBK MONETARY POLICY ===\nDiscount Rate: 4.00% (held since Mar 2026)\nRepo Rate: 4.25%\nKWD/USD Peg: 0.3065 (basket-weighted)\nNext CBK Meeting: TBD\nPolicy Stance: Neutral — monitoring global rate cycle\n\n` + newsContext;

  const session = await DebateSession.create({
    userId: req.auth.sub,
    trigger: newsItems[0]?.headline || 'Market Analysis',
    filters: { marketBias, sectorFocus },
    messages: [],
  });

  const mergedAgents = [...AGENTS];
  if (customAgents && customAgents.length > 0) {
    customAgents.forEach(ca => {
      mergedAgents.push({
        id: ca._id.toString(),
        name: ca.name,
        provider: 'deepseek', // defaulting to deepseek for custom agents
        role: ca.role,
        brief: ca.brief,
        temperature: ca.temperature,
        isCustom: true
      });
    });
  }

  /* ── Dynamic Turn-Based Debate Protocol ── */
  const activeAgents = enabledAgents && enabledAgents.length > 0
    ? mergedAgents.filter(a => enabledAgents.includes(a.name))
    : mergedAgents.filter(a => a.id <= 6 || typeof a.id === 'number'); // default original 6 + custom

  if (activeAgents.length === 0) {
    return res.status(400).json({ error: 'no_agents_selected' });
  }

  // Build debate order with phase assignment
  const debateOrder = activeAgents.map((agent, idx) => {
    let phase = 'discuss';
    if (idx === 0) phase = 'catalyst';
    else if (agent.role === 'risk') phase = 'challenge';
    else if (idx === activeAgents.length - 1) phase = 'verdict';
    return { agent, phase };
  });

  const messages = [];

  for (const turn of debateOrder) {
    let agentStats = '';
    const pastPredictions = await Prediction.find({ agentName: turn.agent.name, status: 'resolved' });
    if (pastPredictions.length >= 5) {
      const avgScore = pastPredictions.reduce((acc, p) => acc + (p.score || 0), 0) / pastPredictions.length;
      const winRate = (pastPredictions.filter(p => p.score >= 50).length / pastPredictions.length) * 100;
      agentStats = `Win Rate: ${winRate.toFixed(1)}% | Avg Confidence Score: ${avgScore.toFixed(1)}/100 (based on ${pastPredictions.length} resolved predictions).`;
    }

    const prompt = buildAgentPrompt(turn.agent, newsContext, messages, turn.phase, countryFocus, sectorFocus, agentStats, language);
    try {
      let result;
      result = await runDeepSeekJsonPrompt(prompt, AGENT_MAX_TOKENS);

      const analysisText = result.analysis || result.keyPoint || JSON.stringify(result);
      const detailedLogic = result.detailedLogic || '';
      const fullContent = detailedLogic
        ? `${analysisText}\n\n📋 Logic: ${detailedLogic}`
        : analysisText;

      const msg = {
        agentId: turn.agent.id,
        agentName: turn.agent.name,
        provider: turn.agent.provider,
        role: turn.agent.role,
        content: fullContent,
        sentiment: ['Bullish', 'Bearish', 'Neutral'].includes(result.sentiment) ? result.sentiment : 'Neutral',
        confidence: Math.min(100, Math.max(0, Number(result.confidence) || 50)),
        catalysts: Array.isArray(result.catalysts) ? result.catalysts : [],
        riskFactors: Array.isArray(result.riskFactors) ? result.riskFactors : [],
        stocksToWatch: Array.isArray(result.stocksToWatch) ? result.stocksToWatch : [],
        keyPoint: result.keyPoint || '',
        timestamp: new Date(),
      };
      messages.push(msg);
    } catch (err) {
      console.error(`[debate] Agent ${turn.agent.name} (${turn.agent.provider}) error:`, err.message);
      messages.push({
        agentId: turn.agent.id,
        agentName: turn.agent.name,
        provider: turn.agent.provider,
        role: turn.agent.role,
        content: `[Analysis temporarily unavailable — ${turn.agent.name} is recalibrating models]`,
        sentiment: 'Neutral',
        confidence: 0,
        catalysts: [],
        riskFactors: [],
        stocksToWatch: [],
        keyPoint: '',
        timestamp: new Date(),
      });
    }
  }

  // Generate consensus report
  let consensusReport = null;
  let marketImpactRating = 5;
  try {
    let weightsContext = '';
    if (agentWeights && Object.keys(agentWeights).length > 0) {
      weightsContext = '\nAGENT WEIGHTS (1-10 multiplier for importance in final report):\n' +
        Object.entries(agentWeights).map(([name, weight]) => `- ${name}: ${weight}/10`).join('\n');
    }

    const consensusPrompt = `
You are a senior CIO synthesizing a multi-agent market debate on Kuwait/GCC.

DEBATE PARAMETERS:
Market Bias: ${marketBias} | Sector Focus: ${sectorFocus} | Time Horizon: ${timeHorizon}${weightsContext}

DEBATE TRANSCRIPT:
${messages.map(m => `[${m.agentName} (${m.sentiment}, ${m.confidence}% confidence)]: ${m.content}`).join('\n\n')}

Generate a consensus report as ONLY valid JSON:
{
  "title": "Brief market outlook title",
  "summary": "4-6 sentence executive summary synthesizing all viewpoints. You MUST cite news articles using Markdown links with their actual titles and URLs, e.g., [Title](URL).",
  "overallSentiment": "Bullish" or "Bearish" or "Neutral" or "Mixed",
  "marketImpactRating": 5 (number 1-10, how significant is this for markets),
  "keyTakeaways": ["4-6 bullet points with specific data references. Use Markdown links for article citations."],
  "actionableInsights": "3-4 sentences of actionable guidance with specific sectors/stocks to watch",
  "riskWarnings": "2-3 key risk warnings with transmission mechanisms",
  "sectorOutlook": {
    "overweight": ["sectors to overweight with reasoning"],
    "underweight": ["sectors to underweight with reasoning"],
    "watch": ["sectors to watch for catalysts"]
  },
  "topStockPicks": ["3-5 specific stock tickers with brief investment rationale"],
  "stockSelectionMethodology": "A 3-5 sentence explanation of how these stocks were selected. Detail the exact criteria used (e.g., fundamentals, sentiment, valuation multiples), why these metrics were prioritized, and why these specific stocks were chosen over alternatives based on the debate.",
  "timelineEvents": ["3-5 upcoming events/catalysts with approximate dates"],
  "agentScores": [
    {"agentName": "Agent Name", "score": 85, "reasoning": "Brief explanation of why this score"},
    ...for each agent in the debate
  ],
  "winnerAgent": "Name of the agent whose analysis was most accurate/insightful",
  "winnerReasoning": "2-3 sentences explaining why this agent's perspective was the strongest"
}
`.trim();

    const consensus = await runDeepSeekJsonPrompt(consensusPrompt, CONSENSUS_MAX_TOKENS);
    consensusReport = consensus;
    marketImpactRating = Math.min(10, Math.max(1, Number(consensus.marketImpactRating) || 5));
  } catch {
    consensusReport = {
      title: 'Debate Concluded',
      summary: 'Multi-agent analysis complete. Review individual perspectives for detailed insights.',
      overallSentiment: 'Mixed',
      marketImpactRating: 5,
      keyTakeaways: messages.filter(m => m.confidence > 60).map(m => m.content.slice(0, 120)),
      actionableInsights: 'Monitor the debate themes and verify with independent research.',
      riskWarnings: 'Simulation-based analysis. Not financial advice.',
      sectorOutlook: { overweight: [], underweight: [], watch: [] },
      topStockPicks: [],
      timelineEvents: [],
    };
  }

  session.messages = messages;
  session.consensusReport = consensusReport;
  session.marketImpactRating = marketImpactRating;
  session.status = 'completed';
  await session.save();

  // ── Extract Predictions ──
  try {
    const { Prediction } = await import('../models/Prediction.js');
    const timeframeDays = timeHorizon.includes('1-4 weeks') ? 28
      : timeHorizon.includes('1-3 months') ? 90
      : timeHorizon.includes('3-12 months') ? 270 : 30;
    const resolveBy = new Date(Date.now() + timeframeDays * 24 * 60 * 60 * 1000);

    const predictions = messages.map(m => ({
      debateSessionId: session._id,
      userId: req.auth.sub,
      agentId: m.agentId,
      agentName: m.agentName,
      direction: m.sentiment,
      confidence: m.confidence,
      keyPoint: m.keyPoint || '',
      timeframe: timeHorizon,
      resolveBy,
      status: 'pending',
    }));

    await Prediction.insertMany(predictions);
  } catch (predErr) {
    console.error('[debate] Prediction extraction error:', predErr.message);
  }

  return res.json({
    sessionId: session._id,
    trigger: session.trigger,
    messages,
    consensusReport,
    marketImpactRating,
  });
});

debateRouter.post('/:id/followup', requireAuth, async (req, res) => {
  try {
    const { agentId, question } = req.body;
    if (!question) return res.status(400).json({ error: 'question_required' });

    const session = await DebateSession.findById(req.params.id);
    if (!session) return res.status(404).json({ error: 'not_found' });

    const agent = AGENTS.find(a => a.id === agentId) || AGENTS[0];

    const transcript = session.messages.map(m =>
      `[${m.agentName}]: ${m.content}`
    ).join('\n\n');

    const prompt = `
${agent.brief}

You previously participated in a multi-agent debate. Here is the full transcript:

${transcript}

The user is now asking you a follow-up question:
"${question}"

Respond with ONLY valid JSON:
{
  "analysis": "Your detailed response to the user's question, referencing your earlier debate points and any relevant data. Be specific, cite evidence, and provide actionable insight.",
  "sentiment": "Bullish" or "Bearish" or "Neutral",
  "confidence": 50
}
`.trim();

    const result = await runDeepSeekJsonPrompt(prompt, AGENT_MAX_TOKENS);

    const followupMsg = {
      agentId: agent.id,
      agentName: agent.name,
      provider: agent.provider,
      role: agent.role,
      content: result.analysis || JSON.stringify(result),
      sentiment: ['Bullish', 'Bearish', 'Neutral'].includes(result.sentiment) ? result.sentiment : 'Neutral',
      confidence: Math.min(100, Math.max(0, Number(result.confidence) || 50)),
      timestamp: new Date(),
    };

    session.messages.push(followupMsg);
    await session.save();

    return res.json({ message: followupMsg });
  } catch (err) {
    console.error('[debate] followup error:', err.message);
    return res.status(500).json({ error: 'followup_failed' });
  }
});

debateRouter.post('/:id/challenge', requireAuth, async (req, res) => {
  try {
    const { agentId, challengeText } = req.body;
    if (!challengeText) return res.status(400).json({ error: 'challenge_required' });

    const session = await DebateSession.findById(req.params.id);
    if (!session) return res.status(404).json({ error: 'not_found' });

    const challengedAgent = AGENTS.find(a => a.id === agentId);
    if (!challengedAgent) return res.status(404).json({ error: 'agent_not_found' });
    
    const riskAgent = AGENTS.find(a => a.id === 6) || AGENTS[5];

    const transcript = session.messages.map(m =>
      `[${m.agentName}]: ${m.content}`
    ).join('\n\n');

    // Step 1: Challenged Agent Rebuttal
    const rebuttalPrompt = `
${challengedAgent.brief}

You previously participated in a multi-agent debate. Here is the full transcript:
${transcript}

A user is directly CHALLENGING your position:
"${challengeText}"

Respond to this challenge. Defend your thesis using data, but acknowledge valid points.
Respond with ONLY valid JSON:
{
  "analysis": "Your 4-6 sentence rebuttal.",
  "sentiment": "Bullish" or "Bearish" or "Neutral",
  "confidence": 50
}
`.trim();

    const rebuttalResult = await runDeepSeekJsonPrompt(rebuttalPrompt, AGENT_MAX_TOKENS);
    const rebuttalMsg = {
      agentId: challengedAgent.id,
      agentName: challengedAgent.name,
      provider: challengedAgent.provider,
      role: challengedAgent.role,
      content: rebuttalResult.analysis || JSON.stringify(rebuttalResult),
      sentiment: ['Bullish', 'Bearish', 'Neutral'].includes(rebuttalResult.sentiment) ? rebuttalResult.sentiment : 'Neutral',
      confidence: Math.min(100, Math.max(0, Number(rebuttalResult.confidence) || 50)),
      timestamp: new Date(),
    };
    session.messages.push(rebuttalMsg);

    // Step 2: Risk Manager Adjudication
    const adjudicationPrompt = `
${riskAgent.brief}

A debate transcript:
${transcript}

USER CHALLENGE:
"${challengeText}"

REBUTTAL BY ${challengedAgent.name}:
"${rebuttalMsg.content}"

You are the Risk Manager. Adjudicate this specific exchange. Who made the stronger case? What risks did they both miss?
Respond with ONLY valid JSON:
{
  "analysis": "Your 4-5 sentence verdict on the user's challenge vs the agent's rebuttal.",
  "sentiment": "Bearish",
  "confidence": 80
}
`.trim();

    const adjudicationResult = await runDeepSeekJsonPrompt(adjudicationPrompt, AGENT_MAX_TOKENS);
    const adjudicationMsg = {
      agentId: riskAgent.id,
      agentName: riskAgent.name + " (Verdict)",
      provider: riskAgent.provider,
      role: riskAgent.role,
      content: adjudicationResult.analysis || JSON.stringify(adjudicationResult),
      sentiment: ['Bullish', 'Bearish', 'Neutral'].includes(adjudicationResult.sentiment) ? adjudicationResult.sentiment : 'Neutral',
      confidence: Math.min(100, Math.max(0, Number(adjudicationResult.confidence) || 50)),
      timestamp: new Date(),
    };
    session.messages.push(adjudicationMsg);

    await session.save();
    return res.json({ rebuttal: rebuttalMsg, adjudication: adjudicationMsg });
  } catch (err) {
    console.error('[debate] challenge error:', err.message);
    return res.status(500).json({ error: 'challenge_failed' });
  }
});

debateRouter.post('/start-scenario', requireAuth, async (req, res) => {
  try {
    const { originalSessionId, scenarioText } = req.body;
    if (!scenarioText) return res.status(400).json({ error: 'scenario_required' });

    const originalSession = await DebateSession.findById(originalSessionId);
    if (!originalSession) return res.status(404).json({ error: 'not_found' });

    const session = await DebateSession.create({
      userId: req.auth.sub,
      trigger: `WHAT IF: ${scenarioText}`,
      filters: originalSession.filters,
      messages: [],
    });

    const newsContext = `=== ORIGINAL TRIGGER ===\n${originalSession.trigger}\n\n=== USER 'WHAT IF' SCENARIO ===\nThe user has injected a massive counterfactual scenario. You MUST assume this scenario is true and happening right now:\n\n"${scenarioText}"\n\nEvaluate the market impact of this scenario playing out immediately.`;

    const debateOrder = [
      { agent: AGENTS[4], phase: 'catalyst' },
      { agent: AGENTS[5], phase: 'challenge' },
      { agent: AGENTS[1], phase: 'verdict' },
    ];

    const messages = [];

    for (const turn of debateOrder) {
      const prompt = buildAgentPrompt(turn.agent, newsContext, messages, turn.phase, 'GCC (All)', 'All Sectors');
      let result = await runDeepSeekJsonPrompt(prompt, AGENT_MAX_TOKENS);
      
      const analysisText = result.analysis || result.keyPoint || JSON.stringify(result);
      const detailedLogic = result.detailedLogic || '';
      const fullContent = detailedLogic ? `${analysisText}\n\nLogic: ${detailedLogic}` : analysisText;

      messages.push({
        agentId: turn.agent.id,
        agentName: turn.agent.name,
        provider: turn.agent.provider,
        role: turn.agent.role,
        content: fullContent,
        sentiment: ['Bullish', 'Bearish', 'Neutral'].includes(result.sentiment) ? result.sentiment : 'Neutral',
        confidence: Math.min(100, Math.max(0, Number(result.confidence) || 50)),
        keyPoint: result.keyPoint || '',
        timestamp: new Date(),
      });
    }

    session.messages = messages;
    session.status = 'completed';
    await session.save();

    return res.json({
      sessionId: session._id,
      trigger: session.trigger,
      messages
    });
  } catch (err) {
    console.error('[debate] scenario error:', err.message);
    return res.status(500).json({ error: 'scenario_failed' });
  }
});

debateRouter.get('/history', requireAuth, async (req, res) => {
  const sessions = await DebateSession.find({ userId: req.auth.sub })
    .sort({ createdAt: -1 })
    .limit(20)
    .select('trigger status messages consensusReport marketImpactRating filters createdAt');
  return res.json({ items: sessions });
});

debateRouter.get('/session/:id', requireAuth, async (req, res) => {
  const session = await DebateSession.findById(req.params.id);
  if (!session) return res.status(404).json({ error: 'not_found' });
  return res.json({ session });
});

// Export debate report as structured JSON
debateRouter.get('/export/:id', requireAuth, async (req, res) => {
  const session = await DebateSession.findById(req.params.id);
  if (!session) return res.status(404).json({ error: 'not_found' });

  const report = {
    title: session.consensusReport?.title || 'War Room Debate Report',
    generatedAt: new Date().toISOString(),
    trigger: session.trigger,
    filters: session.filters,
    marketImpactRating: session.marketImpactRating,
    agents: session.messages.map(m => ({
      name: m.agentName,
      provider: m.provider,
      role: m.role,
      sentiment: m.sentiment,
      confidence: m.confidence,
      analysis: m.content,
      keyPoint: m.keyPoint || '',
    })),
    consensus: session.consensusReport,
    disclaimer: 'Simulation-based analytical output. Not financial advice. Generated by Vantage AI Terminal.',
  };

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="vantage-warroom-${session._id}.json"`);
  return res.json(report);
});

// Admin: view all debate sessions
debateRouter.get('/admin/all', requireAuth, async (req, res) => {
  if (req.auth.role !== 'admin') return res.status(403).json({ error: 'forbidden' });
  const sessions = await DebateSession.find()
    .sort({ createdAt: -1 })
    .limit(50)
    .select('userId trigger status marketImpactRating createdAt');
  return res.json({ items: sessions });
});
