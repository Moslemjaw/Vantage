import React, { useState, useEffect, useRef } from 'react';
import {
  Newspaper, Brain, Target, History, Shield, Plus,
  ChevronDown, LogOut, Menu, Settings, User, Lock, Edit3,
  Check, X, AlertTriangle, BarChart2, Briefcase, BookmarkCheck
} from 'lucide-react';
import { GeoAvatar } from './SharedComponents.jsx';
import { useLanguage } from '../contexts/LanguageContext.jsx';
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
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPwd, setEditPwd] = useState('');
  const [editCurrPwd, setEditCurrPwd] = useState('');
  const [editMsg, setEditMsg] = useState('');
  const [editErr, setEditErr] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const dropdownRef = useRef(null);
  const { lang, toggleLanguage, t } = useLanguage();

  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setProfileOpen(false);
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
            <button
              onClick={toggleLanguage}
              className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors text-[11px] font-bold tracking-wide"
              title="Toggle Language"
            >
              {lang === 'en' ? 'عربي' : 'EN'}
            </button>
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
              <button onClick={() => me ? setProfileOpen(p => !p) : setShowAuth(true)}
                className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 hover:bg-slate-200 transition-all hidden sm:flex">
                <GeoAvatar name={me?.name || '?'} status={me ? 'live' : 'offline'} size={28} />
                <span className="text-xs font-medium text-slate-700 hidden sm:block">
                  {me ? me.name : 'Sign In'}
                </span>
                {me && <ChevronDown size={12} className="text-slate-400" />}
              </button>

              {profileOpen && me && (
                <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl bg-white/95 backdrop-blur-xl border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.08)] z-50 overflow-hidden animate-fade-in origin-top-right">
                  <div className="p-4 bg-gradient-to-br from-slate-50/80 to-slate-100/50 border-b border-slate-100/80">
                    <div className="flex items-center gap-3">
                      <GeoAvatar name={me.name} status="live" size={36} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-slate-800 leading-tight truncate">{me.name}</p>
                        <p className="text-[11px] text-slate-400 font-medium truncate">{me.email}</p>
                      </div>
                    </div>
                    {me.role && (
                      <div className="mt-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-violet-100/80 border border-violet-200/50 text-[9px] font-black text-violet-600 uppercase tracking-widest shadow-sm">
                          {me.role}
                        </span>
                      </div>
                    )}
                  </div>

                  {showProfile ? (
                    <div className="p-3 space-y-2.5">
                      <div className="flex items-center justify-between mb-2 px-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Edit Profile</span>
                        <button onClick={() => setShowProfile(false)} className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                          <X size={14} />
                        </button>
                      </div>
                      <input value={editName} onChange={e => setEditName(e.target.value)}
                        placeholder="New name"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-cyan-500 focus:bg-white transition-all shadow-sm" />
                      <input type="password" value={editCurrPwd} onChange={e => setEditCurrPwd(e.target.value)}
                        placeholder="Current password"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-cyan-500 focus:bg-white transition-all shadow-sm" />
                      <input type="password" value={editPwd} onChange={e => setEditPwd(e.target.value)}
                        placeholder="New password (optional)"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-cyan-500 focus:bg-white transition-all shadow-sm" />
                      {editErr && <p className="text-[10px] text-rose-500 font-medium px-1">{editErr}</p>}
                      {editMsg && <p className="text-[10px] text-emerald-500 font-medium px-1">{editMsg}</p>}
                      <button onClick={saveProfile} disabled={editLoading}
                        className="w-full py-2 mt-1 rounded-lg bg-gradient-to-r from-cyan-500 to-violet-500 text-white text-[11px] font-bold shadow-md shadow-cyan-500/20 disabled:opacity-40 hover:opacity-90 transition-opacity">
                        {editLoading ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  ) : (
                    <div className="p-1.5 flex flex-col gap-0.5">
                      <div className="px-2 py-1.5 mt-1">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Account</span>
                      </div>
                      
                      <button onClick={() => { setEditName(me.name); setShowProfile(true); setEditMsg(''); setEditErr(''); }}
                        className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all flex items-center gap-2.5">
                        <Edit3 size={14} className="text-slate-400" />Profile Settings
                      </button>

                      {me.role === 'admin' && (
                        <button onClick={() => { setShowAdmin(true); setProfileOpen(false); }}
                          className="w-full text-left px-3 py-2 text-xs font-semibold text-violet-600 hover:text-violet-700 hover:bg-violet-50 rounded-lg transition-all flex items-center gap-2.5">
                          <Shield size={14} className="text-violet-400" />Admin Dashboard
                        </button>
                      )}

                      <div className="h-px bg-slate-100 my-1 mx-2" />

                      <div className="px-2 py-1.5 mt-1">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Navigation</span>
                      </div>

                      <button onClick={() => { setTab('saved-articles'); setProfileOpen(false); }}
                        className={`w-full text-left px-3 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2.5 ${
                          tab === 'saved-articles' ? 'text-cyan-600 bg-cyan-50 shadow-sm border border-cyan-100/50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}>
                        <BookmarkCheck size={14} className={tab === 'saved-articles' ? 'text-cyan-500' : 'text-slate-400'} />Saved Articles
                      </button>

                      {TABS.map(t => (
                        <button key={t.id} onClick={() => { setTab(t.id); setProfileOpen(false); }}
                          className={`w-full text-left px-3 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2.5 ${
                            tab === t.id ? 'text-slate-800 bg-slate-100 shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                          }`}>
                          <t.icon size={14} className={tab === t.id ? 'text-slate-600' : 'text-slate-400'} />{t.label}
                        </button>
                      ))}

                      <div className="h-px bg-slate-100 my-1 mx-2" />

                      <button onClick={() => { onLogout(); setProfileOpen(false); }}
                        className="w-full text-left px-3 py-2 text-xs font-semibold text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all flex items-center gap-2.5 mt-0.5 mb-0.5">
                        <LogOut size={14} className="text-rose-400" />Sign Out
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <button className="md:hidden p-1.5 text-slate-500 hover:bg-slate-100 rounded" onClick={() => setMobileMenuOpen(p => !p)}>
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute left-0 right-0 top-14 bg-white border-b border-slate-200 shadow-xl z-50 animate-fade-in pb-4">
            <div className="px-4 py-2 flex flex-col gap-1">
              {!me ? (
                <button 
                  onClick={() => { setShowAuth(true); setMobileMenuOpen(false); }}
                  className="w-full text-center py-2.5 mb-2 rounded-lg bg-gradient-to-r from-cyan-500 to-violet-500 text-white text-sm font-bold shadow-md"
                >
                  Sign In
                </button>
              ) : (
                <div className="flex items-center gap-3 px-2 py-3 mb-2 border-b border-slate-100">
                  <GeoAvatar name={me.name} status="live" size={36} />
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{me.name}</p>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-600 bg-cyan-50 px-1.5 py-0.5 rounded">
                      {me.role}
                    </span>
                  </div>
                </div>
              )}

              {TABS.map(t => (
                <button key={t.id} onClick={() => { setTab(t.id); setMobileMenuOpen(false); }}
                  className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors flex items-center gap-3 rounded-lg
                    ${tab === t.id ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
                  <t.icon size={16} />{t.label}
                </button>
              ))}

              {me && (
                <>
                  <div className="h-px w-full bg-slate-100 my-2"></div>
                  <button onClick={() => { setTab('saved-articles'); setMobileMenuOpen(false); }}
                    className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors flex items-center gap-3 rounded-lg ${
                      tab === 'saved-articles' ? 'text-cyan-600 bg-cyan-50' : 'text-slate-600 hover:bg-slate-50'
                    }`}>
                    <BookmarkCheck size={16} />Saved Articles
                  </button>
                  {me.role === 'admin' && (
                    <button onClick={() => { setShowAdmin(true); setMobileMenuOpen(false); }}
                      className="w-full text-left px-4 py-3 text-sm font-medium text-violet-600 hover:bg-violet-50 transition-colors flex items-center gap-3 rounded-lg">
                      <Shield size={16} />Admin Dashboard
                    </button>
                  )}
                  <button onClick={() => { onLogout(); setMobileMenuOpen(false); }}
                    className="w-full text-left px-4 py-3 text-sm font-medium text-rose-500 hover:bg-rose-50 transition-colors flex items-center gap-3 rounded-lg">
                    <LogOut size={16} />Sign Out
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        <TickerTape />
      </div>
    </header>
  );
}
