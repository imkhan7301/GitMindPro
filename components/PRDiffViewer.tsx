import React, { useState } from 'react';
import { X, ChevronDown, ChevronRight, FileText } from 'lucide-react';

interface DiffFile {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  patch?: string;
}

interface Props {
  files: DiffFile[];
  prNumber: number;
  prTitle: string;
  onClose: () => void;
}

const parsePatch = (patch: string): { type: 'add' | 'del' | 'ctx' | 'hunk'; text: string; lineOld?: number; lineNew?: number }[] => {
  const lines: { type: 'add' | 'del' | 'ctx' | 'hunk'; text: string; lineOld?: number; lineNew?: number }[] = [];
  let oldLine = 0;
  let newLine = 0;
  for (const raw of patch.split('\n')) {
    if (raw.startsWith('@@')) {
      const match = raw.match(/@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
      if (match) {
        oldLine = parseInt(match[1], 10);
        newLine = parseInt(match[2], 10);
      }
      lines.push({ type: 'hunk', text: raw });
    } else if (raw.startsWith('+')) {
      lines.push({ type: 'add', text: raw.slice(1), lineNew: newLine });
      newLine++;
    } else if (raw.startsWith('-')) {
      lines.push({ type: 'del', text: raw.slice(1), lineOld: oldLine });
      oldLine++;
    } else {
      lines.push({ type: 'ctx', text: raw.startsWith(' ') ? raw.slice(1) : raw, lineOld: oldLine, lineNew: newLine });
      oldLine++;
      newLine++;
    }
  }
  return lines;
};

const PRDiffViewer: React.FC<Props> = ({ files, prNumber, prTitle, onClose }) => {
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(() => {
    // Auto-expand first 3 files
    return new Set(files.filter(f => f.patch).slice(0, 3).map(f => f.filename));
  });

  const toggleFile = (filename: string) => {
    setExpandedFiles(prev => {
      const next = new Set(prev);
      if (next.has(filename)) next.delete(filename);
      else next.add(filename);
      return next;
    });
  };

  const expandAll = () => setExpandedFiles(new Set(files.filter(f => f.patch).map(f => f.filename)));
  const collapseAll = () => setExpandedFiles(new Set());

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="bg-slate-950 border border-slate-700 rounded-3xl max-w-5xl w-full mx-4 shadow-2xl animate-in zoom-in max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 shrink-0">
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-cyan-400" /> PR #{prNumber} Diff
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 truncate max-w-md">{prTitle}</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={expandAll} className="text-[10px] font-bold text-slate-500 hover:text-white transition-colors">Expand All</button>
            <button onClick={collapseAll} className="text-[10px] font-bold text-slate-500 hover:text-white transition-colors">Collapse All</button>
            <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
          </div>
        </div>

        {/* Summary bar */}
        <div className="flex items-center gap-4 px-6 py-3 border-b border-slate-800 shrink-0 text-xs">
          <span className="text-slate-400 font-bold">{files.length} files</span>
          <span className="text-emerald-400 font-mono">+{files.reduce((a, f) => a + f.additions, 0)}</span>
          <span className="text-rose-400 font-mono">-{files.reduce((a, f) => a + f.deletions, 0)}</span>
        </div>

        {/* File diffs */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {files.map(f => {
            const isExpanded = expandedFiles.has(f.filename);
            const parsed = f.patch ? parsePatch(f.patch) : [];

            return (
              <div key={f.filename} className="border-b border-slate-800/60">
                {/* File header */}
                <button
                  onClick={() => f.patch && toggleFile(f.filename)}
                  className="w-full flex items-center gap-3 px-6 py-3 hover:bg-slate-900/60 transition-colors text-left"
                >
                  {f.patch ? (
                    isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  ) : (
                    <span className="w-3.5 h-3.5 shrink-0" />
                  )}
                  <span className={`text-[9px] font-black uppercase w-16 text-center px-1 py-0.5 rounded shrink-0 ${
                    f.status === 'added' ? 'bg-emerald-500/15 text-emerald-400'
                    : f.status === 'removed' ? 'bg-rose-500/15 text-rose-400'
                    : f.status === 'renamed' ? 'bg-sky-500/15 text-sky-400'
                    : 'bg-amber-500/15 text-amber-400'
                  }`}>{f.status}</span>
                  <span className="text-slate-300 text-xs font-mono truncate flex-1">{f.filename}</span>
                  <div className="flex items-center gap-2 text-[10px] font-mono shrink-0">
                    {f.additions > 0 && <span className="text-emerald-400">+{f.additions}</span>}
                    {f.deletions > 0 && <span className="text-rose-400">-{f.deletions}</span>}
                  </div>
                </button>

                {/* Diff content */}
                {isExpanded && parsed.length > 0 && (
                  <div className="bg-black/40 border-t border-slate-800/40 overflow-x-auto">
                    <table className="w-full text-[11px] font-mono leading-5">
                      <tbody>
                        {parsed.map((line, i) => (
                          <tr
                            key={i}
                            className={
                              line.type === 'add' ? 'bg-emerald-500/8'
                              : line.type === 'del' ? 'bg-rose-500/8'
                              : line.type === 'hunk' ? 'bg-indigo-500/5'
                              : ''
                            }
                          >
                            {line.type === 'hunk' ? (
                              <td colSpan={3} className="px-4 py-1 text-indigo-400/70 select-none">{line.text}</td>
                            ) : (
                              <>
                                <td className="w-12 text-right px-2 text-slate-700 select-none border-r border-slate-800/30">
                                  {line.type !== 'add' ? line.lineOld : ''}
                                </td>
                                <td className="w-12 text-right px-2 text-slate-700 select-none border-r border-slate-800/30">
                                  {line.type !== 'del' ? line.lineNew : ''}
                                </td>
                                <td className="px-4 whitespace-pre-wrap">
                                  <span className={`select-none mr-2 ${
                                    line.type === 'add' ? 'text-emerald-500'
                                    : line.type === 'del' ? 'text-rose-500'
                                    : 'text-slate-700'
                                  }`}>{line.type === 'add' ? '+' : line.type === 'del' ? '-' : ' '}</span>
                                  <span className={
                                    line.type === 'add' ? 'text-emerald-300'
                                    : line.type === 'del' ? 'text-rose-300'
                                    : 'text-slate-400'
                                  }>{line.text}</span>
                                </td>
                              </>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PRDiffViewer;
