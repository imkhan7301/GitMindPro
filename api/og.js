/**
 * Wave 14: Social Share OG Card API
 * Generates dynamic Open Graph meta + SVG image for shared repo analyses.
 * Usage: /api/og?repo=facebook/react&score=8.8&stack=JavaScript,Flow,Rollup
 */

module.exports = (req, res) => {
  const { repo, score, stack, plan } = req.query;

  if (!repo || typeof repo !== 'string') {
    res.status(400).json({ error: 'Missing required query parameter: repo' });
    return;
  }

  const safeRepo = repo.replace(/[^a-zA-Z0-9/_-]/g, '').slice(0, 100);
  const [owner, name] = safeRepo.split('/');
  const displayName = name || safeRepo;
  const safeScore = Math.min(10, Math.max(0, parseFloat(score) || 0)).toFixed(1);
  const stackItems = typeof stack === 'string'
    ? stack.split(',').slice(0, 6).map(s => s.replace(/[^a-zA-Z0-9#+. -]/g, '').trim()).filter(Boolean)
    : [];
  const tier = plan === 'pro' ? 'Pro' : plan === 'team' ? 'Team' : 'Free';

  const scoreNum = parseFloat(safeScore);
  const scoreColor = scoreNum >= 8 ? '#22c55e' : scoreNum >= 6 ? '#eab308' : scoreNum >= 4 ? '#f97316' : '#ef4444';
  const scoreLabel = scoreNum >= 8 ? 'Excellent' : scoreNum >= 6 ? 'Good' : scoreNum >= 4 ? 'Fair' : 'Needs Work';

  const stackPills = stackItems.map((tech, i) => {
    const x = 40 + i * 110;
    return `<g>
      <rect x="${x}" y="340" width="100" height="28" rx="14" fill="#334155"/>
      <text x="${x + 50}" y="358" font-family="system-ui,sans-serif" font-size="12" fill="#94a3b8" text-anchor="middle">${tech}</text>
    </g>`;
  }).join('\n    ');

  const svg = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0f172a"/>
      <stop offset="100%" style="stop-color:#1e1b4b"/>
    </linearGradient>
    <linearGradient id="scoreBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${scoreColor}33"/>
      <stop offset="100%" style="stop-color:${scoreColor}11"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect x="0" y="0" width="1200" height="4" fill="#6366f1"/>

  <!-- Branding -->
  <text x="40" y="60" font-family="system-ui,sans-serif" font-size="20" font-weight="900" fill="#6366f1">GitMind</text>
  <text x="143" y="60" font-family="system-ui,sans-serif" font-size="20" font-weight="900" fill="#a5b4fc">Pro</text>
  <text x="1160" y="60" font-family="system-ui,sans-serif" font-size="14" fill="#475569" text-anchor="end">${tier} Analysis</text>

  <!-- Repository Name -->
  <text x="40" y="160" font-family="system-ui,sans-serif" font-size="18" fill="#64748b">${owner || ''}/</text>
  <text x="40" y="220" font-family="system-ui,sans-serif" font-size="64" font-weight="900" fill="white">${displayName}</text>

  <!-- Score Card -->
  <rect x="840" y="120" width="320" height="200" rx="24" fill="url(#scoreBg)" stroke="${scoreColor}44" stroke-width="2"/>
  <text x="1000" y="185" font-family="system-ui,sans-serif" font-size="16" fill="#94a3b8" text-anchor="middle">CODE SCORE</text>
  <text x="1000" y="260" font-family="system-ui,sans-serif" font-size="72" font-weight="900" fill="${scoreColor}" text-anchor="middle">${safeScore}</text>
  <text x="1000" y="295" font-family="system-ui,sans-serif" font-size="16" font-weight="700" fill="${scoreColor}" text-anchor="middle">${scoreLabel}</text>

  <!-- Tech Stack -->
  <text x="40" y="320" font-family="system-ui,sans-serif" font-size="14" fill="#64748b" font-weight="700" text-transform="uppercase" letter-spacing="2">TECH STACK</text>
  ${stackPills}

  <!-- Footer -->
  <line x1="40" y1="560" x2="1160" y2="560" stroke="#1e293b" stroke-width="1"/>
  <text x="40" y="595" font-family="system-ui,sans-serif" font-size="16" fill="#475569">gitmindpro.vercel.app — AI-powered code intelligence</text>
  <text x="1160" y="595" font-family="system-ui,sans-serif" font-size="14" fill="#6366f1" text-anchor="end">Analyze any GitHub repo →</text>
</svg>`;

  const format = req.query.format;

  if (format === 'svg') {
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
    res.status(200).send(svg);
    return;
  }

  // Default: return HTML with OG meta tags for social previews
  const ogImageUrl = `https://gitmindpro.vercel.app/api/og?repo=${encodeURIComponent(safeRepo)}&score=${safeScore}&stack=${encodeURIComponent(stackItems.join(','))}&plan=${tier.toLowerCase()}&format=svg`;
  const pageUrl = `https://gitmindpro.vercel.app/?repo=${encodeURIComponent(safeRepo)}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>${displayName} — GitMind Pro Analysis</title>
  <meta name="description" content="AI code intelligence for ${safeRepo}. Score: ${safeScore}/10. Tech: ${stackItems.join(', ')}"/>
  <meta property="og:title" content="${displayName} — Code Score ${safeScore}/10"/>
  <meta property="og:description" content="AI-powered code intelligence analysis by GitMind Pro. ${scoreLabel} quality score."/>
  <meta property="og:image" content="${ogImageUrl}"/>
  <meta property="og:image:width" content="1200"/>
  <meta property="og:image:height" content="630"/>
  <meta property="og:url" content="${pageUrl}"/>
  <meta property="og:type" content="website"/>
  <meta name="twitter:card" content="summary_large_image"/>
  <meta name="twitter:title" content="${displayName} — Code Score ${safeScore}/10"/>
  <meta name="twitter:description" content="AI-powered code intelligence by GitMind Pro"/>
  <meta name="twitter:image" content="${ogImageUrl}"/>
  <meta http-equiv="refresh" content="0;url=${pageUrl}"/>
</head>
<body>
  <p>Redirecting to <a href="${pageUrl}">GitMind Pro analysis</a>...</p>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html');
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
  res.status(200).send(html);
};
