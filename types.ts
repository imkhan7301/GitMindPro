
export interface GithubRepo {
  owner: string;
  repo: string;
  description: string;
  stars: number;
  forks: number;
  language: string;
  defaultBranch: string;
  url: string;
  topics: string[];
}

export interface FileNode {
  path: string;
  type: 'blob' | 'tree';
  sha: string;
  size?: number;
  name: string;
  children?: FileNode[];
  aiTag?: string;
}

export interface Scorecard {
  maintenance: number;
  documentation: number;
  innovation: number;
  security: number;
}

export interface MarketInsight {
  competitors: { name: string; url: string; description: string }[];
  trendingTopics: string[];
  externalResources: { title: string; uri: string }[];
}

export interface PulseAnalysis {
  healthScore: number;
  topIssues: { title: string; category: 'Bug' | 'Feature' | 'Debt'; priority: 'High' | 'Medium' | 'Low' }[];
}

export interface AnalysisResult {
  summary: string;
  techStack: string[];
  keyFeatures: string[];
  architectureSuggestion: string;
  scorecard: Scorecard;
  roadmap: string[];
  mermaidDiagram: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export type AppTab = 'intelligence' | 'blueprint' | 'market' | 'pulse';
