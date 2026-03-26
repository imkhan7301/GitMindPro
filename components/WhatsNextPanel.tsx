import React, { useEffect, useState } from 'react';
import { GitBranch, GitPullRequest, Share2, X, ChevronRight } from 'lucide-react';

interface WhatsNextAction {
  icon: React.ReactNode;
  label: string;
  description: string;
  onClick: () => void;
  color: string;
}

interface WhatsNextPanelProps {
  onClose: () => void;
  onWatchRepo: () => void;
  onGoToPRTab: () => void;
  onShareScorecard: () => void;
  hasShareToken: boolean;
}

const AUTO_DISMISS_MS = 10_000;

const WhatsNextPanel: React.FC<WhatsNextPanelProps> = ({
  onClose,
  onWatchRepo,
  onGoToPRTab,
  onShareScorecard,
  hasShareToken,
}) => {
  const [progress, setProgress] = useState(100);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Slide in on mount
    const t = setTimeout(() => setVisible(true), 20);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.max(0, 100 - (elapsed / AUTO_DISMISS_MS) * 100);
      setProgress(pct);
      if (pct <= 0) {
        clearInterval(interval);
        handleClose();
      }
    }, 100);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 300);
  };

  const actions: WhatsNextAction[] = [
    {
      icon: <GitBranch className="w-5 h-5" />,
      label: 'Watch This Repo',
      description: 'Get score alerts whenever new code ships',
      onClick: () => { onWatchRepo(); handleClose(); },
      color: 'from-indigo-500/20 to-indigo-500/5 border-indigo-500/30 text-indigo-400',
    },
    {
      icon: <GitPullRequest className="w-5 h-5" />,
      label: 'Review Open PRs',
      description: 'Run AI review on active pull requests',
      onClick: () => { onGoToPRTab(); handleClose(); },
      color: 'from-cyan-500/20 to-cyan-500/5 border-cyan-500/30 text-cyan-400',
    },
    {
      icon: <Share2 className="w-5 h-5" />,
      label: 'Share Scorecard',
      description: hasShareToken ? 'Copy public link to share with your team' : 'Sign in to unlock public sharing',
      onClick: () => { onShareScorecard(); handleClose(); },
      color: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/30 text-emerald-400',
    },
  ];

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 w-[360px] transition-all duration-300 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
    >
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        {/* Progress bar */}
        <div className="h-[2px] bg-slate-800">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-cyan-500 transition-none"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-0.5">Analysis Complete</div>
              <h3 className="text-sm font-black text-white">What's next?</h3>
            </div>
            <button
              onClick={handleClose}
              className="text-slate-500 hover:text-slate-300 transition-colors p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2">
            {actions.map((action) => (
              <button
                key={action.label}
                onClick={action.onClick}
                className={`w-full flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r border transition-all hover:scale-[1.02] active:scale-[0.98] ${action.color}`}
              >
                <div className="shrink-0">{action.icon}</div>
                <div className="flex-1 text-left min-w-0">
                  <div className="text-xs font-bold text-white">{action.label}</div>
                  <div className="text-[10px] text-slate-400 truncate">{action.description}</div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 shrink-0 text-slate-500" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsNextPanel;
