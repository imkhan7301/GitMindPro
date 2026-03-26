import React, { useState } from 'react';
import { Activity, TrendingUp, ShieldCheck, Users, BookOpen, Zap } from 'lucide-react';

export interface SectionScore {
  section: string;
  confidence: number;
  sources: string[];
  quality: 'high' | 'medium' | 'low';
}

export interface SectionConfidenceReport {
  overallConfidence: number;
  sections: SectionScore[];
  generatedAt: string;
  dataQuality: 'rich' | 'moderate' | 'sparse';
  recommendation: string;
}

interface Props {
  report: SectionConfidenceReport;
}

const SECTION_ICONS: Record<string, React.ElementType> = {
  'Learning Path': BookOpen,
  'Hot Zones': Zap,
  'Security Insights': ShieldCheck,
  'Code Ownership': Users,
  'Architecture': Activity,
  'Tech Debt': TrendingUp,
};

const QUALITY_COLORS: Record<SectionScore['quality'], string> = {
  high: 'text-emerald-400',
  medium: 'text-amber-400',
  low: 'text-rose-400',
};

const QUALITY_BG: Record<SectionScore['quality'], string> = {
  high: 'bg-emerald-500',
  medium: 'bg-amber-500',
  low: 'bg-rose-500',
};

const DATA_QUALITY_BADGE: Record<SectionConfidenceReport['dataQuality'], string> = {
  rich: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  moderate: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  sparse: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
};

function ConfidenceBar({ value, quality }: { value: number; quality: SectionScore['quality'] }) {
  return (
    <div className="flex items-center gap-3 flex-1">
      <div className="flex-1 bg-slate-800 rounded-full h-1.5 overflow-hidden">
        <div
          className={`h-full rounded-full ${QUALITY_BG[quality]} transition-all duration-700`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className={`text-xs font-black shrink-0 w-10 text-right ${QUALITY_COLORS[quality]}`}>{value}%</span>
    </div>
  );
}

export default function SectionConfidencePanel({ report }: Props) {
  const [showSources, setShowSources] = useState<number | null>(null);

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-[3rem] p-10 shadow-2xl">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-3 mb-1">
            <Activity className="w-6 h-6 text-cyan-400" /> Analysis Confidence
          </h2>
          <p className="text-slate-400 text-sm">
            Confidence scores and source attribution for each analysis section.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase border ${DATA_QUALITY_BADGE[report.dataQuality]}`}>
            {report.dataQuality} data
          </span>
          <div className="text-right">
            <div className="text-3xl font-black text-cyan-400">{report.overallConfidence}%</div>
            <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Overall</div>
          </div>
        </div>
      </div>

      {/* Overall bar */}
      <div className="mb-8 p-5 bg-slate-950 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-4">
          <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold w-28 shrink-0">Overall Confidence</span>
          <div className="flex-1 bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className="h-full rounded-full bg-cyan-500 transition-all duration-700"
              style={{ width: `${report.overallConfidence}%` }}
            />
          </div>
          <span className="text-cyan-400 font-black text-sm w-12 text-right">{report.overallConfidence}%</span>
        </div>
        {report.recommendation && (
          <p className="text-slate-400 text-xs mt-3 leading-relaxed">{report.recommendation}</p>
        )}
      </div>

      {/* Per-section scores */}
      <div className="space-y-3">
        {report.sections.map((sec, i) => {
          const Icon = SECTION_ICONS[sec.section] ?? Activity;
          return (
            <div key={i} className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
              <div className="flex items-center gap-4 mb-2">
                <Icon className={`w-4 h-4 shrink-0 ${QUALITY_COLORS[sec.quality]}`} />
                <span className="text-slate-300 text-sm font-bold w-36 shrink-0">{sec.section}</span>
                <ConfidenceBar value={sec.confidence} quality={sec.quality} />
                <button
                  onClick={() => setShowSources(showSources === i ? null : i)}
                  className="text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-cyan-400 transition-colors shrink-0"
                >
                  {showSources === i ? 'Hide' : 'Sources'}
                </button>
              </div>
              {showSources === i && sec.sources.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2 pl-8">
                  {sec.sources.map((src, j) => (
                    <span key={j} className="px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/20 rounded text-[9px] text-cyan-400 font-bold">
                      {src}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 text-[10px] text-slate-600 text-right">
        Generated {new Date(report.generatedAt).toLocaleTimeString()}
      </div>
    </div>
  );
}
