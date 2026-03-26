import { useState } from 'react';
import { GitPullRequest, TrendingUp, TrendingDown, Minus, Loader2, RefreshCw, Clock, Users, AlertTriangle, CheckCircle2, Zap } from 'lucide-react';

export interface PRMergePrediction {
  prNumber: number;
  prTitle: string;
  mergeConfidence: number; // 0–100
  predictedOutcome: 'likely-merge' | 'needs-changes' | 'likely-rejected' | 'uncertain';
  timeToMergeEstimate: string;
  signals: {
    label: string;
    value: string;
    impact: 'positive' | 'negative' | 'neutral';
    weight: number; // 1–5
  }[];
  reviewerInsights: string;
  riskFactors: string[];
  suggestions: string[];
  summary: string;
}

interface Props {
  onPredict: (prUrl: string) => Promise<PRMergePrediction>;
  loading?: boolean;
  repoName?: string;
}

const outcomeConfig: Record<string, { label: string; color: string; bg: string; icon: typeof CheckCircle2 }> = {
  'likely-merge':    { label: 'Likely to Merge', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30', icon: CheckCircle2 },
  'needs-changes':   { label: 'Needs Changes', color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/30',   icon: AlertTriangle },
  'likely-rejected': { label: 'Likely Rejected',  color: 'text-rose-400',   bg: 'bg-rose-500/10 border-rose-500/30',     icon: AlertTriangle },
  'uncertain':       { label: 'Uncertain',         color: 'text-slate-400',  bg: 'bg-slate-500/10 border-slate-500/30',  icon: Minus },
};

function ConfidenceArc({ value }: { value: number }) {
  const r = 52, cx = 64, cy = 64;
  const circ = Math.PI * r; // half arc
  const progress = (value / 100) * circ;
  const color = value >= 70 ? '#10b981' : value >= 40 ? '#f59e0b' : '#f43f5e';
  return (
    <svg width="128" height="80" viewBox="0 0 128 80">
      <path d={`M 12 68 A ${r} ${r} 0 0 1 116 68`} fill="none" stroke="#1e293b" strokeWidth="10" strokeLinecap="round" />
      <path
        d={`M 12 68 A ${r} ${r} 0 0 1 116 68`}
        fill="none"
        stroke={color}
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={`${progress} ${circ}`}
      />
      <text x={cx} y={cy - 2} textAnchor="middle" fill={color} fontSize="22" fontWeight="900">{value}%</text>
      <text x={cx} y={cy + 16} textAnchor="middle" fill="#64748b" fontSize="9" fontWeight="700">MERGE CONFIDENCE</text>
    </svg>
  );
}

export default function PRMergePredictor({ onPredict, loading: externalLoading, repoName }: Props) {
  const [prediction, setPrediction] = useState<PRMergePrediction | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prUrl, setPrUrl] = useState('');

  const isLoading = loading || externalLoading;

  const handleRun = async () => {
    if (!prUrl.trim()) { setError('Enter a PR URL or number'); return; }
    setLoading(true);
    setError(null);
    try {
      const result = await onPredict(prUrl);
      setPrediction(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Prediction failed');
    } finally {
      setLoading(false);
    }
  };

  const outcome = prediction ? outcomeConfig[prediction.predictedOutcome] : null;

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-[3rem] p-10 shadow-2xl">
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-3 mb-1">
            <GitPullRequest className="w-7 h-7 text-purple-400" /> PR Merge Predictor
          </h2>
          <p className="text-slate-400 text-sm">
            AI confidence score per PR — size, CI status, reviewer history, risk level.
            {repoName && <span className="ml-2 text-slate-500">· {repoName}</span>}
          </p>
        </div>
      </div>

      {/* Input */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          value={prUrl}
          onChange={e => setPrUrl(e.target.value)}
          placeholder="PR URL or number (e.g. 123 or https://github.com/owner/repo/pull/123)"
          className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3 text-sm text-white placeholder:text-slate-600 outline-none focus:border-purple-500/60 transition-colors"
        />
        <button
          onClick={handleRun}
          disabled={isLoading}
          className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl text-sm font-black uppercase tracking-widest transition-all disabled:opacity-40"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          {isLoading ? 'Predicting...' : 'Predict'}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl mb-6 text-rose-400 text-sm">{error}</div>
      )}

      {isLoading && (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <Loader2 className="w-10 h-10 text-purple-400 animate-spin" />
          <p className="text-slate-400 text-sm">Analyzing PR signals...</p>
        </div>
      )}

      {prediction && !isLoading && outcome && (
        <div className="space-y-6">
          {/* Confidence arc + outcome */}
          <div className="flex flex-col sm:flex-row items-center gap-8 p-8 bg-slate-950 rounded-2xl border border-slate-800">
            <ConfidenceArc value={prediction.mergeConfidence} />
            <div>
              <span className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl border text-sm font-black uppercase tracking-widest ${outcome.bg} ${outcome.color} mb-3`}>
                <outcome.icon className="w-4 h-4" /> {outcome.label}
              </span>
              <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
                <Clock className="w-4 h-4" /> Est. {prediction.timeToMergeEstimate}
              </div>
              {prediction.prTitle && (
                <p className="text-white font-bold text-sm">#{prediction.prNumber} · {prediction.prTitle}</p>
              )}
            </div>
          </div>

          {/* Summary */}
          <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800">
            <p className="text-slate-300 text-sm leading-relaxed">{prediction.summary}</p>
          </div>

          {/* Signals */}
          <div>
            <h4 className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-4 flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5" /> Confidence Signals
            </h4>
            <div className="space-y-2">
              {prediction.signals.map((sig, i) => (
                <div key={i} className="flex items-center gap-4 p-4 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="shrink-0">
                    {sig.impact === 'positive' && <TrendingUp className="w-4 h-4 text-emerald-400" />}
                    {sig.impact === 'negative' && <TrendingDown className="w-4 h-4 text-rose-400" />}
                    {sig.impact === 'neutral' && <Minus className="w-4 h-4 text-slate-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-slate-400 text-xs">{sig.label}</span>
                    <span className="text-white text-sm font-bold ml-2">{sig.value}</span>
                  </div>
                  <div className="flex gap-1">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <div
                        key={j}
                        className={`w-1.5 h-4 rounded-full ${
                          j < sig.weight
                            ? sig.impact === 'positive' ? 'bg-emerald-500' : sig.impact === 'negative' ? 'bg-rose-500' : 'bg-slate-500'
                            : 'bg-slate-800'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Risk factors */}
          {prediction.riskFactors.length > 0 && (
            <div className="p-5 bg-rose-500/5 border border-rose-500/20 rounded-2xl">
              <h4 className="text-rose-400 font-black text-xs uppercase tracking-widest mb-3 flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5" /> Risk Factors
              </h4>
              <ul className="space-y-1.5">
                {prediction.riskFactors.map((r, i) => (
                  <li key={i} className="text-sm text-slate-400 flex items-start gap-2">
                    <span className="text-rose-500 shrink-0">▸</span> {r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Reviewer insights */}
          {prediction.reviewerInsights && (
            <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl flex items-start gap-3">
              <Users className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
              <p className="text-slate-300 text-sm leading-relaxed">{prediction.reviewerInsights}</p>
            </div>
          )}

          {/* Suggestions */}
          {prediction.suggestions.length > 0 && (
            <div className="p-5 bg-purple-500/5 border border-purple-500/20 rounded-2xl">
              <h4 className="text-purple-400 font-black text-xs uppercase tracking-widest mb-3 flex items-center gap-2">
                <Zap className="w-3.5 h-3.5" /> Suggestions to Improve Merge Chance
              </h4>
              <ul className="space-y-1.5">
                {prediction.suggestions.map((s, i) => (
                  <li key={i} className="text-sm text-slate-400 flex items-start gap-2">
                    <span className="text-purple-400 shrink-0">✦</span> {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {!prediction && !isLoading && (
        <div className="flex flex-col items-center justify-center py-12 opacity-40">
          <GitPullRequest className="w-16 h-16 text-slate-700 mb-4" />
          <p className="text-slate-500 text-sm uppercase tracking-widest font-bold">Enter a PR to predict merge outcome</p>
        </div>
      )}
    </div>
  );
}
