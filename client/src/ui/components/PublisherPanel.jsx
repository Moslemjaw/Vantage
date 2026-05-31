import React, { useState } from 'react';
import { Newspaper, X, AlertTriangle, CheckCircle2 } from 'lucide-react';

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

export default function PublisherPanel({ me, onClose }) {
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
          headline: title, body: content,
          source: sourceName || me?.name || 'Publisher',
          url: sourceLink || '', tag: 'VERIFIED',
        }),
      });
      setMsg('Published successfully');
      setTitle(''); setContent(''); setSourceName(''); setSourceLink('');
    } catch (e) { setErr(String(e?.message ?? e)); }
    finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
          <div className="flex items-center justify-between p-6 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Newspaper size={20} className="text-emerald-500" />News Ingestion
              </h2>
              <p className="text-xs text-slate-400 mt-1">Publish verified market intelligence</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-500 transition-colors">
              <X size={18} />
            </button>
          </div>

          <form onSubmit={publish} className="p-6 space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Title</label>
              <input value={title} onChange={e => setTitle(e.target.value)} required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-300 focus:border-emerald-500 outline-none transition-all"
                placeholder="News headline..." />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Content</label>
              <textarea value={content} onChange={e => setContent(e.target.value)} rows={5}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-300 focus:border-emerald-500 outline-none transition-all resize-y"
                placeholder="Full article content..." />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Source Name</label>
                <input value={sourceName} onChange={e => setSourceName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-300 focus:border-emerald-500 outline-none transition-all"
                  placeholder="e.g. Kuwait Times" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Source Link</label>
                <input value={sourceLink} onChange={e => setSourceLink(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-300 focus:border-emerald-500 outline-none transition-all"
                  placeholder="https://..." />
              </div>
            </div>

            {err && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-center gap-2 text-xs">
                <AlertTriangle size={14} className="text-rose-500 shrink-0" />
                <span className="text-rose-600">{err}</span>
              </div>
            )}
            {msg && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2 text-xs">
                <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                <span className="text-emerald-600">{msg}</span>
              </div>
            )}

            <button type="submit" disabled={loading || !title}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold text-sm hover:shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed">
              {loading ? 'Publishing...' : 'Publish Article'}
            </button>

            <p className="text-[10px] text-slate-300 text-center">
              Published by @{me?.name} · Verified Source badge applied automatically
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
