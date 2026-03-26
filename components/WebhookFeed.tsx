import React, { useState, useEffect, useCallback } from 'react';
import { Activity, GitBranch, GitPullRequest, AlertCircle, RefreshCw, Zap } from 'lucide-react';

interface WebhookEvent {
  id: string;
  event_type: string;
  repo: string;
  action: string;
  sender: string;
  created_at: string;
  payload_summary: string;
}

interface WebhookFeedProps {
  userId: string;
}

const eventIcon = (type: string) => {
  switch (type) {
    case 'push': return GitBranch;
    case 'pull_request': return GitPullRequest;
    case 'issues': return AlertCircle;
    default: return Zap;
  }
};

const eventColor = (type: string) => {
  switch (type) {
    case 'push': return 'text-emerald-400 bg-emerald-500/10';
    case 'pull_request': return 'text-violet-400 bg-violet-500/10';
    case 'issues': return 'text-amber-400 bg-amber-500/10';
    default: return 'text-slate-400 bg-slate-500/10';
  }
};

const timeAgo = (dateStr: string): string => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const WebhookFeed: React.FC<WebhookFeedProps> = ({ userId }) => {
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/webhook-events?userId=${encodeURIComponent(userId)}&limit=20`);
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
      } else if (res.status === 404) {
        // Endpoint not deployed yet — show empty state
        setEvents([]);
      } else {
        setError('Failed to load webhook events');
      }
    } catch {
      // API not available yet — graceful empty state
      setEvents([]);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    void fetchEvents();
  }, [fetchEvents]);

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-500/15 rounded-xl flex items-center justify-center">
            <Activity className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white">Webhook Activity</h3>
            <p className="text-[10px] text-slate-600">GitHub events from your repos</p>
          </div>
        </div>
        <button
          onClick={() => void fetchEvents()}
          disabled={loading}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-[10px] font-bold text-slate-400 flex items-center gap-1 transition-all disabled:opacity-40"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {error && (
        <div className="text-center py-6 text-red-400 text-xs">{error}</div>
      )}

      {!error && !loading && events.length === 0 && (
        <div className="text-center py-10">
          <Activity className="w-10 h-10 text-slate-700 mx-auto mb-3" />
          <p className="text-sm text-slate-500 font-bold">No webhook events yet</p>
          <p className="text-xs text-slate-600 mt-1 max-w-xs mx-auto">
            Install the GitMind GitHub App to see push, PR, and issue events here in real-time.
          </p>
        </div>
      )}

      {loading && events.length === 0 && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-14 bg-slate-800/40 rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {events.length > 0 && (
        <div className="space-y-1.5 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
          {events.map(ev => {
            const Icon = eventIcon(ev.event_type);
            const colors = eventColor(ev.event_type);
            return (
              <div key={ev.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-800/40 transition-colors group">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${colors}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white font-bold truncate">{ev.repo}</span>
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-600">{ev.event_type}{ev.action ? `:${ev.action}` : ''}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 truncate mt-0.5">{ev.payload_summary || `by ${ev.sender}`}</p>
                </div>
                <span className="text-[9px] text-slate-700 font-mono flex-shrink-0 mt-1">{timeAgo(ev.created_at)}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default WebhookFeed;
