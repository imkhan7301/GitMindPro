import React, { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { listWorkspaceMembers } from '../services/supabaseService';
import { Activity, X, BarChart3, GitPullRequest, Users } from 'lucide-react';

interface ActivityEvent {
  id: string;
  userId: string;
  userName: string;
  avatarUrl: string;
  type: 'analysis' | 'pr_review';
  repoOwner: string;
  repoName: string;
  summary: string;
  createdAt: string;
}

interface Props {
  organizationId: string;
  authUser: User;
  onClose: () => void;
}

const TeamActivityFeed: React.FC<Props> = ({ organizationId, onClose }) => {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [memberCount, setMemberCount] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        const members = await listWorkspaceMembers(organizationId);
        setMemberCount(members.length);

        // Build activity feed from workspace analyses + PR reviews
        const resp = await fetch(`/api/team-activity?orgId=${encodeURIComponent(organizationId)}`);
        if (resp.ok) {
          const data = await resp.json();
          setEvents(data.events || []);
        }
      } catch {
        // Silently fail — feed is non-critical
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [organizationId]);

  const timeAgo = (iso: string) => {
    const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (s < 60) return 'just now';
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full mx-4 shadow-2xl animate-in zoom-in max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-violet-500/15 rounded-xl flex items-center justify-center">
              <Activity className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">Team Activity</h2>
              <p className="text-xs text-slate-500">{memberCount} member{memberCount !== 1 ? 's' : ''} in workspace</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>

        {/* Feed */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-16">
              <Users className="w-10 h-10 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-500 text-sm font-bold">No activity yet</p>
              <p className="text-slate-600 text-xs mt-1">Team members&apos; analyses and PR reviews will appear here</p>
            </div>
          ) : (
            events.map(evt => (
              <div key={evt.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-800/50 transition-colors group">
                <img
                  src={evt.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(evt.userName)}&background=6366f1&color=fff&size=32`}
                  alt={evt.userName}
                  className="w-8 h-8 rounded-full border border-slate-700 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-bold text-white truncate">{evt.userName}</span>
                    <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${evt.type === 'analysis' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                      {evt.type === 'analysis' ? 'Analysis' : 'PR Review'}
                    </span>
                    <span className="text-[10px] text-slate-600 ml-auto shrink-0">{timeAgo(evt.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    {evt.type === 'analysis' ? <BarChart3 className="w-3 h-3 text-indigo-400" /> : <GitPullRequest className="w-3 h-3 text-emerald-400" />}
                    <span className="font-mono truncate">{evt.repoOwner}/{evt.repoName}</span>
                  </div>
                  {evt.summary && <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{evt.summary}</p>}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamActivityFeed;
