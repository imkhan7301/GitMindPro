/**
 * Vercel serverless: sends analysis results to a Slack channel via webhook.
 * POST /api/slack-notify
 * Body: { repoName, score, summary, analysisUrl? }
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    return res.status(500).json({ error: 'Slack webhook not configured' });
  }

  const { repoName, score, summary, analysisUrl } = req.body || {};

  if (!repoName || score === undefined) {
    return res.status(400).json({ error: 'Missing repoName or score' });
  }

  const emoji = score >= 80 ? ':white_check_mark:' : score >= 50 ? ':warning:' : ':x:';
  const color = score >= 80 ? '#22c55e' : score >= 50 ? '#eab308' : '#ef4444';

  const blocks = [
    {
      type: 'header',
      text: { type: 'plain_text', text: `${emoji} GitMind Pro Analysis: ${repoName}`, emoji: true }
    },
    {
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: `*Health Score:* ${score}/100` },
        { type: 'mrkdwn', text: `*Repository:* <https://github.com/${repoName}|${repoName}>` },
      ]
    },
  ];

  if (summary) {
    blocks.push({
      type: 'section',
      text: { type: 'mrkdwn', text: `*Summary:*\n${summary.slice(0, 500)}` },
      fields: undefined
    });
  }

  if (analysisUrl) {
    blocks.push({
      type: 'actions',
      text: undefined,
      fields: undefined,
      elements: [
        {
          type: 'button',
          text: { type: 'plain_text', text: 'View Full Analysis', emoji: true },
          url: analysisUrl,
          style: 'primary'
        }
      ]
    });
  }

  try {
    const slackResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `GitMind Pro: ${repoName} scored ${score}/100`,
        attachments: [{ color, blocks }]
      }),
    });

    if (!slackResponse.ok) {
      const text = await slackResponse.text();
      console.error('Slack webhook error:', text);
      return res.status(502).json({ error: 'Slack webhook failed', detail: text });
    }

    return res.status(200).json({ sent: true });
  } catch (err) {
    console.error('Slack notify error:', err);
    return res.status(500).json({ error: 'Failed to send Slack notification' });
  }
}
