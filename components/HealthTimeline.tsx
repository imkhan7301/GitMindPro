import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface HistoryEntry {
  repoName: string;
  repoOwner: string;
  createdAt: string;
  scorecard?: { maintenance: number; documentation: number; innovation: number; security: number } | null;
}

interface Props {
  history: HistoryEntry[];
}

const CATEGORIES = [
  { key: 'maintenance' as const, label: 'Maintenance', color: '#6366f1', light: 'text-indigo-400', bg: 'bg-indigo-500/10' },
  { key: 'documentation' as const, label: 'Docs', color: '#10b981', light: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  { key: 'innovation' as const, label: 'Innovation', color: '#f59e0b', light: 'text-amber-400', bg: 'bg-amber-500/10' },
  { key: 'security' as const, label: 'Security', color: '#f43f5e', light: 'text-rose-400', bg: 'bg-rose-500/10' },
];

function Sparkline({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) return null;
  const W = 120, H = 36, pad = 4;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const pts = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (W - pad * 2);
    const y = H - pad - ((v - min) / range) * (H - pad * 2);
    return `${x},${y}`;
  });
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="overflow-visible">
      <polyline
        points={pts.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.8"
      />
      {/* Last point dot */}
      <circle
        cx={pts[pts.length - 1].split(',')[0]}
        cy={pts[pts.length - 1].split(',')[1]}
        r="3"
        fill={color}
      />
    </svg>
  );
}

export default function HealthTimeline({ history }: Props) {
  // Group by repo, take up to 5 most recent per repo
  const repoGroups = history.reduce<Record<string, HistoryEntry[]>>((acc, entry) => {
    const key = `${entry.repoOwner}/${entry.repoName}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(entry);
    return acc;
  }, {});

  const repoKeys = Object.keys(repoGroups).slice(0, 4);

  if (history.length === 0) {
    return (
      <div className="bg-slate-900/40 border border-slate-800 rounded-[3rem] p-10 text-center">
        <TrendingUp className="w-10 h-10 text-slate-700 mx-auto mb-3" />
        <p className="text-slate-500 text-sm font-bold">Analyze repos multiple times to see score trends here.</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-[3rem] p-10 shadow-2xl">
      <div className="mb-8">
        <h2 className="text-2xl font-black text-white flex items-center gap-3 mb-1">
          <TrendingUp className="w-6 h-6 text-indigo-400" /> Health Score Timeline
        </h2>
        <p className="text-slate-400 text-sm">Score trends across your analyzed repositories over time.</p>
      </div>

      <div className="space-y-6">
        {repoKeys.map(repoKey => {
          const entries = repoGroups[repoKey]
            .filter(e => e.scorecard)
            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
            .slice(-8);

          if (entries.length === 0) return null;

          const latest = entries[entries.length - 1].scorecard!;
          const prev = entries.length > 1 ? entries[entries.length - 2].scorecard! : null;

          const overallLatest = Math.round((latest.maintenance + latest.documentation + latest.innovation + latest.security) / 4);
          const overallPrev = prev ? Math.round((prev.maintenance + prev.documentation + prev.innovation + prev.security) / 4) : null;
          const delta = overallPrev !== null ? overallLatest - overallPrev : null;

          return (
            <div key={repoKey} className="p-6 bg-slate-950 border border-slate-800 rounded-2xl">
              {/* Header */}
              <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                <div>
                  <span className="text-sm font-black text-white font-mono">{repoKey}</span>
                  <span className="ml-3 text-xs text-slate-500">{entries.length} {entries.length === 1 ? 'analysis' : 'analyses'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-black text-white">{overallLatest}</span>
                  {delta !== null && (
                    <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black ${
                      delta > 0 ? 'bg-emerald-500/10 text-emerald-400' :
                      delta < 0 ? 'bg-rose-500/10 text-rose-400' :
                      'bg-slate-800 text-slate-400'
                    }`}>
                      {delta > 0 ? <TrendingUp className="w-3 h-3" /> : delta < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                      {delta > 0 ? '+' : ''}{delta}pts
                    </div>
                  )}
                </div>
              </div>

              {/* Per-category sparklines */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {CATEGORIES.map(({ key, label, color, light, bg }) => {
                  const vals = entries.map(e => e.scorecard![key]);
                  const current = vals[vals.length - 1];
                  return (
                    <div key={key} className={`p-3 rounded-xl ${bg} border border-white/5`}>
                      <p className={`text-[10px] font-black uppercase tracking-widest mb-2 ${light}`}>{label}</p>
                      <div className="flex items-end justify-between gap-2">
                        <span className="text-lg font-black text-white">{current}</span>
                        {vals.length >= 2 && <Sparkline values={vals} color={color} />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
