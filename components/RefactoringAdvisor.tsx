import { useState } from 'react';
import { Wrench, RefreshCw, Loader2, AlertTriangle, ChevronDown, ChevronRight, TrendingUp, Clock, Target } from 'lucide-react';

export interface RefactorItem {
  file: string;
  title: string;
  description: string;
  effort: 'Low' | 'Medium' | 'High';
  roi: number;
  pattern: string;
  approach: string;
  estimatedHours: number;
}

export interface RefactoringPlan {
  totalEstimatedHours: number;
  topPriority: string;
  items: RefactorItem[];
  summary: string;
}

interface Props {
  onGenerate: () => Promise<RefactoringPlan>;
  loading?: boolean;
  repoName?: string;
}

const EFFORT_COLORS: Record<RefactorItem['effort'], string> = {
  Low: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  Medium: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  High: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
};

const ROI_BAR = (roi: number) => (
  <div className="flex items-center gap-2">
    <div className="flex-1 bg-slate-800 rounded-full h-1.5 overflow-hidden">
      <div
        className="h-full rounded-full bg-indigo-500 transition-all"
        style={{ width: `${roi * 10}%` }}
      />
    </div>
    <span className="text-[10px] font-black text-indigo-400 shrink-0">{roi}/10</span>
  </div>
);

type SortKey = 'roi' | 'effort' | 'hours';

export default function RefactoringAdvisor({ onGenerate, loading, repoName }: Props) {
  const [plan, setPlan] = useState<RefactoringPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [sort, setSort] = useState<SortKey>('roi');

  const handleRun = async () => {
    setError(null);
    try {
      const result = await onGenerate();
      setPlan(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    }
  };

  const toggleExpand = (i: number) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const sorted = plan
    ? [...plan.items].sort((a, b) => {
        if (sort === 'roi') return b.roi - a.roi;
        if (sort === 'hours') return a.estimatedHours - b.estimatedHours;
        // effort: Low < Medium < High
        const effortMap = { Low: 0, Medium: 1, High: 2 };
        return effortMap[a.effort] - effortMap[b.effort];
      })
    : [];

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-[3rem] p-10 shadow-2xl">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-3 mb-1">
            <Wrench className="w-6 h-6 text-indigo-400" /> Refactoring Advisor
          </h2>
          <p className="text-slate-400 text-sm">
            AI-prioritized refactoring opportunities ranked by ROI — God Objects, prop drilling, N+1 queries, and more.
            {repoName && <span className="text-slate-500"> — {repoName}</span>}
          </p>
        </div>
        <button
          onClick={() => void handleRun()}
          disabled={loading}
          className="shrink-0 flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 rounded-xl text-sm font-bold text-white transition-all shadow-lg shadow-indigo-500/20"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          {loading ? 'Analyzing...' : plan ? 'Re-Analyze' : 'Generate Plan'}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 px-5 py-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300 text-sm mb-6">
          <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {loading && !plan && (
        <div className="flex flex-col items-center justify-center py-16 opacity-60">
          <Loader2 className="w-10 h-10 text-indigo-400 animate-spin mb-4" />
          <p className="text-slate-400 font-bold">Analyzing code patterns...</p>
        </div>
      )}

      {!plan && !loading && !error && (
        <div className="flex flex-col items-center justify-center py-14 opacity-30">
          <Wrench className="w-16 h-16 text-slate-600 mb-4" />
          <p className="text-slate-500 font-black uppercase tracking-widest text-sm">No plan generated yet</p>
        </div>
      )}

      {plan && (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 flex items-center gap-4">
              <Clock className="w-8 h-8 text-amber-400 shrink-0" />
              <div>
                <div className="text-2xl font-black text-white">{plan.totalEstimatedHours}h</div>
                <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Total Effort</div>
              </div>
            </div>
            <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 flex items-center gap-4">
              <TrendingUp className="w-8 h-8 text-indigo-400 shrink-0" />
              <div>
                <div className="text-2xl font-black text-white">{plan.items.length}</div>
                <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Opportunities</div>
              </div>
            </div>
            <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 flex items-center gap-4">
              <Target className="w-8 h-8 text-emerald-400 shrink-0" />
              <div className="min-w-0">
                <div className="text-sm font-black text-emerald-400 truncate">{plan.topPriority}</div>
                <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Top Priority</div>
              </div>
            </div>
          </div>

          {/* Summary */}
          {plan.summary && (
            <p className="text-slate-300 text-sm leading-relaxed mb-6 px-1">{plan.summary}</p>
          )}

          {/* Sort Controls */}
          <div className="flex items-center gap-2 mb-5">
            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mr-1">Sort by:</span>
            {(['roi', 'effort', 'hours'] as SortKey[]).map(s => (
              <button
                key={s}
                onClick={() => setSort(s)}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  sort === s ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {s === 'roi' ? 'ROI' : s === 'effort' ? 'Effort' : 'Hours'}
              </button>
            ))}
          </div>

          {/* Refactor Items */}
          <div className="space-y-3 max-h-[520px] overflow-y-auto pr-2 custom-scrollbar">
            {sorted.map((item, i) => (
              <div key={i} className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
                <button
                  onClick={() => toggleExpand(i)}
                  className="w-full flex items-center gap-3 p-4 hover:bg-slate-900/60 transition-colors text-left"
                >
                  {expanded.has(i) ? <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" /> : <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-bold text-sm truncate">{item.title}</div>
                    <div className="text-slate-500 text-xs truncate font-mono">{item.file}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[9px] font-black uppercase text-slate-500">{item.pattern}</span>
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${EFFORT_COLORS[item.effort]}`}>
                      {item.effort}
                    </span>
                    <span className="text-[9px] font-black text-slate-500">{item.estimatedHours}h</span>
                  </div>
                </button>
                {expanded.has(i) && (
                  <div className="px-5 pb-5 space-y-4 border-t border-slate-800">
                    <p className="text-slate-300 text-sm leading-relaxed pt-4">{item.description}</p>
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">ROI Score</div>
                      {ROI_BAR(item.roi)}
                    </div>
                    <div className="p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-xl">
                      <div className="text-[10px] uppercase tracking-widest text-indigo-400 font-bold mb-2">Suggested Approach</div>
                      <p className="text-slate-300 text-sm leading-relaxed">{item.approach}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
