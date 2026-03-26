import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Vercel serverless: receives GitHub App webhook events.
 * Verifies webhook signature, logs events to DB, then processes.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const signature = req.headers['x-hub-signature-256'];
  const secret = process.env.GITHUB_APP_WEBHOOK_SECRET;

  if (!secret) {
    console.error('GITHUB_APP_WEBHOOK_SECRET not configured');
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  // Verify signature
  const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
  const expected = 'sha256=' + crypto.createHmac('sha256', secret).update(body).digest('hex');

  if (!signature || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const event = req.headers['x-github-event'];
  const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

  switch (event) {
    case 'installation':
      console.log(`GitHub App ${payload.action}: installation_id=${payload.installation?.id}, account=${payload.installation?.account?.login}`);
      break;

    case 'push':
      console.log(`Push to ${payload.repository?.full_name} (${payload.ref}), ${payload.commits?.length ?? 0} commits`);
      break;

    case 'pull_request':
      console.log(`PR ${payload.action}: ${payload.pull_request?.title} on ${payload.repository?.full_name}`);
      break;

    case 'issues':
      console.log(`Issue ${payload.action}: ${payload.issue?.title} on ${payload.repository?.full_name}`);
      break;

    default:
      console.log(`Unhandled GitHub event: ${event}`);
  }

  // Log event to DB for webhook feed
  const repo = payload.repository?.full_name || '';
  const action = payload.action || '';
  const sender = payload.sender?.login || '';
  let payloadSummary = '';

  if (event === 'push') {
    payloadSummary = `${payload.commits?.length ?? 0} commit(s) to ${payload.ref?.replace('refs/heads/', '')}`;
  } else if (event === 'pull_request') {
    payloadSummary = `${action}: ${payload.pull_request?.title || ''}`;
  } else if (event === 'issues') {
    payloadSummary = `${action}: ${payload.issue?.title || ''}`;
  }

  if (repo) {
    await supabase.from('webhook_events').insert({
      event_type: event,
      repo,
      action,
      sender,
      payload_summary: payloadSummary.slice(0, 500),
    }).catch(() => { /* table may not exist yet */ });
  }

  return res.status(200).json({ received: true, event });
}
