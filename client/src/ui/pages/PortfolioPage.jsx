import React, { useState, useEffect } from 'react';
import { Briefcase, Plus, Trash2, Save, AlertCircle } from 'lucide-react';

async function api(path, opts = {}) {
  const res = await fetch(path, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(opts.headers ?? {}) },
    credentials: 'include',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error ?? 'request_failed');
  }
  return data;
}

export default function PortfolioPage({ me, onLogout }) {
  const [holdings, setHoldings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const data = await api('/api/portfolio');
        setHoldings(data.portfolio?.holdings || []);
      } catch (e) {
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleAdd = () => {
    setHoldings([...holdings, { ticker: '', weight: 0 }]);
  };

  const handleRemove = (idx) => {
    setHoldings(holdings.filter((_, i) => i !== idx));
  };

  const handleChange = (idx, field, value) => {
    const newHoldings = [...holdings];
    newHoldings[idx][field] = value;
    setHoldings(newHoldings);
  };

  const handleSave = async () => {
    setSaving(true);
    setErr('');
    setMsg('');
    try {
      // Basic validation
      let totalWeight = 0;
      for (const h of holdings) {
        if (!h.ticker) throw new Error('All tickers must have a name');
        totalWeight += Number(h.weight) || 0;
      }
      if (holdings.length > 0 && Math.abs(totalWeight - 100) > 0.1) {
        throw new Error(`Total weight must be 100% (currently ${totalWeight}%)`);
      }

      await api('/api/portfolio', {
        method: 'POST',
        body: JSON.stringify({ holdings: holdings.map(h => ({ ticker: h.ticker.toUpperCase(), weight: Number(h.weight) })) }),
      });
      setMsg('Portfolio saved successfully! Agents will now analyze news with your holdings in mind.');
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Briefcase size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">My Portfolio</h1>
            <p className="text-sm text-slate-500">Inject your holdings into the AI agent debate context</p>
          </div>
        </div>

        {err && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-rose-600">
            <AlertCircle size={18} />
            <span className="text-sm font-medium">{err}</span>
          </div>
        )}
        {msg && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-emerald-600">
            <Save size={18} />
            <span className="text-sm font-medium">{msg}</span>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
          <p className="text-slate-600 mb-6 text-sm">
            Add your Boursa Kuwait tickers and their target weights below. The AI agents will automatically
            evaluate how breaking news impacts these specific holdings during their debates.
          </p>

          {loading ? (
            <div className="py-12 text-center text-slate-400">Loading portfolio...</div>
          ) : (
            <div className="space-y-4">
              {holdings.length === 0 ? (
                <div className="p-8 border-2 border-dashed border-slate-200 rounded-xl text-center text-slate-400">
                  No holdings added yet.
                </div>
              ) : (
                holdings.map((h, idx) => (
                  <div key={idx} className="flex items-center gap-4 p-4 border border-slate-100 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                    <div className="flex-1">
                      <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Ticker</label>
                      <input
                        type="text"
                        value={h.ticker}
                        onChange={(e) => handleChange(idx, 'ticker', e.target.value)}
                        placeholder="e.g. NBK.KW"
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="w-32">
                      <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Weight (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={h.weight}
                        onChange={(e) => handleChange(idx, 'weight', e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <button
                      onClick={() => handleRemove(idx)}
                      className="mt-5 p-2 text-rose-400 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors"
                      title="Remove Holding"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                ))
              )}

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  onClick={handleAdd}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                >
                  <Plus size={16} /> Add Holding
                </button>
                <div className="flex items-center gap-4">
                  <div className="text-sm font-medium text-slate-600">
                    Total Weight: <span className={holdings.reduce((sum, h) => sum + (Number(h.weight) || 0), 0) === 100 ? 'text-emerald-600 font-bold' : 'text-slate-800'}>
                      {holdings.reduce((sum, h) => sum + (Number(h.weight) || 0), 0)}%
                    </span>
                  </div>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-md shadow-indigo-500/20 disabled:opacity-50 transition-colors"
                  >
                    {saving ? 'Saving...' : 'Save Portfolio'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
