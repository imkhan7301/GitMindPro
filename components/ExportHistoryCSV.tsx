import React, { useState } from 'react';
import { Download, FileText, X, CheckCircle2 } from 'lucide-react';
import type { SavedAnalysis, SavedPRReview } from '../types';

interface Props {
  analyses: SavedAnalysis[];
  prReviews: SavedPRReview[];
  onClose: () => void;
}

const ExportHistoryCSV: React.FC<Props> = ({ analyses, prReviews, onClose }) => {
  const [exported, setExported] = useState<'analyses' | 'reviews' | null>(null);

  const escapeCSV = (val: string): string => {
    if (val.includes(',') || val.includes('"') || val.includes('\n')) {
      return `"${val.replace(/"/g, '""')}"`;
    }
    return val;
  };

  const exportAnalyses = () => {
    const headers = ['ID', 'Repository', 'Owner', 'URL', 'Summary', 'Tech Stack', 'Overall Score', 'Date'];
    const rows = analyses.map(a => [
      a.id,
      a.repoName,
      a.repoOwner,
      a.repoUrl,
      escapeCSV(a.summary || ''),
      escapeCSV((a.techStack || []).join('; ')),
      a.scorecard ? ((a.scorecard.maintenance + a.scorecard.documentation + a.scorecard.innovation + a.scorecard.security) / 4).toFixed(1) : '',
      new Date(a.createdAt).toISOString(),
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    downloadCSV(csv, `gitmind-analyses-${new Date().toISOString().slice(0, 10)}.csv`);
    setExported('analyses');
    setTimeout(() => setExported(null), 2000);
  };

  const exportPRReviews = () => {
    const headers = ['ID', 'Repository', 'Owner', 'PR Number', 'PR Title', 'Files Changed', 'Risk Level', 'Date'];
    const rows = prReviews.map(r => [
      r.id,
      r.repoName,
      r.repoOwner,
      r.prNumber.toString(),
      escapeCSV(r.prTitle || ''),
      r.fileCount.toString(),
      r.riskLevel,
      new Date(r.createdAt).toISOString(),
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    downloadCSV(csv, `gitmind-pr-reviews-${new Date().toISOString().slice(0, 10)}.csv`);
    setExported('reviews');
    setTimeout(() => setExported(null), 2000);
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full mx-4 shadow-2xl animate-in zoom-in p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-cyan-500/15 rounded-xl flex items-center justify-center">
              <Download className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">Export Data</h2>
              <p className="text-xs text-slate-500">Download your history as CSV</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <div className="space-y-3">
          {/* Analyses Export */}
          <button
            onClick={exportAnalyses}
            disabled={analyses.length === 0}
            className="w-full flex items-center gap-4 p-4 bg-slate-800/60 hover:bg-slate-800 border border-slate-700 hover:border-indigo-500/40 rounded-2xl transition-all group disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <div className="w-10 h-10 bg-indigo-500/15 rounded-xl flex items-center justify-center shrink-0">
              {exported === 'analyses' ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <FileText className="w-5 h-5 text-indigo-400" />}
            </div>
            <div className="text-left flex-1">
              <div className="text-sm font-bold text-white">Repository Analyses</div>
              <div className="text-xs text-slate-500">{analyses.length} record{analyses.length !== 1 ? 's' : ''} — scores, tech stacks, summaries</div>
            </div>
            <Download className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 transition-colors" />
          </button>

          {/* PR Reviews Export */}
          <button
            onClick={exportPRReviews}
            disabled={prReviews.length === 0}
            className="w-full flex items-center gap-4 p-4 bg-slate-800/60 hover:bg-slate-800 border border-slate-700 hover:border-emerald-500/40 rounded-2xl transition-all group disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <div className="w-10 h-10 bg-emerald-500/15 rounded-xl flex items-center justify-center shrink-0">
              {exported === 'reviews' ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <FileText className="w-5 h-5 text-emerald-400" />}
            </div>
            <div className="text-left flex-1">
              <div className="text-sm font-bold text-white">PR Reviews</div>
              <div className="text-xs text-slate-500">{prReviews.length} review{prReviews.length !== 1 ? 's' : ''} — risk levels, file counts, titles</div>
            </div>
            <Download className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 transition-colors" />
          </button>
        </div>

        <p className="text-[10px] text-slate-600 mt-4 text-center">Files will be saved to your downloads folder</p>
      </div>
    </div>
  );
};

export default ExportHistoryCSV;
