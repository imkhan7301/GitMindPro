import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

/**
 * Public REST API: GET /api/v1/history
 * Header: Authorization: Bearer gmp_<key>
 * Query: ?repo=owner/name (optional filter), ?limit=10 (default 20, max 100)
 * Returns: list of past analyses
 */

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

async function validateApiKey(apiKey) {
  if (!apiKey || !apiKey.startsWith('gmp_')) return null;
  const hash = crypto.createHash('sha256').update(apiKey).digest('hex');
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('api_keys')
    .select('id, user_id, scopes, revoked, expires_at')
    .eq('key_hash', hash)
    .eq('revoked', false)
    .maybeSingle();
  if (error || !data) return null;
  if (data.expires_at && new Date(data.expires_at) < new Date()) return null;
  await supabase.from('api_keys').update({ last_used_at: new Date().toISOString() }).eq('id', data.id);
  return data;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization,Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed. Use GET.' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing API key' });
  }

  const keyData = await validateApiKey(authHeader.slice(7));
  if (!keyData) {
    return res.status(401).json({ error: 'Invalid or revoked API key' });
  }

  if (!keyData.scopes.includes('read')) {
    return res.status(403).json({ error: 'API key does not have "read" scope' });
  }

  const supabase = getSupabase();
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const repo = req.query.repo;

  let query = supabase
    .from('analyses')
    .select('id, repo_owner, repo_name, repo_url, summary, tech_stack, scorecard, created_at')
    .eq('user_id', keyData.user_id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (repo) {
    const [owner, name] = repo.split('/');
    if (owner && name) {
      query = query.eq('repo_owner', owner).eq('repo_name', name);
    }
  }

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });

  return res.status(200).json({
    analyses: (data || []).map(a => ({
      id: a.id,
      repo: `${a.repo_owner}/${a.repo_name}`,
      url: a.repo_url,
      summary: a.summary,
      techStack: a.tech_stack,
      scorecard: a.scorecard,
      analyzedAt: a.created_at,
    })),
    total: (data || []).length,
    limit,
  });
}
