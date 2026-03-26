import React from 'react';
import { SavedAnalysis } from '../types';
import { Activity } from 'lucide-react';

interface AnalysisHistoryProps {
  analyses: SavedAnalysis[];
  loading: boolean;
  onSelect: (repoUrl: string, analysisId: string) => void;
  favorites?: string[];
  onToggleFavorite?: (repoUrl: string) => void;
}

const timeAgo = (dateStr: string): string => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
};

const AnalysisHistory: React.FC<AnalysisHistoryProps> = ({ analyses, loading, onSelect, favorites = [], onToggleFavorite }) => {
  if (loading) {
    return (
      <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <Activity className="w-5 h-5 text-indigo-400 animate-pulse" />
          <h3 className="text-lg font-black text-white">Loading history...</h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-slate-800/50 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (analyses.length === 0) {
    return null;
  }

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 hover:border-indigo-500/30 transition-all">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-indigo-500/20 rounded-2xl flex items-center justify-center">
          <Activity className="w-5 h-5 text-indigo-400" />
        </div>
        <div>
          <h3 className="text-lg font-black text-white">Recent Analyses</h3>
          <p className="text-xs text-slate-500">{analyses.length} saved</p>
        </div>
      </div>
      <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
        {analyses.map((a) => (
          <button
            key={a.id}
            onClick={() => onSelect(a.repoUrl, a.id)}
            className="w-full text-left bg-slate-950/60 hover:bg-slate-800/60 border border-slate-800 hover:border-indigo-500/40 rounded-2xl p-4 transition-all group"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-white font-bold text-sm group-hover:text-indigo-300 transition-colors">
                {a.repoOwner}/{a.repoName}
              </span>
              <div className="flex items-center gap-2">
                {onToggleFavorite && (
                  <span
                    role="button"
                    onClick={(e) => { e.stopPropagation(); onToggleFavorite(a.repoUrl); }}
                    className={`text-sm cursor-pointer hover:scale-110 transition-transform ${favorites.includes(a.repoUrl) ? 'text-amber-400' : 'text-slate-700 hover:text-amber-400'}`}
                    title={favorites.includes(a.repoUrl) ? 'Unpin' : 'Pin to dashboard'}
                  >{favorites.includes(a.repoUrl) ? '★' : '☆'}</span>
                )}
                <span className="text-[10px] text-slate-600 font-mono">{timeAgo(a.createdAt)}</span>
              </div>
            </div>
            {a.techStack.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {a.techStack.slice(0, 4).map((tech) => (
                  <span key={tech} className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 rounded-full text-[9px] font-bold uppercase tracking-wider">
                    {tech}
                  </span>
                ))}
                {a.techStack.length > 4 && (
                  <span className="text-[9px] text-slate-600">+{a.techStack.length - 4}</span>
                )}
              </div>
            )}
            {a.summary && (
              <p className="text-slate-500 text-xs mt-2 line-clamp-2 leading-relaxed">{a.summary.slice(0, 120)}{a.summary.length > 120 ? '...' : ''}</p>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default AnalysisHistory;
