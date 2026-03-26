import { useState } from 'react';
import { BookOpen, Copy, CheckCircle2, Zap, Download } from 'lucide-react';

export interface GeneratedChangelog {
  version: string;
  added: string[];
  fixed: string[];
  improved: string[];
  breaking: string[];
  fullMarkdown: string;
}

interface Props {
  onGenerate: (commits: string, repoName?: string) => Promise<GeneratedChangelog>;
  repoName?: string;
  recentCommits?: { message: string; date?: string; author?: string }[];
}

export default function ChangelogGenerator({ onGenerate, repoName, recentCommits = [] }: Props) {
  const [customInput, setCustomInput] = useState('');
  const [result, setResult] = useState<GeneratedChangelog | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    const commitText = recentCommits.length > 0
      ? recentCommits.slice(0, 30).map(c => `- ${c.message}${c.author ? ` (@${c.author})` : ''}`).join('\n')
      : customInput.trim();

    if (!commitText) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await onGenerate(commitText, repoName);
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.fullMarkdown).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownload = () => {
    if (!result) return;
    const blob = new Blob([result.fullMarkdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'CHANGELOG.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  const SECTION_CONFIG = [
    { key: 'added' as const, label: '✨ Added', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
    { key: 'improved' as const, label: '⚡ Improved', color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/20' },
    { key: 'fixed' as const, label: '🐛 Fixed', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
    { key: 'breaking' as const, label: '💥 Breaking', color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20' },
  ];

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-[3rem] p-10 shadow-2xl">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-3 mb-1">
            <BookOpen className="w-6 h-6 text-violet-400" /> AI Changelog Generator
          </h2>
          <p className="text-slate-400 text-sm">
            {recentCommits.length > 0
              ? `Using ${Math.min(recentCommits.length, 30)} recent commits — generates categorized CHANGELOG.md`
              : 'Paste commit messages or describe changes to generate a CHANGELOG.md'}
          </p>
        </div>
        {!result && !loading && (
          <button
            onClick={handleGenerate}
            disabled={loading || (recentCommits.length === 0 && !customInput.trim())}
            className="shrink-0 flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 rounded-xl text-sm font-bold text-white transition-all"
          >
            <Zap className="w-4 h-4" /> Generate
          </button>
        )}
      </div>

      {recentCommits.length === 0 && (
        <textarea
          value={customInput}
          onChange={e => setCustomInput(e.target.value)}
          placeholder={`Paste commit messages, one per line:\n- feat: add user auth\n- fix: resolve payment bug\n- chore: update deps`}
          className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-sm text-slate-300 placeholder:text-slate-700 outline-none focus:border-violet-500/40 resize-none mb-4 h-28"
        />
      )}

      {recentCommits.length > 0 && !result && !loading && (
        <div className="mb-4 p-4 bg-slate-950 rounded-2xl border border-slate-800">
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-2">Recent commits preview</p>
          <div className="space-y-1 max-h-24 overflow-y-auto">
            {recentCommits.slice(0, 6).map((c, i) => (
              <p key={i} className="text-xs text-slate-400 font-mono truncate">• {c.message}</p>
            ))}
            {recentCommits.length > 6 && <p className="text-[10px] text-slate-600">+{recentCommits.length - 6} more commits</p>}
          </div>
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-3 py-8 justify-center">
          <div className="w-5 h-5 border-2 border-violet-500/30 border-t-violet-400 rounded-full animate-spin" />
          <span className="text-sm text-violet-400 font-bold">AI is reading commits...</span>
        </div>
      )}

      {error && <p className="text-rose-400 text-xs font-bold mb-4">{error}</p>}

      {result && (
        <div className="space-y-5 animate-in fade-in duration-500">
          {/* Version badge */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-black uppercase tracking-widest text-slate-500">Version</span>
              <span className="px-3 py-1 bg-violet-500/10 border border-violet-500/30 rounded-full text-violet-300 text-sm font-black">{result.version}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold text-slate-300 transition-all"
              >
                {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied!' : 'Copy Markdown'}
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-500 border border-violet-500/30 rounded-xl text-xs font-bold text-white transition-all"
              >
                <Download className="w-3.5 h-3.5" /> Download
              </button>
              <button
                onClick={() => setResult(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold text-slate-500 transition-all"
              >
                Regenerate
              </button>
            </div>
          </div>

          {/* Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SECTION_CONFIG.map(({ key, label, color, bg }) => {
              const items = result[key];
              if (items.length === 0) return null;
              return (
                <div key={key} className={`p-5 rounded-2xl border ${bg}`}>
                  <h4 className={`text-xs font-black uppercase tracking-widest mb-3 ${color}`}>{label}</h4>
                  <ul className="space-y-1.5">
                    {items.map((item, i) => (
                      <li key={i} className="text-sm text-slate-300 flex gap-2">
                        <span className="text-slate-600 shrink-0">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          {/* Raw markdown preview */}
          <details className="group">
            <summary className="text-[10px] font-black uppercase tracking-widest text-slate-500 cursor-pointer hover:text-slate-300 transition-colors">
              View raw Markdown
            </summary>
            <pre className="mt-3 p-5 bg-slate-950 border border-slate-800 rounded-2xl overflow-x-auto text-xs text-slate-400 font-mono leading-relaxed">
              <code>{result.fullMarkdown}</code>
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}
