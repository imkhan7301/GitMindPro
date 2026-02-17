import * as vscode from 'vscode';
import * as child_process from 'child_process';
import * as util from 'util';
import { GoogleGenAI } from '@google/genai';

const exec = util.promisify(child_process.exec);

interface RepoAnalysis {
    summary: string;
    techStack: string[];
    health: {
        issues: number;
        stars: number;
        commits: number;
    };
    insights: string;
}

interface TeamHealth {
    contributors: string[];
    analysis?: string;
}

interface GitHubRepoApiResponse {
    stargazers_count?: number;
    open_issues_count?: number;
    language?: string | null;
}

export async function analyzeCurrentRepo(apiKey: string): Promise<RepoAnalysis> {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
        throw new Error('No workspace folder open');
    }

    const cwd = workspaceFolder.uri.fsPath;
    
    // Get git info
    let repoUrl = '';
    try {
        const { stdout: urlOutput } = await exec('git config --get remote.origin.url', { cwd });
        repoUrl = urlOutput.trim();
    } catch {
        throw new Error('Not a git repository');
    }

    // Parse GitHub URL
    const match = repoUrl.match(/github\.com[:/]([^/]+)\/([^/.]+)/);
    if (!match) {
        throw new Error('Not a GitHub repository');
    }
    const [, owner, repo] = match;

    // Fetch GitHub data
    const repoData = await fetchGitHubData(owner, repo);
    
    // Get local file structure
    const files = await vscode.workspace.findFiles('**/*', '**/node_modules/**', 100);
    const fileList = files.map(f => vscode.workspace.asRelativePath(f)).join('\n');

    // Analyze with Gemini
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: {
            parts: [{
                text: `Analyze this GitHub repository and provide insights:
                
Repository: ${owner}/${repo}
Stars: ${repoData.stars}
Issues: ${repoData.issues}
Language: ${repoData.language}

Files:
${fileList.substring(0, 2000)}

Provide:
1. A concise summary (2-3 sentences)
2. Key tech stack identified
3. Project health assessment
4. Strategic insights for developers`
            }]
        }
    });

    const text = response.text || '';
    
    return {
        summary: text.substring(0, 300),
        techStack: detectTechStack(fileList),
        health: {
            issues: repoData.issues,
            stars: repoData.stars,
            commits: repoData.commits
        },
        insights: text
    };
}

export async function analyzeCurrentFile(apiKey: string, fileName: string, content: string): Promise<string> {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: {
            parts: [{
                text: `Explain this code file in detail:

File: ${fileName}
Content:
${content.substring(0, 8000)}

Provide:
1. Purpose and functionality
2. Key components/functions
3. Dependencies and imports
4. Potential improvements
5. Code quality assessment`
            }]
        }
    });

    return response.text || 'Unable to analyze file';
}

export async function getTeamHealth(apiKey: string): Promise<TeamHealth> {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
        throw new Error('No workspace folder open');
    }

    const cwd = workspaceFolder.uri.fsPath;
    
    // Get git contributors
    try {
        const { stdout } = await exec('git shortlog -sn --all --no-merges', { cwd });
        const contributors = stdout.trim().split('\n').slice(0, 10);
        
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: {
                parts: [{
                    text: `Analyze team dynamics from these contributors:
                    
${contributors.join('\n')}

Provide insights on:
1. Team size and distribution
2. Bus factor / key person dependency
3. Collaboration health
4. Recommendations`
                }]
            }
        });

        return {
            contributors,
            analysis: response.text || undefined
        };
    } catch (error) {
        throw new Error('Failed to analyze team health');
    }
}

async function fetchGitHubData(owner: string, repo: string) {
    const url = `https://api.github.com/repos/${owner}/${repo}`;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error('Failed to fetch repository data');
    }
    const data = (await response.json()) as GitHubRepoApiResponse;
    return {
        stars: data.stargazers_count || 0,
        issues: data.open_issues_count || 0,
        language: data.language || 'Unknown',
        commits: 0 // Would need commits API for accurate count
    };
}

function detectTechStack(fileList: string): string[] {
    const stack: string[] = [];
    
    if (fileList.includes('package.json')) stack.push('Node.js');
    if (fileList.includes('.tsx') || fileList.includes('.jsx')) stack.push('React');
    if (fileList.includes('.vue')) stack.push('Vue');
    if (fileList.includes('requirements.txt') || fileList.includes('.py')) stack.push('Python');
    if (fileList.includes('Cargo.toml')) stack.push('Rust');
    if (fileList.includes('go.mod')) stack.push('Go');
    if (fileList.includes('pom.xml') || fileList.includes('.java')) stack.push('Java');
    if (fileList.includes('Gemfile')) stack.push('Ruby');
    if (fileList.includes('composer.json')) stack.push('PHP');
    if (fileList.includes('.cs')) stack.push('C#');
    
    return stack;
}
