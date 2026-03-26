import React, { useEffect, useState } from 'react';
import { Pin, X, AlertTriangle, ShieldAlert, Info, RotateCw } from 'lucide-react';

export interface PinnedInsightData {
  repoFullName: string;
  title: string;
  rationale: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  file?: string;
  savedAt: string;
}

const STORAGE_KEY = 'gitmind.pinnedInsight';

export const savePinnedInsight = (data: PinnedInsightData) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { /* quota exceeded */ }
};

export const loadPinnedInsight = (): PinnedInsightData | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PinnedInsightData) : null;
  } catch { return null; }
};

interface PinnedInsightProps {
  onReanalyze: () => void;
}

const severityConfig = {
  critical: { icon: <ShieldAlert className="w-4 h-4" />, label: 'Critical', color: 'text-rose-400 bg-rose-500/15 border-rose-500/30' },
  high:     { icon: <AlertTriangle className="w-4 h-4" />, label: 'High',     color: 'text-orange-400 bg-orange-500/15 border-orange-500/30' },
  medium:   { icon: <AlertTriangle className="w-4 h-4" />, label: 'Medium',   color: 'text-amber-400 bg-amber-500/15 border-amber-500/30' },
  low:      { icon: <Info className="w-4 h-4" />,          label: 'Low',      color: 'text-sky-400 bg-sky-500/15 border-sky-500/30' },
};

const PinnedInsight: React.FC<PinnedInsightProps> = ({ onReanalyze }) => {
  const [insight, setInsight] = useState<PinnedInsightData | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setInsight(loadPinnedInsight());
  }, []);

  if (!insight || dismissed) return null;

  const sev = severityConfig[insight.severity] ?? severityConfig.medium;
  const daysAgo = Math.floor((Date.now() - new Date(insight.savedAt).getTime()) / 86_400_000);

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-[2rem] p-6 shadow-xl">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Pin className="w-4 h-4 text-indigo-400" />
          <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Pinned Insight</span>
          <span className="text-[10px] text-slate-600">· {insight.repoFullName}</span>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-slate-600 hover:text-slate-400 transition-colors p-1 rounded-lg hover:bg-slate-800"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase border ${sev.color}`}>
            {sev.icon} {sev.label}
          </span>
          {insight.file && (
            <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono text-slate-400 bg-slate-800/60 border border-slate-700/40 truncate max-w-[200px]">
              {insight.file}
            </span>
          )}
        </div>

        <div>
          <p className="text-white font-bold text-sm mb-1">{insight.title}</p>
          <p className="text-slate-400 text-xs leading-relaxed line-clamp-2">{insight.rationale}</p>
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="text-[10px] text-slate-600">
            {daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo}d ago`}
          </span>
          <button
            onClick={onReanalyze}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 rounded-xl text-xs font-bold text-indigo-400 transition-all"
          >
            <RotateCw className="w-3 h-3" /> Analyze Again
          </button>
        </div>
      </div>
    </div>
  );
};

export default PinnedInsight;
