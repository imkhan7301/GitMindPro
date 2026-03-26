import { useState } from 'react';
import type { TestCoverageData } from '../services/geminiService';
import { FlaskConical, AlertTriangle, CheckCircle2, RefreshCw, Loader2 } from 'lucide-react';

interface Props {
  onEstimate: () => Promise<TestCoverageData>;
  loading?: boolean;
  repoName?: string;
}

const riskColor = (risk: 'low' | 'medium' | 'high') =>
  risk === 'high' ? 'rose' : risk === 'medium' ? 'amber' : 'emerald';

const riskBg: Record<string, string> = {
  high: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
  medium: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
  low: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
};

export default function TestCoverageCard({ onEstimate, loading: externalLoading, repoName }: Props) {
  const [data, setData] = useState<TestCoverageData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLoading = loading || externalLoading;

  const runEstimate = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await onEstimate();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Estimation failed');
    } finally {
      setLoading(false);
    }
  };

  const gaugeColor = (pct: number) =>
    pct >= 70 ? '#10b981' : pct >= 40 ? '#f59e0b' : '#f43f5e';

  const circumference = 2 * Math.PI * 54;
  const pct = data?.overallEstimate ?? 0;
  const strokeDash = circumference - (pct / 100) * circumference;

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-[3rem] p-10 shadow-2xl">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center">
            <FlaskConical className="w-7 h-7 text-violet-400" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white tracking-tighter">AI Test Coverage Estimator</h2>
            <p className="text-sm text-slate-400 mt-0.5">
              {repoName ? `/${repoName}` : 'Analyze your repository\'s test coverage posture'}
            </p>
          </div>
        </div>
        <button
          onClick={runEstimate}
          disabled={isLoading}
          className="flex items-center gap-2 px-6 py-3 bg-violet-600/20 border border-violet-500/40 text-violet-300 font-black rounded-2xl hover:bg-violet-500/30 hover:text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm uppercase tracking-wider"
        >
          {isLoading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Scanning...</>
          ) : data ? (
            <><RefreshCw className="w-4 h-4" /> Re-Estimate</>
          ) : (
            <><FlaskConical className="w-4 h-4" /> Estimate Coverage</>
          )}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-400 text-sm mb-6">
          {error}
        </div>
      )}

      {isLoading && !data && (
        <div className="text-center py-16 opacity-60">
          <Loader2 className="w-10 h-10 animate-spin text-violet-400 mx-auto mb-4" />
          <p className="text-slate-400 text-sm">Scanning file tree for test patterns...</p>
        </div>
      )}

      {!data && !isLoading && !error && (
        <div className="text-center py-14 opacity-30">
          <FlaskConical className="w-16 h-16 text-slate-700 mx-auto mb-4" />
          <p className="text-slate-500 font-bold">Run estimator to see coverage posture</p>
        </div>
      )}

      {data && (
        <div className="space-y-8">
          {/* Overall gauge + summary */}
          <div className="flex flex-col md:flex-row items-center gap-10">
            {/* SVG circular gauge */}
            <div className="relative shrink-0">
              <svg width="128" height="128" className="rotate-[-90deg]">
                <circle cx="64" cy="64" r="54" fill="none" stroke="#1e293b" strokeWidth="12" />
                <circle
                  cx="64" cy="64" r="54"
                  fill="none"
                  stroke={gaugeColor(pct)}
                  strokeWidth="12"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDash}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-white">{pct}%</span>
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Estimated</span>
              </div>
            </div>
            <div className="flex-1">
              <p className="text-slate-300 text-base leading-relaxed mb-4">{data.summary}</p>
              <div className="p-5 bg-violet-500/5 border border-violet-500/20 rounded-2xl">
                <p className="text-sm text-violet-300 font-semibold leading-relaxed">{data.recommendation}</p>
              </div>
            </div>
          </div>

          {/* Module breakdown */}
          {data.modules.length > 0 && (
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4">Module Breakdown</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.modules.map((mod, i) => {
                  const color = riskColor(mod.risk);
                  return (
                    <div
                      key={i}
                      className="p-6 bg-slate-950 rounded-2xl border border-slate-800 hover:border-slate-600 transition-all duration-200 group"
                    >
                      <div className="flex items-center justify-between mb-3 gap-2">
                        <span className="text-white font-bold text-sm truncate">{mod.name}</span>
                        <span className={`text-xs font-black px-2 py-1 rounded-full border ${riskBg[mod.risk]}`}>
                          {mod.risk.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mb-3">
                        {mod.hasTests ? (
                          <CheckCircle2 className={`w-4 h-4 text-${color}-400 shrink-0`} />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-slate-600 shrink-0" />
                        )}
                        <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full bg-${color}-500 rounded-full transition-all duration-700`}
                            style={{ width: `${mod.coverageEstimate}%` }}
                          />
                        </div>
                        <span className={`text-${color}-400 font-black text-xs w-10 text-right shrink-0`}>
                          {mod.coverageEstimate}%
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 group-hover:text-slate-400 transition-colors">{mod.suggestion}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Uncovered hot zones */}
          {data.uncoveredHotZones.length > 0 && (
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" /> Uncovered Hot Zones
              </h3>
              <div className="flex flex-wrap gap-2">
                {data.uncoveredHotZones.map((zone, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-mono rounded-xl hover:bg-rose-500/20 transition-colors"
                  >
                    {zone}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
