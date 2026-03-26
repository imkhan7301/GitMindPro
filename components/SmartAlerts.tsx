import React, { useState, useCallback } from 'react';
import { Bell, Plus, Trash2, Shield, Activity, TrendingDown, AlertTriangle, CheckCircle2, X } from 'lucide-react';

export interface ScoreAlert {
  id: string;
  repoPattern: string; // '*' = all repos, or 'owner/repo'
  category: 'overall' | 'maintenance' | 'documentation' | 'innovation' | 'security';
  condition: 'below' | 'above' | 'drops_by';
  threshold: number;
  enabled: boolean;
  createdAt: string;
  lastTriggered?: string;
}

interface Props {
  alerts: ScoreAlert[];
  onSave: (alerts: ScoreAlert[]) => void;
  repoNames: string[]; // available repos for autocomplete
}

const CATEGORIES = [
  { value: 'overall', label: 'Overall Score' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'documentation', label: 'Documentation' },
  { value: 'innovation', label: 'Innovation' },
  { value: 'security', label: 'Security' },
];

const CONDITIONS = [
  { value: 'below', label: 'drops below' },
  { value: 'above', label: 'goes above' },
  { value: 'drops_by', label: 'drops by ≥' },
];

const SmartAlerts: React.FC<Props> = ({ alerts, onSave, repoNames }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [newRepo, setNewRepo] = useState('*');
  const [newCategory, setNewCategory] = useState<ScoreAlert['category']>('overall');
  const [newCondition, setNewCondition] = useState<ScoreAlert['condition']>('below');
  const [newThreshold, setNewThreshold] = useState(7);

  const addAlert = useCallback(() => {
    const alert: ScoreAlert = {
      id: crypto.randomUUID(),
      repoPattern: newRepo,
      category: newCategory,
      condition: newCondition,
      threshold: newThreshold,
      enabled: true,
      createdAt: new Date().toISOString(),
    };
    onSave([...alerts, alert]);
    setShowAdd(false);
    setNewRepo('*');
    setNewCategory('overall');
    setNewCondition('below');
    setNewThreshold(7);
  }, [alerts, newRepo, newCategory, newCondition, newThreshold, onSave]);

  const removeAlert = useCallback((id: string) => {
    onSave(alerts.filter(a => a.id !== id));
  }, [alerts, onSave]);

  const toggleAlert = useCallback((id: string) => {
    onSave(alerts.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a));
  }, [alerts, onSave]);

  const conditionIcon = (cond: string) => {
    if (cond === 'below') return <TrendingDown className="w-3.5 h-3.5 text-red-400" />;
    if (cond === 'above') return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
    return <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />;
  };

  const catIcon = (cat: string) => {
    if (cat === 'security') return <Shield className="w-3.5 h-3.5 text-red-400" />;
    return <Activity className="w-3.5 h-3.5 text-indigo-400" />;
  };

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-2xl sm:rounded-[2.5rem] p-5 sm:p-8 backdrop-blur-3xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-500/15 rounded-xl flex items-center justify-center">
            <Bell className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-white font-black text-lg">Smart Alerts</h3>
            <p className="text-xs text-slate-500">Get notified when scores cross your thresholds</p>
          </div>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl transition-all flex items-center gap-1.5"
        >
          {showAdd ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {showAdd ? 'Cancel' : 'New Alert'}
        </button>
      </div>

      {/* Add Alert Form */}
      {showAdd && (
        <div className="bg-slate-950/60 border border-slate-700 rounded-2xl p-5 mb-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Repository</label>
              <select
                value={newRepo}
                onChange={(e) => setNewRepo(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="*">All Repos</option>
                {repoNames.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Category</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as ScoreAlert['category'])}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
              >
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Condition</label>
              <select
                value={newCondition}
                onChange={(e) => setNewCondition(e.target.value as ScoreAlert['condition'])}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
              >
                {CONDITIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Threshold</label>
              <input
                type="number"
                min={0}
                max={10}
                step={0.5}
                value={newThreshold}
                onChange={(e) => setNewThreshold(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">
              Alert when <span className="text-white font-bold">{newCategory}</span> score {newCondition === 'drops_by' ? 'drops by ≥' : newCondition === 'below' ? 'is below' : 'is above'} <span className="text-white font-bold">{newThreshold}</span> for <span className="text-white font-bold">{newRepo === '*' ? 'any repo' : newRepo}</span>
            </p>
            <button
              onClick={addAlert}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl transition-all"
            >
              Create Alert
            </button>
          </div>
        </div>
      )}

      {/* Alerts List */}
      {alerts.length === 0 ? (
        <div className="text-center py-10">
          <Bell className="w-10 h-10 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">No alerts configured yet.</p>
          <p className="text-slate-600 text-xs mt-1">Create your first alert to monitor score changes.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`flex items-center gap-4 px-4 py-3 rounded-xl border transition-all ${
                alert.enabled
                  ? 'bg-slate-900/50 border-slate-800'
                  : 'bg-slate-900/20 border-slate-800/50 opacity-50'
              }`}
            >
              <button onClick={() => toggleAlert(alert.id)} className="flex-shrink-0">
                <div className={`w-8 h-4 rounded-full transition-all relative ${alert.enabled ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                  <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${alert.enabled ? 'left-4' : 'left-0.5'}`} />
                </div>
              </button>
              
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {catIcon(alert.category)}
                <span className="text-sm text-white font-bold truncate">
                  {alert.repoPattern === '*' ? 'All repos' : alert.repoPattern}
                </span>
                <span className="text-xs text-slate-500">•</span>
                <span className="text-xs text-slate-400 capitalize">{alert.category}</span>
                <div className="flex items-center gap-1">
                  {conditionIcon(alert.condition)}
                  <span className="text-xs text-slate-400">
                    {alert.condition === 'below' ? '<' : alert.condition === 'above' ? '>' : '↓≥'} {alert.threshold}
                  </span>
                </div>
              </div>

              {alert.lastTriggered && (
                <span className="text-[10px] text-amber-500 font-bold flex-shrink-0">
                  Triggered {new Date(alert.lastTriggered).toLocaleDateString()}
                </span>
              )}

              <button
                onClick={() => removeAlert(alert.id)}
                className="flex-shrink-0 text-slate-600 hover:text-red-400 transition-colors p-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SmartAlerts;
