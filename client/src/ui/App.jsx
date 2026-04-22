import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import {
  Activity, Shield, TrendingUp, TrendingDown, Newspaper, Brain, Users,
  Settings, History, Zap, LogOut, ChevronDown, RefreshCw, Send, Eye,
  BarChart3, AlertTriangle, CheckCircle2, Clock, Globe, Target,
  Layers, Briefcase, Building2, Landmark, Gauge, FileText, Star,
  BookmarkPlus, Share2, ExternalLink, Plus, Search, X, Menu,
  ChevronRight, ArrowUpRight, ArrowDownRight, Minus, Radio, Lock
} from 'lucide-react';
import logoUrl from './public/logo.jpg';
import vantageTextUrl from './public/darkBlue.png';

// ═══════════════════════════════════════
// API Helper
// ═══════════════════════════════════════
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

// ═══════════════════════════════════════
// Constants
// ═══════════════════════════════════════
const TABS = [
  { id: 'news', label: 'Market Intel', icon: Newspaper },
  { id: 'debate', label: 'War Room', icon: Brain },
  { id: 'simulation', label: 'Simulation', icon: Target },
  { id: 'history', label: 'History', icon: History },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const MARKET_BIAS = ['Neutral', 'Bullish', 'Bearish', 'High Volatility', 'Crisis/War Premium'];
const SECTOR_FOCUS = ['All Sectors', 'Banking', 'Telecom', 'Real Estate', 'Energy / Oil', 'Logistics', 'Consumer'];
const TIME_HORIZONS = ['Short-term (1-4 weeks)', 'Medium-term (3-6 months)', 'Long-term (1-3 years)'];

const AGENT_COLORS = {
  deepseek: { bg: 'from-cyan-500/10 to-blue-500/8', border: 'border-l-cyan-400', accent: 'text-cyan-400', dot: 'bg-cyan-400' },
  gemini: { bg: 'from-violet-500/10 to-amber-500/8', border: 'border-l-violet-400', accent: 'text-violet-400', dot: 'bg-violet-400' },
};

const AGENT_AVATARS = ['◆', '◇', '▲', '▽', '⬡', '⬢'];

// ═══════════════════════════════════════
// Utilities
// ═══════════════════════════════════════
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

function computeOverallSentiment(items) {
  if (!items.length) return { score: 50, label: 'Neutral' };
  let bull = 0, bear = 0;
  items.forEach(n => {
    const s = sentimentFromText(`${n.headline} ${n.body}`);
    if (s === 'Bullish') bull++;
    if (s === 'Bearish') bear++;
  });
  const total = items.length;
  const score = Math.round(((bull - bear) / total) * 50 + 50);
  const label = score > 60 ? 'Bullish' : score < 40 ? 'Bearish' : 'Neutral';
  return { score: Math.max(0, Math.min(100, score)), label };
}

// ═══════════════════════════════════════
// SVG Sparkline Component
// ═══════════════════════════════════════
function Sparkline({ data = [], color = '#22d3ee', width = 100, height = 28 }) {
  if (data.length < 2) {
    const pts = Array.from({ length: 12 }, () => Math.random() * 0.6 + 0.2);
    data = pts;
  }
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} className="inline-block">
      <defs>
        <linearGradient id={`sg-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round" />
      <polygon
        points={`0,${height} ${points} ${width},${height}`}
        fill={`url(#sg-${color.replace('#','')})`} />
    </svg>
  );
}

// ═══════════════════════════════════════
// Confidence Gauge (Radial)
// ═══════════════════════════════════════
function ConfidenceGauge({ value = 50, size = 72, label }) {
  const radius = (size - 10) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  const color = value >= 70 ? '#10b981' : value >= 40 ? '#f59e0b' : '#ef4444';

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={radius} fill="none"
          stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
        <circle cx={size/2} cy={size/2} r={radius} fill="none"
          stroke={color} strokeWidth="5" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s ease-out' }} />
      </svg>
      <div className="absolute flex items-center justify-center" style={{ width: size, height: size }}>
        <span className="font-mono font-bold text-sm" style={{ color }}>{value}%</span>
      </div>
      {label && <span className="text-[10px] text-white/40 font-medium uppercase tracking-wider">{label}</span>}
    </div>
  );
}

// ═══════════════════════════════════════
// Sentiment Meter
// ═══════════════════════════════════════
function SentimentMeter({ score = 50 }) {
  const label = score > 60 ? 'Bullish' : score < 40 ? 'Bearish' : 'Neutral';
  const labelColor = score > 60 ? 'text-emerald-400' : score < 40 ? 'text-rose-400' : 'text-slate-400';
  return (
    <div className="glass-card !p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Gauge size={14} className="text-white/40" />
          <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">Market Sentiment</span>
        </div>
        <span className={`text-xs font-bold font-mono ${labelColor}`}>{label}</span>
      </div>
      <div className="sentiment-meter">
        <div className="meter-needle" style={{ left: `${score}%` }} />
      </div>
      <div className="flex justify-between mt-1.5 text-[9px] text-white/30 font-mono">
        <span>BEARISH</span><span>NEUTRAL</span><span>BULLISH</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// Skeleton Loader
// ═══════════════════════════════════════
function SkeletonCard({ lines = 3 }) {
  return (
    <div className="glass-card animate-pulse">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className={`skeleton h-3 mb-3 ${i === 0 ? 'w-2/5' : i === lines - 1 ? 'w-3/5' : 'w-full'}`} />
      ))}
    </div>
  );
}

