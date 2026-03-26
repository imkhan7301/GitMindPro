import { useState, useEffect } from 'react';
import { CheckCircle2, Circle, ChevronDown, ChevronUp, Zap, RefreshCw } from 'lucide-react';

export interface OnboardingTask {
  id: string;
  day: number;
  title: string;
  description: string;
  category: 'explore' | 'understand' | 'build' | 'review' | 'deploy';
  estimateMinutes: number;
  files?: string[];
}

export interface GeneratedOnboardingChecklist {
  repoName: string;
  vibeMode: string;
  tasks: OnboardingTask[];
  summary: string;
}

interface Props {
  onGenerate: () => Promise<GeneratedOnboardingChecklist>;
  loading?: boolean;
  repoName?: string;
  vibeMode?: string;
}

const CATEGORY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  explore: { label: 'Explore', color: 'text-sky-400', bg: 'bg-sky-500/10 border-sky-500/20' },
  understand: { label: 'Understand', color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' },
  build: { label: 'Build', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  review: { label: 'Review', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  deploy: { label: 'Deploy', color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20' },
};

const STORAGE_KEY = 'gitmind.onboardingChecklist';

export default function OnboardingChecklist({ onGenerate, loading: externalLoading, repoName, vibeMode }: Props) {
  const [checklist, setChecklist] = useState<GeneratedOnboardingChecklist | null>(null);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedDay, setExpandedDay] = useState<number | null>(1);

  // Persist completed tasks
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY + (repoName || ''));
    if (saved) {
      try { setCompleted(new Set(JSON.parse(saved))); } catch { /* ignore */ }
    }
  }, [repoName]);

  const toggle = (id: string) => {
    setCompleted(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      localStorage.setItem(STORAGE_KEY + (repoName || ''), JSON.stringify([...next]));
      return next;
    });
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await onGenerate();
      setChecklist(res);
      setCompleted(new Set());
      setExpandedDay(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  const isLoading = loading || externalLoading;
  const days = checklist ? [...new Set(checklist.tasks.map(t => t.day))].sort() : [];
  const totalDone = completed.size;
  const totalTasks = checklist?.tasks.length || 0;
  const progress = totalTasks > 0 ? Math.round((totalDone / totalTasks) * 100) : 0;

  return (
    <div className="space-y-5">
      {/* Header card */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-[3rem] p-10 shadow-2xl">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-2xl font-black text-white flex items-center gap-3 mb-1">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" /> Smart Onboarding Checklist
            </h2>
            <p className="text-slate-400 text-sm">
              AI-generated Day 1–3 plan personalized to this repo {vibeMode ? `for ${vibeMode} mode` : ''}.
            </p>
          </div>
          <button
            onClick={handleGenerate}
            disabled={isLoading}
            className="shrink-0 flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-xl text-sm font-bold text-white transition-all"
          >
            {checklist ? <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} /> : <Zap className="w-4 h-4" />}
            {isLoading ? 'Generating...' : checklist ? 'Regenerate' : 'Generate Checklist'}
          </button>
        </div>

        {checklist && (
          <>
            {/* Progress bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Progress</span>
                <span className="text-xs font-black text-white">{totalDone}/{totalTasks} tasks · {progress}%</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-indigo-500 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {progress === 100 && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-center">
                <p className="text-emerald-400 font-black text-sm">🎉 All done! You&apos;re fully onboarded. Time to ship!</p>
              </div>
            )}
          </>
        )}

        {error && <p className="text-rose-400 text-xs font-bold mt-2">{error}</p>}
      </div>

      {/* Day-by-day tasks */}
      {checklist && days.map(day => {
        const dayTasks = checklist.tasks.filter(t => t.day === day);
        const dayDone = dayTasks.filter(t => completed.has(t.id)).length;
        const isExpanded = expandedDay === day;

        return (
          <div key={day} className="bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            <button
              onClick={() => setExpandedDay(isExpanded ? null : day)}
              className="w-full flex items-center justify-between px-8 py-5 hover:bg-slate-800/30 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-black ${
                  dayDone === dayTasks.length ? 'bg-emerald-500/20 text-emerald-400' : 'bg-indigo-500/20 text-indigo-400'
                }`}>
                  D{day}
                </div>
                <div className="text-left">
                  <p className="text-white font-black text-sm">Day {day}</p>
                  <p className="text-xs text-slate-500">{dayDone}/{dayTasks.length} complete</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{ width: `${(dayDone / dayTasks.length) * 100}%` }}
                  />
                </div>
                {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </div>
            </button>

            {isExpanded && (
              <div className="px-8 pb-6 space-y-3">
                {dayTasks.map(task => {
                  const isDone = completed.has(task.id);
                  const cat = CATEGORY_CONFIG[task.category];
                  return (
                    <button
                      key={task.id}
                      onClick={() => toggle(task.id)}
                      className={`w-full text-left p-4 rounded-2xl border transition-all ${
                        isDone
                          ? 'bg-emerald-500/5 border-emerald-500/20 opacity-70'
                          : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {isDone
                          ? <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                          : <Circle className="w-5 h-5 text-slate-600 shrink-0 mt-0.5" />}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className={`text-sm font-black ${isDone ? 'text-slate-500 line-through' : 'text-white'}`}>{task.title}</span>
                            {cat && (
                              <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg border ${cat.bg} ${cat.color}`}>
                                {cat.label}
                              </span>
                            )}
                            <span className="text-[10px] text-slate-600">~{task.estimateMinutes}min</span>
                          </div>
                          <p className="text-xs text-slate-500 leading-relaxed">{task.description}</p>
                          {task.files && task.files.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {task.files.map(f => (
                                <span key={f} className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">{f}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
