
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

export interface VulnerabilityRemediationPlan {
  title: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  affectedFiles: string[];
  fixSteps: string[];
  verificationSteps: string[];
  safePrompt: string;
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
  architectureTour: ArchitectureTour;
}

export interface ArchitectureTourStep {
  nodeId: string;
  title: string;
  bullets: string[];
}

export interface ArchitectureTour {
  title: string;
  summary: string;
  steps: ArchitectureTourStep[];
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  fileLinks?: string[];
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

export interface GitHubIssue {
  number: number;
  title: string;
  state: 'open' | 'closed';
  created_at: string;
  updated_at: string;
  labels: string[];
  user: string;
  comments: number;
  body: string;
}

export interface GitHubPR {
  number: number;
  title: string;
  state: 'open' | 'closed' | 'merged';
  created_at: string;
  updated_at: string;
  user: string;
  additions: number;
  deletions: number;
  changed_files: number;
  mergeable: boolean | null;
}

export interface Contributor {
  login: string;
  contributions: number;
  avatar_url: string;
}

export interface DependencyInfo {
  name: string;
  currentVersion: string;
  latestVersion?: string;
  isOutdated: boolean;
  severity?: 'low' | 'moderate' | 'high' | 'critical';
  vulnerabilities?: string[];
}

export interface CodeHealth {
  totalFiles: number;
  totalLines: number;
  languages: { [key: string]: number };
  complexity: 'low' | 'medium' | 'high';
  testCoverage?: number;
  lastCommit: string;
  commitFrequency: string;
}

export interface ProjectInsights {
  issues: GitHubIssue[];
  pullRequests: GitHubPR[];
  contributors: Contributor[];
  dependencies: DependencyInfo[];
  codeHealth: CodeHealth;
  issuesSummary: InsightSummary;
  prSummary: InsightSummary;
  teamDynamics: InsightSummary;
}

export interface SummarySection {
  heading: string;
  bullets: string[];
}

export interface InsightSummary {
  overview: string;
  sections: SummarySection[];
}

export interface OnboardingGuide {
  quickStart: string;
  criticalFiles: string[];
  recommendedPath: string[];
  commonTasks: { task: string; steps: string[] }[];
  setupInstructions: string;
  codeOwnership?: string;
  recentActivity?: {
    summary: string;
    hotFiles: [string, number][];
    totalCommits: number;
    activeDevs: number;
  };
  testingSetup?: {
    hasTests: boolean;
    testFramework: string;
    testCommand: string;
    testFiles: string[];
    guidance: string;
  };
}

export interface CodeOwner {
  path: string;
  owner: string;
  contributions: number;
  lastModified: string;
}

export interface RecentActivity {
  path: string;
  commits: number;
  lastModified: string;
  authors: string[];
}

export interface TestingInfo {
  hasTests: boolean;
  testFramework: string;
  testCommand: string;
  testFiles: string[];
  coverage?: number;
}

export type AppTab = 'intelligence' | 'blueprint' | 'lab' | 'cloud' | 'market' | 'vision' | 'audit' | 'insights' | 'onboarding';
