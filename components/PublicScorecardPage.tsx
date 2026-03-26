import React, { useEffect, useState } from 'react';
import { getPublicAnalysis } from '../services/supabaseService';
import { Scorecard } from '../types';
import { Shield, TrendingUp, BookOpen, Wrench, GitBranch, ExternalLink, Copy, CheckCircle2 } from 'lucide-react';

interface PublicData {
  repoOwner: string;
  repoName: string;
  repoUrl: string;
  summary: string;
  techStack: string[];
  scorecard: Scorecard;
  createdAt: string;
}

interface Props {
  shareToken: string;
}

const CATEGORY_META = [
  { key: 'maintenance' as const, label: 'Maintenance', icon: Wrench, color: '#10b981', bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  { key: 'documentation' as const, label: 'Documentation', icon: BookOpen, color: '#3b82f6', bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  { key: 'innovation' as const, label: 'Innovation', icon: TrendingUp, color: '#8b5cf6', bg: 'bg-violet-500/10', text: 'text-violet-400', border: 'border-violet-500/20' },
  { key: 'security' as const, label: 'Security', icon: Shield, color: '#ef4444', bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20' },
];

const getGrade = (score: number): { letter: string; color: string } => {
  if (score >= 90) return { letter: 'A+', color: '#10b981' };
  if (score >= 80) return { letter: 'A', color: '#10b981' };
  if (score >= 70) return { letter: 'B', color: '#3b82f6' };
  if (score >= 60) return { letter: 'C', color: '#eab308' };
  if (score >= 50) return { letter: 'D', color: '#f97316' };
  return { letter: 'F', color: '#ef4444' };
};

const RadialScore: React.FC<{ score: number; size?: number }> = ({ score, size = 120 }) => {
  const r = (size / 2) - 10;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const grade = getGrade(score);
  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1e293b" strokeWidth={8} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={grade.color} strokeWidth={8}
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 1s ease' }}
      />
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle"
        className="rotate-90" style={{ rotate: '90deg' }}
        fill={grade.color} fontSize={size * 0.22} fontWeight="900"
        transform={`rotate(90, ${size / 2}, ${size / 2})`}>
        {score}
      </text>
    </svg>
  );
};

const PublicScorecardPage: React.FC<Props> = ({ shareToken }) => {
  const [data, setData] = useState<PublicData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    getPublicAnalysis(shareToken)
      .then(d => {
        if (!d) { setNotFound(true); return; }
        setData(d as PublicData);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [shareToken]);

  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
        <div className="text-6xl font-black text-slate-800">404</div>
        <p className="text-slate-500">This scorecard is private or doesn&apos;t exist.</p>
        <a href="/" className="text-indigo-400 hover:text-indigo-300 text-sm font-bold transition-colors">← Go to GitMind Pro</a>
      </div>
    );
  }

  const overall = Math.round(
    (data.scorecard.maintenance + data.scorecard.documentation + data.scorecard.innovation + data.scorecard.security) / 4
  );
  const grade = getGrade(overall);

  return (
    <div className="min-h-screen bg-[#030712] text-white">
      {/* Gradient bg */}
      <div className="fixed inset-0 bg-gradient-to-br from-indigo-950/20 via-transparent to-violet-950/10 pointer-events-none" />

      <div className="relative max-w-3xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-xs font-bold text-indigo-400 mb-6">
            <GitBranch className="w-3 h-3" /> GitMind Pro · Code Health Report
          </div>
          <h1 className="text-4xl font-black text-white mb-2">
            {data.repoOwner}/<span className="text-indigo-400">{data.repoName}</span>
          </h1>
          <a href={data.repoUrl} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-300 text-sm transition-colors">
            {data.repoUrl} <ExternalLink className="w-3 h-3" />
          </a>
          <p className="text-[11px] text-slate-600 mt-2">
            Analyzed {new Date(data.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Overall score */}
        <div className="flex flex-col items-center mb-12">
          <RadialScore score={overall} size={160} />
          <div className="mt-3 text-center">
            <div className="text-2xl font-black" style={{ color: grade.color }}>{grade.letter} Grade</div>
            <div className="text-slate-500 text-sm">Overall Health Score</div>
          </div>
        </div>

        {/* Category scores */}
        <div className="grid grid-cols-2 gap-4 mb-10">
          {CATEGORY_META.map(cat => {
            const score = data.scorecard[cat.key];
            const pct = `${score}%`;
            return (
              <div key={cat.key} className={`${cat.bg} border ${cat.border} rounded-2xl p-5`}>
                <div className="flex items-center gap-2 mb-3">
                  <cat.icon className={`w-4 h-4 ${cat.text}`} />
                  <span className="text-xs font-black uppercase tracking-widest text-slate-400">{cat.label}</span>
                </div>
                <div className={`text-3xl font-black mb-2 ${cat.text}`}>{score}</div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-1000" style={{ width: pct, backgroundColor: cat.color }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        {data.summary && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 mb-8">
            <div className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-3">AI Summary</div>
            <p className="text-slate-300 text-sm leading-relaxed">{data.summary}</p>
          </div>
        )}

        {/* Tech stack */}
        {data.techStack.length > 0 && (
          <div className="mb-10">
            <div className="text-[10px] uppercase tracking-widest font-bold text-slate-600 mb-3">Tech Stack</div>
            <div className="flex flex-wrap gap-2">
              {data.techStack.map(t => (
                <span key={t} className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-full text-xs font-bold text-slate-400">
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Share + CTA */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button onClick={copyLink} className="flex items-center gap-2 px-5 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-sm font-bold text-slate-300 transition-all w-full sm:w-auto justify-center">
            {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
          <a href="/" className="flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-black text-white transition-all w-full sm:w-auto justify-center">
            Analyze Your Repo — Free →
          </a>
        </div>

        {/* Powered by */}
        <div className="text-center mt-12 text-slate-700 text-xs">
          Powered by <span className="text-slate-500 font-bold">GitMind Pro</span> · AI-powered code intelligence
        </div>
      </div>
    </div>
  );
};

export default PublicScorecardPage;
