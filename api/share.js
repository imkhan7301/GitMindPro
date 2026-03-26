import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token } = req.query;

  if (!token || typeof token !== 'string' || token.length > 32) {
    return res.status(400).json({ error: 'Invalid share token' });
  }

  try {
    const { data, error } = await supabase
      .from('analyses')
      .select('repo_owner, repo_name, repo_url, summary, tech_stack, scorecard, raw_analysis, created_at')
      .eq('share_token', token)
      .eq('is_public', true)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Analysis not found or not shared' });
    }

    res.setHeader('Cache-Control', 'public, max-age=300');
    return res.status(200).json({
      repoOwner: data.repo_owner,
      repoName: data.repo_name,
      repoUrl: data.repo_url,
      summary: data.summary,
      techStack: data.tech_stack,
      scorecard: data.scorecard,
      rawAnalysis: data.raw_analysis,
      createdAt: data.created_at,
    });
  } catch (err) {
    console.error('Share fetch error:', err);
    return res.status(500).json({ error: 'Failed to fetch shared analysis' });
  }
}
