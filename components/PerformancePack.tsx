import { useState } from 'react';
import { BarChart3, RefreshCw, Loader2, TrendingUp, CheckCircle2, Zap, ChevronDown, ChevronRight, Package } from 'lucide-react';

export interface BundleRiskItem {
  module: string;
  issue: string;
  impact: 'high' | 'medium' | 'low';
  saving: string;
  fix: string;
}

export interface CWVRisk {
  metric: 'LCP' | 'CLS' | 'INP' | 'FID' | 'TTFB';
  risk: 'high' | 'medium' | 'low';
  reason: string;
  score: number; // 0-100, higher = better
}

export interface RenderComplexityItem {
  component: string;
  depth: number;
  rerenderRisk: 'high' | 'medium' | 'low';
  cause: string;
  fix: string;
}

export interface PerformanceReport {
  bundleRiskScore: number; // 0-100, lower = more risk
  cwvScore: number;        // 0-100
  renderScore: number;     // 0-100
  overallGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  summary: string;
  bundleItems: BundleRiskItem[];
  cwvRisks: CWVRisk[];
  renderItems: RenderComplexityItem[];
  topWin: string; // single highest-ROI recommendation
}

interface Props {
  onAnalyze: () => Promise<PerformanceReport>;
  loading?: boolean;
  repoName?: string;
}

const GRADE_COLOR: Record<string, string> = {
  A: 'text-emerald-400',
  B: 'text-cyan-400',
  C: 'text-yellow-400',
  D: 'text-orange-400',
  F: 'text-red-400',
};

const IMPACT_BADGE: Record<string, string> = {
  high: 'bg-red-500/15 text-red-300 border-red-500/30',
  medium: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
  low: 'bg-slate-600/30 text-slate-400 border-slate-600/50',
};

const CWV_LABELS: Record<string, string> = {
  LCP: 'Largest Contentful Paint',
  CLS: 'Cumulative Layout Shift',
  INP: 'Interaction to Next Paint',
  FID: 'First Input Delay',
  TTFB: 'Time to First Byte',
};

type SubTab = 'bundle' | 'cwv' | 'render';

