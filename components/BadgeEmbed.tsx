import React, { useState } from 'react';
import { Copy, CheckCircle2, X, Link } from 'lucide-react';

interface BadgeEmbedProps {
  owner: string;
  repo: string;
  onClose: () => void;
}

const BadgeEmbed: React.FC<BadgeEmbedProps> = ({ owner, repo, onClose }) => {
  const [copied, setCopied] = useState<string | null>(null);

  const badgeUrl = `https://gitmindpro.vercel.app/api/badge?owner=${owner}&repo=${repo}`;
  const linkUrl = 'https://gitmindpro.vercel.app';

  const snippets = {
    markdown: `[![GitMind Score](${badgeUrl})](${linkUrl})`,
    html: `<a href="${linkUrl}"><img src="${badgeUrl}" alt="GitMind Score" /></a>`,
    rst: `.. image:: ${badgeUrl}\n   :target: ${linkUrl}\n   :alt: GitMind Score`,
    url: badgeUrl,
  };

  const copySnippet = async (key: string, text: string) => {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full mx-4 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <Link className="w-5 h-5 text-indigo-400" /> Repo Badge
          </h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-6">
          {/* Live Preview */}
          <div className="text-center">
            <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-3">Preview</p>
            <div className="inline-block bg-slate-800 rounded-xl p-4 border border-slate-700">
              <img
                src={badgeUrl}
                alt="GitMind Score Badge"
                className="h-5"
                onError={e => { (e.target as HTMLImageElement).alt = 'Badge loading...'; }}
              />
            </div>
            <p className="text-[10px] text-slate-600 mt-2">
              Badge updates automatically when you re-analyze (must be shared/public)
            </p>
          </div>

          {/* Embed Snippets */}
          <div className="space-y-3">
            {([
              { key: 'markdown', label: 'Markdown', desc: 'For README.md' },
              { key: 'html', label: 'HTML', desc: 'For websites' },
              { key: 'rst', label: 'reStructuredText', desc: 'For Python docs' },
              { key: 'url', label: 'Image URL', desc: 'Direct link' },
            ] as const).map(({ key, label, desc }) => (
              <div key={key} className="bg-slate-800/50 rounded-xl border border-slate-700 p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <div>
                    <span className="text-xs text-white font-bold">{label}</span>
                    <span className="text-[10px] text-slate-600 ml-2">{desc}</span>
                  </div>
                  <button
                    onClick={() => void copySnippet(key, snippets[key])}
                    className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all"
                  >
                    {copied === key ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {copied === key ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <pre className="text-[10px] text-slate-400 font-mono bg-slate-950 px-3 py-2 rounded-lg overflow-x-auto whitespace-pre-wrap break-all">
                  {snippets[key]}
                </pre>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BadgeEmbed;
