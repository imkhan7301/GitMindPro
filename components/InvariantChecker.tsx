import { useState } from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle, RefreshCw, Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react';

export interface InvariantCheckResult {
  status: 'PASS' | 'FAIL' | 'WARN';
  confidence: number;
  reason: string;
  detectedRisks: string[];
  owaspFlags: string[];
  recommendedAction: 'proceed' | 'reject_and_alert' | 'review';
  checkedAt: string;
  goalFidelityScore: number;
  hijackDetected: boolean;
  contextPoisoningDetected: boolean;
}

interface Props {
  onCheck: () => Promise<InvariantCheckResult>;
  loading?: boolean;
  repoName?: string;
  goal?: string;
}

const STATUS_CONFIG = {
  PASS: {
    icon: ShieldCheck,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/30',
    label: 'Analysis Verified',
    desc: 'Goal alignment confirmed. No tampering detected.',
  },
  WARN: {
    icon: AlertTriangle,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/30',
    label: 'Requires Review',
    desc: 'Minor deviations detected. Human review recommended.',
  },
  FAIL: {
    icon: ShieldAlert,
    color: 'text-rose-400',
    bg: 'bg-rose-500/10 border-rose-500/30',
    label: 'Integrity Failure',
    desc: 'Goal hijack or tampering detected. Reject this analysis.',
  },
};

const ACTION_COLORS = {
  proceed: 'text-emerald-400',
  review: 'text-amber-400',
  reject_and_alert: 'text-rose-400',
};

const ACTION_LABELS = {
  proceed: 'Proceed safely',
  review: 'Manual review required',
  reject_and_alert: 'Reject & alert team',
};

export default function InvariantChecker({ onCheck, loading, repoName, goal }: Props) {
  const [result, setResult] = useState<InvariantCheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRun = async () => {
    setError(null);
    try {
      const res = await onCheck();
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invariant check failed');
    }
  };

  const cfg = result ? STATUS_CONFIG[result.status] : null;

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-[3rem] p-10 shadow-2xl">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-3 mb-1">
            <ShieldCheck className="w-6 h-6 text-emerald-400" /> Invariant Checker
          </h2>
          <p className="text-slate-400 text-sm">
            ASI01/ASI04 guard — validates that this analysis strictly matches the original goal and has not been hijacked or tampered with.
            {repoName && <span className="text-slate-500"> — {repoName}</span>}
          </p>
        </div>
        <button
          onClick={() => void handleRun()}
          disabled={loading}
          className="shrink-0 flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 rounded-xl text-sm font-bold text-white transition-all shadow-lg shadow-emerald-500/20"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          {loading ? 'Checking...' : result ? 'Re-Check' : 'Run Invariant Check'}
        </button>
      </div>

      {goal && (
        <div className="mb-6 px-5 py-3 bg-slate-950 border border-slate-800 rounded-2xl">
          <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold block mb-1">Original Goal</span>
          <span className="text-slate-300 text-sm">{goal}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 px-5 py-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300 text-sm mb-6">
          <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {loading && !result && (
        <div className="flex flex-col items-center justify-center py-16 opacity-60">
          <Loader2 className="w-10 h-10 text-emerald-400 animate-spin mb-4" />
          <p className="text-slate-400 font-bold">Running zero-trust verification...</p>
        </div>
      )}

      {!result && !loading && !error && (
        <div className="flex flex-col items-center justify-center py-14 opacity-30">
          <ShieldCheck className="w-16 h-16 text-slate-600 mb-4" />
          <p className="text-slate-500 font-black uppercase tracking-widest text-sm">Analysis not yet verified</p>
        </div>
      )}

      {result && cfg && (
        <div className="space-y-6">
          {/* Status Banner */}
          <div className={`flex items-center gap-5 px-6 py-5 rounded-2xl border ${cfg.bg}`}>
            <cfg.icon className={`w-10 h-10 shrink-0 ${cfg.color}`} />
            <div className="flex-1">
              <div className={`text-xl font-black ${cfg.color}`}>{cfg.label}</div>
              <p className="text-slate-300 text-sm mt-1">{cfg.desc}</p>
            </div>
            <div className="text-right">
              <div className={`text-3xl font-black ${cfg.color}`}>{result.confidence}%</div>
              <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Confidence</div>
            </div>
          </div>

          {/* Scores Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-center">
              <div className="text-2xl font-black text-white mb-0.5">{result.goalFidelityScore}%</div>
              <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Goal Fidelity</div>
            </div>
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-center">
              {result.hijackDetected ? (
                <XCircle className="w-7 h-7 text-rose-400 mx-auto mb-0.5" />
              ) : (
                <CheckCircle2 className="w-7 h-7 text-emerald-400 mx-auto mb-0.5" />
              )}
              <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Hijack</div>
            </div>
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-center">
              {result.contextPoisoningDetected ? (
                <XCircle className="w-7 h-7 text-rose-400 mx-auto mb-0.5" />
              ) : (
                <CheckCircle2 className="w-7 h-7 text-emerald-400 mx-auto mb-0.5" />
              )}
              <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Poisoning</div>
            </div>
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-center">
              <div className={`text-sm font-black mb-0.5 ${ACTION_COLORS[result.recommendedAction]}`}>
                {result.recommendedAction === 'proceed' ? '✓' : result.recommendedAction === 'review' ? '⚠' : '✗'}
              </div>
              <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Action</div>
            </div>
          </div>

          {/* Reason */}
          <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800">
            <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">Checker Verdict</div>
            <p className="text-slate-300 text-sm leading-relaxed">{result.reason}</p>
          </div>

          {/* Recommended Action */}
          <div className="flex items-center gap-3 px-5 py-3 bg-slate-950 rounded-2xl border border-slate-800">
            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Recommended Action:</span>
            <span className={`font-black text-sm ${ACTION_COLORS[result.recommendedAction]}`}>
              {ACTION_LABELS[result.recommendedAction]}
            </span>
          </div>

          {/* OWASP Flags */}
          {result.owaspFlags.length > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-3">OWASP Agentic Flags</div>
              <div className="flex flex-wrap gap-2">
                {result.owaspFlags.map((flag, i) => (
                  <span key={i} className="px-3 py-1 bg-rose-500/10 border border-rose-500/20 rounded-full text-[10px] font-black text-rose-400 uppercase">
                    {flag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Detected Risks */}
          {result.detectedRisks.length > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-3">Detected Risks</div>
              <ul className="space-y-2">
                {result.detectedRisks.map((risk, i) => (
                  <li key={i} className="flex items-start gap-2 text-slate-300 text-sm">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                    {risk}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Timestamp */}
          <div className="flex items-center gap-2 text-[10px] text-slate-600">
            <Clock className="w-3 h-3" />
            Checked at {new Date(result.checkedAt).toLocaleTimeString()}
          </div>
        </div>
      )}
    </div>
  );
}
