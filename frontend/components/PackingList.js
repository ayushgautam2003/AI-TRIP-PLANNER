'use client';
import { useState } from 'react';
import api from '@/lib/api';
import { Loader2, Package, CheckCircle2, Circle, X, ChevronDown, ChevronUp } from 'lucide-react';

export default function PackingList({ tripId }) {
  const [packingList, setPackingList] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [checked, setChecked] = useState({});
  const [expandedCat, setExpandedCat] = useState(null);

  async function generate() {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post(`/api/packing/${tripId}`);
      setPackingList(data.packingList);
      setOpen(true);
      setExpandedCat(0);
    } catch {
      setError('Failed to generate packing list. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function toggleCheck(catIdx, itemIdx) {
    const key = `${catIdx}-${itemIdx}`;
    setChecked(prev => ({ ...prev, [key]: !prev[key] }));
  }

  const totalItems = packingList?.categories?.reduce((acc, c) => acc + c.items.length, 0) ?? 0;
  const checkedCount = Object.values(checked).filter(Boolean).length;

  return (
    <section className="mt-8 border border-white/10 rounded-2xl overflow-hidden">
      <div className="bg-[#1e293b] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Package className="w-6 h-6 text-violet-400" />
          <div>
            <h2 className="font-bold text-white">AI Packing List</h2>
            <p className="text-xs text-slate-400">Personalised for your trip activities & budget</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {packingList && (
            <span className="text-sm font-medium text-violet-400">
              {checkedCount}/{totalItems} packed
            </span>
          )}
          {!packingList ? (
            <button
              onClick={generate}
              disabled={loading}
              className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors"
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</> : '✨ Generate Packing List'}
            </button>
          ) : (
            <button
              onClick={() => setOpen(o => !o)}
              className="text-slate-400 hover:text-white p-1 transition-colors"
            >
              {open ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="px-6 py-3 bg-red-500/10 text-red-400 text-sm border-t border-red-500/20">{error}</div>
      )}

      {packingList && open && (
        <div className="p-6 bg-[#0f172a]">
          {/* Progress bar */}
          <div className="mb-6">
            <div className="flex justify-between text-xs text-slate-400 mb-1.5">
              <span>Packing progress</span>
              <span>{Math.round((checkedCount / totalItems) * 100)}%</span>
            </div>
            <div className="w-full bg-[#334155] rounded-full h-2">
              <div
                className="bg-violet-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(checkedCount / totalItems) * 100}%` }}
              />
            </div>
          </div>

          {/* Categories */}
          <div className="space-y-3 mb-6">
            {packingList.categories.map((cat, catIdx) => (
              <div key={catIdx} className="border border-white/8 rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedCat(expandedCat === catIdx ? null : catIdx)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-[#1e293b] hover:bg-[#334155] transition-colors"
                >
                  <span className="font-semibold text-white flex items-center gap-2">
                    <span>{cat.icon}</span> {cat.name}
                    <span className="text-xs font-normal text-slate-400">
                      ({cat.items.filter((_, i) => checked[`${catIdx}-${i}`]).length}/{cat.items.length})
                    </span>
                  </span>
                  {expandedCat === catIdx ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </button>

                {expandedCat === catIdx && (
                  <div className="divide-y divide-white/5">
                    {cat.items.map((item, itemIdx) => {
                      const key = `${catIdx}-${itemIdx}`;
                      const isChecked = checked[key];
                      return (
                        <label
                          key={itemIdx}
                          className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-white/3 transition-colors"
                        >
                          <button onClick={() => toggleCheck(catIdx, itemIdx)} className="mt-0.5 shrink-0">
                            {isChecked
                              ? <CheckCircle2 className="w-5 h-5 text-violet-400" />
                              : <Circle className="w-5 h-5 text-slate-500" />}
                          </button>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`text-sm font-medium ${isChecked ? 'line-through text-slate-500' : 'text-white'}`}>
                                {item.name}
                              </span>
                              {item.essential && (
                                <span className="text-xs bg-red-500/10 text-red-400 font-medium px-1.5 py-0.5 rounded">Essential</span>
                              )}
                            </div>
                            {item.note && <p className="text-xs text-slate-400 mt-0.5">{item.note}</p>}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Tips */}
          {packingList.tips?.length > 0 && (
            <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-4">
              <h4 className="text-sm font-bold text-violet-300 mb-2">💡 Packing Tips</h4>
              <ul className="space-y-1">
                {packingList.tips.map((tip, i) => (
                  <li key={i} className="text-sm text-violet-400/80 flex items-start gap-2">
                    <span className="shrink-0 mt-0.5">•</span> {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            onClick={() => { setPackingList(null); setChecked({}); }}
            className="mt-4 flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            <X className="w-3.5 h-3.5" /> Reset & regenerate
          </button>
        </div>
      )}
    </section>
  );
}
