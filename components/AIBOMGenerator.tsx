import { useState } from 'react';
import { Shield, Download, Copy, CheckCircle2, RefreshCw, Loader2, ExternalLink, Lock, Package } from 'lucide-react';

export interface AIBOMReport {
  repoName: string;
  generatedAt: string;
  version: string;
  models: {
    name: string;
    provider: string;
    version: string;
    purpose: string;
    inputTypes: string[];
    outputTypes: string[];
    trustedSource: boolean;
  }[];
  tools: {
    name: string;
    version: string;
    category: 'analysis' | 'storage' | 'auth' | 'llm' | 'infra' | 'sdk';
    purpose: string;
    externalAccess: boolean;
  }[];
  apis: {
    name: string;
    endpoint: string;
    purpose: string;
    dataShared: string[];
    authMethod: string;
    trustedSource: boolean;
  }[];
  supplyChainIntegrity: {
    signedOutputs: boolean;
    provenanceTracking: boolean;
    inputSanitization: boolean;
    rateLimiting: boolean;
    auditLogging: boolean;
  };
  trustScore: number; // 0–100
  summary: string;
}

interface Props {
  onGenerate: () => Promise<AIBOMReport>;
  loading?: boolean;
  repoName?: string;
}

const categoryColor: Record<string, string> = {
  analysis: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
  storage:  'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  auth:     'text-amber-400 bg-amber-500/10 border-amber-500/30',
  llm:      'text-purple-400 bg-purple-500/10 border-purple-500/30',
  infra:    'text-sky-400 bg-sky-500/10 border-sky-500/30',
  sdk:      'text-slate-400 bg-slate-500/10 border-slate-500/30',
};

