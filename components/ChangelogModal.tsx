import React from 'react';
import { X, Sparkles, Zap, BarChart3, Settings, Link, Shield, Bell, Key, GitBranch, Sun, Clock } from 'lucide-react';

const CHANGELOG_VERSION = '2.5.0';

interface ChangelogEntry {
  version: string;
  date: string;
  highlights: { icon: React.ElementType; title: string; desc: string; tag?: 'new' | 'improved' }[];
}

const changelog: ChangelogEntry[] = [
  {
    version: '2.5.0',
    date: 'Mar 2026',
    highlights: [
      { icon: Link, title: 'Badge Embed Modal', desc: 'Live SVG preview with Markdown, HTML, and RST copy snippets — drop a score badge in your README.', tag: 'new' },
      { icon: BarChart3, title: 'Analysis Diff', desc: 'Compare two analyses side-by-side to track improvement over time — score deltas, tech stack changes.', tag: 'new' },
      { icon: Settings, title: 'Settings Panel', desc: 'Centralized settings: theme, notifications, API key management all in one place.', tag: 'new' },
      { icon: Bell, title: 'Webhook Activity Feed', desc: 'See real-time GitHub webhook events, push/PR events flowing through your integration.', tag: 'new' },
    ],
  },
  {
    version: '2.4.0',
    date: 'Mar 2026',
    highlights: [
      { icon: Key, title: 'Public REST API', desc: 'Programmatic access with gmp_* API keys — analyze repos via cURL or any HTTP client.', tag: 'new' },
      { icon: Sun, title: 'Dark / Light Theme', desc: 'Toggle between dark and light mode, persisted across sessions.', tag: 'new' },
      { icon: Zap, title: 'Keyboard Shortcuts', desc: 'Press ? for overlay, / to focus search, ⌘K for command palette.' },
    ],
  },
  {
    version: '2.3.0',
    date: 'Mar 2026',
    highlights: [
      { icon: Clock, title: 'Scheduled Analysis', desc: 'Watch repos for daily automated AI analysis via Vercel Cron.', tag: 'new' },
      { icon: Bell, title: 'Email Digests', desc: 'Weekly email summaries of your watched repos via Resend.', tag: 'new' },
      { icon: Shield, title: 'Sentry Error Tracking', desc: 'Production crash detection with session replay and PII scrubbing.', tag: 'improved' },
      { icon: GitBranch, title: 'GitHub App & Slack', desc: 'Install the GitHub App and auto-post analysis results to Slack.' },
    ],
  },
];

interface ChangelogModalProps {
  onClose: () => void;
}

const ChangelogModal: React.FC<ChangelogModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full mx-4 shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-500/20 rounded-xl flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">What&apos;s New</h2>
              <p className="text-[10px] text-slate-500">Latest updates and improvements</p>
          
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-8">
          {changelog.map((entry, i) => (
            <div key={entry.version}>
              {/* Version header */}
              <div className="flex items-center gap-3 mb-4">
                <span className="text-xs font-black text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg">v{entry.version}</span>
                <span className="text-[10px] text-slate-600 font-mono">{entry.date}</span>
                {i === 0 && <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">Latest</span>}
              </div>

              {/* Items */}
              <div className="space-y-3">
                {entry.highlights.map(h => (
                  <div key={h.title} className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-800/50 transition-colors">
                    <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <h.icon className="w-4 h-4 text-slate-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-white font-bold">{h.title}</span>
                        {h.tag === 'new' && <span className="text-[8px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded">New</span>}
                        {h.tag === 'improved' && <span className="text-[8px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">Improved</span>}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{h.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {i < changelog.length - 1 && <hr className="border-slate-800 mt-6" />}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 text-center">
          <p className="text-[10px] text-slate-600">GitMind Pro · Built with AI, shipped with love</p>
        </div>
      </div>
    </div>
  );
};

export { CHANGELOG_VERSION };
export default ChangelogModal;
