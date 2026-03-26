import React from 'react';
import { ShieldAlert, ShieldCheck, AlertTriangle, ExternalLink, Terminal } from 'lucide-react';
import type { CVEReport, CVEFinding } from '../services/geminiService';

interface CVEMonitorProps {
  report: CVEReport;
  isPro: boolean;
  onUpgrade: () => void;
}

const SEVERITY_CONFIG: Record<CVEFinding['severity'], { label: string; color: string; bg: string; border: string; cvssColor: string }> = {
  critical: { label: 'Critical', color: 'text-rose-300',   bg: 'bg-rose-500/10',   border: 'border-rose-500/30',   cvssColor: 'text-rose-400' },
  high:     { label: 'High',     color: 'text-orange-300', bg: 'bg-orange-500/10', border: 'border-orange-500/30', cvssColor: 'text-orange-400' },
  medium:   { label: 'Medium',   color: 'text-amber-300',  bg: 'bg-amber-500/10',  border: 'border-amber-500/30',  cvssColor: 'text-amber-400' },
  low:      { label: 'Low',      color: 'text-sky-300',    bg: 'bg-sky-500/10',    border: 'border-sky-500/30',    cvssColor: 'text-sky-400' },
};

const COMPLIANCE_CONFIG: Record<CVEReport['compliance'], { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  blocked:    { label: 'Compliance Blocked',   color: 'text-rose-300',    bg: 'bg-rose-500/15 border-rose-500/30',    icon: <ShieldAlert className="w-5 h-5" /> },
  at_risk:    { label: 'At Risk',              color: 'text-orange-300',  bg: 'bg-orange-500/15 border-orange-500/30', icon: <AlertTriangle className="w-5 h-5" /> },
  acceptable: { label: 'Acceptable Risk',      color: 'text-emerald-300', bg: 'bg-emerald-500/15 border-emerald-500/30', icon: <ShieldCheck className="w-5 h-5" /> },
};

export default function CVEMonitor({ report, isPro, onUpgrade }: CVEMonitorProps) {
  const compliance = COMPLIANCE_CONFIG[report.compliance] ?? COMPLIANCE_CONFIG['acceptable'];
  const hasCVEs = report.findings.length > 0;

  // Paywall blur for non-pro with critical/high findings
  const showPaywall = !isPro && (report.totalCritical > 0 || report.totalHigh > 0);

  return (
    <div className="space-y-6 relative">
      {/* Compliance Banner */}
      <div className={`flex items-center gap-3 px-5 py-3 rounded-2xl border ${compliance.bg}`}>
        <span className={compliance.color}>{compliance.icon}</span>
        <div>
          <div className={`font-black text-sm ${compliance.color}`}>{compliance.label}</div>
          <div className="text-xs text-slate-400 mt-0.5">{report.estimatedRiskExposure}</div>
        </div>
        <div className="ml-auto flex gap-4 text-center">
          <div>
            <div className="text-lg font-black text-rose-400">{report.totalCritical}</div>
            <div className="text-[9px] text-slate-500 uppercase tracking-widest">Critical</div>
          </div>
          <div>
            <div className="text-lg font-black text-orange-400">{report.totalHigh}</div>
            <div className="text-[9px] text-slate-500 uppercase tracking-widest">High</div>
          </div>
        </div>
      </div>

      {/* Paywall overlay */}
      {showPaywall && (
        <div className="absolute inset-0 top-16 z-10 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm rounded-2xl">
          <ShieldAlert className="w-8 h-8 text-rose-400 mb-3" />
          <p className="text-white font-black text-base mb-1">Critical CVEs Detected</p>
          <p className="text-slate-400 text-xs text-center max-w-xs mb-5">Upgrade to Pro to see full CVE details, CVSS scores, and patch commands.</p>
          <button
            onClick={onUpgrade}
            className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 rounded-xl text-sm font-black text-white transition-all shadow-lg shadow-rose-500/20"
          >
            Upgrade to Pro
          </button>
        </div>
      )}

      {/* No CVEs */}
      {!hasCVEs && (
        <div className="text-center py-8">
          <ShieldCheck className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
          <p className="text-white font-bold">No known CVEs found</p>
          <p className="text-slate-400 text-xs mt-1">Dependencies look clean against known vulnerability databases.</p>
        </div>
      )}

      {/* CVE List */}
      {hasCVEs && (
        <div className="space-y-3">
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-500">CVE Findings ({report.findings.length})</h4>
          {report.findings
            .sort((a, b) => b.cvssScore - a.cvssScore)
            .map((cve, i) => {
              const s = SEVERITY_CONFIG[cve.severity] ?? SEVERITY_CONFIG['medium'];
              return (
                <div key={i} className={`p-5 rounded-2xl border ${s.bg} ${s.border} space-y-3 ${showPaywall && i >= 1 ? 'blur-sm pointer-events-none select-none' : ''}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-sm font-black text-white">{cve.package}</span>
                        <span className="font-mono text-xs text-slate-400">@{cve.version}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${s.bg} ${s.color} ${s.border}`}>{s.label}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <a
                          href={`https://nvd.nist.gov/vuln/detail/${cve.cveId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                        >
                          {cve.cveId} <ExternalLink className="w-3 h-3" />
                        </a>
                        <span className={`text-xs font-black ${s.cvssColor}`}>CVSS {cve.cvssScore.toFixed(1)}</span>
                        <span className="text-xs text-slate-500">{cve.affectedArea}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{cve.description}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                      <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                      <span>Patch to <span className="font-mono font-bold">{cve.patchVersion}</span></span>
                    </div>
                    <div className="flex-1 flex items-center gap-2 bg-slate-950 rounded-lg px-3 py-1.5 border border-slate-800">
                      <Terminal className="w-3 h-3 text-slate-500 shrink-0" />
                      <code className="text-xs font-mono text-emerald-300 truncate">{cve.patchCommand}</code>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* Remediation Priority */}
      {report.remediationPriority.length > 0 && !showPaywall && (
        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-2">
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-500">Patch Priority Order</h4>
          <div className="flex flex-wrap gap-2">
            {report.remediationPriority.map((pkg, i) => (
              <span key={i} className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 border border-slate-700 rounded-lg text-xs font-mono text-slate-300">
                <span className="text-slate-500 font-black">{i + 1}.</span> {pkg}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