function TrustGauge({ score }: { score: number }) {
  const color = score >= 80 ? '#10b981' : score >= 50 ? '#f59e0b' : '#f43f5e';
  const pct = score;
  return (
    <div className="flex items-center gap-4">
      <div className="relative w-20 h-20">
        <svg viewBox="0 0 80 80" className="w-20 h-20 -rotate-90">
          <circle cx="40" cy="40" r="32" fill="none" stroke="#1e293b" strokeWidth="8" />
          <circle
            cx="40" cy="40" r="32"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${(pct / 100) * 201} 201`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-black" style={{ color }}>{score}</span>
        </div>
      </div>
      <div>
        <div className="text-white font-black text-lg">{score >= 80 ? 'High Trust' : score >= 50 ? 'Medium Trust' : 'Low Trust'}</div>
        <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Supply Chain Trust Score</div>
      </div>
    </div>
  );
}

export default function AIBOMGenerator({ onGenerate, loading: externalLoading, repoName }: Props) {
  const [report, setReport] = useState<AIBOMReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'models' | 'tools' | 'apis' | 'integrity'>('models');

  const isLoading = loading || externalLoading;

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await onGenerate();
      setReport(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aibom-${report.repoName.replace('/', '-')}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    if (!report) return;
    navigator.clipboard.writeText(JSON.stringify(report, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const integrityChecks = report ? [
    { label: 'Signed Outputs', ok: report.supplyChainIntegrity.signedOutputs },
    { label: 'Provenance Tracking', ok: report.supplyChainIntegrity.provenanceTracking },
    { label: 'Input Sanitization', ok: report.supplyChainIntegrity.inputSanitization },
    { label: 'Rate Limiting', ok: report.supplyChainIntegrity.rateLimiting },
    { label: 'Audit Logging', ok: report.supplyChainIntegrity.auditLogging },
  ] : [];

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-[3rem] p-10 shadow-2xl">
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-3 mb-1">
            <Shield className="w-7 h-7 text-emerald-400" /> AIBOM Generator
          </h2>
          <p className="text-slate-400 text-sm">
            AI Bill of Materials — every model, API, tool, and dependency used in analysis. Verifiable by downstream agents.
            {repoName && <span className="ml-2 text-slate-500">· {repoName}</span>}
          </p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={isLoading}
          className="flex items-center gap-2 px-6 py-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 rounded-2xl text-sm font-black uppercase tracking-widest transition-all disabled:opacity-40"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          {isLoading ? 'Generating...' : report ? 'Regenerate' : 'Generate AIBOM'}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl mb-6 text-rose-400 text-sm">{error}</div>
      )}

      {isLoading && (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
          <p className="text-slate-400 text-sm">Building AI Bill of Materials...</p>
        </div>
      )}

      {report && !isLoading && (
        <div className="space-y-6">
          {/* Trust gauge + actions */}
          <div className="flex flex-col sm:flex-row items-start justify-between gap-6 p-8 bg-slate-950 rounded-2xl border border-slate-800">
            <TrustGauge score={report.trustScore} />
            <div className="flex gap-3 flex-wrap">
              <button onClick={handleDownload} className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-emerald-500/20 transition-colors">
                <Download className="w-3.5 h-3.5" /> Download JSON
              </button>
              <button onClick={handleCopy} className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 border border-slate-700 text-slate-300 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-700 transition-colors">
                {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy JSON'}
              </button>
            </div>
          </div>

          <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800">
            <p className="text-slate-300 text-sm leading-relaxed">{report.summary}</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 flex-wrap">
            {(['models', 'tools', 'apis', 'integrity'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeTab === tab ? 'bg-emerald-600 text-white' : 'bg-slate-950 border border-slate-800 text-slate-500 hover:text-white'
                }`}
              >
                {tab === 'models' && `Models (${report.models.length})`}
                {tab === 'tools' && `Tools (${report.tools.length})`}
                {tab === 'apis' && `APIs (${report.apis.length})`}
                {tab === 'integrity' && 'Integrity'}
              </button>
            ))}
          </div>

          {activeTab === 'models' && (
            <div className="space-y-3">
              {report.models.map((m, i) => (
                <div key={i} className="p-5 bg-slate-950 rounded-2xl border border-slate-800">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <span className="text-white font-bold text-sm">{m.name}</span>
                      <span className="text-slate-500 text-xs ml-2">{m.provider} · v{m.version}</span>
                    </div>
                    {m.trustedSource ? (
                      <span className="flex items-center gap-1 text-[9px] text-emerald-400 font-black uppercase"><Lock className="w-2.5 h-2.5" /> Verified</span>
                    ) : (
                      <span className="flex items-center gap-1 text-[9px] text-amber-400 font-black uppercase"><Lock className="w-2.5 h-2.5" /> Unverified</span>
                    )}
                  </div>
                  <p className="text-slate-400 text-xs">{m.purpose}</p>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {m.inputTypes.map(t => <span key={t} className="text-[9px] px-2 py-0.5 bg-slate-800 border border-slate-700 text-slate-400 rounded-full">{t}</span>)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'tools' && (
            <div className="space-y-3">
              {report.tools.map((t, i) => (
                <div key={i} className="p-5 bg-slate-950 rounded-2xl border border-slate-800 flex items-start gap-4">
                  <Package className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap mb-1">
                      <span className="text-white font-bold text-sm">{t.name}</span>
                      <span className="text-slate-500 text-xs">v{t.version}</span>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full border font-bold uppercase ${categoryColor[t.category] || categoryColor.sdk}`}>{t.category}</span>
                      {t.externalAccess && <span className="text-[9px] px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-full font-bold uppercase flex items-center gap-1"><ExternalLink className="w-2 h-2" /> External</span>}
                    </div>
                    <p className="text-slate-400 text-xs">{t.purpose}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'apis' && (
            <div className="space-y-3">
              {report.apis.map((a, i) => (
                <div key={i} className="p-5 bg-slate-950 rounded-2xl border border-slate-800">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <span className="text-white font-bold text-sm">{a.name}</span>
                      <code className="text-indigo-400 text-xs ml-2">{a.endpoint}</code>
                    </div>
                    {a.trustedSource ? (
                      <span className="text-[9px] text-emerald-400 font-black uppercase">Trusted</span>
                    ) : (
                      <span className="text-[9px] text-amber-400 font-black uppercase">External</span>
                    )}
                  </div>
                  <p className="text-slate-400 text-xs mb-2">{a.purpose}</p>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span>Auth: <span className="text-slate-400">{a.authMethod}</span></span>
                    <span>Shares: <span className="text-slate-400">{a.dataShared.join(', ')}</span></span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'integrity' && (
            <div className="space-y-3">
              {integrityChecks.map(({ label, ok }) => (
                <div key={label} className={`flex items-center gap-4 p-5 rounded-2xl border ${ok ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-rose-500/5 border-rose-500/20'}`}>
                  {ok ? <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" /> : <Shield className="w-5 h-5 text-rose-400 shrink-0" />}
                  <span className="text-white font-bold text-sm">{label}</span>
                  <span className={`ml-auto text-[9px] font-black uppercase tracking-widest ${ok ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {ok ? 'Active' : 'Not Implemented'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!report && !isLoading && (
        <div className="flex flex-col items-center justify-center py-12 opacity-40">
          <Shield className="w-16 h-16 text-slate-700 mb-4" />
          <p className="text-slate-500 text-sm uppercase tracking-widest font-bold">Generate AIBOM to document your AI supply chain</p>
        </div>
      )}
    </div>
  );
}
