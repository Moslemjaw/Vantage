import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Lock, Shield, Globe, ArrowLeft } from 'lucide-react';
import logoSvg from '../public/logo.svg';

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

export default function AuthPage({ onAuth, onClose }) {
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
    <div className="fixed inset-0 z-[200] min-h-screen flex items-center justify-center overflow-hidden bg-slate-50">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute w-[500px] h-[500px] rounded-full" style={{
          background: 'radial-gradient(circle, rgba(34,211,238,0.06), transparent 70%)',
          top: '10%', left: '20%',
        }} />
        <div className="absolute w-[600px] h-[600px] rounded-full" style={{
          background: 'radial-gradient(circle, rgba(139,92,246,0.04), transparent 70%)',
          bottom: '10%', right: '15%',
        }} />
      </div>

      {onClose && (
        <button onClick={onClose}
          className="fixed top-6 left-6 z-10 flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-all shadow-sm">
          <ArrowLeft size={14} />Back to Dashboard
        </button>
      )}

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        <div className="rounded-2xl bg-white border border-slate-200 shadow-xl overflow-hidden">
          <div className="p-8 pb-5 text-center">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="flex justify-center mb-5"
            >
              <div className="flex flex-col justify-center items-center">
                <span className="text-4xl font-black tracking-tighter text-slate-900 leading-none">VANTAGE</span>
              </div>
            </motion.div>
            <h2 className="text-2xl font-bold text-slate-900">Welcome to Vantage</h2>
            <p className="text-sm text-slate-400 mt-2">AI-Powered Financial Intelligence Terminal</p>
          </div>

          <div className="mx-6 flex rounded-xl bg-slate-100 p-1">
            {['login', 'register'].map(m => (
              <button key={m} onClick={() => setMode(m)}
                className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                  mode === m ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                }`}>{m === 'login' ? 'Sign In' : 'Create Account'}</button>
            ))}
          </div>

          <form onSubmit={submit} className="p-6 space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-300 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-200 outline-none transition-all"
                placeholder="you@company.com" required />
            </div>
            {mode === 'register' && (
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-300 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-200 outline-none transition-all"
                  placeholder="Full name" required />
              </div>
            )}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-300 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-200 outline-none transition-all"
                placeholder="Min 8 characters" required />
            </div>

            {err && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs">
                <AlertTriangle size={14} className="text-rose-500 shrink-0" />
                <span className="text-rose-600">{err}</span>
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 text-white font-bold text-sm hover:shadow-lg hover:shadow-cyan-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]">
              {loading ? 'Processing...' : mode === 'register' ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          <div className="px-6 pb-5 flex items-center justify-center gap-4 text-[10px] text-slate-300">
            <span className="flex items-center gap-1"><Lock size={9} />Encrypted</span>
            <span>•</span>
            <span className="flex items-center gap-1"><Shield size={9} />Secure Gateway</span>
            <span>•</span>
            <span className="flex items-center gap-1"><Globe size={9} />Kuwait/GCC</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
