import React, { useState, useEffect, useCallback } from 'react';
import type { User } from '@supabase/supabase-js';
import { Sun, Moon, Bell, Mail, Clock, Key, Copy, Trash2, Plus, Shield, CheckCircle2, X, AlertTriangle } from 'lucide-react';

interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  created_at: string;
  last_used_at: string | null;
  revoked: boolean;
}

interface SettingsPanelProps {
  authUser: User;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  onClose: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ authUser, theme, toggleTheme, onClose }) => {
  const [activeSection, setActiveSection] = useState<'general' | 'notifications' | 'api'>('general');
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [apiLoading, setApiLoading] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyResult, setNewKeyResult] = useState<string | null>(null);
  const [keyCopied, setKeyCopied] = useState(false);

  // Notification preferences (localStorage-backed)
  const [emailDigest, setEmailDigest] = useState(() => localStorage.getItem('gitmind.pref.emailDigest') !== 'false');
  const [slackNotify, setSlackNotify] = useState(() => localStorage.getItem('gitmind.pref.slackNotify') !== 'false');
  const [digestFreq, setDigestFreq] = useState<'daily' | 'weekly'>(() => (localStorage.getItem('gitmind.pref.digestFreq') as 'daily' | 'weekly') || 'weekly');

  const savePref = (key: string, value: string) => { localStorage.setItem(`gitmind.pref.${key}`, value); };

  const fetchApiKeys = useCallback(async () => {
    setApiLoading(true);
    try {
      const res = await fetch('/api/keys', {
        headers: { 'x-user-id': authUser.id },
      });
      if (res.ok) {
        const data = await res.json();
        setApiKeys(data.keys || []);
      }
    } catch { /* ignore */ }
    setApiLoading(false);
  }, [authUser.id]);

  useEffect(() => {
    if (activeSection === 'api') void fetchApiKeys();
  }, [activeSection, fetchApiKeys]);

  const createApiKey = async () => {
    if (!newKeyName.trim()) return;
    try {
      const res = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': authUser.id },
        body: JSON.stringify({ name: newKeyName.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setNewKeyResult(data.key);
        setNewKeyName('');
        void fetchApiKeys();
      }
    } catch { /* ignore */ }
  };

  const revokeApiKey = async (keyId: string) => {
    try {
      await fetch(`/api/keys?id=${keyId}`, {
        method: 'DELETE',
        headers: { 'x-user-id': authUser.id },
      });
      void fetchApiKeys();
    } catch { /* ignore */ }
  };

  const copyKey = async (key: string) => {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(key);
      setKeyCopied(true);
      setTimeout(() => setKeyCopied(false), 2000);
    }
  };

  const sections = [
    { id: 'general' as const, label: 'General', icon: Sun },
    { id: 'notifications' as const, label: 'Notifications', icon: Bell },
    { id: 'api' as const, label: 'API Keys', icon: Key },
  ];

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full mx-4 shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h2 className="text-lg font-black text-white">Settings</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-44 border-r border-slate-800 p-3 space-y-1 flex-shrink-0">
            {sections.map(s => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${activeSection === s.id ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-white hover:bg-slate-800'}`}
              >
                <s.icon className="w-3.5 h-3.5" /> {s.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
            {activeSection === 'general' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-black text-white mb-4">Appearance</h3>
                  <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-2xl border border-slate-700">
                    <div>
                      <div className="text-sm text-white font-bold">Theme</div>
                      <div className="text-xs text-slate-500">Switch between dark and light mode</div>
                    </div>
                    <button
                      onClick={toggleTheme}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold transition-all"
                    >
                      {theme === 'dark' ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
                      {theme === 'dark' ? 'Dark' : 'Light'}
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-black text-white mb-4">Account</h3>
                  <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">GitHub</span>
                      <span className="text-sm text-white font-bold">{authUser.user_metadata?.user_name || authUser.email}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">Email</span>
                      <span className="text-sm text-white font-bold">{authUser.email}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">User ID</span>
                      <span className="text-xs text-slate-600 font-mono">{authUser.id.slice(0, 8)}...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'notifications' && (
              <div className="space-y-6">
                <h3 className="text-sm font-black text-white mb-4">Notification Preferences</h3>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-2xl border border-slate-700">
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-indigo-400" />
                      <div>
                        <div className="text-sm text-white font-bold">Email Digests</div>
                        <div className="text-xs text-slate-500">Receive analysis summaries via email</div>
                      </div>
                    </div>
                    <button
                      onClick={() => { const v = !emailDigest; setEmailDigest(v); savePref('emailDigest', String(v)); }}
                      className={`w-10 h-6 rounded-full transition-all relative ${emailDigest ? 'bg-indigo-600' : 'bg-slate-700'}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${emailDigest ? 'left-5' : 'left-1'}`} />
                    </button>
                  </div>

                  {emailDigest && (
                    <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-2xl border border-slate-700 ml-4">
                      <div className="flex items-center gap-3">
                        <Clock className="w-4 h-4 text-amber-400" />
                        <div>
                          <div className="text-sm text-white font-bold">Digest Frequency</div>
                          <div className="text-xs text-slate-500">How often to send digest emails</div>
                        </div>
                      </div>
                      <select
                        value={digestFreq}
                        onChange={e => { const v = e.target.value as 'daily' | 'weekly'; setDigestFreq(v); savePref('digestFreq', v); }}
                        className="bg-slate-700 border border-slate-600 text-white text-xs rounded-lg px-3 py-1.5 outline-none"
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                      </select>
                    </div>
                  )}

                  <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-2xl border border-slate-700">
                    <div className="flex items-center gap-3">
                      <Bell className="w-4 h-4 text-emerald-400" />
                      <div>
                        <div className="text-sm text-white font-bold">Slack Notifications</div>
                        <div className="text-xs text-slate-500">Post analysis results to Slack</div>
                      </div>
                    </div>
                    <button
                      onClick={() => { const v = !slackNotify; setSlackNotify(v); savePref('slackNotify', String(v)); }}
                      className={`w-10 h-6 rounded-full transition-all relative ${slackNotify ? 'bg-indigo-600' : 'bg-slate-700'}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${slackNotify ? 'left-5' : 'left-1'}`} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'api' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-black text-white mb-2">API Keys</h3>
                  <p className="text-xs text-slate-500 mb-4">Use API keys to access the GitMind Pro REST API programmatically.</p>
                </div>

                {/* Create new key */}
                <div className="flex gap-2">
                  <input
                    value={newKeyName}
                    onChange={e => setNewKeyName(e.target.value)}
                    placeholder="Key name (e.g. CI/CD Pipeline)"
                    className="flex-1 bg-slate-800 border border-slate-700 text-white text-sm rounded-xl px-4 py-2 outline-none focus:border-indigo-500 placeholder:text-slate-600"
                    onKeyDown={e => e.key === 'Enter' && void createApiKey()}
                  />
                  <button
                    onClick={() => void createApiKey()}
                    disabled={!newKeyName.trim()}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-black rounded-xl flex items-center gap-1.5 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" /> Create
                  </button>
                </div>

                {/* Newly created key reveal */}
                {newKeyResult && (
                  <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl">
                    <div className="flex items-start gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-300 font-bold">Copy this key now — it won't be shown again.</p>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <code className="flex-1 bg-slate-900 text-emerald-400 text-xs font-mono px-3 py-2 rounded-lg overflow-x-auto">{newKeyResult}</code>
                      <button
                        onClick={() => void copyKey(newKeyResult)}
                        className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs flex items-center gap-1"
                      >
                        {keyCopied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <button onClick={() => setNewKeyResult(null)} className="text-xs text-slate-500 hover:text-white mt-2">Dismiss</button>
                  </div>
                )}

                {/* Existing keys */}
                {apiLoading ? (
                  <div className="text-center py-8 text-slate-500 text-sm">Loading keys...</div>
                ) : apiKeys.length === 0 ? (
                  <div className="text-center py-8">
                    <Shield className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                    <p className="text-sm text-slate-500">No API keys yet</p>
                    <p className="text-xs text-slate-600 mt-1">Create a key to access the REST API</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {apiKeys.filter(k => !k.revoked).map(key => (
                      <div key={key.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl border border-slate-700">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-white font-bold">{key.name}</div>
                          <div className="text-xs text-slate-500 font-mono">{key.prefix}•••••••</div>
                          <div className="text-[10px] text-slate-600 mt-0.5">
                            Created {new Date(key.created_at).toLocaleDateString()}
                            {key.last_used_at && ` · Last used ${new Date(key.last_used_at).toLocaleDateString()}`}
                          </div>
                        </div>
                        <button
                          onClick={() => void revokeApiKey(key.id)}
                          className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs font-bold flex items-center gap-1 transition-all"
                        >
                          <Trash2 className="w-3 h-3" /> Revoke
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* API Docs teaser */}
                <div className="p-4 bg-slate-800/30 rounded-2xl border border-slate-800">
                  <h4 className="text-xs font-black text-white mb-2">Quick Start</h4>
                  <pre className="text-[11px] text-slate-400 font-mono bg-slate-950 p-3 rounded-xl overflow-x-auto">
{`curl -H "Authorization: Bearer gmp_YOUR_KEY" \\
  "https://gitmindpro.vercel.app/api/v1/analyze" \\
  -d '{"repo": "owner/repo"}'`}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
