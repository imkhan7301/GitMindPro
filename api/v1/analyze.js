import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

/**
 * Public REST API: POST /api/v1/analyze
 * Header: Authorization: Bearer gmp_<key>
 * Body: { repo: "owner/name" }
 * Returns: AI analysis result (JSON)
 *
 * Rate limit: 60 req/hour per API key.
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

  // Update last_used_at
  await supabase.from('api_keys').update({ last_used_at: new Date().toISOString() }).eq('id', data.id);

  return data;
}

async function checkRateLimit(supabase, apiKeyId) {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count, error } = await supabase
    .from('api_usage_logs')
    .select('*', { count: 'exact', head: true })
    .eq('api_key_id', apiKeyId)
    .gte('created_at', oneHourAgo);

  if (error) return { allowed: true, remaining: 60 };
  const used = count || 0;
  return { allowed: used < 60, remaining: Math.max(0, 60 - used), used };
}

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization,Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  // Authenticate
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing API key. Use: Authorization: Bearer gmp_<your_key>' });
  }

  const apiKey = authHeader.slice(7);
  const keyData = await validateApiKey(apiKey);
  if (!keyData) {
    return res.status(401).json({ error: 'Invalid or revoked API key' });
  }

  if (!keyData.scopes.includes('analyze')) {
    return res.status(403).json({ error: 'API key does not have "analyze" scope' });
  }

  const supabase = getSupabase();
  const startTime = Date.now();

  // Rate limit
  const rateLimit = await checkRateLimit(supabase, keyData.id);
  res.setHeader('X-RateLimit-Limit', '60');
  res.setHeader('X-RateLimit-Remaining', String(rateLimit.remaining));

  if (!rateLimit.allowed) {
    await logUsage(supabase, keyData, '/v1/analyze', null, null, 429, Date.now() - startTime);
    return res.status(429).json({ error: 'Rate limit exceeded. 60 requests per hour.', retryAfter: '60s' });
  }

  // Parse input
  const { repo } = req.body || {};
  if (!repo || typeof repo !== 'string') {
    return res.status(400).json({ error: 'Missing "repo" field. Example: { "repo": "facebook/react" }' });
  }

  const parts = repo.replace(/^https?:\/\/github\.com\//, '').split('/').filter(Boolean);
  if (parts.length !== 2) {
    return res.status(400).json({ error: 'Invalid repo format. Use "owner/name" or full GitHub URL.' });
  }

  const [repoOwner, repoName] = parts;

  try {
    // Fetch repo details
    const ghHeaders = {
      Accept: 'application/vnd.github.v3+json',
      ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
    };

    const [repoRes, commitsRes, languagesRes] = await Promise.all([
      fetch(`https://api.github.com/repos/${repoOwner}/${repoName}`, { headers: ghHeaders }),
      fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/commits?per_page=10`, { headers: ghHeaders }),
      fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/languages`, { headers: ghHeaders }),
    ]);

    if (!repoRes.ok) {
      await logUsage(supabase, keyData, '/v1/analyze', repoOwner, repoName, 404, Date.now() - startTime);
      return res.status(404).json({ error: `Repository ${repoOwner}/${repoName} not found or not accessible` });
    }

    const repoData = await repoRes.json();
    const commits = commitsRes.ok ? await commitsRes.json() : [];
    const languages = languagesRes.ok ? await languagesRes.json() : {};

    // Call Gemini
    const geminiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!geminiKey) {
      await logUsage(supabase, keyData, '/v1/analyze', repoOwner, repoName, 500, Date.now() - startTime);
      return res.status(500).json({ error: 'AI service not configured' });
    }

    const geminiRes = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': geminiKey },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are a senior software engineer. Analyze this GitHub repository and return a JSON object with these fields:
- summary (string): 2-3 sentence overview
- techStack (string[]): languages and frameworks used
- scorecard: { maintenance (0-100), documentation (0-100), innovation (0-100), security (0-100) }
- strengths (string[]): top 3-5 strengths
- improvements (string[]): top 3-5 areas to improve
- onboardingSteps (string[]): 3-5 steps for a new developer to get productive

Repository: ${repoOwner}/${repoName}
Description: ${repoData.description || 'None'}
Languages: ${Object.keys(languages).join(', ') || repoData.language || 'Unknown'}
Stars: ${repoData.stargazers_count}, Forks: ${repoData.forks_count}
Open Issues: ${repoData.open_issues_count}
Last pushed: ${repoData.pushed_at}
Default branch: ${repoData.default_branch}
License: ${repoData.license?.spdx_id || 'None'}
Topics: ${(repoData.topics || []).join(', ') || 'None'}
Recent commits: ${commits.slice(0, 5).map(c => c.commit?.message?.split('\n')[0]).join('; ')}

Return ONLY valid JSON, no markdown fences.`
          }]
        }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 2048 }
      }),
    });

    if (!geminiRes.ok) {
      await logUsage(supabase, keyData, '/v1/analyze', repoOwner, repoName, 502, Date.now() - startTime);
      return res.status(502).json({ error: 'AI analysis failed' });
    }

    const geminiData = await geminiRes.json();
    const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
    let analysis;
    try {
      analysis = JSON.parse(text.replace(/```json?\n?/g, '').replace(/```/g, '').trim());
    } catch {
      await logUsage(supabase, keyData, '/v1/analyze', repoOwner, repoName, 502, Date.now() - startTime);
      return res.status(502).json({ error: 'Failed to parse AI response' });
    }

    const responseTimeMs = Date.now() - startTime;
    await logUsage(supabase, keyData, '/v1/analyze', repoOwner, repoName, 200, responseTimeMs);

    // Save to analyses table
    await supabase.from('analyses').insert({
      user_id: keyData.user_id,
      repo_owner: repoOwner,
      repo_name: repoName,
      repo_url: `https://github.com/${repoOwner}/${repoName}`,
      summary: analysis.summary || '',
      tech_stack: analysis.techStack || [],
      scorecard: analysis.scorecard || null,
      raw_analysis: analysis,
    }).catch(() => { /* non-critical */ });

    return res.status(200).json({
      repo: `${repoOwner}/${repoName}`,
      url: `https://github.com/${repoOwner}/${repoName}`,
      analysis,
      meta: {
        analyzedAt: new Date().toISOString(),
        responseTimeMs,
        model: 'gemini-2.0-flash',
        apiVersion: 'v1',
      },
    });

  } catch (err) {
    console.error('API v1/analyze error:', err);
    await logUsage(supabase, keyData, '/v1/analyze', repoOwner, repoName, 500, Date.now() - startTime);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function logUsage(supabase, keyData, endpoint, repoOwner, repoName, statusCode, responseTimeMs) {
  await supabase.from('api_usage_logs').insert({
    api_key_id: keyData.id,
    user_id: keyData.user_id,
    endpoint,
    repo_owner: repoOwner,
    repo_name: repoName,
    status_code: statusCode,
    response_time_ms: responseTimeMs,
  }).catch(() => {});
}
