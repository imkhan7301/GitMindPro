import { useState } from 'react';
import { AlertTriangle, Shield, RefreshCw, Loader2, ExternalLink, ChevronDown, ChevronRight, Zap } from 'lucide-react';

export interface SupplyChainFinding {
  caseRef: 'postmark-mcp' | 'clawhavoc' | 'clinejection' | 'general';
  asiCode: 'ASI04' | 'ASI01' | 'ASI02';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  evidence: string;
  affectedFiles: string[];
  recommendation: string;
  realWorldParallel: string;
}

export interface SupplyChainScanResult {
  summary: string;
  overallRisk: 'critical' | 'high' | 'medium' | 'low';
  asi04Score: number; // 0–100, higher = safer
  dynamicLoaderCount: number;
  untrustedRegistryCount: number;
  findings: SupplyChainFinding[];
  mitigationsApplied: string[];
  recommendation: string;
}

interface Props {
  onScan: () => Promise<SupplyChainScanResult>;
  loading?: boolean;
}

const caseInfo: Record<string, { label: string; color: string; url: string }> = {
  'postmark-mcp':  { label: 'Postmark-MCP', color: 'text-orange-400 bg-orange-500/10 border-orange-500/30', url: 'https://koi.security/blog/postmark-mcp' },
  'clawhavoc':     { label: 'ClawHavoc',    color: 'text-rose-400 bg-rose-500/10 border-rose-500/30',       url: 'https://owasp.org/www-project-top-10-for-large-language-model-applications/' },
  'clinejection':  { label: 'Clinejection', color: 'text-purple-400 bg-purple-500/10 border-purple-500/30', url: 'https://owasp.org/www-project-top-10-for-large-language-model-applications/' },
  'general':       { label: 'ASI04 General',color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',   url: 'https://owasp.org/www-project-top-10-for-large-language-model-applications/' },
};

const severityBadge: Record<string, string> = {
  critical: 'bg-rose-500/20 border-rose-500/40 text-rose-300',
  high:     'bg-orange-500/20 border-orange-500/40 text-orange-300',
  medium:   'bg-amber-500/20 border-amber-500/40 text-amber-300',
  low:      'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
};

const riskColor: Record<string, string> = {
  critical: 'text-rose-400', high: 'text-orange-400', medium: 'text-amber-400', low: 'text-emerald-400',
};

export default function SupplyChainScanner({ onScan, loading: externalLoading }: Props) {
  const [result, setResult] = useState<SupplyChainScanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);

  const isLoading = loading || externalLoading;

  const handleScan = async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await onScan();
      setResult(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Scan failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-[3rem] p-10 shadow-2xl">
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-3 mb-1">
            <AlertTriangle className="w-7 h-7 text-orange-400" /> Supply Chain Deep Scan
          </h2>
          <p className="text-slate-400 text-sm">
            ASI04-specific: dynamic loaders, untrusted registries, eval/exec vectors. References real 2026 incidents.
          </p>
          <div className="flex gap-2 mt-2 flex-wrap">
            {Object.entries(caseInfo).slice(0, 3).map(([key, { label, color, url }]) => (
              <a key={key} href={url} target="_blank" rel="noopener noreferrer"
                className={`flex items-center gap-1 text-[9px] px-2 py-1 rounded-full border font-black uppercase tracking-widest hover:opacity-80 transition-opacity ${color}`}>
                {label} <ExternalLink className="w-2.5 h-2.5" />
              </a>
            ))}
          </div>
        </div>
        <button
          onClick={handleScan}
          disabled={isLoading}
          className="flex items-center gap-2 px-6 py-3 bg-orange-500/10 border border-orange-500/30 text-orange-400 hover:bg-orange-500/20 rounded-2xl text-sm font-black uppercase tracking-widest transition-all disabled:opacity-40"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          {isLoading ? 'Scanning...' : result ? 'Re-scan' : 'Deep Scan'}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl mb-6 text-rose-400 text-sm">{error}</div>
      )}

      {isLoading && (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <Loader2 className="w-10 h-10 text-orange-400 animate-spin" />
          <p className="text-slate-400 text-sm">Scanning for supply chain vulnerabilities (ASI04)...</p>
        </div>
      )}

      {result && !isLoading && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 text-center">
              <div className={`text-3xl font-black mb-1 ${riskColor[result.overallRisk]}`}>{result.overallRisk.toUpperCase()}</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Overall Risk</div>
            </div>
            <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 text-center">
              <div className="text-3xl font-black text-white mb-1">{result.asi04Score}</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">ASI04 Safety Score</div>
            </div>
            <div className="p-5 bg-slate-950 rounded-2xl border border-orange-500/30 text-center">
              <div className="text-3xl font-black text-orange-400 mb-1">{result.dynamicLoaderCount}</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Dynamic Loaders</div>
            </div>
            <div className="p-5 bg-slate-950 rounded-2xl border border-rose-500/30 text-center">
              <div className="text-3xl font-black text-rose-400 mb-1">{result.untrustedRegistryCount}</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Untrusted Registries</div>
            </div>
          </div>

          <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800">
            <p className="text-slate-300 text-sm leading-relaxed">{result.summary}</p>
          </div>

          {/* Mitigations applied */}
          {result.mitigationsApplied.length > 0 && (
            <div className="p-5 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl">
              <h4 className="text-emerald-400 font-black text-xs uppercase tracking-widest mb-3 flex items-center gap-2">
                <Shield className="w-3.5 h-3.5" /> Mitigations Already Applied
              </h4>
              <ul className="space-y-1.5">
                {result.mitigationsApplied.map((m, i) => (
                  <li key={i} className="text-sm text-slate-400 flex items-start gap-2">
                    <span className="text-emerald-400 shrink-0">✓</span> {m}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Findings */}
          {result.findings.length > 0 && (
            <div>
              <h4 className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-orange-400" /> Findings ({result.findings.length})
              </h4>
              <div className="space-y-3">
                {result.findings.map((f, i) => {
                  const ref = caseInfo[f.caseRef];
                  return (
                    <div key={i} className="bg-slate-950 border border-slate-800 hover:border-orange-500/30 rounded-2xl overflow-hidden transition-all">
                      <button
                        onClick={() => setExpanded(expanded === i ? null : i)}
                        className="w-full flex items-center gap-4 p-5 text-left"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 flex-wrap mb-1">
                            <span className="text-white font-bold text-sm">{f.title}</span>
                            <span className="text-[9px] px-2 py-0.5 bg-slate-800 border border-slate-700 text-slate-400 rounded-full font-bold">{f.asiCode}</span>
                            <a href={ref.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                              className={`flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full border font-black uppercase ${ref.color}`}>
                              {ref.label} <ExternalLink className="w-2 h-2" />
                            </a>
                          </div>
                          <p className="text-slate-500 text-xs truncate">{f.description}</p>
                        </div>
                        <span className={`text-[9px] px-3 py-1.5 rounded-full border font-black uppercase tracking-widest shrink-0 ${severityBadge[f.severity]}`}>
                          {f.severity}
                        </span>
                        {expanded === i ? <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" /> : <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />}
                      </button>

                      {expanded === i && (
                        <div className="px-5 pb-5 space-y-3 border-t border-slate-800 pt-4">
                          <p className="text-slate-400 text-sm"><span className="text-slate-500 font-bold">Real-world parallel: </span>{f.realWorldParallel}</p>
                          <p className="text-slate-400 text-sm"><span className="text-slate-500 font-bold">Evidence: </span>{f.evidence}</p>
                          {f.affectedFiles.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {f.affectedFiles.map(file => (
                                <code key={file} className="text-[10px] px-2 py-1 bg-slate-800 border border-slate-700 text-indigo-400 rounded-lg">{file}</code>
                              ))}
                            </div>
                          )}
                          <p className="text-slate-400 text-sm"><span className="text-slate-500 font-bold">Fix: </span>{f.recommendation}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="p-5 bg-orange-500/5 border border-orange-500/20 rounded-2xl flex items-start gap-3">
            <Zap className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
            <p className="text-slate-300 text-sm leading-relaxed">{result.recommendation}</p>
          </div>
        </div>
      )}

      {!result && !isLoading && (
        <div className="flex flex-col items-center justify-center py-12 opacity-40">
          <AlertTriangle className="w-16 h-16 text-slate-700 mb-4" />
          <p className="text-slate-500 text-sm uppercase tracking-widest font-bold">Run deep scan for ASI04 supply chain analysis</p>
        </div>
      )}
    </div>
  );
}
