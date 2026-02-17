
import { GithubRepo, FileNode, GitHubIssue, GitHubPR, Contributor, DependencyInfo } from '../types';

const getGithubToken = (): string | undefined => {
  const token = import.meta.env.VITE_GITHUB_TOKEN as string | undefined;
  return token && token.length > 0 && token !== 'your_github_token_here' ? token : undefined;
};

const githubFetch = (url: string, init: RequestInit = {}) => {
  const headers = new Headers(init.headers || {});
  headers.set('Accept', 'application/vnd.github+json');
  headers.set('X-GitHub-Api-Version', '2022-11-28');
  const token = getGithubToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return fetch(url, { ...init, headers });
};

interface GitTreeItem {
  path: string;
  type: 'blob' | 'tree';
  sha: string;
  size?: number;
}

interface GitTreeResponse {
  tree: GitTreeItem[];
}

interface GitHubIssueResponse {
  number: number;
  title: string;
  state: 'open' | 'closed';
  created_at: string;
  updated_at: string;
  labels: { name: string }[];
  user: { login: string };
  comments: number;
  body?: string | null;
  pull_request?: unknown;
}

interface GitHubPullRequestResponse {
  number: number;
  title: string;
  state: 'open' | 'closed';
  created_at: string;
  updated_at: string;
  user: { login: string };
  additions?: number;
  deletions?: number;
  changed_files?: number;
  merged_at?: string | null;
  mergeable?: boolean | null;
}

interface GitHubContributorResponse {
  login: string;
  contributions: number;
  avatar_url: string;
}

interface GitHubRepoResponse {
  description?: string | null;
  stargazers_count: number;
  forks_count: number;
  language?: string | null;
  default_branch: string;
  html_url: string;
  topics?: string[];
}

export const parseGithubUrl = (url: string): { owner: string; repo: string } | null => {
  try {
    const trimmed = url.trim();

    // Support SSH clone URLs like: git@github.com:owner/repo.git
    const sshMatch = trimmed.match(/^git@github\.com:([^/\s]+)\/([^\s]+?)(?:\.git)?\/?$/i);
    if (sshMatch) {
      return { owner: sshMatch[1], repo: sshMatch[2] };
    }

    // Support HTTPS/HTTP GitHub URLs
    const parsed = new URL(trimmed);
    if (!/^(www\.)?github\.com$/i.test(parsed.hostname)) {
      return null;
    }

    const parts = parsed.pathname.split('/').filter(Boolean);
    if (parts.length >= 2) {
      const owner = parts[0];
      const repo = parts[1].replace(/\.git$/i, '');
      if (owner && repo) {
        return { owner, repo };
      }
    }
  } catch (e) {
    return null;
  }
  return null;
};

export const fetchRepoDetails = async (owner: string, repo: string): Promise<GithubRepo> => {
  const response = await githubFetch(`https://api.github.com/repos/${owner}/${repo}`);
  if (!response.ok) {
    const errorPayload = await response.json().catch(() => ({}));
    const apiMessage = typeof errorPayload?.message === 'string' ? errorPayload.message : '';

    if (response.status === 404) {
      throw new Error('Repository not found. Check the URL format (owner/repo), and if it is private set VITE_GITHUB_TOKEN.');
    }

    if (response.status === 403) {
      throw new Error(`GitHub API access denied or rate-limited${apiMessage ? `: ${apiMessage}` : ''}. Add VITE_GITHUB_TOKEN and retry.`);
    }

    throw new Error(`Failed to fetch repository details (HTTP ${response.status})${apiMessage ? `: ${apiMessage}` : ''}`);
  }
  const data = (await response.json()) as GitHubRepoResponse;
  return {
    owner,
    repo,
    description: data.description || 'No description provided',
    stars: data.stargazers_count,
    forks: data.forks_count,
    language: data.language || 'Unknown',
    defaultBranch: data.default_branch,
    url: data.html_url,
    topics: data.topics || []
  };
};

export const fetchRepoIssues = async (owner: string, repo: string) => {
  const response = await githubFetch(`https://api.github.com/repos/${owner}/${repo}/issues?state=open&per_page=10`);
  if (!response.ok) return [];
  return response.json();
};

