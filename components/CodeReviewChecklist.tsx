import React, { useState } from 'react';
import { ClipboardCheck, Copy, CheckCircle2, Download, Shield, Bug, FileText, Zap, GitPullRequest } from 'lucide-react';

export interface ReviewChecklist {
  repoName: string;
  categories: ChecklistCategory[];
  prTemplateMarkdown: string;
  generatedAt: string;
}

export interface ChecklistCategory {
  name: string;
  icon: string;
  items: ChecklistItem[];
}

export interface ChecklistItem {
  id: string;
  label: string;
  priority: 'critical' | 'important' | 'nice-to-have';
  automated: boolean;
}

interface Props {
  checklist: ReviewChecklist;
  loading?: boolean;
  onGenerate?: () => void;
}

const iconMap: Record<string, React.FC<{ className?: string }>> = {
  security: Shield,
  bugs: Bug,
  docs: FileText,
  performance: Zap,
  pr: GitPullRequest,
  default: ClipboardCheck,
};

const priorityBadge = (p: string) => {
  if (p === 'critical') return <span className="text-[9px] font-black bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded">CRITICAL</span>;
  if (p === 'important') return <span className="text-[9px] font-black bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded">IMPORTANT</span>;
  return <span className="text-[9px] font-black bg-slate-700/50 text-slate-400 px-1.5 py-0.5 rounded">NICE</span>;
};

const CodeReviewChecklist: React.FC<Props> = ({ checklist, loading, onGenerate }) => {
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);
  const [showTemplate, setShowTemplate] = useState(false);

  const totalItems = checklist.categories.reduce((s, c) => s + c.items.length, 0);
  const checkedCount = checked.size;
  const pct = totalItems > 0 ? Math.round((checkedCount / totalItems) * 100) : 0;

  const toggle = (id: string) => {
    setChecked(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const copyTemplate = async () => {
    try {
      await navigator.clipboard.writeText(checklist.prTemplateMarkdown);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = checklist.prTemplateMarkdown;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadTemplate = () => {
    const blob = new Blob([checklist.prTemplateMarkdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'PULL_REQUEST_TEMPLATE.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-2xl sm:rounded-[2.5rem] p-5 sm:p-8 backdrop-blur-3xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-500/15 rounded-xl flex items-center justify-center">
            <ClipboardCheck className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-white font-black text-lg">AI Code Review Checklist</h3>
            <p className="text-xs text-slate-500">{checklist.repoName} — {totalItems} items</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Progress ring */}
          <div className="relative w-12 h-12">
            <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
              <circle cx="24" cy="24" r="20" fill="none" stroke="#1e293b" strokeWidth="4" />
              <circle cx="24" cy="24" r="20" fill="none" stroke={pct === 100 ? '#34d399' : '#6366f1'} strokeWidth="4" strokeDasharray={`${pct * 1.256} 999`} strokeLinecap="round" />
            </svg>
            <span className={`absolute inset-0 flex items-center justify-center text-[10px] font-black ${pct === 100 ? 'text-emerald-400' : 'text-indigo-400'}`}>{pct}%</span>
          </div>
          {onGenerate && (
            <button onClick={onGenerate} disabled={loading} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-black rounded-xl transition-all">
              {loading ? 'Generating...' : 'Regenerate'}
            </button>
          )}
        </div>
      </div>

      {/* Checklist Categories */}
      <div className="space-y-5 mb-6">
        {checklist.categories.map((cat) => {
          const Icon = iconMap[cat.icon] || iconMap.default;
          const catChecked = cat.items.filter(i => checked.has(i.id)).length;
          return (
            <div key={cat.name}>
              <div className="flex items-center gap-2 mb-3">
                <Icon className="w-4 h-4 text-indigo-400" />
                <span className="text-white font-black text-sm">{cat.name}</span>
                <span className="text-xs text-slate-600 ml-auto">{catChecked}/{cat.items.length}</span>
              </div>
              <div className="space-y-1.5">
                {cat.items.map((item) => (
                  <label
                    key={item.id}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                      checked.has(item.id)
                        ? 'bg-emerald-500/5 border border-emerald-500/20'
                        : 'bg-slate-900/50 border border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked.has(item.id)}
                      onChange={() => toggle(item.id)}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                      checked.has(item.id) ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600'
                    }`}>
                      {checked.has(item.id) && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <span className={`text-sm flex-1 ${checked.has(item.id) ? 'text-slate-500 line-through' : 'text-slate-300'}`}>
                      {item.label}
                    </span>
                    <div className="flex items-center gap-2">
                      {item.automated && <span className="text-[9px] font-bold bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded">AUTO</span>}
                      {priorityBadge(item.priority)}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* PR Template Section */}
      <div className="border-t border-slate-800 pt-5">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-white font-black text-sm flex items-center gap-2">
            <GitPullRequest className="w-4 h-4 text-indigo-400" /> PR Template
          </h4>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowTemplate(!showTemplate)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg transition-all"
            >
              {showTemplate ? 'Hide' : 'Preview'}
            </button>
            <button
              onClick={copyTemplate}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5"
            >
              {copied ? <><CheckCircle2 className="w-3 h-3 text-emerald-400" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
            </button>
            <button
              onClick={downloadTemplate}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1.5"
            >
              <Download className="w-3 h-3" /> .md
            </button>
          </div>
        </div>
        <p className="text-xs text-slate-500 mb-3">
          Save as <code className="text-indigo-400">.github/PULL_REQUEST_TEMPLATE.md</code> to use in your repo.
        </p>
        {showTemplate && (
          <pre className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs text-slate-400 overflow-x-auto max-h-80 custom-scrollbar whitespace-pre-wrap">
            {checklist.prTemplateMarkdown}
          </pre>
        )}
      </div>
    </div>
  );
};

export default CodeReviewChecklist;
