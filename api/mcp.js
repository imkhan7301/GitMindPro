// api/mcp.js — GitMindPro MCP Server (Model Context Protocol v2024-11-05)
// Works with Claude Desktop, Cursor, Windsurf, Continue, and any MCP client.
//
// Claude Desktop config (~/.claude/claude_desktop_config.json):
// {
//   "mcpServers": {
//     "gitmindpro": {
//       "command": "curl",
//       "args": ["-s", "-X", "POST", "https://gitmindpro.com/api/mcp", "-H", "Content-Type: application/json", "-d", "@-"]
//     }
//   }
// }

const TOOLS = [
  {
    name: 'analyze_repo',
    description:
      'Analyze a GitHub repository and return a full code intelligence report: architecture, health scores, hot zones, tech stack, dependency risks, and AI onboarding guide.',
    inputSchema: {
      type: 'object',
      properties: {
        repo_url: {
          type: 'string',
          description: 'GitHub repository URL (e.g. https://github.com/vercel/next.js)',
        },
        api_key: {
          type: 'string',
          description: 'GitMindPro API key (optional, increases rate limit)',
        },
      },
      required: ['repo_url'],
    },
  },
  {
    name: 'get_scorecard',
    description:
      'Get the GitMindPro quality scorecard for a repository: maintenance, documentation, innovation, and security scores.',
    inputSchema: {
      type: 'object',
      properties: {
        repo_owner: { type: 'string', description: 'GitHub org or username' },
        repo_name: { type: 'string', description: 'Repository name' },
        api_key: { type: 'string', description: 'GitMindPro API key (optional)' },
      },
      required: ['repo_owner', 'repo_name'],
    },
  },
  {
    name: 'check_invariants',
    description:
      'Run the GitMindPro Invariant Checker on a repository to detect goal hijacking (ASI01), context poisoning, and supply chain risks (ASI04). Returns PASS/FAIL/WARN status.',
    inputSchema: {
      type: 'object',
      properties: {
        repo_owner: { type: 'string' },
        repo_name: { type: 'string' },
        goal: {
          type: 'string',
          description: 'The agent task goal to validate (e.g. "Find security vulnerabilities")',
        },
        api_key: { type: 'string', description: 'GitMindPro API key (optional)' },
      },
      required: ['repo_owner', 'repo_name'],
    },
  },
  {
    name: 'detect_dead_code',
    description:
      'Scan a repository for dead code: unused exports, dead functions, zombie routes, stale imports, and orphaned components. Returns items with severity and safe-to-remove flag.',
    inputSchema: {
      type: 'object',
      properties: {
        repo_owner: { type: 'string' },
        repo_name: { type: 'string' },
        api_key: { type: 'string', description: 'GitMindPro API key (optional)' },
      },
      required: ['repo_owner', 'repo_name'],
    },
  },
  {
    name: 'score_bundle_risk',
    description:
      'Analyze a repository for bundle size risks, missing tree-shaking opportunities, and Core Web Vitals impact. Returns risk score and actionable recommendations.',
    inputSchema: {
      type: 'object',
      properties: {
        repo_owner: { type: 'string' },
        repo_name: { type: 'string' },
        api_key: { type: 'string', description: 'GitMindPro API key (optional)' },
      },
      required: ['repo_owner', 'repo_name'],
    },
  },
];

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  };
}

function mcpError(code, message) {
  return { error: { code, message } };
}

