import React, { useState } from 'react';
import { Copy, CheckCircle2, AlertTriangle, GitBranch, Loader2, ExternalLink } from 'lucide-react';

interface ReadmeGeneratorProps {
  readme: string;
  onCommit: (token?: string) => Promise<void>;
  committing: boolean;
  commitUrl: string | null;
  commitError: string | null;
}

const ReadmeGenerator: React.FC<ReadmeGeneratorProps> = ({
  readme,
  onCommit,
  committing,
  commitUrl,
  commitError,
}) => {
  const [copied, setCopied] = useState(false);
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [customToken, setCustomToken] = useState('');
  const [tab, setTab] = useState<'preview' | 'raw'>('preview');

  const handleCopy = () => {
    void navigator.clipboard.writeText(readme).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Minimal markdown → HTML renderer for preview
  const renderMarkdown = (md: string): string => {
    return md
      .replace(/^### (.+)$/gm, '<h3 style="color:#e2e8f0;font-size:14px;font-weight:900;margin:20px 0 6px;">$1</h3>')
      .replace(/^## (.+)$/gm, '<h2 style="color:#fff;font-size:17px;font-weight:900;margin:24px 0 8px;border-bottom:1px solid #1e293b;padding-bottom:8px;">$1</h2>')
      .replace(/^# (.+)$/gm, '<h1 style="color:#fff;font-size:22px;font-weight:900;margin:0 0 12px;">$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong style="color:#e2e8f0;">$1</strong>')
      .replace(/`([^`]+)`/g, '<code style="background:#1e293b;color:#818cf8;padding:2px 6px;border-radius:4px;font-size:12px;">$1</code>')
      .replace(/^\- (.+)$/gm, '<li style="color:#94a3b8;margin:4px 0;padding-left:4px;">$1</li>')
      .replace(/(<li[^>]*>.*<\/li>\n?)+/g, '<ul style="padding-left:20px;margin:8px 0;">$&</ul>')
      .replace(/\n\n/g, '<br><br>')
      .replace(/\n/g, '<br>');
  };

  return (
    <div className="space-y-5">
      {/* Header + actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-black text-emerald-400 uppercase tracking-widest">
            Generated
          </span>
          <span className="text-xs text-slate-400">{readme.split('\n').length} lines</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTab(t => t === 'preview' ? 'raw' : 'preview')}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold text-slate-300 transition-all"
          >
            {tab === 'preview' ? 'View Raw' : 'Preview'}
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold text-slate-300 transition-all"
          >
            {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden max-h-[500px] overflow-y-auto custom-scrollbar">
        {tab === 'raw' ? (
          <pre className="p-5 text-xs text-slate-300 whitespace-pre-wrap font-mono leading-relaxed">
            {readme}
          </pre>
        ) : (
          <div
            className="p-6 text-sm leading-relaxed"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(readme) }}
          />
        )}
      </div>

      {/* Commit section */}
      <div className="border-t border-slate-800 pt-4 space-y-3">
        {commitUrl ? (
          <div className="flex items-center gap-3 px-4 py-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-emerald-300 text-xs font-bold flex-1">README.md committed to your repo!</span>
            <a
              href={commitUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-emerald-400 underline hover:no-underline shrink-0"
            >
              View on GitHub <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        ) : (
          <>
            <button
              onClick={() => void onCommit(customToken || undefined)}
              disabled={committing}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-sm font-bold text-white transition-all shadow-lg shadow-indigo-500/20"
            >
              {committing ? <Loader2 className="w-4 h-4 animate-spin" /> : <GitBranch className="w-4 h-4" />}
              {committing ? 'Committing…' : 'Commit README.md to Repo'}
            </button>
            {commitError && (
              <p className="text-xs text-rose-400 flex items-center gap-1.5">
                <AlertTriangle className="w-3 h-3 shrink-0" />
                {commitError}
              </p>
            )}
            {(commitError?.includes('write access') || showTokenInput) && (
              <div className="flex items-center gap-2">
                <input
                  type="password"
                  placeholder="Paste GitHub PAT with repo scope…"
                  value={customToken}
                  onChange={e => setCustomToken(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <button
                  onClick={() => void onCommit(customToken)}
                  disabled={!customToken || committing}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-xl text-xs font-bold text-white transition-all"
                >
                  Commit
                </button>
              </div>
            )}
            <button
              onClick={() => setShowTokenInput(t => !t)}
              className="text-[10px] text-slate-600 hover:text-slate-400 transition-colors"
            >
              {showTokenInput ? 'Hide token input' : 'Use a different GitHub token'}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default ReadmeGenerator;
