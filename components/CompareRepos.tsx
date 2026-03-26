import React, { useState, useCallback } from 'react';
import { Scorecard, AnalysisResult } from '../types';
import { parseGithubUrl, fetchRepoDetails, fetchRepoStructure, fetchFileContent } from '../services/githubService';
import { analyzeRepository } from '../services/geminiService';
import { GitBranch, TrendingUp, TrendingDown, Minus, Loader2, ArrowRight, RotateCcw, Shield, BookOpen, Lightbulb, Wrench, Trophy, Search } from 'lucide-react';

interface RepoSummary {
  url: string;
  name: string;
  fullName: string;
  description: string;
  stars: number;
  forks: number;
  language: string;
  techStack: string[];
  scorecard: Scorecard;
  summary: string;
}

const scoreAvg = (s: Scorecard) => Math.round((s.maintenance + s.documentation + s.innovation + s.security) / 4);

const gradeFromScore = (score: number): { letter: string; color: string } => {
  if (score >= 90) return { letter: 'A+', color: 'text-emerald-400' };
  if (score >= 80) return { letter: 'A', color: 'text-emerald-400' };
  if (score >= 70) return { letter: 'B+', color: 'text-lime-400' };
  if (score >= 60) return { letter: 'B', color: 'text-amber-400' };
  if (score >= 50) return { letter: 'C', color: 'text-amber-500' };
  if (score >= 40) return { letter: 'D', color: 'text-orange-400' };
  return { letter: 'F', color: 'text-red-400' };
};

const DiffIndicator: React.FC<{ a: number; b: number }> = ({ a, b }) => {
  const diff = a - b;
  if (diff > 0) return <span className="flex items-center gap-0.5 text-emerald-400 text-xs font-bold"><TrendingUp className="w-3 h-3" />+{diff}</span>;
  if (diff < 0) return <span className="flex items-center gap-0.5 text-red-400 text-xs font-bold"><TrendingDown className="w-3 h-3" />{diff}</span>;
  return <span className="flex items-center gap-0.5 text-slate-600 text-xs"><Minus className="w-3 h-3" />Tied</span>;
};

const ScoreBar: React.FC<{ label: string; icon: React.ElementType; scoreA: number; scoreB: number }> = ({ label, icon: Icon, scoreA, scoreB }) => (
  <div className="mb-4">
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-2 text-sm text-slate-400"><Icon className="w-3.5 h-3.5" /> {label}</div>
      <DiffIndicator a={scoreA} b={scoreB} />
    </div>
    <div className="flex gap-2 items-center">
      <div className="flex-1 bg-slate-800 rounded-full h-3 overflow-hidden">
        <div className="h-full bg-indigo-500 rounded-full transition-all duration-700" style={{ width: `${scoreA}%` }} />
      </div>
      <span className="text-xs font-bold text-indigo-400 w-8 text-right">{scoreA}</span>
      <span className="text-xs text-slate-700">vs</span>
      <span className="text-xs font-bold text-violet-400 w-8">{scoreB}</span>
      <div className="flex-1 bg-slate-800 rounded-full h-3 overflow-hidden">
        <div className="h-full bg-violet-500 rounded-full transition-all duration-700" style={{ width: `${scoreB}%` }} />
      </div>
    </div>
  </div>
);

