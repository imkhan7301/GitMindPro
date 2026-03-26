import { useState } from 'react';
import { GitBranch, Copy, CheckCircle2, Wand2, ChevronDown, ChevronUp } from 'lucide-react';

export interface GeneratedCommit {
  subject: string;
  body: string;
  breaking: string;
  type: string;
  scope: string;
  fullMessage: string;
}

interface Props {
  onGenerate: (input: string) => Promise<GeneratedCommit>;
  repoName?: string;
}

const COMMIT_TYPES = [
  { type: 'feat', label: 'Feature', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' },
  { type: 'fix', label: 'Bug Fix', color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/30' },
  { type: 'chore', label: 'Chore', color: 'text-slate-400', bg: 'bg-slate-500/10 border-slate-700' },
  { type: 'refactor', label: 'Refactor', color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/30' },
  { type: 'docs', label: 'Docs', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30' },
  { type: 'test', label: 'Tests', color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/30' },
  { type: 'perf', label: 'Perf', color: 'text-sky-400', bg: 'bg-sky-500/10 border-sky-500/30' },
  { type: 'ci', label: 'CI', color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/30' },
];

export default function CommitMessageGenerator({ onGenerate, repoName }: Props) {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<GeneratedCommit | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showBody, setShowBody] = useState(false);

  const handleGenerate = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await onGenerate(input.trim());
      setResult(res);
      setShowBody(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const typeInfo = result ? COMMIT_TYPES.find(t => t.type === result.type) : null;

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-6 border-b border-slate-800">
        <div className="w-9 h-9 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-center">
          <GitBranch className="w-4 h-4 text-emerald-400" />
        </div>
        <div>
          <h3 className="text-base font-black text-white">AI Commit Message Generator</h3>
          <p className="text-[10px] text-slate-500 mt-0.5">
            {repoName ? `Conventional commits for ${repoName}` : 'Generate perfect conventional commits from a diff or description'}
          </p>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {/* Input */}
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">
            Paste a git diff or describe your changes
          </label>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={`Example:\n- Added user authentication with JWT tokens\n- Fixed password reset email not sending\n- Refactored auth middleware for better error handling\n\nOr paste a raw git diff here...`}
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm text-slate-300 placeholder:text-slate-700 outline-none focus:border-slate-600 resize-none font-mono"
            rows={5}
          />
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading || !input.trim()}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
            loading || !input.trim()
              ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white'
          }`}
        >
          <Wand2 className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Generating...' : 'Generate Commit Message'}
        </button>

        {error && (
          <p className="text-rose-400 text-xs font-bold">{error}</p>
        )}

        {/* Result */}
        {result && (
          <div className="space-y-3 animate-in fade-in duration-500">
            {/* Type badge */}
            <div className="flex items-center gap-2 flex-wrap">
              {typeInfo && (
                <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border ${typeInfo.bg} ${typeInfo.color}`}>
                  {result.type}
                </span>
              )}
              {result.scope && (
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-800">
                  scope: {result.scope}
                </span>
              )}
              {result.breaking && (
                <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border border-rose-500/40 bg-rose-500/10 text-rose-400">
                  ⚠ BREAKING CHANGE
                </span>
              )}
            </div>

            {/* Subject line */}
            <div className="bg-slate-950 border border-slate-700 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Commit Subject</span>
                <button
                  onClick={() => handleCopy(result.fullMessage)}
                  className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors"
                >
                  {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied!' : 'Copy Full'}
                </button>
              </div>
              <div className="p-4 font-mono text-sm text-white whitespace-pre-wrap break-all">
                {result.subject}
              </div>
            </div>

            {/* Body toggle */}
            {(result.body || result.breaking) && (
              <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
                <button
                  onClick={() => setShowBody(p => !p)}
                  className="w-full flex items-center justify-between px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-300 transition-colors"
                >
                  <span>Commit Body & Breaking Change Notes</span>
                  {showBody ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
                {showBody && (
                  <div className="px-4 pb-4 font-mono text-xs text-slate-400 whitespace-pre-wrap border-t border-slate-800 pt-3">
                    {result.body}
                    {result.breaking && (
                      <div className="mt-3 text-rose-400">BREAKING CHANGE: {result.breaking}</div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Full message copyable */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopy(`git commit -m "${result.subject}"`)}
                className="text-[10px] font-mono text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                $ git commit -m &quot;{result.subject.slice(0, 50)}{result.subject.length > 50 ? '...' : ''}&quot;
              </button>
            </div>

            {/* Regenerate hint */}
            <p className="text-[10px] text-slate-600">
              Not happy with this? Refine your description and generate again.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
