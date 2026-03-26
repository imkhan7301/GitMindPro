import React, { useState, useEffect } from 'react';
import { Calendar, X, Clock, Mail, CheckCircle2, AlertTriangle } from 'lucide-react';

interface ScheduledReport {
  id: string;
  repoKey: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  email: string;
  enabled: boolean;
  lastSent?: string;
}

interface Props {
  userEmail: string;
  watchedRepos: string[]; // "owner/repo" list
  onClose: () => void;
}

const STORAGE_KEY = 'gitmind.scheduledReports';

const loadReports = (): ScheduledReport[] => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
};

const saveReports = (reports: ScheduledReport[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
};

const ScheduledReports: React.FC<Props> = ({ userEmail, watchedRepos, onClose }) => {
  const [reports, setReports] = useState<ScheduledReport[]>([]);
  const [addRepo, setAddRepo] = useState('');
  const [addFreq, setAddFreq] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setReports(loadReports());
  }, []);

  const persist = (updated: ScheduledReport[]) => {
    saveReports(updated);
    setReports(updated);
  };

  const addReport = () => {
    const repo = addRepo.trim();
    if (!repo) return;
    if (reports.some(r => r.repoKey === repo && r.frequency === addFreq)) return;
    const report: ScheduledReport = {
      id: crypto.randomUUID(),
      repoKey: repo,
      frequency: addFreq,
      email: userEmail,
      enabled: true,
    };
    persist([...reports, report]);
    setAddRepo('');
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const toggleReport = (id: string) => {
    persist(reports.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  const removeReport = (id: string) => {
    persist(reports.filter(r => r.id !== id));
  };

  const freqLabel = (f: string) => f === 'daily' ? 'Daily' : f === 'weekly' ? 'Weekly' : 'Monthly';
  const freqColor = (f: string) => f === 'daily' ? 'text-amber-400 bg-amber-500/10' : f === 'weekly' ? 'text-indigo-400 bg-indigo-500/10' : 'text-cyan-400 bg-cyan-500/10';

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full mx-4 shadow-2xl animate-in zoom-in max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500/15 rounded-xl flex items-center justify-center">
              <Calendar className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">Scheduled Reports</h2>
              <p className="text-xs text-slate-500">Auto-email repo health summaries</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>

        {/* Add new */}
        <div className="p-5 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <select
              value={addRepo}
              onChange={e => setAddRepo(e.target.value)}
              className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500/50"
            >
              <option value="">Select repository...</option>
              {watchedRepos.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <select
              value={addFreq}
              onChange={e => setAddFreq(e.target.value as 'daily' | 'weekly' | 'monthly')}
              className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500/50"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
            <button
              onClick={addReport}
              disabled={!addRepo}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-black rounded-xl transition-all"
            >
              {saved ? <CheckCircle2 className="w-3.5 h-3.5" /> : 'Add'}
            </button>
          </div>
          <p className="text-[10px] text-slate-600 mt-2 flex items-center gap-1">
            <Mail className="w-3 h-3" /> Reports sent to {userEmail}
          </p>
        </div>

        {/* Reports list */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
          {reports.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-10 h-10 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-500 text-sm font-bold">No scheduled reports</p>
              <p className="text-slate-600 text-xs mt-1">Add a repo above to start getting automated health reports</p>
            </div>
          ) : (
            reports.map(r => (
              <div key={r.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${r.enabled ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-900/30 border-slate-800 opacity-50'}`}>
                <button
                  onClick={() => toggleReport(r.id)}
                  className={`w-8 h-5 rounded-full relative transition-all shrink-0 ${r.enabled ? 'bg-indigo-600' : 'bg-slate-700'}`}
                >
                  <div className={`absolute w-3.5 h-3.5 bg-white rounded-full top-[3px] transition-all ${r.enabled ? 'left-[15px]' : 'left-[3px]'}`} />
                </button>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-white truncate">{r.repoKey}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${freqColor(r.frequency)}`}>
                      {freqLabel(r.frequency)}
                    </span>
                    {r.lastSent && (
                      <span className="text-[10px] text-slate-600">Last: {new Date(r.lastSent).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
                <button onClick={() => removeReport(r.id)} className="text-slate-600 hover:text-rose-400 transition-colors shrink-0">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {reports.length > 0 && (
          <div className="p-4 border-t border-slate-800 shrink-0">
            <div className="flex items-center gap-2 text-[10px] text-slate-600">
              <AlertTriangle className="w-3 h-3" />
              Reports run via Vercel Cron — ensure CRON_SECRET and RESEND_API_KEY are set
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScheduledReports;
