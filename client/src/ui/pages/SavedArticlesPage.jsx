import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookmarkMinus, ExternalLink, BookmarkCheck, ArrowRight, Loader2 } from 'lucide-react';

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
  if (!iso) return 'just now';
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.max(1, Math.floor(ms / 60000));
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function SavedArticlesPage({ me }) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const loadSavedArticles = useCallback(async () => {
    if (!me) return;
    setLoading(true);
    setErr('');
    try {
      const d = await api('/api/articles/saved/mine');
      setArticles(d.items ?? []);
    } catch (e) {
      setErr('Failed to load saved articles.');
    } finally {
      setLoading(false);
    }
  }, [me]);

  useEffect(() => {
    loadSavedArticles();
  }, [loadSavedArticles]);

  const handleUnsave = async (id) => {
    try {
      // Optimistic update
      setArticles(prev => prev.filter(a => a._id !== id));
      await api(`/api/articles/${id}/unsave`, { method: 'POST' });
    } catch (e) {
      // Revert if failed
      loadSavedArticles();
      alert('Failed to remove article');
    }
  };

  if (!me) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500">
        Please sign in to view your saved articles.
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="glass-card !p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-100 to-violet-100 flex items-center justify-center border border-cyan-200">
            <BookmarkCheck size={20} className="text-cyan-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Saved Articles</h2>
            <p className="text-xs text-slate-400">Manage your saved market intelligence to use in the War Room</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-cyan-600">
          <Loader2 className="animate-spin" size={32} />
        </div>
      ) : err ? (
        <div className="glass-card !p-6 text-rose-500 text-center">{err}</div>
      ) : articles.length === 0 ? (
        <div className="glass-card !p-12 flex flex-col items-center justify-center text-center border-dashed">
          <BookmarkCheck size={48} className="text-slate-200 mb-4" />
          <h3 className="text-lg font-bold text-slate-700 mb-1">No saved articles</h3>
          <p className="text-sm text-slate-400">
            You haven't saved any articles yet. Head over to the News Feed and bookmark some articles to analyze them later in the War Room.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {articles.map((article) => (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                key={article._id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col relative group"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    {article.tags?.[0] || 'GCC'}
                  </span>
                  
                  <button
                    onClick={() => handleUnsave(article._id)}
                    className="p-1.5 rounded-lg bg-rose-50 text-rose-400 opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-100 hover:text-rose-600"
                    title="Remove from saved"
                  >
                    <BookmarkMinus size={14} />
                  </button>
                </div>

                <h3 className="text-sm font-bold text-slate-800 leading-snug mb-2 line-clamp-2">
                  {article.title}
                </h3>
                
                <p className="text-xs text-slate-500 leading-relaxed line-clamp-3 mb-4 flex-1">
                  {article.excerpt || article.content}
                </p>

                <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-2 text-[10px] text-slate-400">
                    <span className="truncate max-w-[100px]">{article.source || 'Unknown source'}</span>
                    <span>•</span>
                    <span>{formatAgo(article.publishedAt)}</span>
                  </div>
                  
                  {article.url && (
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-cyan-600 hover:text-cyan-700 font-semibold flex items-center gap-1"
                    >
                      Source <ExternalLink size={10} />
                    </a>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
