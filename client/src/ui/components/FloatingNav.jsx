import React, { useState, useEffect, useRef } from 'react';
import {
  Newspaper, Brain, Target, History, Shield, Plus,
  ChevronDown, LogOut, Menu, Settings, User, Lock, Edit3,
  Check, X, AlertTriangle, BarChart2
} from 'lucide-react';
import { GeoAvatar } from './SharedComponents.jsx';
import TickerTape from './TickerTape.jsx';
import logoSvg from '../public/logo.svg';
import vantageTextUrl from '../public/darkBlue.png';

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

const TABS = [
  { id: 'stocks', label: 'Stocks', icon: BarChart2 },
  { id: 'news', label: 'News Feed', icon: Newspaper },
  { id: 'simulation', label: 'AI Agents', icon: Brain },
  { id: 'history', label: 'History', icon: History },
];

export default function FloatingNav({ me, tab, setTab, onLogout, setShowAuth, setShowAdmin, setShowPublisher }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPwd, setEditPwd] = useState('');
  const [editCurrPwd, setEditCurrPwd] = useState('');
  const [editMsg, setEditMsg] = useState('');
  const [editErr, setEditErr] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setMenuOpen(false);
        setShowProfile(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function saveProfile() {
    setEditLoading(true); setEditErr(''); setEditMsg('');
    try {
      const body = {};
      if (editName.trim() && editName.trim() !== me?.name) body.name = editName.trim();
      if (editPwd) {
        body.currentPassword = editCurrPwd;
        body.newPassword = editPwd;
      }
      if (Object.keys(body).length === 0) { setEditMsg('No changes'); setEditLoading(false); return; }
      await api('/api/auth/me', { method: 'PUT', body: JSON.stringify(body) });
      setEditMsg('Updated successfully');
      setEditPwd(''); setEditCurrPwd('');
    } catch (e) { setEditErr(String(e?.message ?? e)); }
    finally { setEditLoading(false); }
  }

  return (
    <header className="floating-nav">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setTab('stocks')}>
            <div className="flex flex-col justify-center">
              <span className="text-xl font-black tracking-tighter text-slate-900 leading-none">VANTAGE</span>
              <span className="text-[9px] text-slate-400 font-bold tracking-widest uppercase mt-0.5">AI Terminal</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {TABS.map(t => {
              const Icon = t.icon;
              return (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200
                    ${tab === t.id
                      ? 'bg-slate-900 text-white shadow-md'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                    }`}>
                  <Icon size={13} />{t.label}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            {me?.role === 'admin' && (
              <button onClick={() => setShowAdmin(true)}
                className="p-1.5 rounded-lg bg-violet-50 text-violet-600 hover:bg-violet-100 transition-colors"
                title="Admin Dashboard">
                <Shield size={14} />
              </button>
            )}
            {(me?.role === 'publisher' || me?.role === 'admin') && (
              <button onClick={() => setShowPublisher(true)}
                className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                title="Publish News">
                <Plus size={14} />
              </button>
            )}

            <div className="relative" ref={dropdownRef}>
              <button onClick={() => me ? setMenuOpen(p => !p) : setShowAuth(true)}
                className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 hover:bg-slate-200 transition-all">
                <GeoAvatar name={me?.name || '?'} status={me ? 'live' : 'offline'} size={28} />
                <span className="text-xs font-medium text-slate-700 hidden sm:block">
                  {me ? me.name : 'Sign In'}
                </span>
                {me && <ChevronDown size={12} className="text-slate-400" />}
              </button>

              {menuOpen && me && (
                <div className="absolute right-0 top-full mt-2 w-64 rounded-xl bg-white border border-slate-200 shadow-xl z-50 overflow-hidden animate-fade-in">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-xs font-semibold text-slate-800">{me.name}</p>
                    <p className="text-[10px] text-slate-400">{me.email}</p>
                    <span className="inline-block mt-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-cyan-50 text-cyan-600">
                      {me.role}
                    </span>
                  </div>

                  {showProfile ? (
                    <div className="px-4 py-3 space-y-2 border-b border-slate-100">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Edit Profile</span>
                        <button onClick={() => setShowProfile(false)} className="text-slate-400 hover:text-slate-600">
                          <X size={12} />
                        </button>
                      </div>
                      <input value={editName} onChange={e => setEditName(e.target.value)}
                        placeholder="New name"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 placeholder-slate-300 outline-none focus:border-cyan-500" />
                      <input type="password" value={editCurrPwd} onChange={e => setEditCurrPwd(e.target.value)}
                        placeholder="Current password"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 placeholder-slate-300 outline-none focus:border-cyan-500" />
                      <input type="password" value={editPwd} onChange={e => setEditPwd(e.target.value)}
                        placeholder="New password (optional)"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 placeholder-slate-300 outline-none focus:border-cyan-500" />
                      {editErr && <p className="text-[10px] text-rose-500">{editErr}</p>}
                      {editMsg && <p className="text-[10px] text-emerald-500">{editMsg}</p>}
                      <button onClick={saveProfile} disabled={editLoading}
                        className="w-full py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-violet-500 text-white text-[11px] font-bold disabled:opacity-40">
                        {editLoading ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => { setEditName(me.name); setShowProfile(true); setEditMsg(''); setEditErr(''); }}
                      className="w-full text-left px-4 py-2 text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors flex items-center gap-2 border-b border-slate-100">
                      <Edit3 size={12} />Change Info
                    </button>
                  )}

                  {me.role === 'admin' && !showProfile && (
                    <button onClick={() => { setShowAdmin(true); setMenuOpen(false); }}
                      className="w-full text-left px-4 py-2 text-xs text-violet-600 hover:text-violet-700 hover:bg-violet-50 transition-colors flex items-center gap-2 border-b border-slate-100">
                      <Shield size={12} />Admin Dashboard
                    </button>
                  )}

                  {TABS.map(t => (
                    <button key={t.id} onClick={() => { setTab(t.id); setMenuOpen(false); }}
                      className="w-full text-left px-4 py-2 text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors flex items-center gap-2">
                      <t.icon size={12} />{t.label}
                    </button>
                  ))}

                  <button onClick={() => { onLogout(); setMenuOpen(false); }}
                    className="w-full text-left px-4 py-2 text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-2 border-t border-slate-100">
                    <LogOut size={12} />Sign Out
                  </button>
                </div>
              )}
            </div>

            <button className="md:hidden p-1.5 text-slate-500" onClick={() => setMenuOpen(p => !p)}>
              <Menu size={18} />
            </button>
          </div>
        </div>

        <TickerTape />
      </div>
    </header>
  );
}
