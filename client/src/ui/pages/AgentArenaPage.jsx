import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, Zap, Lock, Target, Layers, ChevronRight, ChevronDown,
  TrendingUp, TrendingDown, Shield, AlertTriangle, Star,
  Trophy, MessageSquare, Eye, Clock, Activity, BarChart3,
  ArrowRight, Minus, Sparkles, Users
} from 'lucide-react';
import { SentimentPill, ConfidenceGauge } from '../components/SharedComponents.jsx';
import { ReportDownloader } from '../components/ReportDownloader.jsx';

async function api(path, opts = {}) {
  const res = await fetch(path, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(opts.headers ?? {}) },
    credentials: 'include',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errorMsg = data?.details ? `${data.error}: ${JSON.stringify(data.details)}` : (data?.error ?? 'request_failed');
    throw new Error(errorMsg);
  }
  return data;
}

const SECTORS = [
  { id: 'All Sectors', label: 'All Sectors', desc: 'Full market coverage across every sector' },
  { id: 'Banking', label: 'Banking', desc: 'NBK, KFH, Burgan, ABK, CBK, Warba, Boubyan' },
  { id: 'Financial Services', label: 'Financial Services', desc: 'Investment firms, asset management, brokerage' },
  { id: 'Real Estate', label: 'Real Estate', desc: 'Mabanee, Salhia, NREC, United RE, Tamdeen' },
  { id: 'Industrials', label: 'Industrials', desc: 'Petrochemicals, manufacturing, building materials' },
  { id: 'Telecom', label: 'Telecom', desc: 'Zain, STC Kuwait, Ooredoo' },
  { id: 'Insurance', label: 'Insurance', desc: 'Gulf Insurance, Warba Insurance, ARIG' },
  { id: 'Consumer', label: 'Consumer Goods', desc: 'Retail, food & beverage, consumer staples' },
  { id: 'Energy', label: 'Oil & Gas', desc: 'KPC subsidiaries, energy services, petrochemicals' },
  { id: 'Logistics', label: 'Logistics & Transport', desc: 'Agility, NIC, shipping & ports' },
  { id: 'Technology', label: 'Technology', desc: 'Tech startups, digital transformation plays' },
];

const TIME_HORIZONS = [
  { id: 'Short-term (1-4 weeks)', label: 'Short-term', desc: '1-4 weeks' },
  { id: 'Medium-term (1-3 months)', label: 'Medium-term', desc: '1-3 months' },
  { id: 'Long-term (3-12 months)', label: 'Long-term', desc: '3-12 months' },
];

const MARKET_BIASES = [
  { id: 'Bullish', label: 'Bullish', color: 'text-emerald-600' },
  { id: 'Neutral', label: 'Neutral', color: 'text-slate-600' },
  { id: 'Bearish', label: 'Bearish', color: 'text-rose-600' },
];

