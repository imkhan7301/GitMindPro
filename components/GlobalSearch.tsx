import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, Code, GitPullRequest, X, ArrowRight } from 'lucide-react';
import type { SavedAnalysis, SavedPRReview } from '../types';

interface GlobalSearchProps {
  analyses: SavedAnalysis[];
  prReviews: SavedPRReview[];
  onSelectAnalysis: (repoUrl: string, analysisId: string) => void;
  onClose: () => void;
}

type SearchResult = {
  type: 'analysis' | 'pr';
  id: string;
  title: string;
  subtitle: string;
  date: string;
  repoUrl?: string;
};

const GlobalSearch: React.FC<GlobalSearchProps> = ({ analyses, prReviews, onSelectAnalysis, onClose }) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const results = useMemo<SearchResult[]>(() => {
    const q = query.toLowerCase().trim();
    if (!q) return [];

    const items: SearchResult[] = [];

    for (const a of analyses) {
      const searchable = `${a.repoOwner}/${a.repoName} ${a.summary} ${a.techStack.join(' ')}`.toLowerCase();
      if (searchable.includes(q)) {
        items.push({
          type: 'analysis',
          id: a.id,
          title: `${a.repoOwner}/${a.repoName}`,
          subtitle: a.summary?.slice(0, 100) || a.techStack.slice(0, 3).join(', ') || 'No summary',
          date: new Date(a.createdAt).toLocaleDateString(),
          repoUrl: a.repoUrl,
        });
      }
    }

    for (const pr of prReviews) {
      const searchable = `${pr.repoOwner}/${pr.repoName} ${pr.prTitle} #${pr.prNumber}`.toLowerCase();
      if (searchable.includes(q)) {
        items.push({
          type: 'pr',
          id: pr.id,
          title: `${pr.repoOwner}/${pr.repoName} #${pr.prNumber}`,
          subtitle: pr.prTitle,
          date: new Date(pr.createdAt).toLocaleDateString(),
        });
      }
    }

    return items.slice(0, 20);
  }, [query, analyses, prReviews]);

  return (
    <div className="fixed inset-0 z-[300] flex items-start justify-center pt-[15vh] bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-800">
          <Search className="w-4 h-4 text-slate-500" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search analyses, PR reviews, tech stacks..."
            className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-slate-600"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-slate-600 hover:text-slate-400">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <kbd className="text-[9px] text-slate-600 font-mono border border-slate-800 px-1.5 py-0.5 rounded">ESC</kbd>
        </div>

        {/* Results */}
        <div className="max-h-[50vh] overflow-y-auto p-2 custom-scrollbar">
          {query && results.length === 0 && (
            <div className="text-center py-10 text-slate-600 text-sm">
              No results for &ldquo;{query}&rdquo;
            </div>
          )}

          {!query && (
            <div className="text-center py-10 text-slate-600 text-sm">
              Start typing to search across all your analyses and PR reviews
            </div>
          )}

          {results.map(r => (
            <button
              key={`${r.type}-${r.id}`}
              onClick={() => {
                if (r.type === 'analysis' && r.repoUrl) {
                  onSelectAnalysis(r.repoUrl, r.id);
                }
                onClose();
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-800/80 text-left transition-colors group"
            >
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${r.type === 'analysis' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-violet-500/10 text-violet-400'}`}>
                {r.type === 'analysis' ? <Code className="w-3.5 h-3.5" /> : <GitPullRequest className="w-3.5 h-3.5" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-white font-bold truncate group-hover:text-indigo-300 transition-colors">{r.title}</div>
                <div className="text-[10px] text-slate-600 truncate">{r.subtitle}</div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-[9px] text-slate-700 font-mono">{r.date}</span>
                <ArrowRight className="w-3 h-3 text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </button>
          ))}
        </div>

        {/* Footer */}
        {results.length > 0 && (
          <div className="px-4 py-2 border-t border-slate-800 text-center">
            <span className="text-[10px] text-slate-600">{results.length} result{results.length !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default GlobalSearch;
