import React, { useState } from 'react';
import { GitPullRequest, Copy, CheckCircle2, AlertTriangle, ShieldAlert, Zap, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import type { AIReviewResult, PRReviewComment } from '../services/geminiService';

interface PRReviewerProps {
  review: AIReviewResult;
  onPostReview?: () => void;
  posting?: boolean;
  postUrl?: string | null;
  prUrl?: string;
}

const SEVERITY_CONFIG: Record<PRReviewComment['severity'], { label: string; color: string; bg: string; border: string }> = {
  critical: { label: 'Critical', color: 'text-rose-300', bg: 'bg-rose-500/10', border: 'border-rose-500/30' },
  high:     { label: 'High',     color: 'text-orange-300', bg: 'bg-orange-500/10', border: 'border-orange-500/30' },
  medium:   { label: 'Medium',   color: 'text-amber-300', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
  suggestion: { label: 'Suggestion', color: 'text-sky-300', bg: 'bg-sky-500/10', border: 'border-sky-500/30' },
};

const VERDICT_CONFIG: Record<AIReviewResult['verdict'], { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  approve:         { label: 'Approve',         color: 'text-emerald-300', bg: 'bg-emerald-500/15 border-emerald-500/30', icon: <CheckCircle2 className="w-4 h-4" /> },
  request_changes: { label: 'Request Changes', color: 'text-rose-300',    bg: 'bg-rose-500/15 border-rose-500/30',    icon: <AlertTriangle className="w-4 h-4" /> },
  comment:         { label: 'Comment',         color: 'text-amber-300',   bg: 'bg-amber-500/15 border-amber-500/30',  icon: <GitPullRequest className="w-4 h-4" /> },
};

export default function PRReviewer({ review, onPostReview, posting, postUrl, prUrl }: PRReviewerProps) {
  const [copied, setCopied] = useState(false);
  const [expandBody, setExpandBody] = useState(false);
  const verdict = VERDICT_CONFIG[review.verdict] ?? VERDICT_CONFIG['comment'];

  const handleCopy = async () => {
    await navigator.clipboard.writeText(review.reviewBody);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const riskColor = review.riskScore >= 75 ? 'text-rose-400' : review.riskScore >= 50 ? 'text-orange-400' : review.riskScore >= 25 ? 'text-amber-400' : 'text-emerald-400';
  const riskBg = review.riskScore >= 75 ? 'bg-rose-500' : review.riskScore >= 50 ? 'bg-orange-500' : review.riskScore >= 25 ? 'bg-amber-500' : 'bg-emerald-500';

  return (
    <div className="space-y-6">
      {/* Verdict + Risk Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-bold ${verdict.bg} ${verdict.color}`}>
          {verdict.icon} {verdict.label}
        </div>
        <div className="flex-1 flex items-center gap-3">
          <span className="text-xs text-slate-500 whitespace-nowrap">Risk Score</span>
          <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
            <div className={`h-full ${riskBg} rounded-full transition-all`} style={{ width: `${review.riskScore}%` }} />
          </div>
          <span className={`text-sm font-black tabular-nums ${riskColor}`}>{review.riskScore}/100</span>
        </div>
      </div>

      {/* Summary */}
      <p className="text-slate-300 text-sm leading-relaxed border-l-2 border-slate-700 pl-4">{review.summary}</p>

      {/* Inline Comments */}
      {review.comments.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-500">Inline Findings ({review.comments.length})</h4>
          {review.comments.map((c, i) => {
            const s = SEVERITY_CONFIG[c.severity] ?? SEVERITY_CONFIG['medium'];
            return (
              <div key={i} className={`p-4 rounded-2xl border ${s.bg} ${s.border} space-y-1.5`}>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${s.bg} ${s.color} border ${s.border}`}>{s.label}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-slate-800 text-slate-400 border border-slate-700">{c.category}</span>
                  <span className="font-mono text-xs text-slate-400 truncate">{c.file}</span>
                </div>
                <p className={`text-sm font-semibold ${s.color}`}>{c.issue}</p>
                <p className="text-xs text-slate-400 leading-relaxed">💡 {c.suggestion}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Security Flags */}
      {review.securityFlags.length > 0 && (
        <div className="p-4 bg-rose-500/5 border border-rose-500/20 rounded-2xl space-y-2">
          <h4 className="text-xs font-black uppercase tracking-widest text-rose-400 flex items-center gap-1.5"><ShieldAlert className="w-3.5 h-3.5" /> Security Flags</h4>
          {review.securityFlags.map((f, i) => (
            <p key={i} className="text-xs text-rose-300 flex items-start gap-2"><span className="text-rose-500 mt-0.5">•</span>{f}</p>
          ))}
        </div>
      )}

      {/* Missing Tests */}
      {review.missingTests.length > 0 && (
        <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl space-y-2">
          <h4 className="text-xs font-black uppercase tracking-widest text-amber-400 flex items-center gap-1.5"><Zap className="w-3.5 h-3.5" /> Missing Tests</h4>
          {review.missingTests.map((t, i) => (
            <p key={i} className="text-xs text-amber-300 flex items-start gap-2"><span className="text-amber-500 mt-0.5">•</span>{t}</p>
          ))}
        </div>
      )}

      {/* Architecture Notes */}
      {review.architectureNotes.length > 0 && (
        <div className="space-y-1.5">
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-500">Architecture Notes</h4>
          {review.architectureNotes.map((n, i) => (
            <p key={i} className="text-xs text-slate-400 flex items-start gap-2"><span className="text-indigo-500 mt-0.5">→</span>{n}</p>
          ))}
        </div>
      )}

      {/* Full Review Body */}
      <div className="border border-slate-800 rounded-2xl overflow-hidden">
        <button
          onClick={() => setExpandBody(v => !v)}
          className="w-full flex items-center justify-between px-5 py-3 bg-slate-900/60 hover:bg-slate-800/60 transition-colors text-sm font-bold text-slate-300"
        >
          <span>Full Review Body (GitHub Markdown)</span>
          {expandBody ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
        </button>
        {expandBody && (
          <pre className="p-4 text-xs text-slate-400 font-mono whitespace-pre-wrap max-h-60 overflow-y-auto bg-slate-950">{review.reviewBody}</pre>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold text-slate-300 transition-all"
        >
          {copied ? <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy Review</>}
        </button>
        {onPostReview && !postUrl && (
          <button
            onClick={onPostReview}
            disabled={posting}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-xl text-xs font-bold text-white transition-all"
          >
            {posting ? 'Posting…' : <><GitPullRequest className="w-3.5 h-3.5" /> Post to GitHub</>}
          </button>
        )}
        {postUrl && (
          <a href={postUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-emerald-600/20 border border-emerald-500/30 rounded-xl text-xs font-bold text-emerald-300 transition-all hover:bg-emerald-600/30">
            <ExternalLink className="w-3.5 h-3.5" /> View on GitHub
          </a>
        )}
        {prUrl && (
          <a href={prUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold text-slate-400 transition-all">
            <ExternalLink className="w-3.5 h-3.5" /> Open PR
          </a>
        )}
      </div>
    </div>
  );
}