// ═══════════════════════════════════════
// Geometric Avatar
// ═══════════════════════════════════════
function GeoAvatar({ name = '', status = 'live', size = 36 }) {
  const initial = (name || '?')[0].toUpperCase();
  const hue = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return (
    <div className="status-ring relative" data-status={status}
      style={{ width: size, height: size }}>
      <div className="rounded-xl flex items-center justify-center font-bold text-white text-sm w-full h-full"
        style={{ background: `linear-gradient(135deg, hsl(${hue}, 70%, 45%), hsl(${(hue + 40) % 360}, 60%, 35%))` }}>
        {initial}
      </div>
      <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-midnight ${
        status === 'live' ? 'bg-green-400' : status === 'processing' ? 'bg-amber-400 animate-pulse' : 'bg-slate-500'
      }`} />
    </div>
  );
}

// ═══════════════════════════════════════
// Sentiment Pill
// ═══════════════════════════════════════
function SentimentPill({ sentiment }) {
  const cls = sentiment === 'Bullish' ? 'sentiment-bullish' : sentiment === 'Bearish' ? 'sentiment-bearish' : 'sentiment-neutral';
  const Icon = sentiment === 'Bullish' ? ArrowUpRight : sentiment === 'Bearish' ? ArrowDownRight : Minus;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${cls}`}>
      <Icon size={11} />{sentiment}
    </span>
  );
}

// ═══════════════════════════════════════
// Radial Weight Input
// ═══════════════════════════════════════
function WeightRing({ value, onChange, label, color = '#22d3ee', max = 100 }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / max) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-24 h-24 cursor-pointer" onClick={() => {
        const next = ((value + 10) % (max + 10));
        onChange(Math.min(max, next));
      }}>
        <svg width="96" height="96" className="-rotate-90">
          <circle cx="48" cy="48" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
          <circle cx="48" cy="48" r={radius} fill="none" stroke={color} strokeWidth="6"
            strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.4s ease' }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-mono font-bold text-lg text-white">{value}%</span>
        </div>
      </div>
      <span className="text-[10px] text-white/50 font-semibold uppercase tracking-wider text-center">{label}</span>
    </div>
  );
}

