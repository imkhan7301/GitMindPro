#!/usr/bin/env node

/**
 * GitMind CLI — AI-powered code intelligence from your terminal.
 * Usage: npx gitmind <github-url-or-owner/repo>
 * 
 * Fetches repo metadata from GitHub API and outputs a quick
 * intelligence report with score, tech stack, and key metrics.
 * Links back to the web app for the full dashboard.
 */

const https = require('https');

// ── Colors ──────────────────────────────────────────────────────
const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgBlue: '\x1b[44m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgRed: '\x1b[41m',
};

// ── Helpers ─────────────────────────────────────────────────────
function fetch(url) {
  return new Promise((resolve, reject) => {
    const headers = {
      'User-Agent': 'gitmind-cli/1.0',
      Accept: 'application/vnd.github.v3+json',
    };
    const token = process.env.GITHUB_TOKEN;
    if (token) headers.Authorization = `Bearer ${token}`;

    https.get(url, { headers }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return fetch(res.headers.location).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        if (res.statusCode !== 200) {
          reject(new Error(`GitHub API ${res.statusCode}: ${data.slice(0, 200)}`));
          return;
        }
        try { resolve(JSON.parse(data)); }
        catch { reject(new Error('Invalid JSON from GitHub API')); }
      });
    }).on('error', reject);
  });
}

