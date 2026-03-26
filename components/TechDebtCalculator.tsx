import { useState } from 'react';
import { DollarSign, TrendingDown, Zap, ChevronDown, ChevronUp, Copy, CheckCircle2 } from 'lucide-react';
import type { TechDebtReport, TechDebtCategory } from '../services/geminiService';

interface TechDebtCalculatorProps {
  report: TechDebtReport;
}

const SEVERITY_BAR: Record<TechDebtCategory['severity'], string> = {
  critical: 'bg-rose-500',
  high:     'bg-orange-500',
  medium:   'bg-amber-500',
  low:      'bg-sky-500',
};

const SEVERITY_BADGE: Record<TechDebtCategory['severity'], string> = {
  critical: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  high:     'bg-orange-500/15 text-orange-300 border-orange-500/30',
  medium:   'bg-amber-500/15 text-amber-300 border-amber-500/30',
  low:      'bg-sky-500/15 text-sky-300 border-sky-500/30',
};

function formatDollars(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}k`;
  return `$${n}`;
}

export default function TechDebtCalculator({ report }: TechDebtCalculatorProps) {
  const [expanded, setExpanded] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const maxDebt = Math.max(...report.categories.map(c => c.dollarValue), 1);

  const handleCopy = async () => {
    const text = [
      report.headline,
      '',
      report.executiveSummary,
      '',
      `Total: ${formatDollars(report.totalDollarValue)} (${report.totalHours}h @ $${report.hourlyRate}/hr)`,
      '',
      'Breakdown:',
      ...report.categories.map(c => `  ${c.category}: ${formatDollars(c.dollarValue)} — ${c.recommendation}`),
      '',
      'Quick Wins:',
      ...report.quickWins.map(w => `  • ${w}`),
    ].join('\n');
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Hero metric */}
      <div className="text-center py-6 px-4 bg-gradient-to-br from-rose-500/10 via-orange-500/5 to-slate-900/0 border border-rose-500/20 rounded-2xl">
        <div className="text-5xl font-black text-white tracking-tighter mb-1">
          {formatDollars(report.totalDollarValue)}
        </div>
        <div className="text-rose-400 font-bold text-sm mb-3">estimated technical debt</div>
        <p className="text-slate-400 text-xs max-w-lg mx-auto">{report.executiveSummary}</p>
        <div className="flex justify-center gap-6 mt-4">
          <div className="text-center">
            <div className="text-lg font-black text-white">{report.totalHours.toLocaleString()}h</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-widest">remediation time</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-black text-white">${report.hourlyRate}/hr</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-widest">engineer rate</div>
          </div>
        </div>
      </div>

      {/* Category bars */}
      <div className="space-y-3">
        <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2"><TrendingDown className="w-3.5 h-3.5" /> Debt Breakdown</h4>
        {report.categories
          .sort((a, b) => b.dollarValue - a.dollarValue)
          .map((cat, i) => (
          <div key={i} className="space-y-1">
            <button
              onClick={() => setExpanded(expanded === i ? null : i)}
              className="w-full text-left"
            >
              <div className="flex items-center gap-3 mb-1.5">
                <span className="text-sm font-bold text-white capitalize w-28 shrink-0">{cat.category.replace(/_/g, ' ')}</span>
                <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${SEVERITY_BAR[cat.severity]} rounded-full transition-all duration-700`}
                    style={{ width: `${(cat.dollarValue / maxDebt) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-black text-white tabular-nums w-16 text-right shrink-0">
                  {formatDollars(cat.dollarValue)}
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border shrink-0 ${SEVERITY_BADGE[cat.severity]}`}>
                  {cat.severity}
                </span>
                {expanded === i ? <ChevronUp className="w-3.5 h-3.5 text-slate-500 shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />}
              </div>
            </button>
            {expanded === i && (
              <div className="ml-28 pl-3 border-l border-slate-800 space-y-2 pb-2">
                <p className="text-xs text-slate-400">{cat.recommendation}</p>
                <p className="text-[10px] text-slate-500">{cat.estimatedHours}h × ${report.hourlyRate}/hr = {formatDollars(cat.dollarValue)}</p>
                {cat.examples.map((ex, j) => (
                  <p key={j} className="text-xs text-slate-500 flex items-start gap-1.5"><span className="text-orange-500 mt-0.5 shrink-0">•</span>{ex}</p>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Quick Wins */}
      <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl space-y-2">
        <h4 className="text-xs font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1.5"><Zap className="w-3.5 h-3.5" /> Quick Wins — Highest ROI First</h4>
        {report.quickWins.map((w, i) => (
          <p key={i} className="text-xs text-emerald-300 flex items-start gap-2">
            <span className="text-emerald-500 font-black shrink-0">{i + 1}.</span>{w}
          </p>
        ))}
      </div>

      {/* Copy for board deck */}
      <button
        onClick={handleCopy}
        className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold text-slate-300 transition-all"
      >
        {copied ? <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Copied for board deck!</> : <><Copy className="w-3.5 h-3.5" /> Copy for Board Deck</>}
        <DollarSign className="w-3 h-3 text-slate-500 ml-1" />
      </button>
    </div>
  );
}
