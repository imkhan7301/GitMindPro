import { useState } from 'react';
import { Ghost, Trash2, RefreshCw, Loader2, ChevronDown, ChevronRight, AlertTriangle, CheckCircle2, FileCode2 } from 'lucide-react';

export interface DeadCodeItem {
  file: string;
  symbol: string;
  category: 'unused-export' | 'dead-function' | 'zombie-route' | 'stale-import' | 'orphaned-component';
  severity: 'high' | 'medium' | 'low';
  reason: string;
  lineHint?: number;
  removalSafe: boolean;
}

export interface DeadCodeReport {
  totalItems: number;
  estimatedWastePercent: number;
  items: DeadCodeItem[];
  categories: { name: string; count: number }[];
  summary: string;
}

interface Props {
  onAnalyze: () => Promise<DeadCodeReport>;
  loading?: boolean;
  repoName?: string;
}

const CATEGORY_LABELS: Record<DeadCodeItem['category'], string> = {
  'unused-export': 'Unused Export',
  'dead-function': 'Dead Function',
  'zombie-route': 'Zombie Route',
  'stale-import': 'Stale Import',
  'orphaned-component': 'Orphaned Component',
};

const CATEGORY_COLORS: Record<DeadCodeItem['category'], string> = {
  'unused-export': 'bg-amber-500/15 text-amber-400',
  'dead-function': 'bg-rose-500/15 text-rose-400',
  'zombie-route': 'bg-violet-500/15 text-violet-400',
  'stale-import': 'bg-slate-500/15 text-slate-400',
  'orphaned-component': 'bg-orange-500/15 text-orange-400',
};

const SEV_COLORS: Record<DeadCodeItem['severity'], string> = {
  high: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  medium: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  low: 'bg-slate-500/15 text-slate-400 border-slate-600',
};

type FilterTab = 'all' | DeadCodeItem['category'];

export default function DeadCodeDetector({ onAnalyze, loading, repoName }: Props) {
  const [report, setReport] = useState<DeadCodeReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [filter, setFilter] = useState<FilterTab>('all');

  const handleRun = async () => {
    setError(null);
    try {
      const result = await onAnalyze();
      setReport(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    }
  };

  const toggleExpand = (i: number) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const filtered = report
    ? filter === 'all'
      ? report.items
      : report.items.filter(it => it.category === filter)
    : [];

  const wasteColor = report
    ? report.estimatedWastePercent > 20
      ? 'text-rose-400'
      : report.estimatedWastePercent > 10
        ? 'text-amber-400'
        : 'text-emerald-400'
    : 'text-slate-400';

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-[3rem] p-10 shadow-2xl">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-3 mb-1">
            <Ghost className="w-6 h-6 text-violet-400" /> Dead Code Detector
          </h2>
          <p className="text-slate-400 text-sm">
            AI scans for unused exports, dead functions, zombie routes, stale imports, and orphaned components.
            {repoName && <span className="text-slate-500"> — {repoName}</span>}
          </p>
        </div>
        <button
          onClick={() => void handleRun()}
          disabled={loading}
          className="shrink-0 flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 rounded-xl text-sm font-bold text-white transition-all shadow-lg shadow-violet-500/20"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          {loading ? 'Scanning...' : report ? 'Re-Scan' : 'Detect Dead Code'}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 px-5 py-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300 text-sm mb-6">
          <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {loading && !report && (
        <div className="flex flex-col items-center justify-center py-16 opacity-60">
          <Loader2 className="w-10 h-10 text-violet-400 animate-spin mb-4" />
          <p className="text-slate-400 font-bold">Hunting ghost code...</p>
        </div>
      )}

      {!report && !loading && !error && (
        <div className="flex flex-col items-center justify-center py-14 opacity-30">
          <Ghost className="w-16 h-16 text-slate-600 mb-4" />
          <p className="text-slate-500 font-black uppercase tracking-widest text-sm">No scan run yet</p>
        </div>
      )}

      {report && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 text-center">
              <div className="text-3xl font-black text-white mb-1">{report.totalItems}</div>
              <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Dead Items</div>
            </div>
            <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 text-center">
              <div className={`text-3xl font-black mb-1 ${wasteColor}`}>{report.estimatedWastePercent}%</div>
              <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Code Waste</div>
            </div>
            {report.categories.slice(0, 2).map((cat, i) => (
              <div key={i} className="p-5 bg-slate-950 rounded-2xl border border-slate-800 text-center">
                <div className="text-3xl font-black text-violet-400 mb-1">{cat.count}</div>
                <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">{cat.name}</div>
              </div>
            ))}
          </div>

          {/* Summary */}
          {report.summary && (
            <p className="text-slate-300 text-sm leading-relaxed mb-6 px-1">{report.summary}</p>
          )}

          {/* Category Filter Tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            {(['all', 'unused-export', 'dead-function', 'zombie-route', 'stale-import', 'orphaned-component'] as FilterTab[]).map(tab => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  filter === tab
                    ? 'bg-violet-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {tab === 'all' ? `All (${report.totalItems})` : CATEGORY_LABELS[tab as DeadCodeItem['category']]}
              </button>
            ))}
          </div>

          {/* Items List */}
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {filtered.length === 0 && (
              <div className="text-center py-8 text-slate-500 text-sm">No items in this category.</div>
            )}
            {filtered.map((item, i) => (
              <div key={i} className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
                <button
                  onClick={() => toggleExpand(i)}
                  className="w-full flex items-center gap-3 p-4 hover:bg-slate-900/60 transition-colors text-left"
                >
                  {expanded.has(i) ? <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" /> : <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />}
                  <FileCode2 className="w-4 h-4 text-slate-600 shrink-0" />
                  <span className="text-slate-300 text-xs font-mono flex-1 truncate">{item.file}</span>
                  <span className="text-slate-400 text-xs font-bold truncate max-w-[160px]">{item.symbol}</span>
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${CATEGORY_COLORS[item.category]}`}>
                    {CATEGORY_LABELS[item.category]}
                  </span>
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${SEV_COLORS[item.severity]}`}>
                    {item.severity}
                  </span>
                  {item.removalSafe && (
                    <span title="Safe to remove"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /></span>
                  )}
                </button>
                {expanded.has(i) && (
                  <div className="px-5 pb-5 space-y-3 border-t border-slate-800">
                    <p className="text-slate-300 text-sm leading-relaxed pt-4">{item.reason}</p>
                    <div className="flex flex-wrap items-center gap-3">
                      {item.lineHint && (
                        <span className="text-[10px] font-mono text-slate-500">Line ~{item.lineHint}</span>
                      )}
                      {item.removalSafe ? (
                        <span className="flex items-center gap-1.5 text-[10px] font-black text-emerald-400 uppercase">
                          <CheckCircle2 className="w-3 h-3" /> Safe to remove
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-[10px] font-black text-amber-400 uppercase">
                          <AlertTriangle className="w-3 h-3" /> Review before removing
                        </span>
                      )}
                      <span className="flex items-center gap-1.5 text-[10px] text-violet-400 font-bold">
                        <Trash2 className="w-3 h-3" /> Candidate for cleanup
                      </span>
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
