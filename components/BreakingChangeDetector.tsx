import { useState } from 'react';
import { GitBranch, AlertTriangle, CheckCircle2, RefreshCw, Loader2, Code, FileText } from 'lucide-react';

export interface BreakingChangeReport {
  summary: string;
  baseBranch: string;
  headBranch: string;
  totalBreaking: number;
  totalWarnings: number;
  changes: {
    type: 'breaking' | 'warning' | 'safe';
    category: 'api' | 'schema' | 'config' | 'dependency' | 'behavior' | 'type';
    title: string;
    description: string;
    file: string;
    line?: number;
    recommendation: string;
  }[];
  migrationGuide: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

interface Props {
  onDetect: (baseBranch: string, headBranch: string) => Promise<BreakingChangeReport>;
  loading?: boolean;
  repoName?: string;
  defaultBranch?: string;
}

const changeColor: Record<string, string> = {
  breaking: 'border-l-rose-500 bg-rose-500/5',
  warning:  'border-l-amber-500 bg-amber-500/5',
  safe:     'border-l-emerald-500 bg-emerald-500/5',
};

const categoryIcon: Record<string, string> = {
  api: '⚙️', schema: '🗄️', config: '📋', dependency: '📦', behavior: '🔄', type: '🏷️',
};

const riskBadge: Record<string, string> = {
  critical: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
  high:     'bg-orange-500/20 text-orange-300 border-orange-500/40',
  medium:   'bg-amber-500/20 text-amber-300 border-amber-500/40',
  low:      'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
};

export default function BreakingChangeDetector({ onDetect, loading: externalLoading, repoName, defaultBranch = 'main' }: Props) {
  const [report, setReport] = useState<BreakingChangeReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [baseBranch, setBaseBranch] = useState(defaultBranch);
  const [headBranch, setHeadBranch] = useState('');
  const [filter, setFilter] = useState<'all' | 'breaking' | 'warning'>('all');

  const isLoading = loading || externalLoading;

  const handleRun = async () => {
    if (!headBranch.trim()) { setError('Enter a head branch to compare'); return; }
    setLoading(true);
    setError(null);
    try {
      const result = await onDetect(baseBranch, headBranch);
      setReport(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Detection failed');
    } finally {
      setLoading(false);
    }
  };

  const filtered = report?.changes.filter(c => filter === 'all' || c.type === filter) ?? [];

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-[3rem] p-10 shadow-2xl">
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-3 mb-1">
            <GitBranch className="w-7 h-7 text-indigo-400" /> Breaking Change Detector
          </h2>
          <p className="text-slate-400 text-sm">
            Compare branches — AI flags API-level breaks, schema changes, and behavior diffs.
            {repoName && <span className="ml-2 text-slate-500">· {repoName}</span>}
          </p>
        </div>
      </div>

      {/* Branch inputs */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1">
          <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1.5 block">Base Branch</label>
          <input
            value={baseBranch}
            onChange={e => setBaseBranch(e.target.value)}
            placeholder="main"
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none focus:border-indigo-500/60 transition-colors"
          />
        </div>
        <div className="flex items-end pb-0.5">
          <span className="text-slate-600 font-black text-xl px-2">→</span>
        </div>
        <div className="flex-1">
          <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1.5 block">Head Branch / PR</label>
          <input
            value={headBranch}
            onChange={e => setHeadBranch(e.target.value)}
            placeholder="feature/my-changes"
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none focus:border-indigo-500/60 transition-colors"
          />
        </div>
        <div className="flex items-end">
          <button
            onClick={handleRun}
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-sm font-black uppercase tracking-widest transition-all disabled:opacity-40"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {isLoading ? 'Analyzing...' : 'Detect'}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl mb-6 text-rose-400 text-sm">{error}</div>
      )}

      {isLoading && (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
          <p className="text-slate-400 text-sm">Analyzing branch diff for breaking changes...</p>
        </div>
      )}

      {report && !isLoading && (
        <div className="space-y-6">
          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-5 bg-slate-950 rounded-2xl border border-rose-500/30 text-center">
              <div className="text-3xl font-black text-rose-400 mb-1">{report.totalBreaking}</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Breaking</div>
            </div>
            <div className="p-5 bg-slate-950 rounded-2xl border border-amber-500/30 text-center">
              <div className="text-3xl font-black text-amber-400 mb-1">{report.totalWarnings}</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Warnings</div>
            </div>
            <div className="p-5 bg-slate-950 rounded-2xl border border-slate-700 text-center sm:col-span-2">
              <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-black uppercase tracking-widest ${riskBadge[report.riskLevel]}`}>
                {report.riskLevel} risk
              </span>
              <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-2">Overall Risk</div>
            </div>
          </div>

          <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800">
            <p className="text-slate-300 text-sm leading-relaxed">{report.summary}</p>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-2">
            {(['all', 'breaking', 'warning'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  filter === f
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-950 border border-slate-800 text-slate-500 hover:text-white'
                }`}
              >
                {f} {f !== 'all' && `(${report.changes.filter(c => c.type === f).length})`}
              </button>
            ))}
          </div>

          {/* Changes list */}
          <div className="space-y-3">
            {filtered.map((change, i) => (
              <div
                key={i}
                className={`border-l-4 rounded-r-2xl p-5 ${changeColor[change.type]}`}
              >
                <div className="flex items-start gap-3 mb-2">
                  <span className="text-lg">{categoryIcon[change.category]}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap mb-1">
                      <span className="text-white font-bold text-sm">{change.title}</span>
                      <span className="text-[9px] px-2 py-0.5 bg-slate-800 border border-slate-700 text-slate-400 rounded-full font-bold uppercase">{change.category}</span>
                      {change.type === 'breaking' && <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />}
                      {change.type === 'safe' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                    </div>
                    <p className="text-slate-400 text-xs mb-2">{change.description}</p>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                      <Code className="w-3 h-3" />
                      <code className="text-indigo-400">{change.file}{change.line ? `:${change.line}` : ''}</code>
                    </div>
                    <p className="text-slate-400 text-xs"><span className="text-slate-500 font-bold">Fix: </span>{change.recommendation}</p>
                  </div>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-8 text-slate-600">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-600" />
                <p className="text-sm">No {filter === 'all' ? '' : filter} changes found</p>
              </div>
            )}
          </div>

          {/* Migration guide */}
          {report.migrationGuide && (
            <div className="p-6 bg-indigo-500/5 border border-indigo-500/20 rounded-2xl">
              <h4 className="text-indigo-400 font-black text-sm uppercase tracking-widest mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4" /> Migration Guide
              </h4>
              <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{report.migrationGuide}</p>
            </div>
          )}
        </div>
      )}

      {!report && !isLoading && (
        <div className="flex flex-col items-center justify-center py-12 opacity-40">
          <GitBranch className="w-16 h-16 text-slate-700 mb-4" />
          <p className="text-slate-500 text-sm uppercase tracking-widest font-bold">Enter branch names to begin comparison</p>
        </div>
      )}
    </div>
  );
}