const CompareRepos: React.FC = () => {
  const [urlA, setUrlA] = useState('');
  const [urlB, setUrlB] = useState('');
  const [repoA, setRepoA] = useState<RepoSummary | null>(null);
  const [repoB, setRepoB] = useState<RepoSummary | null>(null);
  const [loadingA, setLoadingA] = useState(false);
  const [loadingB, setLoadingB] = useState(false);
  const [error, setError] = useState('');

  const analyzeRepo = useCallback(async (url: string): Promise<RepoSummary | null> => {
    const parsed = parseGithubUrl(url);
    if (!parsed) {
      setError('Invalid GitHub URL');
      return null;
    }

    try {
      const details = await fetchRepoDetails(parsed.owner, parsed.repo);
      const tree = await fetchRepoStructure(parsed.owner, parsed.repo, details.defaultBranch, { maxEntries: 1500 });
      const readme = await fetchFileContent(parsed.owner, parsed.repo, 'README.md').catch(() => '');
      const analysis: AnalysisResult = await analyzeRepository(
        JSON.stringify(details),
        JSON.stringify(tree.slice(0, 40)),
        readme
      );

      return {
        url,
        name: details.repo,
        fullName: `${details.owner}/${details.repo}`,
        description: details.description,
        stars: details.stars,
        forks: details.forks,
        language: details.language,
        techStack: analysis.techStack || [],
        scorecard: analysis.scorecard,
        summary: analysis.summary,
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
      return null;
    }
  }, []);

  const handleCompare = useCallback(async () => {
    if (!urlA.trim() || !urlB.trim()) {
      setError('Enter two GitHub repo URLs to compare');
      return;
    }
    setError('');
    setRepoA(null);
    setRepoB(null);
    setLoadingA(true);
    setLoadingB(true);

    const [resultA, resultB] = await Promise.all([
      analyzeRepo(urlA).finally(() => setLoadingA(false)),
      analyzeRepo(urlB).finally(() => setLoadingB(false)),
    ]);

    setRepoA(resultA);
    setRepoB(resultB);
  }, [urlA, urlB, analyzeRepo]);

  const handleReset = () => {
    setUrlA('');
    setUrlB('');
    setRepoA(null);
    setRepoB(null);
    setError('');
  };

  const hasResults = repoA && repoB;
  const isLoading = loadingA || loadingB;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-3">
            <GitBranch className="w-6 h-6 text-indigo-400" /> Compare Repos
          </h2>
          <p className="text-slate-500 text-sm mt-1">Side-by-side AI analysis of two repositories</p>
        </div>
        {hasResults && (
          <button onClick={handleReset} className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold text-slate-300 transition-all">
            <RotateCcw className="w-3.5 h-3.5" /> New Comparison
          </button>
        )}
      </div>

      {/* URL Inputs */}
      {!hasResults && (
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Repo A</label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                <input
                  value={urlA}
                  onChange={e => setUrlA(e.target.value)}
                  placeholder="https://github.com/owner/repo"
                  className="w-full bg-slate-900 border border-indigo-500/30 rounded-xl pl-11 pr-4 py-3.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-indigo-500/60 transition-colors"
                  disabled={isLoading}
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Repo B</label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                <input
                  value={urlB}
                  onChange={e => setUrlB(e.target.value)}
                  placeholder="https://github.com/owner/repo"
                  className="w-full bg-slate-900 border border-violet-500/30 rounded-xl pl-11 pr-4 py-3.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-violet-500/60 transition-colors"
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

          <button
            onClick={handleCompare}
            disabled={isLoading || !urlA.trim() || !urlB.trim()}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-black rounded-2xl transition-all text-sm flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing {loadingA && loadingB ? 'both repos' : loadingA ? 'Repo A' : 'Repo B'}...</>
            ) : (
              <><ArrowRight className="w-4 h-4" /> Compare Repositories</>
            )}
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[loadingA, loadingB].map((loading, i) => (
            <div key={i} className={`border rounded-2xl p-8 text-center ${loading ? 'bg-slate-900/60 border-slate-800 animate-pulse' : 'bg-slate-900/30 border-slate-800/50'}`}>
              {loading ? (
                <>
                  <Loader2 className="w-8 h-8 text-indigo-400 mx-auto mb-4 animate-spin" />
                  <p className="text-slate-400 text-sm font-bold">Analyzing Repo {i === 0 ? 'A' : 'B'}...</p>
                  <p className="text-slate-600 text-xs mt-1">AI is scanning architecture, security, and code quality</p>
                </>
              ) : (
                <>
                  <div className="w-8 h-8 text-emerald-400 mx-auto mb-4">✓</div>
                  <p className="text-emerald-400 text-sm font-bold">Done!</p>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Results */}
      {hasResults && (
        <div>
          {/* Winner Banner */}
          {(() => {
            const avgA = scoreAvg(repoA.scorecard);
            const avgB = scoreAvg(repoB.scorecard);
            const winner = avgA > avgB ? repoA : avgB > avgA ? repoB : null;
            const diff = Math.abs(avgA - avgB);
            return (
              <div className={`rounded-2xl p-6 mb-8 border text-center ${winner ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-slate-900/40 border-slate-800'}`}>
                <Trophy className={`w-8 h-8 mx-auto mb-3 ${winner ? 'text-amber-400' : 'text-slate-600'}`} />
                {winner ? (
                  <>
                    <h3 className="text-lg font-black text-white mb-1">{winner.fullName} wins by {diff} points</h3>
                    <p className="text-slate-400 text-sm">Overall score: {winner === repoA ? avgA : avgB} vs {winner === repoA ? avgB : avgA}</p>
                  </>
                ) : (
                  <>
                    <h3 className="text-lg font-black text-white mb-1">It&apos;s a tie!</h3>
                    <p className="text-slate-400 text-sm">Both repos scored {avgA} overall</p>
                  </>
                )}
              </div>
            );
          })()}

          {/* Repo Headers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {[repoA, repoB].map((repo, i) => {
              const avg = scoreAvg(repo.scorecard);
              const grade = gradeFromScore(avg);
              return (
                <div key={repo.fullName} className={`bg-slate-900/60 border rounded-2xl p-6 ${i === 0 ? 'border-indigo-500/30' : 'border-violet-500/30'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-black text-white">{repo.fullName}</h3>
                    <span className={`text-3xl font-black ${grade.color}`}>{grade.letter}</span>
                  </div>
                  <p className="text-slate-400 text-xs mb-4 line-clamp-2">{repo.description || 'No description'}</p>
                  <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
                    <span>⭐ {repo.stars.toLocaleString()}</span>
                    <span>🔱 {repo.forks.toLocaleString()}</span>
                    <span>{repo.language || 'Mixed'}</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {repo.techStack.slice(0, 6).map(tech => (
                      <span key={tech} className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${i === 0 ? 'bg-indigo-500/10 text-indigo-400' : 'bg-violet-500/10 text-violet-400'}`}>
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Score Breakdown */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 mb-8">
            <h3 className="text-base font-black text-white mb-6 flex items-center gap-2">Score Breakdown</h3>
            <div className="flex items-center justify-between mb-4 text-[10px] font-bold uppercase tracking-widest text-slate-600">
              <span className="text-indigo-400">{repoA.fullName}</span>
              <span className="text-violet-400">{repoB.fullName}</span>
            </div>
            <ScoreBar label="Maintenance" icon={Wrench} scoreA={repoA.scorecard.maintenance} scoreB={repoB.scorecard.maintenance} />
            <ScoreBar label="Documentation" icon={BookOpen} scoreA={repoA.scorecard.documentation} scoreB={repoB.scorecard.documentation} />
            <ScoreBar label="Innovation" icon={Lightbulb} scoreA={repoA.scorecard.innovation} scoreB={repoB.scorecard.innovation} />
            <ScoreBar label="Security" icon={Shield} scoreA={repoA.scorecard.security} scoreB={repoB.scorecard.security} />
          </div>

          {/* Summaries */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[repoA, repoB].map((repo, i) => (
              <div key={repo.fullName} className={`bg-slate-900/40 border rounded-2xl p-6 ${i === 0 ? 'border-indigo-500/20' : 'border-violet-500/20'}`}>
                <h4 className="text-sm font-black text-white mb-3">{repo.name} — AI Summary</h4>
                <p className="text-slate-400 text-xs leading-relaxed">{repo.summary}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CompareRepos;
