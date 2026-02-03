
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

export interface DeploymentPlan {
  serviceName: string;
  platform: 'Google Cloud' | 'Vercel' | 'Firebase';
  reasoning: string;
  configSnippet: string;
  complexity: 'Low' | 'Medium' | 'High';
}

export interface MarketPulse {
  sentiment: string;
  resources: { title: string; uri: string }[];
  locations?: { name: string; uri: string; snippet?: string }[];
}

export interface FlowElement {
  id: string;
  type?: string;
  data: { label: string };
  position: { x: number; y: number };
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  animated?: boolean;
}

export interface DeepAudit {
  reasoning: string;
  vulnerabilities: string[];
  architecturalDebt: string;
}

export interface AnalysisResult {
  summary: string;
  startupPitch: string;
  qaScript: string;
  aiStrategy: string;
  techStack: string[];
  architectureSuggestion: string;
  scorecard: Scorecard;
  roadmap: string[];
  mermaidDiagram: string;
  cloudArchitecture: DeploymentPlan[];
  flowNodes: FlowElement[];
  flowEdges: FlowEdge[];
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface VisualAuditResult {
  analysis: string;
  gaps: string[];
  suggestions: string[];
}

export interface TerminalLog {
  id: string;
  timestamp: number;
  type: 'info' | 'ai' | 'error' | 'success';
  message: string;
}

export type AppTab = 'intelligence' | 'blueprint' | 'lab' | 'cloud' | 'market' | 'vision' | 'audit';
