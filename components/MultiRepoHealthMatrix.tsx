import { useState } from 'react';
import { Grid3x3, ExternalLink, RefreshCw } from 'lucide-react';

interface MatrixEntry {
  id: string;
  repo_owner: string;
  repo_name: string;
  created_at: string;
  scorecard?: {
    maintenance: number;
    documentation: number;
    innovation: number;
    security: number;
  } | null;
}

interface Props {
  analyses: MatrixEntry[];
  onDrillDown?: (analysis: MatrixEntry) => void;
  onRefresh?: () => void;
}

const SCORE_BG = (score: number) => {
  if (score >= 80) return 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300';
  if (score >= 60) return 'bg-yellow-500/20 border-yellow-500/30 text-yellow-300';
  if (score >= 40) return 'bg-orange-500/20 border-orange-500/30 text-orange-300';
  return 'bg-red-500/20 border-red-500/30 text-red-300';
};

const GRADE = (score: number) => {
  if (score >= 85) return 'A';
  if (score >= 70) return 'B';
  if (score >= 55) return 'C';
  if (score >= 40) return 'D';
  return 'F';
};

function avg(a?: number, b?: number, c?: number, d?: number): number {
  const vals = [a, b, c, d].filter((v): v is number => typeof v === 'number');
  if (!vals.length) return 0;
  return Math.round(vals.reduce((s, v) => s + v, 0) / vals.length);
}

export default function MultiRepoHealthMatrix({ analyses, onDrillDown, onRefresh }: Props) {
  const [sortBy, setSortBy] = useState<'score' | 'name' | 'date'>('score');

  // Deduplicate by repo key, keep latest
  const repoBest: Map<string, MatrixEntry> = new Map();
  for (const a of analyses) {
    const key = `${a.repo_owner}/${a.repo_name}`;
    const existing = repoBest.get(key);
    if (!existing || new Date(a.created_at) > new Date(existing.created_at)) {
      repoBest.set(key, a);
    }
  }

  const rows = [...repoBest.values()];

  const getScore = (a: MatrixEntry) =>
    avg(a.scorecard?.maintenance, a.scorecard?.documentation, a.scorecard?.innovation, a.scorecard?.security);

  if (sortBy === 'score') rows.sort((a, b) => getScore(b) - getScore(a));
  else if (sortBy === 'name') rows.sort((a, b) => `${a.repo_owner}/${a.repo_name}`.localeCompare(`${b.repo_owner}/${b.repo_name}`));
  else rows.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  if (rows.length === 0) return null;

  const avgScore = Math.round(rows.reduce((s, r) => s + getScore(r), 0) / rows.length);
  const best = rows.reduce((a, b) => (getScore(a) >= getScore(b) ? a : b));
  const worst = rows.reduce((a, b) => (getScore(a) <= getScore(b) ? a : b));

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-[2rem] p-6 shadow-xl">
      <div className="flex items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-3">
          <Grid3x3 className="w-5 h-5 text-indigo-400" />
          <h3 className="text-base font-black text-white">Portfolio Health Matrix</h3>
          <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 bg-indigo-500/10 text-indigo-400 rounded-full border border-indigo-500/20">
            {rows.length} repo{rows.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="bg-slate-800 border border-slate-700 text-xs font-bold text-slate-300 rounded-xl px-3 py-1.5 outline-none"
          >
            <option value="score">Sort: Score</option>
            <option value="name">Sort: Name</option>
            <option value="date">Sort: Date</option>
          </select>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
              title="Refresh"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-slate-800/60 rounded-2xl px-4 py-2.5 text-center">
          <div className="text-xl font-black text-white">{avgScore}</div>
          <div className="text-[9px] uppercase tracking-widest text-slate-500 font-bold">Avg Score</div>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl px-4 py-2.5 text-center">
          <div className="text-xs font-black text-emerald-300 truncate">{best.repo_name}</div>
          <div className="text-[9px] uppercase tracking-widest text-slate-500 font-bold">Best {getScore(best)}</div>
        </div>
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-2.5 text-center">
          <div className="text-xs font-black text-red-300 truncate">{worst.repo_name}</div>
          <div className="text-[9px] uppercase tracking-widest text-slate-500 font-bold">Needs Work {getScore(worst)}</div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {rows.map((a) => {
          const score = getScore(a);
          const grade = GRADE(score);
          const bg = SCORE_BG(score);
          const scorecard = a.scorecard;

          return (
            <button
              key={`${a.repo_owner}/${a.repo_name}`}
              onClick={() => onDrillDown?.(a)}
              className="group text-left bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700 rounded-2xl p-4 transition-all hover:border-indigo-500/40 hover:-translate-y-0.5 duration-200"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-500 font-bold truncate">{a.repo_owner}</p>
                  <p className="text-sm font-black text-white truncate">{a.repo_name}</p>
                </div>
                <div className={`shrink-0 flex items-center justify-center w-10 h-10 rounded-xl border font-black text-lg ${bg}`}>
                  {grade}
                </div>
              </div>

              {/* Score bars */}
              {scorecard && (
                <div className="space-y-1.5">
                  {(['maintenance', 'documentation', 'innovation', 'security'] as const).map((cat) => {
                    const val = scorecard[cat] ?? 0;
                    return (
                      <div key={cat} className="flex items-center gap-2">
                        <span className="text-[9px] uppercase tracking-widest text-slate-500 w-16 shrink-0">{cat.slice(0, 5)}</span>
                        <div className="flex-1 h-1 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${val >= 80 ? 'bg-emerald-500' : val >= 60 ? 'bg-yellow-500' : val >= 40 ? 'bg-orange-500' : 'bg-red-500'}`}
                            style={{ width: `${val}%` }}
                          />
                        </div>
                        <span className="text-[9px] font-black text-slate-400 w-6 text-right">{val}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex items-center justify-between mt-3">
                <span className="text-[9px] text-slate-600">{new Date(a.created_at).toLocaleDateString()}</span>
                <ExternalLink className="w-3 h-3 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
