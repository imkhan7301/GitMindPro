import React from 'react';
import { GitCommit, AlertTriangle, ShieldAlert, User } from 'lucide-react';
import type { BlameInsight } from '../services/geminiService';

interface BlameIntelligenceProps {
  insights: BlameInsight[];
  isPro: boolean;
  onUpgrade: () => void;
}

const riskBar = (pct: number) => {
  const color = pct >= 75 ? '#ef4444' : pct >= 50 ? '#f97316' : pct >= 25 ? '#eab308' : '#22c55e';
  return (
    <div className="flex items-center gap-2 flex-1">
      <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="text-[10px] font-black w-7 text-right" style={{ color }}>{pct}%</span>
    </div>
  );
};

const BlameIntelligence: React.FC<BlameIntelligenceProps> = ({ insights, isPro, onUpgrade }) => {
  if (!isPro) {
    return (
      <div className="relative">
        {/* Blurred preview */}
        <div className="filter blur-sm pointer-events-none select-none space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-700" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-slate-700 rounded w-32" />
                  <div className="h-2 bg-slate-800 rounded w-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
        {/* Overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80 rounded-2xl backdrop-blur-sm">
          <ShieldAlert className="w-8 h-8 text-indigo-400 mb-3" />
          <p className="text-white font-black text-sm mb-1">Pro / Team Feature</p>
          <p className="text-slate-400 text-xs text-center mb-4 max-w-[240px]">
            Unlock Blame Intelligence to see who owns each risk area.
          </p>
          <button
            onClick={onUpgrade}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-bold text-white transition-all"
          >
            Upgrade to Pro →
          </button>
        </div>
      </div>
    );
  }

  if (insights.length === 0) {
    return (
      <p className="text-slate-500 text-sm text-center py-8">
        Not enough contributor data to generate blame intelligence.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {insights.map((insight) => (
        <div
          key={insight.contributor}
          className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-slate-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <a
                    href={`https://github.com/${insight.contributor}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-black text-white hover:text-indigo-400 transition-colors"
                  >
                    @{insight.contributor}
                  </a>
                  {insight.busFactor && (
                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-black bg-rose-500/15 text-rose-400 border border-rose-500/20">
                      <AlertTriangle className="w-2.5 h-2.5" /> Bus Factor Risk
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">{insight.finding}</p>
              </div>
            </div>
          </div>

          {/* Risk concentration bar */}
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest w-24 shrink-0">Risk Ownership</span>
            {riskBar(insight.riskConcentration)}
          </div>

          {/* Owned areas */}
          {insight.ownedAreas.length > 0 && (
            <div className="flex items-start gap-2">
              <GitCommit className="w-3 h-3 text-slate-600 shrink-0 mt-1" />
              <div className="flex flex-wrap gap-1.5">
                {insight.ownedAreas.slice(0, 5).map(area => (
                  <span
                    key={area}
                    className="px-2 py-0.5 rounded-lg bg-slate-800 border border-slate-700 text-[10px] font-mono text-slate-400"
                  >
                    {area.length > 40 ? '…' + area.slice(-38) : area}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default BlameIntelligence;
