import React, { useState, useEffect, useCallback } from 'react';
import { Tag, Plus, X } from 'lucide-react';

export interface RepoTag {
  id: string;
  label: string;
  color: string;
}

interface Props {
  repoKey: string; // "owner/repo"
  compact?: boolean;
}

const TAG_COLORS = [
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#64748b', // slate
];

const STORAGE_KEY = 'gitmind.repoTags';

const loadAllTags = (): Record<string, RepoTag[]> => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; }
};

const saveAllTags = (tags: Record<string, RepoTag[]>) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tags));
};

export const getRepoTags = (repoKey: string): RepoTag[] => {
  const all = loadAllTags();
  return all[repoKey] || [];
};

export const getAllUniqueTags = (): string[] => {
  const all = loadAllTags();
  const labels = new Set<string>();
  Object.values(all).forEach(tags => tags.forEach(t => labels.add(t.label)));
  return [...labels].sort();
};

const RepoTags: React.FC<Props> = ({ repoKey, compact }) => {
  const [tags, setTags] = useState<RepoTag[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [selectedColor, setSelectedColor] = useState(TAG_COLORS[0]);

  useEffect(() => {
    setTags(getRepoTags(repoKey));
  }, [repoKey]);

  const persist = useCallback((updated: RepoTag[]) => {
    const all = loadAllTags();
    all[repoKey] = updated;
    saveAllTags(all);
    setTags(updated);
  }, [repoKey]);

  const addTag = () => {
    const label = newLabel.trim();
    if (!label || tags.some(t => t.label.toLowerCase() === label.toLowerCase())) return;
    const tag: RepoTag = { id: crypto.randomUUID(), label, color: selectedColor };
    persist([...tags, tag]);
    setNewLabel('');
    setShowAdd(false);
  };

  const removeTag = (id: string) => {
    persist(tags.filter(t => t.id !== id));
  };

  if (compact) {
    return (
      <div className="flex items-center gap-1 flex-wrap">
        {tags.map(t => (
          <span
            key={t.id}
            className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
            style={{ backgroundColor: `${t.color}20`, color: t.color }}
          >
            {t.label}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {tags.map(t => (
        <span
          key={t.id}
          className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg group cursor-default"
          style={{ backgroundColor: `${t.color}15`, color: t.color, border: `1px solid ${t.color}30` }}
        >
          <Tag className="w-2.5 h-2.5" />
          {t.label}
          <button
            onClick={() => removeTag(t.id)}
            className="opacity-0 group-hover:opacity-100 ml-0.5 hover:text-white transition-all"
          >
            <X className="w-2.5 h-2.5" />
          </button>
        </span>
      ))}

      {showAdd ? (
        <div className="flex items-center gap-1.5">
          <input
            autoFocus
            value={newLabel}
            onChange={e => setNewLabel(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') addTag(); if (e.key === 'Escape') setShowAdd(false); }}
            placeholder="Tag name..."
            className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-[10px] text-white placeholder-slate-600 outline-none focus:border-indigo-500/50 w-24"
          />
          <div className="flex items-center gap-0.5">
            {TAG_COLORS.map(c => (
              <button
                key={c}
                onClick={() => setSelectedColor(c)}
                className="w-3.5 h-3.5 rounded-full transition-transform"
                style={{
                  backgroundColor: c,
                  transform: selectedColor === c ? 'scale(1.3)' : 'scale(1)',
                  boxShadow: selectedColor === c ? `0 0 0 2px ${c}40` : 'none',
                }}
              />
            ))}
          </div>
          <button onClick={addTag} className="text-[9px] font-black text-emerald-400 hover:text-emerald-300 px-1.5 py-1 bg-emerald-500/10 rounded-lg">Add</button>
          <button onClick={() => setShowAdd(false)} className="text-slate-600 hover:text-slate-400"><X className="w-3 h-3" /></button>
        </div>
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 hover:text-indigo-400 px-2 py-1 rounded-lg border border-dashed border-slate-700 hover:border-indigo-500/40 transition-all"
        >
          <Plus className="w-2.5 h-2.5" /> Tag
        </button>
      )}
    </div>
  );
};

export default RepoTags;
