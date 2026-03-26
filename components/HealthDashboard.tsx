import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus, Shield, AlertTriangle, Activity, BarChart3, ArrowRight, CheckCircle2 } from 'lucide-react';
import type { SavedAnalysis, Scorecard } from '../types';

interface Props {
  history: SavedAnalysis[];
  watchedRepos: Set<string>;
  onSelectRepo: (repoUrl: string) => void;
}

interface RepoTrend {
  repoKey: string;
  repoUrl: string;
  currentScore: number;
  previousScore: number;
  delta: number;
  trend: 'up' | 'down' | 'stable';
  scores: { date: string; maintenance: number; documentation: number; innovation: number; security: number; avg: number }[];
  lastAnalyzed: string;
  analysisCount: number;
}

const avgScore = (sc: Scorecard) => (sc.maintenance + sc.documentation + sc.innovation + sc.security) / 4;

const HealthDashboard: React.FC<Props> = ({ history, watchedRepos, onSelectRepo }) => {
  const repoTrends = useMemo(() => {
    const grouped: Record<string, SavedAnalysis[]> = {};
    for (const a of history) {
      const key = `${a.repoOwner}/${a.repoName}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(a);
    }

    const trends: RepoTrend[] = [];
    for (const [repoKey, analyses] of Object.entries(grouped)) {
      const sorted = [...analyses].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      const withScores = sorted.filter(a => a.scorecard);
      if (withScores.length === 0) continue;

      const scores = withScores.map(a => ({
        date: a.createdAt,
        maintenance: a.scorecard!.maintenance,
        documentation: a.scorecard!.documentation,
        innovation: a.scorecard!.innovation,
        security: a.scorecard!.security,
        avg: avgScore(a.scorecard!),
      }));

      const current = scores[scores.length - 1].avg;
      const previous = scores.length >= 2 ? scores[scores.length - 2].avg : current;
      const delta = Number((current - previous).toFixed(1));

      trends.push({
        repoKey,
        repoUrl: analyses[0].repoUrl,
        currentScore: Number(current.toFixed(1)),
        previousScore: Number(previous.toFixed(1)),
        delta,
        trend: delta > 0.2 ? 'up' : delta < -0.2 ? 'down' : 'stable',
        scores,
        lastAnalyzed: withScores[withScores.length - 1].createdAt,
        analysisCount: analyses.length,
      });
    }

    return trends.sort((a, b) => b.analysisCount - a.analysisCount);
  }, [history]);

  const overallHealth = useMemo(() => {
    if (repoTrends.length === 0) return null;
    const avg = repoTrends.reduce((s, t) => s + t.currentScore, 0) / repoTrends.length;
    const improving = repoTrends.filter(t => t.trend === 'up').length;
    const declining = repoTrends.filter(t => t.trend === 'down').length;
    const watchedCount = repoTrends.filter(t => watchedRepos.has(t.repoKey)).length;
    return { avg: avg.toFixed(1), improving, declining, total: repoTrends.length, watchedCount };
  }, [repoTrends, watchedRepos]);

  if (repoTrends.length === 0) {
    return (
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-10 text-center">
        <Activity className="w-12 h-12 text-slate-700 mx-auto mb-4" />
        <h3 className="text-white font-black text-lg mb-2">No Health Data Yet</h3>
        <p className="text-slate-500 text-sm">Analyze repos multiple times to see score trends and health tracking.</p>
      </div>
    );
  }

  const TrendIcon = ({ trend }: { trend: 'up' | 'down' | 'stable' }) => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4 text-emerald-400" />;
    if (trend === 'down') return <TrendingDown className="w-4 h-4 text-red-400" />;
    return <Minus className="w-4 h-4 text-slate-500" />;
  };

  const scoreColor = (s: number) => s >= 8 ? 'text-emerald-400' : s >= 6 ? 'text-yellow-400' : s >= 4 ? 'text-orange-400' : 'text-red-400';
  const scoreBg = (s: number) => s >= 8 ? 'bg-emerald-500/10 border-emerald-500/20' : s >= 6 ? 'bg-yellow-500/10 border-yellow-500/20' : s >= 4 ? 'bg-orange-500/10 border-orange-500/20' : 'bg-red-500/10 border-red-500/20';

  // Mini sparkline using inline SVG
  const Sparkline = ({ data }: { data: number[] }) => {
    if (data.length < 2) return null;
    const min = Math.min(...data) - 0.5;
    const max = Math.max(...data) + 0.5;
    const range = max - min || 1;
    const w = 120;
    const h = 32;
    const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(' ');
    const lastColor = data[data.length - 1] >= data[0] ? '#34d399' : '#f87171';
    return (
      <svg width={w} height={h} className="opacity-70">
        <polyline points={points} fill="none" stroke={lastColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={(data.length - 1) / (data.length - 1) * w} cy={h - ((data[data.length - 1] - min) / range) * h} r="3" fill={lastColor} />
      </svg>
    );
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      {overallHealth && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Portfolio Score</span>
            </div>
            <div className={`text-3xl font-black ${scoreColor(parseFloat(overallHealth.avg))}`}>{overallHealth.avg}</div>
            <p className="text-xs text-slate-600 mt-1">Avg across {overallHealth.total} repos</p>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Improving</span>
            </div>
            <div className="text-3xl font-black text-emerald-400">{overallHealth.improving}</div>
            <p className="text-xs text-slate-600 mt-1">Repos trending up</p>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-4 h-4 text-red-400" />
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Declining</span>
            </div>
            <div className="text-3xl font-black text-red-400">{overallHealth.declining}</div>
            <p className="text-xs text-slate-600 mt-1">Repos needing attention</p>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Monitored</span>
            </div>
            <div className="text-3xl font-black text-amber-400">{overallHealth.watchedCount}</div>
            <p className="text-xs text-slate-600 mt-1">Watched repos tracked</p>
          </div>
        </div>
      )}

      {/* Repo Health Cards */}
      <div className="space-y-3">
        <h3 className="text-white font-black text-sm uppercase tracking-widest flex items-center gap-2">
          <Activity className="w-4 h-4 text-indigo-400" /> Repository Health
        </h3>
        {repoTrends.map((repo) => (
          <div
            key={repo.repoKey}
            className={`${scoreBg(repo.currentScore)} border rounded-2xl p-5 hover:scale-[1.01] transition-all cursor-pointer`}
            onClick={() => onSelectRepo(repo.repoUrl)}
          >
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className={`text-2xl font-black ${scoreColor(repo.currentScore)}`}>
                  {repo.currentScore}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-black text-sm">{repo.repoKey}</span>
                    {watchedRepos.has(repo.repoKey) && (
                      <span className="text-[10px] font-bold bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">WATCHED</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                    <span>{repo.analysisCount} analyses</span>
                    <span>Last: {new Date(repo.lastAnalyzed).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <Sparkline data={repo.scores.map(s => s.avg)} />
                <div className="flex items-center gap-1.5">
                  <TrendIcon trend={repo.trend} />
                  <span className={`text-sm font-black ${repo.trend === 'up' ? 'text-emerald-400' : repo.trend === 'down' ? 'text-red-400' : 'text-slate-500'}`}>
                    {repo.delta > 0 ? '+' : ''}{repo.delta}
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-600" />
              </div>
            </div>

            {/* Category breakdown mini-bars */}
            {repo.scores.length > 0 && (
              <div className="grid grid-cols-4 gap-3 mt-4">
                {(['maintenance', 'documentation', 'innovation', 'security'] as const).map(cat => {
                  const val = repo.scores[repo.scores.length - 1][cat];
                  const prev = repo.scores.length >= 2 ? repo.scores[repo.scores.length - 2][cat] : val;
                  const d = val - prev;
                  return (
                    <div key={cat} className="text-center">
                      <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">{cat.slice(0, 5)}</div>
                      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${val >= 8 ? 'bg-emerald-500' : val >= 6 ? 'bg-yellow-500' : val >= 4 ? 'bg-orange-500' : 'bg-red-500'}`} style={{ width: `${val * 10}%` }} />
                      </div>
                      <div className="text-[10px] mt-0.5">
                        <span className={scoreColor(val)}>{val}</span>
                        {d !== 0 && <span className={`ml-1 ${d > 0 ? 'text-emerald-500' : 'text-red-500'}`}>{d > 0 ? '+' : ''}{d}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Alerts Summary */}
      {repoTrends.some(r => r.trend === 'down') && (
        <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-5">
          <h4 className="text-red-400 font-black text-sm flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4" /> Attention Needed
          </h4>
          <ul className="space-y-2">
            {repoTrends.filter(r => r.trend === 'down').map(r => (
              <li key={r.repoKey} className="flex items-center justify-between text-sm">
                <span className="text-slate-300">{r.repoKey}</span>
                <span className="text-red-400 font-bold">{r.delta} since last analysis</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {repoTrends.some(r => r.trend === 'up') && (
        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-5">
          <h4 className="text-emerald-400 font-black text-sm flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-4 h-4" /> Improving
          </h4>
          <ul className="space-y-2">
            {repoTrends.filter(r => r.trend === 'up').map(r => (
              <li key={r.repoKey} className="flex items-center justify-between text-sm">
                <span className="text-slate-300">{r.repoKey}</span>
                <span className="text-emerald-400 font-bold">+{r.delta} since last analysis</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default HealthDashboard;