async function proxyToApi(path, body, apiKey) {
  const base = process.env.VITE_APP_URL || 'https://gitmindpro.com';
  const headers = { 'Content-Type': 'application/json' };
  if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

  const res = await fetch(`${base}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  return res.json();
}

async function handleToolCall(name, args) {
  const apiKey = args.api_key;

  if (name === 'analyze_repo') {
    if (!args.repo_url || typeof args.repo_url !== 'string') {
      throw new Error('repo_url is required');
    }
    const urlMatch = args.repo_url.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!urlMatch) throw new Error('Invalid GitHub URL');
    const [, owner, repo] = urlMatch;

    const data = await proxyToApi('/api/v1/analyze', { repo_owner: owner, repo_name: repo }, apiKey);
    return {
      type: 'text',
      text: JSON.stringify(data, null, 2),
    };
  }

  if (name === 'get_scorecard') {
    const data = await proxyToApi(
      '/api/v1/history',
      { repo_owner: args.repo_owner, repo_name: args.repo_name, limit: 1 },
      apiKey,
    );
    const latest = Array.isArray(data.analyses) ? data.analyses[0] : data;
    return {
      type: 'text',
      text: JSON.stringify(
        {
          repo: `${args.repo_owner}/${args.repo_name}`,
          scorecard: latest?.scorecard || null,
          summary: latest?.summary || null,
          tech_stack: latest?.tech_stack || null,
          analyzed_at: latest?.created_at || null,
        },
        null,
        2,
      ),
    };
  }

  if (name === 'check_invariants') {
    const data = await proxyToApi(
      '/api/agent-context',
      {
        repo_owner: args.repo_owner,
        repo_name: args.repo_name,
        goal: args.goal || `Analyze ${args.repo_owner}/${args.repo_name}`,
      },
      apiKey,
    );
    return {
      type: 'text',
      text: JSON.stringify(data, null, 2),
    };
  }

  if (name === 'detect_dead_code') {
    const data = await proxyToApi(
      '/api/agent-export',
      { repo_owner: args.repo_owner, repo_name: args.repo_name },
      apiKey,
    );
    return {
      type: 'text',
      text: JSON.stringify(
        {
          repo: `${args.repo_owner}/${args.repo_name}`,
          dead_code_summary: data?.context?.dead_code_summary || 'Run analysis first to get dead code report.',
          note: 'For full dead code analysis, run a repository analysis via analyze_repo first.',
        },
        null,
        2,
      ),
    };
  }

  if (name === 'score_bundle_risk') {
    const data = await proxyToApi(
      '/api/agent-export',
      { repo_owner: args.repo_owner, repo_name: args.repo_name },
      apiKey,
    );
    return {
      type: 'text',
      text: JSON.stringify(
        {
          repo: `${args.repo_owner}/${args.repo_name}`,
          performance_summary: data?.context?.performance_summary || 'Run analysis first to get performance scores.',
          confidence: data?.confidence_scores || null,
        },
        null,
        2,
      ),
    };
  }

  throw new Error(`Unknown tool: ${name}`);
}

export default async function handler(req, res) {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).set(corsHeaders()).end();
  }

  Object.entries(corsHeaders()).forEach(([k, v]) => res.setHeader(k, v));
  res.setHeader('X-GitMind-MCP-Version', '2024-11-05');

  // Support GET for discovery (returns server info)
  if (req.method === 'GET') {
    return res.status(200).json({
      name: 'gitmindpro',
      version: '1.0.0',
      description: 'GitMindPro AI Code Intelligence MCP Server',
      protocol: 'mcp/2024-11-05',
      tools_count: TOOLS.length,
      connect_url: 'https://gitmindpro.com/api/mcp',
      claude_desktop_config: {
        mcpServers: {
          gitmindpro: {
            url: 'https://gitmindpro.com/api/mcp',
          },
        },
      },
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json(mcpError(-32601, 'Method not allowed'));
  }

  const body = req.body;

  if (!body || typeof body !== 'object') {
    return res.status(400).json(mcpError(-32700, 'Parse error: body must be JSON'));
  }

  const { method, params, id } = body;

  // JSON-RPC envelope
  const respond = (result, error) => {
    const payload = { jsonrpc: '2.0', id: id ?? null };
    if (error) payload.error = error;
    else payload.result = result;
    return res.status(error ? 400 : 200).json(payload);
  };

  try {
    if (method === 'initialize') {
      return respond({
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        serverInfo: { name: 'gitmindpro', version: '1.0.0' },
      });
    }

    if (method === 'tools/list') {
      return respond({ tools: TOOLS });
    }

    if (method === 'tools/call') {
      const toolName = params?.name;
      const toolArgs = params?.arguments || params?.input || {};

      if (!toolName) {
        return respond(null, mcpError(-32602, 'params.name is required').error);
      }

      // Security: validate tool name
      if (!TOOLS.find((t) => t.name === toolName)) {
        return respond(null, mcpError(-32601, `Unknown tool: ${toolName}`).error);
      }

      // Security: validate repo args if present
      if (toolArgs.repo_owner && !/^[a-zA-Z0-9._-]{1,100}$/.test(toolArgs.repo_owner)) {
        return respond(null, mcpError(-32602, 'Invalid repo_owner').error);
      }
      if (toolArgs.repo_name && !/^[a-zA-Z0-9._-]{1,100}$/.test(toolArgs.repo_name)) {
        return respond(null, mcpError(-32602, 'Invalid repo_name').error);
      }
      if (toolArgs.goal) {
        const dangerous = ['ignore previous', 'system prompt', 'exfiltrate', 'disregard', 'override'];
        if (dangerous.some((d) => toolArgs.goal.toLowerCase().includes(d))) {
          return respond(null, mcpError(-32602, 'Goal contains disallowed content').error);
        }
        toolArgs.goal = toolArgs.goal.slice(0, 500);
      }

      const content = await handleToolCall(toolName, toolArgs);
      return respond({ content: [content] });
    }

    if (method === 'ping') {
      return respond({ pong: true, timestamp: new Date().toISOString() });
    }

    return respond(null, mcpError(-32601, `Method not found: ${method}`).error);
  } catch (err) {
    console.error('[mcp] error', err?.message);
    return respond(null, mcpError(-32603, err?.message || 'Internal error').error);
  }
}
