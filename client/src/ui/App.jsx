import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
<<<<<<< HEAD
import { Activity, Lock, KeyRound } from 'lucide-react';
=======
import { Activity } from 'lucide-react';
>>>>>>> 3a8b1e6686ec63545d132c1c18b267cfa58c091a

import { MarketSentimentProvider } from './contexts/MarketSentimentContext.jsx';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext.jsx';
import FloatingNav from './components/FloatingNav.jsx';
import AuthPage from './components/AuthPage.jsx';
import PublisherPanel from './components/PublisherPanel.jsx';
import NewsPage from './pages/NewsPage.jsx';
import AgentArenaPage from './pages/AgentArenaPage.jsx';
import HistoryPage from './pages/HistoryPage.jsx';
import StockDashboard from './pages/StockDashboard.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import LeaderboardPage from './pages/LeaderboardPage.jsx';
import PortfolioPage from './pages/PortfolioPage.jsx';

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

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -8 },
};

const pageTransition = {
  type: 'tween',
  ease: 'easeOut',
  duration: 0.3,
};

const PARTICLE_SEED = Array.from({ length: 20 }, (_, i) => ({
  size: 1 + (((i * 7 + 3) % 5) / 5) * 2,
  x: ((i * 17 + 11) % 100),
  y: ((i * 23 + 7) % 100),
  drift: 80 + ((i * 13 + 5) % 120),
  xDrift: ((i * 11 + 3) % 60) - 30,
  maxOpacity: 0.15 + ((i * 7 + 2) % 4) / 20,
  duration: 6 + ((i * 9 + 1) % 8),
  delay: ((i * 5 + 2) % 10),
}));

