import React, { useState, useEffect } from 'react';
import {
  Shield, X, Users, Newspaper, Clock, Target, Brain, RefreshCw, Activity, BarChart3, Trash2, Edit2, Check
} from 'lucide-react';
import { GeoAvatar, SkeletonCard } from '../components/SharedComponents.jsx';

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

function formatAgo(iso) {
  if (!iso) return '—';
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.max(1, Math.floor(ms / 60000));
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function AdminDashboard({ me, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [health, setHealth] = useState(null);
  const [syncBusy, setSyncBusy] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');
  const [syncProgress, setSyncProgress] = useState(0);
  const [errMsg, setErrMsg] = useState('');
  const [editingUserId, setEditingUserId] = useState(null);
  const [editRole, setEditRole] = useState('user');

  async function deleteUser(id) {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await api(`/api/admin/users/${id}`, { method: 'DELETE' });
      setData(prev => ({ ...prev, recentUsers: prev.recentUsers.filter(u => u._id !== id) }));
    } catch(e) {
      alert(e.message);
    }
  }

  async function saveRole(id) {
    try {
      const res = await api(`/api/admin/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ role: editRole })
      });
      setData(prev => ({
        ...prev,
        recentUsers: prev.recentUsers.map(u => u._id === id ? res.user : u)
      }));
      setEditingUserId(null);
    } catch(e) {
      alert(e.message);
    }
  }

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [d, h] = await Promise.all([
          api('/api/admin/dashboard').catch(err => { console.error('Admin API err:', err.message); return null; }),
          api('/api/system/health').catch(err => { console.error('Health API err:', err.message); return null; }),
        ]);
        if (!cancelled) {
          if (!d && !h) setErrMsg('Unable to load admin data. Check server connection.');
          setData(d);
          setHealth(h);
          setLoading(false);
        }
      } catch {
        if (!cancelled) { setLoading(false); setErrMsg('Failed to load dashboard.'); }
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  async function syncNow() {
    setSyncBusy(true); setSyncProgress(5); setSyncMsg('');
    const iv = setInterval(() => setSyncProgress(p => p >= 92 ? p : p + 8), 220);
    try {
      const d = await api('/api/news/import/newsdata', { method: 'POST', body: JSON.stringify({ q: 'kuwait' }) });
      setSyncMsg(`✓ Sync complete — ${d.sync?.upserted ?? 0} articles updated.`);
      setSyncProgress(100);
    } catch (e) { setSyncMsg(`Error: ${e.message}`); setSyncProgress(0); }
    finally { clearInterval(iv); setSyncBusy(false); setTimeout(() => setSyncProgress(0), 900); }
  }

  const [analyzeBusy, setAnalyzeBusy] = useState(false);
  const [analyzeMsg, setAnalyzeMsg] = useState('');

  async function analyzeAll() {
    setAnalyzeBusy(true); setAnalyzeMsg('Running AI analysis on unanalyzed articles...');
    try {
      const d = await api('/api/news/analyze-all', { method: 'POST', body: JSON.stringify({ batchSize: 30 }) });
      setAnalyzeMsg(`✓ ${d.analyzed ?? 0} articles analyzed by AI.`);
    } catch (e) { setAnalyzeMsg(`Error: ${e.message}`); }
    finally { setAnalyzeBusy(false); }
  }

  const latencyData = data?.aiLatency || health?.aiLatencyMs || {};
  const latencyItems = [
    { key: 'Analysis', value: latencyData.deepseek },
    { key: 'Agents', value: latencyData.gemini },
    { key: 'Synthesis', value: latencyData.synthesis },
  ];

  const analyzedCount = data?.stats?.analyzedNews ?? health?.analyzedCount ?? 0;
  const totalNewsCount = data?.stats?.totalNews ?? 0;
  const unanalyzedCount = Math.max(0, totalNewsCount - analyzedCount);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div className="max-w-5xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Shield size={20} className="text-violet-500" />Admin Dashboard
            </h2>
            <p className="text-xs text-slate-400 mt-1">System monitoring, data sync & user management</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-500 transition-colors shadow-sm">
            <X size={18} />
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-6">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[1,2,3,4,5].map(i => <SkeletonCard key={i} lines={2} />)}
            </div>
          ) : errMsg && !data ? (
            <div className="error-card">
              <p className="text-sm text-rose-600">{errMsg}</p>
            </div>
          ) : data ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                {[
                  { label: 'Users', value: data.stats?.totalUsers, icon: Users },
                  { label: 'News', value: data.stats?.totalNews, icon: Newspaper },
                  { label: 'Weekly', value: data.stats?.weeklyNews, icon: Clock },
                  { label: 'Simulations', value: data.stats?.totalSimulations, icon: Target },
                  { label: 'Debates', value: data.stats?.totalDebates, icon: Brain },
                ].map(s => (
                  <div key={s.label} className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-center">
                    <s.icon size={16} className="text-slate-300 mx-auto mb-2" />
                    <div className="stat-value text-2xl font-mono font-black">{s.value ?? 0}</div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-1">{s.label}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Activity size={12} />AI Provider Latency
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    {latencyItems.map(k => (
                      <div key={k.key} className="text-center">
                        <p className="text-[10px] text-slate-400 uppercase mb-1">{k.key}</p>
                        <p className="text-lg font-mono font-bold text-cyan-600">
                          {k.value != null ? k.value : '—'}
                          <span className="text-xs text-slate-400">ms</span>
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <RefreshCw size={12} />Data Sync
                    </h3>
                    <button onClick={syncNow} disabled={syncBusy}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all disabled:opacity-30">
                      <RefreshCw size={12} className={syncBusy ? 'animate-spin' : ''} />{syncBusy ? 'Syncing...' : 'Sync Now'}
                    </button>
                  </div>
                  {syncProgress > 0 && (
                    <div className="progress-track mb-2">
                      <div className="progress-fill" style={{ width: `${syncProgress}%` }} />
                    </div>
                  )}
                  {syncMsg && <p className="text-xs text-emerald-600 mb-2">{syncMsg}</p>}
                  <div className="mt-2 grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] text-slate-400">Latest Article</p>
                      <p className="text-xs font-mono text-slate-600">{formatAgo(health?.latestNewsTimestamp)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400">Weekly Articles</p>
                      <p className="text-xs font-mono text-slate-600">{health?.weeklyNewsCount ?? data.stats?.weeklyNews ?? 0}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 mb-6">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Brain size={12} />AI News Analysis
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      AI analyzes each article for sentiment, market impact, and sectors
                    </p>
                  </div>
                  <button onClick={analyzeAll} disabled={analyzeBusy}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-50 border border-cyan-200 text-xs text-cyan-600 hover:bg-cyan-100 transition-all disabled:opacity-30">
                    <Brain size={12} className={analyzeBusy ? 'animate-spin' : ''} />{analyzeBusy ? 'Analyzing...' : 'Analyze All'}
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-3 mb-2">
                  <div className="bg-white rounded-lg p-3 text-center border border-slate-100">
                    <p className="text-[10px] text-slate-400 uppercase">Total</p>
                    <p className="text-lg font-mono font-bold text-slate-700">{totalNewsCount}</p>
                  </div>
                  <div className="bg-emerald-50 rounded-lg p-3 text-center border border-emerald-200">
                    <p className="text-[10px] text-emerald-500 uppercase">Analyzed</p>
                    <p className="text-lg font-mono font-bold text-emerald-600">{analyzedCount}</p>
                  </div>
                  <div className="bg-amber-50 rounded-lg p-3 text-center border border-amber-200">
                    <p className="text-[10px] text-amber-500 uppercase">Pending</p>
                    <p className="text-lg font-mono font-bold text-amber-600">{unanalyzedCount}</p>
                  </div>
                </div>
                {analyzeMsg && <p className="text-xs text-emerald-600">{analyzeMsg}</p>}
              </div>

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 mb-6">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Users size={12} />Recent Users
                </h3>
                <div className="space-y-2">
                  {(data.recentUsers ?? []).map(u => (
                    <div key={u._id} className="group flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                      <div className="flex items-center gap-2">
                        <GeoAvatar name={u.name} size={24} />
                        <div>
                          <p className="text-xs font-semibold text-slate-700">{u.name}</p>
                          <p className="text-[10px] text-slate-400">{u.email}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        {editingUserId === u._id ? (
                          <div className="flex items-center gap-2">
                            <select
                              value={editRole}
                              onChange={e => setEditRole(e.target.value)}
                              className="text-xs border border-slate-200 rounded px-1.5 py-0.5 bg-white text-slate-700 focus:outline-none focus:border-violet-300"
                            >
                              <option value="user">User</option>
                              <option value="publisher">Publisher</option>
                              <option value="admin">Admin</option>
                            </select>
                            <button onClick={() => saveRole(u._id)} className="p-1 rounded bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors">
                              <Check size={12} />
                            </button>
                            <button onClick={() => setEditingUserId(null)} className="p-1 rounded bg-slate-50 text-slate-500 hover:bg-slate-100 transition-colors">
                              <X size={12} />
                            </button>
                          </div>
                        ) : (
                          <>
                            <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                              u.role === 'admin' ? 'bg-violet-50 text-violet-600' :
                              u.role === 'publisher' ? 'bg-emerald-50 text-emerald-600' :
                              'bg-slate-100 text-slate-500'
                            }`}>{u.role}</span>
                            
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => { setEditingUserId(u._id); setEditRole(u.role); }} className="p-1.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors">
                                <Edit2 size={12} />
                              </button>
                              {me?.id !== u._id && (
                                <button onClick={() => deleteUser(u._id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                                  <Trash2 size={12} />
                                </button>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="error-card">
              <p className="text-sm text-rose-600">Unable to load admin data</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