export default function PerformancePack({ onAnalyze, loading, repoName }: Props) {
  const [report, setReport] = useState<PerformanceReport | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [subTab, setSubTab] = useState<SubTab>('bundle');
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const run = async () => {
    setIsRunning(true);
    try {
      const result = await onAnalyze();
      setReport(result);
      setExpanded(new Set());
    } finally {
      setIsRunning(false);
    }
  };

  const busy = isRunning || loading;

  const toggle = (i: number) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });

  const ScorePill = ({ score, label }: { score: number; label: string }) => {
    const color = score >= 80 ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' :
                  score >= 60 ? 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10' :
                  'text-red-400 border-red-500/30 bg-red-500/10';
    return (
      <div className={`flex flex-col items-center px-5 py-3 rounded-2xl border ${color}`}>
        <span className="text-2xl font-black">{score}</span>
        <span className="text-[9px] uppercase tracking-widest font-bold opacity-70">{label}</span>
      </div>
    );
  };

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-[3rem] p-8 shadow-2xl">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-yellow-500/15 rounded-xl flex items-center justify-center">
            <Zap className="w-5 h-5 text-yellow-400" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white">Performance Intelligence</h3>
            <p className="text-xs text-slate-500">{repoName || 'Repository'} · Bundle · CWV · Render</p>
          </div>
        </div>
        <button
          onClick={run}
          disabled={busy}
          className="flex items-center gap-2 px-5 py-2.5 bg-yellow-600 hover:bg-yellow-500 disabled:opacity-40 rounded-xl text-sm font-bold text-white transition-all"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          {busy ? 'Analyzing...' : report ? 'Re-analyze' : 'Run Analysis'}
        </button>
      </div>

      {!report && !busy && (
        <div className="text-center py-12 opacity-40">
          <BarChart3 className="w-14 h-14 mx-auto mb-4 text-slate-600" />
          <p className="text-sm text-slate-500 font-bold uppercase tracking-widest">Bundle risk, Core Web Vitals & render complexity</p>
        </div>
      )}

      {busy && (
        <div className="flex items-center justify-center py-12 gap-3 text-yellow-400">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-sm font-bold">Profiling performance patterns...</span>
        </div>
      )}

      {report && !busy && (
        <div className="space-y-6">
          {/* Score row */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex flex-col items-center px-5 py-3 rounded-2xl border border-slate-700 bg-slate-800/50">
              <span className={`text-3xl font-black ${GRADE_COLOR[report.overallGrade]}`}>{report.overallGrade}</span>
              <span className="text-[9px] uppercase tracking-widest font-bold text-slate-500">Grade</span>
            </div>
            <ScorePill score={report.bundleRiskScore} label="Bundle" />
            <ScorePill score={report.cwvScore} label="CWV" />
            <ScorePill score={report.renderScore} label="Render" />
            <div className="flex-1 min-w-[180px] bg-yellow-500/10 border border-yellow-500/20 rounded-2xl px-4 py-3">
              <p className="text-[10px] font-black text-yellow-400 uppercase tracking-widest mb-1">Top Win</p>
              <p className="text-sm text-white font-medium">{report.topWin}</p>
            </div>
          </div>

          <p className="text-sm text-slate-400 leading-relaxed">{report.summary}</p>

          {/* Sub-tab nav */}
          <div className="flex gap-2">
            {(['bundle', 'cwv', 'render'] as SubTab[]).map((t) => (
              <button
                key={t}
                onClick={() => setSubTab(t)}
                className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                  subTab === t
                    ? 'bg-yellow-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {t === 'bundle' ? `Bundle (${report.bundleItems.length})` : t === 'cwv' ? `CWV (${report.cwvRisks.length})` : `Render (${report.renderItems.length})`}
              </button>
            ))}
          </div>

          {/* Bundle tab */}
          {subTab === 'bundle' && (
            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {report.bundleItems.length === 0 && (
                <div className="flex items-center gap-2 text-emerald-400 text-sm py-4">
                  <CheckCircle2 className="w-4 h-4" /> No bundle issues detected.
                </div>
              )}
              {report.bundleItems.map((item, i) => (
                <div key={i} className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden">
                  <button
                    onClick={() => toggle(i)}
                    className="w-full flex items-center justify-between gap-3 px-5 py-3.5 text-left hover:bg-slate-700/30 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Package className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="text-sm font-bold text-white truncate">{item.module}</span>
                      <span className="text-xs text-slate-500 hidden sm:block truncate">{item.issue}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-bold text-emerald-400">{item.saving}</span>
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${IMPACT_BADGE[item.impact]}`}>{item.impact}</span>
                      {expanded.has(i) ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
                    </div>
                  </button>
                  {expanded.has(i) && (
                    <div className="px-5 pb-4 border-t border-slate-700 pt-3 space-y-1">
                      <p className="text-xs text-slate-400">{item.issue}</p>
                      <p className="text-xs text-yellow-300 font-semibold">Fix: {item.fix}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* CWV tab */}
          {subTab === 'cwv' && (
            <div className="space-y-3">
              {report.cwvRisks.map((cwv, i) => (
                <div key={i} className="bg-slate-800/50 border border-slate-700 rounded-2xl px-5 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="text-sm font-black text-white">{cwv.metric}</span>
                      <span className="text-xs text-slate-500 ml-2">{CWV_LABELS[cwv.metric]}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-20 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${cwv.score >= 70 ? 'bg-emerald-500' : cwv.score >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                          style={{ width: `${cwv.score}%` }}
                        />
                      </div>
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${IMPACT_BADGE[cwv.risk]}`}>{cwv.risk}</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400">{cwv.reason}</p>
                </div>
              ))}
            </div>
          )}

          {/* Render tab */}
          {subTab === 'render' && (
            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {report.renderItems.map((item, i) => (
                <div key={i} className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden">
                  <button
                    onClick={() => toggle(i + 100)}
                    className="w-full flex items-center justify-between gap-3 px-5 py-3.5 text-left hover:bg-slate-700/30 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <TrendingUp className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="text-sm font-bold text-white truncate">{item.component}</span>
                      <span className="text-xs text-slate-500 hidden sm:block">depth {item.depth}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${IMPACT_BADGE[item.rerenderRisk]}`}>{item.rerenderRisk}</span>
                      {expanded.has(i + 100) ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
                    </div>
                  </button>
                  {expanded.has(i + 100) && (
                    <div className="px-5 pb-4 border-t border-slate-700 pt-3 space-y-1">
                      <p className="text-xs text-slate-400">{item.cause}</p>
                      <p className="text-xs text-yellow-300 font-semibold">Fix: {item.fix}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
