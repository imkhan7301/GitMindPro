/**
 * Vercel Cron: sends weekly email digests to users.
 * Runs every Monday at 08:00 UTC. Collects unsent digest_queue items,
 * groups by user, and sends a single summary email via Resend.
 *
 * Requires: CRON_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY
 */
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    return res.status(200).json({ message: 'RESEND_API_KEY not configured, skipping' });
  }

  const supabase = createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Fetch unsent digest items
  const { data: items, error: fetchError } = await supabase
    .from('digest_queue')
    .select('*')
    .eq('sent', false)
    .order('created_at', { ascending: true });

  if (fetchError) {
    console.error('Digest cron: fetch error', fetchError);
    return res.status(500).json({ error: fetchError.message });
  }

  if (!items || items.length === 0) {
    return res.status(200).json({ message: 'No pending digests', sent: 0 });
  }

  // Group items by user
  const byUser = {};
  for (const item of items) {
    if (!byUser[item.user_id]) byUser[item.user_id] = [];
    byUser[item.user_id].push(item);
  }

  let sentCount = 0;
  const sentIds = [];

  for (const [userId, userItems] of Object.entries(byUser)) {
    // Fetch user email from profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, github_login, full_name')
      .eq('id', userId)
      .maybeSingle();

    if (!profile?.email) {
      console.log(`Digest: no email for user ${userId}, skipping`);
      continue;
    }

    // Check if user has opted out
    const { data: prefs } = await supabase
      .from('user_preferences')
      .select('email_digest, digest_frequency')
      .eq('user_id', userId)
      .maybeSingle();

    if (prefs && (!prefs.email_digest || prefs.digest_frequency === 'never')) {
      // Mark as sent so they don't pile up
      sentIds.push(...userItems.map(i => i.id));
      continue;
    }

    // Build email HTML
    const repoRows = userItems.map(item => {
      const sc = item.scorecard || {};
      const avg = Math.round(((sc.maintenance || 0) + (sc.documentation || 0) + (sc.innovation || 0) + (sc.security || 0)) / 4);
      const color = avg >= 80 ? '#22c55e' : avg >= 50 ? '#eab308' : '#ef4444';
      return `
        <tr>
          <td style="padding:12px 16px;border-bottom:1px solid #1e293b">
            <a href="https://github.com/${item.repo_owner}/${item.repo_name}" style="color:#818cf8;text-decoration:none;font-weight:600">${item.repo_owner}/${item.repo_name}</a>
          </td>
          <td style="padding:12px 16px;border-bottom:1px solid #1e293b;text-align:center">
            <span style="color:${color};font-weight:700;font-size:18px">${avg}</span><span style="color:#64748b;font-size:12px">/100</span>
          </td>
          <td style="padding:12px 16px;border-bottom:1px solid #1e293b;color:#94a3b8;font-size:13px">${(item.summary || '').slice(0, 120)}${(item.summary || '').length > 120 ? '...' : ''}</td>
        </tr>`;
    }).join('');

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <div style="max-width:640px;margin:0 auto;padding:40px 20px">
    <div style="text-align:center;margin-bottom:32px">
      <h1 style="color:white;font-size:24px;margin:0">📊 Your Weekly Repo Digest</h1>
      <p style="color:#64748b;font-size:14px;margin-top:8px">Hi ${profile.full_name || profile.github_login || 'there'}, here's how your repos are doing.</p>
    </div>
    <table style="width:100%;border-collapse:collapse;background:#1e293b;border-radius:12px;overflow:hidden">
      <thead>
        <tr style="background:#334155">
          <th style="padding:12px 16px;text-align:left;color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:1px">Repository</th>
          <th style="padding:12px 16px;text-align:center;color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:1px">Score</th>
          <th style="padding:12px 16px;text-align:left;color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:1px">Summary</th>
        </tr>
      </thead>
      <tbody>${repoRows}</tbody>
    </table>
    <div style="text-align:center;margin-top:32px">
      <a href="https://gitmindpro.vercel.app" style="display:inline-block;padding:12px 32px;background:#6366f1;color:white;text-decoration:none;border-radius:12px;font-weight:700;font-size:14px">Open GitMind Pro</a>
    </div>
    <p style="text-align:center;color:#475569;font-size:11px;margin-top:24px">You're receiving this because you have email digests enabled. <a href="https://gitmindpro.vercel.app" style="color:#6366f1">Manage preferences</a></p>
  </div>
</body>
</html>`;

    // Send via Resend
    try {
      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'GitMind Pro <digest@gitmindpro.com>',
          to: [profile.email],
          subject: `📊 Weekly Repo Health — ${userItems.length} ${userItems.length === 1 ? 'repo' : 'repos'} analyzed`,
          html,
        }),
      });

      if (emailRes.ok) {
        sentCount++;
        sentIds.push(...userItems.map(i => i.id));
        console.log(`Digest sent to ${profile.email} (${userItems.length} repos)`);
      } else {
        const errText = await emailRes.text();
        console.error(`Digest: Resend error for ${profile.email}:`, errText);
      }
    } catch (err) {
      console.error(`Digest: send error for ${profile.email}:`, err);
    }
  }

  // Mark items as sent
  if (sentIds.length > 0) {
    await supabase
      .from('digest_queue')
      .update({ sent: true })
      .in('id', sentIds);
  }

  return res.status(200).json({ sent: sentCount, markedDone: sentIds.length });
}