export default function App() {
<<<<<<< HEAD
  const [isUnlocked, setIsUnlocked] = useState(localStorage.getItem('site_unlocked') === 'true');
=======
>>>>>>> 3a8b1e6686ec63545d132c1c18b267cfa58c091a
  const [tab, setTab] = useState('stocks');
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

  async function handleLogout() {
    await api('/api/auth/logout', { method: 'POST' });
    setMe(null);
    setTab('stocks');
  }

  function handleAuth(user) {
    setMe(user);
    setShowAuth(false);
  }

  const page = useMemo(() => {
    switch (tab) {
      case 'stocks': return <StockDashboard me={me} />;
      case 'news': return <NewsPage me={me} />;
      case 'simulation': return <AgentArenaPage me={me} />;
      case 'history': return <HistoryPage me={me} />;
      case 'leaderboard': return <LeaderboardPage me={me} onLogout={handleLogout} />;
      case 'portfolio': return <PortfolioPage me={me} onLogout={handleLogout} />;
      default: return <StockDashboard me={me} />;
    }
  }, [tab, me]);

<<<<<<< HEAD
  if (!isUnlocked) {
    return <GlobalLock onUnlock={() => setIsUnlocked(true)} />;
  }

=======
>>>>>>> 3a8b1e6686ec63545d132c1c18b267cfa58c091a
  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center overflow-hidden bg-slate-50">
        <div className="fixed inset-0 pointer-events-none">
          <motion.div
            className="absolute w-64 h-64 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.08), transparent 70%)', top: '20%', left: '30%' }}
            animate={{ x: [0, 40, -20, 0], y: [0, -30, 20, 0], scale: [1, 1.2, 0.9, 1] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute w-80 h-80 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.06), transparent 70%)', bottom: '20%', right: '25%' }}
            animate={{ x: [0, -30, 20, 0], y: [0, 20, -30, 0], scale: [1, 0.9, 1.15, 1] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        <div className="text-center relative z-10">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-cyan-500/20"
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
            />
            <motion.div
              className="absolute inset-2 rounded-full border-2 border-violet-500/20"
              animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeOut', delay: 0.3 }}
            />
            <motion.div
              className="absolute inset-4 rounded-full border-2 border-emerald-500/20"
              animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeOut', delay: 0.6 }}
            />
            <motion.div
              className="absolute inset-6 rounded-full bg-gradient-to-br from-cyan-400 via-violet-500 to-emerald-400 flex items-center justify-center"
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            >
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                <Activity size={16} className="text-cyan-500" />
              </div>
            </motion.div>
          </div>
          
          <motion.p
            className="text-sm text-slate-500 font-medium tracking-wider"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            Initializing Vantage...
          </motion.p>
          <div className="mt-3 flex justify-center gap-1">
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-cyan-500"
                animate={{ y: [0, -6, 0], opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <LanguageProvider>
      <AppInner
        me={me} tab={tab} setTab={setTab}
        handleLogout={handleLogout}
        showAuth={showAuth} setShowAuth={setShowAuth}
        showAdmin={showAdmin} setShowAdmin={setShowAdmin}
        showPublisher={showPublisher} setShowPublisher={setShowPublisher}
        page={page}
        handleAuth={handleAuth}
      />
    </LanguageProvider>
  );
}

function AppInner({ me, tab, setTab, handleLogout, showAuth, setShowAuth, showAdmin, setShowAdmin, showPublisher, setShowPublisher, page, handleAuth }) {
  const { isRTL } = useLanguage();

  React.useEffect(() => {
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = isRTL ? 'ar' : 'en';
  }, [isRTL]);

  return (
    <MarketSentimentProvider>
      <div className="min-h-screen relative">
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          {PARTICLE_SEED.map((p, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-slate-400"
              style={{
                width: p.size,
                height: p.size,
                left: `${p.x}%`,
                top: `${p.y}%`,
                opacity: 0,
              }}
              animate={{
                y: [0, -p.drift, -200],
                x: [0, p.xDrift],
                opacity: [0, p.maxOpacity, 0],
              }}
              transition={{
                duration: p.duration,
                repeat: Infinity,
                delay: p.delay,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
        <FloatingNav
          me={me} tab={tab} setTab={setTab}
          onLogout={handleLogout}
          setShowAuth={setShowAuth}
          setShowAdmin={setShowAdmin}
          setShowPublisher={setShowPublisher}
        />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-28 pb-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial="initial"
              animate="in"
              exit="out"
              variants={pageVariants}
              transition={pageTransition}
            >
              {page}
            </motion.div>
          </AnimatePresence>
        </main>

        {showAuth && <AuthPage onAuth={handleAuth} onClose={() => setShowAuth(false)} />}
        {showAdmin && me?.role === 'admin' && <AdminDashboard me={me} onClose={() => setShowAdmin(false)} />}
        {showPublisher && (me?.role === 'publisher' || me?.role === 'admin') && (
          <PublisherPanel me={me} onClose={() => setShowPublisher(false)} />
        )}
      </div>
    </MarketSentimentProvider>
  );
}
<<<<<<< HEAD

function GlobalLock({ onUnlock }) {
  const [pwd, setPwd] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (pwd === 'Habusha2006') {
      localStorage.setItem('site_unlocked', 'true');
      onUnlock();
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute w-[500px] h-[500px] rounded-full bg-cyan-500/10 blur-[100px] top-[-100px] left-[-100px]" />
        <div className="absolute w-[400px] h-[400px] rounded-full bg-violet-500/10 blur-[80px] bottom-[-50px] right-[-50px]" />
      </div>
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }} 
        className="relative z-10 w-full max-w-sm p-8"
      >
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 p-8 rounded-3xl shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-cyan-500/20">
            <Lock className="text-white" size={32} />
          </div>
          
          <h2 className="text-2xl font-bold text-center text-white mb-2">Restricted Access</h2>
          <p className="text-center text-slate-400 text-sm mb-8">Please enter the security password to proceed.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                type="password"
                value={pwd}
                onChange={(e) => setPwd(e.target.value)}
                placeholder="Password"
                className={`w-full bg-slate-900/50 border ${error ? 'border-rose-500' : 'border-slate-700'} rounded-xl py-3 pl-12 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all`}
                autoFocus
              />
            </div>
            
            {error && (
              <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-rose-500 text-xs text-center font-medium">
                Incorrect password
              </motion.p>
            )}

            <button
              type="submit"
              className="w-full bg-white text-slate-900 font-bold rounded-xl py-3 hover:bg-slate-100 transition-colors shadow-lg"
            >
              Unlock
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
=======
>>>>>>> 3a8b1e6686ec63545d132c1c18b267cfa58c091a
