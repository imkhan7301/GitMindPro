// api/email-drip.js — POST /api/email-drip
// Triggers Resend onboarding sequences for new GitMindPro users.
// Body: { userId, email, name, event: 'signup' | 'day3' | 'day7' }

const ALLOWED_EVENTS = new Set(['signup', 'day3', 'day7']);

const EMAILS = {
  signup: {
    subject: '🧠 Welcome to GitMindPro — analyze your first repo now',
    html: (name) => `
<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Welcome to GitMindPro</title>
<style>
  body{margin:0;padding:0;background:#0a0a0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#e2e8f0}
  .wrap{max-width:560px;margin:0 auto;padding:40px 24px}
  .card{background:#111827;border:1px solid #1e293b;border-radius:20px;padding:40px}
  .badge{display:inline-flex;align-items:center;gap:8px;background:#312e81;border:1px solid #4338ca;border-radius:999px;padding:6px 16px;margin-bottom:28px}
  .badge span{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:#a5b4fc}
  h1{font-size:26px;font-weight:900;margin:0 0 12px;color:#f8fafc;line-height:1.25}
  p{font-size:14px;line-height:1.7;color:#94a3b8;margin:0 0 20px}
  .cta{display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;font-weight:800;font-size:14px;text-decoration:none;padding:14px 32px;border-radius:14px;margin-bottom:28px}
  .scores{background:#1e293b;border-radius:14px;padding:20px;margin-bottom:24px}
  .scores h3{font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:.1em;color:#64748b;margin:0 0 14px}
  .bar-row{display:flex;align-items:center;gap:10px;margin-bottom:8px}
  .bar-label{font-size:10px;font-weight:700;text-transform:uppercase;color:#64748b;width:90px}
  .bar-bg{flex:1;height:6px;background:#0f172a;border-radius:999px;overflow:hidden}
  .bar-fill{height:100%;border-radius:999px}
  .bar-val{font-size:10px;font-weight:900;color:#f8fafc;width:24px;text-align:right}
  .footer{margin-top:28px;padding-top:20px;border-top:1px solid #1e293b}
  .footer p{font-size:11px;color:#475569;margin:0}
</style></head>
<body><div class="wrap"><div class="card">
  <div class="badge"><span>🎉 Welcome aboard</span></div>
  <h1>Hey ${name}, your AI dev intelligence is ready</h1>
  <p>GitMindPro analyzes any public GitHub repo in seconds — surfacing quality scores, dead code hotspots, security risks, and an AI onboarding guide.</p>
  <a class="cta" href="https://gitmindpro.com">Analyze your first repo →</a>
  <div class="scores">
    <h3>Example: vercel/next.js</h3>
    <div class="bar-row"><span class="bar-label">Maintenance</span><div class="bar-bg"><div class="bar-fill" style="width:92%;background:#10b981"></div></div><span class="bar-val">92</span></div>
    <div class="bar-row"><span class="bar-label">Documentation</span><div class="bar-bg"><div class="bar-fill" style="width:78%;background:#06b6d4"></div></div><span class="bar-val">78</span></div>
    <div class="bar-row"><span class="bar-label">Innovation</span><div class="bar-bg"><div class="bar-fill" style="width:95%;background:#8b5cf6"></div></div><span class="bar-val">95</span></div>
    <div class="bar-row"><span class="bar-label">Security</span><div class="bar-bg"><div class="bar-fill" style="width:84%;background:#6366f1"></div></div><span class="bar-val">84</span></div>
  </div>
  <p>Free tier includes 3 full analyses. No credit card required.</p>
  <div class="footer"><p>GitMindPro · <a href="https://gitmindpro.com" style="color:#6366f1">gitmindpro.com</a> · You're receiving this because you signed up.</p></div>
</div></div></body></html>`,
  },

  day3: {
    subject: '🔍 Try PR Review Copilot on your open PRs — it\'s free',
    html: (name) => `
<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>PR Review Copilot</title>
<style>
  body{margin:0;padding:0;background:#0a0a0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#e2e8f0}
  .wrap{max-width:560px;margin:0 auto;padding:40px 24px}
  .card{background:#111827;border:1px solid #1e293b;border-radius:20px;padding:40px}
  h1{font-size:26px;font-weight:900;margin:0 0 12px;color:#f8fafc;line-height:1.25}
  p{font-size:14px;line-height:1.7;color:#94a3b8;margin:0 0 20px}
  .cta{display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;font-weight:800;font-size:14px;text-decoration:none;padding:14px 32px;border-radius:14px;margin-bottom:28px}
  .feature-list{background:#1e293b;border-radius:14px;padding:20px;margin-bottom:24px;list-style:none;margin:0 0 24px}
  .feature-list li{font-size:13px;color:#cbd5e1;padding:6px 0;border-bottom:1px solid #334155}
  .feature-list li:last-child{border:0}
  .feature-list li::before{content:"✓ ";color:#10b981;font-weight:900}
  .footer{margin-top:28px;padding-top:20px;border-top:1px solid #1e293b}
  .footer p{font-size:11px;color:#475569;margin:0}
</style></head>
<body><div class="wrap"><div class="card">
  <h1>Hey ${name} — your PRs deserve smarter reviews</h1>
  <p>GitMindPro's <strong style="color:#a5b4fc">PR Review Copilot</strong> gives you AI-powered reviews on any pull request in seconds. No bot noise, just signal.</p>
  <ul class="feature-list">
    <li>Catches logic errors humans miss</li>
    <li>Flags security vulnerabilities before merge</li>
    <li>Suggests cleaner patterns with inline diffs</li>
    <li>Works with private repos on Pro plan</li>
  </ul>
  <a class="cta" href="https://gitmindpro.com">Try PR Review Copilot →</a>
  <div class="footer"><p>GitMindPro · <a href="https://gitmindpro.com" style="color:#6366f1">gitmindpro.com</a></p></div>
</div></div></body></html>`,
  },

  day7: {
    subject: '⚡ Unlock unlimited analyses — GitMindPro Pro',
    html: (name) => `
<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Go Pro</title>
<style>
  body{margin:0;padding:0;background:#0a0a0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#e2e8f0}
  .wrap{max-width:560px;margin:0 auto;padding:40px 24px}
  .card{background:#111827;border:1px solid #1e293b;border-radius:20px;padding:40px}
  h1{font-size:26px;font-weight:900;margin:0 0 12px;color:#f8fafc;line-height:1.25}
  p{font-size:14px;line-height:1.7;color:#94a3b8;margin:0 0 20px}
  .cta{display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;font-weight:800;font-size:14px;text-decoration:none;padding:14px 32px;border-radius:14px;margin-bottom:28px}
  .pricing{background:linear-gradient(135deg,#1e1b4b,#1e293b);border:1px solid #4338ca;border-radius:16px;padding:24px;margin-bottom:24px;text-align:center}
  .pricing .price{font-size:36px;font-weight:900;color:#a5b4fc}
  .pricing .per{font-size:13px;color:#64748b}
  .pro-list{list-style:none;margin:12px 0 0;padding:0;text-align:left}
  .pro-list li{font-size:12px;color:#cbd5e1;padding:4px 0}
  .pro-list li::before{content:"🚀 ";  }
  .footer{margin-top:28px;padding-top:20px;border-top:1px solid #1e293b}
  .footer p{font-size:11px;color:#475569;margin:0}
</style></head>
<body><div class="wrap"><div class="card">
  <h1>Hey ${name} — ready to go unlimited?</h1>
  <p>You've seen what GitMindPro can do. Pro unlocks everything — unlimited repos, private repos, PR Copilot, team history, priority Gemini access, and more.</p>
  <div class="pricing">
    <div class="price">$12<span style="font-size:18px;color:#6366f1">/mo</span></div>
    <div class="per">or $99/year (save 30%)</div>
    <ul class="pro-list">
      <li>Unlimited repo analyses</li>
      <li>Private repo access</li>
      <li>PR Review Copilot</li>
      <li>Team comparison matrix</li>
      <li>Priority AI (Gemini Flash)</li>
      <li>Full analysis history</li>
    </ul>
  </div>
  <a class="cta" href="https://gitmindpro.com/?upgrade=true">Upgrade to Pro →</a>
  <div class="footer"><p>GitMindPro · <a href="https://gitmindpro.com" style="color:#6366f1">gitmindpro.com</a></p></div>
</div></div></body></html>`,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { RESEND_API_KEY } = process.env;

  if (!RESEND_API_KEY) {
    console.error('[email-drip] RESEND_API_KEY not set');
    return res.status(500).json({ error: 'Email service not configured' });
  }

  // Basic input validation
  const { userId, email, name, event } = req.body ?? {};

  if (!email || !event || !ALLOWED_EVENTS.has(event)) {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  // Sanitize name — never trust client-supplied data in HTML
  const safeName = typeof name === 'string' ? name.replace(/[<>"&]/g, '') : 'there';
  const safeEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

  if (!safeEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(safeEmail)) {
    return res.status(400).json({ error: 'Invalid email address' });
  }

  const tpl = EMAILS[event];

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'GitMindPro <hello@gitmindpro.com>',
        to: [safeEmail],
        subject: tpl.subject,
        html: tpl.html(safeName),
        tags: [
          { name: 'event', value: event },
          { name: 'userId', value: String(userId ?? 'unknown') },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('[email-drip] Resend error:', err);
      return res.status(502).json({ error: 'Failed to send email' });
    }

    return res.status(200).json({ ok: true, event });
  } catch (err) {
    console.error('[email-drip] Unexpected error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
