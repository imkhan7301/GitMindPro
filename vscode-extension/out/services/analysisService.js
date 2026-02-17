"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeCurrentRepo = analyzeCurrentRepo;
exports.analyzeCurrentFile = analyzeCurrentFile;
exports.getTeamHealth = getTeamHealth;
const vscode = __importStar(require("vscode"));
const child_process = __importStar(require("child_process"));
const util = __importStar(require("util"));
const genai_1 = require("@google/genai");
const exec = util.promisify(child_process.exec);
async function analyzeCurrentRepo(apiKey) {
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
    }
    catch {
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
    const ai = new genai_1.GoogleGenAI({ apiKey });
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
async function analyzeCurrentFile(apiKey, fileName, content) {
    const ai = new genai_1.GoogleGenAI({ apiKey });
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
async function getTeamHealth(apiKey) {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
        throw new Error('No workspace folder open');
    }
    const cwd = workspaceFolder.uri.fsPath;
    // Get git contributors
    try {
        const { stdout } = await exec('git shortlog -sn --all --no-merges', { cwd });
        const contributors = stdout.trim().split('\n').slice(0, 10);
        const ai = new genai_1.GoogleGenAI({ apiKey });
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
    }
    catch (error) {
        throw new Error('Failed to analyze team health');
    }
}
async function fetchGitHubData(owner, repo) {
    const url = `https://api.github.com/repos/${owner}/${repo}`;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error('Failed to fetch repository data');
    }
    const data = (await response.json());
    return {
        stars: data.stargazers_count || 0,
        issues: data.open_issues_count || 0,
        language: data.language || 'Unknown',
        commits: 0 // Would need commits API for accurate count
    };
}
function detectTechStack(fileList) {
    const stack = [];
    if (fileList.includes('package.json'))
        stack.push('Node.js');
    if (fileList.includes('.tsx') || fileList.includes('.jsx'))
        stack.push('React');
    if (fileList.includes('.vue'))
        stack.push('Vue');
    if (fileList.includes('requirements.txt') || fileList.includes('.py'))
        stack.push('Python');
    if (fileList.includes('Cargo.toml'))
        stack.push('Rust');
    if (fileList.includes('go.mod'))
        stack.push('Go');
    if (fileList.includes('pom.xml') || fileList.includes('.java'))
        stack.push('Java');
    if (fileList.includes('Gemfile'))
        stack.push('Ruby');
    if (fileList.includes('composer.json'))
        stack.push('PHP');
    if (fileList.includes('.cs'))
        stack.push('C#');
    return stack;
}
//# sourceMappingURL=analysisService.js.map