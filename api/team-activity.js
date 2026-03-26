import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''
);

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { orgId } = req.query;
  if (!orgId) return res.status(400).json({ error: 'orgId required' });

  try {
    // Get members of the organization
    const { data: members } = await supabase
      .from('organization_memberships')
      .select('user_id')
      .eq('organization_id', orgId);

    if (!members || members.length === 0) {
      return res.status(200).json({ events: [] });
    }

    const memberIds = members.map(m => m.user_id);

    // Get profiles for names/avatars
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, github_login, avatar_url, full_name')
      .in('id', memberIds);

    const profileMap = {};
    (profiles || []).forEach(p => {
      profileMap[p.id] = p;
    });

    // Fetch recent analyses for workspace members
    const { data: analyses } = await supabase
      .from('analyses')
      .select('id, user_id, repo_owner, repo_name, summary, created_at')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })
      .limit(30);

    // Fetch recent PR reviews for workspace members
    const { data: reviews } = await supabase
      .from('pr_reviews')
      .select('id, user_id, repo_owner, repo_name, pr_title, created_at')
      .in('user_id', memberIds)
      .order('created_at', { ascending: false })
      .limit(30);

    const events = [];

    (analyses || []).forEach(a => {
      const p = profileMap[a.user_id] || {};
      events.push({
        id: `a-${a.id}`,
        userId: a.user_id,
        userName: p.github_login || p.full_name || 'Unknown',
        avatarUrl: p.avatar_url || '',
        type: 'analysis',
        repoOwner: a.repo_owner,
        repoName: a.repo_name,
        summary: (a.summary || '').slice(0, 120),
        createdAt: a.created_at,
      });
    });

    (reviews || []).forEach(r => {
      const p = profileMap[r.user_id] || {};
      events.push({
        id: `pr-${r.id}`,
        userId: r.user_id,
        userName: p.github_login || p.full_name || 'Unknown',
        avatarUrl: p.avatar_url || '',
        type: 'pr_review',
        repoOwner: r.repo_owner,
        repoName: r.repo_name,
        summary: r.pr_title || '',
        createdAt: r.created_at,
      });
    });

    // Sort by date desc, limit to 50
    events.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return res.status(200).json({ events: events.slice(0, 50) });
  } catch (err) {
    console.error('Team activity error:', err);
    return res.status(500).json({ error: 'Internal error' });
  }
}
