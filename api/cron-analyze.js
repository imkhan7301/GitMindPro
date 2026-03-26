/**
 * Vercel Cron: scheduled analysis of watched repositories.
 * Runs daily at 06:00 UTC. Picks up repos from the `watched_repos` table,
 * fetches fresh GitHub data, calls Gemini, saves the result, and notifies
 * via Slack and email digest queue.
 *
 * Cron schedule configured in vercel.json.
 * Requires: CRON_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GEMINI_API_KEY
 */
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // Vercel cron sends Authorization: Bearer <CRON_SECRET>
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const supabase = createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Fetch all watched repos
  const { data: watches, error: fetchError } = await supabase
    .from('watched_repos')
    .select('*')
    .eq('active', true);

  if (fetchError) {
    console.error('Cron: failed to fetch watched repos', fetchError);
    return res.status(500).json({ error: 'Failed to fetch watched repos' });
  }

  if (!watches || watches.length === 0) {
    return res.status(200).json({ message: 'No watched repos', processed: 0 });
  }

  const results = [];

  for (const watch of watches) {
    try {
      // Fetch basic repo info from GitHub
      const ghRes = await fetch(`https://api.github.com/repos/${watch.repo_owner}/${watch.repo_name}`, {
        headers: {
          Accept: 'application/vnd.github.v3+json',
          ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
        },
      });

      if (!ghRes.ok) {
        console.error(`Cron: GitHub fetch failed for ${watch.repo_owner}/${watch.repo_name}: ${ghRes.status}`);
        results.push({ repo: `${watch.repo_owner}/${watch.repo_name}`, status: 'github_error' });
        continue;
      }

      const repoData = await ghRes.json();

      // Fetch recent commits for context
      const commitsRes = await fetch(`https://api.github.com/repos/${watch.repo_owner}/${watch.repo_name}/commits?per_page=10`, {
        headers: {
          Accept: 'application/vnd.github.v3+json',
          ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
        },
      });
      const commits = commitsRes.ok ? await commitsRes.json() : [];

      // Call Gemini for analysis
      const geminiRes = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY,
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are a senior software engineer. Analyze this GitHub repository and return a JSON object with: summary (string), techStack (string[]), scorecard ({maintenance, documentation, innovation, security} each 0-100), strengths (string[]), improvements (string[]).

Repository: ${watch.repo_owner}/${watch.repo_name}
Description: ${repoData.description || 'None'}
Language: ${repoData.language || 'Unknown'}
Stars: ${repoData.stargazers_count}, Forks: ${repoData.forks_count}
Open Issues: ${repoData.open_issues_count}
Last pushed: ${repoData.pushed_at}
Recent commits: ${commits.slice(0, 5).map(c => c.commit?.message?.split('\n')[0]).join('; ')}

Return ONLY valid JSON, no markdown fences.`
            }]
          }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 2048 }
        }),
      });

      if (!geminiRes.ok) {
        console.error(`Cron: Gemini failed for ${watch.repo_owner}/${watch.repo_name}: ${geminiRes.status}`);
        results.push({ repo: `${watch.repo_owner}/${watch.repo_name}`, status: 'gemini_error' });
        continue;
      }

      const geminiData = await geminiRes.json();
      const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
      let analysis;
      try {
        analysis = JSON.parse(text.replace(/```json?\n?/g, '').replace(/```/g, '').trim());
      } catch {
        console.error(`Cron: Failed to parse Gemini response for ${watch.repo_owner}/${watch.repo_name}`);
        results.push({ repo: `${watch.repo_owner}/${watch.repo_name}`, status: 'parse_error' });
        continue;
      }

      // Save to analyses table
      const { error: saveError } = await supabase.from('analyses').insert({
        user_id: watch.user_id,
        organization_id: watch.organization_id || null,
        repo_owner: watch.repo_owner,
        repo_name: watch.repo_name,
        repo_url: `https://github.com/${watch.repo_owner}/${watch.repo_name}`,
        summary: analysis.summary || '',
        tech_stack: analysis.techStack || [],
        scorecard: analysis.scorecard || null,
        raw_analysis: analysis,
      });

      if (saveError) {
        console.error(`Cron: Save failed for ${watch.repo_owner}/${watch.repo_name}`, saveError);
        results.push({ repo: `${watch.repo_owner}/${watch.repo_name}`, status: 'save_error' });
        continue;
      }

      // Queue a digest notification
      await supabase.from('digest_queue').insert({
        user_id: watch.user_id,
        repo_owner: watch.repo_owner,
        repo_name: watch.repo_name,
        scorecard: analysis.scorecard,
        summary: (analysis.summary || '').slice(0, 500),
      }).catch(() => { /* digest queue not critical */ });

      // Send Slack notification if webhook is configured
      if (process.env.SLACK_WEBHOOK_URL) {
        const sc = analysis.scorecard || {};
        const avg = Math.round(((sc.maintenance || 0) + (sc.documentation || 0) + (sc.innovation || 0) + (sc.security || 0)) / 4);
        await fetch(process.env.SLACK_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: `📊 Scheduled analysis: ${watch.repo_owner}/${watch.repo_name} scored ${avg}/100`,
          }),
        }).catch(() => { /* non-critical */ });
      }

      results.push({ repo: `${watch.repo_owner}/${watch.repo_name}`, status: 'ok', score: analysis.scorecard });

    } catch (err) {
      console.error(`Cron: unexpected error for ${watch.repo_owner}/${watch.repo_name}`, err);
      results.push({ repo: `${watch.repo_owner}/${watch.repo_name}`, status: 'error' });
    }
  }

  return res.status(200).json({
    message: `Processed ${results.length} repos`,
    processed: results.length,
    results,
  });
}
