import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus, BarChart3 } from 'lucide-react';

interface ScorePoint {
  date: string;
  maintenance: number;
  documentation: number;
  innovation: number;
  security: number;
}

interface TrendChartProps {
  history: ScorePoint[];
  repoName?: string;
}

const COLORS: Record<string, string> = {
  maintenance: '#818cf8',   // indigo
  documentation: '#34d399', // emerald
  innovation: '#f59e0b',    // amber
  security: '#f87171',      // red
};

const LABELS: Record<string, string> = {
  maintenance: 'Maintenance',
  documentation: 'Documentation',
  innovation: 'Innovation',
  security: 'Security',
};

const avgScore = (p: ScorePoint) =>
  Math.round((p.maintenance + p.documentation + p.innovation + p.security) / 4);

const SparkLine: React.FC<{ values: number[]; color: string; width?: number; height?: number }> = ({
  values,
  color,
  width = 120,
  height = 32,
}) => {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const step = width / (values.length - 1);

  const points = values.map((v, i) => {
    const x = i * step;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} className="inline-block">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Dot on last value */}
      {values.length > 0 && (
        <circle
          cx={(values.length - 1) * step}
          cy={height - ((values[values.length - 1] - min) / range) * (height - 4) - 2}
          r="3"
          fill={color}
        />
      )}
    </svg>
  );
};

const TrendBadge: React.FC<{ current: number; previous: number }> = ({ current, previous }) => {
  const diff = current - previous;
  if (diff === 0) return <span className="inline-flex items-center gap-1 text-xs text-slate-500"><Minus className="w-3 h-3" /> No change</span>;
  if (diff > 0) return <span className="inline-flex items-center gap-1 text-xs text-emerald-400"><TrendingUp className="w-3 h-3" /> +{diff}</span>;
  return <span className="inline-flex items-center gap-1 text-xs text-red-400"><TrendingDown className="w-3 h-3" /> {diff}</span>;
};

const TrendChart: React.FC<TrendChartProps> = ({ history, repoName }) => {
  const sorted = useMemo(() => [...history].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()), [history]);

  if (sorted.length === 0) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center">
        <BarChart3 className="w-8 h-8 text-slate-600 mx-auto mb-3" />
        <p className="text-slate-500 text-sm">No trend data yet. Analyze a repo multiple times to see score trends over time.</p>
      </div>
    );
  }

  const latest = sorted[sorted.length - 1];
  const previous = sorted.length > 1 ? sorted[sorted.length - 2] : latest;
  const overallAvg = avgScore(latest);
  const prevAvg = avgScore(previous);
  const categories = ['maintenance', 'documentation', 'innovation', 'security'] as const;

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-white font-black text-lg">{repoName ? `${repoName} Trends` : 'Score Trends'}</h3>
          <p className="text-slate-500 text-xs mt-0.5">{sorted.length} analysis{sorted.length !== 1 ? 'es' : ''} tracked</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-black text-white">{overallAvg}<span className="text-base text-slate-500">/100</span></div>
          {sorted.length > 1 && <TrendBadge current={overallAvg} previous={prevAvg} />}
        </div>
      </div>

      {/* Overall Sparkline */}
      {sorted.length >= 2 && (
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Overall Score</span>
            <TrendBadge current={overallAvg} previous={prevAvg} />
          </div>
          <SparkLine values={sorted.map(avgScore)} color="#818cf8" width={280} height={40} />
          <div className="flex justify-between mt-2">
            <span className="text-[10px] text-slate-600">{new Date(sorted[0].date).toLocaleDateString()}</span>
            <span className="text-[10px] text-slate-600">{new Date(sorted[sorted.length - 1].date).toLocaleDateString()}</span>
          </div>
        </div>
      )}

      {/* Category Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {categories.map(cat => {
          const currentVal = latest[cat];
          const prevVal = previous[cat];
          const values = sorted.map(p => p[cat]);

          return (
            <div key={cat} className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[cat] }} />
                  <span className="text-xs font-bold text-slate-400">{LABELS[cat]}</span>
                </div>
                <span className="text-sm font-black text-white">{currentVal}</span>
              </div>
              {sorted.length >= 2 ? (
                <div className="flex items-center justify-between">
                  <SparkLine values={values} color={COLORS[cat]} width={100} height={28} />
                  <TrendBadge current={currentVal} previous={prevVal} />
                </div>
              ) : (
                <div className="h-7 flex items-center">
                  <div className="w-full bg-slate-800 rounded-full h-2">
                    <div className="h-2 rounded-full" style={{ width: `${currentVal}%`, backgroundColor: COLORS[cat] }} />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Timeline */}
      {sorted.length >= 2 && (
        <div>
          <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Analysis Timeline</div>
          <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin">
            {[...sorted].reverse().map((point, i) => {
              const avg = avgScore(point);
              const prev = i < sorted.length - 1 ? sorted[sorted.length - 2 - i] : point;
              return (
                <div key={point.date} className="flex items-center gap-3 text-xs">
                  <span className="text-slate-600 w-20 flex-shrink-0">{new Date(point.date).toLocaleDateString()}</span>
                  <div className="flex-1 bg-slate-800 rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full bg-indigo-500 transition-all"
                      style={{ width: `${avg}%` }}
                    />
                  </div>
                  <span className="text-white font-bold w-8 text-right">{avg}</span>
                  {i < sorted.length - 1 && <TrendBadge current={avg} previous={avgScore(prev)} />}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export { TrendChart };
export type { ScorePoint };
export default TrendChart;