const AGENT_THEMES = {
  'Retail Sentiment':   { color: '#f59e0b', bg: 'bg-amber-50',  border: 'border-amber-200', text: 'text-amber-700',  icon: Users,          gradFrom: 'from-amber-500',  gradTo: 'to-orange-500' },
  'Institutional PM':   { color: '#3b82f6', bg: 'bg-blue-50',   border: 'border-blue-200',  text: 'text-blue-700',   icon: BarChart3,      gradFrom: 'from-blue-500',   gradTo: 'to-indigo-500' },
  'Dividend Strategist': { color: '#10b981', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', icon: TrendingUp, gradFrom: 'from-emerald-500', gradTo: 'to-teal-500' },
  'Real Estate Analyst': { color: '#8b5cf6', bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700', icon: Layers,         gradFrom: 'from-violet-500', gradTo: 'to-purple-500' },
  'GCC Macro Strategist': { color: '#06b6d4', bg: 'bg-cyan-50',  border: 'border-cyan-200',  text: 'text-cyan-700',   icon: Activity,       gradFrom: 'from-cyan-500',   gradTo: 'to-sky-500' },
  'Risk Manager':       { color: '#ef4444', bg: 'bg-rose-50',   border: 'border-rose-200',  text: 'text-rose-700',   icon: Shield,         gradFrom: 'from-rose-500',   gradTo: 'to-red-500' },
};

const DEBATE_PHASES = {
  catalyst:  { label: 'THE CATALYST',  color: 'text-cyan-600',    bg: 'bg-cyan-50',    border: 'border-cyan-200' },
  discuss:   { label: 'DISCUSSION',    color: 'text-slate-600',   bg: 'bg-slate-50',   border: 'border-slate-200' },
  challenge: { label: 'THE CHALLENGE', color: 'text-rose-600',    bg: 'bg-rose-50',    border: 'border-rose-200' },
  verdict:   { label: 'THE VERDICT',   color: 'text-violet-600',  bg: 'bg-violet-50',  border: 'border-violet-200' },
};

const PHASE_ORDER = ['catalyst', 'discuss', 'discuss', 'discuss', 'challenge', 'verdict'];

function getTheme(name) {
  return AGENT_THEMES[name] || { color: '#64748b', bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-700', icon: Brain, gradFrom: 'from-slate-500', gradTo: 'to-slate-600' };
}

// ═══════════════════════════════════════
// Agent Card Component
// ═══════════════════════════════════════
function AgentCard({ msg, index, isWinner, score }) {
  const [expanded, setExpanded] = useState(false);
  const theme = getTheme(msg.agentName);
  const Icon = theme.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      className={`relative bg-white rounded-2xl border ${theme.border} shadow-sm hover:shadow-lg transition-all overflow-hidden group`}
    >
      {/* Top gradient bar */}
      <div className={`h-1.5 bg-gradient-to-r ${theme.gradFrom} ${theme.gradTo}`} />

      {/* Winner badge */}
      {isWinner && (
        <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-amber-50 border border-amber-200">
          <Trophy size={11} className="text-amber-500" />
          <span className="text-[9px] font-bold text-amber-600 uppercase tracking-wider">Most Accurate</span>
        </div>
      )}

      <div className="p-5">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-10 h-10 rounded-xl ${theme.bg} ${theme.border} border flex items-center justify-center`}>
            <Icon size={18} style={{ color: theme.color }} />
          </div>
          <div className="flex-1">
            <h3 className={`font-bold text-sm ${theme.text}`}>{msg.agentName}</h3>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider">{msg.role}</p>
          </div>
        </div>

        {/* Sentiment + Confidence row */}
        <div className="flex items-center justify-between mb-4">
          <SentimentPill sentiment={msg.sentiment} />
          <div className="flex items-center gap-2">
            <div className="w-20 h-2 rounded-full bg-slate-100 overflow-hidden">
              <motion.div
                className={`h-full rounded-full bg-gradient-to-r ${theme.gradFrom} ${theme.gradTo}`}
                initial={{ width: 0 }}
                animate={{ width: `${msg.confidence}%` }}
                transition={{ delay: index * 0.1 + 0.3, duration: 0.6 }}
              />
            </div>
            <span className="text-xs font-mono font-bold text-slate-600">{msg.confidence}%</span>
          </div>
        </div>

        {/* Score */}
        {score != null && (
          <div className={`flex items-center gap-2 mb-3 px-3 py-1.5 rounded-lg ${theme.bg} border ${theme.border}`}>
            <Star size={11} style={{ color: theme.color }} />
            <span className="text-[10px] font-bold" style={{ color: theme.color }}>Accuracy Score: {score}/100</span>
          </div>
        )}

        {/* Key Point */}
        {msg.keyPoint && (
          <div className="mb-3 px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">Key Thesis</p>
            <p className="text-xs text-slate-700 font-medium leading-relaxed">{msg.keyPoint}</p>
          </div>
        )}

        {/* Analysis (collapsible) */}
        <button onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-slate-600 transition-colors mb-2">
          <ChevronDown size={12} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
          {expanded ? 'Hide Full Analysis' : 'Show Full Analysis'}
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <p className="text-xs text-slate-600 leading-relaxed mb-3 whitespace-pre-line">{msg.content}</p>

              {msg.catalysts?.length > 0 && (
                <div className="mb-2">
                  <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-wider mb-1">Catalysts</p>
                  <ul className="space-y-0.5">
                    {msg.catalysts.map((c, i) => (
                      <li key={i} className="text-[11px] text-slate-500 flex items-start gap-1.5">
                        <ChevronRight size={10} className="text-emerald-400 shrink-0 mt-0.5" />{c}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {msg.riskFactors?.length > 0 && (
                <div className="mb-2">
                  <p className="text-[9px] font-bold text-rose-500 uppercase tracking-wider mb-1">Risk Factors</p>
                  <ul className="space-y-0.5">
                    {msg.riskFactors.map((r, i) => (
                      <li key={i} className="text-[11px] text-slate-500 flex items-start gap-1.5">
                        <AlertTriangle size={10} className="text-rose-400 shrink-0 mt-0.5" />{r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {msg.stocksToWatch?.length > 0 && (
                <div>
                  <p className="text-[9px] font-bold text-cyan-500 uppercase tracking-wider mb-1">Stocks to Watch</p>
                  <div className="flex flex-wrap gap-1.5">
                    {msg.stocksToWatch.map((s, i) => (
                      <span key={i} className="px-2 py-1 rounded-lg bg-cyan-50 border border-cyan-200 text-[10px] font-bold text-cyan-600">{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════
// Debate Timeline Component
// ═══════════════════════════════════════
function DebateTimeline({ messages }) {
  return (
    <div className="relative pl-8">
      {/* Vertical line */}
      <div className="absolute left-[15px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-cyan-300 via-violet-300 to-rose-300 rounded-full" />

      {messages.map((msg, i) => {
        const phase = DEBATE_PHASES[PHASE_ORDER[i]] || DEBATE_PHASES.discuss;
        const theme = getTheme(msg.agentName);
        const Icon = theme.icon;

        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            className="relative mb-6 last:mb-0"
          >
            {/* Timeline dot */}
            <div className={`absolute -left-8 top-3 w-7 h-7 rounded-full ${theme.bg} border-2 ${theme.border} flex items-center justify-center z-10`}>
              <Icon size={12} style={{ color: theme.color }} />
            </div>

            {/* Phase label */}
            {(i === 0 || PHASE_ORDER[i] !== PHASE_ORDER[i - 1]) && (
              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md ${phase.bg} border ${phase.border} mb-2`}>
                <span className={`text-[9px] font-black uppercase tracking-widest ${phase.color}`}>{phase.label}</span>
              </div>
            )}

            {/* Message bubble */}
            <div className={`bg-white rounded-xl border ${theme.border} p-4 shadow-sm hover:shadow-md transition-shadow`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`font-bold text-sm ${theme.text}`}>{msg.agentName}</span>
                  <SentimentPill sentiment={msg.sentiment} />
                </div>
                <span className="text-[10px] font-mono text-slate-400">{msg.confidence}% conf.</span>
              </div>

              {msg.keyPoint && (
                <div className="mb-2 px-2.5 py-1.5 bg-slate-50 rounded-lg border border-slate-100">
                  <p className="text-[11px] text-slate-700 font-medium">{msg.keyPoint}</p>
                </div>
              )}

              <p className="text-xs text-slate-600 leading-relaxed line-clamp-4">{msg.content}</p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════
// Consensus Verdict Component
// ═══════════════════════════════════════
function ConsensusVerdict({ consensus, messages }) {
  if (!consensus) return null;

  const sentColor = consensus.overallSentiment === 'Bullish' ? 'text-emerald-600' :
                    consensus.overallSentiment === 'Bearish' ? 'text-rose-600' :
                    consensus.overallSentiment === 'Mixed' ? 'text-amber-600' : 'text-slate-600';

  const impactPct = ((consensus.marketImpactRating || 5) / 10) * 100;
  const agentScores = consensus.agentScores || [];
  const sortedScores = [...agentScores].sort((a, b) => (b.score || 0) - (a.score || 0));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-4"
    >
      {/* Winner Banner */}
      {consensus.winnerAgent && (
        <div className="bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-50 border border-amber-200 rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-amber-100/50" />
          <div className="relative z-10 flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Trophy size={24} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="text-[9px] font-bold text-amber-500 uppercase tracking-widest mb-0.5">Most Accurate Analyst</p>
              <h3 className="text-lg font-bold text-amber-800">{consensus.winnerAgent}</h3>
              {consensus.winnerReasoning && (
                <p className="text-xs text-amber-600 mt-1 leading-relaxed">{consensus.winnerReasoning}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Scoreboard */}
      {sortedScores.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
            <BarChart3 size={12} />Agent Scoreboard
          </h3>
          <div className="space-y-3">
            {sortedScores.map((s, i) => {
              const theme = getTheme(s.agentName);
              const isWinner = s.agentName === consensus.winnerAgent;
              return (
                <div key={s.agentName} className="flex items-center gap-3">
                  <span className={`text-xs font-mono font-bold w-5 ${i === 0 ? 'text-amber-500' : 'text-slate-300'}`}>#{i + 1}</span>
                  <div className={`w-7 h-7 rounded-lg ${theme.bg} border ${theme.border} flex items-center justify-center shrink-0`}>
                    <theme.icon size={12} style={{ color: theme.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-slate-700 truncate">{s.agentName}</span>
                      {isWinner && <Trophy size={10} className="text-amber-500 shrink-0" />}
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full bg-gradient-to-r ${theme.gradFrom} ${theme.gradTo}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${s.score || 0}%` }}
                        transition={{ delay: i * 0.1, duration: 0.6 }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-mono font-bold text-slate-700 w-10 text-right">{s.score}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Consensus Report Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm relative overflow-hidden">
        <div className="h-1 absolute top-0 left-0 right-0 bg-gradient-to-r from-cyan-500 via-violet-500 to-emerald-500" />

        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Consensus Verdict</p>
            <h3 className="text-lg font-bold text-slate-800">{consensus.title}</h3>
          </div>
          <div className="flex items-center gap-3">
            <div className={`px-3 py-1.5 rounded-lg ${
              consensus.overallSentiment === 'Bullish' ? 'bg-emerald-50 border border-emerald-200' :
              consensus.overallSentiment === 'Bearish' ? 'bg-rose-50 border border-rose-200' :
              'bg-amber-50 border border-amber-200'
            }`}>
              <span className={`text-xs font-bold uppercase tracking-wider ${sentColor}`}>
                {consensus.overallSentiment}
              </span>
            </div>
          </div>
        </div>

        {/* Impact Meter */}
        <div className="mb-5 bg-slate-50 rounded-xl p-4 border border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Market Impact</span>
            <span className="text-lg font-mono font-black text-slate-800">{consensus.marketImpactRating}/10</span>
          </div>
          <div className="w-full h-3 rounded-full bg-slate-200 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-500"
              initial={{ width: 0 }}
              animate={{ width: `${impactPct}%` }}
              transition={{ duration: 0.8 }}
            />
          </div>
        </div>

        {/* Summary */}
        <p className="text-sm text-slate-700 leading-relaxed mb-5">{consensus.summary}</p>

        {/* Key Takeaways */}
        {consensus.keyTakeaways?.length > 0 && (
          <div className="mb-5">
            <h4 className="text-[10px] font-bold text-cyan-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Star size={10} />Key Takeaways
            </h4>
            <ul className="space-y-1.5">
              {consensus.keyTakeaways.map((t, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                  <ChevronRight size={11} className="text-cyan-500 shrink-0 mt-0.5" />{t}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Two columns: Sector Outlook + Action */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          {/* Sector Outlook */}
          {consensus.sectorOutlook && (
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Sector Outlook</h4>
              {consensus.sectorOutlook.overweight?.length > 0 && (
                <div className="mb-2">
                  <span className="text-[9px] font-bold text-emerald-500 uppercase">Overweight</span>
                  <ul className="mt-1 space-y-0.5">
                    {consensus.sectorOutlook.overweight.map((s, i) => (
                      <li key={i} className="text-[11px] text-slate-600 flex items-start gap-1">
                        <TrendingUp size={10} className="text-emerald-400 shrink-0 mt-0.5" />{s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {consensus.sectorOutlook.underweight?.length > 0 && (
                <div className="mb-2">
                  <span className="text-[9px] font-bold text-rose-500 uppercase">Underweight</span>
                  <ul className="mt-1 space-y-0.5">
                    {consensus.sectorOutlook.underweight.map((s, i) => (
                      <li key={i} className="text-[11px] text-slate-600 flex items-start gap-1">
                        <TrendingDown size={10} className="text-rose-400 shrink-0 mt-0.5" />{s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {consensus.sectorOutlook.watch?.length > 0 && (
                <div>
                  <span className="text-[9px] font-bold text-amber-500 uppercase">Watch</span>
                  <ul className="mt-1 space-y-0.5">
                    {consensus.sectorOutlook.watch.map((s, i) => (
                      <li key={i} className="text-[11px] text-slate-600 flex items-start gap-1">
                        <Eye size={10} className="text-amber-400 shrink-0 mt-0.5" />{s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Actionable + Top Picks */}
          <div className="space-y-3">
            {consensus.actionableInsights && (
              <div className="bg-cyan-50 rounded-xl p-4 border border-cyan-200">
                <h4 className="text-[10px] font-bold text-cyan-600 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Sparkles size={10} />Action Plan
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">{consensus.actionableInsights}</p>
              </div>
            )}

            {consensus.topStockPicks?.length > 0 && (
              <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
                <h4 className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Target size={10} />Top Stock Picks
                </h4>
                <ul className="space-y-1">
                  {consensus.topStockPicks.map((p, i) => (
                    <li key={i} className="text-[11px] text-slate-600 flex items-start gap-1.5">
                      <ChevronRight size={10} className="text-emerald-500 shrink-0 mt-0.5" />{p}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Risk Warnings */}
        {consensus.riskWarnings && (
          <div className="bg-rose-50 rounded-xl p-4 border border-rose-200 mb-4">
            <h4 className="text-[10px] font-bold text-rose-600 uppercase tracking-wider mb-2 flex items-center gap-1">
              <AlertTriangle size={10} />Risk Warnings
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">{consensus.riskWarnings}</p>
          </div>
        )}

        <p className="text-[10px] text-slate-300 text-center italic mt-4">
          Multi-agent AI analysis. Not financial advice. Generated by Vantage AI Terminal.
        </p>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════
// MAIN PAGE COMPONENT
// ═══════════════════════════════════════
export default function AgentArenaPage({ me }) {
  const [sector, setSector] = useState('All Sectors');
  const [timeHorizon, setTimeHorizon] = useState('Short-term (1-4 weeks)');
  const [marketBias, setMarketBias] = useState('Neutral');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [err, setErr] = useState('');
  const [activeView, setActiveView] = useState('agents'); // 'agents' | 'debate' | 'verdict'
  const [loadingStep, setLoadingStep] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);

  const [agentWeights, setAgentWeights] = useState({
    'Retail Sentiment': 5,
    'Institutional PM': 5,
    'Dividend Strategist': 5,
    'Real Estate Analyst': 5,
    'GCC Macro Strategist': 5,
    'Risk Manager': 5,
  });
  const [showWeights, setShowWeights] = useState(false);

  const LOADING_STEPS = [
    { text: 'Gathering latest Kuwait & Middle East news...', icon: '📰' },
    { text: 'Fetching live Boursa Kuwait market data...', icon: '📊' },
    { text: 'GCC Macro Strategist scanning oil & fiscal data...', icon: '🛢️' },
    { text: 'Retail Sentiment tracking social media pulse...', icon: '📱' },
    { text: 'Dividend Strategist evaluating yield spreads...', icon: '💰' },
    { text: 'Real Estate Analyst assessing project pipelines...', icon: '🏗️' },
    { text: 'Risk Manager stress-testing scenarios...', icon: '⚠️' },
    { text: 'Institutional PM synthesizing valuation models...', icon: '🏦' },
    { text: 'Agents debating and challenging each other...', icon: '⚔️' },
    { text: 'Generating consensus report & scoring agents...', icon: '🏆' },
  ];

  useEffect(() => {
    if (!running) return;
    const iv = setInterval(() => {
      setLoadingStep(s => s < LOADING_STEPS.length - 1 ? s + 1 : s);
    }, 4000);
    return () => clearInterval(iv);
  }, [running]);

  useEffect(() => {
    if (!running) { setElapsedSec(0); return; }
    const iv = setInterval(() => setElapsedSec(s => s + 1), 1000);
    return () => clearInterval(iv);
  }, [running]);

  async function launch() {
    setErr(''); setRunning(true); setResult(null); setLoadingStep(0); setActiveView('agents');
    try {
      const d = await api('/api/debate/start', {
        method: 'POST',
        body: JSON.stringify({
          marketBias,
          sectorFocus: sector,
          timeHorizon,
          countryFocus: 'Kuwait',
          agentWeights
        }),
      });
      setResult(d);
      setActiveView('agents');
    } catch (e) {
      setErr(e.message || 'Analysis failed. Please try again.');
    } finally { setRunning(false); }
  }

  const agentScoresMap = {};
  if (result?.consensusReport?.agentScores) {
    for (const s of result.consensusReport.agentScores) {
      agentScoresMap[s.agentName] = s.score;
    }
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header / Setup */}
      <div className="glass-card">
        {/* Top header row */}
        <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-violet-500/25">
              <Brain size={22} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">AI Agent Arena</h2>
              <p className="text-xs text-slate-400">6 specialized AI agents debate live news impact on Boursa Kuwait</p>
            </div>
          </div>

          <button
            onClick={launch}
            disabled={!me || running}
            className="group relative flex items-center gap-2.5 px-7 py-3 rounded-xl text-white text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #06b6d4 50%, #10b981 100%)', backgroundSize: '200% 200%' }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-violet-600 via-cyan-500 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex items-center gap-2.5">
              {running ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Agents Working...</span>
                  <span className="text-white/60 text-[10px] font-mono">{elapsedSec}s</span>
                </>
              ) : (
                <>
                  <Zap size={16} className="group-hover:animate-pulse" />
                  <span>Launch Analysis</span>
                  <ArrowRight size={14} className="opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                </>
              )}
            </div>
          </button>
        </div>

        {/* Configuration Grid */}
        <div className="bg-slate-50/50 rounded-2xl border border-slate-100 p-5 mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Sector Focus */}
            <div className="lg:col-span-4">
              <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2.5">
                <Target size={14} className="text-violet-500" />
                Sector Focus
              </label>
              <div className="relative">
                <select
                  value={sector}
                  onChange={e => setSector(e.target.value)}
                  className="w-full h-[46px] bg-white border border-slate-200 rounded-xl pl-4 pr-10 text-sm font-semibold text-slate-800 outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 transition-all cursor-pointer appearance-none shadow-sm hover:border-slate-300"
                >
                  {SECTORS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <ChevronDown size={16} />
                </div>
              </div>
              {sector !== 'All Sectors' && (
                <p className="text-[10px] text-slate-500 mt-2 pl-1 font-medium leading-relaxed">
                  {SECTORS.find(s => s.id === sector)?.desc}
                </p>
              )}
            </div>

            {/* Time Horizon */}
            <div className="lg:col-span-4">
              <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2.5">
                <Clock size={14} className="text-cyan-500" />
                Time Horizon
              </label>
              <div className="flex bg-slate-200/50 p-1 rounded-xl h-[46px]">
                {TIME_HORIZONS.map(th => (
                  <button
                    key={th.id}
                    onClick={() => setTimeHorizon(th.id)}
                    className={`flex-1 flex flex-col items-center justify-center rounded-lg text-[11px] font-bold transition-all duration-200 ${
                      timeHorizon === th.id
                        ? 'bg-white text-violet-700 shadow-sm border border-slate-200/50'
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 border border-transparent'
                    }`}
                  >
                    <span className="tracking-wide">{th.label}</span>
                    <span className={`text-[8px] font-medium leading-none mt-0.5 ${timeHorizon === th.id ? 'text-violet-400' : 'text-slate-400'}`}>{th.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Market Bias */}
            <div className="lg:col-span-4">
              <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2.5">
                <Activity size={14} className="text-emerald-500" />
                Market Bias
              </label>
              <div className="flex bg-slate-200/50 p-1 rounded-xl h-[46px]">
                {MARKET_BIASES.map(mb => (
                  <button
                    key={mb.id}
                    onClick={() => setMarketBias(mb.id)}
                    className={`flex-1 flex flex-col items-center justify-center rounded-lg text-[11px] font-bold transition-all duration-200 ${
                      marketBias === mb.id
                        ? mb.id === 'Bullish' ? 'bg-white text-emerald-600 shadow-sm border border-slate-200/50'
                          : mb.id === 'Bearish' ? 'bg-white text-rose-600 shadow-sm border border-slate-200/50'
                          : 'bg-white text-slate-700 shadow-sm border border-slate-200/50'
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 tracking-wide">
                      {mb.id === 'Bullish' && <TrendingUp size={12} className={marketBias === mb.id ? 'text-emerald-500' : ''} />}
                      {mb.id === 'Neutral' && <Minus size={12} />}
                      {mb.id === 'Bearish' && <TrendingDown size={12} className={marketBias === mb.id ? 'text-rose-500' : ''} />}
                      {mb.label}
                    </div>
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Agent roster preview */}
        <div className="flex flex-wrap gap-2 mb-3">
          {Object.entries(AGENT_THEMES).map(([name, theme]) => (
            <div key={name} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg ${theme.bg} border ${theme.border} hover:shadow-sm transition-shadow cursor-default`}>
              <theme.icon size={11} style={{ color: theme.color }} />
              <span className={`text-[10px] font-bold ${theme.text}`}>{name}</span>
            </div>
          ))}
        </div>

        {/* Agent Weights Panel */}
        <div className="pt-3 border-t border-slate-100">
          <button onClick={() => setShowWeights(!showWeights)} className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors mb-2">
            <ChevronDown size={14} className={`transition-transform duration-200 ${showWeights ? 'rotate-180' : ''}`} />
            Agent Impact Weights
            <span className="text-[9px] text-slate-400 font-normal ml-1">(adjust how much each agent influences the final report)</span>
          </button>
          
          <AnimatePresence>
            {showWeights && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-5 mt-2 bg-gradient-to-br from-slate-50 to-violet-50/30 rounded-xl border border-slate-200">
                  {Object.keys(agentWeights).map(name => {
                    const theme = getTheme(name);
                    const w = agentWeights[name];
                    return (
                      <div key={name} className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.color }} />
                            <span className={`text-[11px] font-bold ${theme.text}`}>{name}</span>
                          </div>
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border shadow-sm ${
                            w >= 7 ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : w <= 3 ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-white text-slate-600 border-slate-200'
                          }`}>{w}/10</span>
                        </div>
                        <input
                          type="range"
                          min="1" max="10"
                          value={w}
                          onChange={e => setAgentWeights({ ...agentWeights, [name]: parseInt(e.target.value) })}
                          className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-violet-500"
                        />
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {!me && (
          <div className="mt-3 flex items-center gap-2 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            <Lock size={12} />Sign in to launch multi-agent analysis
          </div>
        )}
      </div>

      {/* Loading State */}
      {running && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card !p-8"
        >
          <div className="flex flex-col items-center mb-6">
            <div className="relative w-16 h-16 mb-4">
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-violet-200"
                animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <motion.div
                className="absolute inset-2 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center"
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              >
                <Brain size={20} className="text-white" />
              </motion.div>
            </div>
            <p className="text-sm font-bold text-slate-700 mb-1">Agents Working...</p>
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span>Sector: <strong className="text-slate-600">{sector}</strong></span>
              <span>•</span>
              <span>Bias: <strong className="text-slate-600">{marketBias}</strong></span>
              <span>•</span>
              <span className="font-mono text-violet-500 font-bold">{Math.floor(elapsedSec / 60)}:{String(elapsedSec % 60).padStart(2, '0')}</span>
            </div>
          </div>

          <div className="max-w-md mx-auto space-y-2">
            {LOADING_STEPS.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={i <= loadingStep ? { opacity: 1, x: 0 } : { opacity: 0.2, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-2.5"
              >
                {i < loadingStep ? (
                  <div className="w-5 h-5 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center shrink-0">
                    <ChevronRight size={10} className="text-emerald-500" />
                  </div>
                ) : i === loadingStep ? (
                  <div className="w-5 h-5 rounded-full border-2 border-violet-300 border-t-violet-500 animate-spin shrink-0" />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200 shrink-0" />
                )}
                <span className="text-sm mr-1">{step.icon}</span>
                <span className={`text-xs ${i <= loadingStep ? 'text-slate-700 font-medium' : 'text-slate-300'}`}>{step.text}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Error */}
      {err && (
        <div className="glass-card flex items-center gap-3 !border-rose-200 !bg-rose-50">
          <AlertTriangle size={16} className="text-rose-500" />
          <div>
            <p className="text-sm font-semibold text-rose-600">Analysis Failed</p>
            <p className="text-xs text-rose-400">{err}</p>
          </div>
        </div>
      )}

      {/* Results */}
      {result && !running && (
        <>
          {/* View Tabs */}
          <div className="flex rounded-xl bg-slate-100 p-1">
            {[
              { id: 'agents', label: 'Agent Views', icon: Users, count: result.messages?.length },
              { id: 'debate', label: 'Debate Timeline', icon: MessageSquare },
              { id: 'verdict', label: 'Verdict & Scores', icon: Trophy },
            ].map(t => (
              <button key={t.id} onClick={() => setActiveView(t.id)}
                className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeView === t.id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                }`}>
                <t.icon size={13} />
                {t.label}
                {t.count != null && <span className="text-[10px] font-mono bg-slate-100 px-1.5 py-0.5 rounded">{t.count}</span>}
              </button>
            ))}
          </div>

          {/* Agent Cards View */}
          {activeView === 'agents' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(result.messages || []).map((msg, i) => (
                <AgentCard
                  key={msg.agentName}
                  msg={msg}
                  index={i}
                  isWinner={msg.agentName === result.consensusReport?.winnerAgent}
                  score={agentScoresMap[msg.agentName]}
                />
              ))}
            </div>
          )}

          {/* Debate Timeline View */}
          {activeView === 'debate' && (
            <div className="glass-card">
              <h3 className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-2">
                <MessageSquare size={16} className="text-violet-500" />Structured Debate Timeline
              </h3>
              <DebateTimeline messages={result.messages || []} />
            </div>
          )}

          {/* Verdict View */}
          {activeView === 'verdict' && (
            <ConsensusVerdict consensus={result.consensusReport} messages={result.messages} />
          )}
        </>
      )}
    </div>
  );
}
