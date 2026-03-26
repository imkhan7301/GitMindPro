import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function makeBadgeSvg(label, value, color) {
  const labelWidth = label.length * 6.5 + 12;
  const valueWidth = value.length * 7.5 + 12;
  const totalWidth = labelWidth + valueWidth;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="20" role="img" aria-label="${label}: ${value}">
  <title>${label}: ${value}</title>
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="r"><rect width="${totalWidth}" height="20" rx="3" fill="#fff"/></clipPath>
  <g clip-path="url(#r)">
    <rect width="${labelWidth}" height="20" fill="#555"/>
    <rect x="${labelWidth}" width="${valueWidth}" height="20" fill="${color}"/>
    <rect width="${totalWidth}" height="20" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="11">
    <text x="${labelWidth / 2}" y="14" fill="#010101" fill-opacity=".3">${label}</text>
    <text x="${labelWidth / 2}" y="13">${label}</text>
    <text x="${labelWidth + valueWidth / 2}" y="14" fill="#010101" fill-opacity=".3">${value}</text>
    <text x="${labelWidth + valueWidth / 2}" y="13">${value}</text>
  </g>
</svg>`;
}

function scoreToGrade(scorecard) {
  if (!scorecard) return { grade: '?', color: '#999' };
  const avg = (
    (scorecard.maintenance || 0) +
    (scorecard.documentation || 0) +
    (scorecard.innovation || 0) +
    (scorecard.security || 0)
  ) / 4;

  if (avg >= 9) return { grade: 'A+', color: '#4c1' };
  if (avg >= 8) return { grade: 'A', color: '#4c1' };
  if (avg >= 7) return { grade: 'B+', color: '#97ca00' };
  if (avg >= 6) return { grade: 'B', color: '#a4a61d' };
  if (avg >= 5) return { grade: 'C', color: '#dfb317' };
  if (avg >= 4) return { grade: 'D', color: '#fe7d37' };
  return { grade: 'F', color: '#e05d44' };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { owner, repo } = req.query;

  if (!owner || !repo) {
    const svg = makeBadgeSvg('GitMind', 'missing params', '#999');
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'no-cache');
    return res.status(400).send(svg);
  }

  try {
    const { data } = await supabase
      .from('analyses')
      .select('scorecard')
      .eq('repo_owner', owner)
      .eq('repo_name', repo)
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!data?.scorecard) {
      const svg = makeBadgeSvg('GitMind', 'not analyzed', '#999');
      res.setHeader('Content-Type', 'image/svg+xml');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      return res.status(200).send(svg);
    }

    const { grade, color } = scoreToGrade(data.scorecard);
    const svg = makeBadgeSvg('GitMind', grade, color);

    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.status(200).send(svg);
  } catch {
    const svg = makeBadgeSvg('GitMind', 'error', '#e05d44');
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'no-cache');
    return res.status(200).send(svg);
  }
}
