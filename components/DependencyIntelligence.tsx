import { useState } from 'react';
import { Package, CheckCircle2, TrendingUp, ExternalLink, RefreshCw, Loader2, ShieldAlert, Zap } from 'lucide-react';

export interface DependencyReport {
  summary: string;
  totalDeps: number;
  outdatedCount: number;
  riskyCount: number;
  criticalCount: number;
  dependencies: {
    name: string;
    currentVersion: string;
    latestVersion: string;
    isOutdated: boolean;
    riskLevel: 'safe' | 'low' | 'medium' | 'high' | 'critical';
    riskReason: string;
    isDynamicLoader: boolean;
    isEvalUser: boolean;
    updateAdvice: string;
    cveIds: string[];
  }[];
  supplyChainFlags: string[];
  recommendation: string;
}

interface Props {
  onAnalyze: () => Promise<DependencyReport>;
  loading?: boolean;
  repoName?: string;
}

const riskBadge: Record<string, string> = {
  critical: 'bg-rose-500/20 border-rose-500/40 text-rose-300',
  high:     'bg-orange-500/20 border-orange-500/40 text-orange-300',
  medium:   'bg-amber-500/20 border-amber-500/40 text-amber-300',
  low:      'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
  safe:     'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
};

export default function DependencyIntelligence({ onAnalyze, loading: externalLoading, repoName }: Props) {
  const [report, setReport] = useState<DependencyReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedDep, setExpandedDep] = useState<string | null>(null);

  const isLoading = loading || externalLoading;

  const handleRun = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await onAnalyze();
      setReport(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-[3rem] p-10 shadow-2xl">
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-3 mb-1">
            <Package className="w-7 h-7 text-amber-400" /> Dependency Intelligence
          </h2>
          <p className="text-slate-400 text-sm">
            Outdated packages, dynamic loader risks, CVE flags — one unified panel.
            {repoName && <span className="ml-2 text-slate-500">· {repoName}</span>}
          </p>
        </div>
        <button
          onClick={handleRun}
          disabled={isLoading}
          className="flex items-center gap-2 px-6 py-3 bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 hover:border-amber-500/60 rounded-2xl text-sm font-black uppercase tracking-widest transition-all disabled:opacity-40"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          {isLoading ? 'Scanning...' : report ? 'Re-scan' : 'Scan Deps'}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl mb-6 text-rose-400 text-sm">{error}</div>
      )}

      {isLoading && (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <Loader2 className="w-10 h-10 text-amber-400 animate-spin" />
          <p className="text-slate-400 text-sm">Scanning dependency tree for risks...</p>
        </div>
      )}

      {report && !isLoading && (
        <div className="space-y-8">
          {/* Summary stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Deps', value: report.totalDeps, color: 'text-white', bg: 'border-slate-700' },
              { label: 'Outdated', value: report.outdatedCount, color: 'text-amber-400', bg: 'border-amber-500/30' },
              { label: 'Risky', value: report.riskyCount, color: 'text-orange-400', bg: 'border-orange-500/30' },
              { label: 'Critical', value: report.criticalCount, color: 'text-rose-400', bg: 'border-rose-500/30' },
            ].map(({ label, value, color, bg }) => (
              <div key={label} className={`p-5 bg-slate-950 rounded-2xl border ${bg} text-center`}>
                <div className={`text-3xl font-black ${color} mb-1`}>{value}</div>
                <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">{label}</div>
              </div>
            ))}
          </div>

          {/* Summary text */}
          <div className="p-6 bg-slate-950 rounded-2xl border border-slate-800">
            <p className="text-slate-300 text-sm leading-relaxed">{report.summary}</p>
          </div>

          {/* Supply chain flags */}
          {report.supplyChainFlags.length > 0 && (
            <div className="p-6 bg-rose-500/5 border border-rose-500/20 rounded-2xl">
              <div className="flex items-center gap-3 mb-4">
                <ShieldAlert className="w-5 h-5 text-rose-400" />
                <h3 className="text-white font-black text-sm uppercase tracking-widest">Supply Chain Flags (ASI04)</h3>
              </div>
              <ul className="space-y-2">
                {report.supplyChainFlags.map((flag, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-rose-300">
                    <span className="text-rose-500 mt-1 shrink-0">▸</span> {flag}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Dep list */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
              <Package className="w-4 h-4 text-amber-400" /> Dependencies
            </h3>
            {report.dependencies.map((dep) => (
              <div
                key={dep.name}
                className="bg-slate-950 border border-slate-800 hover:border-amber-500/30 rounded-2xl overflow-hidden transition-all"
              >
                <button
                  onClick={() => setExpandedDep(expandedDep === dep.name ? null : dep.name)}
                  className="w-full flex items-center gap-4 p-5 text-left"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-white font-bold text-sm">{dep.name}</span>
                      <span className="text-slate-500 text-xs">{dep.currentVersion} → {dep.latestVersion}</span>
                      {dep.isDynamicLoader && (
                        <span className="text-[9px] px-2 py-0.5 bg-orange-500/15 border border-orange-500/30 text-orange-400 rounded-full font-black uppercase tracking-widest">Dynamic Loader</span>
                      )}
                      {dep.isEvalUser && (
                        <span className="text-[9px] px-2 py-0.5 bg-rose-500/15 border border-rose-500/30 text-rose-400 rounded-full font-black uppercase tracking-widest">eval/exec</span>
                      )}
                      {dep.cveIds.length > 0 && (
                        <span className="text-[9px] px-2 py-0.5 bg-red-500/15 border border-red-500/30 text-red-400 rounded-full font-black uppercase tracking-widest">{dep.cveIds.length} CVE</span>
                      )}
                    </div>
                  </div>
                  <span className={`text-[9px] px-3 py-1.5 rounded-full border font-black uppercase tracking-widest shrink-0 ${riskBadge[dep.riskLevel]}`}>
                    {dep.riskLevel}
                  </span>
                  {dep.isOutdated ? (
                    <TrendingUp className="w-4 h-4 text-amber-400 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  )}
                </button>

                {expandedDep === dep.name && (
                  <div className="px-5 pb-5 space-y-3 border-t border-slate-800 pt-4">
                    <p className="text-slate-400 text-sm"><span className="text-slate-500 font-bold">Risk: </span>{dep.riskReason}</p>
                    <p className="text-slate-400 text-sm"><span className="text-slate-500 font-bold">Advice: </span>{dep.updateAdvice}</p>
                    {dep.cveIds.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {dep.cveIds.map(cve => (
                          <a
                            key={cve}
                            href={`https://nvd.nist.gov/vuln/detail/${cve}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[10px] px-3 py-1 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl hover:bg-red-500/20 transition-colors font-bold"
                          >
                            {cve} <ExternalLink className="w-3 h-3" />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Recommendation */}
          <div className="p-6 bg-amber-500/5 border border-amber-500/20 rounded-2xl flex items-start gap-4">
            <Zap className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-slate-300 text-sm leading-relaxed">{report.recommendation}</p>
          </div>
        </div>
      )}

      {!report && !isLoading && (
        <div className="flex flex-col items-center justify-center py-16 opacity-40">
          <Package className="w-16 h-16 text-slate-700 mb-4" />
          <p className="text-slate-500 text-sm uppercase tracking-widest font-bold">Run scan to analyze dependency risk</p>
        </div>
      )}
    </div>
  );
}