export const fetchRepoStructure = async (
  owner: string,
  repo: string,
  branch: string,
  options?: { maxEntries?: number }
): Promise<FileNode[]> => {
  const response = await githubFetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`);
  if (!response.ok) {
    const errorPayload = await response.json().catch(() => ({}));
    const apiMessage = typeof errorPayload?.message === 'string' ? errorPayload.message : '';
    throw new Error(`Failed to fetch repository tree (HTTP ${response.status})${apiMessage ? `: ${apiMessage}` : ''}`);
  }
  const data = (await response.json()) as GitTreeResponse;
  const treeItems = options?.maxEntries ? data.tree.slice(0, options.maxEntries) : data.tree;
  
  const root: FileNode[] = [];
  const map: { [key: string]: FileNode } = {};

  treeItems.forEach((item) => {
    const parts = item.path.split('/');
    const name = parts[parts.length - 1];
    const node: FileNode = {
      path: item.path,
      type: item.type,
      sha: item.sha,
      size: item.size,
      name,
      children: item.type === 'tree' ? [] : undefined
    };
    map[item.path] = node;
    if (parts.length === 1) root.push(node);
    else {
      const parent = map[parts.slice(0, -1).join('/')];
      if (parent) parent.children?.push(node);
    }
  });

  return root;
};

export const fetchFileContent = async (owner: string, repo: string, path: string): Promise<string> => {
  const response = await githubFetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`);
  if (!response.ok) throw new Error('Failed to fetch file');
  const data = await response.json();
  return atob(data.content);
};

export const fetchIssues = async (owner: string, repo: string): Promise<GitHubIssue[]> => {
  const response = await githubFetch(`https://api.github.com/repos/${owner}/${repo}/issues?state=all&per_page=50`);
  if (!response.ok) return [];
  const data = (await response.json()) as GitHubIssueResponse[];
  return data.filter((issue) => !issue.pull_request).map((issue) => ({
    number: issue.number,
    title: issue.title,
    state: issue.state,
    created_at: issue.created_at,
    updated_at: issue.updated_at,
    labels: issue.labels.map((label) => label.name),
    user: issue.user.login,
    comments: issue.comments,
    body: issue.body || ''
  }));
};

export const fetchPullRequests = async (owner: string, repo: string): Promise<GitHubPR[]> => {
  const response = await githubFetch(`https://api.github.com/repos/${owner}/${repo}/pulls?state=all&per_page=50`);
  if (!response.ok) return [];
  const data = (await response.json()) as GitHubPullRequestResponse[];
  return data.map((pr) => ({
    number: pr.number,
    title: pr.title,
    state: pr.merged_at ? 'merged' : pr.state,
    created_at: pr.created_at,
    updated_at: pr.updated_at,
    user: pr.user.login,
    additions: pr.additions || 0,
    deletions: pr.deletions || 0,
    changed_files: pr.changed_files || 0,
    mergeable: pr.mergeable ?? null
  }));
};

export const fetchContributors = async (owner: string, repo: string): Promise<Contributor[]> => {
  const response = await githubFetch(`https://api.github.com/repos/${owner}/${repo}/contributors?per_page=20`);
  if (!response.ok) return [];
  const data = (await response.json()) as GitHubContributorResponse[];
  return data.map((contrib) => ({
    login: contrib.login,
    contributions: contrib.contributions,
    avatar_url: contrib.avatar_url
  }));
};

export const analyzeDependencies = async (owner: string, repo: string): Promise<DependencyInfo[]> => {
  try {
    const packageJson = await fetchFileContent(owner, repo, 'package.json');
    const pkg = JSON.parse(packageJson);
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    
    return Object.entries(deps).map(([name, version]) => ({
      name,
      currentVersion: version as string,
      isOutdated: false, // Would need npm registry API to check
      vulnerabilities: []
    }));
  } catch {
    return [];
  }
};

export const fetchCommitActivity = async (owner: string, repo: string) => {
  const response = await githubFetch(`https://api.github.com/repos/${owner}/${repo}/stats/commit_activity`);
  if (!response.ok) return null;
  return response.json();
};

export const fetchLanguageStats = async (owner: string, repo: string): Promise<Record<string, number>> => {
  const response = await githubFetch(`https://api.github.com/repos/${owner}/${repo}/languages`);
  if (!response.ok) return {};
  return (await response.json()) as Record<string, number>;
};

export const fetchRecentCommits = async (owner: string, repo: string, days: number = 7) => {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const response = await githubFetch(
    `https://api.github.com/repos/${owner}/${repo}/commits?since=${since.toISOString()}&per_page=100`
  );
  if (!response.ok) return [];
  return response.json();
};

export const fetchFileCommits = async (owner: string, repo: string, path: string) => {
  const response = await githubFetch(
    `https://api.github.com/repos/${owner}/${repo}/commits?path=${path}&per_page=10`
  );
  if (!response.ok) return [];
  return response.json();
};

export const fetchCodeOwnership = async (owner: string, repo: string) => {
  // Get all contributors with their commit details
  const response = await githubFetch(`https://api.github.com/repos/${owner}/${repo}/contributors?per_page=100`);
  if (!response.ok) return [];
  return response.json();
};
