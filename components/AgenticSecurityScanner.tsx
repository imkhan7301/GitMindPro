import { useState } from 'react';
import { ShieldAlert, Zap, AlertTriangle, AlertCircle, Info, ChevronDown, ChevronUp } from 'lucide-react';

export interface AgenticRiskFinding {
  asiCode: string; // ASI01–ASI10
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  evidence: string;
  recommendation: string;
}

export interface AgenticSecurityScanResult {
  riskSummary: string;
  overallRisk: 'critical' | 'high' | 'medium' | 'low';
  findings: AgenticRiskFinding[];
  agenticReadinessScore: number; // 0–100
}

interface Props {
  onScan: () => Promise<AgenticSecurityScanResult>;
  loading?: boolean;
}

const SEVERITY_CONFIG = {
  critical: { label: 'Critical', color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/30', icon: AlertTriangle },
  high: { label: 'High', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30', icon: AlertTriangle },
  medium: { label: 'Medium', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30', icon: AlertCircle },
  low: { label: 'Low', color: 'text-sky-400', bg: 'bg-sky-500/10 border-sky-500/30', icon: Info },
};

const ASI_LABELS: Record<string, string> = {
  ASI01: 'Goal Hijack',
  ASI02: 'Tool Misuse',
  ASI03: 'Privilege Abuse',
  ASI04: 'Supply Chain',
  ASI05: 'Code Execution',
  ASI06: 'Context Poisoning',
  ASI07: 'Inter-Agent Comms',
  ASI08: 'Cascading Failures',
  ASI09: 'Trust Exploitation',
  ASI10: 'Rogue Agents',
};

export default function AgenticSecurityScanner({ onScan, loading: externalLoading }: Props) {
  const [result, setResult] = useState<AgenticSecurityScanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const handleScan = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await onScan();
      setResult(res);
      // Auto-expand first critical/high finding
      const top = res.findings.find(f => f.severity === 'critical' || f.severity === 'high');
      if (top) setExpanded(top.asiCode);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Scan failed');
    } finally {
      setLoading(false);
    }
  };

  const isLoading = loading || externalLoading;

  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  const sorted = result ? [...result.findings].sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]) : [];

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-[3rem] p-10 shadow-2xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-3 mb-1">
            <ShieldAlert className="w-6 h-6 text-rose-400" /> OWASP Agentic Security Scanner
          </h2>
          <p className="text-slate-400 text-sm">Scans for all 10 ASI risks (OWASP Agentic Top 10, 2026) — the security layer that feeds safe context to AI agents.</p>
        </div>
        <button
          onClick={handleScan}
          disabled={isLoading}
          className="shrink-0 flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 rounded-xl text-sm font-bold text-white transition-all"
        >
          <Zap className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Scanning...' : result ? 'Re-scan' : 'Run Scan'}
        </button>
      </div>

      {error && <p className="text-rose-400 text-xs font-bold">{error}</p>}

      {isLoading && (
        <div className="flex items-center justify-center gap-3 py-12">
          <div className="w-6 h-6 border-2 border-rose-500/30 border-t-rose-400 rounded-full animate-spin" />
          <span className="text-sm text-rose-400 font-bold animate-pulse">Scanning for agentic vulnerabilities...</span>
        </div>
      )}

      {result && !isLoading && (
        <div className="space-y-6 animate-in fade-in duration-500">
          {/* Summary bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-center">
              <p className="text-3xl font-black text-white">{result.agenticReadinessScore}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Agentic Safety Score</p>
            </div>
            {(['critical', 'high', 'medium', 'low'] as const).map(sev => {
              const count = result.findings.filter(f => f.severity === sev).length;
              const cfg = SEVERITY_CONFIG[sev];
              return (
                <div key={sev} className={`p-4 border rounded-2xl text-center ${cfg.bg}`}>
                  <p className={`text-2xl font-black ${cfg.color}`}>{count}</p>
                  <p className={`text-[10px] uppercase tracking-widest mt-1 ${cfg.color}`}>{cfg.label}</p>
                </div>
              );
            })}
          </div>

          {/* Risk summary */}
          <div className={`p-5 rounded-2xl border ${SEVERITY_CONFIG[result.overallRisk].bg}`}>
            <p className={`text-xs font-black uppercase tracking-widest mb-2 ${SEVERITY_CONFIG[result.overallRisk].color}`}>
              Overall Risk: {SEVERITY_CONFIG[result.overallRisk].label}
            </p>
            <p className="text-sm text-slate-300 leading-relaxed">{result.riskSummary}</p>
          </div>

          {/* ASI wheel — quick visual */}
          <div className="flex flex-wrap gap-2">
            {Object.entries(ASI_LABELS).map(([code, label]) => {
              const finding = result.findings.find(f => f.asiCode === code);
              const sev = finding?.severity;
              const cfg = sev ? SEVERITY_CONFIG[sev] : null;
              return (
                <div
                  key={code}
                  className={`px-3 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest cursor-pointer transition-all ${
                    cfg ? `${cfg.bg} ${cfg.color}` : 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400'
                  }`}
                  onClick={() => finding && setExpanded(expanded === code ? null : code)}
                  title={label}
                >
                  {code} {!finding && '✓'}
                </div>
              );
            })}
          </div>
          <p className="text-[10px] text-slate-600">✓ = No issue detected &nbsp;|&nbsp; Colored = Risk found (click to expand)</p>

          {/* Findings list */}
          {sorted.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-black text-white uppercase tracking-widest">Findings ({sorted.length})</h3>
              {sorted.map(finding => {
                const cfg = SEVERITY_CONFIG[finding.severity];
                const Icon = cfg.icon;
                const isOpen = expanded === finding.asiCode;
                return (
                  <div key={finding.asiCode} className={`border rounded-2xl overflow-hidden ${cfg.bg}`}>
                    <button
                      onClick={() => setExpanded(isOpen ? null : finding.asiCode)}
                      className="w-full flex items-center justify-between px-5 py-4 text-left"
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 shrink-0 ${cfg.color}`} />
                        <div>
                          <span className={`text-[10px] font-black uppercase tracking-widest ${cfg.color}`}>{finding.asiCode}</span>
                          <span className="text-[10px] text-slate-500 ml-2">· {ASI_LABELS[finding.asiCode]}</span>
                          <p className="text-sm font-black text-white">{finding.title}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${cfg.bg} ${cfg.color}`}>
                          {cfg.label}
                        </span>
                        {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </div>
                    </button>

                    {isOpen && (
                      <div className="px-5 pb-5 space-y-3 border-t border-white/5">
                        <div className="pt-3">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Description</p>
                          <p className="text-sm text-slate-300 leading-relaxed">{finding.description}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Evidence</p>
                          <p className="text-sm text-slate-400 italic leading-relaxed">{finding.evidence}</p>
                        </div>
                        <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-700">
                          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-1">Recommendation</p>
                          <p className="text-sm text-emerald-300 leading-relaxed">{finding.recommendation}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {sorted.length === 0 && (
            <div className="p-6 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl text-center">
              <p className="text-emerald-400 font-black text-sm">✓ No agentic security risks detected. This repo is well-positioned as a safe context source for AI agents.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
