import { Zap, X, ArrowRight } from 'lucide-react';

interface Props {
  used: number;
  limit: number;
  plan: string;
  onUpgrade: () => void;
  onDismiss?: () => void;
  context?: 'analysis-done' | 'limit-near' | 'limit-hit';
}

const MESSAGES = {
  'limit-hit': {
    heading: "You've hit your daily limit",
    body: "Unlock unlimited analyses, PR reviews, and all AI features for $19/mo.",
    cta: 'Upgrade to Pro — $19/mo',
    accent: 'border-red-500/40 bg-red-500/5',
    ctaClass: 'bg-red-500 hover:bg-red-400',
    badge: 'Limit reached',
    badgeClass: 'bg-red-500/20 text-red-300 border-red-500/30',
  },
  'limit-near': {
    heading: '1 analysis remaining today',
    body: "You're almost out. Pro gives you unlimited access + PR analysis, dead code detection & more.",
    cta: 'Get Unlimited Access',
    accent: 'border-amber-500/40 bg-amber-500/5',
    ctaClass: 'bg-amber-500 hover:bg-amber-400 text-slate-900',
    badge: 'Almost out',
    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  },
  'analysis-done': {
    heading: 'Loving GitMindPro?',
    body: 'Get unlimited analyses, team workspaces, API access, and priority support.',
    cta: 'Start Free Trial',
    accent: 'border-indigo-500/30 bg-indigo-500/5',
    ctaClass: 'bg-indigo-600 hover:bg-indigo-500',
    badge: '7-day free trial',
    badgeClass: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  },
};

export default function SmartUpgradeNudge({ used, limit, plan, onUpgrade, onDismiss, context }: Props) {
  // Don't show if already on a paid plan
  if (plan !== 'free') return null;

  // Auto-select context
  const ctx = context ?? (used >= limit ? 'limit-hit' : used >= limit - 1 ? 'limit-near' : 'analysis-done');
  const msg = MESSAGES[ctx];

  return (
    <div className={`relative flex flex-col sm:flex-row items-start sm:items-center gap-4 border rounded-2xl p-4 sm:p-5 transition-all animate-in slide-in-from-bottom-2 duration-300 ${msg.accent}`}>
      <div className="w-9 h-9 shrink-0 rounded-xl bg-white/5 flex items-center justify-center">
        <Zap className="w-4 h-4 text-amber-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-sm font-black text-white">{msg.heading}</span>
          <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${msg.badgeClass}`}>{msg.badge}</span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">{msg.body}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onUpgrade}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black text-white transition-all ${msg.ctaClass}`}
        >
          {msg.cta} <ArrowRight className="w-3.5 h-3.5" />
        </button>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="p-1.5 rounded-xl text-slate-500 hover:text-slate-300 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