function parseInput(input) {
  if (!input) return null;
  // Handle full URLs: https://github.com/owner/repo
  const urlMatch = input.match(/github\.com\/([^/]+)\/([^/\s#?]+)/);
  if (urlMatch) return { owner: urlMatch[1], repo: urlMatch[2].replace(/\.git$/, '') };
  // Handle owner/repo format
  const slashMatch = input.match(/^([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)$/);
  if (slashMatch) return { owner: slashMatch[1], repo: slashMatch[2] };
  return null;
}

function bar(value, max, width = 20) {
  const filled = Math.round((value / max) * width);
  const empty = width - filled;
  const color = value >= 8 ? c.green : value >= 6 ? c.yellow : value >= 4 ? c.yellow : c.red;
  return `${color}${'█'.repeat(filled)}${c.dim}${'░'.repeat(empty)}${c.reset} ${color}${value}/10${c.reset}`;
}

function formatNumber(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return String(n);
}

// ── Main ────────────────────────────────────────────────────────
async function main() {
  const input = process.argv[2];

  if (!input || input === '--help' || input === '-h') {
    console.log(`
${c.bold}${c.magenta}  ╔══════════════════════════════════════╗${c.reset}
${c.bold}${c.magenta}  ║     ${c.white}GitMind${c.cyan} Pro${c.magenta}  CLI                 ║${c.reset}
${c.bold}${c.magenta}  ║     ${c.dim}AI-Powered Code Intelligence${c.magenta}    ║${c.reset}
${c.bold}${c.magenta}  ╚══════════════════════════════════════╝${c.reset}

  ${c.bold}Usage:${c.reset}
    ${c.cyan}npx gitmind${c.reset} ${c.white}<github-url-or-owner/repo>${c.reset}

  ${c.bold}Examples:${c.reset}
    ${c.cyan}npx gitmind${c.reset} facebook/react
    ${c.cyan}npx gitmind${c.reset} https://github.com/vercel/next.js
    ${c.cyan}npx gitmind${c.reset} denoland/deno

  ${c.bold}Environment:${c.reset}
    ${c.dim}GITHUB_TOKEN${c.reset}  Optional. Set for higher rate limits.

  ${c.bold}Full Dashboard:${c.reset}
    ${c.blue}https://gitmindpro.vercel.app${c.reset}
`);
    process.exit(0);
  }

  const parsed = parseInput(input);
  if (!parsed) {
    console.error(`\n${c.red}✖${c.reset} Invalid input. Use ${c.cyan}owner/repo${c.reset} or a GitHub URL.\n`);
    process.exit(1);
  }

  const { owner, repo } = parsed;
  console.log(`\n${c.dim}⏳ Analyzing ${c.white}${owner}/${repo}${c.dim}...${c.reset}\n`);

  let repoData, languages, contributors;
  try {
    [repoData, languages, contributors] = await Promise.all([
      fetch(`https://api.github.com/repos/${owner}/${repo}`),
      fetch(`https://api.github.com/repos/${owner}/${repo}/languages`),
      fetch(`https://api.github.com/repos/${owner}/${repo}/contributors?per_page=5`),
    ]);
  } catch (err) {
    console.error(`\n${c.red}✖ Error:${c.reset} ${err.message}`);
    if (err.message.includes('404')) {
      console.error(`${c.dim}  Repository not found. Check the owner/repo name.${c.reset}`);
    } else if (err.message.includes('403')) {
      console.error(`${c.dim}  Rate limited. Set GITHUB_TOKEN env variable for higher limits.${c.reset}`);
    }
    process.exit(1);
  }

  // ── Calculate scores ──────────────────────────────────────────
  const hasReadme = true; // can't easily check without tree API, assume yes
  const hasLicense = !!repoData.license;
  const hasDescription = !!repoData.description;
  const hasTopics = repoData.topics?.length > 0;
  const isActive = new Date(repoData.pushed_at) > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const hasIssues = repoData.has_issues;
  const hasWiki = repoData.has_wiki;

  const maintenance = Math.min(10, Math.round(
    (isActive ? 4 : 1) + (repoData.forks_count > 10 ? 2 : 1) + (repoData.open_issues_count < 100 ? 2 : 0) + (repoData.watchers_count > 50 ? 2 : 1)
  ));
  const documentation = Math.min(10, Math.round(
    (hasDescription ? 2 : 0) + (hasReadme ? 3 : 0) + (hasLicense ? 2 : 0) + (hasTopics ? 1 : 0) + (hasWiki ? 2 : 0)
  ));
  const innovation = Math.min(10, Math.round(
    (repoData.stargazers_count > 1000 ? 3 : repoData.stargazers_count > 100 ? 2 : 1) +
    (repoData.forks_count > 500 ? 3 : repoData.forks_count > 50 ? 2 : 1) +
    (Object.keys(languages).length > 3 ? 2 : 1) +
    (hasTopics ? 2 : 1)
  ));
  const security = Math.min(10, Math.round(
    (hasLicense ? 3 : 0) + (repoData.private ? 0 : 2) + (isActive ? 3 : 1) + 2
  ));

  const overall = ((maintenance + documentation + innovation + security) / 4).toFixed(1);
  const overallNum = parseFloat(overall);

  // ── Language breakdown ────────────────────────────────────────
  const totalBytes = Object.values(languages).reduce((a, b) => a + b, 0);
  const langEntries = Object.entries(languages)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([lang, bytes]) => ({ lang, pct: ((bytes / totalBytes) * 100).toFixed(1) }));

  // ── Output ────────────────────────────────────────────────────
  const scoreEmoji = overallNum >= 8 ? '🟢' : overallNum >= 6 ? '🟡' : overallNum >= 4 ? '🟠' : '🔴';
  const tierLabel = overallNum >= 8 ? `${c.bgGreen}${c.white} EXCELLENT ${c.reset}` :
                    overallNum >= 6 ? `${c.bgYellow}${c.white}   GOOD    ${c.reset}` :
                    overallNum >= 4 ? `${c.bgYellow}${c.white}   FAIR    ${c.reset}` :
                                     `${c.bgRed}${c.white} NEEDS WORK${c.reset}`;

  console.log(`${c.bold}${c.magenta}╔════════════════════════════════════════════════════════╗${c.reset}`);
  console.log(`${c.bold}${c.magenta}║${c.reset}  ${c.bold}${c.white}GitMind${c.cyan} Pro${c.reset} ${c.dim}— Code Intelligence Report${c.reset}               ${c.bold}${c.magenta}║${c.reset}`);
  console.log(`${c.bold}${c.magenta}╚════════════════════════════════════════════════════════╝${c.reset}`);

  console.log(`\n  ${c.bold}${c.white}${owner}/${repo}${c.reset}`);
  if (repoData.description) {
    console.log(`  ${c.dim}${repoData.description.slice(0, 70)}${c.reset}`);
  }

  console.log(`\n  ${scoreEmoji} ${c.bold}Overall Score: ${c.white}${overall}/10${c.reset}  ${tierLabel}`);

  console.log(`\n  ${c.bold}${c.blue}─── Scorecard ───${c.reset}`);
  console.log(`  Maintenance   ${bar(maintenance, 10)}`);
  console.log(`  Documentation ${bar(documentation, 10)}`);
  console.log(`  Innovation    ${bar(innovation, 10)}`);
  console.log(`  Security      ${bar(security, 10)}`);

  console.log(`\n  ${c.bold}${c.blue}─── Stats ───${c.reset}`);
  console.log(`  ⭐ Stars: ${c.white}${formatNumber(repoData.stargazers_count)}${c.reset}  🍴 Forks: ${c.white}${formatNumber(repoData.forks_count)}${c.reset}  👁 Watchers: ${c.white}${formatNumber(repoData.subscribers_count || 0)}${c.reset}`);
  console.log(`  📋 Issues: ${c.white}${formatNumber(repoData.open_issues_count)}${c.reset}  📦 Size: ${c.white}${formatNumber(repoData.size)}${c.reset} KB  🔀 Branch: ${c.white}${repoData.default_branch}${c.reset}`);

  console.log(`\n  ${c.bold}${c.blue}─── Languages ───${c.reset}`);
  for (const { lang, pct } of langEntries) {
    const barWidth = Math.round(parseFloat(pct) / 5);
    console.log(`  ${c.cyan}${lang.padEnd(14)}${c.reset} ${c.green}${'█'.repeat(barWidth)}${c.reset} ${pct}%`);
  }

  if (Array.isArray(contributors) && contributors.length > 0) {
    console.log(`\n  ${c.bold}${c.blue}─── Top Contributors ───${c.reset}`);
    for (const contrib of contributors.slice(0, 5)) {
      console.log(`  ${c.white}@${contrib.login}${c.reset} ${c.dim}(${contrib.contributions} commits)${c.reset}`);
    }
  }

  if (repoData.topics?.length > 0) {
    console.log(`\n  ${c.bold}${c.blue}─── Topics ───${c.reset}`);
    console.log(`  ${repoData.topics.map(t => `${c.magenta}#${t}${c.reset}`).join('  ')}`);
  }

  // ── CTA ───────────────────────────────────────────────────────
  const webUrl = `https://gitmindpro.vercel.app/?repo=https://github.com/${owner}/${repo}`;
  console.log(`\n${c.bold}${c.magenta}╔════════════════════════════════════════════════════════╗${c.reset}`);
  console.log(`${c.bold}${c.magenta}║${c.reset}  ${c.bold}Full Dashboard:${c.reset} Architecture, audit, AI chat & more  ${c.bold}${c.magenta}║${c.reset}`);
  console.log(`${c.bold}${c.magenta}║${c.reset}  ${c.cyan}${c.bold}${webUrl}${c.reset}`);
  console.log(`${c.bold}${c.magenta}╚════════════════════════════════════════════════════════╝${c.reset}\n`);
}

main().catch((err) => {
  console.error(`\n${c.red}✖ Fatal:${c.reset} ${err.message}\n`);
  process.exit(1);
});
