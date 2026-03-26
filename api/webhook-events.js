import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, limit = '20' } = req.query;

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 50);

  try {
    // Get repos watched by this user to scope webhook events
    const { data: watched } = await supabase
      .from('watched_repos')
      .select('repo_owner, repo_name')
      .eq('user_id', userId);

    if (!watched || watched.length === 0) {
      return res.status(200).json({ events: [] });
    }

    // Build repo filter: "owner/repo" format
    const repoKeys = watched.map(w => `${w.repo_owner}/${w.repo_name}`);

    const { data: events, error } = await supabase
      .from('webhook_events')
      .select('id, event_type, repo, action, sender, created_at, payload_summary')
      .in('repo', repoKeys)
      .order('created_at', { ascending: false })
      .limit(parsedLimit);

    if (error) {
      // Table might not exist yet — graceful fallback
      return res.status(200).json({ events: [] });
    }

    return res.status(200).json({ events: events || [] });
  } catch {
    return res.status(200).json({ events: [] });
  }
}
