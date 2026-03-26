import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, X, ArrowRight, Calendar, BarChart3 } from 'lucide-react';
import type { Scorecard } from '../types';

interface AnalysisSnapshot {
  id: string;
  repoOwner: string;
  repoName: string;
  summary: string;
  scorecard: Scorecard | null;
  techStack: string[];
  createdAt: string;
}

interface AnalysisDiffProps {
  analyses: AnalysisSnapshot[];
  onClose: () => void;
}

const scoreDelta = (a: number, b: number) => {
  const diff = b - a;
  if (diff > 0) return { label: `+${diff.toFixed(1)}`, color: 'text-emerald-400', icon: TrendingUp };
  if (diff < 0) return { label: diff.toFixed(1), color: 'text-red-400', icon: TrendingDown };
  return { label: '0', color: 'text-slate-500', icon: Minus };
};

const AnalysisDiff: React.FC<AnalysisDiffProps> = ({ analyses, onClose }) => {
  const repos = [...new Set(analyses.map(a => `${a.repoOwner}/${a.repoName}`))];
  const [selectedRepo, setSelectedRepo] = useState(repos[0] || '');
  const [leftId, setLeftId] = useState('');
  const [rightId, setRightId] = useState('');

  const repoAnalyses = analyses
    .filter(a => `${a.repoOwner}/${a.repoName}` === selectedRepo)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Auto-select latest two when repo changes
  useEffect(() => {
    if (repoAnalyses.length >= 2) {
      setRightId(repoAnalyses[0].id);
      setLeftId(repoAnalyses[1].id);
    } else if (repoAnalyses.length === 1) {
      setRightId(repoAnalyses[0].id);
      setLeftId('');
    }
  }, [selectedRepo]); // eslint-disable-line react-hooks/exhaustive-deps

  const left = repoAnalyses.find(a => a.id === leftId);
  const right = repoAnalyses.find(a => a.id === rightId);

  const categories: (keyof Scorecard)[] = ['maintenance', 'documentation', 'innovation', 'security'];

  const avgScore = (s: Scorecard | null) => {
    if (!s) return 0;
    return (s.maintenance + s.documentation + s.innovation + s.security) / 4;
  };

  const leftTech = new Set(left?.techStack || []);
  const rightTech = new Set(right?.techStack || []);
  const addedTech = [...(right?.techStack || [])].filter(t => !leftTech.has(t));
  const removedTech = [...(left?.techStack || [])].filter(t => !rightTech.has(t));

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="bg-slate-900 border border-slate-700 rounded-3xl max-w-4xl w-full mx-4 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-400" /> Analysis Diff
          </h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-6">
          {/* Repo selector */}
          {repos.length > 1 && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">Repo</span>
              <select
                value={selectedRepo}
                onChange={e => setSelectedRepo(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-white text-sm rounded-xl px-3 py-2 outline-none"
              >
                {repos.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          )}

          {repoAnalyses.length < 2 ? (
            <div className="text-center py-16">
              <BarChart3 className="w-12 h-12 text-slate-700 mx-auto mb-4" />
              <h3 className="text-lg font-black text-white mb-2">Not Enough Data</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                You need at least 2 analyses of the same repo to compare. Analyze <span className="text-white font-bold">{selectedRepo}</span> again to see how it has changed.
              </p>
            </div>
          ) : (
            <>
              {/* Snapshot selectors */}
              <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center">
                <div>
                  <label className="text-[10px] text-slate-600 font-bold uppercase tracking-widest mb-1 block">Older</label>
                  <select
                    value={leftId}
                    onChange={e => setLeftId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-xl px-3 py-2 outline-none"
                  >
                    {repoAnalyses.map(a => (
                      <option key={a.id} value={a.id}>
                        {new Date(a.createdAt).toLocaleDateString()} {new Date(a.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </option>
                    ))}
                  </select>
                </div>
                <ArrowRight className="w-5 h-5 text-indigo-400 mt-5" />
                <div>
                  <label className="text-[10px] text-slate-600 font-bold uppercase tracking-widest mb-1 block">Newer</label>
                  <select
                    value={rightId}
                    onChange={e => setRightId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-xl px-3 py-2 outline-none"
                  >
                    {repoAnalyses.map(a => (
                      <option key={a.id} value={a.id}>
                        {new Date(a.createdAt).toLocaleDateString()} {new Date(a.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {left && right && (
                <>
                  {/* Overall Score */}
                  <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6">
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Overall Score</h3>
                    <div className="flex items-center justify-center gap-8">
                      <div className="text-center">
                        <div className="text-3xl font-black text-white">{avgScore(left.scorecard).toFixed(1)}</div>
                        <div className="text-[10px] text-slate-600 flex items-center gap-1 justify-center mt-1">
                          <Calendar className="w-3 h-3" /> {new Date(left.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-center">
                        {(() => {
                          const d = scoreDelta(avgScore(left.scorecard), avgScore(right.scorecard));
                          return (
                            <div className={`text-2xl font-black ${d.color} flex items-center gap-1`}>
                              <d.icon className="w-5 h-5" /> {d.label}
                            </div>
                          );
                        })()}
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-black text-white">{avgScore(right.scorecard).toFixed(1)}</div>
                        <div className="text-[10px] text-slate-600 flex items-center gap-1 justify-center mt-1">
                          <Calendar className="w-3 h-3" /> {new Date(right.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Category Breakdown */}
                  <div className="grid grid-cols-2 gap-3">
                    {categories.map(cat => {
                      const lv = left.scorecard?.[cat] || 0;
                      const rv = right.scorecard?.[cat] || 0;
                      const d = scoreDelta(lv, rv);
                      return (
                        <div key={cat} className="bg-slate-800/30 rounded-xl border border-slate-800 p-4">
                          <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-2 capitalize">{cat}</div>
                          <div className="flex items-center justify-between">
                            <span className="text-white font-black text-lg">{lv}</span>
                            <div className={`flex items-center gap-1 text-sm font-bold ${d.color}`}>
                              <d.icon className="w-3.5 h-3.5" /> {d.label}
                            </div>
                            <span className="text-white font-black text-lg">{rv}</span>
                          </div>
                          {/* Bar visualization */}
                          <div className="mt-2 flex gap-1">
                            <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                              <div className="h-full bg-slate-500 rounded-full" style={{ width: `${lv * 10}%` }} />
                            </div>
                            <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${rv >= lv ? 'bg-emerald-500' : 'bg-red-400'}`} style={{ width: `${rv * 10}%` }} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Tech Stack Changes */}
                  {(addedTech.length > 0 || removedTech.length > 0) && (
                    <div className="bg-slate-800/30 rounded-2xl border border-slate-800 p-5">
                      <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Tech Stack Changes</h3>
                      <div className="flex flex-wrap gap-2">
                        {addedTech.map(t => (
                          <span key={t} className="px-2.5 py-1 bg-emerald-500/15 text-emerald-400 text-xs rounded-lg font-bold">+ {t}</span>
                        ))}
                        {removedTech.map(t => (
                          <span key={t} className="px-2.5 py-1 bg-red-500/15 text-red-400 text-xs rounded-lg font-bold">- {t}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Summary Comparison */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-800/30 rounded-xl border border-slate-800 p-4">
                      <div className="text-[10px] text-slate-600 uppercase tracking-widest font-bold mb-2">
                        Summary — {new Date(left.createdAt).toLocaleDateString()}
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed line-clamp-6">{left.summary}</p>
                    </div>
                    <div className="bg-slate-800/30 rounded-xl border border-slate-800 p-4">
                      <div className="text-[10px] text-slate-600 uppercase tracking-widest font-bold mb-2">
                        Summary — {new Date(right.createdAt).toLocaleDateString()}
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed line-clamp-6">{right.summary}</p>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalysisDiff;
