import React, { useState, useMemo } from 'react';
import { Sliders, X, RotateCw } from 'lucide-react';

export interface ScoringWeights {
  maintenance: number;
  documentation: number;
  innovation: number;
  security: number;
}

const DEFAULT_WEIGHTS: ScoringWeights = {
  maintenance: 25,
  documentation: 25,
  innovation: 25,
  security: 25,
};

const STORAGE_KEY = 'gitmind.scoringWeights';

export const getScoringWeights = (): ScoringWeights => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* fallback */ }
  return { ...DEFAULT_WEIGHTS };
};

export const computeWeightedScore = (
  scores: { maintenance: number; documentation: number; innovation: number; security: number },
  weights?: ScoringWeights
): number => {
  const w = weights || getScoringWeights();
  const total = w.maintenance + w.documentation + w.innovation + w.security;
  if (total === 0) return 0;
  return (
    (scores.maintenance * w.maintenance +
     scores.documentation * w.documentation +
     scores.innovation * w.innovation +
     scores.security * w.security) / total
  );
};

interface Props {
  currentScores?: { maintenance: number; documentation: number; innovation: number; security: number } | null;
  onClose: () => void;
  onSave: (weights: ScoringWeights) => void;
}

const CATEGORIES = [
  { key: 'maintenance' as const, label: 'Maintenance', color: '#10b981', desc: 'Code quality, test coverage, dependency freshness' },
  { key: 'documentation' as const, label: 'Documentation', color: '#3b82f6', desc: 'README, inline docs, API reference' },
  { key: 'innovation' as const, label: 'Innovation', color: '#8b5cf6', desc: 'Modern patterns, architecture, tooling' },
  { key: 'security' as const, label: 'Security', color: '#ef4444', desc: 'Vulnerability surface, auth practices, secrets' },
];

const CustomScoringWeights: React.FC<Props> = ({ currentScores, onClose, onSave }) => {
  const [weights, setWeights] = useState<ScoringWeights>(getScoringWeights());

  const total = weights.maintenance + weights.documentation + weights.innovation + weights.security;

  const preview = useMemo(() => {
    if (!currentScores) return null;
    const defaultScore = (currentScores.maintenance + currentScores.documentation + currentScores.innovation + currentScores.security) / 4;
    const weighted = computeWeightedScore(currentScores, weights);
    return { defaultScore, weighted };
  }, [currentScores, weights]);

  const handleChange = (key: keyof ScoringWeights, value: number) => {
    setWeights(prev => ({ ...prev, [key]: Math.max(0, Math.min(100, value)) }));
  };

  const handleReset = () => {
    setWeights({ ...DEFAULT_WEIGHTS });
  };

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(weights));
    onSave(weights);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full mx-4 shadow-2xl animate-in zoom-in p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500/15 rounded-xl flex items-center justify-center">
              <Sliders className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">Scoring Weights</h2>
              <p className="text-xs text-slate-500">Customize what matters most</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>

        {/* Weight sliders */}
        <div className="space-y-5 mb-6">
          {CATEGORIES.map(cat => (
            <div key={cat.key}>
              <div className="flex items-center justify-between mb-1.5">
                <div>
                  <span className="text-sm font-bold text-white">{cat.label}</span>
                  <p className="text-[10px] text-slate-600">{cat.desc}</p>
                </div>
                <span className="text-sm font-black tabular-nums" style={{ color: cat.color }}>
                  {total > 0 ? Math.round((weights[cat.key] / total) * 100) : 0}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={weights[cat.key]}
                onChange={e => handleChange(cat.key, parseInt(e.target.value, 10))}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, ${cat.color} ${weights[cat.key]}%, #1e293b ${weights[cat.key]}%)`,
                }}
              />
            </div>
          ))}
        </div>

        {/* Weight distribution bar */}
        <div className="flex h-2 rounded-full overflow-hidden mb-4">
          {CATEGORIES.map(cat => {
            const pct = total > 0 ? (weights[cat.key] / total) * 100 : 25;
            return (
              <div
                key={cat.key}
                style={{ width: `${pct}%`, backgroundColor: cat.color }}
                className="transition-all duration-300"
                title={`${cat.label}: ${Math.round(pct)}%`}
              />
            );
          })}
        </div>

        {/* Live preview */}
        {preview && (
          <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4 mb-5">
            <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">Live Preview</div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-xs text-slate-500 mb-1">Default</div>
                <div className="text-xl font-black text-slate-400">{preview.defaultScore.toFixed(1)}</div>
              </div>
              <div className="text-slate-700">→</div>
              <div className="text-center">
                <div className="text-xs text-slate-500 mb-1">Weighted</div>
                <div className="text-xl font-black text-indigo-400">{preview.weighted.toFixed(1)}</div>
              </div>
              {preview.weighted !== preview.defaultScore && (
                <div className={`text-xs font-bold ${preview.weighted > preview.defaultScore ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {preview.weighted > preview.defaultScore ? '+' : ''}{(preview.weighted - preview.defaultScore).toFixed(1)}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold text-slate-300 transition-all"
          >
            <RotateCw className="w-3 h-3" /> Reset
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl transition-all"
          >
            Save Weights
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomScoringWeights;