// ═══════════════════════════════════════
// FLOATING NAV (The Dock)
// ═══════════════════════════════════════
function FloatingNav({ me, tab, setTab, onLogout, setShowAuth, setShowAdmin, setShowPublisher }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [tickerItems, setTickerItems] = useState([]);

  useEffect(() => {
    api('/api/news/weekly?page=1&pageSize=10&autoSync=1')
      .then(d => setTickerItems(d.items ?? []))
      .catch(() => setTickerItems([]));
  }, []);

  return (
    <header className="floating-nav">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Main nav row */}
        <div className="flex items-center justify-between h-14">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <img src={logoUrl} alt="Vantage Logo" className="w-10 h-10 object-contain rounded-lg" />
            <div className="flex flex-col justify-center translate-y-0.5">
              <img src={vantageTextUrl} alt="VANTAGE" className="h-3 ml-0.5 object-contain" />
              <p className="text-[9px] text-white/40 font-medium tracking-widest uppercase pl-1 mt-0.5">AI Terminal</p>
            </div>
          </div>

          {/* Tabs */}
          <nav className="hidden md:flex items-center gap-1">
            {TABS.map(t => {
              const Icon = t.icon;
              return (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200
                    ${tab === t.id
                      ? 'bg-white/10 text-white shadow-lg shadow-cyan-500/5'
                      : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                    }`}>
                  <Icon size={13} />{t.label}
                </button>
              );
            })}
          </nav>

          {/* Profile */}
          <div className="flex items-center gap-2">
            {me?.role === 'admin' && (
              <button onClick={() => setShowAdmin(true)}
                className="p-1.5 rounded-lg bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 transition-colors"
                title="Admin Dashboard">
                <Shield size={14} />
              </button>
            )}
            {(me?.role === 'publisher' || me?.role === 'admin') && (
              <button onClick={() => setShowPublisher(true)}
                className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                title="Publish News">
                <Plus size={14} />
              </button>
            )}
            <div className="relative">
              <button onClick={() => me ? setMenuOpen(p => !p) : setShowAuth(true)}
                className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                <GeoAvatar name={me?.name || '?'} status={me ? 'live' : 'offline'} size={28} />
                <span className="text-xs font-medium text-white/80 hidden sm:block">
                  {me ? me.name : 'Sign In'}
                </span>
                {me && <ChevronDown size={12} className="text-white/40" />}
              </button>
              {menuOpen && me && (
                <div className="absolute right-0 top-full mt-2 w-48 rounded-xl bg-midnight-light/95 backdrop-blur-xl border border-white/10 shadow-2xl z-50 overflow-hidden animate-fade-in">
                  <div className="px-3 py-2 border-b border-white/5">
                    <p className="text-xs font-semibold text-white/80">{me.name}</p>
                    <p className="text-[10px] text-white/40">{me.email}</p>
                    <span className="inline-block mt-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-400">
                      {me.role}
                    </span>
                  </div>
                  {TABS.map(t => (
                    <button key={t.id} onClick={() => { setTab(t.id); setMenuOpen(false); }}
                      className="w-full text-left px-3 py-2 text-xs text-white/60 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2">
                      <t.icon size={12} />{t.label}
                    </button>
                  ))}
                  <button onClick={() => { onLogout(); setMenuOpen(false); }}
                    className="w-full text-left px-3 py-2 text-xs text-rose-400/80 hover:text-rose-400 hover:bg-rose-500/5 transition-colors flex items-center gap-2 border-t border-white/5">
                    <LogOut size={12} />Sign Out
                  </button>
                </div>
              )}
            </div>

            {/* Mobile menu */}
            <button className="md:hidden p-1.5 text-white/50" onClick={() => setMenuOpen(p => !p)}>
              <Menu size={18} />
            </button>
          </div>
        </div>

        {/* Ticker tape */}
        <div className="ticker-wrap py-1.5">
          <div className="ticker-track gap-6">
            {[...tickerItems, ...tickerItems].map((it, i) => {
              const s = sentimentFromText(it.headline);
              return (
                <span key={`${it._id}-${i}`} className="inline-flex items-center gap-2 text-[11px] font-mono text-white/60 whitespace-nowrap mr-8">
                  <span className={`w-1.5 h-1.5 rounded-full ${s === 'Bullish' ? 'bg-emerald-400' : s === 'Bearish' ? 'bg-rose-400' : 'bg-slate-500'}`} />
                  {it.headline?.slice(0, 80)}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
}

// ═══════════════════════════════════════
// AUTH PAGE (The Dhow Login)
// ═══════════════════════════════════════
function AuthPage({ onAuth, onClose }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e?.preventDefault();
    setErr(''); setLoading(true);
    try {
      const payload = mode === 'register' ? { email, name, password } : { email, password };
      const data = await api(`/api/auth/${mode}`, { method: 'POST', body: JSON.stringify(payload) });
      onAuth(data.user);
    } catch (e) {
      setErr(String(e?.message ?? e));
    } finally { setLoading(false); }
  }

  return (
    <div className="auth-backdrop" onClick={e => e.target === e.currentTarget && onClose?.()}>
      <div className="w-full max-w-md mx-4 animate-slide-up">
        <div className="glass-card !p-0 overflow-hidden">
          {/* Header */}
          <div className="p-6 pb-4 text-center bg-gradient-to-b from-white/[0.03] to-transparent">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center mx-auto mb-4">
              <Activity size={24} className="text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">Welcome to Vantage</h2>
            <p className="text-xs text-white/40 mt-1">AI-Powered Financial Intelligence Terminal</p>
          </div>

          {/* Toggle */}
          <div className="mx-6 mt-2 flex rounded-xl bg-white/5 p-1">
            {['login', 'register'].map(m => (
              <button key={m} onClick={() => setMode(m)}
                className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                  mode === m ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'
                }`}>{m === 'login' ? 'Sign In' : 'Create Account'}</button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={submit} className="p-6 space-y-3">
            <div>
              <label className="block text-[10px] font-bold text-white/30 uppercase tracking-wider mb-1.5">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/20 outline-none transition-all"
                placeholder="you@company.com" required />
            </div>
            {mode === 'register' && (
              <div>
                <label className="block text-[10px] font-bold text-white/30 uppercase tracking-wider mb-1.5">Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/20 outline-none transition-all"
                  placeholder="Full name" required />
              </div>
            )}
            <div>
              <label className="block text-[10px] font-bold text-white/30 uppercase tracking-wider mb-1.5">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/20 outline-none transition-all"
                placeholder="Min 8 characters" required />
            </div>

            {err && (
              <div className="error-card !p-3 flex items-center gap-2 text-xs">
                <AlertTriangle size={14} className="text-rose-400 shrink-0" />
                <span className="text-rose-300">{err}</span>
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 text-white font-bold text-sm hover:shadow-lg hover:shadow-cyan-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? 'Processing...' : mode === 'register' ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          {/* Trust badges */}
          <div className="px-6 pb-4 flex items-center justify-center gap-4 text-[10px] text-white/25">
            <span className="flex items-center gap-1"><Lock size={9} />Encrypted</span>
            <span>•</span>
            <span className="flex items-center gap-1"><Shield size={9} />Secure Gateway</span>
            <span>•</span>
            <span className="flex items-center gap-1"><Globe size={9} />Kuwait/GCC</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// LIVE NEWS PAGE (Heatmap Grid)
// ═══════════════════════════════════════
function NewsPage({ me }) {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [savedIds, setSavedIds] = useState({});

  const load = useCallback(async (p = page) => {
    setLoading(true);
    try {
      const d = await api(`/api/news/weekly?page=${p}&pageSize=8&autoSync=1`);
      setItems(d.items ?? []);
      setPage(d.page ?? 1);
      setTotalPages(d.totalPages ?? 1);
    } catch {}
    setLoading(false);
  }, [page]);

  useEffect(() => { load(1); }, []);

  const sentiment = useMemo(() => computeOverallSentiment(items), [items]);

  async function saveItem(n) {
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

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Sentiment Meter */}
      <SentimentMeter score={sentiment.score} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Newspaper size={18} className="text-cyan-400" />Market Intelligence Feed
          </h2>
          <p className="text-xs text-white/40 mt-0.5">Live Kuwait & GCC news — 7-day rolling window</p>
        </div>
        <button onClick={() => load(page)} disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white/60 hover:text-white hover:bg-white/10 transition-all disabled:opacity-40">
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />Refresh
        </button>
      </div>

      {/* News Grid (Heatmap style) */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[1,2,3,4,5,6].map(i => <SkeletonCard key={i} lines={4} />)}
        </div>
      ) : (
        <div className="heatmap-grid">
          {items.map((n, idx) => {
            const s = sentimentFromText(`${n.headline} ${n.body}`);
            const importance = idx === 0 ? 'importance-high' : idx < 3 ? 'importance-medium' : '';
            return (
              <div key={n._id} className={`glass-card group cursor-pointer ${importance}`}>
                <div className="flex items-start justify-between mb-2">
                  <span className="px-2 py-0.5 rounded-md bg-white/5 text-[10px] font-bold text-white/50 uppercase tracking-wider">
                    {n.tag || 'KUWAIT'}
                  </span>
                  <SentimentPill sentiment={s} />
                </div>
                <h3 className={`font-bold text-white leading-snug mb-2 ${idx === 0 ? 'text-xl' : 'text-sm'}`}>
                  {n.headline}
                </h3>
                <p className="text-xs text-white/40 mb-2">
                  {n.source} · {formatAgo(n.publishedAt || n.createdAt)}
                </p>
                {n.body && (
                  <p className="text-xs text-white/50 leading-relaxed line-clamp-3">{n.body}</p>
                )}
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5">
                  {n.createdByUserId && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 text-[10px] font-bold text-emerald-400">
                      <CheckCircle2 size={10} />Verified Source
                    </span>
                  )}
                  <div className="flex-1" />
                  <button onClick={() => saveItem(n)} className="p-1.5 rounded-lg hover:bg-white/5 text-white/30 hover:text-cyan-400 transition-colors">
                    {savedIds[n._id] ? <Star size={14} className="fill-current text-amber-400" /> : <BookmarkPlus size={14} />}
                  </button>
                  {n.url && (
                    <a href={n.url} target="_blank" rel="noopener noreferrer"
                      className="p-1.5 rounded-lg hover:bg-white/5 text-white/30 hover:text-cyan-400 transition-colors">
                      <ExternalLink size={14} />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button key={i} onClick={() => load(i + 1)}
              className={`w-2 h-2 rounded-full transition-all ${page === i + 1 ? 'bg-cyan-400 w-6' : 'bg-white/20 hover:bg-white/40'}`} />
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════
// WAR ROOM (Agent Debate Page)
// ═══════════════════════════════════════
function DebatePage({ me }) {
  const [messages, setMessages] = useState([]);
  const [consensus, setConsensus] = useState(null);
  const [running, setRunning] = useState(false);
  const [activeAgent, setActiveAgent] = useState(null);
  const [marketBias, setMarketBias] = useState('Neutral');
  const [err, setErr] = useState('');
  const scrollRef = useRef(null);

  async function startDebate() {
    if (!me) return;
    setRunning(true);
    setMessages([]);
    setConsensus(null);
    setErr('');
    setActiveAgent('Initializing agents...');

    try {
      const d = await api('/api/debate/start', {
        method: 'POST',
        body: JSON.stringify({ marketBias }),
      });
      setMessages(d.messages || []);
      setConsensus(d.consensusReport);
    } catch (e) {
      setErr('Market Data Interrupted — Unable to initialize debate session. Please retry.');
    } finally {
      setRunning(false);
      setActiveAgent(null);
    }
  }

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="glass-card !p-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Brain size={18} className="text-violet-400" />
              War Room — Live Agent Debate
            </h2>
            <p className="text-xs text-white/40 mt-1">
              6 AI agents debate market trends using DeepSeek & Gemini. Turn-based protocol with consensus synthesis.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select value={marketBias} onChange={e => setMarketBias(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white/70 outline-none focus:border-cyan-400/40">
              {MARKET_BIAS.map(b => <option key={b} value={b} className="bg-midnight">{b}</option>)}
            </select>
            <button onClick={startDebate} disabled={!me || running}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 text-white text-xs font-bold hover:shadow-lg hover:shadow-cyan-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
              {running ? (
                <>
                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Agents Thinking...
                </>
              ) : (
                <><Zap size={13} />Launch Debate</>
              )}
            </button>
          </div>
        </div>
        {!me && (
          <div className="mt-3 flex items-center gap-2 text-xs text-amber-400/70 bg-amber-400/5 rounded-lg px-3 py-2">
            <Lock size={12} />Sign in to launch debates
          </div>
        )}
      </div>

      {/* Agent Legend */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
        {[
          { name: 'Retail', provider: 'deepseek', icon: Users },
          { name: 'Institutional', provider: 'gemini', icon: Landmark },
          { name: 'Dividend', provider: 'deepseek', icon: BarChart3 },
          { name: 'Real Estate', provider: 'gemini', icon: Building2 },
          { name: 'GCC Macro', provider: 'deepseek', icon: Globe },
          { name: 'Risk Mgr', provider: 'gemini', icon: Shield },
        ].map((a, i) => (
          <div key={a.name} className="glass-card !p-3 flex items-center gap-2">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
              a.provider === 'deepseek' ? 'bg-cyan-500/15 text-cyan-400' : 'bg-violet-500/15 text-violet-400'
            }`}>
              <a.icon size={13} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-white/70">{a.name}</p>
              <p className="text-[9px] text-white/30 font-mono uppercase">{a.provider}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Debate Messages */}
      <div ref={scrollRef} className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
        {running && messages.length === 0 && (
          <div className="glass-card !p-6 text-center">
            <div className="inline-flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
              <span className="text-sm text-white/60">Agents entering the War Room...</span>
            </div>
            <div className="typing-dots mt-3 text-cyan-400">
              <span /><span /><span />
            </div>
          </div>
        )}

        {messages.map((msg, i) => {
          const colors = AGENT_COLORS[msg.provider] || AGENT_COLORS.deepseek;
          return (
            <div key={i} className="animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
              <div className={`chat-bubble ${msg.provider === 'deepseek' ? 'chat-bubble-deepseek' : 'chat-bubble-gemini'}`}>
                <div className="flex items-start gap-3">
                  <div className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold ${
                    msg.provider === 'deepseek' ? 'bg-cyan-500/15 text-cyan-400' : 'bg-violet-500/15 text-violet-400'
                  }`}>
                    {AGENT_AVATARS[msg.agentId - 1] || '◆'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="text-xs font-bold text-white">{msg.agentName}</span>
                      <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                        msg.provider === 'deepseek' ? 'bg-cyan-500/10 text-cyan-400' : 'bg-violet-500/10 text-violet-400'
                      }`}>{msg.provider}</span>
                      <SentimentPill sentiment={msg.sentiment} />
                      <span className="text-[10px] font-mono text-white/30 ml-auto">{msg.confidence}% conf.</span>
                    </div>
                    <p className="text-sm text-white/80 leading-relaxed">{msg.content}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Error */}
      {err && (
        <div className="error-card flex items-center gap-3">
          <AlertTriangle size={16} className="text-rose-400 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-rose-300">Market Data Interrupted</p>
            <p className="text-xs text-rose-400/60 mt-0.5">{err}</p>
          </div>
        </div>
      )}

      {/* Consensus Report */}
      {consensus && (
        <div className="report-briefing animate-slide-up">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 flex items-center justify-center">
              <FileText size={18} className="text-cyan-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Final Consensus Briefing</h3>
              <p className="text-[10px] text-white/40 font-mono uppercase">
                Market Impact Rating: {consensus.marketImpactRating || '—'}/10
              </p>
            </div>
            <div className="ml-auto">
              <ConfidenceGauge
                value={Math.round((consensus.marketImpactRating || 5) * 10)}
                size={56}
                label="Impact"
              />
            </div>
          </div>

          {consensus.title && (
            <h4 className="text-base font-bold text-white mb-2">{consensus.title}</h4>
          )}

          <p className="text-sm text-white/70 leading-relaxed mb-4">{consensus.summary}</p>

          {consensus.keyTakeaways?.length > 0 && (
            <div className="mb-4">
              <h5 className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2">Key Takeaways</h5>
              <ul className="space-y-1.5">
                {consensus.keyTakeaways.map((t, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-white/60">
                    <ChevronRight size={12} className="text-cyan-400 shrink-0 mt-0.5" />{t}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {consensus.actionableInsights && (
            <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
              <h5 className="text-[10px] font-bold text-emerald-400/70 uppercase tracking-wider mb-1.5">Actionable Insights</h5>
              <p className="text-xs text-white/60 leading-relaxed">{consensus.actionableInsights}</p>
            </div>
          )}

          <p className="text-[10px] text-white/20 mt-4 text-center italic">
            Simulation-based analytical output. Not financial advice.
          </p>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════
// SIMULATION PAGE
// ═══════════════════════════════════════
function SimulationPage({ me }) {
  const [marketBias, setMarketBias] = useState('Crisis/War Premium');
  const [sectorFocus, setSectorFocus] = useState('All Sectors');
  const [timeHorizon, setTimeHorizon] = useState('Short-term (1-4 weeks)');
  const [sources, setSources] = useState('Boursa Kuwait, CBK, NBK Research, Kuwait Times');
  const [running, setRunning] = useState(false);
  const [report, setReport] = useState(null);
  const [err, setErr] = useState('');
  const [typingSummary, setTypingSummary] = useState('');

  // Weight rings state
  const [weights, setWeights] = useState({ political: 25, economic: 25, institutional: 25, risk: 25 });

  function updateWeight(key, val) {
    const next = Math.max(0, Math.min(100, val));
    const keys = Object.keys(weights).filter(k => k !== key);
    const othersSum = keys.reduce((a, k) => a + weights[k], 0);
    const remaining = 100 - next;
    const updated = { [key]: next };
    for (const k of keys) {
      updated[k] = othersSum > 0 ? Math.round((weights[k] / othersSum) * remaining) : Math.round(remaining / keys.length);
    }
    setWeights(updated);
  }

  async function run() {
    setErr(''); setRunning(true); setReport(null); setTypingSummary('');
    try {
      const d = await api('/api/analysis/weekly-consensus', {
        method: 'POST',
        body: JSON.stringify({
          marketBias, sectorFocus, timeHorizon,
          kuwaitSources: sources.split(',').map(s => s.trim()).filter(Boolean),
        }),
      });
      setReport(d);
    } catch {
      setErr('Market Data Interrupted — Please retry the simulation.');
    } finally { setRunning(false); }
  }

  // Typing animation
  useEffect(() => {
    if (!report?.report?.executiveConclusion) return;
    const txt = report.report.executiveConclusion;
    let idx = 0;
    const iv = setInterval(() => {
      idx += 2;
      setTypingSummary(txt.slice(0, idx));
      if (idx >= txt.length) clearInterval(iv);
    }, 12);
    return () => clearInterval(iv);
  }, [report]);

  const confidence = report?.report?.investmentView?.confidence;
  const confPct = confidence === 'High' ? 86 : confidence === 'Medium' ? 62 : 35;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Controls */}
      <div className="glass-card">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Target size={18} className="text-emerald-400" />Simulation Engine
            </h2>
            <p className="text-xs text-white/40 mt-0.5">DeepSeek + Gemini dual-AI consensus on stored weekly news</p>
          </div>
          <button onClick={run} disabled={!me || running}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white text-sm font-bold hover:shadow-lg hover:shadow-emerald-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
            {running ? (
              <><div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />Running...</>
            ) : <><Zap size={14} />Run Simulation</>}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: 'Market Bias', value: marketBias, set: setMarketBias, options: MARKET_BIAS, icon: BarChart3 },
            { label: 'Sector Focus', value: sectorFocus, set: setSectorFocus, options: SECTOR_FOCUS, icon: Layers },
            { label: 'Time Horizon', value: timeHorizon, set: setTimeHorizon, options: TIME_HORIZONS, icon: Clock },
          ].map(f => (
            <div key={f.label}>
              <label className="flex items-center gap-1.5 text-[10px] font-bold text-white/30 uppercase tracking-wider mb-1.5">
                <f.icon size={10} />{f.label}
              </label>
              <select value={f.value} onChange={e => f.set(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white/70 outline-none focus:border-cyan-400/40">
                {f.options.map(o => <option key={o} value={o} className="bg-midnight">{o}</option>)}
              </select>
            </div>
          ))}
        </div>

        {!me && (
          <div className="mt-3 flex items-center gap-2 text-xs text-amber-400/70 bg-amber-400/5 rounded-lg px-3 py-2">
            <Lock size={12} />Sign in required for simulation
          </div>
        )}
      </div>

      {/* Weightage Rings */}
      <div className="glass-card">
        <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-4">Agent Weightage Allocation</h3>
        <div className="flex flex-wrap justify-center gap-6">
          {[
            { key: 'political', label: 'Political', color: '#34d399' },
            { key: 'economic', label: 'Economic', color: '#3b82f6' },
            { key: 'institutional', label: 'Institutional', color: '#a78bfa' },
            { key: 'risk', label: 'Risk', color: '#f87171' },
          ].map(w => (
            <WeightRing key={w.key} value={weights[w.key]} onChange={v => updateWeight(w.key, v)}
              label={w.label} color={w.color} />
          ))}
        </div>
      </div>

      {/* Output */}
      {running && (
        <div className="glass-card !p-8 text-center">
          <div className="inline-block mb-4">
            <div className="w-12 h-12 border-2 border-cyan-400/20 border-t-cyan-400 rounded-full animate-spin mx-auto" />
          </div>
          <p className="text-sm text-white/60">Dual-AI processing political, economic, and risk transmission paths...</p>
          <div className="typing-dots mt-3 text-cyan-400"><span /><span /><span /></div>
        </div>
      )}

      {err && (
        <div className="error-card flex items-center gap-3">
          <AlertTriangle size={16} className="text-rose-400" />
          <div>
            <p className="text-sm font-semibold text-rose-300">Market Data Interrupted</p>
            <p className="text-xs text-rose-400/60">{err}</p>
          </div>
        </div>
      )}

      {report && !running && (
        <div className="report-briefing animate-slide-up">
          {/* Report Header */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
            <div>
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1">Strategy Briefing</p>
              <h3 className="text-lg font-bold text-white">Institutional Consensus Report</h3>
              <p className="text-xs text-white/40 mt-1 font-mono">
                {report.filters?.marketBias} · {report.filters?.sectorFocus} · {report.filters?.timeHorizon}
              </p>
            </div>
            <div className="relative">
              <ConfidenceGauge value={confPct} size={80} label="Confidence" />
            </div>
          </div>

          {/* Executive Summary */}
          <div className="mb-6">
            <h4 className="text-[10px] font-bold text-cyan-400/70 uppercase tracking-wider mb-2">Executive Conclusion</h4>
            <p className="text-sm text-white/80 leading-relaxed">{typingSummary}<span className="animate-pulse text-cyan-400">|</span></p>
          </div>

          {/* Two-column insights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-white/[0.02] rounded-xl p-4 border border-white/5">
              <h5 className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Eye size={10} />Consensus View
              </h5>
              <p className="text-xs text-white/60 leading-relaxed">{report.report?.consensusView}</p>
            </div>
            <div className="bg-white/[0.02] rounded-xl p-4 border border-white/5">
              <h5 className="text-[10px] font-bold text-amber-400/70 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <AlertTriangle size={10} />Key Disagreements
              </h5>
              <p className="text-xs text-white/60 leading-relaxed">{report.report?.keyDisagreements}</p>
            </div>
          </div>

          {/* Market Drivers & Risks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <h5 className="text-[10px] font-bold text-emerald-400/70 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <TrendingUp size={10} />Primary Market Drivers
              </h5>
              <ul className="space-y-1.5">
                {(report.report?.primaryMarketDrivers ?? []).map((x, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-white/60">
                    <ChevronRight size={11} className="text-emerald-400 shrink-0 mt-0.5" />{x}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h5 className="text-[10px] font-bold text-rose-400/70 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Shield size={10} />Major Risks
              </h5>
              <ul className="space-y-1.5">
                {(report.report?.majorRisks ?? []).map((x, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-white/60">
                    <AlertTriangle size={11} className="text-rose-400 shrink-0 mt-0.5" />{x}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Opportunity Areas */}
          {report.report?.keyPoints?.length > 0 && (
            <div className="bg-white/[0.02] rounded-xl p-4 border border-white/5 mb-4">
              <h5 className="text-[10px] font-bold text-cyan-400/70 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Star size={10} />Opportunity Areas
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {report.report.keyPoints.slice(0, 8).map((x, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-white/60">
                    <Sparkline data={[]} color="#22d3ee" width={40} height={16} />
                    <span className="flex-1">{x}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="text-[10px] text-white/20 text-center italic mt-4">
            {report.report?.disclaimer || 'Simulation-based analytical output, not financial advice.'}
          </p>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════
// HISTORY PAGE
// ═══════════════════════════════════════
function HistoryPage({ me }) {
  const [simItems, setSimItems] = useState([]);
  const [debateItems, setDebateItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('simulations');

  async function load() {
    if (!me) return;
    setLoading(true);
    try {
      const [sims, debates] = await Promise.all([
        api('/api/analysis/history'),
        api('/api/debate/history'),
      ]);
      setSimItems(sims.items ?? []);
      setDebateItems(debates.items ?? []);
    } catch {}
    setLoading(false);
  }

  useEffect(() => { load(); }, [me]);

  if (!me) return (
    <div className="glass-card text-center py-12 animate-fade-in">
      <Lock size={24} className="text-white/20 mx-auto mb-3" />
      <p className="text-sm text-white/40">Sign in to view your analysis history</p>
    </div>
  );

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <History size={18} className="text-amber-400" />Analysis History
        </h2>
        <button onClick={load} disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white/60 hover:text-white transition-all">
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />Refresh
        </button>
      </div>

      {/* Tab toggle */}
      <div className="flex rounded-xl bg-white/5 p-1">
        {[
          { id: 'simulations', label: 'Simulations', count: simItems.length },
          { id: 'debates', label: 'Debates', count: debateItems.length },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === t.id ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'
            }`}>
            {t.label}
            <span className="text-[10px] font-mono bg-white/5 px-1.5 py-0.5 rounded">{t.count}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <SkeletonCard key={i} />)}</div>
      ) : activeTab === 'simulations' ? (
        <div className="space-y-3">
          {simItems.map(it => (
            <div key={it._id} className="glass-card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono text-white/30">{new Date(it.createdAt).toLocaleString()}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-white/40">{it.itemsAnalyzed} items</span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-[10px] font-bold text-cyan-400">{it.filters?.marketBias}</span>
                <span className="px-2 py-0.5 rounded bg-violet-500/10 text-[10px] font-bold text-violet-400">{it.filters?.sectorFocus}</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-[10px] font-bold text-emerald-400">{it.filters?.timeHorizon}</span>
              </div>
              <p className="text-xs text-white/50 leading-relaxed line-clamp-3">{it.report?.executiveConclusion}</p>
            </div>
          ))}
          {!simItems.length && <p className="text-center text-sm text-white/30 py-8">No simulation history yet</p>}
        </div>
      ) : (
        <div className="space-y-3">
          {debateItems.map(it => (
            <div key={it._id} className="glass-card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono text-white/30">{new Date(it.createdAt).toLocaleString()}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  it.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                }`}>{it.status}</span>
              </div>
              <p className="text-sm font-semibold text-white/70 mb-1">{it.trigger}</p>
              {it.consensusReport?.summary && (
                <p className="text-xs text-white/50 leading-relaxed line-clamp-2">{it.consensusReport.summary}</p>
              )}
              {it.marketImpactRating && (
                <div className="flex items-center gap-2 mt-2">
                  <Gauge size={12} className="text-white/30" />
                  <span className="text-[10px] font-mono text-white/40">Impact: {it.marketImpactRating}/10</span>
                </div>
              )}
            </div>
          ))}
          {!debateItems.length && <p className="text-center text-sm text-white/30 py-8">No debate history yet</p>}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════
// SETTINGS PAGE
// ═══════════════════════════════════════
function SettingsPage({ me }) {
  const [health, setHealth] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [progress, setProgress] = useState(0);

  async function loadHealth() {
    try { setHealth(await api('/api/system/health')); } catch { setHealth(null); }
  }

  useEffect(() => { loadHealth(); }, []);

  async function syncNow() {
    setBusy(true); setProgress(5); setMsg(''); setErr('');
    const iv = setInterval(() => setProgress(p => p >= 92 ? p : p + 8), 220);
    try {
      const d = await api('/api/news/import/newsdata', { method: 'POST', body: JSON.stringify({ q: 'kuwait' }) });
      setMsg(`Sync complete. ${d.sync?.upserted ?? 0} items updated.`);
      setProgress(100); await loadHealth();
    } catch (e) { setErr(String(e?.message ?? e)); setProgress(0); }
    finally { clearInterval(iv); setBusy(false); setTimeout(() => setProgress(0), 900); }
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <h2 className="text-lg font-bold text-white flex items-center gap-2">
        <Settings size={18} className="text-white/40" />System Settings
      </h2>

      {/* Health Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: 'DB Status', value: health?.databaseSyncStatus ?? '—',
            sub: `${health?.weeklyNewsCount ?? 0} weekly articles`, color: 'text-emerald-400' },
          { label: 'AI Latency', value: `DS ${health?.aiLatencyMs?.deepseek ?? '—'}ms`,
            sub: `GM ${health?.aiLatencyMs?.gemini ?? '—'}ms · Syn ${health?.aiLatencyMs?.synthesis ?? '—'}ms`, color: 'text-cyan-400' },
          { label: 'Last Fetch', value: health?.lastNewsFetchAt ? formatAgo(health.lastNewsFetchAt) : '—',
            sub: health?.latestNewsTimestamp ? new Date(health.latestNewsTimestamp).toLocaleDateString() : 'No data', color: 'text-amber-400' },
        ].map(s => (
          <div key={s.label} className="glass-card">
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-wider mb-1">{s.label}</p>
            <p className={`text-lg font-bold font-mono ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-white/30 mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Sync */}
      <div className="glass-card">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-white/60">Data Sync</p>
            <p className="text-[10px] text-white/30 mt-0.5">NewsData weekly feed · Kuwait + GCC</p>
          </div>
          <button onClick={syncNow} disabled={!me || me.role !== 'admin' || busy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white/60 hover:text-white hover:bg-white/10 transition-all disabled:opacity-30">
            <RefreshCw size={12} className={busy ? 'animate-spin' : ''} />{busy ? 'Syncing...' : 'Sync Now'}
          </button>
        </div>
        {progress > 0 && (
          <div className="progress-track mt-3">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        )}
        {msg && <p className="text-xs text-emerald-400/80 mt-2">{msg}</p>}
        {err && <p className="text-xs text-rose-400/80 mt-2">{err}</p>}
        {me?.role !== 'admin' && <p className="text-[10px] text-white/20 mt-2">Admin privileges required for sync</p>}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// ADMIN DASHBOARD (Hidden View)
// ═══════════════════════════════════════
function AdminDashboard({ onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api('/api/admin/dashboard')
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-midnight/95 backdrop-blur-xl overflow-y-auto animate-fade-in">
      <div className="max-w-5xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Shield size={20} className="text-violet-400" />Admin Dashboard
            </h2>
            <p className="text-xs text-white/40 mt-1">System-wide monitoring & user activity</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 transition-colors">
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[1,2,3,4,5].map(i => <SkeletonCard key={i} lines={2} />)}
          </div>
        ) : data ? (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
              {[
                { label: 'Users', value: data.stats?.totalUsers, icon: Users },
                { label: 'News', value: data.stats?.totalNews, icon: Newspaper },
                { label: 'Weekly', value: data.stats?.weeklyNews, icon: Clock },
                { label: 'Simulations', value: data.stats?.totalSimulations, icon: Target },
                { label: 'Debates', value: data.stats?.totalDebates, icon: Brain },
              ].map(s => (
                <div key={s.label} className="glass-card admin-stat">
                  <s.icon size={16} className="text-white/20 mx-auto mb-2" />
                  <div className="stat-value">{s.value ?? 0}</div>
                  <p className="text-[10px] text-white/30 uppercase tracking-wider mt-1">{s.label}</p>
                </div>
              ))}
            </div>

            {/* AI Latency */}
            <div className="glass-card mb-6">
              <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-3">AI Provider Latency</h3>
              <div className="grid grid-cols-3 gap-4">
                {['deepseek', 'gemini', 'synthesis'].map(k => (
                  <div key={k} className="text-center">
                    <p className="text-[10px] text-white/30 uppercase mb-1">{k}</p>
                    <p className="text-lg font-mono font-bold text-cyan-400">{data.aiLatency?.[k] ?? '—'}<span className="text-xs text-white/30">ms</span></p>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Users */}
            <div className="glass-card mb-6">
              <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-3">Recent Users</h3>
              <div className="space-y-2">
                {(data.recentUsers ?? []).map(u => (
                  <div key={u._id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <div className="flex items-center gap-2">
                      <GeoAvatar name={u.name} size={24} />
                      <div>
                        <p className="text-xs font-semibold text-white/70">{u.name}</p>
                        <p className="text-[10px] text-white/30">{u.email}</p>
                      </div>
                    </div>
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                      u.role === 'admin' ? 'bg-violet-500/15 text-violet-400' :
                      u.role === 'publisher' ? 'bg-emerald-500/15 text-emerald-400' :
                      'bg-white/5 text-white/40'
                    }`}>{u.role}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="error-card">
            <p className="text-sm text-rose-300">Unable to load admin data</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// PUBLISHER NEWS FORM
// ═══════════════════════════════════════
function PublisherPanel({ me, onClose }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [sourceName, setSourceName] = useState('');
  const [sourceLink, setSourceLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  async function publish(e) {
    e?.preventDefault();
    setLoading(true); setErr(''); setMsg('');
    try {
      await api('/api/news', {
        method: 'POST',
        body: JSON.stringify({
          headline: title,
          body: content,
          source: sourceName || me?.name || 'Publisher',
          url: sourceLink || '',
          tag: 'VERIFIED',
        }),
      });
      setMsg('Published successfully');
      setTitle(''); setContent(''); setSourceName(''); setSourceLink('');
    } catch (e) { setErr(String(e?.message ?? e)); }
    finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 bg-midnight/95 backdrop-blur-xl overflow-y-auto animate-fade-in">
      <div className="max-w-2xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Newspaper size={20} className="text-emerald-400" />News Ingestion
            </h2>
            <p className="text-xs text-white/40 mt-1">Publish verified market intelligence</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={publish} className="space-y-4">
          <div className="glass-card space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-white/30 uppercase tracking-wider mb-1.5">Title</label>
              <input value={title} onChange={e => setTitle(e.target.value)} required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:border-emerald-400/50 outline-none transition-all"
                placeholder="News headline..." />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-white/30 uppercase tracking-wider mb-1.5">Content</label>
              <textarea value={content} onChange={e => setContent(e.target.value)} rows={5}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:border-emerald-400/50 outline-none transition-all resize-y"
                placeholder="Full article content..." />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-white/30 uppercase tracking-wider mb-1.5">Source Name</label>
                <input value={sourceName} onChange={e => setSourceName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:border-emerald-400/50 outline-none transition-all"
                  placeholder="e.g. Kuwait Times" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-white/30 uppercase tracking-wider mb-1.5">Source Link</label>
                <input value={sourceLink} onChange={e => setSourceLink(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:border-emerald-400/50 outline-none transition-all"
                  placeholder="https://..." />
              </div>
            </div>
          </div>

          {err && (
            <div className="error-card !p-3 flex items-center gap-2 text-xs">
              <AlertTriangle size={14} className="text-rose-400 shrink-0" />
              <span className="text-rose-300">{err}</span>
            </div>
          )}
          {msg && (
            <div className="glass-card !p-3 flex items-center gap-2 text-xs border-emerald-500/20">
              <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
              <span className="text-emerald-300">{msg}</span>
            </div>
          )}

          <button type="submit" disabled={loading || !title}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold text-sm hover:shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed">
            {loading ? 'Publishing...' : 'Publish Article'}
          </button>

          <p className="text-[10px] text-white/20 text-center">
            Published by @{me?.name} · Verified Source badge applied automatically
          </p>
        </form>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════
export default function App() {
  const [tab, setTab] = useState('news');
  const [me, setMe] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showPublisher, setShowPublisher] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    api('/api/auth/me')
      .then(d => setMe(d.user))
      .catch(() => setMe(null))
      .finally(() => setAuthChecked(true));
  }, []);

  async function logout() {
    await api('/api/auth/logout', { method: 'POST' });
    setMe(null);
    setTab('news');
  }

  function handleAuth(user) {
    setMe(user);
    setShowAuth(false);
  }

  const page = useMemo(() => {
    switch (tab) {
      case 'news': return <NewsPage me={me} />;
      case 'debate': return <DebatePage me={me} />;
      case 'simulation': return <SimulationPage me={me} />;
      case 'history': return <HistoryPage me={me} />;
      case 'settings': return <SettingsPage me={me} />;
      default: return <NewsPage me={me} />;
    }
  }, [tab, me]);

  // Loading state with fade
  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center animate-pulse">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center mx-auto mb-4">
            <Activity size={28} className="text-white" />
          </div>
          <p className="text-sm text-white/40 font-medium">Initializing Vantage...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <FloatingNav
        me={me} tab={tab} setTab={setTab}
        onLogout={logout}
        setShowAuth={setShowAuth}
        setShowAdmin={setShowAdmin}
        setShowPublisher={setShowPublisher}
      />

      {/* Main content with top padding for fixed nav */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-28 pb-12">
        {page}
      </main>

      {/* Auth overlay */}
      {showAuth && <AuthPage onAuth={handleAuth} onClose={() => setShowAuth(false)} />}

      {/* Admin overlay */}
      {showAdmin && me?.role === 'admin' && <AdminDashboard onClose={() => setShowAdmin(false)} />}

      {/* Publisher overlay */}
      {showPublisher && (me?.role === 'publisher' || me?.role === 'admin') && (
        <PublisherPanel me={me} onClose={() => setShowPublisher(false)} />
      )}
    </div>
  );
}
