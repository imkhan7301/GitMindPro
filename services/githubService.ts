
import { GithubRepo, FileNode } from '../types';

export const parseGithubUrl = (url: string): { owner: string; repo: string } | null => {
  try {
    const cleanedUrl = url.replace(/\/$/, "");
    const parts = cleanedUrl.split('github.com/')[1]?.split('/');
    if (parts && parts.length >= 2) {
      return { owner: parts[0], repo: parts[1] };
    }
  } catch (e) {
    return null;
  }
  return null;
};

export const fetchRepoDetails = async (owner: string, repo: string): Promise<GithubRepo> => {
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
  if (!response.ok) throw new Error('Repository not found');
  const data = await response.json();
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
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues?state=open&per_page=10`);
  if (!response.ok) return [];
  return response.json();
};

export const fetchRepoStructure = async (owner: string, repo: string, branch: string): Promise<FileNode[]> => {
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`);
  if (!response.ok) throw new Error('Failed to fetch tree');
  const data = await response.json();
  
  const root: FileNode[] = [];
  const map: { [key: string]: FileNode } = {};

  data.tree.forEach((item: any) => {
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
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`);
  if (!response.ok) throw new Error('Failed to fetch file');
  const data = await response.json();
  return atob(data.content);
};
