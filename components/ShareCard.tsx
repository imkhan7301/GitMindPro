import { useState, useRef } from 'react';
import { Twitter, Linkedin, Copy, CheckCircle2, Share2, X, ExternalLink } from 'lucide-react';

interface Scorecard {
  maintenance: number;
  documentation: number;
  innovation: number;
  security: number;
}

interface Props {
  repoOwner: string;
  repoName: string;
  scorecard: Scorecard;
  summary: string;
  techStack: string[];
  shareUrl?: string;
  onClose: () => void;
}

const GRADE = (n: number) => n >= 8.5 ? 'A' : n >= 7 ? 'B' : n >= 5.5 ? 'C' : n >= 4 ? 'D' : 'F';
const avg = (...ns: number[]) => Math.round(ns.reduce((s, v) => s + v, 0) / ns.length);

const TWITTER_BLUE = 'hover:bg-[#1DA1F2]/20 hover:border-[#1DA1F2]/40 hover:text-[#1DA1F2]';
const LINKEDIN_BLUE = 'hover:bg-[#0A66C2]/20 hover:border-[#0A66C2]/40 hover:text-[#0A66C2]';

export default function ShareCard({ repoOwner, repoName, scorecard, summary, techStack, shareUrl, onClose }: Props) {
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const overall = avg(
    scorecard.maintenance,
    scorecard.documentation,
    scorecard.innovation,
    scorecard.security,
  );
  const grade = GRADE(overall);
  const url = shareUrl || `https://gitmindpro.com`;
  const repo = `${repoOwner}/${repoName}`;

  const tweetText = `🧠 Just analyzed ${repo} with @GitMindPro\n\nMaintenance: ${scorecard.maintenance}/10 · Security: ${scorecard.security}/10 · Overall grade: ${grade}\n\n"${summary.slice(0, 120)}..."\n\n${url}`;
  const linkedInText = `I just analyzed ${repo} using GitMindPro AI Code Intelligence.\n\nScores:\n• Maintenance: ${scorecard.maintenance}/10\n• Documentation: ${scorecard.documentation}/10\n• Innovation: ${scorecard.innovation}/10\n• Security: ${scorecard.security}/10\n\nOverall Grade: ${grade}\n\nTry it free: ${url}`;

  const copyLink = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openTwitter = () =>
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`, '_blank', 'noopener');

  const openLinkedIn = () =>
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&summary=${encodeURIComponent(linkedInText)}`, '_blank', 'noopener');

  const CAT_COLOR = (v: number) =>
    v >= 8 ? 'bg-emerald-500' : v >= 6 ? 'bg-cyan-500' : v >= 4 ? 'bg-yellow-500' : 'bg-red-500';

  const GRADE_COLOR: Record<string, string> = {
    A: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10',
    B: 'text-cyan-400 border-cyan-500/40 bg-cyan-500/10',
    C: 'text-yellow-400 border-yellow-500/40 bg-yellow-500/10',
    D: 'text-orange-400 border-orange-500/40 bg-orange-500/10',
    F: 'text-red-400 border-red-500/40 bg-red-500/10',
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-white font-black">
            <Share2 className="w-5 h-5 text-indigo-400" />
            Share Analysis
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Card Preview */}
        <div
          ref={cardRef}
          className="relative bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 border border-indigo-500/20 rounded-3xl p-7 mb-4 shadow-2xl overflow-hidden"
        >
          {/* Background glow */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-violet-600/10 rounded-full blur-2xl" />
          </div>

          {/* GitMindPro badge */}
          <div className="flex items-center justify-between mb-5 relative">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-black text-sm">G</span>
              </div>
              <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">GitMindPro</span>
            </div>
            <div className={`px-3 py-1.5 rounded-xl border text-2xl font-black ${GRADE_COLOR[grade]}`}>
              {grade}
            </div>
          </div>

          {/* Repo name */}
          <div className="mb-5 relative">
            <p className="text-slate-500 text-xs font-bold mb-0.5">{repoOwner} /</p>
            <h2 className="text-2xl font-black text-white tracking-tight">{repoName}</h2>
          </div>

          {/* Score bars */}
          <div className="space-y-2.5 mb-5 relative">
            {(['maintenance', 'documentation', 'innovation', 'security'] as const).map((cat) => {
              const val = scorecard[cat];
              return (
                <div key={cat} className="flex items-center gap-3">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 w-20 shrink-0">{cat}</span>
                  <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${CAT_COLOR(val)}`}
                      style={{ width: `${val * 10}%` }}
                    />
                  </div>
                  <span className="text-xs font-black text-white w-6 text-right">{val}</span>
                </div>
              );
            })}
          </div>

          {/* Summary snippet */}
          <p className="text-slate-400 text-xs leading-relaxed mb-5 relative line-clamp-2">&quot;{summary.slice(0, 140)}&quot;</p>

          {/* Tech stack */}
          {techStack.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-5 relative">
              {techStack.slice(0, 6).map((t) => (
                <span key={t} className="text-[9px] font-bold px-2 py-0.5 bg-slate-800/80 border border-slate-700 rounded-full text-slate-400">
                  {t}
                </span>
              ))}
              {techStack.length > 6 && (
                <span className="text-[9px] font-bold px-2 py-0.5 bg-slate-800/80 border border-slate-700 rounded-full text-slate-500">
                  +{techStack.length - 6}
                </span>
              )}
            </div>
          )}

          {/* URL footer */}
          <div className="flex items-center gap-1.5 relative">
            <ExternalLink className="w-3 h-3 text-indigo-400" />
            <span className="text-xs text-indigo-400 font-bold">gitmindpro.com</span>
          </div>
        </div>

        {/* Share buttons */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={openTwitter}
            className={`flex items-center justify-center gap-2 px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-2xl text-white text-xs font-black transition-all ${TWITTER_BLUE}`}
          >
            <Twitter className="w-4 h-4" />
            Tweet
          </button>
          <button
            onClick={openLinkedIn}
            className={`flex items-center justify-center gap-2 px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-2xl text-white text-xs font-black transition-all ${LINKEDIN_BLUE}`}
          >
            <Linkedin className="w-4 h-4" />
            LinkedIn
          </button>
          <button
            onClick={copyLink}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-2xl text-white text-xs font-black transition-all hover:bg-emerald-500/20 hover:border-emerald-500/40 hover:text-emerald-400"
          >
            {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
        </div>

        {/* Reddit copy hint */}
        <p className="text-center text-[10px] text-slate-600 mt-3">
          For Reddit: copy link → post to r/webdev, r/nextjs, r/programming, r/SaaS
        </p>
      </div>
    </div>
  );
}
