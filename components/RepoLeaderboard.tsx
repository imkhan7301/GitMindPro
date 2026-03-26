import React, { useMemo } from 'react';
import { Trophy, TrendingUp, TrendingDown, Minus, Heart } from 'lucide-react';
import type { SavedAnalysis } from '../types';

interface RepoLeaderboardProps {
  analyses: SavedAnalysis[];
  onSelectRepo: (repoUrl: string) => void;
}

interface LeaderboardEntry {
  repoKey: string;
  repoOwner: string;
  repoName: string;
  repoUrl: string;
  latestScore: number;
  prevScore: number | null;
  delta: number | null;
  techStack: string[];
  analysedAt: string;
}

const scoreToGrade = (score: number): string => {
  if (score >= 90) return 'A+';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C';
  if (score >= 50) return 'D';
  return 'F';
};

const gradeColor = (score: number): string => {
  if (score >= 80) return 'text-emerald-400';
  if (score >= 60) return 'text-amber-400';
  return 'text-rose-400';
};

const RepoLeaderboard: React.FC<RepoLeaderboardProps> = ({ analyses, onSelectRepo }) => {
  const entries = useMemo<LeaderboardEntry[]>(() => {
    // Group by repo, sorted by createdAt desc within each group
    const map = new Map<string, SavedAnalysis[]>();
    for (const a of analyses) {
      if (!a.scorecard) continue;
      const key = `${a.repoOwner}/${a.repoName}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(a);
    }

    const rows: LeaderboardEntry[] = [];
    for (const [key, items] of map) {
      const sorted = [...items].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      const latest = sorted[0];
      const prev = sorted[1] ?? null;
      const sc = latest.scorecard!;
      const latestScore = Math.round((sc.maintenance + sc.documentation + sc.innovation + sc.security) / 4 * 10);
      let prevScore: number | null = null;
      if (prev?.scorecard) {
        const psc = prev.scorecard;
        prevScore = Math.round((psc.maintenance + psc.documentation + psc.innovation + psc.security) / 4 * 10);
      }
      rows.push({
        repoKey: key,
        repoOwner: latest.repoOwner,
        repoName: latest.repoName,
        repoUrl: latest.repoUrl,
        latestScore,
        prevScore,
        delta: prevScore !== null ? latestScore - prevScore : null,
        techStack: latest.techStack?.slice(0, 3) ?? [],
        analysedAt: latest.createdAt,
      });
    }

    return rows.sort((a, b) => b.latestScore - a.latestScore);
  }, [analyses]);

  if (entries.length === 0) return null;

  const lowestIdx = entries.length > 1 ? entries.length - 1 : -1;

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-[2rem] p-6 shadow-xl">
      <div className="flex items-center gap-2 mb-5">
        <Trophy className="w-4 h-4 text-amber-400" />
        <h2 className="text-sm font-black text-white">Repo Leaderboard</h2>
        <span className="text-[10px] text-slate-500 ml-1">{entries.length} repos ranked</span>
      </div>

      <div className="space-y-2">
        {entries.map((entry, idx) => {
          const grade = scoreToGrade(entry.latestScore);
          const isFirst = idx === 0;
          const isLast = idx === lowestIdx;
          const deltaMag = Math.abs(entry.delta ?? 0);

          return (
            <button
              key={entry.repoKey}
              onClick={() => onSelectRepo(entry.repoUrl)}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800/60 transition-all text-left group"
            >
              {/* Rank */}
              <span className={`w-6 text-center text-xs font-black shrink-0 ${
                idx === 0 ? 'text-amber-400' : idx === 1 ? 'text-slate-400' : idx === 2 ? 'text-orange-600' : 'text-slate-600'
              }`}>
                {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
              </span>

              {/* Repo name */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-200 group-hover:text-white transition-colors truncate">
                    {entry.repoOwner}/{entry.repoName}
                  </span>
                  {isLast && (
                    <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-black bg-rose-500/15 text-rose-400 border border-rose-500/20 shrink-0">
                      <Heart className="w-2.5 h-2.5" /> Needs Love
                    </span>
                  )}
                  {isFirst && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-500/15 text-amber-400 border border-amber-500/20 shrink-0">
                      Top Repo
                    </span>
                  )}
                </div>
                <div className="flex gap-1 mt-1">
                  {entry.techStack.map(t => (
                    <span key={t} className="text-[9px] text-slate-500">{t}</span>
                  ))}
                </div>
              </div>

              {/* Delta */}
              {entry.delta !== null && deltaMag > 0 && (
                <div className={`flex items-center gap-0.5 text-[10px] font-bold shrink-0 ${
                  entry.delta > 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {entry.delta > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {entry.delta > 0 ? '+' : ''}{entry.delta}
                </div>
              )}
              {entry.delta === 0 && (
                <Minus className="w-3 h-3 text-slate-600 shrink-0" />
              )}

              {/* Score + Grade */}
              <div className="text-right shrink-0">
                <div className={`text-sm font-black ${gradeColor(entry.latestScore)}`}>{grade}</div>
                <div className="text-[10px] text-slate-500">{entry.latestScore}/100</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default RepoLeaderboard;
