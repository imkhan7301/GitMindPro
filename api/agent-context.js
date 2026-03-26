/**
 * Agent Context API — GitMind Pro Wave 18
 * POST /api/agent-context
 *
 * Returns structured, agent-ready repo analysis context with provenance,
 * guardrails, and ASI mitigations for safe consumption by LangGraph/CrewAI/AutoGen agents.
 *
 * Auth: Bearer token (API key from /api/keys)
 */

import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const AGENT_CONTEXT_VERSION = '1.0.0';

function sha256(str) {
  return crypto.createHash('sha256').update(str).digest('hex');
}

function buildProvenance(repoUrl, data) {
  const timestamp = new Date().toISOString();
  const contentHash = sha256(JSON.stringify(data));
  return {
    source: 'gitmindpro.com',
    timestamp,
    version: AGENT_CONTEXT_VERSION,
    repo_url: repoUrl,
    integrity_hash: `sha256:${contentHash}`,
  };
}

async function validateApiKey(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const raw = authHeader.replace('Bearer ', '').trim();
  const hashed = sha256(raw);

  const { data, error } = await supabase
    .from('api_keys')
    .select('user_id, name, is_active')
    .eq('key_hash', hashed)
    .eq('is_active', true)
    .single();

  if (error || !data) return null;

  // Log usage
  await supabase.from('api_usage_logs').insert({
    key_hash: hashed,
    user_id: data.user_id,
    endpoint: '/api/agent-context',
    timestamp: new Date().toISOString(),
  }).catch(() => { /* non-blocking */ });

  return data.user_id;
}

function sanitizeGoal(goal) {
  if (!goal || typeof goal !== 'string') return 'general analysis';
  // Block prompt injection attempts
  const blocked = [
    'ignore previous', 'ignore all', 'disregard', 'exfiltrate', 'backdoor',
    'override', 'jailbreak', 'bypass', 'forget instructions', 'new instructions',
  ];
  const lower = goal.toLowerCase();
  for (const phrase of blocked) {
    if (lower.includes(phrase)) return 'general analysis';
  }
  return goal.replace(/[<>{}]/g, '').slice(0, 200);
}

function validateRepoUrl(repoUrl) {
  if (!repoUrl || typeof repoUrl !== 'string') return false;
  try {
    const url = new URL(repoUrl);
    return url.hostname === 'github.com' && url.pathname.split('/').filter(Boolean).length >= 2;
  } catch {
    return false;
  }
}

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Auth
  const userId = await validateApiKey(req.headers.authorization);
  if (!userId) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Valid API key required. Get one at gitmindpro.com/settings',
    });
  }

  const { repo_url, goal } = req.body || {};

  // Input validation
  if (!validateRepoUrl(repo_url)) {
    return res.status(400).json({
      error: 'Invalid repo_url',
      message: 'Must be a valid github.com repository URL',
    });
  }

  const safeGoal = sanitizeGoal(goal);

  // Fetch most recent analysis from history for this repo
  const [owner, repoName] = (new URL(repo_url)).pathname.split('/').filter(Boolean);

  const { data: analyses } = await supabase
    .from('analyses')
    .select('*')
    .eq('user_id', userId)
    .eq('repo_owner', owner)
    .eq('repo_name', repoName)
    .order('analyzed_at', { ascending: false })
    .limit(1);

  const latest = analyses?.[0];

  if (!latest) {
    return res.status(404).json({
      error: 'No analysis found',
      message: `Analyze ${repo_url} on GitMind Pro first to generate context.`,
      analyze_url: `https://gitmindpro.com?url=${encodeURIComponent(repo_url)}`,
    });
  }

  // Build the agent-ready context payload
  const contextData = {
    repo_summary: latest.summary || '',
    learning_path: latest.learning_path || [],
    hot_zones: latest.hotspots || [],
    tech_stack: latest.tech_stack || [],
    architecture: latest.architecture_suggestion || '',
    security_insights: latest.security_insights || [],
    scorecard: latest.scorecard || {},
    analyzed_at: latest.analyzed_at,
  };

  const provenance = buildProvenance(repo_url, contextData);

  const response = {
    // ASI01 mitigation: explicit goal confirmation
    goal_confirmation: `Confirmed: This analysis is strictly for "${safeGoal}". Read-only operation. No data modification authorized.`,
    original_goal: safeGoal,

    // Core context
    ...contextData,

    // ASI03 mitigation: explicit allowed actions
    allowed_actions: ['read_only', 'analyze', 'summarize', 'plan'],
    disallowed_actions: ['write_code', 'modify_files', 'delete_data', 'execute_commands'],

    // ASI04 mitigation: provenance for supply chain verification
    provenance,

    // ASI09 mitigation: transparency signals
    confidence_signals: {
      analysis_age_hours: Math.round((Date.now() - new Date(latest.analyzed_at).getTime()) / 3600000),
      source: 'GitMind Pro AI analysis',
      model: 'gemini-2.0-flash',
    },

    // ASI08 mitigation: guardrail recommendations for agent builders
    recommended_guardrails: [
      'Validate agent goal alignment before each tool call',
      'Use short-lived tokens for any downstream operations',
      'Implement human-in-the-loop for any write operations',
      'Log all agent actions with this context as source',
      'Treat hot_zones as high-risk areas requiring extra review',
    ],

    // Schema for LangGraph/CrewAI tool registration
    _schema_version: AGENT_CONTEXT_VERSION,
    _usage_example: {
      langgraph: `from langchain_core.tools import tool\n@tool\ndef get_repo_context(repo_url: str) -> dict:\n    """Get structured repo intelligence from GitMind Pro."""\n    import requests\n    return requests.post("https://gitmindpro.com/api/agent-context",\n        json={"repo_url": repo_url, "goal": "codebase analysis"},\n        headers={"Authorization": "Bearer YOUR_KEY"}).json()`,
    },
  };

  return res.status(200).json(response);
}
