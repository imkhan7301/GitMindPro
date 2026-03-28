
import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { User } from '@supabase/supabase-js';
// jsPDF loaded dynamically on export to reduce initial bundle
import ReactFlow, { Background, Controls, MiniMap, useNodesState, useEdgesState, ConnectionLineType, useReactFlow, ReactFlowProvider, Node, Edge, OnNodesChange, OnEdgesChange } from 'reactflow';
import { parseGithubUrl, fetchRepoDetails, fetchRepoStructure, fetchFileContent, fetchIssues, fetchPullRequests, fetchContributors, analyzeDependencies, fetchLanguageStats, fetchRecentCommits, fetchCodeOwnership, fetchPullRequestFiles, postPRComment, commitFileToRepo } from './services/githubService';
import { analyzeRepository, chatWithRepo, generateSpeech, synthesizeLabTask, explainCode, generateVisionVideo, performDeepAudit, analyzeIssues, analyzePullRequests, analyzeTeamDynamics, generateOnboardingGuide, analyzeCodeOwnership, analyzeRecentActivity, analyzeTestingSetup, generateVulnerabilityRemediation, analyzePullRequestFiles, generateFixSnippet, generateCIWorkflow, analyzeDependencyRisks, generateReadme, analyzeBlameIntelligence, generateAIPRReview, calculateTechDebt, scanCVEs, generateReviewChecklist, generateArchitectureDiagram, generateCommitMessage, extractCodeIntelligence, generateChangelog, generateOnboardingChecklist, estimateTestCoverage, scanAgenticRisks, analyzeDependencyIntelligence, detectBreakingChanges, predictPRMerge, generateAIBOM, scanSupplyChain, detectDeadCode, runInvariantCheck, generateRefactoringPlan, generateSectionConfidence, analyzePerformance } from './services/geminiService';
import type { DepRisk, BlameInsight, AIReviewResult, TechDebtReport, CVEReport } from './services/geminiService';
import { acceptWorkspaceInvitation, canAnalyzeToday, createWorkspace, createWorkspaceInvitation, ensurePersonalWorkspace, ensureUserProfile, getAnalysisHistory, getAnalysisRaw, getOrCreateReferralCode, getReferralStats, getPRReviewHistory, getCurrentUser, getGitHubProviderToken, isAuthConfigured, listUserWorkspaces, listWorkspaceMembers, onAuthStateChange, saveAnalysisRecordReturningId, savePRReview, signInWithGitHub, signOutAuth, toggleAnalysisPublic, watchRepo, unwatchRepo, getWatchedRepos } from './services/supabaseService';
import { canUseFreeTier, getFreeTierStatus, incrementFreeTierCount } from './utils/freeTier';
import { getSubscriptionStatus, clearSubscriptionCache, startCheckout, openBillingPortal, getEffectiveDailyLimit, canCreateTeamWorkspace } from './services/stripeService';
import type { SubscriptionStatus } from './services/stripeService';
import { setSentryUser, clearSentryUser } from './services/sentryService';
import { sendSlackNotification } from './services/slackService';
import { GithubRepo, FileNode, AnalysisResult, ChatMessage, AppTab, TerminalLog, DeepAudit, ProjectInsights, CodeHealth, OnboardingGuide, InsightSummary, VulnerabilityRemediationPlan, PRReviewResult, SavedAnalysis, SavedPRReview, Workspace } from './types';
import FileTree from './components/FileTree';
import Loader from './components/Loader';
import ScoreCard from './components/ScoreCard';
import AnalysisHistory from './components/AnalysisHistory';
import PricingModal from './components/PricingModal';
import ExpertMarketplace from './components/ExpertMarketplace';
import CompareRepos from './components/CompareRepos';
import NotificationCenter from './components/NotificationCenter';
import type { AppNotification } from './components/NotificationCenter';
import OnboardingWizard from './components/OnboardingWizard';
import TrendChart from './components/TrendChart';
import SettingsPanel from './components/SettingsPanel';
import AnalysisDiff from './components/AnalysisDiff';
import BadgeEmbed from './components/BadgeEmbed';
import ChangelogModal, { CHANGELOG_VERSION } from './components/ChangelogModal';
import WebhookFeed from './components/WebhookFeed';
import ActivityHeatmap from './components/ActivityHeatmap';
import GlobalSearch from './components/GlobalSearch';
import TeamActivityFeed from './components/TeamActivityFeed';
import ExportHistoryCSV from './components/ExportHistoryCSV';
import RepoTags from './components/RepoTags';
import PRDiffViewer from './components/PRDiffViewer';
import ScheduledReports from './components/ScheduledReports';
import CustomScoringWeights from './components/CustomScoringWeights';
import type { ScoringWeights } from './components/CustomScoringWeights';
import PublicScorecardPage from './components/PublicScorecardPage';
import WhatsNextPanel from './components/WhatsNextPanel';
import PinnedInsight, { savePinnedInsight } from './components/PinnedInsight';
import RepoLeaderboard from './components/RepoLeaderboard';
import ReadmeGenerator from './components/ReadmeGenerator';
import BlameIntelligence from './components/BlameIntelligence';
import PRReviewer from './components/PRReviewer';
import TechDebtCalculator from './components/TechDebtCalculator';
import CVEMonitor from './components/CVEMonitor';
import HealthDashboard from './components/HealthDashboard';
import CodeReviewChecklist from './components/CodeReviewChecklist';
import type { ReviewChecklist } from './components/CodeReviewChecklist';
import SmartAlerts from './components/SmartAlerts';
import type { ScoreAlert } from './components/SmartAlerts';
import VibeModeSelector from './components/VibeModeSelector';
import type { VibeMode } from './components/VibeModeSelector';
import ArchitectureDiagram from './components/ArchitectureDiagram';
import type { ArchitectureDiagramResult } from './components/ArchitectureDiagram';
import CommitMessageGenerator from './components/CommitMessageGenerator';
import type { GeneratedCommit } from './components/CommitMessageGenerator';
import CodeExtractor from './components/CodeExtractor';
import type { CodeExtraction } from './components/CodeExtractor';
import PublicRepoGallery from './components/PublicRepoGallery';
import ChangelogGenerator from './components/ChangelogGenerator';
import type { GeneratedChangelog } from './components/ChangelogGenerator';
import HealthTimeline from './components/HealthTimeline';
import OnboardingChecklist from './components/OnboardingChecklist';
import type { GeneratedOnboardingChecklist } from './components/OnboardingChecklist';
import AgenticSecurityScanner from './components/AgenticSecurityScanner';
import TestCoverageCard from './components/TestCoverageCard';
import DependencyIntelligence from './components/DependencyIntelligence';
import type { DependencyReport } from './components/DependencyIntelligence';
import BreakingChangeDetector from './components/BreakingChangeDetector';
import type { BreakingChangeReport } from './components/BreakingChangeDetector';
import PRMergePredictor from './components/PRMergePredictor';
import type { PRMergePrediction } from './components/PRMergePredictor';
import AIBOMGenerator from './components/AIBOMGenerator';
import type { AIBOMReport } from './components/AIBOMGenerator';
import SupplyChainScanner from './components/SupplyChainScanner';
import type { SupplyChainScanResult } from './components/SupplyChainScanner';
import DeadCodeDetector from './components/DeadCodeDetector';
import type { DeadCodeReport } from './components/DeadCodeDetector';
import InvariantChecker from './components/InvariantChecker';
import type { InvariantCheckResult } from './components/InvariantChecker';
import RefactoringAdvisor from './components/RefactoringAdvisor';
import type { RefactoringPlan } from './components/RefactoringAdvisor';
import SectionConfidencePanel from './components/SectionConfidencePanel';
import type { SectionConfidenceReport } from './components/SectionConfidencePanel';
import PerformancePack from './components/PerformancePack';
import type { PerformanceReport } from './components/PerformancePack';
import MultiRepoHealthMatrix from './components/MultiRepoHealthMatrix';
import SmartUpgradeNudge from './components/SmartUpgradeNudge';
import ShareCard from './components/ShareCard';
import AnimatedDashboardPreview from './components/AnimatedDashboardPreview';
import { DEMO_REPO, DEMO_STRUCTURE, DEMO_ANALYSIS, DEMO_DEEP_AUDIT, DEMO_ONBOARDING, DEMO_INSIGHTS, DEMO_BLAME_INSIGHTS, DEMO_TECH_DEBT, DEMO_CVE_REPORT } from './utils/demoData';
import { useTheme } from './hooks/useTheme';
import { Search, Code, Layout, TrendingUp, Shield, Send, Activity, Cloud, Zap, FlaskConical, Sparkles, Terminal, Rocket, Server, ChevronUp, ChevronDown, Video, MapPin, Users, BrainCircuit, AlertTriangle, GitPullRequest, Bug, Package, LogIn, LogOut, ClipboardCheck, CreditCard, X, Share2, Link, FileText, BarChart3, Clock, ArrowRight, Gift, Copy, CheckCircle2, Plus, Briefcase, GitBranch, Twitter, Sun, Moon, Settings, RotateCw, Download, Sliders, Calendar, Wand2, MessageSquare, Cpu, ShieldCheck, GitCommit } from 'lucide-react';

type AiStudioBridge = {
  hasSelectedApiKey: () => Promise<boolean>;
  openSelectKey: () => Promise<void>;
};

type FlowNodeData = { label: string };
type FindingStatus = 'new' | 'confirmed' | 'false-positive' | 'resolved';
const ACTIVE_WORKSPACE_KEY = 'gitmind.activeWorkspaceId';

declare global {
  interface Window {
    aistudio?: AiStudioBridge;
  }
}

const getErrorText = (error: unknown): string => (
  error instanceof Error ? error.message : String(error)
);

const renderInsightSummary = (summary: InsightSummary) => (
  <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 mb-6 space-y-4">
    {summary.overview && (
      <p className="text-slate-300 text-sm leading-relaxed">{summary.overview}</p>
    )}
    {summary.sections?.length > 0 && (
      <div className="space-y-4">
        {summary.sections.map((section, idx) => (
          <div key={`${section.heading}-${idx}`}>
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">{section.heading}</div>
            <ul className="space-y-1">
              {section.bullets.map((bullet, bulletIdx) => (
                <li key={`${section.heading}-${bulletIdx}`} className="text-slate-300 text-sm leading-relaxed flex gap-2">
                  <span className="text-indigo-400 mt-1">•</span>
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    )}
  </div>
);

// Internal component to handle fitView properly
const BlueprintGraph: React.FC<{ nodes: Node<FlowNodeData>[]; edges: Edge[]; onNodesChange: OnNodesChange; onEdgesChange: OnEdgesChange }> = ({ nodes, edges, onNodesChange, onEdgesChange }) => {
  const { fitView } = useReactFlow();
  
  useEffect(() => {
    const timer = setTimeout(() => fitView(), 200);
    return () => clearTimeout(timer);
  }, [nodes, fitView]);

  return (
    <ReactFlow 
      nodes={nodes} 
      edges={edges} 
      onNodesChange={onNodesChange} 
      onEdgesChange={onEdgesChange} 
      fitView
      connectionLineType={ConnectionLineType.SmoothStep}
    >
      <Background color="#1e1b4b" gap={20} />
      <Controls />
      <MiniMap nodeColor="#4338ca" maskColor="rgba(2, 6, 23, 0.7)" />
    </ReactFlow>
  );
};

const normalizeFilePath = (path: string) => path.replace(/^\.\/+/, '').trim();

const buildFallbackBlueprint = (nodes: FileNode[], maxNodes: number = 12): Node<FlowNodeData>[] => {
  const topNodes = nodes.slice(0, maxNodes);
  const columns = Math.ceil(Math.sqrt(topNodes.length || 1));
  const spacingX = 240;
  const spacingY = 170;

  return topNodes.map((node, index) => ({
    id: node.path,
    data: { label: node.name || node.path },
    position: {
      x: (index % columns) * spacingX,
      y: Math.floor(index / columns) * spacingY
    }
  }));
};

const findNodeByPath = (nodes: FileNode[], targetPath: string): FileNode | null => {
  const normalizedTarget = normalizeFilePath(targetPath);
  let suffixMatch: FileNode | null = null;

  for (const node of nodes) {
    if (node.path === normalizedTarget) return node;
    if (!suffixMatch && (node.path.endsWith(`/${normalizedTarget}`) || node.name === normalizedTarget)) {
      suffixMatch = node;
    }

    if (node.type === 'tree' && node.children) {
      const found = findNodeByPath(node.children, normalizedTarget);
      if (found) return found;
    }
  }

  return suffixMatch;
};

const App: React.FC = () => {
  const appEnv = (import.meta.env.VITE_APP_ENV || import.meta.env.VITE_ENV || 'DEV').toString().toUpperCase();
  const fastModeFlag = (import.meta.env.VITE_FAST_MODE ?? '').toString().toLowerCase();
  const authEnabled = isAuthConfigured();
  const fastMode = fastModeFlag === 'true' || fastModeFlag === '1';
  const { theme, toggleTheme } = useTheme();
  const maxTreeEntriesEnv = Number(import.meta.env.VITE_FAST_MODE_MAX_ENTRIES ?? 1500);
  const maxTreeEntries = Number.isFinite(maxTreeEntriesEnv) && maxTreeEntriesEnv > 0
    ? maxTreeEntriesEnv
    : 1500;
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStage, setLoadingStage] = useState('');
  const [loadingTip, setLoadingTip] = useState(0);
  const [activeTab, setActiveTab] = useState<AppTab>('intelligence');
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(authEnabled);
  const [authBusy, setAuthBusy] = useState(false);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState('');
  const [workspaceLoading, setWorkspaceLoading] = useState(false);
  
  const [repo, setRepo] = useState<GithubRepo | null>(null);
  const [structure, setStructure] = useState<FileNode[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [deepAudit, setDeepAudit] = useState<DeepAudit | null>(null);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditReadme, setAuditReadme] = useState('');
  const [remediationPlans, setRemediationPlans] = useState<Record<number, VulnerabilityRemediationPlan>>({});
  const [remediationLoading, setRemediationLoading] = useState<Record<number, boolean>>({});
  const [findingStatus, setFindingStatus] = useState<Record<number, FindingStatus>>({});
  
  // New: Project Insights State
  const [insights, setInsights] = useState<ProjectInsights | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  
  // New: Onboarding Guide State
  const [onboardingGuide, setOnboardingGuide] = useState<OnboardingGuide | null>(null);
  const [onboardingLoading, setOnboardingLoading] = useState(false);

  const [prReviewUrl, setPrReviewUrl] = useState('');
  const [prReviewLoading, setPrReviewLoading] = useState(false);
  const [prReviewResult, setPrReviewResult] = useState<PRReviewResult | null>(null);
  const [prReviewMeta, setPrReviewMeta] = useState<{ number: number; title: string; fileCount: number } | null>(null);
  const [prReviewFiles, setPrReviewFiles] = useState<{ filename: string; status: string; additions: number; deletions: number; patch?: string }[]>([]);
  const [fixSnippets, setFixSnippets] = useState<Record<string, { explanation: string; code: string; language: string } | 'loading'>>({});
  
  // Free tier state
  const [freeTierStatus, setFreeTierStatus] = useState(getFreeTierStatus());
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);

  // Analysis history state
  const [analysisHistory, setAnalysisHistory] = useState<SavedAnalysis[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // PR review history state
  const [prReviewHistory, setPrReviewHistory] = useState<SavedPRReview[]>([]);
  const [prHistoryLoading, setPrHistoryLoading] = useState(false);

  // Subscription state
  const [subscription, setSubscription] = useState<SubscriptionStatus>({ plan: 'free', status: 'none', currentPeriodEnd: null, isActive: false });
  const [showPricing, setShowPricing] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [checkoutBanner, setCheckoutBanner] = useState<{ type: 'success' | 'canceled'; plan?: string; trial?: boolean } | null>(null);
  const [appToast, setAppToast] = useState<{ type: 'success' | 'error' | 'info' | 'warning'; title: string; message?: string } | null>(null);
  const showToast = (type: 'success' | 'error' | 'info' | 'warning', title: string, message?: string) => {
    setAppToast({ type, title, message });
    setTimeout(() => setAppToast(null), 5000);
  };
  const freeDailyAnalysisLimit = getEffectiveDailyLimit(subscription);

  // Usage tracking for authenticated users
  const [dailyUsage, setDailyUsage] = useState<{ used: number; limit: number } | null>(null);

  // Watched repos (for scheduled analysis)
  const [watchedRepos, setWatchedRepos] = useState<Set<string>>(new Set());
  
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [fileExplanation, setFileExplanation] = useState<string | null>(null);
  const [fileLoading, setFileLoading] = useState(false);
  
  const [labResult, setLabResult] = useState<string | null>(null);
  const [labLoading, setLabLoading] = useState(false);
  const [visionVideo, setVisionVideo] = useState<string | null>(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const [introScript, setIntroScript] = useState<string | null>(null);
  const [introAudioUrl, setIntroAudioUrl] = useState<string | null>(null);
  const [introLoading, setIntroLoading] = useState(false);
  const [introPlaying, setIntroPlaying] = useState(false);
  const introAudioRef = useRef<HTMLAudioElement>(null);

  const [nodes, setNodes, onNodesChange] = useNodesState<FlowNodeData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const [tourStepIndex, setTourStepIndex] = useState(0);
  const [tourAutoPlay, setTourAutoPlay] = useState(true);
  const [tourHasAutoPlayed, setTourHasAutoPlayed] = useState(false);

  const [terminalLogs, setTerminalLogs] = useState<TerminalLog[]>([]);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);

  const exportAnalysisPdf = useCallback(async () => {
    if (!repo || !analysis) return;

    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const margin = 40;
    const pageWidth = doc.internal.pageSize.getWidth();
    const certId = `GMP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const generatedDate = new Date().toLocaleString();
    const verifyUrl = `https://gitmindpro.com/verify/${certId}`;
    let y = 40;

    // ─── Certification Header Bar ───
    doc.setFillColor(67, 56, 202); // indigo-700
    doc.rect(0, 0, pageWidth, 80, 'F');
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.text('GitMindPro', margin, 35);
    doc.setFontSize(10);
    doc.text('CERTIFIED CODE INTELLIGENCE REPORT', margin, 55);
    doc.setFontSize(8);
    doc.setTextColor(200, 200, 255);
    doc.text(`Verification ID: ${certId}`, pageWidth - margin, 35, { align: 'right' });
    doc.text(generatedDate, pageWidth - margin, 50, { align: 'right' });
    doc.text(verifyUrl, pageWidth - margin, 65, { align: 'right' });
    y = 100;

    const addSection = (title: string, content: string) => {
      doc.setFontSize(14);
      doc.setTextColor(41, 128, 185);
      doc.text(title, margin, y);
      y += 20;
      doc.setFontSize(11);
      doc.setTextColor(33, 33, 33);

      const text = doc.splitTextToSize(content, 520);
      doc.text(text, margin, y);
      y += text.length * 16 + 10;

      if (y > 760) {
        doc.addPage();
        y = margin;
      }
    };

    addSection('Executive Summary', analysis.summary || 'No summary available.');
    addSection('Primary Tech Stack', analysis.techStack && analysis.techStack.length > 0 ? analysis.techStack.join(', ') : 'N/A');
    addSection('Scorecard', `Maintenance: ${analysis.scorecard.maintenance || 'N/A'}\nDocumentation: ${analysis.scorecard.documentation || 'N/A'}\nInnovation: ${analysis.scorecard.innovation || 'N/A'}\nSecurity: ${analysis.scorecard.security || 'N/A'}`);

    if (analysis.roadmap && analysis.roadmap.length > 0) {
      addSection('Roadmap Highlights', analysis.roadmap.slice(0, 10).map((line, index) => `${index + 1}. ${line}`).join('\n'));
    }

    if (analysis.architectureTour?.summary) {
      addSection('Architecture Tour', analysis.architectureTour.summary);
    }

    addSection('Startup Pitch', analysis.startupPitch || 'N/A');
    addSection('AI Strategy', analysis.aiStrategy || 'N/A');
    addSection('QA Script', analysis.qaScript || 'N/A');

    doc.save(`${repo.owner}_${repo.repo}_gitmind_analysis.pdf`);
  }, [repo, analysis]);

  // Last saved analysis ID + share token (for share/badge features)
  const [lastAnalysisId, setLastAnalysisId] = useState<string | null>(null);
  const [lastShareToken, setLastShareToken] = useState<string | null>(null);
  const [isShared, setIsShared] = useState(false);
  // Wave 22: ShareCard modal
  const [showShareCard, setShowShareCard] = useState(false);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referralCopied, setReferralCopied] = useState(false);
  const [referralStats, setReferralStats] = useState<{ count: number; daysEarned: number }>({ count: 0, daysEarned: 0 });

  // Command palette state
  const [cmdPaletteOpen, setCmdPaletteOpen] = useState(false);
  const [cmdQuery, setCmdQuery] = useState('');
  const cmdInputRef = useRef<HTMLInputElement>(null);

  // Favorites (localStorage-backed)
  const [favorites, setFavorites] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('gitmind.favorites') || '[]'); } catch { return []; }
  });

  // Dashboard tab state
  const [dashboardTab, setDashboardTab] = useState<'home' | 'marketplace' | 'compare' | 'health'>('home');

  // Onboarding wizard state
  const [showOnboarding, setShowOnboarding] = useState(() => !localStorage.getItem('gitmind.onboarded'));
  const [showExpertHire, setShowExpertHire] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showBadgeEmbed, setShowBadgeEmbed] = useState(false);
  const [showAnalysisDiff, setShowAnalysisDiff] = useState(false);
  const [showChangelog, setShowChangelog] = useState(false);
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const [showTeamActivity, setShowTeamActivity] = useState(false);
  const [showExportCSV, setShowExportCSV] = useState(false);
  const [showDiffViewer, setShowDiffViewer] = useState(false);
  const [showScheduledReports, setShowScheduledReports] = useState(false);
  const [showScoringWeights, setShowScoringWeights] = useState(false);
  const [, setScoringWeights] = useState<ScoringWeights | null>(null);

  // Wave 10: GitHub PR Comment Bot state
  const [prCommentPosting, setPrCommentPosting] = useState(false);
  const [prCommentPosted, setPrCommentPosted] = useState(false);
  const [prCommentUrl, setPrCommentUrl] = useState<string | null>(null);
  const [prCommentError, setPrCommentError] = useState<string | null>(null);
  const [prCommentCustomToken, setPrCommentCustomToken] = useState('');
  const [showPrTokenInput, setShowPrTokenInput] = useState(false);

  // Wave 10: What's Next panel state
  const [showWhatsNext, setShowWhatsNext] = useState(false);

  // Wave 11: CI Workflow Generator state
  const [ciWorkflow, setCiWorkflow] = useState<string | null>(null);
  const [ciLoading, setCiLoading] = useState(false);
  const [ciCommitting, setCiCommitting] = useState(false);
  const [ciCommitUrl, setCiCommitUrl] = useState<string | null>(null);
  const [ciCommitToken, setCiCommitToken] = useState('');
  const [showCiTokenInput, setShowCiTokenInput] = useState(false);
  const [ciCopied, setCiCopied] = useState(false);

  // Wave 11: Dependency Risk Scanner state
  const [depRisks, setDepRisks] = useState<DepRisk[] | null>(null);
  const [depLoading, setDepLoading] = useState(false);

  // Wave 12: README Generator state
  const [generatedReadme, setGeneratedReadme] = useState<string | null>(null);
  const [readmeLoading, setReadmeLoading] = useState(false);
  const [readmeCommitting, setReadmeCommitting] = useState(false);
  const [readmeCommitUrl, setReadmeCommitUrl] = useState<string | null>(null);
  const [readmeCommitError, setReadmeCommitError] = useState<string | null>(null);

  // Wave 12: Blame Intelligence state
  const [blameInsights, setBlameInsights] = useState<BlameInsight[] | null>(null);
  const [blameLoading, setBlameLoading] = useState(false);

  // Wave 13: AI PR Reviewer (isolated state — separate from legacy PR review)
  const [aiPrUrl, setAiPrUrl] = useState('');
  const [aiPrResult, setAiPrResult] = useState<AIReviewResult | null>(null);
  const [aiPrLoading, setAiPrLoading] = useState(false);
  const [aiPrPosting, setAiPrPosting] = useState(false);
  const [aiPrPostUrl, setAiPrPostUrl] = useState<string | null>(null);

  // Wave 13: Tech Debt Calculator state
  const [techDebtReport, setTechDebtReport] = useState<TechDebtReport | null>(null);
  const [techDebtLoading, setTechDebtLoading] = useState(false);

  // Wave 13: CVE Monitor state
  const [cveReport, setCveReport] = useState<CVEReport | null>(null);
  const [cveLoading, setCveLoading] = useState(false);

  // Wave 14: Interactive Demo Mode
  const [demoMode, setDemoMode] = useState(false);

  // Wave 15: AI Code Review Checklist state
  const [reviewChecklist, setReviewChecklist] = useState<ReviewChecklist | null>(null);
  const [checklistLoading, setChecklistLoading] = useState(false);

  // Wave 15: Smart Alerts state (localStorage-persisted)
  const [scoreAlerts, setScoreAlerts] = useState<ScoreAlert[]>(() => {
    try { return JSON.parse(localStorage.getItem('gitmind.scoreAlerts') || '[]'); } catch { return []; }
  });
  const handleSaveAlerts = useCallback((alerts: ScoreAlert[]) => {
    setScoreAlerts(alerts);
    localStorage.setItem('gitmind.scoreAlerts', JSON.stringify(alerts));
  }, []);

  // Wave 16: Vibe Mode (localStorage-persisted)
  const [vibeMode, setVibeMode] = useState<VibeMode>(() => {
    const saved = localStorage.getItem('gitmind.vibeMode') as VibeMode | null;
    return saved || 'new-dev';
  });
  const handleVibeChange = useCallback((v: VibeMode) => {
    setVibeMode(v);
    localStorage.setItem('gitmind.vibeMode', v);
  }, []);

  // Wave 16: AI Architecture Diagram state
  const [archDiagram, setArchDiagram] = useState<ArchitectureDiagramResult | null>(null);
  const [archDiagramLoading, setArchDiagramLoading] = useState(false);

  // Wave 17: Code Intelligence Extractor state
  const [codeExtractionLoading, setCodeExtractionLoading] = useState(false);

  // Wave 18 state
  const [onboardingChecklistLoading, setOnboardingChecklistLoading] = useState(false);
  const [testCoverageLoading, setTestCoverageLoading] = useState(false);
  const [agenticScanLoading, setAgenticScanLoading] = useState(false);

  // Wave 19 state
  const [depIntelLoading, setDepIntelLoading] = useState(false);
  const [breakingChangeLoading, setBreakingChangeLoading] = useState(false);
  const [prPredictLoading, setPrPredictLoading] = useState(false);
  const [aibomLoading, setAibomLoading] = useState(false);
  const [supplyChainLoading, setSupplyChainLoading] = useState(false);
  // Wave 20 state
  const [deadCodeLoading, setDeadCodeLoading] = useState(false);
  const [invariantLoading, setInvariantLoading] = useState(false);
  const [refactorLoading, setRefactorLoading] = useState(false);
  const [sectionConfLoading, setSectionConfLoading] = useState(false);
  const [performanceLoading, setPerformanceLoading] = useState(false);
  const [nudgeDismissed, setNudgeDismissed] = useState(false);
  const [sectionConfReport, setSectionConfReport] = useState<SectionConfidenceReport | null>(null);

  // Notifications state (localStorage-backed)
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try { return JSON.parse(localStorage.getItem('gitmind.notifications') || '[]'); } catch { return []; }
  });
  const addNotification = useCallback((n: Omit<AppNotification, 'id' | 'read' | 'createdAt'>) => {
    setNotifications(prev => {
      const next = [{ ...n, id: crypto.randomUUID(), read: false, createdAt: new Date().toISOString() }, ...prev].slice(0, 50);
      localStorage.setItem('gitmind.notifications', JSON.stringify(next));
      return next;
    });
  }, []);
  const markNotificationRead = useCallback((id: string) => {
    setNotifications(prev => {
      const next = prev.map(n => n.id === id ? { ...n, read: true } : n);
      localStorage.setItem('gitmind.notifications', JSON.stringify(next));
      return next;
    });
  }, []);
  const markAllNotificationsRead = useCallback(() => {
    setNotifications(prev => {
      const next = prev.map(n => ({ ...n, read: true }));
      localStorage.setItem('gitmind.notifications', JSON.stringify(next));
      return next;
    });
  }, []);
  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => {
      const next = prev.filter(n => n.id !== id);
      localStorage.setItem('gitmind.notifications', JSON.stringify(next));
      return next;
    });
  }, []);

  const exportAnalysisMarkdown = useCallback(() => {
    if (!repo || !analysis) return;

    const lines: string[] = [];
    lines.push(`# GitMind Pro — ${repo.owner}/${repo.repo}`);
    lines.push('');
    lines.push(`> Generated by [GitMind Pro](https://gitmindpro.com) on ${new Date().toLocaleDateString()}`);
    lines.push('');
    lines.push('## Summary');
    lines.push(analysis.summary || 'N/A');
    lines.push('');
    lines.push('## Tech Stack');
    lines.push((analysis.techStack || []).map(t => `- ${t}`).join('\n') || 'N/A');
    lines.push('');
    lines.push('## Scorecard');
    lines.push(`| Category | Score |`);
    lines.push(`|----------|-------|`);
    lines.push(`| Maintenance | ${analysis.scorecard.maintenance}/10 |`);
    lines.push(`| Documentation | ${analysis.scorecard.documentation}/10 |`);
    lines.push(`| Innovation | ${analysis.scorecard.innovation}/10 |`);
    lines.push(`| Security | ${analysis.scorecard.security}/10 |`);
    lines.push('');

    if (analysis.roadmap?.length) {
      lines.push('## Roadmap');
      analysis.roadmap.slice(0, 10).forEach((item, i) => lines.push(`${i + 1}. ${item}`));
      lines.push('');
    }

    if (analysis.architectureTour?.summary) {
      lines.push('## Architecture');
      lines.push(analysis.architectureTour.summary);
      lines.push('');
    }

    if (analysis.startupPitch) {
      lines.push('## Startup Pitch');
      lines.push(analysis.startupPitch);
      lines.push('');
    }

    if (analysis.aiStrategy) {
      lines.push('## AI Strategy');
      lines.push(analysis.aiStrategy);
      lines.push('');
    }

    lines.push('---');
    lines.push(`![GitMind Score](https://gitmindpro.com/api/badge?owner=${repo.owner}&repo=${repo.repo})`);

    const blob = new Blob([lines.join('\n')], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${repo.owner}_${repo.repo}_gitmind.md`;
    a.click();
    URL.revokeObjectURL(url);
  }, [repo, analysis]);

  // Wave 10: handler to post PR review as a GitHub comment
  const handlePostPRComment = useCallback(async (customToken?: string) => {
    if (!repo || !prReviewResult || !prReviewMeta) return;
    setPrCommentPosting(true);
    setPrCommentError(null);

    // Use provided token, or fall back to the user's GitHub OAuth provider token
    const tokenToUse = customToken || (await getGitHubProviderToken()) || undefined;

    const riskEmoji = prReviewResult.riskLevel === 'high' ? '🔴' : prReviewResult.riskLevel === 'medium' ? '🟡' : '🟢';
    const topFindings = prReviewResult.findings.slice(0, 5);

    const lines: string[] = [
      `## 🔍 GitMind AI Code Review — ${prReviewMeta.title}`,
      '',
      `**Risk Level:** ${riskEmoji} ${prReviewResult.riskLevel.charAt(0).toUpperCase() + prReviewResult.riskLevel.slice(1)}  `,
      `**Files Reviewed:** ${prReviewMeta.fileCount}`,
      '',
      '### Summary',
      prReviewResult.summary,
      '',
    ];

    if (prReviewResult.overallComments.length > 0) {
      lines.push('### Key Points');
      prReviewResult.overallComments.slice(0, 3).forEach(c => lines.push(`- ${c}`));
      lines.push('');
    }

    if (topFindings.length > 0) {
      lines.push('### Top Findings');
      lines.push('| Severity | File | Issue |');
      lines.push('|----------|------|-------|');
      topFindings.forEach(f => {
        const sev = f.severity;
        const sevEmoji = sev === 'high' ? '🟠' : sev === 'medium' ? '🟡' : '🔵';
        lines.push(`| ${sevEmoji} ${sev} | \`${f.file ?? '—'}\` | ${f.title} |`);
      });
      lines.push('');
    }

    lines.push('---');
    lines.push('*Powered by [GitMind Pro](https://gitmindpro.com) — AI-powered code intelligence*');

    try {
      const url = await postPRComment(
        repo.owner,
        repo.repo,
        prReviewMeta.number,
        lines.join('\n'),
        tokenToUse
      );
      setPrCommentUrl(url);
      setPrCommentPosted(true);
      setShowPrTokenInput(false);
      addNotification({ type: 'analysis_complete', title: 'Comment Posted', message: `GitMind review posted to PR #${prReviewMeta.number}` });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      if (msg.includes('write access') || msg.includes('401') || msg.includes('403')) {
        setShowPrTokenInput(true);
      }
      setPrCommentError(msg);
    } finally {
      setPrCommentPosting(false);
    }
  }, [repo, prReviewResult, prReviewMeta, addNotification]);

  // Wave 11: Generate CI workflow from current repo's tech stack
  const handleGenerateCIWorkflow = useCallback(async () => {
    if (!repo || !analysis) return;
    setCiLoading(true);
    setCiWorkflow(null);
    setCiCommitUrl(null);
    setShowCiTokenInput(false);
    try {
      const hasDockerfile = structure.some(f => f.path === 'Dockerfile' || f.path === 'docker-compose.yml');
      const hasTests = structure.some(f =>
        f.path?.includes('test') || f.path?.includes('spec') || f.path?.includes('__tests__')
      );
      const yaml = await generateCIWorkflow({
        repoName: `${repo.owner}/${repo.repo}`,
        techStack: analysis.techStack,
        hasDockerfile,
        hasTests,
        defaultBranch: repo.defaultBranch || 'main',
      });
      setCiWorkflow(yaml);
    } catch (err) {
      addNotification({ type: 'system', title: 'CI Generation Failed', message: err instanceof Error ? err.message : 'Unknown error' });
    } finally {
      setCiLoading(false);
    }
  }, [repo, analysis, structure, addNotification]);

  // Wave 11: Commit generated CI workflow to the repo
  const handleCommitCIWorkflow = useCallback(async (token?: string) => {
    if (!repo || !ciWorkflow) return;
    setCiCommitting(true);
    try {
      const url = await commitFileToRepo(
        repo.owner,
        repo.repo,
        '.github/workflows/ci.yml',
        ciWorkflow,
        'ci: add GitHub Actions CI workflow generated by GitMind Pro',
        token
      );
      setCiCommitUrl(url);
      setShowCiTokenInput(false);
      addNotification({ type: 'analysis_complete', title: 'CI Workflow Committed', message: `.github/workflows/ci.yml added to ${repo.owner}/${repo.repo}` });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      if (msg.includes('write access') || msg.includes('401') || msg.includes('403')) {
        setShowCiTokenInput(true);
      }
      addNotification({ type: 'system', title: 'Commit Failed', message: msg });
    } finally {
      setCiCommitting(false);
    }
  }, [repo, ciWorkflow, addNotification]);

  // Wave 11: Scan dependencies for risks
  const handleScanDependencies = useCallback(async () => {
    if (!repo || !analysis) return;
    setDepLoading(true);
    setDepRisks(null);
    try {
      // Try to fetch package.json — most common manifest
      const manifests = ['package.json', 'requirements.txt', 'Cargo.toml', 'go.mod'];
      let rawContent: string | null = null;
      let foundManifest = '';
      for (const manifest of manifests) {
        if (structure.some(f => f.path === manifest || f.name === manifest)) {
          try {
            rawContent = await fetchFileContent(repo.owner, repo.repo, manifest);
            foundManifest = manifest;
            break;
          } catch { /* try next */ }
        }
      }
      if (!rawContent || foundManifest !== 'package.json') {
        // If no package.json, use AI with tech stack context only
        const risks = await analyzeDependencyRisks({ dependencies: {}, devDependencies: {}, techStack: analysis.techStack });
        setDepRisks(risks);
        return;
      }
      const pkg = JSON.parse(rawContent) as { dependencies?: Record<string, string>; devDependencies?: Record<string, string> };
      const risks = await analyzeDependencyRisks({
        dependencies: pkg.dependencies ?? {},
        devDependencies: pkg.devDependencies ?? {},
        techStack: analysis.techStack,
      });
      setDepRisks(risks);
    } catch (err) {
      addNotification({ type: 'system', title: 'Dep Scan Failed', message: err instanceof Error ? err.message : 'Unknown error' });
    } finally {
      setDepLoading(false);
    }
  }, [repo, analysis, structure, addNotification]);

  // Wave 12: Generate README handler
  const handleGenerateReadme = useCallback(async () => {
    if (!repo || !analysis) return;
    setReadmeLoading(true);
    setGeneratedReadme(null);
    setReadmeCommitUrl(null);
    setReadmeCommitError(null);
    try {
      const hasDockerfile = structure.some(f => f.name === 'Dockerfile' || f.path === 'Dockerfile');
      const badgeUrl = `[![GitMind Score](https://gitmindpro.com/api/badge?owner=${repo.owner}&repo=${repo.repo})](https://gitmindpro.com)`;
      const readme = await generateReadme({
        repoName: repo.repo,
        owner: repo.owner,
        description: repo.description,
        techStack: analysis.techStack,
        summary: analysis.summary,
        roadmap: analysis.roadmap ?? [],
        stars: repo.stars,
        defaultBranch: repo.defaultBranch,
        hasDockerfile,
        badgeUrl,
      });
      setGeneratedReadme(readme);
    } catch (err) {
      addNotification({ type: 'system', title: 'README Generation Failed', message: err instanceof Error ? err.message : 'Unknown error' });
    } finally {
      setReadmeLoading(false);
    }
  }, [repo, analysis, structure, addNotification]);

  // Wave 12: Commit README to repo
  const handleCommitReadme = useCallback(async (token?: string) => {
    if (!repo || !generatedReadme) return;
    setReadmeCommitting(true);
    setReadmeCommitError(null);
    try {
      const url = await commitFileToRepo(
        repo.owner,
        repo.repo,
        'README.md',
        generatedReadme,
        'docs: update README.md via GitMind Pro AI generator',
        token
      );
      setReadmeCommitUrl(url);
      addNotification({ type: 'analysis_complete', title: 'README Committed', message: `README.md committed to ${repo.owner}/${repo.repo}` });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setReadmeCommitError(msg);
    } finally {
      setReadmeCommitting(false);
    }
  }, [repo, generatedReadme, addNotification]);

  // Wave 12: Blame Intelligence handler
  const handleAnalyzeBlame = useCallback(async () => {
    if (!repo || !analysis) return;
    setBlameLoading(true);
    setBlameInsights(null);
    try {
      const [recentCommitsRaw, contributorsRaw] = await Promise.all([
        fetchRecentCommits(repo.owner, repo.repo, 30).catch(() => []),
        fetchContributors(repo.owner, repo.repo).catch(() => []),
      ]);
      const recentCommits = (recentCommitsRaw as { commit?: { author?: { name?: string } }; author?: { login?: string }; files?: { filename: string }[] }[])
        .map(c => ({
          author: c.commit?.author?.name ?? c.author?.login ?? 'Unknown',
          files: (c.files ?? []).map(f => f.filename),
        }));
      const insights = await analyzeBlameIntelligence({
        repoName: `${repo.owner}/${repo.repo}`,
        contributors: (contributorsRaw as { login: string; contributions: number }[]).slice(0, 10),
        recentCommits,
        findings: deepAudit?.vulnerabilities ?? [],
      });
      setBlameInsights(insights);
    } catch (err) {
      addNotification({ type: 'system', title: 'Blame Analysis Failed', message: err instanceof Error ? err.message : 'Unknown error' });
    } finally {
      setBlameLoading(false);
    }
  }, [repo, analysis, deepAudit, addNotification]);

  // Wave 13: AI PR Reviewer
  const handleAIPRReview = useCallback(async () => {
    if (!repo || !analysis) return;
    const prNumberMatch = aiPrUrl.match(/\/pull\/(\d+)/);
    const prNumber = prNumberMatch ? parseInt(prNumberMatch[1], 10) : NaN;
    if (isNaN(prNumber)) {
      addNotification({ type: 'system', title: 'Invalid PR URL', message: 'Paste a full GitHub pull request URL, e.g. https://github.com/owner/repo/pull/42' });
      return;
    }
    setAiPrLoading(true);
    setAiPrResult(null);
    setAiPrPostUrl(null);
    try {
      const files = await fetchPullRequestFiles(repo.owner, repo.repo, prNumber);
      const prs = await fetchPullRequests(repo.owner, repo.repo);
      const pr = prs.find(p => p.number === prNumber);
      const result = await generateAIPRReview({
        prTitle: pr?.title ?? `PR #${prNumber}`,
        prBody: '',
        baseBranch: repo.defaultBranch ?? 'main',
        headBranch: 'feature',
        files: files.map(f => ({
          filename: f.filename,
          status: f.status,
          patch: f.patch,
          additions: f.additions,
          deletions: f.deletions,
        })),
        repoContext: analysis.summary ?? '',
        techStack: analysis.techStack,
      });
      setAiPrResult(result);
      addNotification({ type: 'analysis_complete', title: 'PR Review Ready', message: `Reviewed PR #${prNumber} — ${result.verdict}` });
    } catch (err) {
      addNotification({ type: 'system', title: 'PR Review Failed', message: err instanceof Error ? err.message : 'Unknown error' });
    } finally {
      setAiPrLoading(false);
    }
  }, [repo, analysis, aiPrUrl, addNotification]);

  const handlePostAIPRReview = useCallback(async () => {
    if (!repo || !aiPrResult) return;
    const prNumberMatch = aiPrUrl.match(/\/pull\/(\d+)/);
    const prNumber = prNumberMatch ? parseInt(prNumberMatch[1], 10) : NaN;
    if (isNaN(prNumber)) return;
    setAiPrPosting(true);
    try {
      await postPRComment(repo.owner, repo.repo, prNumber, aiPrResult.reviewBody);
      const url = `https://github.com/${repo.owner}/${repo.repo}/pull/${prNumber}`;
      setAiPrPostUrl(url);
      addNotification({ type: 'analysis_complete', title: 'Review Posted!', message: `Review posted to PR #${prNumber}` });
    } catch (err) {
      addNotification({ type: 'system', title: 'Post Failed', message: err instanceof Error ? err.message : 'Unknown error' });
    } finally {
      setAiPrPosting(false);
    }
  }, [repo, aiPrUrl, aiPrResult, addNotification]);

  // Wave 13: Tech Debt Calculator
  const handleCalculateTechDebt = useCallback(async () => {
    if (!repo || !analysis) return;
    setTechDebtLoading(true);
    setTechDebtReport(null);
    try {
      const report = await calculateTechDebt({
        repoName: `${repo.owner}/${repo.repo}`,
        techStack: analysis.techStack,
        scorecard: {
          overall: analysis.scorecard.security ?? 50,
          security: analysis.scorecard.security ?? 50,
          performance: analysis.scorecard.innovation ?? 50,
          maintainability: analysis.scorecard.maintenance ?? 50,
          testing: analysis.scorecard.documentation ?? 50,
        },
        summary: analysis.summary ?? '',
        fileCount: structure.length,
        contributors: 0,
        openIssues: 0,
        findings: deepAudit?.vulnerabilities ?? [],
        depRisks: (depRisks ?? []).map(d => ({ name: d.name, risk: d.risk, reason: d.reason })),
      });
      setTechDebtReport(report);
      addNotification({ type: 'analysis_complete', title: 'Tech Debt Calculated', message: report.headline });
    } catch (err) {
      addNotification({ type: 'system', title: 'Tech Debt Calc Failed', message: err instanceof Error ? err.message : 'Unknown error' });
    } finally {
      setTechDebtLoading(false);
    }
  }, [repo, analysis, structure, deepAudit, depRisks, addNotification]);

  // Wave 13: CVE Monitor
  const handleScanCVEs = useCallback(async () => {
    if (!repo || !analysis) return;
    setCveLoading(true);
    setCveReport(null);
    try {
      const rawDeps = await analyzeDependencies(repo.owner, repo.repo);
      const deps = (rawDeps as { name: string; version?: string; currentVersion?: string; risk?: string }[]).map(d => ({
        name: d.name,
        version: d.currentVersion ?? d.version ?? 'unknown',
        risk: d.risk,
      }));
      const report = await scanCVEs({
        repoName: `${repo.owner}/${repo.repo}`,
        dependencies: deps,
        techStack: analysis.techStack,
        isProduction: true,
      });
      setCveReport(report);
      const critCount = report.totalCritical;
      addNotification({
        type: critCount > 0 ? 'system' : 'analysis_complete',
        title: critCount > 0 ? `${critCount} Critical CVE${critCount > 1 ? 's' : ''} Found!` : 'CVE Scan Complete',
        message: report.estimatedRiskExposure,
      });
    } catch (err) {
      addNotification({ type: 'system', title: 'CVE Scan Failed', message: err instanceof Error ? err.message : 'Unknown error' });
    } finally {
      setCveLoading(false);
    }
  }, [repo, analysis, addNotification]);



  // Wave 15: Smart Alert evaluation — runs after each new analysis
  const evaluateAlerts = useCallback((repoKey: string, scorecard: { maintenance: number; documentation: number; innovation: number; security: number }, previousScorecard?: { maintenance: number; documentation: number; innovation: number; security: number } | null) => {
    if (scoreAlerts.length === 0) return;
    const avg = (sc: typeof scorecard) => (sc.maintenance + sc.documentation + sc.innovation + sc.security) / 4;
    const getScore = (sc: typeof scorecard, cat: string) => {
      if (cat === 'overall') return avg(sc);
      return sc[cat as keyof typeof sc] ?? avg(sc);
    };

    const triggered: ScoreAlert[] = [];
    for (const alert of scoreAlerts) {
      if (!alert.enabled) continue;
      if (alert.repoPattern !== '*' && alert.repoPattern !== repoKey) continue;
      const current = getScore(scorecard, alert.category);
      if (alert.condition === 'below' && current < alert.threshold) triggered.push(alert);
      else if (alert.condition === 'above' && current > alert.threshold) triggered.push(alert);
      else if (alert.condition === 'drops_by' && previousScorecard) {
        const prev = getScore(previousScorecard, alert.category);
        if (prev - current >= alert.threshold) triggered.push(alert);
      }
    }

    if (triggered.length > 0) {
      const updated = scoreAlerts.map(a => {
        const t = triggered.find(tr => tr.id === a.id);
        return t ? { ...a, lastTriggered: new Date().toISOString() } : a;
      });
      handleSaveAlerts(updated);
      for (const t of triggered) {
        addNotification({
          type: 'system',
          title: `Alert: ${t.category} ${t.condition === 'below' ? 'below' : t.condition === 'above' ? 'above' : 'dropped by'} ${t.threshold}`,
          message: `${repoKey} — ${t.category} score triggered your alert threshold.`,
        });
      }
    }
  }, [scoreAlerts, handleSaveAlerts, addNotification]);

  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Loading tips carousel
  const loadingTips = [
    { icon: "🚀", text: "Pro tip: Click any file in the tree to get an instant AI explanation!" },
    { icon: "🔥", text: "Fun fact: The 'Hot Zones' section shows files changed most in the last 7 days." },
    { icon: "👥", text: "Did you know? GitMind identifies code owners so you know who to ask!" },
    { icon: "💡", text: "Time saver: Check 'Common Tasks' for copy-paste setup commands!" },
    { icon: "🎯", text: "Pro move: Start with the 'Critical Files' section - they're ranked by importance!" },
    { icon: "⚡", text: "Speed tip: Large repos (10k+ files) take 60-80 seconds. Small ones? 30-40 seconds!" },
    { icon: "🧠", text: "Behind the scenes: Our AI reads your entire codebase, not just the README!" },
    { icon: "📊", text: "Fun fact: We analyze your tech stack, dependencies, AND recent commit patterns!" },
    { icon: "🎨", text: "Pro tip: Hover over any box to see interactive animations - we made it extra smooth!" },
    { icon: "🤖", text: "AI magic: Ask the Copilot 'Who built the auth system?' and get instant answers!" },
    { icon: "📚", text: "Did you know? Your onboarding guide is 100% personalized to THIS specific repo!" },
    { icon: "☕", text: "Perfect time for coffee! ☕ AI analysis is worth the wait, promise!" },
    { icon: "🎭", text: "Fun fact: We analyze both the code AND the team dynamics!" },
    { icon: "🔍", text: "Behind the scenes: Scanning for test frameworks, CI/CD configs, and more!" },
    { icon: "💪", text: "Pro tip: After loading, try asking 'What's actively being developed right now?'" }
  ];

  useEffect(() => {
    // Rotate tips every 4 seconds during loading
    if (!loading) return;
    const interval = setInterval(() => {
      setLoadingTip(prev => (prev + 1) % loadingTips.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [loading, loadingTips.length]);

  const addLog = useCallback((message: string, type: TerminalLog['type'] = 'info') => {
    setTerminalLogs(prev => [...prev, { id: Math.random().toString(36), timestamp: Date.now(), type, message }].slice(-50));
  }, []);

  // Wave 15: Generate AI Code Review Checklist
  const handleGenerateChecklist = useCallback(async () => {
    if (!repo || !analysis) return;
    setChecklistLoading(true);
    try {
      const result = await generateReviewChecklist({
        repoName: `${repo.owner}/${repo.repo}`,
        techStack: analysis.techStack,
        scorecard: analysis.scorecard,
        summary: analysis.summary,
        vulnerabilities: deepAudit?.vulnerabilities || [],
      });
      setReviewChecklist(result);
      addLog('AI checklist generated', 'success');
    } catch (err) {
      addLog(`Checklist generation failed: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
    } finally {
      setChecklistLoading(false);
    }
  }, [repo, analysis, deepAudit, addLog]);

  // Wave 16: AI Architecture Diagram handler
  const handleGenerateArchDiagram = useCallback(async () => {
    if (!repo || !analysis) return;
    setArchDiagramLoading(true);
    try {
      const result = await generateArchitectureDiagram({
        repoName: `${repo.owner}/${repo.repo}`,
        techStack: analysis.techStack,
        summary: analysis.summary,
        architectureSummary: analysis.architectureTour?.summary || '',
        topFiles: (onboardingGuide?.criticalFiles || []).concat(
          (onboardingGuide?.recentActivity?.hotFiles || []).map(([f]) => f)
        ).slice(0, 15),
      });
      setArchDiagram(result as ArchitectureDiagramResult);
      addLog('AI architecture diagram generated', 'success');
    } catch (err) {
      addLog(`Architecture diagram failed: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
    } finally {
      setArchDiagramLoading(false);
    }
  }, [repo, analysis, addLog]);

  // Wave 16: Export as Agent-ready JSON
  const exportAnalysisJSON = useCallback(() => {
    if (!repo || !analysis) return;
    const payload = {
      meta: {
        generatedBy: 'GitMindPro',
        generatedAt: new Date().toISOString(),
        repository: `${repo.owner}/${repo.repo}`,
        url: `https://github.com/${repo.owner}/${repo.repo}`,
      },
      summary: analysis.summary,
      techStack: analysis.techStack,
      scorecard: analysis.scorecard,
      roadmap: analysis.roadmap,
      architectureTour: analysis.architectureTour,
      startupPitch: analysis.startupPitch,
      aiStrategy: analysis.aiStrategy,
      criticalFiles: onboardingGuide?.criticalFiles || [],
      hotFiles: onboardingGuide?.recentActivity?.hotFiles?.map(([f]) => f) || [],
      badge: `https://gitmindpro.com/api/badge?owner=${repo.owner}&repo=${repo.repo}`,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${repo.owner}_${repo.repo}_gitmind_agent.json`;
    a.click();
    URL.revokeObjectURL(url);
    addLog('Agent-ready JSON exported', 'success');
  }, [repo, analysis, addLog]);

  // Wave 17: Commit Message Generator handler
  const handleGenerateCommitMessage = useCallback(async (input: string): Promise<GeneratedCommit> => {
    try {
      const result = await generateCommitMessage(input);
      addLog('Commit message generated', 'success');
      return result;
    } catch (err) {
      addLog(`Commit message failed: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
      throw err;
    }
  }, [addLog]);

  // Wave 17: Code Intelligence Extractor handler
  const handleExtractCodeIntelligence = useCallback(async (
    fileName: string, fileContent: string, query: string
  ): Promise<CodeExtraction> => {
    setCodeExtractionLoading(true);
    try {
      const result = await extractCodeIntelligence({ fileName, fileContent, query });
      addLog(`Code extracted: ${result.functionName}`, 'success');
      return result;
    } catch (err) {
      addLog(`Code extraction failed: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
      throw err;
    } finally {
      setCodeExtractionLoading(false);
    }
  }, [addLog]);

  // Wave 18: Changelog Generator handler
  const handleGenerateChangelog = useCallback(async (commits: string, repoName?: string): Promise<GeneratedChangelog> => {
    try {
      const result = await generateChangelog(commits, repoName);
      addLog('Changelog generated', 'success');
      return result;
    } catch (err) {
      addLog(`Changelog failed: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
      throw err;
    }
  }, [addLog]);

  // Wave 18: Onboarding Checklist handler
  const handleGenerateOnboardingChecklist = useCallback(async (): Promise<GeneratedOnboardingChecklist> => {
    if (!analysis || !repo) throw new Error('No analysis available');
    setOnboardingChecklistLoading(true);
    try {
      const result = await generateOnboardingChecklist({
        repoName: `${repo.owner}/${repo.repo}`,
        summary: analysis.summary,
        techStack: analysis.techStack,
        vibeMode,
        learningPath: onboardingGuide?.criticalFiles,
      });
      addLog('Onboarding checklist generated', 'success');
      return result;
    } catch (err) {
      addLog(`Onboarding checklist failed: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
      throw err;
    } finally {
      setOnboardingChecklistLoading(false);
    }
  }, [analysis, repo, vibeMode, onboardingGuide, addLog]);

  // Wave 18: Test Coverage Estimator handler
  const handleEstimateTestCoverage = useCallback(async (): Promise<import('./services/geminiService').TestCoverageData> => {
    if (!analysis || !repo) throw new Error('No analysis available');
    setTestCoverageLoading(true);
    try {
      const allPaths = structure.length > 0
        ? structure.flatMap(function flatPaths(n: FileNode): string[] {
            return n.type === 'blob' ? [n.path] : (n.children || []).flatMap(flatPaths);
          })
        : [];
      const result = await estimateTestCoverage({
        fileTree: allPaths,
        techStack: analysis.techStack,
        repoName: `${repo.owner}/${repo.repo}`,
      });
      addLog(`Test coverage estimated: ~${result.overallEstimate}%`, 'success');
      return result;
    } catch (err) {
      addLog(`Test coverage estimation failed: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
      throw err;
    } finally {
      setTestCoverageLoading(false);
    }
  }, [analysis, repo, structure, addLog]);

  // Wave 18: Agentic Security Scanner handler
  const handleScanAgenticRisks = useCallback(async (): Promise<import('./components/AgenticSecurityScanner').AgenticSecurityScanResult> => {
    if (!analysis || !repo) throw new Error('No analysis available');
    setAgenticScanLoading(true);
    try {
      const allPaths = structure.length > 0
        ? structure.flatMap(function flatPaths(n: FileNode): string[] {
            return n.type === 'blob' ? [n.path] : (n.children || []).flatMap(flatPaths);
          })
        : [];
      const result = await scanAgenticRisks({
        repoName: `${repo.owner}/${repo.repo}`,
        summary: analysis.summary,
        techStack: analysis.techStack,
        fileTree: allPaths,
        securityInsights: deepAudit?.vulnerabilities,
      });
      addLog(`Agentic security scan complete: ${result.findings.length} findings`, 'success');
      return result;
    } catch (err) {
      addLog(`Agentic scan failed: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
      throw err;
    } finally {
      setAgenticScanLoading(false);
    }
  }, [analysis, repo, structure, deepAudit, addLog]);

  // Wave 19: Dependency Intelligence handler
  const handleAnalyzeDependencyIntelligence = useCallback(async (): Promise<DependencyReport> => {
    if (!analysis || !repo) throw new Error('No analysis available');
    setDepIntelLoading(true);
    try {
      const allPaths = structure.flatMap(function flatPaths(n: FileNode): string[] {
        return n.type === 'blob' ? [n.path] : (n.children || []).flatMap(flatPaths);
      });
      const result = await analyzeDependencyIntelligence({
        fileTree: allPaths,
        techStack: analysis.techStack,
        repoName: `${repo.owner}/${repo.repo}`,
      });
      addLog(`Dependency scan: ${result.criticalCount} critical, ${result.outdatedCount} outdated`, 'success');
      return result;
    } catch (err) {
      addLog(`Dependency scan failed: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
      throw err;
    } finally {
      setDepIntelLoading(false);
    }
  }, [analysis, repo, structure, addLog]);

  // Wave 19: Breaking Change Detector handler
  const handleDetectBreakingChanges = useCallback(async (baseBranch: string, headBranch: string): Promise<BreakingChangeReport> => {
    if (!analysis || !repo) throw new Error('No analysis available');
    setBreakingChangeLoading(true);
    try {
      const allPaths = structure.flatMap(function flatPaths(n: FileNode): string[] {
        return n.type === 'blob' ? [n.path] : (n.children || []).flatMap(flatPaths);
      });
      const result = await detectBreakingChanges({
        repoName: `${repo.owner}/${repo.repo}`,
        techStack: analysis.techStack,
        fileTree: allPaths,
        baseBranch,
        headBranch,
        summary: analysis.summary,
      });
      addLog(`Breaking change detection: ${result.totalBreaking} breaking, ${result.totalWarnings} warnings`, 'success');
      return result;
    } catch (err) {
      addLog(`Breaking change detection failed: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
      throw err;
    } finally {
      setBreakingChangeLoading(false);
    }
  }, [analysis, repo, structure, addLog]);

  // Wave 19: PR Merge Predictor handler
  const handlePredictPRMerge = useCallback(async (prIdentifier: string): Promise<PRMergePrediction> => {
    if (!analysis || !repo) throw new Error('No analysis available');
    setPrPredictLoading(true);
    try {
      const result = await predictPRMerge({
        repoName: `${repo.owner}/${repo.repo}`,
        prIdentifier,
        techStack: analysis.techStack,
        summary: analysis.summary,
        recentActivity: onboardingGuide?.recentActivity
          ? { totalCommits: onboardingGuide.recentActivity.totalCommits, activeDevs: onboardingGuide.recentActivity.activeDevs }
          : undefined,
      });
      addLog(`PR merge prediction: ${result.mergeConfidence}% confidence`, 'success');
      return result;
    } catch (err) {
      addLog(`PR prediction failed: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
      throw err;
    } finally {
      setPrPredictLoading(false);
    }
  }, [analysis, repo, onboardingGuide, addLog]);

  // Wave 19: AIBOM Generator handler
  const handleGenerateAIBOM = useCallback(async (): Promise<AIBOMReport> => {
    if (!analysis || !repo) throw new Error('No analysis available');
    setAibomLoading(true);
    try {
      const allPaths = structure.flatMap(function flatPaths(n: FileNode): string[] {
        return n.type === 'blob' ? [n.path] : (n.children || []).flatMap(flatPaths);
      });
      const result = await generateAIBOM({
        repoName: `${repo.owner}/${repo.repo}`,
        techStack: analysis.techStack,
        fileTree: allPaths,
        summary: analysis.summary,
      });
      addLog(`AIBOM generated: trust score ${result.trustScore}/100`, 'success');
      return result;
    } catch (err) {
      addLog(`AIBOM generation failed: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
      throw err;
    } finally {
      setAibomLoading(false);
    }
  }, [analysis, repo, structure, addLog]);

  // Wave 19: Supply Chain Scanner handler
  const handleScanSupplyChain = useCallback(async (): Promise<SupplyChainScanResult> => {
    if (!analysis || !repo) throw new Error('No analysis available');
    setSupplyChainLoading(true);
    try {
      const allPaths = structure.flatMap(function flatPaths(n: FileNode): string[] {
        return n.type === 'blob' ? [n.path] : (n.children || []).flatMap(flatPaths);
      });
      const result = await scanSupplyChain({
        repoName: `${repo.owner}/${repo.repo}`,
        techStack: analysis.techStack,
        fileTree: allPaths,
        summary: analysis.summary,
        securityInsights: deepAudit?.vulnerabilities,
      });
      addLog(`Supply chain scan: ${result.findings.length} ASI04 findings`, 'success');
      return result;
    } catch (err) {
      addLog(`Supply chain scan failed: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
      throw err;
    } finally {
      setSupplyChainLoading(false);
    }
  }, [analysis, repo, structure, deepAudit, addLog]);

  // Wave 20: Dead Code Detector handler
  const handleDetectDeadCode = useCallback(async (): Promise<DeadCodeReport> => {
    if (!analysis || !repo) throw new Error('No analysis available');
    setDeadCodeLoading(true);
    try {
      const allPaths = structure.flatMap(function flatPaths(n: FileNode): string[] {
        return n.type === 'blob' ? [n.path] : (n.children || []).flatMap(flatPaths);
      });
      const result = await detectDeadCode({
        repoName: `${repo.owner}/${repo.repo}`,
        fileTree: allPaths,
        techStack: analysis.techStack,
        summary: analysis.summary,
      });
      addLog(`Dead code scan: ${result.totalItems} items found (${result.estimatedWastePercent}% waste)`, 'success');
      return result;
    } catch (err) {
      addLog(`Dead code scan failed: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
      throw err;
    } finally {
      setDeadCodeLoading(false);
    }
  }, [analysis, repo, structure, addLog]);

  // Wave 20: Invariant Checker handler
  const handleRunInvariantCheck = useCallback(async (): Promise<InvariantCheckResult> => {
    if (!analysis || !repo) throw new Error('No analysis available');
    setInvariantLoading(true);
    try {
      const sections = ['Learning Path', 'Hot Zones', 'Security Insights', 'Code Ownership', 'Architecture', 'Tech Debt'];
      const result = await runInvariantCheck({
        repoName: `${repo.owner}/${repo.repo}`,
        analysisSummary: analysis.summary,
        techStack: analysis.techStack,
        sections,
      });
      addLog(`Invariant check: ${result.status} — ${result.reason.slice(0, 60)}`, result.status === 'PASS' ? 'success' : 'error');
      return result;
    } catch (err) {
      addLog(`Invariant check failed: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
      throw err;
    } finally {
      setInvariantLoading(false);
    }
  }, [analysis, repo, addLog]);

  // Wave 20: Refactoring Advisor handler
  const handleGenerateRefactoringPlan = useCallback(async (): Promise<RefactoringPlan> => {
    if (!analysis || !repo) throw new Error('No analysis available');
    setRefactorLoading(true);
    try {
      const allPaths = structure.flatMap(function flatPaths(n: FileNode): string[] {
        return n.type === 'blob' ? [n.path] : (n.children || []).flatMap(flatPaths);
      });
      const result = await generateRefactoringPlan({
        repoName: `${repo.owner}/${repo.repo}`,
        fileTree: allPaths,
        techStack: analysis.techStack,
        summary: analysis.summary,
      });
      addLog(`Refactoring plan: ${result.items.length} opportunities, ${result.totalEstimatedHours}h total`, 'success');
      return result;
    } catch (err) {
      addLog(`Refactoring plan failed: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
      throw err;
    } finally {
      setRefactorLoading(false);
    }
  }, [analysis, repo, structure, addLog]);

  // Wave 20: Section Confidence Scores handler
  const handleGenerateSectionConfidence = useCallback(async (): Promise<void> => {
    if (!analysis || !repo) return;
    setSectionConfLoading(true);
    try {
      const result = await generateSectionConfidence({
        repoName: `${repo.owner}/${repo.repo}`,
        techStack: analysis.techStack,
        summary: analysis.summary,
        fileCount: structure.length,
        hasContributors: true,
        hasIssues: true,
        hasReadme: true,
      });
      setSectionConfReport(result);
      addLog(`Section confidence: ${result.overallConfidence}% overall`, 'success');
    } catch (err) {
      addLog(`Section confidence failed: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
    } finally {
      setSectionConfLoading(false);
    }
  }, [analysis, repo, structure, addLog]);

  // Wave 21: Performance Intelligence handler
  const handleAnalyzePerformance = useCallback(async (): Promise<PerformanceReport> => {
    if (!analysis || !repo) throw new Error('No analysis available');
    setPerformanceLoading(true);
    try {
      const fileTreeStr = structure.slice(0, 150).map((n) => n.path).join('\n');
      const result = await analyzePerformance({
        repoName: `${repo.owner}/${repo.repo}`,
        fileTree: fileTreeStr,
        techStack: analysis.techStack,
        summary: analysis.summary,
      });
      addLog(`Performance grade: ${result.overallGrade} (bundle ${result.bundleRiskScore}, CWV ${result.cwvScore})`, 'success');
      return result;
    } catch (err) {
      addLog(`Performance analysis failed: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
      throw err;
    } finally {
      setPerformanceLoading(false);
    }
  }, [analysis, repo, structure, addLog]);

  const handleGetFix = useCallback(async (findingKey: string, params: {
    file: string; title: string; rationale: string; recommendation: string;
  }) => {
    setFixSnippets(prev => ({ ...prev, [findingKey]: 'loading' }));
    try {
      const repoId = repo ? `${repo.owner}/${repo.repo}` : 'unknown';
      const patchData = prReviewFiles.find(f => f.filename === params.file)?.patch;
      const result = await generateFixSnippet({
        repository: repoId,
        file: params.file,
        title: params.title,
        rationale: params.rationale,
        recommendation: params.recommendation,
        patch: patchData,
      });
      setFixSnippets(prev => ({ ...prev, [findingKey]: result }));
    } catch {
      setFixSnippets(prev => {
        const next = { ...prev };
        delete next[findingKey];
        return next;
      });
      addLog('Could not generate fix snippet', 'error');
    }
  }, [repo, prReviewFiles, addLog]);

  const handleShareAnalysis = useCallback(async () => {
    if (!lastAnalysisId) {
      addLog('No analysis saved yet to share', 'warning');
      return;
    }
    try {
      if (isShared) {
        await toggleAnalysisPublic(lastAnalysisId, false);
        setIsShared(false);
        addLog('Analysis link disabled', 'info');
      } else {
        const token = await toggleAnalysisPublic(lastAnalysisId, true);
        setIsShared(true);
        if (token) {
          setLastShareToken(token);
          const shareUrl = `${window.location.origin}/share/${token}`;
          if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(shareUrl);
          }
          addLog(`Share link copied: ${shareUrl}`, 'success');
        }
      }
    } catch (err) {
      addLog(`Share failed: ${getErrorText(err)}`, 'error');
    }
  }, [lastAnalysisId, isShared, addLog]);



  const toggleFavorite = useCallback((repoUrl: string) => {
    setFavorites(prev => {
      const next = prev.includes(repoUrl) ? prev.filter(u => u !== repoUrl) : [...prev, repoUrl];
      localStorage.setItem('gitmind.favorites', JSON.stringify(next));
      return next;
    });
  }, []);

  /** Rehydrate a saved analysis from DB without re-running Gemini. */
  const handleRehydrate = useCallback(async (analysisId: string) => {
    addLog('Loading saved analysis...', 'info');
    setLoading(true);
    setLoadingProgress(10);
    setLoadingStage('Loading saved analysis from database...');

    try {
      const saved = await getAnalysisRaw(analysisId);
      if (!saved) {
        addLog('Saved analysis not found — running fresh analysis', 'error');
        setLoading(false);
        return false;
      }

      setLoadingProgress(40);
      setLoadingStage('Fetching latest repo metadata...');

      const parsed = parseGithubUrl(saved.repoUrl);
      if (!parsed) {
        addLog('Invalid repo URL in saved analysis', 'error');
        setLoading(false);
        return false;
      }

      const details = await fetchRepoDetails(parsed.owner, parsed.repo);
      setLoadingProgress(70);
      setLoadingStage('Loading file structure...');

      const tree = await fetchRepoStructure(parsed.owner, parsed.repo, details.defaultBranch, fastMode ? { maxEntries: maxTreeEntries } : undefined);
      setLoadingProgress(90);

      setRepo(details);
      setStructure(tree);
      setAnalysis(saved.rawAnalysis);
      setLastAnalysisId(analysisId);
      setIsShared(false);
      setUrl(saved.repoUrl);
      setActiveTab('intelligence');

      setLoadingProgress(100);
      setLoadingStage('Complete!');
      addLog('✅ Analysis loaded from history (no re-analysis needed)', 'success');
      addNotification({ type: 'analysis_complete', title: 'Analysis Loaded', message: `${parsed.owner}/${parsed.repo} — loaded from history` });

      setTimeout(() => {
        setLoading(false);
        setLoadingProgress(0);
      }, 400);

      return true;
    } catch (err) {
      addLog(`Failed to load saved analysis: ${getErrorText(err)}`, 'error');
      setLoading(false);
      return false;
    }
  }, [addLog, fastMode, maxTreeEntries]);

  const loadUserWorkspaces = useCallback(async (user: User) => {
    setWorkspaceLoading(true);
    try {
      await ensurePersonalWorkspace(user);
      const nextWorkspaces = await listUserWorkspaces(user.id);
      setWorkspaces(nextWorkspaces);

      const savedWorkspaceId = window.localStorage.getItem(ACTIVE_WORKSPACE_KEY);
      const defaultWorkspaceId = nextWorkspaces.find((w) => w.isPersonal)?.id || nextWorkspaces[0]?.id || '';
      const workspaceId = savedWorkspaceId && nextWorkspaces.some((w) => w.id === savedWorkspaceId)
        ? savedWorkspaceId
        : defaultWorkspaceId;

      setActiveWorkspaceId(workspaceId);
      if (workspaceId) {
        window.localStorage.setItem(ACTIVE_WORKSPACE_KEY, workspaceId);
      } else {
        window.localStorage.removeItem(ACTIVE_WORKSPACE_KEY);
      }
    } catch (err) {
      addLog(`Workspace setup failed: ${getErrorText(err)}`, 'error');
    } finally {
      setWorkspaceLoading(false);
    }
  }, [addLog]);

  const loadAnalysisHistory = useCallback(async (userId: string, orgId?: string) => {
    setHistoryLoading(true);
    try {
      const history = await getAnalysisHistory({ userId, organizationId: orgId || null });
      setAnalysisHistory(history);
    } catch (err) {
      addLog(`History load failed: ${getErrorText(err)}`, 'error');
    } finally {
      setHistoryLoading(false);
    }
  }, [addLog]);

  const loadPRReviewHistory = useCallback(async (userId: string, orgId?: string) => {
    setPrHistoryLoading(true);
    try {
      const history = await getPRReviewHistory({ userId, organizationId: orgId || null });
      setPrReviewHistory(history);
    } catch (err) {
      addLog(`PR review history load failed: ${getErrorText(err)}`, 'error');
    } finally {
      setPrHistoryLoading(false);
    }
  }, [addLog]);

  useEffect(() => {
    if (authUser && activeWorkspaceId) {
      void loadAnalysisHistory(authUser.id, activeWorkspaceId);
      void loadPRReviewHistory(authUser.id, activeWorkspaceId);
    }
  }, [authUser, activeWorkspaceId, loadAnalysisHistory, loadPRReviewHistory]);

  useEffect(() => {
    if (!authEnabled) {
      setAuthLoading(false);
      return;
    }

    let isDisposed = false;
    const init = async () => {
      try {
        const user = await getCurrentUser();
        if (isDisposed) return;
        setAuthUser(user);
        if (user) {
          await ensureUserProfile(user).catch((err) => {
            addLog(`Profile sync warning: ${getErrorText(err)}`, 'error');
          });
          await loadUserWorkspaces(user);
          // Load subscription status
          const sub = await getSubscriptionStatus(user.id).catch(() => ({ plan: 'free' as const, status: 'none' as const, currentPeriodEnd: null, isActive: false }));
          setSubscription(sub);
          // Load daily usage
          const effectiveLimit = getEffectiveDailyLimit(sub);
          const usage = await canAnalyzeToday(user.id, effectiveLimit).catch(() => ({ usedToday: 0, limit: effectiveLimit, allowed: true }));
          setDailyUsage({ used: usage.usedToday, limit: usage.limit });
          // Load referral code & stats
          const refCode = await getOrCreateReferralCode(user.id).catch(() => null);
          setReferralCode(refCode);
          const refStats = await getReferralStats(user.id).catch(() => ({ count: 0, daysEarned: 0 }));
          setReferralStats(refStats);
          // Load watched repos
          const watched = await getWatchedRepos(user.id).catch(() => []);
          setWatchedRepos(new Set(watched.map(w => `${w.repo_owner}/${w.repo_name}`)));
        }
      } catch (err) {
        addLog(`Auth session init failed: ${getErrorText(err)}`, 'error');
      } finally {
        if (!isDisposed) {
          setAuthLoading(false);
        }
      }
    };

    void init();

    const unsubscribe = onAuthStateChange((user) => {
      setAuthUser(user);
      if (user) {
        setSentryUser(user.id, user.email ?? undefined);
        void (async () => {
          await ensureUserProfile(user).catch((err) => {
            addLog(`Profile sync warning: ${getErrorText(err)}`, 'error');
          });
          // Wave 22: trigger welcome email drip for brand-new signups (account < 60s old)
          if (user.created_at) {
            const ageMs = Date.now() - new Date(user.created_at).getTime();
            if (ageMs < 60_000) {
              fetch('/api/email-drip', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, email: user.email, name: user.user_metadata?.full_name || user.user_metadata?.name || user.email, event: 'signup' }),
              }).catch(() => {});
            }
          }
          await loadUserWorkspaces(user);
          // Load subscription status
          const sub = await getSubscriptionStatus(user.id).catch(() => subscription);
          setSubscription(sub);
        })();
      } else {
        clearSentryUser();
        setWorkspaces([]);
        setActiveWorkspaceId('');
        window.localStorage.removeItem(ACTIVE_WORKSPACE_KEY);
      }
    });

    return () => {
      isDisposed = true;
      unsubscribe();
    };
  }, [authEnabled, addLog, loadUserWorkspaces]);

  // Auto-show changelog for returning users who haven't seen this version
  useEffect(() => {
    const lastSeen = localStorage.getItem('gitmind.changelogVersion');
    if (lastSeen && lastSeen !== CHANGELOG_VERSION) {
      setShowChangelog(true);
    }
    localStorage.setItem('gitmind.changelogVersion', CHANGELOG_VERSION);
  }, []);

  // Cmd+K command palette shortcut + ? for shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCmdPaletteOpen(prev => !prev);
        setCmdQuery('');
      }
      if (e.key === 'Escape') {
        setCmdPaletteOpen(false);
        setShowShortcuts(false);
      }
      // ? key opens shortcuts (only when not typing in an input)
      if (e.key === '?' && !cmdPaletteOpen && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement) && !(e.target instanceof HTMLSelectElement)) {
        setShowShortcuts(prev => !prev);
      }
      // / key focuses search bar
      if (e.key === '/' && !cmdPaletteOpen && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement) && !(e.target instanceof HTMLSelectElement)) {
        e.preventDefault();
        document.querySelector<HTMLInputElement>('input[placeholder]')?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [cmdPaletteOpen]);

  useEffect(() => {
    if (cmdPaletteOpen && cmdInputRef.current) {
      cmdInputRef.current.focus();
    }
  }, [cmdPaletteOpen]);

  // Handle Stripe checkout return
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const checkoutStatus = params.get('checkout');
    if (checkoutStatus === 'success') {
      clearSubscriptionCache();
      if (authUser) {
        void getSubscriptionStatus(authUser.id).then((sub) => {
          setSubscription(sub);
          const planName = sub.plan === 'team' ? 'Team' : 'Pro';
          const isTrial = sub.status === 'trialing';
          addLog(isTrial ? `🎉 ${planName} trial started! 7 days free.` : `🎉 Subscription activated! Welcome to ${planName}.`, 'success');
          setCheckoutBanner({ type: 'success', plan: planName, trial: isTrial });
          addNotification({ type: 'system', title: isTrial ? `${planName} Trial Started` : `${planName} Activated`, message: isTrial ? '7 days free — enjoy unlimited analyses!' : 'Your subscription is active. Enjoy unlimited analyses!' });
        });
      } else {
        addLog('🎉 Subscription activated!', 'success');
        setCheckoutBanner({ type: 'success' });
        addNotification({ type: 'system', title: 'Subscription Activated', message: 'Your subscription is active. Enjoy unlimited analyses!' });
      }
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
    } else if (checkoutStatus === 'canceled') {
      addLog('Checkout canceled — no charges were made.', 'info');
      setCheckoutBanner({ type: 'canceled' });
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [authUser, addLog]);

  // Handle GitHub App installation callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('github_app_installed') === '1') {
      const action = params.get('setup_action') || 'install';
      if (action === 'install') {
        addLog('GitHub App installed successfully!', 'success');
        addNotification({ type: 'system', title: 'GitHub App Installed', message: 'GitMind Pro now has enhanced access to your repositories.' });
      }
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [addLog]);

  // Auto-dismiss checkout banner
  useEffect(() => {
    if (!checkoutBanner) return;
    const timer = setTimeout(() => setCheckoutBanner(null), 8000);
    return () => clearTimeout(timer);
  }, [checkoutBanner]);

  const handleCreateWorkspace = async () => {
    if (!authUser) {
      addLog('Sign in first to create a workspace', 'warning');
      return;
    }

    if (!canCreateTeamWorkspace(subscription)) {
      addLog('Team workspaces require a Team plan ($49/mo)', 'warning');
      setShowPricing(true);
      return;
    }

    const workspaceName = window.prompt('Workspace name');
    if (!workspaceName) return;

    setWorkspaceLoading(true);
    try {
      const createdWorkspace = await createWorkspace(authUser, workspaceName);
      setWorkspaces((prev) => [...prev, createdWorkspace]);
      setActiveWorkspaceId(createdWorkspace.id);
      window.localStorage.setItem(ACTIVE_WORKSPACE_KEY, createdWorkspace.id);
      addLog(`Workspace created: ${createdWorkspace.name}`, 'success');
    } catch (err) {
      const message = getErrorText(err);
      addLog(`Failed to create workspace: ${message}`, 'error');
      showToast('error', 'Workspace creation failed', message);
    } finally {
      setWorkspaceLoading(false);
    }
  };

  const handleSignIn = async () => {
    if (!authEnabled) {
      showToast('warning', 'Auth not configured', 'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable sign-in.');
      return;
    }

    setAuthBusy(true);
    try {
      await signInWithGitHub();
    } catch (err) {
      const message = getErrorText(err);
      addLog(`Sign-in failed: ${message}`, 'error');
      showToast('error', 'Sign-in failed', message);
    } finally {
      setAuthBusy(false);
    }
  };

  const handleSignOut = async () => {
    setAuthBusy(true);
    try {
      await signOutAuth();
      clearSubscriptionCache();
      setSubscription({ plan: 'free', status: 'none', currentPeriodEnd: null, isActive: false });
      addLog('Signed out successfully', 'success');
    } catch (err) {
      addLog(`Sign-out failed: ${getErrorText(err)}`, 'error');
    } finally {
      setAuthBusy(false);
    }
  };

  useEffect(() => {
    if (!analysis) return;

    const rawNodes = Array.isArray(analysis.flowNodes) ? analysis.flowNodes : [];
    const normalizedNodes = rawNodes.map((node, index) => {
      const safeId = node?.id || `node-${index + 1}`;
      const safeLabel = node?.data?.label || safeId;
      const safePosition = node?.position || {
        x: (index % 4) * 220,
        y: Math.floor(index / 4) * 160
      };

      return {
        id: safeId,
        data: { label: safeLabel },
        position: safePosition,
        type: node?.type
      };
    });

    const fallbackNodes = normalizedNodes.length
      ? normalizedNodes
      : buildFallbackBlueprint(structure);
    const nodeIds = new Set(fallbackNodes.map((node) => node.id));

    const rawEdges = Array.isArray(analysis.flowEdges) ? analysis.flowEdges : [];
    const normalizedEdges = rawEdges
      .filter((edge) => edge?.source && edge?.target && nodeIds.has(edge.source) && nodeIds.has(edge.target))
      .map((edge, index) => ({
        id: edge.id || `edge-${index + 1}`,
        source: edge.source,
        target: edge.target,
        label: edge.label,
        animated: edge.animated
      }));

    setNodes(fallbackNodes);
    setEdges(normalizedEdges);
    setTourStepIndex(0);
    setTourAutoPlay(true);
    setTourHasAutoPlayed(false);
  }, [analysis, structure, setNodes, setEdges]);

  const getTourSteps = useCallback(() => {
    if (analysis?.architectureTour?.steps?.length) {
      return analysis.architectureTour.steps;
    }
    return nodes.slice(0, 6).map((node, index) => ({
      nodeId: node.id,
      title: node.data?.label || `Step ${index + 1}`,
      bullets: ['Explore the responsibilities here.', 'Trace how it connects to the rest of the system.']
    }));
  }, [analysis, nodes]);

  const tourSteps = getTourSteps();
  const activeTourStep = tourSteps[tourStepIndex];

  useEffect(() => {
    if (activeTab !== 'blueprint') return;
    if (!tourSteps.length) return;
    if (!tourAutoPlay || tourHasAutoPlayed) return;

    const interval = setInterval(() => {
      setTourStepIndex((prev) => {
        const next = prev + 1;
        if (next >= tourSteps.length) {
          setTourHasAutoPlayed(true);
          setTourAutoPlay(false);
          return prev;
        }
        return next;
      });
    }, 4500);

    return () => clearInterval(interval);
  }, [activeTab, tourAutoPlay, tourHasAutoPlayed, tourSteps.length]);

  const handleTourStepChange = (index: number) => {
    setTourAutoPlay(false);
    setTourStepIndex(Math.max(0, Math.min(index, tourSteps.length - 1)));
  };

  const handleAutoLayout = () => {
    if (!nodes.length) return;
    const columns = Math.ceil(Math.sqrt(nodes.length));
    const spacingX = 220;
    const spacingY = 160;
    setNodes((current) =>
      current.map((node, index) => ({
        ...node,
        position: {
          x: (index % columns) * spacingX,
          y: Math.floor(index / columns) * spacingY
        }
      }))
    );
    addLog('Auto-layout applied to architecture graph', 'success');
  };

  const handleFileSelect = useCallback(async (node: FileNode) => {
    if (node.type === 'tree') return;
    setSelectedFile(node);
    setFileLoading(true);
    setFileExplanation(null);
    setLabResult(null);
    addLog(`Accessing file: ${node.path}`, 'info');
    
    // Add helpful context tip in Command Center
    const contextTip = `📄 You selected **${node.name}**\n\nQuick tips:\n• Check the file preview on the right\n• Ask me: "What does this file do?"\n• Ask me: "Who last modified this?"\n• Ask me: "How does this fit in the architecture?"`;
    
    setChatHistory(prev => [...prev, {
      role: 'model',
      text: contextTip,
      timestamp: Date.now()
    }]);
    
    try {
      if (!repo) return;
      const content = await fetchFileContent(repo.owner, repo.repo, node.path);
      setFileContent(content);
      const explanation = await explainCode(node.name, content);
      setFileExplanation(explanation);
      addLog(`File analysis synthesized for ${node.name}`, 'ai');
    } catch (err) {
      addLog(`Failed to fetch/analyze file: ${getErrorText(err)}`, 'error');
    } finally {
      setFileLoading(false);
    }
  }, [repo, addLog]);

  const openFileByPath = useCallback((path: string) => {
    const node = findNodeByPath(structure, path);
    if (!node) {
      addLog(`File not found in tree: ${path}`, 'error');
      return;
    }
    void handleFileSelect(node);
  }, [structure, handleFileSelect, addLog]);

  const copyToClipboard = useCallback(async (text: string, label: string) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      addLog(`Copied ${label} to clipboard`, 'success');
    } catch (err) {
      addLog(`Copy failed: ${err}`, 'error');
    }
  }, [addLog]);

  const handleInviteMember = async () => {
    if (!authUser) {
      addLog('Sign in first to invite members', 'warning');
      return;
    }

    const activeWorkspace = workspaces.find((workspace) => workspace.id === activeWorkspaceId);
    if (!activeWorkspace) {
      addLog('Select a workspace first', 'warning');
      return;
    }

    if (activeWorkspace.isPersonal) {
      addLog('Create a shared workspace before inviting members', 'warning');
      return;
    }

    if (!['owner', 'admin'].includes(activeWorkspace.role)) {
      addLog('Only owners and admins can invite members', 'warning');
      return;
    }

    const invitedEmail = window.prompt('Invite teammate email');
    if (!invitedEmail) return;

    const roleInput = window.prompt('Role for this invite: member or admin', 'member');
    const role = roleInput?.toLowerCase() === 'admin' ? 'admin' : 'member';

    setWorkspaceLoading(true);
    try {
      const invite = await createWorkspaceInvitation({
        organizationId: activeWorkspace.id,
        invitedEmail,
        role,
        createdBy: authUser.id
      });

      const inviteMessage = [
        `GitMindPro workspace invite`,
        `Workspace: ${activeWorkspace.name}`,
        `Role: ${invite.role}`,
        `Invite code: ${invite.token}`,
        `Expires: ${new Date(invite.expiresAt).toLocaleString()}`
      ].join('\n');

      await copyToClipboard(inviteMessage, 'workspace invite');
      showToast('success', 'Invite created', `Invite for ${invite.invitedEmail} copied to clipboard.`);
      addLog(`Invite created for ${invite.invitedEmail}`, 'success');
    } catch (err) {
      const message = getErrorText(err);
      addLog(`Failed to create invite: ${message}`, 'error');
      showToast('error', 'Invite creation failed', message);
    } finally {
      setWorkspaceLoading(false);
    }
  };

  const handleJoinWorkspace = async () => {
    if (!authUser) {
      addLog('Sign in first to join a workspace', 'warning');
      return;
    }

    const inviteCode = window.prompt('Paste workspace invite code');
    if (!inviteCode) return;

    setWorkspaceLoading(true);
    try {
      const organizationId = await acceptWorkspaceInvitation(authUser, inviteCode);
      await loadUserWorkspaces(authUser);
      setActiveWorkspaceId(organizationId);
      window.localStorage.setItem(ACTIVE_WORKSPACE_KEY, organizationId);
      addLog('Joined workspace successfully', 'success');
      showToast('success', 'Workspace joined', 'You are now a member of the workspace.');
    } catch (err) {
      const message = getErrorText(err);
      addLog(`Failed to join workspace: ${message}`, 'error');
      showToast('error', 'Join failed', message);
    } finally {
      setWorkspaceLoading(false);
    }
  };

  const handleViewMembers = async () => {
    const activeWorkspace = workspaces.find((workspace) => workspace.id === activeWorkspaceId);
    if (!activeWorkspace) {
      addLog('Select a workspace first', 'warning');
      return;
    }

    setWorkspaceLoading(true);
    try {
      const members = await listWorkspaceMembers(activeWorkspace.id);
      const lines = members.map((member) => {
        const name = member.githubLogin ? `@${member.githubLogin}` : (member.fullName || member.email || member.id);
        return `${member.role.toUpperCase()} — ${name}`;
      });
      showToast('info', `${activeWorkspace.name} (${members.length} members)`, lines.join(', ') || 'No members found.');
      addLog(`Loaded ${members.length} workspace members`, 'success');
    } catch (err) {
      const message = getErrorText(err);
      addLog(`Failed to load members: ${message}`, 'error');
      showToast('error', 'Could not load members', message);
    } finally {
      setWorkspaceLoading(false);
    }
  };

  // Wave 14: Load interactive demo with pre-baked facebook/react data
  const handleLoadDemo = useCallback(() => {
    setDemoMode(true);
    setRepo(DEMO_REPO);
    setStructure(DEMO_STRUCTURE);
    setAnalysis(DEMO_ANALYSIS);
    setDeepAudit(DEMO_DEEP_AUDIT);
    setOnboardingGuide(DEMO_ONBOARDING);
    setInsights(DEMO_INSIGHTS);
    setBlameInsights(DEMO_BLAME_INSIGHTS);
    setTechDebtReport(DEMO_TECH_DEBT);
    setCveReport(DEMO_CVE_REPORT);
    setActiveTab('intelligence');
    addLog('🎮 Demo mode loaded — exploring facebook/react', 'success');
    addNotification({ type: 'analysis_complete', title: 'Demo Loaded', message: 'Exploring facebook/react — try all tabs!' });
  }, [addLog, addNotification]);

  const handleExitDemo = useCallback(() => {
    setDemoMode(false);
    setRepo(null);
    setStructure([]);
    setAnalysis(null);
    setDeepAudit(null);
    setOnboardingGuide(null);
    setInsights(null);
    setBlameInsights(null);
    setTechDebtReport(null);
    setCveReport(null);
    addLog('Exited demo mode', 'info');
  }, [addLog]);

  const handleImport = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // Exit demo mode if active
    if (demoMode) {
      setDemoMode(false);
    }

    // Check free tier for non-authenticated users
    if (!authUser && !canUseFreeTier()) {
      addLog('Free analyses limit reached (3/3). Sign in to continue.', 'error');
      setShowSignupPrompt(true);
      return;
    }

    if (authEnabled) {
      if (authLoading) {
        addLog('Auth session is still loading. Continuing in guest mode for this run.', 'info');
      } else if (!authUser) {
        addLog('No signed-in user detected. Continuing in guest mode (results will not be saved).', 'info');
      } else {
        try {
          const usage = await canAnalyzeToday(authUser.id, freeDailyAnalysisLimit);
          if (!usage.allowed) {
            addLog(`Daily analysis limit reached (${usage.usedToday}/${usage.limit})`, 'error');
            if (!subscription.isActive) {
              setShowPricing(true);
            }
            showToast('error', `Daily limit reached (${usage.usedToday}/${usage.limit})`, subscription.isActive ? 'Please try again tomorrow.' : 'Upgrade to Pro for unlimited analyses.');
            return;
          }
          addLog(`Daily usage: ${usage.usedToday}/${usage.limit} analyses used`, 'info');
          setDailyUsage({ used: usage.usedToday, limit: usage.limit });
        } catch (err) {
          addLog(`Usage check failed (${getErrorText(err)}). Continuing without quota enforcement.`, 'error');
        }
      }
    }

    const parsed = parseGithubUrl(url);
    if (!parsed) { addLog('Invalid GitHub URL', 'error'); return; }

    setLoading(true); 
    setLoadingProgress(0);
    setLoadingStage('Connecting to GitHub...');
    setRepo(null); 
    setAnalysis(null); 
    setOnboardingGuide(null);
    // Wave 11: reset DevOps tab state on new analysis
    setCiWorkflow(null);
    setCiCommitUrl(null);
    setShowCiTokenInput(false);
    setDepRisks(null);
    // Wave 12: reset README & Blame Intelligence state
    setGeneratedReadme(null);
    setReadmeCommitUrl(null);
    setReadmeCommitError(null);
    setBlameInsights(null);
    // Wave 13: reset PR Reviewer, Tech Debt, CVE state
    setAiPrResult(null);
    setAiPrPostUrl(null);
    setTechDebtReport(null);
    setCveReport(null);
    // Wave 15: reset checklist state
    setReviewChecklist(null);
    // Wave 16: reset architecture diagram state
    setArchDiagram(null);
    addLog(`Fetching repository...`, 'info');
    
    try {
      // PHASE 1: Get basic repo info (15% progress)
      setLoadingStage('Fetching repository details...');
      const details = await fetchRepoDetails(parsed.owner, parsed.repo);
      setLoadingProgress(15);

      // Start independent fetches in parallel to reduce total wait time.
      setLoadingStage('Loading file structure...');
      const readmePromise = fetchFileContent(parsed.owner, parsed.repo, 'README.md')
        .then((content) => {
          addLog('README loaded', 'info');
          return content;
        })
        .catch(() => {
          addLog('No README found', 'info');
          return '';
        });
      const recentCommitsPromise = fetchRecentCommits(parsed.owner, parsed.repo, 7).catch(() => []);
      const contributorsPromise = fetchCodeOwnership(parsed.owner, parsed.repo).catch(() => []);

      const tree = await fetchRepoStructure(
        parsed.owner,
        parsed.repo,
        details.defaultBranch,
        fastMode ? { maxEntries: maxTreeEntries } : undefined
      );
      // Show the repo tree while AI analysis is in progress
      setRepo(details);
      setStructure(tree);
      setLoadingProgress(30);

      // PHASE 2: Get README (40% progress)
      setLoadingStage('Reading documentation...');
      const readme = await readmePromise;
      setLoadingProgress(40);

      // PHASE 3: AI analysis (40% -> 70%)
      setLoadingStage('🧠 AI analyzing architecture...');
      addLog('AI analyzing codebase (this takes 30-60 sec)...', 'ai');
      
      addLog('🔍 Starting AI analysis...', 'ai');
      const res = await analyzeRepository(JSON.stringify(details), JSON.stringify(tree.slice(0, 40)), readme)
        .catch(err => {
          const message = getErrorText(err);
          if (message.includes('timeout') || message.includes('timed out')) {
            addLog('⏰ Analysis timed out - this repo might be very large or complex', 'warning');
            addLog('💡 Try again or analyze a smaller/focused repository', 'info');
            throw new Error('Analysis timed out. This repository might be too large or complex. Try a smaller repository or wait a moment and try again.');
          } else {
            addLog(`❌ AI Analysis failed: ${message}`, 'error');
            addLog(`AI analysis error: ${message}`, 'error');
            throw new Error(`AI analysis failed: ${message}`);
          }
        });
      
      addLog('✅ AI analysis completed', 'success');
      setAnalysis(res);
      addNotification({ type: 'analysis_complete', title: 'Analysis Complete', message: `${parsed.owner}/${parsed.repo} — AI analysis finished successfully` });

      // Wave 10: Save pinned insight from lowest-scoring scorecard category
      if (res.scorecard) {
        const sc = res.scorecard;
        const categories = [
          { name: 'Security', score: sc.security, rationale: 'Security score is the most critical category for production readiness.' },
          { name: 'Maintenance', score: sc.maintenance, rationale: 'Maintainability affects long-term velocity and developer experience.' },
          { name: 'Documentation', score: sc.documentation, rationale: 'Documentation quality directly impacts onboarding and team productivity.' },
          { name: 'Innovation', score: sc.innovation, rationale: 'Innovation score reflects adoption of modern best practices and tooling.' },
        ];
        const lowest = categories.sort((a, b) => a.score - b.score)[0];
        savePinnedInsight({
          repoFullName: `${parsed.owner}/${parsed.repo}`,
          title: `${lowest.name} needs attention (${lowest.score}/10)`,
          rationale: lowest.rationale,
          severity: lowest.score <= 3 ? 'critical' : lowest.score <= 5 ? 'high' : lowest.score <= 7 ? 'medium' : 'low',
          savedAt: new Date().toISOString(),
        });
      }

      // Wave 10: Trigger What's Next panel
      setTimeout(() => setShowWhatsNext(true), 700);

      // Wave 15: Evaluate smart alerts on new analysis
      if (res.scorecard) {
        const prevAnalysis = analysisHistory.find(a => a.repoOwner === parsed.owner && a.repoName === parsed.repo && a.scorecard);
        evaluateAlerts(`${parsed.owner}/${parsed.repo}`, res.scorecard, prevAnalysis?.scorecard);
      }
      
      // Increment free tier counter for non-authenticated users
      if (!authUser) {
        const newStatus = incrementFreeTierCount();
        setFreeTierStatus(newStatus);
        addLog(`Free analyses used: ${newStatus.used}/${newStatus.limit}`, 'info');
        
        // Show signup prompt if they've used all free analyses
        if (newStatus.used >= newStatus.limit) {
          setShowSignupPrompt(true);
        }
      } else {
        // Update daily usage for authenticated users
        setDailyUsage(prev => prev ? { ...prev, used: prev.used + 1 } : { used: 1, limit: freeDailyAnalysisLimit });
      }
      
      if (authEnabled && authUser) {
        void saveAnalysisRecordReturningId({
          userId: authUser.id,
          organizationId: activeWorkspaceId || null,
          repoOwner: details.owner,
          repoName: details.repo,
          repoUrl: details.url,
          analysis: res
        })
          .then(({ id, shareToken }) => {
            setLastAnalysisId(id);
            setLastShareToken(shareToken);
            setIsShared(false);
            addLog('Analysis saved to your profile', 'success');
            void loadAnalysisHistory(authUser.id, activeWorkspaceId || undefined);
            // Send Slack notification if configured
            const sc = res.scorecard;
            const avgScore = sc ? Math.round((sc.maintenance + sc.documentation + sc.innovation + sc.security) / 4) : 0;
            void sendSlackNotification({
              repoName: `${details.owner}/${details.repo}`,
              score: avgScore,
              summary: res.summary?.slice(0, 300),
            }).catch(() => { /* Slack not configured — silent */ });
          })
          .catch((err) => addLog(`Failed to save analysis: ${getErrorText(err)}`, 'error'));
      }
      setLoadingProgress(70);
      addLog('✅ AI analysis complete!', 'success');
      
      // Show results ASAP in fast mode
      setRepo(details);
      setStructure(tree);
      setActiveTab('intelligence');

      if (fastMode) {
        setLoadingProgress(100);
        setLoadingStage('Complete!');
        addLog('✅ Core analysis ready. Loading deep insights in background...', 'success');
        setTimeout(() => {
          setLoading(false);
          setLoadingProgress(0);
        }, 500);

        const runBackgroundInsights = async () => {
          try {
            setOnboardingLoading(true);
            const guide = await generateOnboardingGuide(
              details.repo,
              JSON.stringify(tree.slice(0, 50)),
              readme,
              res.techStack
            );
            setOnboardingGuide(guide);
            addLog('✅ Onboarding guide ready!', 'success');
          } catch (err) {
            addLog(`Onboarding guide failed: ${getErrorText(err)}`, 'error');
          } finally {
            setOnboardingLoading(false);
          }

          try {
            addLog('Loading team & activity data...', 'info');
            const [recentCommits, contributors] = await Promise.all([
              recentCommitsPromise,
              contributorsPromise
            ]);

            if (recentCommits.length > 0) {
              const [ownership, activity, testing] = await Promise.all([
                analyzeCodeOwnership(recentCommits, contributors),
                analyzeRecentActivity(recentCommits),
                analyzeTestingSetup(JSON.stringify(tree.slice(0, 100)), readme)
              ]);

              setOnboardingGuide(prev => prev ? {
                ...prev,
                codeOwnership: ownership,
                recentActivity: activity,
                testingSetup: testing
              } : prev);
              addLog('✅ Background insights loaded!', 'success');
            } else {
              addLog('⚠️ Could not fetch recent commits (rate limit?)', 'error');
            }
          } catch (err) {
            addLog(`Background insights failed: ${getErrorText(err)}`, 'error');
          }
        };

        void runBackgroundInsights();
        return;
      }

      // PHASE 4: Generate onboarding guide (70% -> 85%)
      setLoadingStage('Creating your onboarding guide...');
      setOnboardingLoading(true);
      addLog('Generating onboarding guide...', 'ai');
      
      const guide = await generateOnboardingGuide(
        details.repo,
        JSON.stringify(tree.slice(0, 50)),
        readme,
        res.techStack
      );
      setOnboardingGuide(guide);
      setOnboardingLoading(false);
      setLoadingProgress(85);
      addLog('✅ Onboarding guide ready!', 'success');
      
      // PHASE 5: Load enhanced features (85% -> 100%)
      setLoadingStage('Loading team insights...');
      addLog('Loading team & activity data...', 'info');
      
      const [recentCommits, contributors] = await Promise.all([
        recentCommitsPromise,
        contributorsPromise
      ]);
      setLoadingProgress(92);
      
      if (recentCommits.length > 0) {
        const [ownership, activity, testing] = await Promise.all([
          analyzeCodeOwnership(recentCommits, contributors),
          analyzeRecentActivity(recentCommits),
          analyzeTestingSetup(JSON.stringify(tree.slice(0, 100)), readme)
        ]);
        
        setOnboardingGuide(prev => prev ? {
          ...prev,
          codeOwnership: ownership,
          recentActivity: activity,
          testingSetup: testing
        } : prev);
      } else {
        addLog('⚠️ Could not fetch recent commits (rate limit?)', 'error');
      }
      
      setLoadingProgress(100);
      setLoadingStage('Complete!');
      addLog('✅ All insights loaded!', 'success');
      
      // Small delay to show 100% before closing
      setTimeout(() => {
        setLoading(false);
        setLoadingProgress(0);
      }, 800);

    } catch (err) {
      const errorMessage = getErrorText(err) || 'Unknown error occurred';
      setOnboardingLoading(false);
      setLoading(false);
      setLoadingProgress(0);
      setLoadingStage('');

      if (/timed out/i.test(errorMessage)) {
        addLog('⏲️ AI analysis timed out; system is retrying with longer timeout. Try again in a moment.', 'warning');
        showToast('warning', 'Analysis timed out', 'This repo may be very large. Please try again in a moment.');
      } else {
        addLog(`❌ Error: ${errorMessage}`, 'error');
        showToast('error', 'Analysis failed', errorMessage);
      }
    }
  };

  const fetchProjectInsights = async (options?: { activateTab?: boolean }) => {
    if (!repo) return;
    const activateTab = options?.activateTab ?? true;
    setInsightsLoading(true);
    addLog('Analyzing project health and team dynamics...', 'ai');
    
    try {
      const [issues, prs, contributors, deps, languages] = await Promise.all([
        fetchIssues(repo.owner, repo.repo),
        fetchPullRequests(repo.owner, repo.repo),
        fetchContributors(repo.owner, repo.repo),
        analyzeDependencies(repo.owner, repo.repo),
        fetchLanguageStats(repo.owner, repo.repo)
      ]);

      // AI Analysis
      const [issuesSummary, prSummary, teamDynamics] = await Promise.all([
        analyzeIssues(issues),
        analyzePullRequests(prs),
        analyzeTeamDynamics(contributors, issues, prs)
      ]);

      const totalLines = Object.values(languages).reduce((sum, value) => sum + value, 0);
      const codeHealth: CodeHealth = {
        totalFiles: structure.length,
        totalLines,
        languages,
        complexity: totalLines > 10000 ? 'high' : totalLines > 5000 ? 'medium' : 'low',
        lastCommit: new Date().toISOString(),
        commitFrequency: 'Active'
      };

      const nextInsights: ProjectInsights = {
        issues,
        pullRequests: prs,
        contributors,
        dependencies: deps,
        codeHealth,
        issuesSummary,
        prSummary,
        teamDynamics
      };

      setInsights(nextInsights);

      addLog('Project insights synthesized successfully', 'success');
      if (activateTab) {
        setActiveTab('insights');
      }
      return nextInsights;
    } catch (err) {
      addLog('Failed to fetch insights', 'error');
      return null;
    } finally {
      setInsightsLoading(false);
    }
  };

  const runAudit = async () => {
    if (!repo || !analysis) return;
    setAuditLoading(true);
    setRemediationPlans({});
    setRemediationLoading({});
    setFindingStatus({});
    setActiveTab('audit');
    addLog('Initiating Deep Reasoning Security Audit (Thinking Mode)...', 'ai');
    try {
      let readme = '';
      try {
        readme = await fetchFileContent(repo.owner, repo.repo, 'README.md');
      } catch (err) {
        addLog(`README fetch skipped: ${err}`, 'info');
      }
      setAuditReadme(readme);
      const res = await performDeepAudit(repo.repo, analysis.techStack, readme);
      setDeepAudit(res);
      addLog('Neural reasoning complete. Strategic vulnerabilities identified.', 'success');
    } catch (err) {
      addLog(`Audit engine failure: ${err}`, 'error');
    } finally { setAuditLoading(false); }
  };

  const handleGenerateRemediation = async (vulnerability: string, index: number) => {
    if (!repo || !analysis || !deepAudit) return;
    setRemediationLoading((prev) => ({ ...prev, [index]: true }));
    addLog(`Generating remediation plan for finding #${index + 1}`, 'ai');
    try {
      const plan = await generateVulnerabilityRemediation(
        repo.repo,
        analysis.techStack,
        vulnerability,
        deepAudit.architecturalDebt,
        auditReadme
      );
      setRemediationPlans((prev) => ({ ...prev, [index]: plan }));
      addLog(`Remediation plan ready for finding #${index + 1}`, 'success');
    } catch (err) {
      addLog(`Remediation generation failed: ${err}`, 'error');
    } finally {
      setRemediationLoading((prev) => ({ ...prev, [index]: false }));
    }
  };

  const buildIssueBody = (vulnerability: string, plan: VulnerabilityRemediationPlan) => {
    const lines = [
      `## Vulnerability`,
      vulnerability,
      '',
      `## Severity`,
      plan.severity,
      '',
      `## Confidence`,
      `${plan.confidence}%`,
      '',
      `## Affected Files`,
      ...(plan.affectedFiles.length ? plan.affectedFiles.map((file) => `- ${file}`) : ['- To be confirmed']),
      '',
      `## Fix Steps`,
      ...(plan.fixSteps.length ? plan.fixSteps.map((step) => `- ${step}`) : ['- Generate plan again with more context']),
      '',
      `## Verification Steps`,
      ...(plan.verificationSteps.length ? plan.verificationSteps.map((step) => `- ${step}`) : ['- Re-run security audit']),
      '',
      `## Assistant Prompt`,
      '```',
      plan.safePrompt,
      '```'
    ];
    return lines.join('\n');
  };

  const openIssueDraft = (vulnerability: string, plan: VulnerabilityRemediationPlan, index: number) => {
    if (!repo) return;
    const title = `[Security] Fix finding #${index + 1}: ${plan.title || vulnerability.substring(0, 72)}`;
    const body = buildIssueBody(vulnerability, plan);
    const url = `https://github.com/${repo.owner}/${repo.repo}/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    addLog(`Opened GitHub issue draft for finding #${index + 1}`, 'success');
  };

  const setFindingStatusAt = (index: number, status: FindingStatus) => {
    setFindingStatus((prev) => ({ ...prev, [index]: status }));
    addLog(`Finding #${index + 1} marked as ${status}`, 'info');
  };

  const getFindingStatus = (index: number): FindingStatus => findingStatus[index] || 'new';

  const statusClassByType: Record<FindingStatus, string> = {
    new: 'text-slate-300 border-slate-600 bg-slate-800/50',
    confirmed: 'text-amber-300 border-amber-500/40 bg-amber-500/10',
    'false-positive': 'text-indigo-300 border-indigo-500/40 bg-indigo-500/10',
    resolved: 'text-emerald-300 border-emerald-500/40 bg-emerald-500/10'
  };

  const copyAuditTriageSummary = async () => {
    if (!deepAudit) return;
    const lines: string[] = ['# Security Audit Triage Summary', ''];
    deepAudit.vulnerabilities.forEach((finding, index) => {
      const plan = remediationPlans[index];
      lines.push(`## Finding #${index + 1}`);
      lines.push(finding);
      lines.push(`Status: ${getFindingStatus(index)}`);
      if (plan) {
        lines.push(`Severity: ${plan.severity}`);
        lines.push(`Confidence: ${plan.confidence}%`);
      }
      lines.push('');
    });
    await copyToClipboard(lines.join('\n'), 'audit triage summary');
  };

  const handleLabTask = async (task: 'refactor' | 'test') => {
    if (!selectedFile || !fileContent) return;
    setLabLoading(true);
    addLog(`Initiating Lab Task: ${task} on ${selectedFile.name}`, 'ai');
    try {
      const result = await synthesizeLabTask(task, selectedFile.name, fileContent);
      setLabResult(result);
      setActiveTab('lab');
    } catch (err) {
      addLog(`Lab synthesis failure: ${err}`, 'error');
    } finally {
      setLabLoading(false);
    }
  };

  const handleGenerateVideo = async () => {
    if (!analysis) return;
    try {
      const aiStudio = window.aistudio;
      if (!aiStudio) {
        addLog('AI Studio bridge not available', 'error');
        return;
      }
      if (!(await aiStudio.hasSelectedApiKey())) { await aiStudio.openSelectKey(); }
      setVideoLoading(true);
      const videoUrl = await generateVisionVideo(analysis.summary);
      setVisionVideo(videoUrl);
      setActiveTab('vision');
    } catch (err) { addLog(`Render engine failure: ${err}`, 'error'); } finally { setVideoLoading(false); }
  };

  const buildIntroScript = useCallback(() => {
    if (!analysis || !repo) return '';
    const stack = analysis.techStack.slice(0, 5).join(', ');
    const quickStart = onboardingGuide?.quickStart || analysis.summary;
    const critical = onboardingGuide?.criticalFiles?.slice(0, 3).join(', ') || 'core entry points and configs';
    return `Welcome to ${repo.repo}. ${quickStart} This repo is built with ${stack}. Start by reading ${critical}. In a few minutes, you will understand the architecture and where to contribute.`;
  }, [analysis, repo, onboardingGuide]);

  const handleGenerateIntro = async () => {
    if (!analysis || !repo) return;
    const script = buildIntroScript();
    if (!script) return;
    setIntroLoading(true);
    try {
      const speech = await generateSpeech(script);
      if (!speech.data) throw new Error('No audio data returned');
      const mimeType = speech.mimeType || 'audio/wav';
      setIntroScript(script);
      setIntroAudioUrl(`data:${mimeType};base64,${speech.data}`);
      setActiveTab('vision');
      setIntroPlaying(false);
      requestAnimationFrame(() => {
        if (introAudioRef.current) {
          introAudioRef.current.currentTime = 0;
          introAudioRef.current.play().then(() => setIntroPlaying(true)).catch(() => setIntroPlaying(false));
        }
      });
    } catch (err) {
      addLog(`Intro generation failed: ${err}`, 'error');
    } finally {
      setIntroLoading(false);
    }
  };

  const toggleIntroPlayback = () => {
    if (!introAudioRef.current) return;
    if (introPlaying) {
      introAudioRef.current.pause();
      setIntroPlaying(false);
    } else {
      introAudioRef.current.play().then(() => setIntroPlaying(true)).catch(() => setIntroPlaying(false));
    }
  };

  const testingSetup = onboardingGuide?.testingSetup;

  const extractPullRequestNumber = (value: string): number | null => {
    const trimmed = value.trim();
    if (!trimmed) return null;

    if (/^\d+$/.test(trimmed)) {
      return Number(trimmed);
    }

    const urlMatch = trimmed.match(/\/pull\/(\d+)/i);
    if (urlMatch) {
      return Number(urlMatch[1]);
    }

    return null;
  };

  const handleRunPrReview = async () => {
    if (!repo || !analysis) {
      addLog('Analyze a repository before running PR review.', 'error');
      return;
    }

    const prNumber = extractPullRequestNumber(prReviewUrl);
    if (!prNumber) {
      addLog('Enter a valid PR number or GitHub pull request URL.', 'error');
      return;
    }

    const providedRepo = parseGithubUrl(prReviewUrl);
    if (
      providedRepo &&
      (providedRepo.owner.toLowerCase() !== repo.owner.toLowerCase() ||
        providedRepo.repo.toLowerCase() !== repo.repo.toLowerCase())
    ) {
      addLog(`PR URL points to ${providedRepo.owner}/${providedRepo.repo}, but current repo is ${repo.owner}/${repo.repo}.`, 'error');
      return;
    }

    setPrReviewLoading(true);
    setFixSnippets({});
    // Wave 10: reset comment state for new review
    setPrCommentPosted(false);
    setPrCommentUrl(null);
    setPrCommentError(null);
    setShowPrTokenInput(false);
    addLog(`Loading PR #${prNumber} files...`, 'info');

    try {
      const [prs, files] = await Promise.all([
        fetchPullRequests(repo.owner, repo.repo),
        fetchPullRequestFiles(repo.owner, repo.repo, prNumber)
      ]);

      const prMeta = prs.find((pr) => pr.number === prNumber);
      const prTitle = prMeta?.title || `Pull Request #${prNumber}`;
      if (!files.length) {
        addLog(`PR #${prNumber} has no changed files to review.`, 'error');
        return;
      }

      addLog(`Analyzing ${files.length} changed files with AI reviewer...`, 'ai');
      const review = await analyzePullRequestFiles(
        `${repo.owner}/${repo.repo}`,
        prNumber,
        prTitle,
        files
      );

      setPrReviewResult(review);
      setPrReviewFiles(files.map(f => ({ filename: f.filename, status: f.status, additions: f.additions, deletions: f.deletions, patch: f.patch })));
      setPrReviewMeta({
        number: prNumber,
        title: prTitle,
        fileCount: files.length
      });
      setActiveTab('pr-review');
      addLog(`PR review completed for #${prNumber}.`, 'success');

      if (authEnabled && authUser && repo) {
        void savePRReview({
          userId: authUser.id,
          organizationId: activeWorkspaceId || null,
          repoOwner: repo.owner,
          repoName: repo.repo,
          prNumber,
          prTitle,
          fileCount: files.length,
          review
        })
          .then(() => {
            addLog('PR review saved to your profile', 'success');
            void loadPRReviewHistory(authUser.id, activeWorkspaceId || undefined);
          })
          .catch((err) => addLog(`Failed to save PR review: ${getErrorText(err)}`, 'error'));
      }
    } catch (err) {
      addLog(`PR review failed: ${getErrorText(err)}`, 'error');
    } finally {
      setPrReviewLoading(false);
    }
  };

  const submitChat = async (input: string) => {
    if (!input.trim() || !repo || !analysis) return;

    const userMsg: ChatMessage = { role: 'user', text: input, timestamp: Date.now() };
    setChatHistory(prev => [...prev, userMsg]);
    const question = input.toLowerCase();
    setChatInput('');
    setChatLoading(true);
    
    try {
      // Smart instant answers using loaded data
      let instantAnswer = '';
      let fileLinks: string[] | undefined;
      
      // Question: Where to start?
      if (question.includes('where') && (question.includes('start') || question.includes('begin'))) {
        instantAnswer = `🚀 Great question! Here's your starting path:\n\n`;
        if (onboardingGuide?.criticalFiles.length) {
          fileLinks = onboardingGuide.criticalFiles.slice(0, 4);
          instantAnswer += `📂 Start by reading these key files (click below to open):\n`;
        }
        instantAnswer += onboardingGuide?.quickStart || 'Check the Getting Started tab for a personalized onboarding guide!';
      }
      
      // Question: Who owns X? / Team questions
      else if ((question.includes('who') || question.includes('team')) && (question.includes('own') || question.includes('auth') || question.includes('built'))) {
        if (onboardingGuide?.codeOwnership) {
          instantAnswer = `👥 Code Ownership Guidance:\n\n${onboardingGuide.codeOwnership}\n\nCheck the Team & Issues tab for more details!`;
        } else {
          instantAnswer = `I don't have team data loaded yet. This might be a private repo or GitHub API rate limits kicked in.`;
        }
      }
      
      // Question: What's active? / Hot zones
      else if ((question.includes('active') || question.includes('hot') || question.includes('recent')) && !question.includes('test')) {
        if (onboardingGuide?.recentActivity && onboardingGuide.recentActivity.hotFiles.length > 0) {
          instantAnswer = `🔥 Hot Development Zones (Last 7 days):\n\n`;
          onboardingGuide.recentActivity.hotFiles.slice(0, 5).forEach(([file, count], i) => {
            instantAnswer += `${i + 1}. **${file}**: ${count} changes\n`;
          });
          instantAnswer += `\nTotal commits: ${onboardingGuide.recentActivity.totalCommits}, active devs: ${onboardingGuide.recentActivity.activeDevs}.`;
        } else {
          instantAnswer = `No recent activity data available. Check the Team & Issues tab for live data!`;
        }
      }
      
      // Question: Tech stack / Dependencies
      else if (question.includes('tech') || question.includes('stack') || question.includes('dependencies') || question.includes('explain')) {
        instantAnswer = `⚙️ Tech Stack Overview:\n\n`;
        instantAnswer += `**Primary Technologies:**\n${analysis.techStack.slice(0, 8).map(tech => `• ${tech}`).join('\n')}\n\n`;
        instantAnswer += `Check the Tech Stack tab for the full breakdown with dependencies!`;
      }
      
      // Question: Testing
      else if (question.includes('test') || question.includes('testing')) {
        if (onboardingGuide?.testingSetup) {
          instantAnswer = `🧪 Testing Setup:\n\n`;
          instantAnswer += `**Framework**: ${onboardingGuide.testingSetup.testFramework}\n\n`;
          instantAnswer += `**How to run tests:**\n\n\`\`\`\n${onboardingGuide.testingSetup.testCommand}\n\`\`\`\n\n`;
          instantAnswer += onboardingGuide.testingSetup.guidance;
        } else {
          instantAnswer = `No testing setup detected in this repo. You might need to set it up!`;
        }
      }
      
      // Question: Deploy / Deployment
      else if (question.includes('deploy') || question.includes('deployment') || question.includes('production')) {
        instantAnswer = `🚢 Deployment Info:\n\n`;
        const deploymentFiles = structure.filter(f => 
          f.path.includes('deploy') || 
          f.path.includes('dockerfile') || 
          f.path.includes('.github/workflows') ||
          f.path.includes('vercel.json') ||
          f.path.includes('netlify.toml')
        );
        if (deploymentFiles.length > 0) {
          instantAnswer += `Found these deployment configs:\n${deploymentFiles.map(f => `• ${f.path}`).join('\n')}\n\n`;
          instantAnswer += `Check these files for deployment instructions!`;
        } else {
          instantAnswer += `No obvious deployment configs found. Check the README or ask the team!`;
        }
      }
      
      // Fallback: Use AI for complex questions
      if (!instantAnswer) {
        const response = await chatWithRepo(chatHistory, userMsg.text, repo.repo);
        setChatHistory(prev => [...prev, { role: 'model', text: response, timestamp: Date.now() }]);
      } else {
        // Add instant answer
        setChatHistory(prev => [...prev, { role: 'model', text: instantAnswer, timestamp: Date.now(), fileLinks }]);
      }
    } catch (error) {
      setChatHistory(prev => [...prev, { 
        role: 'model', 
        text: '❌ Oops, something went wrong. Try rephrasing your question or check the tabs above for information!', 
        timestamp: Date.now() 
      }]);
    } finally { 
      setChatLoading(false); 
    }
  };

  const handleChat = (e: React.FormEvent) => {
    e.preventDefault();
    void submitChat(chatInput);
  };

  const vscodeExtensionUrl = 'https://marketplace.visualstudio.com/items?itemName=gitmindpro.gitmind-pro';
  const vscodeExtensionDeepLink = 'vscode:extension/gitmindpro.gitmind-pro';

  const highlightedNodes = activeTourStep?.nodeId
    ? nodes.map((node) => (
        node.id === activeTourStep.nodeId
          ? {
              ...node,
              className: 'tour-spotlight',
              style: {
                ...(node.style || {}),
                border: '2px solid #f59e0b'
              }
            }
          : { ...node, className: node.className }
      ))
    : nodes;

  const highlightedEdges = activeTourStep?.nodeId
    ? edges.map((edge) =>
        edge.source === activeTourStep.nodeId || edge.target === activeTourStep.nodeId
          ? { ...edge, animated: true, style: { stroke: '#f59e0b', strokeWidth: 2 } }
          : edge
      )
    : edges;

  const activeWorkspace = workspaces.find((workspace) => workspace.id === activeWorkspaceId) || null;

  // Public share route
  const shareRouteMatch = window.location.pathname.match(/^\/share\/([a-zA-Z0-9_-]+)/);
  if (shareRouteMatch) {
    return <PublicScorecardPage shareToken={shareRouteMatch[1]} />;
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-300 font-sans selection:bg-indigo-500/30 overflow-x-hidden">
      {checkoutBanner && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[200] px-6 py-4 rounded-2xl shadow-2xl border backdrop-blur-sm animate-in slide-in-from-top duration-300 flex items-center gap-3 ${
          checkoutBanner.type === 'success'
            ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
            : 'bg-slate-900/90 border-slate-700 text-slate-300'
        }`}>
          {checkoutBanner.type === 'success' ? (
            <>
              <span className="text-2xl">🎉</span>
              <div>
                <p className="font-bold text-white">{checkoutBanner.trial ? `${checkoutBanner.plan || 'Pro'} trial started!` : `Welcome to ${checkoutBanner.plan || 'Pro'}!`}</p>
                <p className="text-sm opacity-80">{checkoutBanner.trial ? 'You have 7 days free — enjoy unlimited analyses!' : 'Your subscription is active. Enjoy unlimited analyses!'}</p>
              </div>
            </>
          ) : (
            <>
              <span className="text-2xl">↩️</span>
              <div>
                <p className="font-bold text-white">Checkout canceled</p>
                <p className="text-sm opacity-80">No charges were made. You can upgrade anytime.</p>
              </div>
            </>
          )}
          <button onClick={() => setCheckoutBanner(null)} className="ml-4 p-1 rounded-lg hover:bg-white/10 text-white/60 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {appToast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[210] px-5 py-4 rounded-2xl shadow-2xl border backdrop-blur-sm animate-in slide-in-from-top duration-300 flex items-start gap-3 max-w-md w-full mx-4 ${
          appToast.type === 'success' ? 'bg-emerald-950/95 border-emerald-500/50 text-emerald-200' :
          appToast.type === 'error' ? 'bg-rose-950/95 border-rose-500/50 text-rose-200' :
          appToast.type === 'warning' ? 'bg-amber-950/95 border-amber-500/50 text-amber-200' :
          'bg-slate-900/95 border-slate-700 text-slate-200'
        }`}>
          <span className="text-xl shrink-0 mt-0.5">
            {appToast.type === 'success' ? '✅' : appToast.type === 'error' ? '❌' : appToast.type === 'warning' ? '⚠️' : 'ℹ️'}
          </span>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-white text-sm">{appToast.title}</p>
            {appToast.message && <p className="text-xs opacity-80 mt-0.5 leading-relaxed">{appToast.message}</p>}
          </div>
          <button onClick={() => setAppToast(null)} className="p-1 rounded-lg hover:bg-white/10 text-white/60 hover:text-white shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      <nav className="border-b border-slate-800 bg-[#020617]/95 backdrop-blur-2xl sticky top-0 z-50">
        <div className="max-w-[1900px] mx-auto px-4 sm:px-10 h-16 sm:h-24 flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-6">
            <div className="w-10 h-10 sm:w-14 sm:h-14 bg-indigo-600 rounded-xl sm:rounded-2xl flex items-center justify-center font-black text-white shadow-2xl text-lg sm:text-2xl neural-pulse cursor-pointer flex-shrink-0" onClick={() => window.location.reload()}>GM</div>
            <div className="hidden lg:block">
               <span className="text-white font-extrabold tracking-tighter text-3xl block leading-none">GitMind<span className="text-indigo-500">PRO</span></span>
               <span className="text-[10px] text-slate-500 uppercase tracking-[0.5em] font-black mt-1">Onboard to Any Codebase in 5 Minutes</span>
            </div>
          </div>
          
          <form onSubmit={handleImport} className="flex-grow max-w-xl mx-2 sm:mx-12 relative group min-w-0">
            <Search className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 w-5 h-5 sm:w-6 sm:h-6 text-slate-500 transition-colors" />
            <input className="w-full bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl pl-12 sm:pl-16 pr-4 sm:pr-20 py-3 sm:py-5 text-sm sm:text-lg text-white outline-none placeholder:text-slate-600 shadow-2xl" placeholder="Paste GitHub repo URL..." value={url} onChange={(e) => setUrl(e.target.value)} />
            <button type="button" onClick={() => { setCmdPaletteOpen(true); setCmdQuery(''); }} className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1 px-2 py-1 bg-slate-800 border border-slate-700 rounded-lg text-[10px] text-slate-500 hover:text-slate-400 transition-colors">
              <span className="font-mono">⌘K</span>
            </button>
          </form>

          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            <div className="flex items-center gap-1 sm:gap-2">
              {!authEnabled && !authUser && (
                <span className="px-3 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-[10px] font-black uppercase tracking-widest text-amber-400">
                  Auth not configured
                </span>
              )}
              {authUser ? (
                <>
                  <div className="flex items-center gap-2">
                    <select
                      value={activeWorkspaceId}
                      onChange={(e) => {
                        const nextWorkspaceId = e.target.value;
                        setActiveWorkspaceId(nextWorkspaceId);
                        if (nextWorkspaceId) {
                          window.localStorage.setItem(ACTIVE_WORKSPACE_KEY, nextWorkspaceId);
                        }
                      }}
                      disabled={workspaceLoading || workspaces.length === 0}
                      className="hidden md:block h-9 px-3 rounded-xl bg-slate-900 border border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-200 appearance-none cursor-pointer max-w-[160px]"
                    >
                      {workspaces.length === 0 && <option value="">No Workspace</option>}
                      {workspaces.map((workspace) => (
                        <option key={workspace.id} value={workspace.id}>
                          {workspace.name}{workspace.isPersonal ? ' (Personal)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <span className="px-4 py-2 rounded-2xl bg-slate-900 border border-slate-800 text-[10px] font-black uppercase tracking-widest text-emerald-300">
                    {authUser.user_metadata?.user_name ? `@${authUser.user_metadata.user_name}` : (authUser.email || 'Signed in')}
                  </span>
                  {subscription.isActive ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => void openBillingPortal(authUser.id)}
                        className={`flex items-center gap-2 px-4 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                          subscription.plan === 'team'
                            ? 'bg-violet-600/20 border border-violet-500/40 text-violet-300 hover:text-white'
                            : 'bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 hover:text-white'
                        }`}
                      >
                        <CreditCard className="w-4 h-4" /> {subscription.plan === 'team' ? 'Team' : 'Pro'}
                      </button>
                      <div className="hidden xl:flex px-3 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-black uppercase tracking-widest text-emerald-400 items-center gap-1.5">
                        <Activity className="w-3 h-3" /> Unlimited
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      {dailyUsage && (
                        <div
                          className="relative px-3 py-2.5 rounded-2xl border text-[10px] font-black uppercase tracking-widest cursor-pointer transition-all hover:scale-105"
                          onClick={() => setShowPricing(true)}
                          style={{
                            background: dailyUsage.used >= dailyUsage.limit
                              ? 'rgba(239,68,68,0.1)'
                              : dailyUsage.used >= dailyUsage.limit - 1
                              ? 'rgba(245,158,11,0.1)'
                              : 'rgba(15,23,42,1)',
                            borderColor: dailyUsage.used >= dailyUsage.limit
                              ? 'rgba(239,68,68,0.4)'
                              : dailyUsage.used >= dailyUsage.limit - 1
                              ? 'rgba(245,158,11,0.4)'
                              : 'rgba(30,41,59,1)',
                            color: dailyUsage.used >= dailyUsage.limit
                              ? 'rgb(252,165,165)'
                              : dailyUsage.used >= dailyUsage.limit - 1
                              ? 'rgb(252,211,77)'
                              : 'rgb(148,163,184)',
                          }}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <Activity className="w-3 h-3" />
                            <span>{dailyUsage.used}/{dailyUsage.limit} today</span>
                          </div>
                          <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${Math.min(100, (dailyUsage.used / dailyUsage.limit) * 100)}%`,
                                background: dailyUsage.used >= dailyUsage.limit
                                  ? '#ef4444'
                                  : dailyUsage.used >= dailyUsage.limit - 1
                                  ? '#f59e0b'
                                  : '#6366f1',
                              }}
                            />
                          </div>
                        </div>
                      )}
                      <button
                        onClick={() => setShowPricing(true)}
                        className={`flex items-center gap-2 px-4 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                          dailyUsage && dailyUsage.used >= dailyUsage.limit
                            ? 'bg-red-500/20 border border-red-500/40 text-red-300 hover:text-white animate-pulse'
                            : 'bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:text-white'
                        }`}
                      >
                        <Zap className="w-4 h-4" /> {dailyUsage && dailyUsage.used >= dailyUsage.limit ? 'Limit Hit — Upgrade' : 'Upgrade'}
                      </button>
                    </div>
                  )}
                  <button
                    onClick={toggleTheme}
                    className="flex items-center gap-2 px-3 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
                    title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                  >
                    {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => setShowSettings(true)}
                    className="flex items-center gap-2 px-3 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
                    title="Settings"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setShowChangelog(true)}
                    className="hidden lg:flex items-center gap-2 px-3 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all bg-slate-900 border border-slate-800 text-amber-400 hover:text-amber-300"
                    title="What's New"
                  >
                    <Sparkles className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleSignOut}
                    disabled={authBusy}
                    className="flex items-center gap-2 px-3 lg:px-4 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-50"
                  >
                    <LogOut className="w-4 h-4" /> <span className="hidden lg:inline">Sign out</span>
                  </button>
                  <NotificationCenter
                    authUser={authUser}
                    notifications={notifications}
                    onMarkRead={markNotificationRead}
                    onMarkAllRead={markAllNotificationsRead}
                    onDismiss={dismissNotification}
                  />
                </>
              ) : (
                <>
                <button
                  onClick={toggleTheme}
                  className="flex items-center gap-2 px-3 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
                  title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                  {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
                <button
                  onClick={handleSignIn}
                  disabled={authBusy || authLoading}
                  className="flex items-center gap-2 px-5 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50"
                >
                  <LogIn className="w-4 h-4" /> {authLoading ? 'Checking session...' : 'Sign in'}
                </button>
                </>
              )}
            </div>
            {!authUser && !authLoading && (
              <div
                className="cursor-pointer transition-all hover:scale-105"
                onClick={() => setShowSignupPrompt(true)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '16px',
                  fontSize: '10px',
                  fontWeight: 900,
                  textTransform: 'uppercase' as const,
                  letterSpacing: '0.1em',
                  background: freeTierStatus.remaining === 0
                    ? 'rgba(239,68,68,0.1)'
                    : freeTierStatus.remaining === 1
                    ? 'rgba(245,158,11,0.1)'
                    : 'rgba(245,158,11,0.05)',
                  border: `1px solid ${
                    freeTierStatus.remaining === 0
                      ? 'rgba(239,68,68,0.4)'
                      : freeTierStatus.remaining === 1
                      ? 'rgba(245,158,11,0.4)'
                      : 'rgba(245,158,11,0.3)'
                  }`,
                  color: freeTierStatus.remaining === 0
                    ? 'rgb(252,165,165)'
                    : freeTierStatus.remaining === 1
                    ? 'rgb(252,211,77)'
                    : 'rgb(251,191,36)',
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Activity className="w-3 h-3" />
                  <span>{freeTierStatus.used}/{freeTierStatus.limit} used</span>
                </div>
                <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: 'rgba(30,41,59,1)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, (freeTierStatus.used / freeTierStatus.limit) * 100)}%`,
                      background: freeTierStatus.remaining === 0
                        ? '#ef4444'
                        : freeTierStatus.remaining === 1
                        ? '#f59e0b'
                        : '#6366f1',
                    }}
                  />
                </div>
                {freeTierStatus.remaining === 0 && (
                  <div className="text-[8px] mt-1 text-red-400">Sign in to continue</div>
                )}
              </div>
            )}

          </div>
        </div>
      </nav>

      <main className="max-w-[1900px] mx-auto p-4 sm:p-8 xl:p-12 pb-20">
        {loading ? (
          <div className="h-[80vh] flex flex-col items-center justify-center space-y-12 px-4">
            {/* Animated Brain Icon */}
            <div className="relative">
              <div className="w-32 h-32 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-2xl animate-pulse">
                <BrainCircuit className="w-16 h-16 text-white animate-bounce" />
              </div>
              <div className="absolute inset-0 bg-indigo-500 rounded-full blur-3xl opacity-30 animate-pulse"></div>
            </div>

            {/* Stage Text */}
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-black text-white">{loadingStage}</h2>
              <p className="text-slate-400 text-lg">
                {loadingProgress < 30 && "⏱️ Estimated time: 40-80 seconds for large repos"}
                {loadingProgress >= 30 && loadingProgress < 60 && "⏱️ About 30-50 seconds remaining..."}
                {loadingProgress >= 60 && loadingProgress < 85 && "⏱️ Almost done! 10-20 seconds left..."}
                {loadingProgress >= 85 && "⏱️ Just a few more seconds! 🎉"}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="w-full max-w-2xl space-y-3">
              <div className="h-4 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-1000 ease-out relative overflow-hidden"
                  style={{ width: `${loadingProgress}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                </div>
              </div>
              <div className="flex justify-between text-sm text-slate-500 font-mono">
                <span>0%</span>
                <span className="text-indigo-400 font-bold">{loadingProgress}%</span>
                <span>100%</span>
              </div>
            </div>

            {/* Fun Tips Carousel */}
            <div className="max-w-2xl text-center space-y-6 bg-gradient-to-br from-slate-900/80 to-slate-900/40 border border-slate-800 rounded-3xl p-8 backdrop-blur-xl shadow-2xl">
              <div className="flex items-center justify-center gap-3 mb-4">
                <span className="text-4xl animate-bounce">{loadingTips[loadingTip].icon}</span>
                <h3 className="text-xl font-bold text-white">While You Wait...</h3>
              </div>
              <p 
                key={loadingTip}
                className="text-slate-200 text-lg leading-relaxed animate-in fade-in slide-in-from-bottom-4 min-h-[60px] flex items-center justify-center"
              >
                {loadingTips[loadingTip].text}
              </p>
              
              {/* Tip Counter */}
              <div className="flex items-center justify-center gap-2 pt-4">
                {loadingTips.map((_, i) => (
                  <div 
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === loadingTip 
                        ? 'w-8 bg-indigo-500' 
                        : 'w-1.5 bg-slate-700'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-center gap-8 text-sm">
              <div className={`flex items-center gap-2 transition-all duration-300 ${loadingProgress >= 30 ? 'text-emerald-400 scale-110' : loadingProgress > 0 ? 'text-indigo-400 animate-pulse' : 'text-slate-500'}`}>
                {loadingProgress >= 30 ? '✅' : '📦'} Fetch Code
              </div>
              <div className={`w-12 h-0.5 transition-all duration-300 ${loadingProgress >= 30 ? 'bg-emerald-500' : 'bg-slate-800'}`}></div>
              <div className={`flex items-center gap-2 transition-all duration-300 ${loadingProgress >= 70 ? 'text-emerald-400 scale-110' : loadingProgress >= 30 ? 'text-indigo-400 animate-pulse' : 'text-slate-500'}`}>
                {loadingProgress >= 70 ? '✅' : '🤖'} AI Analysis
              </div>
              <div className={`w-12 h-0.5 transition-all duration-300 ${loadingProgress >= 70 ? 'bg-emerald-500' : 'bg-slate-800'}`}></div>
              <div className={`flex items-center gap-2 transition-all duration-300 ${loadingProgress >= 85 ? 'text-emerald-400 scale-110' : loadingProgress >= 70 ? 'text-indigo-400 animate-pulse' : 'text-slate-500'}`}>
                {loadingProgress >= 85 ? '✅' : '📚'} Guide
              </div>
              <div className={`w-12 h-0.5 transition-all duration-300 ${loadingProgress >= 85 ? 'bg-emerald-500' : 'bg-slate-800'}`}></div>
              <div className={`flex items-center gap-2 transition-all duration-300 ${loadingProgress >= 100 ? 'text-emerald-400 scale-110' : loadingProgress >= 85 ? 'text-indigo-400 animate-pulse' : 'text-slate-500'}`}>
                {loadingProgress >= 100 ? '✅' : '👥'} Team Data
              </div>
            </div>

            {/* Behind the Scenes Status */}
            <div className="max-w-2xl space-y-3">
              <p className="text-xs text-slate-500 uppercase tracking-widest text-center font-bold">Behind the Scenes</p>
              <div className="grid grid-cols-2 gap-4">
                <div className={`p-4 rounded-xl border transition-all duration-500 ${loadingProgress >= 15 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-900/50 border-slate-800'}`}>
                  <div className="flex items-center gap-2 text-sm">
                    <span className={loadingProgress >= 15 ? 'text-emerald-400' : 'text-slate-600'}>
                      {loadingProgress >= 15 ? '✓' : '◯'}
                    </span>
                    <span className={loadingProgress >= 15 ? 'text-emerald-300' : 'text-slate-600'}>Repo metadata</span>
                  </div>
                </div>
                <div className={`p-4 rounded-xl border transition-all duration-500 ${loadingProgress >= 30 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-900/50 border-slate-800'}`}>
                  <div className="flex items-center gap-2 text-sm">
                    <span className={loadingProgress >= 30 ? 'text-emerald-400' : 'text-slate-600'}>
                      {loadingProgress >= 30 ? '✓' : '◯'}
                    </span>
                    <span className={loadingProgress >= 30 ? 'text-emerald-300' : 'text-slate-600'}>File structure</span>
                  </div>
                </div>
                <div className={`p-4 rounded-xl border transition-all duration-500 ${loadingProgress >= 70 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-900/50 border-slate-800'}`}>
                  <div className="flex items-center gap-2 text-sm">
                    <span className={loadingProgress >= 70 ? 'text-emerald-400' : 'text-slate-600'}>
                      {loadingProgress >= 70 ? '✓' : '◯'}
                    </span>
                    <span className={loadingProgress >= 70 ? 'text-emerald-300' : 'text-slate-600'}>Tech stack scan</span>
                  </div>
                </div>
                <div className={`p-4 rounded-xl border transition-all duration-500 ${loadingProgress >= 92 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-900/50 border-slate-800'}`}>
                  <div className="flex items-center gap-2 text-sm">
                    <span className={loadingProgress >= 92 ? 'text-emerald-400' : 'text-slate-600'}>
                      {loadingProgress >= 92 ? '✓' : '◯'}
                    </span>
                    <span className={loadingProgress >= 92 ? 'text-emerald-300' : 'text-slate-600'}>Team activity</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : repo && analysis ? (
          <div className="grid grid-cols-12 gap-4 sm:gap-6 lg:gap-8">
            
            {/* Wave 14: Demo Mode Banner */}
            {demoMode && (
              <div className="col-span-12 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border border-indigo-500/30 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🎮</span>
                  <div>
                    <p className="text-white font-black text-sm">Demo Mode — Exploring facebook/react</p>
                    <p className="text-indigo-300/70 text-xs">This is pre-loaded data. Analyze your own repo for live results!</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => { handleExitDemo(); document.querySelector('input')?.focus(); }} className="bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs px-4 py-2 rounded-xl transition-all">
                    Analyze Your Repo
                  </button>
                  {!authUser && (
                    <button onClick={() => signInWithGitHub()} className="bg-slate-800 hover:bg-slate-700 text-white font-black text-xs px-4 py-2 rounded-xl transition-all border border-slate-700 flex items-center gap-1.5">
                      <LogIn className="w-3 h-3" /> Sign In
                    </button>
                  )}
                  <button onClick={handleExitDemo} className="text-slate-500 hover:text-white transition-colors p-1">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
            
            <div className="col-span-12 hidden xl:block xl:col-span-3 space-y-6 sm:space-y-10">
               <div className="bg-slate-900/40 border border-slate-800 rounded-2xl sm:rounded-[2.5rem] p-4 sm:p-10 backdrop-blur-3xl shadow-2xl relative overflow-hidden">
                  <h3 className="text-white font-black flex items-center gap-4 text-xl mb-10"><Layout className="w-6 h-6 text-indigo-400" /> File Explorer</h3>
                  <div className="max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar">
                    <FileTree nodes={structure} onSelectFile={handleFileSelect} selectedPath={selectedFile?.path} />
                  </div>
               </div>
            </div>

            <div className="col-span-12 lg:col-span-8 xl:col-span-6 space-y-6 sm:space-y-10">

              {/* Wave 16: Vibe Mode Selector */}
              {analysis && (
                <VibeModeSelector value={vibeMode} onChange={handleVibeChange} />
              )}

               {/* ── Tab bar ─────────────────────────────────────── */}
               <div className="flex gap-2 p-2 bg-slate-900/50 border border-slate-800 rounded-[2rem] shadow-2xl overflow-x-auto no-scrollbar">
                    {[
                      { id: 'intelligence', label: 'Getting Started', icon: Rocket },
                      { id: 'blueprint', label: 'Architecture', icon: Layout },
                      { id: 'insights', label: 'Team & Issues', icon: Users },
                      { id: 'pr-review', label: 'PR Review', icon: ClipboardCheck },
                      { id: 'cloud', label: 'Tech Stack', icon: Server },
                      { id: 'audit', label: 'Security', icon: BrainCircuit },
                      { id: 'devops', label: 'DevOps', icon: Cpu },
                    ].map(tab => (
                      <button key={tab.id} onClick={() => { setActiveTab(tab.id as AppTab); if (tab.id === 'insights' && !insights) fetchProjectInsights(); }} className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-[1.2rem] text-[8px] sm:text-[9px] font-black uppercase tracking-[0.1em] sm:tracking-[0.15em] transition-all ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-2xl' : 'text-slate-500 hover:text-slate-200 hover:bg-slate-800/50'}`}>
                        <tab.icon className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> <span className="hidden sm:inline">{tab.label}</span><span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                      </button>
                    ))}
               </div>

               {/* ── Action toolbar (separate row) ────────────────── */}
               {analysis && (
                 <div className="flex flex-wrap items-center gap-2">
                   {/* Share group */}
                   {authUser && lastAnalysisId && (
                     <button
                       onClick={() => void handleShareAnalysis()}
                       className={`px-4 py-2 font-black rounded-xl transition-all text-xs flex items-center gap-1.5 ${
                         isShared
                           ? 'bg-indigo-500 hover:bg-indigo-400 text-white'
                           : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                       }`}
                     >
                       <Share2 className="w-3.5 h-3.5" /> {isShared ? 'Shared' : 'Share'}
                     </button>
                   )}
                   {repo && (
                     <button
                       onClick={() => setShowShareCard(true)}
                       className="px-4 py-2 font-black rounded-xl transition-all text-xs flex items-center gap-1.5 bg-slate-800 hover:bg-violet-600 text-slate-300 hover:text-white border border-slate-700 hover:border-violet-500"
                     >
                       <Twitter className="w-3.5 h-3.5" /> Share Card
                     </button>
                   )}
                   {authUser && repo && (
                     <button
                       onClick={async () => {
                         const key = `${repo.owner}/${repo.repo}`;
                         if (watchedRepos.has(key)) {
                           await unwatchRepo(authUser.id, repo.owner, repo.repo).catch(() => {});
                           setWatchedRepos(prev => { const next = new Set(prev); next.delete(key); return next; });
                           addLog(`Unwatched ${key}`, 'info');
                         } else {
                           await watchRepo(authUser.id, repo.owner, repo.repo, activeWorkspaceId || null).catch(() => {});
                           setWatchedRepos(prev => new Set(prev).add(key));
                           addLog(`Watching ${key} — daily scheduled analysis enabled`, 'success');
                           addNotification({ type: 'system', title: 'Repo Watched', message: `${key} will be analyzed daily. You'll get email digests weekly.` });
                         }
                       }}
                       className={`px-4 py-2 font-black rounded-xl transition-all text-xs flex items-center gap-1.5 ${
                         watchedRepos.has(`${repo.owner}/${repo.repo}`)
                           ? 'bg-amber-500 hover:bg-amber-400 text-white'
                           : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                       }`}
                     >
                       <Clock className="w-3.5 h-3.5" /> {watchedRepos.has(`${repo.owner}/${repo.repo}`) ? 'Watching' : 'Watch'}
                     </button>
                   )}

                   <div className="w-px h-5 bg-slate-800 mx-1" />

                   {/* Export group */}
                   {repo && (
                     <button
                       onClick={() => setShowBadgeEmbed(true)}
                       className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-black rounded-xl transition-all text-xs flex items-center gap-1.5"
                     >
                       <Link className="w-3.5 h-3.5" /> Badge
                     </button>
                   )}
                   <button
                     onClick={exportAnalysisMarkdown}
                     className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-black rounded-xl transition-all text-xs flex items-center gap-1.5"
                   >
                     <FileText className="w-3.5 h-3.5" /> MD
                   </button>
                   <button
                     onClick={exportAnalysisJSON}
                     className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-black rounded-xl transition-all text-xs flex items-center gap-1.5"
                     title="Export agent-ready JSON for Cursor / Claude Code / Devin"
                   >
                     <Cpu className="w-3.5 h-3.5" /> JSON
                   </button>
                   <button onClick={exportAnalysisPdf} className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl transition-all text-xs flex items-center gap-1.5">
                     <Download className="w-3.5 h-3.5" /> PDF
                   </button>

                   <div className="w-px h-5 bg-slate-800 mx-1" />

                   {/* CTA group */}
                   <button
                     onClick={() => { setShowExpertHire(true); }}
                     className="px-3 py-2 bg-violet-600 hover:bg-violet-500 text-white font-black rounded-xl transition-all text-xs flex items-center gap-1.5"
                   >
                     <Briefcase className="w-3.5 h-3.5" /> Hire Expert
                   </button>
                 </div>
               )}

               {activeTab === 'intelligence' && (
                 <div className="space-y-10 animate-in fade-in duration-700">
                    {onboardingLoading ? (
                      <div className="h-[40vh] flex flex-col items-center justify-center">
                        <Loader message="Generating your onboarding guide..." />
                      </div>
                    ) : onboardingGuide ? (
                      <>
                          <div className="bg-slate-900/40 border border-slate-800 rounded-[3rem] p-10 shadow-2xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
                            <div className="flex items-start gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                                <Code className="w-6 h-6 text-indigo-400" />
                              </div>
                              <div>
                                <h3 className="text-xl font-black text-white mb-2">Work inside VS Code</h3>
                                <p className="text-slate-400 text-sm leading-relaxed">Install the extension to analyze repos, explain files, and see team health without leaving your editor.</p>
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                              <a
                                href={vscodeExtensionUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all"
                              >
                                Install Extension
                              </a>
                              <a
                                href={vscodeExtensionDeepLink}
                                className="px-4 py-3 bg-slate-900 border border-slate-700 text-indigo-300 font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all hover:text-white"
                                aria-label="Open GitMind Pro extension in VS Code"
                              >
                                Open in VS Code
                              </a>
                              <span className="text-[10px] text-slate-500 uppercase tracking-widest">Requires VS Code</span>
                            </div>
                          </div>
                        {/* Quick Start */}
                        <div className="bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border border-indigo-500/30 rounded-[3rem] p-12 shadow-2xl">
                          <div className="flex items-center gap-4 mb-6">
                            <Rocket className="w-10 h-10 text-indigo-400" />
                            <h2 className="text-4xl font-black text-white tracking-tighter">Getting Started</h2>
                          </div>
                          <p className="text-slate-200 text-xl leading-relaxed">{onboardingGuide.quickStart}</p>
                        </div>

                        {/* Critical Files to Read First */}
                        <div className="bg-slate-900/40 border border-slate-800 rounded-[3rem] p-12 shadow-2xl">
                          <h3 className="text-2xl font-black text-white mb-8 flex items-center gap-4">
                            <Code className="w-7 h-7 text-emerald-400" /> Start Reading These Files
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {onboardingGuide.criticalFiles.map((file, i) => (
                              <div 
                                key={i} 
                                onClick={() => openFileByPath(file)}
                                className="p-6 bg-slate-950 rounded-2xl border border-slate-800 hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/10 hover:scale-105 transition-all duration-300 cursor-pointer group animate-in fade-in slide-in-from-left"
                                style={{animationDelay: `${i * 80}ms`}}
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <span className="text-2xl font-black text-emerald-500 flex-shrink-0 group-hover:scale-125 transition-transform">{i + 1}</span>
                                  <code className="text-slate-300 text-sm group-hover:text-white transition-colors truncate">{file}</code>
                                  <span className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-emerald-400">→</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Recommended Learning Path */}
                        <div className="bg-slate-900/40 border border-slate-800 rounded-[3rem] p-12 shadow-2xl">
                          <h3 className="text-2xl font-black text-white mb-8 flex items-center gap-4">
                            <MapPin className="w-7 h-7 text-indigo-400" /> Your Learning Path
                          </h3>
                          <div className="space-y-4">
                            {onboardingGuide.recommendedPath.map((step, i) => (
                              <div 
                                key={i} 
                                className="flex items-start gap-6 p-6 bg-slate-950 rounded-2xl border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900/80 hover:scale-[1.02] transition-all duration-300 cursor-pointer group animate-in fade-in slide-in-from-right"
                                style={{animationDelay: `${i * 100}ms`}}
                              >
                                <div className="w-10 h-10 rounded-full bg-indigo-600 group-hover:bg-indigo-500 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-indigo-500/50 flex items-center justify-center font-black text-white shrink-0 transition-all duration-300">
                                  {i + 1}
                                </div>
                                <p className="text-slate-300 text-lg pt-2 group-hover:text-white transition-colors">{step}</p>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
                                  <span className="text-indigo-400 text-xl font-bold">✓</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Common Tasks */}
                        <div className="bg-slate-900/40 border border-slate-800 rounded-[3rem] p-12 shadow-2xl">
                          <h3 className="text-2xl font-black text-white mb-8 flex items-center gap-4">
                            <Zap className="w-7 h-7 text-amber-400" /> Common Tasks You&apos;ll Do
                          </h3>
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {onboardingGuide.commonTasks.map((task, i) => (
                              <div 
                                key={i} 
                                className="p-8 bg-slate-950 rounded-2xl border border-slate-800 hover:border-amber-500/50 hover:shadow-xl hover:shadow-amber-500/10 hover:-translate-y-2 transition-all duration-300 cursor-pointer group animate-in fade-in zoom-in min-w-0"
                                style={{animationDelay: `${i * 120}ms`}}
                              >
                                <h4 className="text-lg font-black text-white mb-4 group-hover:text-amber-400 transition-colors flex items-start gap-2">
                                  <span className="text-2xl shrink-0">🎯</span>
                                  <span className="break-words min-w-0">{task.task}</span>
                                </h4>
                                <ol className="space-y-2">
                                  {task.steps.map((step, j) => (
                                    <li key={j} className="text-sm text-slate-400 group-hover:text-slate-300 flex gap-3 transition-colors min-w-0">
                                      <span className="text-amber-500 font-bold group-hover:scale-125 transition-transform inline-block shrink-0">{j + 1}.</span>
                                      <span className="break-words min-w-0">{step}</span>
                                    </li>
                                  ))}
                                </ol>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Setup Instructions */}
                        <div className="bg-slate-900/40 border border-slate-800 rounded-[3rem] p-12 shadow-2xl hover:border-rose-500/50 transition-all duration-300 animate-in fade-in slide-in-from-bottom-8">
                          <h3 className="text-2xl font-black text-white mb-8 flex items-center gap-4">
                            <Terminal className="w-7 h-7 text-rose-400 animate-pulse" /> Local Setup
                          </h3>
                          <div 
                            onClick={() => copyToClipboard(onboardingGuide.setupInstructions, 'setup instructions')}
                            className="p-8 bg-black/40 rounded-2xl border border-slate-800 hover:border-rose-500/30 hover:bg-black/60 transition-all duration-300 cursor-pointer group relative overflow-hidden"
                          >
                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="text-xs bg-rose-500/20 text-rose-400 px-3 py-1 rounded-full font-bold">📋 Click to copy</span>
                            </div>
                            <pre className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap group-hover:text-white transition-colors">{onboardingGuide.setupInstructions}</pre>
                          </div>
                        </div>

                        {/* Testing Guide */}
                        {testingSetup && testingSetup.hasTests && (
                          <div className="bg-slate-900/40 border border-slate-800 rounded-[3rem] p-12 shadow-2xl hover:border-emerald-500/50 transition-all duration-300 animate-in fade-in zoom-in">
                            <h3 className="text-2xl font-black text-white mb-8 flex items-center gap-4">
                              <FlaskConical className="w-7 h-7 text-emerald-400 animate-pulse" /> Testing Guide
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                              <div className="space-y-4">
                                <div 
                                  onClick={() => copyToClipboard(testingSetup.testFramework, 'test framework')}
                                  className="p-6 bg-slate-950 rounded-2xl border border-slate-800 hover:border-emerald-500/50 hover:scale-105 transition-all duration-300 cursor-pointer group"
                                >
                                  <div className="text-xs text-slate-500 group-hover:text-emerald-400 uppercase tracking-wider mb-2 transition-colors">Framework</div>
                                  <div className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">{testingSetup.testFramework}</div>
                                </div>
                                <div 
                                  onClick={() => copyToClipboard(testingSetup.testCommand, 'test command')}
                                  className="p-6 bg-slate-950 rounded-2xl border border-slate-800 hover:border-emerald-500/50 hover:scale-105 transition-all duration-300 cursor-pointer group"
                                >
                                  <div className="text-xs text-slate-500 group-hover:text-emerald-400 uppercase tracking-wider mb-2 transition-colors">Run Tests</div>
                                  <code className="text-emerald-400 group-hover:text-emerald-300 font-mono text-sm transition-colors">{testingSetup.testCommand}</code>
                                </div>
                              </div>
                              <div className="p-6 bg-slate-950 rounded-2xl border border-slate-800">
                                <div className="text-xs text-slate-500 uppercase tracking-wider mb-4">Example Test Files</div>
                                <ul className="space-y-2">
                                  {testingSetup.testFiles.slice(0, 5).map((file, i) => (
                                    <li 
                                      key={i} 
                                      onClick={() => openFileByPath(file)}
                                      className="text-sm text-slate-300 font-mono cursor-pointer hover:text-emerald-300 transition-colors break-all"
                                      title={file}
                                    >
                                      {file}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                            <div className="mt-6 p-6 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl">
                              <p className="text-slate-300 text-sm leading-relaxed">{testingSetup.guidance}</p>
                            </div>
                          </div>
                        )}

                        {/* Recent Activity / Hot Zones */}
                        {onboardingGuide.recentActivity && (
                          <div className="bg-slate-900/40 border border-slate-800 rounded-[3rem] p-12 shadow-2xl">
                            <h3 className="text-2xl font-black text-white mb-8 flex items-center gap-4">
                              <Activity className="w-7 h-7 text-rose-400" /> Recent Activity (Last 7 Days)
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                              <div className="p-6 bg-slate-950 rounded-2xl border border-slate-800 text-center hover:border-white hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer group animate-in fade-in slide-in-from-bottom-4" style={{animationDelay: '0ms'}}>
                                <div className="text-4xl font-black text-white mb-2 group-hover:scale-110 transition-transform">{onboardingGuide.recentActivity.totalCommits}</div>
                                <div className="text-xs text-slate-500 group-hover:text-slate-300 uppercase tracking-wider transition-colors">Total Commits</div>
                              </div>
                              <div className="p-6 bg-slate-950 rounded-2xl border border-slate-800 text-center hover:border-indigo-500 hover:shadow-2xl hover:shadow-indigo-500/20 hover:scale-105 transition-all duration-300 cursor-pointer group animate-in fade-in slide-in-from-bottom-4" style={{animationDelay: '100ms'}}>
                                <div className="text-4xl font-black text-indigo-500 mb-2 group-hover:scale-110 transition-transform">{onboardingGuide.recentActivity.activeDevs}</div>
                                <div className="text-xs text-slate-500 group-hover:text-slate-300 uppercase tracking-wider transition-colors">Active Developers</div>
                              </div>
                              <div className="p-6 bg-slate-950 rounded-2xl border border-slate-800 text-center hover:border-rose-500 hover:shadow-2xl hover:shadow-rose-500/20 hover:scale-105 transition-all duration-300 cursor-pointer group animate-in fade-in slide-in-from-bottom-4" style={{animationDelay: '200ms'}}>
                                <div className="text-4xl font-black text-rose-500 mb-2 group-hover:scale-110 transition-transform">{onboardingGuide.recentActivity.hotFiles.length}</div>
                                <div className="text-xs text-slate-500 group-hover:text-slate-300 uppercase tracking-wider transition-colors">Hot Files</div>
                              </div>
                            </div>
                            <div className="p-8 bg-rose-500/5 border border-rose-500/20 rounded-2xl mb-6">
                              <div className="flex items-start gap-4 mb-4">
                                <AlertTriangle className="w-6 h-6 text-rose-500 shrink-0 mt-1" />
                                <div>
                                  <h4 className="text-white font-bold mb-2">Hot Zones - Be Careful!</h4>
                                  <p className="text-slate-400 text-sm">These files are under active development. Read but don&apos;t modify until you understand the ongoing work.</p>
                                </div>
                              </div>
                            </div>
                            <div className="space-y-3">
                              {onboardingGuide.recentActivity.hotFiles.slice(0, 10).map(([file, count], i) => (
                                <div 
                                  key={i} 
                                  onClick={() => openFileByPath(file)}
                                  className="flex items-center gap-4 p-4 bg-slate-950 rounded-xl border border-slate-800 hover:border-rose-500/50 hover:bg-slate-900 hover:scale-[1.02] transition-all duration-200 cursor-pointer group animate-in fade-in slide-in-from-left"
                                  style={{animationDelay: `${i * 50}ms`}}
                                >
                                  <div className="w-1 h-8 bg-rose-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                  <code className="text-slate-300 text-sm truncate flex-1 min-w-0 group-hover:text-white transition-colors">{file}</code>
                                  <div className="flex items-center gap-3 flex-shrink-0">
                                    <span className="text-rose-500 text-xs font-bold whitespace-nowrap group-hover:text-rose-400 transition-colors">{count} changes</span>
                                    <div className="w-20 h-2 bg-slate-800 rounded-full overflow-hidden group-hover:bg-slate-700 transition-colors">
                                      <div className="h-full bg-gradient-to-r from-rose-600 to-rose-400 transition-all duration-500 group-hover:animate-pulse" style={{ width: `${Math.min((count / 10) * 100, 100)}%` }}></div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                            <div className="mt-8 p-6 bg-slate-950 rounded-2xl border border-slate-800">
                              <p className="text-slate-300 text-sm leading-relaxed">{onboardingGuide.recentActivity.summary}</p>
                            </div>
                          </div>
                        )}

                        {/* Code Ownership */}
                        {onboardingGuide.codeOwnership && (
                          <div className="bg-slate-900/40 border border-slate-800 rounded-[3rem] p-12 shadow-2xl hover:border-indigo-500/50 transition-all duration-300 animate-in fade-in slide-in-from-bottom-8">
                            <h3 className="text-2xl font-black text-white mb-8 flex items-center gap-4">
                              <Users className="w-7 h-7 text-indigo-400 animate-pulse" /> Who to Ask
                            </h3>
                            <div className="p-8 bg-slate-950 rounded-2xl border border-slate-800 hover:border-indigo-500/30 hover:bg-slate-900/80 transition-all duration-300 cursor-pointer group">
                              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-xs text-indigo-400 font-bold">💡 Click files in tree to see who owns them</span>
                              </div>
                              <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap break-words group-hover:text-slate-200 transition-colors">{onboardingGuide.codeOwnership}</p>
                            </div>
                          </div>
                        )}

                        {/* Wave 18: Smart Onboarding Checklist */}
                        <OnboardingChecklist
                          onGenerate={handleGenerateOnboardingChecklist}
                          loading={onboardingChecklistLoading}
                          repoName={repo ? `${repo.owner}/${repo.repo}` : undefined}
                          vibeMode={vibeMode}
                        />
                      </>
                    ) : analysis ? (
                      <div className="bg-slate-900/40 border border-slate-800 rounded-[3rem] p-12 shadow-2xl">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                          <div className="flex flex-col gap-3">
                            <ScoreCard scores={analysis.scorecard} />
                            {/* Wave 17: AI Confidence Score */}
                            {repo && (() => {
                              const starScore = Math.min(20, Math.round(Math.log10((repo.stars || 0) + 1) * 10));
                              const techScore = Math.min(15, (analysis.techStack?.length || 0) * 2);
                              const scorecardAvg = (analysis.scorecard.maintenance + analysis.scorecard.documentation + analysis.scorecard.innovation + analysis.scorecard.security) / 4;
                              // scorecardAvg is 0-10; scale to 0-5 contribution
                              const qualityScore = Math.round(scorecardAvg / 2);
                              const topicsScore = (repo.topics?.length || 0) > 0 ? 5 : 0;
                              const confidence = Math.min(97, 55 + starScore + techScore + qualityScore + topicsScore);
                              return (
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">AI Confidence</span>
                                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    <span className="text-xs font-black text-emerald-400">{confidence}%</span>
                                  </div>
                                  <span className="text-[10px] text-slate-600">
                                    {repo.stars?.toLocaleString()} stars · {analysis.techStack?.length} tech detected · {repo.forks?.toLocaleString()} forks
                                  </span>
                                </div>
                              );
                            })()}
                          </div>
                          <button
                            onClick={exportAnalysisPdf}
                            className="px-5 py-3 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-white font-bold rounded-xl transition-all"
                            disabled={!analysis || !repo}
                          >
                            Export Report as PDF
                          </button>
                        </div>
                        <div className="mt-4">
                          <h2 className="text-4xl font-black text-white tracking-tighter mb-8">Repository Overview</h2>
                          <p className="text-slate-300 leading-loose text-2xl font-medium opacity-90">{analysis.summary}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-slate-900/40 border border-slate-800 rounded-[3rem] p-12 shadow-2xl">
                        <div className="flex flex-col items-center justify-center py-20">
                          <div className="relative mb-8">
                            <BrainCircuit className="w-20 h-20 text-indigo-500 animate-pulse" />
                            <div className="absolute -top-2 -right-2 w-6 h-6 bg-indigo-600 rounded-full animate-ping"></div>
                          </div>
                          <p className="text-white text-2xl font-black mb-3">AI is Analyzing...</p>
                          <p className="text-slate-500 text-sm mb-8">Meanwhile, explore the file tree on the left! →</p>
                          
                          {/* Fun Tips Carousel */}
                          <div className="max-w-2xl bg-slate-950 border border-slate-800 rounded-2xl p-8 mt-6">
                            <div className="flex items-start gap-4">
                              <Sparkles className="w-6 h-6 text-amber-400 flex-shrink-0 mt-1" />
                              <div>
                                <h4 className="text-white font-bold mb-2">💡 Pro Tip</h4>
                                <p className="text-slate-400 text-sm leading-relaxed">
                                  Click any file in the tree to get an AI explanation of what it does, or check Architecture to see how components connect!
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Progress Steps */}
                          <div className="grid grid-cols-3 gap-6 mt-12 w-full max-w-3xl">
                            <div className="text-center p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                              <div className="text-2xl mb-2">✅</div>
                              <p className="text-emerald-400 text-xs font-bold uppercase tracking-wider">Repo Fetched</p>
                            </div>
                            <div className="text-center p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-xl animate-pulse">
                              <div className="text-2xl mb-2">⚡</div>
                              <p className="text-indigo-400 text-xs font-bold uppercase tracking-wider">AI Analyzing</p>
                            </div>
                            <div className="text-center p-4 bg-slate-800 border border-slate-700 rounded-xl opacity-40">
                              <div className="text-2xl mb-2">🎯</div>
                              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Guide Ready</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {selectedFile && (
                      <div className="bg-slate-900/40 border border-slate-800 rounded-[3rem] p-12 shadow-2xl animate-in fade-in duration-500">
                         <div className="flex justify-between items-center mb-8">
                            <h3 className="text-xl font-black text-white flex items-center gap-3"><Code className="w-6 h-6 text-indigo-400" /> {selectedFile.name}</h3>
                            <div className="flex gap-4">
                               <button onClick={() => handleLabTask('refactor')} className="px-4 py-2 bg-slate-800 hover:bg-indigo-600 text-[10px] font-black uppercase rounded-xl transition-all">Refactor</button>
                               <button onClick={() => handleLabTask('test')} className="px-4 py-2 bg-slate-800 hover:bg-emerald-600 text-[10px] font-black uppercase rounded-xl transition-all">Generate Tests</button>
                            </div>
                         </div>
                         {fileLoading ? <Loader message="Analyzing implementation..." /> : (
                           <div className="space-y-6">
                              <p className="text-slate-400 leading-relaxed italic">{fileExplanation}</p>
                              <pre className="p-6 bg-black/40 rounded-2xl overflow-x-auto text-[10px] text-indigo-300 border border-slate-800">
                                <code>{fileContent}</code>
                              </pre>
                              {/* Wave 17: Code Intelligence Extractor */}
                              {selectedFile && fileContent && (
                                <CodeExtractor
                                  fileName={selectedFile.name}
                                  fileContent={fileContent}
                                  onExtract={handleExtractCodeIntelligence}
                                  loading={codeExtractionLoading}
                                />
                              )}
                           </div>
                         )}
                      </div>
                    )}

                    {/* Wave 21: Smart Upgrade Nudge (free tier, after analysis) */}
                    {analysis && dailyUsage && !nudgeDismissed && subscription.plan === 'free' && (
                      <SmartUpgradeNudge
                        used={dailyUsage.used}
                        limit={dailyUsage.limit}
                        plan={subscription.plan}
                        onUpgrade={() => setShowPricing(true)}
                        onDismiss={() => setNudgeDismissed(true)}
                      />
                    )}
                 </div>
               )}

               {activeTab === 'insights' && (
                 <div className="space-y-10 animate-in fade-in duration-700">
                    {insightsLoading ? (
                      <div className="h-[70vh] flex flex-col items-center justify-center space-y-8">
                        <Loader message="Analyzing project health..." />
                      </div>
                    ) : insights ? (
                      <>
                        {/* Issues & PRs Overview */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                          <div className="bg-slate-900/40 border border-slate-800 rounded-[3rem] p-10 shadow-2xl">
                            <h3 className="text-2xl font-black text-white mb-6 flex items-center gap-4">
                              <Bug className="w-6 h-6 text-rose-500" /> Issues Intelligence
                            </h3>
                            <div className="mb-8 flex gap-8">
                              <div>
                                <div className="text-4xl font-black text-white mb-2">{insights.issues.length}</div>
                                <div className="text-xs text-slate-500 uppercase tracking-wider">Total</div>
                              </div>
                              <div>
                                <div className="text-4xl font-black text-emerald-500 mb-2">
                                  {insights.issues.filter(i => i.state === 'open').length}
                                </div>
                                <div className="text-xs text-slate-500 uppercase tracking-wider">Open</div>
                              </div>
                            </div>
                            {renderInsightSummary(insights.issuesSummary)}
                            <div className="space-y-3 max-h-[300px] overflow-y-auto">
                              {insights.issues.slice(0, 5).map(issue => (
                                <div key={issue.number} className="p-4 bg-slate-950 rounded-xl border border-slate-800 hover:border-indigo-500/50 transition-all">
                                  <div className="flex items-start justify-between mb-2">
                                    <span className="text-white font-bold text-sm">#{issue.number}</span>
                                    <span className={`px-2 py-1 rounded text-[8px] font-black uppercase ${issue.state === 'open' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                                      {issue.state}
                                    </span>
                                  </div>
                                  <div className="text-slate-300 text-sm mb-2">{issue.title}</div>
                                  <div className="flex gap-2 flex-wrap">
                                    {issue.labels.slice(0, 3).map(label => (
                                      <span key={label} className="px-2 py-1 bg-indigo-500/10 text-indigo-400 rounded text-[8px]">{label}</span>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="bg-slate-900/40 border border-slate-800 rounded-[3rem] p-10 shadow-2xl">
                            <h3 className="text-2xl font-black text-white mb-6 flex items-center gap-4">
                              <GitPullRequest className="w-6 h-6 text-indigo-500" /> Pull Requests
                            </h3>
                            <div className="mb-8 flex gap-8">
                              <div>
                                <div className="text-4xl font-black text-white mb-2">{insights.pullRequests.length}</div>
                                <div className="text-xs text-slate-500 uppercase tracking-wider">Total</div>
                              </div>
                              <div>
                                <div className="text-4xl font-black text-indigo-500 mb-2">
                                  {insights.pullRequests.filter(pr => pr.state === 'merged').length}
                                </div>
                                <div className="text-xs text-slate-500 uppercase tracking-wider">Merged</div>
                              </div>
                            </div>
                            {renderInsightSummary(insights.prSummary)}
                            <div className="space-y-3 max-h-[300px] overflow-y-auto">
                              {insights.pullRequests.slice(0, 5).map(pr => (
                                <div key={pr.number} className="p-4 bg-slate-950 rounded-xl border border-slate-800 hover:border-indigo-500/50 transition-all">
                                  <div className="flex items-start justify-between mb-2">
                                    <span className="text-white font-bold text-sm">#{pr.number}</span>
                                    <span className={`px-2 py-1 rounded text-[8px] font-black uppercase ${pr.state === 'merged' ? 'bg-purple-500/20 text-purple-400' : pr.state === 'open' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                                      {pr.state}
                                    </span>
                                  </div>
                                  <div className="text-slate-300 text-sm mb-2">{pr.title}</div>
                                  <div className="flex gap-4 text-xs text-slate-500">
                                    <span className="text-emerald-400">+{pr.additions}</span>
                                    <span className="text-rose-400">-{pr.deletions}</span>
                                    <span>{pr.changed_files} files</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Contributors */}
                        <div className="bg-slate-900/40 border border-slate-800 rounded-[3rem] p-10 shadow-2xl">
                          <h3 className="text-2xl font-black text-white mb-6 flex items-center gap-4">
                            <Users className="w-6 h-6 text-indigo-400" /> Team Dynamics
                          </h3>
                          {renderInsightSummary(insights.teamDynamics)}
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            {insights.contributors.slice(0, 10).map(contrib => (
                              <div key={contrib.login} className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-center hover:border-indigo-500/50 transition-all">
                                <img src={contrib.avatar_url} alt={contrib.login} className="w-16 h-16 rounded-full mx-auto mb-3 border-2 border-indigo-500/30" />
                                <div className="text-white font-bold text-sm truncate">{contrib.login}</div>
                                <div className="text-indigo-400 text-xs font-black">{contrib.contributions} commits</div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Dependencies */}
                        {insights.dependencies.length > 0 && (
                          <div className="bg-slate-900/40 border border-slate-800 rounded-[3rem] p-10 shadow-2xl">
                            <h3 className="text-2xl font-black text-white mb-6 flex items-center gap-4">
                              <Package className="w-6 h-6 text-amber-500" /> Dependencies ({insights.dependencies.length})
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto">
                              {insights.dependencies.map((dep, idx) => (
                                <div key={idx} className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                                  <div className="text-white font-bold text-sm mb-1">{dep.name}</div>
                                  <div className="text-slate-400 text-xs mono">{dep.currentVersion}</div>
                                  {dep.isOutdated && (
                                    <div className="mt-2 px-2 py-1 bg-amber-500/10 text-amber-400 rounded text-[8px] font-black">
                                      OUTDATED
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Code Health */}
                        <div className="bg-slate-900/40 border border-slate-800 rounded-[3rem] p-10 shadow-2xl">
                          <h3 className="text-2xl font-black text-white mb-6 flex items-center gap-4">
                            <Activity className="w-6 h-6 text-emerald-500" /> Code Health
                          </h3>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                            <div>
                              <div className="text-4xl font-black text-white mb-2">{insights.codeHealth.totalFiles}</div>
                              <div className="text-xs text-slate-500 uppercase tracking-wider">Files</div>
                            </div>
                            <div>
                              <div className="text-4xl font-black text-white mb-2">
                                {(insights.codeHealth.totalLines / 1000).toFixed(1)}K
                              </div>
                              <div className="text-xs text-slate-500 uppercase tracking-wider">Lines of Code</div>
                            </div>
                            <div>
                              <div className="text-4xl font-black text-indigo-500 mb-2 capitalize">
                                {insights.codeHealth.complexity}
                              </div>
                              <div className="text-xs text-slate-500 uppercase tracking-wider">Complexity</div>
                            </div>
                            <div>
                              <div className="text-4xl font-black text-emerald-500 mb-2">
                                {insights.codeHealth.commitFrequency}
                              </div>
                              <div className="text-xs text-slate-500 uppercase tracking-wider">Activity</div>
                            </div>
                          </div>
                          <div className="mt-8">
                            <h4 className="text-xs font-black uppercase text-slate-500 mb-4 tracking-wider">Language Distribution</h4>
                            <div className="space-y-3">
                              {Object.entries(insights.codeHealth.languages)
                                .filter(([, value]) => typeof value === 'number')
                                .slice(0, 5)
                                .map(([lang, bytes]) => {
                                const percentage = (bytes / insights.codeHealth.totalLines) * 100;
                                return (
                                  <div key={lang}>
                                    <div className="flex justify-between text-sm mb-1">
                                      <span className="text-white font-bold">{lang}</span>
                                      <span className="text-slate-400">{percentage.toFixed(1)}%</span>
                                    </div>
                                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                      <div className="h-full bg-indigo-500" style={{ width: `${percentage}%` }}></div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="h-[400px] flex flex-col items-center justify-center opacity-30">
                        <TrendingUp className="w-24 h-24 mb-8 text-slate-700" />
                        <p className="text-slate-600 font-bold">Click Insights tab to load project intelligence</p>
                      </div>
                    )}
                 </div>
               )}

               {activeTab === 'pr-review' && (
                 <div className="space-y-8 animate-in fade-in duration-700">
                   <div className="bg-slate-900/40 border border-slate-800 rounded-[3rem] p-10 shadow-2xl">
                     <div className="flex flex-wrap items-start justify-between gap-6 mb-8">
                       <div>
                         <h2 className="text-3xl font-black text-white tracking-tighter flex items-center gap-3">
                           <ClipboardCheck className="w-8 h-8 text-indigo-400" /> PR Review Copilot
                         </h2>
                         <p className="text-slate-400 text-sm mt-3 max-w-3xl">
                           Paste a pull request URL or number to generate a review summary, risk level, findings, missing tests, and security checks.
                         </p>
                       </div>
                       {prReviewMeta && (
                         <div className="px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
                           Reviewing #{prReviewMeta.number} • {prReviewMeta.fileCount} changed files
                         </div>
                       )}
                     </div>

                     <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
                       <input
                         value={prReviewUrl}
                         onChange={(e) => setPrReviewUrl(e.target.value)}
                         placeholder="Example: https://github.com/owner/repo/pull/123 or just 123"
                         className="lg:col-span-5 bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-sm text-white placeholder:text-slate-500 outline-none"
                       />
                       <button
                         onClick={() => { void handleRunPrReview(); }}
                         disabled={prReviewLoading || !repo || !analysis}
                         className="lg:col-span-1 px-5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-40"
                       >
                         {prReviewLoading ? 'Reviewing...' : 'Run Review'}
                       </button>
                     </div>
                   </div>

                   {authUser && (prReviewHistory.length > 0 || prHistoryLoading) && !prReviewResult && !prReviewLoading && (
                     <div className="bg-slate-900/40 border border-slate-800 rounded-[3rem] p-10 shadow-2xl">
                       <h4 className="text-lg font-black text-white mb-6 flex items-center gap-3">
                         <Activity className="w-5 h-5 text-indigo-400" /> Past Reviews
                       </h4>
                       {prHistoryLoading ? (
                         <div className="space-y-3">
                           {[1, 2, 3].map((i) => (
                             <div key={i} className="h-14 bg-slate-800/50 rounded-2xl animate-pulse" />
                           ))}
                         </div>
                       ) : (
                         <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                           {prReviewHistory.map((r) => (
                             <button
                               key={r.id}
                               onClick={() => {
                                 setPrReviewUrl(`https://github.com/${r.repoOwner}/${r.repoName}/pull/${r.prNumber}`);
                               }}
                               className="w-full text-left bg-slate-950/60 hover:bg-slate-800/60 border border-slate-800 hover:border-indigo-500/40 rounded-2xl p-4 transition-all group"
                             >
                               <div className="flex items-center justify-between mb-1">
                                 <span className="text-white font-bold text-sm group-hover:text-indigo-300 transition-colors">
                                   {r.repoOwner}/{r.repoName} #{r.prNumber}
                                 </span>
                                 <span className={`text-[9px] px-2 py-1 rounded font-black uppercase tracking-widest ${
                                   r.riskLevel === 'high'
                                     ? 'bg-rose-500/15 text-rose-300'
                                     : r.riskLevel === 'medium'
                                       ? 'bg-amber-500/15 text-amber-300'
                                       : 'bg-emerald-500/15 text-emerald-300'
                                 }`}>
                                   {r.riskLevel}
                                 </span>
                               </div>
                               <p className="text-slate-500 text-xs line-clamp-1">{r.prTitle}</p>
                               <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-600">
                                 <span>{r.fileCount} files</span>
                                 <span>•</span>
                                 <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                               </div>
                             </button>
                           ))}
                         </div>
                       )}
                     </div>
                   )}

                   {prReviewLoading && (
                     <div className="bg-slate-900/40 border border-slate-800 rounded-[3rem] p-12 shadow-2xl">
                       <Loader message="Analyzing pull request changes..." />
                     </div>
                   )}

                   {!prReviewLoading && prReviewResult && (
                     <>
                       <div className="bg-slate-900/40 border border-slate-800 rounded-[3rem] p-10 shadow-2xl space-y-6">
                         <div className="flex flex-wrap items-start justify-between gap-4">
                           <div>
                             <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">Overall Summary</div>
                             <h3 className="text-xl font-black text-white">
                               {prReviewMeta?.title || 'Pull Request Review'}
                             </h3>
                           </div>
                           <span
                             className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                               prReviewResult.riskLevel === 'high'
                                 ? 'bg-rose-500/15 text-rose-300 border border-rose-500/40'
                                 : prReviewResult.riskLevel === 'medium'
                                   ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40'
                                   : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40'
                             }`}
                           >
                             Risk: {prReviewResult.riskLevel}
                           </span>
                         </div>
                         <p className="text-slate-300 text-sm leading-relaxed">{prReviewResult.summary}</p>
                         {prReviewResult.overallComments.length > 0 && (
                           <ul className="space-y-2">
                             {prReviewResult.overallComments.map((comment, index) => (
                               <li key={index} className="text-slate-300 text-sm flex gap-2">
                                 <span className="text-indigo-400">•</span>
                                 <span>{comment}</span>
                               </li>
                             ))}
                           </ul>
                         )}

                         {/* Wave 10: GitHub PR Comment Bot */}
                         {prReviewMeta && repo && (
                           <div className="border-t border-slate-800 pt-5 space-y-3">
                             {prCommentPosted && prCommentUrl ? (
                               <div className="flex items-center gap-3 px-4 py-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                                 <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                 <span className="text-emerald-300 text-xs font-bold flex-1">Review posted to GitHub!</span>
                                 <a
                                   href={prCommentUrl}
                                   target="_blank"
                                   rel="noopener noreferrer"
                                   className="text-xs text-emerald-400 underline hover:no-underline shrink-0"
                                 >
                                   View comment →
                                 </a>
                               </div>
                             ) : (
                               <>
                                 <button
                                   onClick={() => void handlePostPRComment(prCommentCustomToken || undefined)}
                                   disabled={prCommentPosting}
                                   className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-sm font-bold text-white transition-all shadow-lg shadow-indigo-500/20"
                                 >
                                   <MessageSquare className="w-4 h-4" />
                                   {prCommentPosting ? 'Posting…' : 'Post Review to GitHub'}
                                 </button>
                                 {prCommentError && (
                                   <p className="text-xs text-rose-400 flex items-center gap-1">
                                     <AlertTriangle className="w-3 h-3 shrink-0" />
                                     {prCommentError}
                                   </p>
                                 )}
                                 {showPrTokenInput && (
                                   <div className="flex items-center gap-2 mt-2">
                                     <input
                                       type="password"
                                       placeholder="Paste GitHub PAT with repo scope…"
                                       value={prCommentCustomToken}
                                       onChange={e => setPrCommentCustomToken(e.target.value)}
                                       className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                                     />
                                     <button
                                       onClick={() => void handlePostPRComment(prCommentCustomToken)}
                                       disabled={!prCommentCustomToken || prCommentPosting}
                                       className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-xl text-xs font-bold text-white transition-all"
                                     >
                                       Post
                                     </button>
                                   </div>
                                 )}
                               </>
                             )}
                           </div>
                         )}
                       </div>

                       {prReviewFiles.length > 0 && (
                         <div className="bg-slate-900/40 border border-slate-800 rounded-[3rem] p-10 shadow-2xl">
                           <div className="flex items-center justify-between mb-6">
                             <h4 className="text-lg font-black text-white">Changed Files ({prReviewFiles.length})</h4>
                             {prReviewFiles.some(f => f.patch) && (
                               <button onClick={() => setShowDiffViewer(true)} className="flex items-center gap-2 px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 rounded-xl text-xs font-bold text-cyan-400 transition-all">
                                 <Code className="w-3 h-3" /> View Diff
                               </button>
                             )}
                           </div>
                           <div className="space-y-1 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                             {prReviewFiles.map((f) => (
                               <div key={f.filename} className="flex items-center justify-between px-4 py-2 rounded-xl hover:bg-slate-800/40 transition-colors group">
                                 <div className="flex items-center gap-2 min-w-0">
                                   <span className={`text-[9px] font-black uppercase w-14 text-center px-1 py-0.5 rounded ${
                                     f.status === 'added' ? 'bg-emerald-500/15 text-emerald-400'
                                     : f.status === 'removed' ? 'bg-rose-500/15 text-rose-400'
                                     : f.status === 'renamed' ? 'bg-sky-500/15 text-sky-400'
                                     : 'bg-amber-500/15 text-amber-400'
                                   }`}>{f.status}</span>
                                   <span className="text-slate-300 text-xs truncate">{f.filename}</span>
                                 </div>
                                 <div className="flex items-center gap-2 text-[10px] font-mono shrink-0">
                                   {f.additions > 0 && <span className="text-emerald-400">+{f.additions}</span>}
                                   {f.deletions > 0 && <span className="text-rose-400">-{f.deletions}</span>}
                                 </div>
                               </div>
                             ))}
                           </div>
                         </div>
                       )}

                       <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                         <div className="bg-slate-900/40 border border-slate-800 rounded-[3rem] p-10 shadow-2xl">
                           <h4 className="text-lg font-black text-white mb-6">Findings</h4>
                           <div className="space-y-4 max-h-[560px] overflow-y-auto pr-2 custom-scrollbar">
                             {prReviewResult.findings.map((finding, index) => (
                               <div key={`${finding.file}-${index}`} className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                                 <div className="flex items-center justify-between gap-3">
                                   <span className="text-xs font-black uppercase tracking-wider text-slate-400">{finding.file}</span>
                                   <span className={`text-[9px] px-2 py-1 rounded font-black uppercase tracking-widest ${
                                     finding.severity === 'high'
                                       ? 'bg-rose-500/15 text-rose-300'
                                       : finding.severity === 'medium'
                                         ? 'bg-amber-500/15 text-amber-300'
                                         : 'bg-emerald-500/15 text-emerald-300'
                                   }`}>
                                     {finding.severity}
                                   </span>
                                 </div>
                                 <div className="text-white font-bold text-sm">{finding.title}</div>
                                 <p className="text-slate-400 text-sm leading-relaxed">{finding.rationale}</p>
                                 <div className="p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/20 text-indigo-200 text-xs leading-relaxed">
                                   {finding.recommendation}
                                 </div>
                                 {/* AI Fix Snippet */}
                                 {(() => {
                                   const fkey = `${finding.file}-${index}`;
                                   const fix = fixSnippets[fkey];
                                   if (fix === 'loading') {
                                     return (
                                       <div className="flex items-center gap-2 text-xs text-slate-500">
                                         <div className="w-3 h-3 border border-indigo-500 border-t-transparent rounded-full animate-spin" />
                                         Generating fix...
                                       </div>
                                     );
                                   }
                                   if (fix && typeof fix === 'object') {
                                     return (
                                       <div className="space-y-2">
                                         <p className="text-emerald-300 text-xs">{fix.explanation}</p>
                                         <div className="relative bg-black/60 border border-slate-700 rounded-xl overflow-hidden">
                                           <div className="flex items-center justify-between px-4 py-1.5 border-b border-slate-800">
                                             <span className="text-[9px] font-bold text-slate-600 uppercase">{fix.language}</span>
                                             <button
                                               onClick={() => navigator.clipboard.writeText(fix.code).catch(() => {})}
                                               className="text-[9px] font-bold text-slate-600 hover:text-indigo-400 transition-colors flex items-center gap-1"
                                             ><Copy className="w-2.5 h-2.5" /> Copy</button>
                                           </div>
                                           <pre className="p-4 text-xs text-slate-300 overflow-x-auto whitespace-pre-wrap leading-relaxed custom-scrollbar">{fix.code}</pre>
                                         </div>
                                       </div>
                                     );
                                   }
                                   return (
                                     <button
                                       onClick={() => handleGetFix(fkey, { file: finding.file, title: finding.title, rationale: finding.rationale, recommendation: finding.recommendation })}
                                       className="flex items-center gap-1.5 text-[10px] font-bold text-violet-400 hover:text-violet-300 transition-colors"
                                     >
                                       <Wand2 className="w-3 h-3" /> Get AI Fix
                                     </button>
                                   );
                                 })()}
                               </div>
                             ))}
                           </div>
                         </div>

                         <div className="space-y-8">
                           <div className="bg-slate-900/40 border border-slate-800 rounded-[3rem] p-10 shadow-2xl">
                             <h4 className="text-lg font-black text-white mb-5">Missing Tests</h4>
                             <ul className="space-y-2">
                               {prReviewResult.missingTests.length > 0 ? prReviewResult.missingTests.map((test, index) => (
                                 <li key={index} className="text-slate-300 text-sm flex gap-2">
                                   <span className="text-emerald-400">•</span>
                                   <span>{test}</span>
                                 </li>
                               )) : (
                                 <li className="text-slate-500 text-sm">No additional missing tests flagged.</li>
                               )}
                             </ul>
                           </div>

                           <div className="bg-slate-900/40 border border-slate-800 rounded-[3rem] p-10 shadow-2xl">
                             <h4 className="text-lg font-black text-white mb-5">Security Checks</h4>
                             <ul className="space-y-2">
                               {prReviewResult.securityChecks.length > 0 ? prReviewResult.securityChecks.map((item, index) => (
                                 <li key={index} className="text-slate-300 text-sm flex gap-2">
                                   <span className="text-amber-400">•</span>
                                   <span>{item}</span>
                                 </li>
                               )) : (
                                 <li className="text-slate-500 text-sm">No specific security checks suggested.</li>
                               )}
                             </ul>
                           </div>

                           <div className="bg-slate-900/40 border border-slate-800 rounded-[3rem] p-10 shadow-2xl">
                             <h4 className="text-lg font-black text-white mb-5">Suggested Reviewer Questions</h4>
                             <ul className="space-y-2">
                               {prReviewResult.suggestedQuestions.length > 0 ? prReviewResult.suggestedQuestions.map((question, index) => (
                                 <li key={index} className="text-slate-300 text-sm flex gap-2">
                                   <span className="text-indigo-400">•</span>
                                   <span>{question}</span>
                                 </li>
                               )) : (
                                 <li className="text-slate-500 text-sm">No follow-up questions suggested.</li>
                               )}
                             </ul>
                           </div>
                         </div>
                       </div>
                     </>
                   )}

                   {/* Wave 19: PR Merge Predictor */}
                   <PRMergePredictor
                     onPredict={handlePredictPRMerge}
                     loading={prPredictLoading}
                     repoName={repo ? `${repo.owner}/${repo.repo}` : undefined}
                   />
                 </div>
               )}

               {activeTab === 'blueprint' && (
                 <>
                 <div className="grid grid-cols-12 gap-8 items-stretch">
                   <div className="col-span-12 lg:col-span-8 bg-slate-900/40 border border-slate-800 rounded-[3rem] p-0 shadow-2xl min-h-[500px] h-[600px] lg:h-[750px] relative overflow-hidden flex flex-col">
                      <div className="p-8 sm:p-10 pb-6 flex flex-wrap items-center justify-between gap-4">
                         <div>
                           <h2 className="text-3xl font-black text-white tracking-tighter">Dynamic Architecture</h2>
                           <p className="text-xs text-slate-500 mt-2">AI-guided walkthrough with live node highlights.</p>
                         </div>
                         <div className="flex flex-wrap items-center gap-3">
                           <button
                             onClick={handleAutoLayout}
                             className="text-[10px] font-black uppercase bg-slate-900 border border-slate-800 px-4 py-2 rounded-lg hover:text-emerald-400 transition-colors"
                           >
                             Auto Layout
                           </button>
                           <button
                             onClick={() => window.dispatchEvent(new Event('resize'))}
                             className="text-[10px] font-black uppercase bg-slate-900 border border-slate-800 px-4 py-2 rounded-lg hover:text-indigo-400 transition-colors"
                           >
                             Reset View
                           </button>
                           <button
                             onClick={() => {
                               if (!tourAutoPlay) {
                                 setTourStepIndex(0);
                                 setTourHasAutoPlayed(false);
                                 setTourAutoPlay(true);
                               } else {
                                 setTourAutoPlay(false);
                               }
                             }}
                             className="text-[10px] font-black uppercase bg-amber-500/10 border border-amber-500/30 text-amber-400 px-4 py-2 rounded-lg hover:text-white transition-colors"
                           >
                             {tourAutoPlay ? 'Pause Tour' : 'Play Tour'}
                           </button>
                         </div>
                      </div>
                      {nodes.length > 0 ? (
                        <div className="blueprint-grid flex-grow relative bg-slate-950/50">
                           <ReactFlowProvider>
                              <BlueprintGraph nodes={highlightedNodes} edges={highlightedEdges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} />
                           </ReactFlowProvider>
                        </div>
                      ) : (
                        <div className="flex-grow flex flex-col items-center justify-center opacity-40">
                          <Activity className="w-20 h-20 text-slate-700 mb-6" />
                          <p className="text-slate-500 text-lg font-bold">Architecture diagram loading...</p>
                          <p className="text-slate-600 text-sm mt-2">AI is generating the architecture graph</p>
                        </div>
                      )}
                   </div>

                   <div className="col-span-12 lg:col-span-4 bg-slate-900/40 border border-slate-800 rounded-[3rem] p-8 sm:p-10 shadow-2xl flex flex-col overflow-hidden lg:max-h-[750px]">
                      <div className="flex items-start justify-between gap-4 mb-6">
                        <div>
                          <h3 className="text-xl font-black text-white">Architecture Tour</h3>
                          <p className="text-xs text-slate-500 mt-2">
                            {analysis?.architectureTour?.summary || 'Follow the guided steps to understand the system flow.'}
                          </p>
                        </div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                          Step {tourSteps.length ? tourStepIndex + 1 : 0}/{tourSteps.length}
                        </div>
                      </div>

                      {activeTourStep ? (
                        <div className="mb-4 p-5 bg-slate-950 rounded-2xl border border-amber-500/20 flex-shrink-0 max-h-[260px] overflow-y-auto custom-scrollbar">
                          <div className="text-[10px] font-black uppercase tracking-widest text-amber-400 mb-3">
                            {analysis?.architectureTour?.title || 'Guided Walkthrough'}
                          </div>
                          <h4 className="text-white font-bold mb-3">{activeTourStep.title}</h4>
                          <ul className="space-y-2 pr-1">
                            {activeTourStep.bullets.map((bullet, idx) => (
                              <li key={`${activeTourStep.nodeId}-${idx}`} className="text-slate-300 text-sm leading-relaxed flex gap-2">
                                <span className="text-amber-400 mt-1">•</span>
                                <span>{bullet}</span>
                              </li>
                            ))}
                          </ul>
                          <div className="flex items-center gap-3 mt-4">
                            <button
                              onClick={() => handleTourStepChange(tourStepIndex - 1)}
                              disabled={tourStepIndex === 0}
                              className="px-3 py-2 text-[10px] font-black uppercase bg-slate-900 border border-slate-800 rounded-lg text-slate-400 disabled:opacity-40"
                            >
                              Prev
                            </button>
                            <button
                              onClick={() => handleTourStepChange(tourStepIndex + 1)}
                              disabled={tourStepIndex >= tourSteps.length - 1}
                              className="px-3 py-2 text-[10px] font-black uppercase bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400 disabled:opacity-40"
                            >
                              Next
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex-grow flex flex-col items-center justify-center opacity-40">
                          <Rocket className="w-16 h-16 mb-4 text-slate-700" />
                          <p className="text-slate-500 text-sm font-bold">Tour steps are loading...</p>
                        </div>
                      )}

                      <div className="flex-grow overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                        {tourSteps.map((step, index) => (
                          <button
                            key={`${step.nodeId}-${index}`}
                            onClick={() => handleTourStepChange(index)}
                            className={`w-full text-left p-4 rounded-2xl border transition-all ${
                              index === tourStepIndex
                                ? 'bg-amber-500/10 border-amber-500/40 text-amber-200'
                                : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-indigo-500/40'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-black uppercase tracking-widest">Step {index + 1}</span>
                              {index === tourStepIndex && (
                                <span className="text-[9px] font-black uppercase tracking-widest text-amber-400">Active</span>
                              )}
                            </div>
                            <div className="mt-2 text-sm font-bold">{step.title}</div>
                          </button>
                        ))}
                      </div>
                   </div>
                 </div>

                 {/* Wave 16: AI Architecture Diagram */}
                 {repo && (
                   <ArchitectureDiagram
                     diagram={archDiagram}
                     loading={archDiagramLoading}
                     onGenerate={handleGenerateArchDiagram}
                     repoName={`${repo.owner}/${repo.repo}`}
                   />
                 )}
                 </>
               )}

               {activeTab === 'audit' && (
                 <div className="bg-slate-900 border-2 border-amber-500/20 rounded-[3rem] p-12 shadow-2xl animate-in zoom-in-95 duration-500 min-h-[600px]">
                    <h2 className="text-3xl font-black text-white tracking-tighter mb-12 flex items-center gap-4">
                       <BrainCircuit className="w-8 h-8 text-amber-500" /> Strategic Audit Analysis
                    </h2>
                    {auditLoading ? (
                       <div className="flex-grow flex flex-col items-center justify-center space-y-8 h-[400px]">
                          <div className="w-24 h-24 border-8 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
                          <p className="text-xl font-black text-amber-500 animate-pulse uppercase tracking-[0.4em]">CTO Thinking...</p>
                       </div>
                    ) : deepAudit ? (
                       <div className="space-y-12">
                          <div className="bg-slate-950 p-10 rounded-[2.5rem] border border-slate-800">
                             <h4 className="text-[10px] font-black uppercase text-amber-400 mb-6 tracking-widest">Internal Reasoning Log</h4>
                             <p className="text-slate-400 leading-loose italic">{deepAudit.reasoning}</p>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                             <div className="p-8 bg-rose-500/5 border border-rose-500/20 rounded-[2rem]">
                                <div className="flex items-center justify-between gap-3 mb-6">
                                  <h4 className="text-[10px] font-black uppercase text-rose-500 tracking-widest">Logic Vulnerabilities</h4>
                                  <button
                                    onClick={() => { void copyAuditTriageSummary(); }}
                                    className="px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider bg-slate-900 border border-slate-700 text-slate-200"
                                  >
                                    Copy Triage Summary
                                  </button>
                                </div>
                                <ul className="space-y-4">
                                   {deepAudit.vulnerabilities.map((v, i) => (
                                      <li key={i} className="text-sm text-slate-300 rounded-2xl border border-rose-500/20 bg-slate-950/60 p-4 space-y-3">
                                        <div className="flex gap-3"><Zap className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" /> <span>{v}</span></div>
                                        <div className="flex flex-wrap items-center gap-2">
                                          <span className={`px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider font-black border ${statusClassByType[getFindingStatus(i)]}`}>
                                            {getFindingStatus(i)}
                                          </span>
                                          <button onClick={() => setFindingStatusAt(i, 'confirmed')} className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-amber-500/15 border border-amber-500/30 text-amber-300">Confirm</button>
                                          <button onClick={() => setFindingStatusAt(i, 'false-positive')} className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-indigo-500/15 border border-indigo-500/30 text-indigo-300">False Positive</button>
                                          <button onClick={() => setFindingStatusAt(i, 'resolved')} className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">Resolved</button>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                          <button
                                            onClick={() => { void handleGenerateRemediation(v, i); }}
                                            disabled={Boolean(remediationLoading[i])}
                                            className="px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 disabled:opacity-50"
                                          >
                                            {remediationLoading[i] ? 'Generating...' : remediationPlans[i] ? 'Refresh Plan' : 'Generate Remediation Plan'}
                                          </button>
                                          {remediationPlans[i] && (
                                            <>
                                              <button
                                                onClick={() => copyToClipboard(remediationPlans[i].safePrompt, `remediation prompt #${i + 1}`)}
                                                className="px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider bg-emerald-600/20 border border-emerald-500/30 text-emerald-300"
                                              >
                                                Copy Fix Prompt
                                              </button>
                                              <button
                                                onClick={() => openIssueDraft(v, remediationPlans[i], i)}
                                                className="px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider bg-slate-900 border border-slate-700 text-slate-200"
                                              >
                                                Create GitHub Issue
                                              </button>
                                            </>
                                          )}
                                        </div>
                                        {remediationPlans[i] && (
                                          <div className="mt-3 rounded-xl border border-slate-700 bg-slate-900/70 p-4 space-y-3">
                                            <div className="flex flex-wrap items-center gap-3 text-[10px] uppercase tracking-wider font-black">
                                              <span className="text-indigo-300">{remediationPlans[i].title}</span>
                                              <span className="text-rose-300">Severity: {remediationPlans[i].severity}</span>
                                              <span className="text-amber-300">Confidence: {remediationPlans[i].confidence}%</span>
                                            </div>
                                            {remediationPlans[i].affectedFiles.length > 0 && (
                                              <div>
                                                <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Likely Files</p>
                                                <p className="text-xs text-slate-300">{remediationPlans[i].affectedFiles.join(', ')}</p>
                                              </div>
                                            )}
                                            <div>
                                              <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Fix Steps</p>
                                              <ul className="space-y-1">
                                                {remediationPlans[i].fixSteps.map((step, stepIndex) => (
                                                  <li key={stepIndex} className="text-xs text-slate-300">• {step}</li>
                                                ))}
                                              </ul>
                                            </div>
                                            <div>
                                              <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Verify</p>
                                              <ul className="space-y-1">
                                                {remediationPlans[i].verificationSteps.map((step, stepIndex) => (
                                                  <li key={stepIndex} className="text-xs text-slate-300">• {step}</li>
                                                ))}
                                              </ul>
                                            </div>
                                          </div>
                                        )}
                                      </li>
                                   ))}
                                </ul>
                             </div>
                             <div className="p-8 bg-indigo-500/5 border border-indigo-500/20 rounded-[2rem]">
                                <h4 className="text-[10px] font-black uppercase text-indigo-400 mb-6 tracking-widest">Architectural Moat</h4>
                                <p className="text-sm text-slate-300 leading-relaxed">{deepAudit.architecturalDebt}</p>
                             </div>
                          </div>
                       </div>
                    ) : (
                       <div className="flex-grow flex flex-col items-center justify-center opacity-30 h-[400px]">
                          <BrainCircuit className="w-24 h-24 mb-8 text-slate-700" />
                          <button onClick={runAudit} className="px-8 py-4 bg-amber-600/20 border border-amber-500/30 text-amber-400 font-black rounded-2xl">Trigger Deep Reasoning</button>
                       </div>
                    )}

                    {/* Wave 18: OWASP Agentic Security Scanner */}
                    <div className="mt-10">
                      <AgenticSecurityScanner
                        onScan={handleScanAgenticRisks}
                        loading={agenticScanLoading}
                      />
                    </div>

                    {/* Wave 18: AI Test Coverage Estimator */}
                    <div className="mt-8">
                      <TestCoverageCard
                        onEstimate={handleEstimateTestCoverage}
                        loading={testCoverageLoading}
                        repoName={repo ? `${repo.owner}/${repo.repo}` : undefined}
                      />
                    </div>

                    {/* Wave 19: Supply Chain Deep Scan (ASI04) */}
                    <div className="mt-8">
                      <SupplyChainScanner
                        onScan={handleScanSupplyChain}
                        loading={supplyChainLoading}
                      />
                    </div>

                    {/* Wave 19: Dependency Intelligence Panel */}
                    <div className="mt-8">
                      <DependencyIntelligence
                        onAnalyze={handleAnalyzeDependencyIntelligence}
                        loading={depIntelLoading}
                        repoName={repo ? `${repo.owner}/${repo.repo}` : undefined}
                      />
                    </div>

                    {/* Wave 19: AI Bill of Materials Generator */}
                    <div className="mt-8">
                      <AIBOMGenerator
                        onGenerate={handleGenerateAIBOM}
                        loading={aibomLoading}
                        repoName={repo ? `${repo.owner}/${repo.repo}` : undefined}
                      />
                    </div>

                    {/* Wave 20: Invariant Checker (ASI01/ASI04 guard) */}
                    <div className="mt-8">
                      <InvariantChecker
                        onCheck={handleRunInvariantCheck}
                        loading={invariantLoading}
                        repoName={repo ? `${repo.owner}/${repo.repo}` : undefined}
                        goal={repo ? `Analyze and provide structured intelligence for ${repo.owner}/${repo.repo}` : undefined}
                      />
                    </div>

                    {/* Wave 20: Dead Code Detector */}
                    <div className="mt-8">
                      <DeadCodeDetector
                        onAnalyze={handleDetectDeadCode}
                        loading={deadCodeLoading}
                        repoName={repo ? `${repo.owner}/${repo.repo}` : undefined}
                      />
                    </div>

                    {/* Wave 20: Section Confidence Panel */}
                    {sectionConfReport && (
                      <div className="mt-8">
                        <SectionConfidencePanel report={sectionConfReport} />
                      </div>
                    )}
                    {!sectionConfReport && (
                      <div className="mt-8">
                        <div className="bg-slate-900/40 border border-slate-800 rounded-[3rem] p-8 shadow-2xl">
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <h3 className="text-lg font-black text-white flex items-center gap-2 mb-1">Analysis Confidence Scores</h3>
                              <p className="text-slate-400 text-sm">Generate per-section confidence scores with data source attribution.</p>
                            </div>
                            <button
                              onClick={() => void handleGenerateSectionConfidence()}
                              disabled={sectionConfLoading || !analysis}
                              className="shrink-0 flex items-center gap-2 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 rounded-xl text-sm font-bold text-white transition-all"
                            >
                              {sectionConfLoading ? 'Generating...' : 'Generate Scores'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Wave 21: Performance Intelligence */}
                    <div className="mt-8">
                      <PerformancePack
                        onAnalyze={handleAnalyzePerformance}
                        loading={performanceLoading}
                        repoName={repo ? `${repo.owner}/${repo.repo}` : undefined}
                      />
                    </div>
                 </div>
               )}

               {activeTab === 'lab' && (
                 <div className="space-y-8 animate-in zoom-in-95 duration-500">
                   <div className="bg-slate-900/40 border border-slate-800 rounded-[3rem] p-12 shadow-2xl min-h-[400px]">
                      <h2 className="text-3xl font-black text-white tracking-tighter mb-12 flex items-center gap-4"><FlaskConical className="w-8 h-8 text-indigo-400" /> Engineering Lab</h2>
                      {labLoading ? <Loader message="Synthesizing changes..." /> : labResult ? (
                         <div className="space-y-8">
                            <pre className="p-8 bg-slate-950 rounded-[2rem] border border-slate-800 overflow-x-auto text-xs text-indigo-400"><code>{labResult}</code></pre>
                            <button onClick={() => setLabResult(null)} className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white">Clear Lab Output</button>
                         </div>
                      ) : (
                         <div className="flex-grow flex flex-col items-center justify-center opacity-30 h-[300px] text-center">
                            <Rocket className="w-20 h-20 mb-8 text-slate-700" />
                            <p className="text-lg font-black uppercase tracking-widest text-slate-600">Select a file from the explorer to begin synthesis.</p>
                         </div>
                      )}
                   </div>
                   {/* Wave 20: Refactoring Advisor */}
                   <RefactoringAdvisor
                     onGenerate={handleGenerateRefactoringPlan}
                     loading={refactorLoading}
                     repoName={repo ? `${repo.owner}/${repo.repo}` : undefined}
                   />
                 </div>
               )}

               {/* Wave 11: DevOps Tab — CI Generator + Dep Scanner */}
               {activeTab === 'devops' && (
                 <div className="space-y-8 animate-in zoom-in-95 duration-500">
                   {/* ── CI Workflow Generator ── */}
                   <div className="bg-slate-900/40 border border-slate-800 rounded-[3rem] p-10 shadow-2xl">
                     <div className="flex items-start justify-between gap-4 mb-6">
                       <div>
                         <h2 className="text-2xl font-black text-white flex items-center gap-3 mb-1">
                           <Cpu className="w-6 h-6 text-indigo-400" /> CI Workflow Generator
                         </h2>
                         <p className="text-slate-400 text-sm">Auto-generate a production-ready <code className="text-indigo-400 text-xs bg-indigo-500/10 px-1.5 py-0.5 rounded">.github/workflows/ci.yml</code> tailored to this repo&apos;s tech stack.</p>
                       </div>
                       {!ciWorkflow && !ciLoading && (
                         <button
                           onClick={() => void handleGenerateCIWorkflow()}
                           className="shrink-0 flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-bold text-white transition-all shadow-lg shadow-indigo-500/20"
                         >
                           <Zap className="w-4 h-4" /> Generate
                         </button>
                       )}
                     </div>

                     {ciLoading && <Loader message="Generating CI workflow with AI…" />}

                     {ciWorkflow && !ciLoading && (
                       <div className="space-y-4">
                         <div className="relative">
                           <pre className="p-6 bg-slate-950 border border-slate-800 rounded-2xl overflow-x-auto text-xs text-emerald-300 leading-relaxed max-h-[500px] overflow-y-auto custom-scrollbar">
                             <code>{ciWorkflow}</code>
                           </pre>
                           <button
                             onClick={() => {
                               void navigator.clipboard.writeText(ciWorkflow);
                               setCiCopied(true);
                               setTimeout(() => setCiCopied(false), 2000);
                             }}
                             className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold text-slate-300 transition-all"
                           >
                             {ciCopied ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                             {ciCopied ? 'Copied!' : 'Copy'}
                           </button>
                         </div>
                         <div className="flex flex-wrap items-center gap-3">
                           {ciCommitUrl ? (
                             <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                               <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                               <span className="text-emerald-300 text-xs font-bold">Committed!</span>
                               <a href={ciCommitUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-400 underline hover:no-underline">View on GitHub →</a>
                             </div>
                           ) : (
                             <>
                               <button
                                 onClick={() => void handleCommitCIWorkflow(ciCommitToken || undefined)}
                                 disabled={ciCommitting}
                                 className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-xl text-sm font-bold text-white transition-all"
                               >
                                 <GitBranch className="w-4 h-4" /> {ciCommitting ? 'Committing…' : 'Commit to Repo'}
                               </button>
                               <button
                                 onClick={() => void handleGenerateCIWorkflow()}
                                 disabled={ciLoading}
                                 className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold text-slate-300 transition-all"
                               >
                                 <RotateCw className="w-3.5 h-3.5" /> Regenerate
                               </button>
                             </>
                           )}
                         </div>
                         {showCiTokenInput && (
                           <div className="flex items-center gap-2 mt-1">
                             <input
                               type="password"
                               placeholder="Paste GitHub PAT with repo scope…"
                               value={ciCommitToken}
                               onChange={e => setCiCommitToken(e.target.value)}
                               className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                             />
                             <button
                               onClick={() => void handleCommitCIWorkflow(ciCommitToken)}
                               disabled={!ciCommitToken || ciCommitting}
                               className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-xl text-xs font-bold text-white transition-all"
                             >
                               Commit
                             </button>
                           </div>
                         )}
                       </div>
                     )}
                   </div>

                   {/* ── Dependency Risk Scanner ── */}
                   <div className="bg-slate-900/40 border border-slate-800 rounded-[3rem] p-10 shadow-2xl">
                     <div className="flex items-start justify-between gap-4 mb-6">
                       <div>
                         <h2 className="text-2xl font-black text-white flex items-center gap-3 mb-1">
                           <ShieldCheck className="w-6 h-6 text-amber-400" /> Dependency Risk Scanner
                         </h2>
                         <p className="text-slate-400 text-sm">AI-powered audit of your dependencies — outdated versions, known vulnerabilities, deprecated packages.</p>
                       </div>
                       {!depRisks && !depLoading && (
                         <button
                           onClick={() => void handleScanDependencies()}
                           className="shrink-0 flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-500 rounded-xl text-sm font-bold text-white transition-all shadow-lg shadow-amber-500/20"
                         >
                           <Shield className="w-4 h-4" /> Scan Deps
                         </button>
                       )}
                     </div>

                     {depLoading && <Loader message="Scanning dependencies for risks…" />}

                     {depRisks && !depLoading && (
                       <div className="space-y-4">
                         {depRisks.length === 0 ? (
                           <div className="flex items-center gap-3 p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl">
                             <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                             <div>
                               <p className="text-emerald-300 font-bold text-sm">No high-risk dependencies found</p>
                               <p className="text-slate-400 text-xs mt-0.5">Dependencies look healthy based on your current versions.</p>
                             </div>
                           </div>
                         ) : (
                           <>
                             <div className="flex items-center gap-3 mb-2">
                               <span className="text-sm text-slate-400">{depRisks.length} risk{depRisks.length !== 1 ? 's' : ''} found</span>
                               <button
                                 onClick={() => void handleScanDependencies()}
                                 className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors"
                               >
                                 <RotateCw className="w-3 h-3" /> Rescan
                               </button>
                             </div>
                             <div className="space-y-3">
                               {depRisks.sort((a, b) => {
                                 const order: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
                                 return (order[a.risk] ?? 3) - (order[b.risk] ?? 3);
                               }).map((dep) => (
                                 <div key={dep.name} className="p-5 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-2">
                                   <div className="flex items-center gap-3 flex-wrap">
                                     <span className="font-mono text-sm font-bold text-white">{dep.name}</span>
                                     <span className="font-mono text-xs text-slate-500">{dep.currentVersion}</span>
                                     <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase border ${
                                       dep.risk === 'critical' ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                                       : dep.risk === 'high' ? 'bg-orange-500/15 text-orange-300 border-orange-500/30'
                                       : dep.risk === 'medium' ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                       : 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                                     }`}>{dep.risk}</span>
                                   </div>
                                   <p className="text-slate-400 text-xs leading-relaxed">{dep.reason}</p>
                                   <p className="text-indigo-400 text-xs font-semibold">→ {dep.recommendation}</p>
                                 </div>
                               ))}
                             </div>
                           </>
                         )}
                       </div>
                     )}
                   </div>

                   {/* ── Wave 12: AI README Generator ── */}
                   <div className="bg-slate-900/40 border border-slate-800 rounded-[3rem] p-10 shadow-2xl">
                     <div className="flex items-start justify-between gap-4 mb-6">
                       <div>
                         <h2 className="text-2xl font-black text-white flex items-center gap-3 mb-1">
                           <FileText className="w-6 h-6 text-emerald-400" /> AI README Generator
                         </h2>
                         <p className="text-slate-400 text-sm">Generate a production-quality README.md tailored to this repo — with badges, examples, and a GitMind score embed.</p>
                       </div>
                       {!generatedReadme && !readmeLoading && (
                         <button
                           onClick={() => void handleGenerateReadme()}
                           className="shrink-0 flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-sm font-bold text-white transition-all shadow-lg shadow-emerald-500/20"
                         >
                           <Wand2 className="w-4 h-4" /> Generate README
                         </button>
                       )}
                     </div>
                     {readmeLoading && <Loader message="Crafting your README..." />}
                     {generatedReadme && !readmeLoading && (
                       <ReadmeGenerator
                         readme={generatedReadme}
                         onCommit={handleCommitReadme}
                         committing={readmeCommitting}
                         commitUrl={readmeCommitUrl}
                         commitError={readmeCommitError}
                       />
                     )}
                   </div>

                   {/* ── Wave 12: Blame Intelligence ── */}
                   <div className="bg-slate-900/40 border border-slate-800 rounded-[3rem] p-10 shadow-2xl">
                     <div className="flex items-start justify-between gap-4 mb-6">
                       <div>
                         <h2 className="text-2xl font-black text-white flex items-center gap-3 mb-1">
                           <Users className="w-6 h-6 text-rose-400" /> Blame Intelligence
                         </h2>
                         <p className="text-slate-400 text-sm">Cross-reference code ownership with risk areas — see who owns each vulnerability. Essential for engineering managers.</p>
                       </div>
                       {(subscription?.plan === 'pro' || subscription?.plan === 'team') && !blameInsights && !blameLoading && (
                         <button
                           onClick={() => void handleAnalyzeBlame()}
                           className="shrink-0 flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-500 rounded-xl text-sm font-bold text-white transition-all"
                         >
                           <GitBranch className="w-4 h-4" /> Analyze Ownership
                         </button>
                       )}
                     </div>
                     {blameLoading && <Loader message="Analyzing blame patterns..." />}
                     <BlameIntelligence
                       insights={blameInsights ?? []}
                       isPro={subscription?.plan === 'pro' || subscription?.plan === 'team'}
                       onUpgrade={() => setShowPricing(true)}
                     />
                   </div>

                   {/* ── Wave 13: AI PR Reviewer ── */}
                   <div className="bg-slate-900/40 border border-slate-800 rounded-[3rem] p-10 shadow-2xl">
                     <div className="flex items-start justify-between gap-4 mb-6">
                       <div>
                         <h2 className="text-2xl font-black text-white flex items-center gap-3 mb-1">
                           <GitPullRequest className="w-6 h-6 text-indigo-400" /> AI Pull Request Reviewer
                         </h2>
                         <p className="text-slate-400 text-sm">Paste a PR URL → get a full structured code review cross-referenced with this repo&apos;s analysis, security findings, and blame data.</p>
                       </div>
                     </div>
                     <div className="flex gap-3 mb-6">
                       <input
                         type="url"
                         value={aiPrUrl}
                         onChange={e => setAiPrUrl(e.target.value)}
                         placeholder="https://github.com/owner/repo/pull/42"
                         className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors font-mono"
                       />
                       <button
                         onClick={() => void handleAIPRReview()}
                         disabled={aiPrLoading || !aiPrUrl.trim()}
                         className="shrink-0 flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-xl text-sm font-bold text-white transition-all"
                       >
                         {aiPrLoading ? 'Reviewing…' : <><Zap className="w-4 h-4" /> Review PR</>}
                       </button>
                     </div>
                     {aiPrLoading && <Loader message="Analyzing pull request…" />}
                     {aiPrResult && !aiPrLoading && (
                       <PRReviewer
                         review={aiPrResult}
                         onPostReview={handlePostAIPRReview}
                         posting={aiPrPosting}
                         postUrl={aiPrPostUrl}
                         prUrl={aiPrUrl}
                       />
                     )}
                   </div>

                   {/* ── Wave 13: Tech Debt Dollar Calculator ── */}
                   <div className="bg-slate-900/40 border border-slate-800 rounded-[3rem] p-10 shadow-2xl">
                     <div className="flex items-start justify-between gap-4 mb-6">
                       <div>
                         <h2 className="text-2xl font-black text-white flex items-center gap-3 mb-1">
                           <BarChart3 className="w-6 h-6 text-orange-400" /> Tech Debt Dollar Calculator
                         </h2>
                         <p className="text-slate-400 text-sm">Turn abstract code quality scores into a dollar figure executives understand — broken down by category with quick wins.</p>
                       </div>
                       {!techDebtReport && !techDebtLoading && (
                         <button
                           onClick={() => void handleCalculateTechDebt()}
                           className="shrink-0 flex items-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-500 rounded-xl text-sm font-bold text-white transition-all shadow-lg shadow-orange-500/20"
                         >
                           <BarChart3 className="w-4 h-4" /> Calculate Debt
                         </button>
                       )}
                     </div>
                     {techDebtLoading && <Loader message="Calculating tech debt cost…" />}
                     {techDebtReport && !techDebtLoading && (
                       <TechDebtCalculator report={techDebtReport} />
                     )}
                   </div>

                   {/* ── Wave 13: CVE Intelligence Scanner ── */}
                   <div className="bg-slate-900/40 border border-slate-800 rounded-[3rem] p-10 shadow-2xl">
                     <div className="flex items-start justify-between gap-4 mb-6">
                       <div>
                         <h2 className="text-2xl font-black text-white flex items-center gap-3 mb-1">
                           <ShieldCheck className="w-6 h-6 text-rose-400" /> CVE Intelligence Scanner
                         </h2>
                         <p className="text-slate-400 text-sm">Cross-reference your dependencies against known CVE databases — real CVE IDs, CVSS scores, and exact patch commands.</p>
                       </div>
                       {!cveReport && !cveLoading && (
                         <button
                           onClick={() => void handleScanCVEs()}
                           className="shrink-0 flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-500 rounded-xl text-sm font-bold text-white transition-all"
                         >
                           <ShieldCheck className="w-4 h-4" /> Scan CVEs
                         </button>
                       )}
                     </div>
                     {cveLoading && <Loader message="Cross-referencing CVE databases…" />}
                     {cveReport && !cveLoading && (
                       <CVEMonitor
                         report={cveReport}
                         isPro={subscription?.plan === 'pro' || subscription?.plan === 'team'}
                         onUpgrade={() => setShowPricing(true)}
                       />
                     )}
                   </div>

                   {/* ── Wave 15: AI Code Review Checklist ── */}
                   <div className="bg-slate-900/40 border border-slate-800 rounded-[3rem] p-10 shadow-2xl">
                     <div className="flex items-start justify-between gap-4 mb-6">
                       <div>
                         <h2 className="text-2xl font-black text-white flex items-center gap-3 mb-1">
                           <ClipboardCheck className="w-6 h-6 text-indigo-400" /> AI Code Review Checklist
                         </h2>
                         <p className="text-slate-400 text-sm">Auto-generated, repo-specific review checklist with exportable PR template for your team.</p>
                       </div>
                       {!reviewChecklist && !checklistLoading && (
                         <button
                           onClick={() => void handleGenerateChecklist()}
                           className="shrink-0 flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-bold text-white transition-all"
                         >
                           <ClipboardCheck className="w-4 h-4" /> Generate Checklist
                         </button>
                       )}
                     </div>
                     {checklistLoading && <Loader message="AI is generating your review checklist…" />}
                     {reviewChecklist && !checklistLoading && (
                       <CodeReviewChecklist
                         checklist={reviewChecklist}
                         loading={checklistLoading}
                         onGenerate={handleGenerateChecklist}
                       />
                     )}
                   </div>

                   {/* ── Wave 17: AI Commit Message Generator ── */}
                   <div className="bg-slate-900/40 border border-slate-800 rounded-[3rem] p-10 shadow-2xl">
                     <div className="mb-6">
                       <h2 className="text-2xl font-black text-white flex items-center gap-3 mb-1">
                         <GitCommit className="w-6 h-6 text-emerald-400" /> AI Commit Message Generator
                       </h2>
                       <p className="text-slate-400 text-sm">Paste a git diff or describe your changes — get a perfect conventional commit message.</p>
                     </div>
                     <CommitMessageGenerator
                       onGenerate={handleGenerateCommitMessage}
                       repoName={repo ? `${repo.owner}/${repo.repo}` : undefined}
                     />
                   </div>

                   {/* ── Wave 18: AI Changelog Generator ── */}
                   <ChangelogGenerator
                     onGenerate={handleGenerateChangelog}
                     repoName={repo ? `${repo.owner}/${repo.repo}` : undefined}
                     recentCommits={[]}
                   />

                   {/* ── Wave 19: Breaking Change Detector ── */}
                   <BreakingChangeDetector
                     onDetect={handleDetectBreakingChanges}
                     loading={breakingChangeLoading}
                     repoName={repo ? `${repo.owner}/${repo.repo}` : undefined}
                     defaultBranch={repo?.defaultBranch || 'main'}
                   />
                 </div>
               )}

               {activeTab === 'cloud' && (
                 <div className="bg-slate-900/40 border border-slate-800 rounded-[3rem] p-12 shadow-2xl animate-in zoom-in-95 duration-500">
                    <h2 className="text-3xl font-black text-white tracking-tighter mb-8 flex items-center gap-4">
                      <Server className="w-8 h-8 text-emerald-400" /> Tech Stack & Deployment
                    </h2>
                    
                    {/* Tech Stack Summary */}
                    <div className="mb-8 p-8 bg-slate-950 rounded-2xl border border-slate-800">
                      <h3 className="text-lg font-bold text-white mb-4">Technologies Detected</h3>
                      <div className="flex flex-wrap gap-3">
                        {analysis.techStack.map((tech, i) => (
                          <span key={i} className="px-4 py-2 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-400 text-sm font-bold">
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Deployment Recommendations - Compact Grid */}
                    <h3 className="text-lg font-bold text-white mb-6">Deployment Recommendations</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-h-[500px] overflow-y-auto pr-2">
                       {analysis.cloudArchitecture.map((plan, i) => (
                          <div key={i} className="p-6 bg-slate-950 border border-slate-800 rounded-2xl hover:border-emerald-500/50 transition-all">
                             <div className="flex justify-between items-start mb-3">
                                <h4 className="text-base font-black text-white">{plan.serviceName}</h4>
                                <span className={`text-[8px] font-black uppercase px-2 py-1 rounded flex-shrink-0 ${plan.complexity === 'Low' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                                  {plan.complexity}
                                </span>
                             </div>
                             <div className="text-[10px] font-black uppercase text-emerald-500 mb-3 flex items-center gap-2">
                               <Cloud className="w-3 h-3" /> {plan.platform}
                             </div>
                             <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">{plan.reasoning}</p>
                          </div>
                       ))}
                    </div>
                 </div>
               )}

               {activeTab === 'vision' && (
                 <div className="space-y-10">
                    <div className="bg-slate-900/40 border border-slate-800 rounded-[3rem] p-12 shadow-2xl animate-in zoom-in-95 duration-500">
                      <h2 className="text-3xl font-black text-white tracking-tighter mb-8 flex items-center gap-4"><Sparkles className="w-8 h-8 text-emerald-400" /> AI Repo Intro</h2>
                      <p className="text-slate-400 text-sm mb-8">A short narrated intro you can play right after analysis.</p>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="space-y-6">
                          <div className="p-6 bg-slate-950 rounded-2xl border border-slate-800">
                            <div className="text-xs text-slate-500 uppercase tracking-wider mb-3">Summary</div>
                            <p className="text-slate-200 text-sm leading-relaxed">
                              {analysis?.summary}
                            </p>
                          </div>
                          <div className="p-6 bg-slate-950 rounded-2xl border border-slate-800">
                            <div className="text-xs text-slate-500 uppercase tracking-wider mb-3">Key Stack</div>
                            <div className="flex flex-wrap gap-2">
                              {analysis?.techStack.slice(0, 6).map((tech) => (
                                <span key={tech} className="px-3 py-1 bg-emerald-500/10 text-emerald-300 text-[10px] uppercase tracking-widest rounded-full font-black">{tech}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="bg-gradient-to-br from-emerald-500/10 via-slate-900/60 to-slate-900/90 border border-emerald-500/20 rounded-3xl p-8 flex flex-col justify-between">
                          <div>
                            <div className="text-xs text-emerald-400 uppercase tracking-widest font-black mb-4">Intro Script</div>
                            <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap min-h-[140px]">
                              {introScript || 'Generate a short narrated intro to share with your team.'}
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-4 mt-8">
                            <button
                              onClick={handleGenerateIntro}
                              disabled={introLoading}
                              className="px-6 py-3 bg-emerald-500 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl disabled:opacity-50"
                            >
                              {introLoading ? 'Generating...' : 'Generate Intro'}
                            </button>
                            <button
                              onClick={toggleIntroPlayback}
                              disabled={!introAudioUrl}
                              className="px-6 py-3 bg-slate-900 border border-slate-700 text-emerald-300 font-black text-[10px] uppercase tracking-widest rounded-2xl disabled:opacity-40"
                            >
                              {introPlaying ? 'Pause' : 'Play'}
                            </button>
                            {introAudioUrl && (
                              <audio
                                ref={introAudioRef}
                                src={introAudioUrl}
                                onEnded={() => setIntroPlaying(false)}
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-900/40 border border-slate-800 rounded-[3rem] p-12 shadow-2xl animate-in zoom-in-95 duration-500 min-h-[500px]">
                      <h2 className="text-3xl font-black text-white tracking-tighter mb-12 flex items-center gap-4"><Sparkles className="w-8 h-8 text-purple-400" /> Cinematic Vision</h2>
                      {videoLoading ? <Loader message="Rendering Neural Reality..." /> : visionVideo ? <video src={visionVideo} controls autoPlay loop className="w-full aspect-video rounded-[2.5rem] border border-slate-800 shadow-2xl" /> : (
                         <div className="text-center opacity-30 py-32">
                            <Video className="w-20 h-20 mx-auto mb-8" />
                            <button onClick={handleGenerateVideo} className="px-8 py-4 bg-purple-600 text-white font-black rounded-2xl">Initialize Synthesis</button>
                         </div>
                      )}
                    </div>
                 </div>
               )}

            </div>

            <div className="col-span-12 lg:col-span-4 xl:col-span-3 space-y-8">
               <div className="bg-slate-900/60 border border-slate-800 rounded-[2.5rem] p-8 backdrop-blur-3xl shadow-2xl">
                  <div className="flex items-center gap-3 mb-3">
                    <MapPin className="w-5 h-5 text-yellow-400" />
                    <h4 className="text-white font-black text-sm uppercase tracking-[0.2em]">Environment</h4>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="px-3 py-1 bg-yellow-500/10 text-yellow-300 text-[10px] uppercase tracking-widest rounded-full font-black border border-yellow-500/30">
                      ENV: {appEnv}
                    </span>
                    <span className="text-xs text-slate-400">Visible for shared screenshots and QA checks.</span>
                  </div>
               </div>
               <div className="bg-slate-900/60 border border-slate-800 rounded-[2rem] flex flex-col max-h-[400px] min-h-[300px] overflow-hidden backdrop-blur-3xl shadow-2xl">
                  {/* Header */}
                  <div className="p-6 border-b border-slate-800 bg-gradient-to-r from-indigo-600/20 to-purple-600/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <BrainCircuit className="w-5 h-5 text-indigo-400" />
                        <h3 className="text-white font-black text-lg tracking-tighter">AI Copilot</h3>
                      </div>
                      <button
                        onClick={() => setChatHistory([])}
                        className="text-slate-500 hover:text-slate-300 text-xs font-medium"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  {/* Chat Content */}
                  <div className="flex-1 flex flex-col">
                    {/* Suggested Questions - Compact */}
                    {chatHistory.length === 0 && (
                      <div className="p-4 space-y-2">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">💡 Quick questions:</p>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { q: "Where to start?", icon: "🚀" },
                            { q: "Tech stack?", icon: "⚙️" },
                            { q: "How to test?", icon: "🧪" },
                            { q: "Deploy process?", icon: "🚢" }
                          ].map((item, i) => (
                            <button
                              key={i}
                              onClick={() => { void submitChat(item.q); }}
                              className="text-left p-3 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-indigo-500/50 rounded-xl transition-all group text-xs"
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-sm">{item.icon}</span>
                                <span className="text-slate-300 group-hover:text-white transition-colors truncate">{item.q}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Chat History - Compact */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                      {chatHistory.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[85%] p-3 rounded-xl text-sm leading-relaxed ${
                            msg.role === 'user' 
                              ? 'bg-indigo-600 text-white' 
                              : 'bg-slate-800/80 text-slate-200 border border-slate-700'
                          }`}>
                            {msg.role === 'model' && (
                              <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-700">
                                <BrainCircuit className="w-3 h-3 text-indigo-400" />
                                <span className="text-xs font-bold text-indigo-400">AI</span>
                              </div>
                            )}
                            <div className="whitespace-pre-wrap text-xs">{msg.text}</div>
                            {msg.fileLinks && msg.fileLinks.length > 0 && (
                              <div className="mt-3 space-y-1">
                                {msg.fileLinks.map((path) => (
                                  <button
                                    key={path}
                                    onClick={() => openFileByPath(path)}
                                    className="w-full text-left px-3 py-2 bg-slate-900/60 border border-slate-700 hover:border-emerald-500/60 rounded-lg text-xs font-mono text-emerald-400 hover:text-emerald-300 transition-all"
                                  >
                                    {path.split('/').pop()}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      {chatLoading && (
                        <div className="flex items-center gap-2 text-indigo-400 animate-pulse">
                          <BrainCircuit className="w-3 h-3 animate-spin" />
                          <span className="text-xs font-medium">Thinking...</span>
                        </div>
                      )}
                      <div ref={chatEndRef} />
                    </div>

                    {/* Input - Compact */}
                    <form onSubmit={handleChat} className="p-4 border-t border-slate-800 bg-slate-900/80">
                      <div className="relative">
                        <input 
                          className="w-full bg-slate-800 border border-slate-700 focus:border-indigo-500 rounded-xl pl-4 pr-12 py-3 text-sm text-white placeholder:text-slate-500 outline-none transition-all" 
                          placeholder="Ask about this repo..." 
                          value={chatInput} 
                          onChange={(e) => setChatInput(e.target.value)} 
                        />
                        <button 
                          type="submit" 
                          disabled={!chatInput.trim() || chatLoading}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-indigo-500 hover:text-indigo-400 disabled:opacity-30 disabled:cursor-not-allowed p-2 transition-all"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </form>
                  </div>
               </div>
            </div>

          </div>
        ) : authUser ? (
          /* ───── AUTHENTICATED DASHBOARD ───── */
          <div className="max-w-7xl mx-auto py-12 px-8">
            {/* Welcome Header */}
            <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
              <div>
                <h1 className="text-3xl font-black text-white mb-1">Welcome back{authUser.user_metadata?.user_name ? `, ${authUser.user_metadata.user_name}` : ''}</h1>
                <p className="text-slate-500 text-sm">Your AI-powered code intelligence hub</p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => setShowScoringWeights(true)} className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold text-slate-300 transition-all" title="Custom Scoring Weights">
                  <Sliders className="w-3.5 h-3.5" /> Weights
                </button>
                <button onClick={() => setShowScheduledReports(true)} className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold text-slate-300 transition-all" title="Scheduled Reports">
                  <Calendar className="w-3.5 h-3.5" /> Reports
                </button>
                <button onClick={() => setShowTeamActivity(true)} className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold text-slate-300 transition-all" title="Team Activity Feed">
                  <Users className="w-3.5 h-3.5" /> Team
                </button>
                <button onClick={() => setShowExportCSV(true)} className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold text-slate-300 transition-all" title="Export History">
                  <Download className="w-3.5 h-3.5" /> Export
                </button>
                <button
                  onClick={() => subscription.isActive ? void openBillingPortal(authUser.id) : setShowPricing(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold text-slate-300 transition-all"
                >
                  <CreditCard className="w-3.5 h-3.5" /> {subscription.plan === 'free' ? 'Upgrade' : 'Manage Plan'}
                </button>
              </div>
            </div>

            {/* Workspace Management Row */}
            <div className="flex flex-wrap items-center gap-2 mb-8 p-4 bg-slate-900/40 border border-slate-800 rounded-2xl">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 mr-2">Workspace</span>
              <select
                value={activeWorkspaceId}
                onChange={(e) => {
                  const nextWorkspaceId = e.target.value;
                  setActiveWorkspaceId(nextWorkspaceId);
                  if (nextWorkspaceId) window.localStorage.setItem(ACTIVE_WORKSPACE_KEY, nextWorkspaceId);
                }}
                disabled={workspaceLoading || workspaces.length === 0}
                className="h-9 px-3 rounded-xl bg-slate-950 border border-slate-700 text-[10px] font-black uppercase tracking-widest text-slate-200 appearance-none cursor-pointer"
              >
                {workspaces.length === 0 && <option value="">No Workspace</option>}
                {workspaces.map((workspace) => (
                  <option key={workspace.id} value={workspace.id}>
                    {workspace.name}{workspace.isPersonal ? ' (Personal)' : ''}
                  </option>
                ))}
              </select>
              <button onClick={handleCreateWorkspace} disabled={workspaceLoading} className="h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest bg-slate-950 border border-slate-700 text-indigo-300 hover:text-white hover:border-indigo-500 transition-all disabled:opacity-50">+ New</button>
              <button onClick={handleJoinWorkspace} disabled={workspaceLoading} className="h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest bg-slate-950 border border-slate-700 text-sky-300 hover:text-white hover:border-sky-500 transition-all disabled:opacity-50">Join</button>
              <button onClick={handleInviteMember} disabled={workspaceLoading || !activeWorkspace || activeWorkspace.isPersonal || !['owner', 'admin'].includes(activeWorkspace.role)} className={`h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest bg-slate-950 border border-slate-700 text-violet-300 hover:text-white hover:border-violet-500 transition-all disabled:opacity-50 ${activeWorkspace?.isPersonal ? 'hidden' : ''}`}>Invite</button>
              <button onClick={handleViewMembers} disabled={workspaceLoading || !activeWorkspace} className={`h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest bg-slate-950 border border-slate-700 text-emerald-300 hover:text-white hover:border-emerald-500 transition-all disabled:opacity-50 ${activeWorkspace?.isPersonal ? 'hidden' : ''}`}>Members</button>
            </div>
            <div className="flex items-center gap-1 mb-10 bg-slate-900/40 border border-slate-800 rounded-xl p-1 w-fit">
              <button onClick={() => setDashboardTab('home')} className={`px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${dashboardTab === 'home' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-white'}`}>
                Home
              </button>
              <button onClick={() => setDashboardTab('marketplace')} className={`px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${dashboardTab === 'marketplace' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-white'}`}>
                <Briefcase className="w-3.5 h-3.5" /> Expert Marketplace
              </button>
              <button onClick={() => setDashboardTab('compare')} className={`px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${dashboardTab === 'compare' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-white'}`}>
                <GitBranch className="w-3.5 h-3.5" /> Compare
              </button>
              {analysisHistory.length >= 2 && (
                <button onClick={() => setShowAnalysisDiff(true)} className="px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 text-slate-500 hover:text-white">
                  <BarChart3 className="w-3.5 h-3.5" /> Diff
                </button>
              )}
              <button onClick={() => setDashboardTab('health')} className={`px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${dashboardTab === 'health' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-white'}`}>
                <Activity className="w-3.5 h-3.5" /> Health
              </button>
            </div>

            {dashboardTab === 'marketplace' ? (
              <ExpertMarketplace authUser={authUser} />
            ) : dashboardTab === 'compare' ? (
              <CompareRepos />
            ) : dashboardTab === 'health' ? (
              <div className="space-y-8">
                {/* Wave 18: Health Score Timeline */}
                <HealthTimeline history={analysisHistory} />
                <HealthDashboard
                  history={analysisHistory}
                  watchedRepos={watchedRepos}
                  onSelectRepo={(repoUrl) => { setUrl(repoUrl); setTimeout(() => document.querySelector('form')?.dispatchEvent(new Event('submit', { bubbles: true })), 100); }}
                />
                <SmartAlerts
                  alerts={scoreAlerts}
                  onSave={handleSaveAlerts}
                  repoNames={[...new Set(analysisHistory.map(a => `${a.repoOwner}/${a.repoName}`))]}
                />
              </div>
            ) : (
            <>

            {/* Quick Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 bg-indigo-500/15 rounded-xl flex items-center justify-center">
                    <BarChart3 className="w-4.5 h-4.5 text-indigo-400" />
                  </div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Analyses</span>
                </div>
                <div className="text-2xl font-black text-white">{analysisHistory.length}</div>
                <p className="text-xs text-slate-600 mt-1">Total repositories analyzed</p>
              </div>
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 bg-emerald-500/15 rounded-xl flex items-center justify-center">
                    <GitPullRequest className="w-4.5 h-4.5 text-emerald-400" />
                  </div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">PR Reviews</span>
                </div>
                <div className="text-2xl font-black text-white">{prReviewHistory.length}</div>
                <p className="text-xs text-slate-600 mt-1">Pull requests reviewed</p>
              </div>
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 bg-amber-500/15 rounded-xl flex items-center justify-center">
                    <Zap className="w-4.5 h-4.5 text-amber-400" />
                  </div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Today</span>
                </div>
                <div className="text-2xl font-black text-white">{dailyUsage ? `${dailyUsage.used}/${dailyUsage.limit}` : '—'}</div>
                <p className="text-xs text-slate-600 mt-1">Daily analyses used</p>
              </div>
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 bg-violet-500/15 rounded-xl flex items-center justify-center">
                    <Users className="w-4.5 h-4.5 text-violet-400" />
                  </div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Workspaces</span>
                </div>
                <div className="text-2xl font-black text-white">{workspaces.length}</div>
                <p className="text-xs text-slate-600 mt-1">Active workspaces</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
              <button
                onClick={() => document.querySelector('input')?.focus()}
                className="group flex items-center gap-4 bg-indigo-600/10 border border-indigo-500/30 hover:border-indigo-500/60 rounded-2xl p-5 transition-all text-left"
              >
                <div className="w-11 h-11 bg-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Plus className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-sm font-black text-white">New Analysis</div>
                  <div className="text-xs text-slate-500">Paste a GitHub URL to analyze</div>
                </div>
                <ArrowRight className="w-4 h-4 text-indigo-400 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
              <button
                onClick={() => {
                  setUrl('https://github.com/facebook/react');
                  setTimeout(() => document.querySelector('form')?.dispatchEvent(new Event('submit', { bubbles: true })), 100);
                }}
                className="group flex items-center gap-4 bg-slate-900/40 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 transition-all text-left"
              >
                <div className="w-11 h-11 bg-slate-800 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Rocket className="w-5 h-5 text-slate-400" />
                </div>
                <div>
                  <div className="text-sm font-black text-white">Try Demo</div>
                  <div className="text-xs text-slate-500">Analyze facebook/react</div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-600 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
              <button
                onClick={() => setShowPricing(true)}
                className="group flex items-center gap-4 bg-slate-900/40 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 transition-all text-left"
              >
                <div className="w-11 h-11 bg-slate-800 rounded-xl flex items-center justify-center flex-shrink-0">
                  <CreditCard className="w-5 h-5 text-slate-400" />
                </div>
                <div>
                  <div className="text-sm font-black text-white">{subscription.plan === 'free' ? 'Upgrade Plan' : 'Manage Billing'}</div>
                  <div className="text-xs text-slate-500">{subscription.plan === 'free' ? 'Unlock unlimited analyses' : `${subscription.plan} plan active`}</div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-600 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            </div>

            {/* Cmd+K hint */}
            <div className="flex items-center justify-center gap-4 mb-10 text-slate-600 text-xs">
              <button
                onClick={() => setShowGlobalSearch(true)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 border border-slate-700 hover:border-indigo-500/40 rounded-xl text-xs text-slate-400 hover:text-white transition-all"
              >
                <Search className="w-3.5 h-3.5" /> Search all analyses...
              </button>
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-slate-800 border border-slate-700 rounded-md font-mono text-[10px]">⌘K</kbd>
                <span>command palette</span>
              </div>
            </div>

            {/* Favorite Repos */}
            {favorites.length > 0 && (
              <div className="mb-10">
                <h2 className="text-lg font-black text-white flex items-center gap-2 mb-4"><Sparkles className="w-4 h-4 text-amber-400" /> Pinned Repos</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {favorites.map(favUrl => {
                    const match = analysisHistory.find(a => a.repoUrl === favUrl);
                    const parts = favUrl.replace('https://github.com/', '').split('/');
                    return (
                      <div key={favUrl} className="flex items-center gap-3 bg-slate-900/60 border border-slate-800 hover:border-amber-500/30 rounded-xl p-4 transition-all group">
                        <button
                          onClick={() => toggleFavorite(favUrl)}
                          className="text-amber-400 hover:text-amber-300 flex-shrink-0"
                          title="Unpin"
                        >★</button>
                        <button
                          onClick={async () => {
                            if (match) {
                              const ok = await handleRehydrate(match.id);
                              if (!ok) { setUrl(favUrl); }
                            } else {
                              setUrl(favUrl);
                              setTimeout(() => document.querySelector('form')?.dispatchEvent(new Event('submit', { bubbles: true })), 100);
                            }
                          }}
                          className="flex-1 text-left min-w-0"
                        >
                          <div className="text-sm font-bold text-white truncate group-hover:text-indigo-300 transition-colors">{parts[0]}/{parts[1]}</div>
                          {match && <div className="text-[10px] text-slate-600 truncate">{match.summary?.slice(0, 60)}</div>}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Referral Card */}
            <div className="bg-gradient-to-r from-indigo-950/40 to-violet-950/40 border border-indigo-500/20 rounded-2xl p-6 mb-10 flex flex-col md:flex-row items-center gap-6">
              <div className="w-12 h-12 bg-indigo-600/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Gift className="w-6 h-6 text-indigo-400" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-base font-black text-white mb-1">Invite Friends, Earn Pro Days</h3>
                <p className="text-sm text-slate-400">Share your referral link. When a friend signs up, you both get <span className="text-indigo-400 font-bold">7 days of Pro free</span>.</p>
                {referralStats.count > 0 && (
                  <p className="text-xs text-emerald-400 mt-1 font-bold">{referralStats.count} referral{referralStats.count !== 1 ? 's' : ''} • {referralStats.daysEarned} bonus days earned</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <code className="bg-slate-950 border border-slate-800 px-4 py-2.5 rounded-xl text-xs text-slate-300 font-mono select-all max-w-[220px] truncate">
                  {referralCode ? `${window.location.origin}?ref=${referralCode}` : 'Loading...'}
                </code>
                <button
                  onClick={() => {
                    if (!referralCode) return;
                    navigator.clipboard.writeText(`${window.location.origin}?ref=${referralCode}`);
                    setReferralCopied(true);
                    setTimeout(() => setReferralCopied(false), 2000);
                  }}
                  className="p-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all"
                  title="Copy referral link"
                >
                  {referralCopied ? <CheckCircle2 className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4 text-white" />}
                </button>
              </div>
            </div>

            {/* Activity Heatmap */}
            {(analysisHistory.length > 0 || prReviewHistory.length > 0) && (
              <div className="mb-10">
                <ActivityHeatmap
                  dates={[
                    ...analysisHistory.map(a => a.createdAt),
                    ...prReviewHistory.map(p => p.createdAt),
                  ]}
                />
              </div>
            )}

            {/* Quick Re-analyze */}
            {analysisHistory.length > 0 && (
              <div className="mb-10">
                <h2 className="text-lg font-black text-white flex items-center gap-2 mb-4"><RotateCw className="w-4 h-4 text-emerald-400" /> Quick Re-analyze</h2>
                <div className="flex flex-wrap gap-2">
                  {[...new Map(analysisHistory.map(a => [`${a.repoOwner}/${a.repoName}`, a])).values()].slice(0, 8).map(a => (
                    <button
                      key={a.id}
                      onClick={() => {
                        setUrl(a.repoUrl);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                        setTimeout(() => {
                          const form = document.querySelector('form');
                          if (form) form.requestSubmit();
                        }, 150);
                      }}
                      className="flex items-center gap-2 px-3 py-2 bg-slate-900/60 border border-slate-800 hover:border-emerald-500/40 rounded-xl text-xs font-bold text-slate-300 hover:text-emerald-300 transition-all group"
                    >
                      <RotateCw className="w-3 h-3 text-slate-600 group-hover:text-emerald-400 transition-colors" />
                      {a.repoOwner}/{a.repoName}
                      <span onClick={e => e.stopPropagation()} className="ml-1"><RepoTags repoKey={`${a.repoOwner}/${a.repoName}`} compact /></span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Wave 10: Pinned Insight widget */}
            <div className="mb-10">
              <PinnedInsight
                onReanalyze={() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  setTimeout(() => {
                    const form = document.querySelector('form');
                    if (form) form.requestSubmit();
                  }, 150);
                }}
              />
            </div>

            {/* Wave 11: Team Repo Leaderboard */}
            {analysisHistory.length >= 2 && (
              <div className="mb-10">
                <RepoLeaderboard
                  analyses={analysisHistory}
                  onSelectRepo={(repoUrl) => {
                    setUrl(repoUrl);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    setTimeout(() => {
                      const form = document.querySelector('form');
                      if (form) form.requestSubmit();
                    }, 150);
                  }}
                />
              </div>
            )}

            {/* Wave 21: Portfolio Health Matrix */}
            {analysisHistory.length >= 2 && (
              <div className="mb-10">
                <MultiRepoHealthMatrix
                  analyses={analysisHistory.map(a => ({
                    id: a.id,
                    repo_owner: a.repoOwner,
                    repo_name: a.repoName,
                    created_at: a.createdAt,
                    scorecard: a.scorecard ? {
                      maintenance: a.scorecard.maintenance,
                      documentation: a.scorecard.documentation,
                      innovation: a.scorecard.innovation,
                      security: a.scorecard.security,
                    } : undefined,
                  }))}
                  onDrillDown={(a) => {
                    const match = analysisHistory.find(h => h.repoOwner === a.repo_owner && h.repoName === a.repo_name);
                    if (match) {
                      setUrl(match.repoUrl);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }}
                  onRefresh={() => authUser && void loadAnalysisHistory(authUser.id, activeWorkspaceId || undefined)}
                />
              </div>
            )}

            {/* Score Trends */}
            {analysisHistory.length >= 2 && (
              <div className="mb-10">
                <h2 className="text-lg font-black text-white flex items-center gap-2 mb-4"><TrendingUp className="w-4 h-4 text-indigo-400" /> Score Trends</h2>
                <TrendChart
                  history={analysisHistory.filter(a => a.scorecard).map(a => ({
                    date: a.createdAt,
                    maintenance: (a.scorecard!.maintenance / 10) * 100,
                    documentation: (a.scorecard!.documentation / 10) * 100,
                    innovation: (a.scorecard!.innovation / 10) * 100,
                    security: (a.scorecard!.security / 10) * 100,
                  }))}
                  repoName={analysisHistory[0]?.repoName}
                />
              </div>
            )}

            {/* Webhook Activity Feed */}
            {authUser && watchedRepos.size > 0 && (
              <div className="mb-10">
                <WebhookFeed userId={authUser.id} />
              </div>
            )}

            {/* Recent Analyses */}
            {(analysisHistory.length > 0 || historyLoading) && (
              <div className="mb-10">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-black text-white flex items-center gap-2"><Clock className="w-4 h-4 text-slate-500" /> Recent Analyses</h2>
                </div>
                <AnalysisHistory
                  analyses={analysisHistory}
                  loading={historyLoading}
                  favorites={favorites}
                  onToggleFavorite={toggleFavorite}
                  onSelect={async (_repoUrl, analysisId) => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    const ok = await handleRehydrate(analysisId);
                    if (!ok) {
                      setUrl(_repoUrl);
                    }
                  }}
                />
              </div>
            )}

            {/* Empty State for new users */}
            {analysisHistory.length === 0 && !historyLoading && (
              <div className="text-center py-20 bg-slate-900/30 border border-slate-800 rounded-3xl">
                <BrainCircuit className="w-16 h-16 text-indigo-500/30 mx-auto mb-6" />
                <h3 className="text-xl font-black text-white mb-3">No analyses yet</h3>
                <p className="text-slate-500 text-sm mb-6 max-w-md mx-auto">Paste any GitHub repository URL in the search bar above to get a full AI-powered analysis.</p>
                <button
                  onClick={() => document.querySelector('input')?.focus()}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-black py-3 px-8 rounded-2xl transition-all text-sm"
                >
                  Analyze Your First Repo
                </button>
              </div>
            )}

            {/* Wave 17: Public Repo Gallery */}
            <div className="mb-10">
              <PublicRepoGallery
                onAnalyze={(repoUrl) => {
                  setUrl(repoUrl);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  setTimeout(() => {
                    const form = document.querySelector('form');
                    if (form) form.requestSubmit();
                  }, 150);
                }}
              />
            </div>

            </>
            )}
          </div>
        ) : (
          /* ───── PUBLIC LANDING PAGE ───── */
          <div className="max-w-7xl mx-auto py-10 sm:py-20 px-4 sm:px-8">
            {/* Hero Section */}
            <div className="text-center mb-12 sm:mb-24">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/30 rounded-full text-xs font-bold text-indigo-400 mb-8">
                <Sparkles className="w-3.5 h-3.5" /> Powered by Google Gemini 2.0
              </div>
              <h1 className="text-4xl sm:text-7xl md:text-[9rem] font-black text-white mb-6 sm:mb-8 tracking-tighter leading-[0.85] bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent">
                Onboard to Any<br/>Codebase Fast.
              </h1>
              <p className="text-slate-400 text-base sm:text-xl md:text-2xl max-w-3xl mx-auto mb-8 sm:mb-10 font-medium leading-relaxed px-2">
                Architecture blueprint, hot zones, ownership map, security audit, dead code detection, and an AI onboarding guide — in under 2 minutes.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
                <button
                  onClick={() => document.querySelector('input')?.focus()}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 sm:py-5 px-8 sm:px-14 rounded-2xl sm:rounded-3xl transition-all shadow-2xl shadow-indigo-500/40 text-base sm:text-lg w-full sm:w-auto"
                >
                  Analyze a Repo — Free
                </button>
                <button
                  onClick={handleLoadDemo}
                  className="bg-slate-800 hover:bg-slate-700 text-white font-black py-4 sm:py-5 px-8 sm:px-14 rounded-2xl sm:rounded-3xl transition-all border border-slate-700 text-base sm:text-lg w-full sm:w-auto"
                >
                  Try Demo — Instant ⚡
                </button>
              </div>
              <p className="text-slate-600 text-sm">Free for 3 analyses • No signup required • Your code is never stored • We don’t train on your data</p>
            </div>

            {/* Works With Bar */}
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-4 sm:gap-x-10 mb-12 sm:mb-24 opacity-40">
              {[
                { icon: Code, label: 'GitHub' },
                { icon: Terminal, label: 'VS Code' },
                { icon: Rocket, label: 'Vercel' },
                { icon: Cloud, label: 'Supabase' },
                { icon: BrainCircuit, label: 'Claude MCP' },
                { icon: Cpu, label: 'Cursor' },
              ].map(({ icon: Icon, label }, i, arr) => (
                <React.Fragment key={label}>
                  <div className="flex items-center gap-2 text-slate-400 text-sm font-bold uppercase tracking-widest">
                    <Icon className="w-4 h-4" /> {label}
                  </div>
                  {i < arr.length - 1 && <div className="hidden sm:block w-px h-4 bg-slate-700" />}
                </React.Fragment>
              ))}
            </div>

            {/* Wave 22: Animated Dashboard Preview */}
            <AnimatedDashboardPreview />

            {/* Feature Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-12 sm:mb-24">
              {[
                { icon: Rocket, title: 'Onboarding Guide', desc: 'Personalized learning path with critical files ranked by importance. New devs ship in days, not weeks.', badge: 'AI-generated' },
                { icon: Layout, title: 'Architecture Blueprint', desc: 'Interactive graph showing how components connect. Understand data flow at a glance.', badge: 'Visual' },
                { icon: Users, title: 'Code Ownership Map', desc: 'Know exactly who owns what code and who to ask. No more guessing.', badge: 'Team Intel' },
                { icon: Activity, title: 'Hot Zones', desc: 'See which files are actively being developed. Avoid stepping on ongoing work.', badge: 'Real-time' },
                { icon: GitPullRequest, title: 'PR Review Copilot', desc: 'AI-powered pull request reviews. Risk assessment, suggestions, and file-by-file analysis.', badge: 'NEW' },
                { icon: Shield, title: 'Security Audit', desc: 'Automatic vulnerability detection with remediation steps. Keep your code secure.', badge: 'Deep Scan' },
                { icon: BrainCircuit, title: 'MCP Server', desc: 'Use GitMindPro as an MCP tool inside Claude Desktop, Cursor, Windsurf. analyze_repo, get_scorecard and more.', badge: 'Claude MCP' },
                { icon: Zap, title: 'Performance Intelligence', desc: 'Bundle risk scorer, Core Web Vitals predictor, and render complexity profiler for your codebase.', badge: 'Wave 21' },
                { icon: Share2, title: 'Share & Collaborate', desc: 'Share analysis results with your team via public links. Export to PDF or Markdown.', badge: 'Viral' },
              ].map((feature) => (
                <div key={feature.title} className="group bg-slate-900/40 border border-slate-800 rounded-2xl sm:rounded-3xl p-5 sm:p-8 hover:border-indigo-500/40 transition-all hover:-translate-y-1 duration-300">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-indigo-500/15 rounded-xl flex items-center justify-center group-hover:bg-indigo-500/25 transition-colors">
                      <feature.icon className="w-5 h-5 text-indigo-400" />
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 bg-indigo-500/10 text-indigo-400 rounded-full">{feature.badge}</span>
                  </div>
                  <h3 className="text-lg font-black text-white mb-2">{feature.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>

            {/* Pricing Preview */}
            <div className="mb-12 sm:mb-24">
              <div className="text-center mb-8 sm:mb-12">
                <h2 className="text-2xl sm:text-4xl font-black text-white mb-4">Simple, Developer-Friendly Pricing</h2>
                <p className="text-slate-400 text-sm sm:text-lg">Start free. Upgrade when you need unlimited power.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto">
                <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8">
                  <h3 className="text-lg font-black text-white mb-1">Free</h3>
                  <div className="text-3xl font-black text-white mb-4">$0</div>
                  <ul className="space-y-2 text-sm text-slate-400 mb-6">
                    <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> 3 analyses per day</li>
                    <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> AI code intelligence</li>
                    <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> Architecture blueprint</li>
                  </ul>
                  <button onClick={() => document.querySelector('input')?.focus()} className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-black rounded-2xl text-xs uppercase tracking-widest transition-all">
                    Get Started
                  </button>
                </div>
                <div className="bg-indigo-950/30 border border-indigo-500 rounded-3xl p-8 relative">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-indigo-600 rounded-full text-[9px] font-black uppercase tracking-widest text-white">7-day free trial</div>
                  <h3 className="text-lg font-black text-white mb-1">Pro</h3>
                  <div className="text-3xl font-black text-white mb-4">$9<span className="text-sm text-slate-500 font-medium">/mo</span></div>
                  <ul className="space-y-2 text-sm text-slate-300 mb-6">
                    <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> Unlimited analyses</li>
                    <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> PR review copilot</li>
                    <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> Export PDF & Markdown</li>
                    <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> Analysis history</li>
                  </ul>
                  <button onClick={() => setShowPricing(true)} className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl text-xs uppercase tracking-widest transition-all">
                    Start Free Trial
                  </button>
                </div>
                <div className="bg-violet-950/20 border border-violet-500/40 rounded-3xl p-8">
                  <h3 className="text-lg font-black text-white mb-1">Team</h3>
                  <div className="text-3xl font-black text-white mb-4">$49<span className="text-sm text-slate-500 font-medium">/mo</span></div>
                  <ul className="space-y-2 text-sm text-slate-300 mb-6">
                    <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> Everything in Pro</li>
                    <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> 25 team members</li>
                    <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> Shared workspaces</li>
                    <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> Team analytics</li>
                  </ul>
                  <button onClick={() => setShowPricing(true)} className="w-full py-3 bg-violet-600 hover:bg-violet-500 text-white font-black rounded-2xl text-xs uppercase tracking-widest transition-all">
                    Upgrade to Team
                  </button>
                </div>
              </div>
              <p className="text-center text-slate-600 text-xs mt-4">Annual billing available — save 27%</p>
            </div>

            {/* Trust Signals */}
            <div className="mb-24">
              <div className="text-center mb-12">
                <h3 className="text-2xl font-black text-white mb-2">Built for Real Engineering Teams</h3>
                <p className="text-slate-500">See what developers are saying</p>
              </div>

              {/* Data Privacy Strip */}
              <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 mb-10 text-xs text-slate-500 font-bold uppercase tracking-widest">
                <span className="flex items-center gap-2"><span className="text-emerald-400">✓</span> We never store your source code</span>
                <span className="hidden sm:block w-px h-4 bg-slate-800" />
                <span className="flex items-center gap-2"><span className="text-emerald-400">✓</span> We don’t train on your data</span>
                <span className="hidden sm:block w-px h-4 bg-slate-800" />
                <span className="flex items-center gap-2"><span className="text-emerald-400">✓</span> GitHub OAuth — minimum scopes only</span>
                <span className="hidden sm:block w-px h-4 bg-slate-800" />
                <span className="flex items-center gap-2"><span className="text-emerald-400">✓</span> Stripe-secured payments</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
                  <div className="flex items-center gap-1 mb-3">
                    {[1,2,3,4,5].map(s => <span key={s} className="text-amber-400 text-sm">★</span>)}
                  </div>
                  <p className="text-slate-300 text-sm italic mb-4">&quot;Saved me 2 days onboarding to a new team. The AI explanations are spot-on. Every dev should use this.&quot;</p>
                  <div className="text-slate-500 text-xs font-bold">— Senior Developer, fintech startup</div>
                </div>
                <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
                  <div className="flex items-center gap-1 mb-3">
                    {[1,2,3,4,5].map(s => <span key={s} className="text-amber-400 text-sm">★</span>)}
                  </div>
                  <p className="text-slate-300 text-sm italic mb-4">&quot;The PR review copilot caught a security hole our team missed. Paying for itself immediately.&quot;</p>
                  <div className="text-slate-500 text-xs font-bold">— Tech Lead, SaaS company</div>
                </div>
                <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
                  <div className="flex items-center gap-1 mb-3">
                    {[1,2,3,4,5].map(s => <span key={s} className="text-amber-400 text-sm">★</span>)}
                  </div>
                  <p className="text-slate-300 text-sm italic mb-4">&quot;Hot zones + ownership map = no more stepping on teammates&apos; work. This is essential for remote teams.&quot;</p>
                  <div className="text-slate-500 text-xs font-bold">— Engineering Manager, remote-first</div>
                </div>
              </div>
            </div>

            {/* Final CTA */}
            <div className="text-center py-10 sm:py-16 px-4 bg-gradient-to-b from-indigo-950/20 to-transparent rounded-2xl sm:rounded-3xl border border-indigo-500/10">
              <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-white mb-4 sm:mb-6">Stop Wasting Time<br/>Reading Code Blindly</h2>
              <p className="text-slate-400 text-sm sm:text-lg mb-6 sm:mb-8 max-w-2xl mx-auto">Join developers who onboard to new codebases 10x faster with AI-powered analysis.</p>
              <button
                onClick={() => document.querySelector('input')?.focus()}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 sm:py-5 px-8 sm:px-14 rounded-2xl sm:rounded-3xl transition-all shadow-2xl shadow-indigo-500/40 text-base sm:text-lg w-full sm:w-auto"
              >
                Analyze Your First Repo — Free
              </button>
            </div>

            {/* ── Footer ── */}
            <footer className="mt-20 sm:mt-28 pt-10 border-t border-slate-800/50 pb-36">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600">
                <p>© {new Date().getFullYear()} GitMindPro. All rights reserved.</p>
                <div className="flex items-center gap-6">
                  <button onClick={() => setShowPrivacy(true)} className="hover:text-slate-400 transition-colors">Privacy Policy</button>
                  <button onClick={() => setShowTerms(true)} className="hover:text-slate-400 transition-colors">Terms of Service</button>
                  <a href="mailto:support@gitmindpro.com" className="hover:text-slate-400 transition-colors">Contact</a>
                </div>
              </div>
            </footer>
          </div>
        )}
      </main>

      {/* Command Palette (Cmd+K) */}
      {cmdPaletteOpen && (() => {
        const actions = [
          { id: 'new', label: 'New Analysis', desc: 'Paste a GitHub URL', icon: Plus, action: () => { setCmdPaletteOpen(false); document.querySelector('input')?.focus(); } },
          { id: 'demo', label: 'Try Demo — React', desc: 'Explore facebook/react instantly', icon: Rocket, action: () => { setCmdPaletteOpen(false); handleLoadDemo(); } },
          { id: 'theme', label: theme === 'dark' ? 'Light Mode' : 'Dark Mode', desc: 'Toggle theme', icon: theme === 'dark' ? Sun : Moon, action: () => { setCmdPaletteOpen(false); toggleTheme(); } },
          { id: 'shortcuts', label: 'Keyboard Shortcuts', desc: 'View all shortcuts', icon: Zap, action: () => { setCmdPaletteOpen(false); setShowShortcuts(true); } },
          { id: 'settings', label: 'Settings', desc: 'Theme, notifications, API keys', icon: Settings, action: () => { setCmdPaletteOpen(false); setShowSettings(true); } },
          { id: 'changelog', label: "What's New", desc: 'Latest features and updates', icon: Sparkles, action: () => { setCmdPaletteOpen(false); setShowChangelog(true); } },
          { id: 'search', label: 'Search All Analyses', desc: 'Find past analyses and PR reviews', icon: Search, action: () => { setCmdPaletteOpen(false); setShowGlobalSearch(true); } },
          { id: 'export', label: 'Export History', desc: 'Download analyses & PR reviews as CSV', icon: Download, action: () => { setCmdPaletteOpen(false); setShowExportCSV(true); } },
          { id: 'team-feed', label: 'Team Activity', desc: 'See what your team is analyzing', icon: Users, action: () => { setCmdPaletteOpen(false); setShowTeamActivity(true); } },
          { id: 'reports', label: 'Scheduled Reports', desc: 'Auto-email repo health summaries', icon: Calendar, action: () => { setCmdPaletteOpen(false); setShowScheduledReports(true); } },
          { id: 'weights', label: 'Scoring Weights', desc: 'Customize category importance', icon: Sliders, action: () => { setCmdPaletteOpen(false); setShowScoringWeights(true); } },
          ...(analysisHistory.length >= 2 ? [{ id: 'diff', label: 'Analysis Diff', desc: 'Compare analyses over time', icon: BarChart3, action: () => { setCmdPaletteOpen(false); setShowAnalysisDiff(true); } }] : []),
          { id: 'pricing', label: 'Pricing & Plans', desc: subscription.plan === 'free' ? 'Upgrade to Pro' : 'Manage billing', icon: CreditCard, action: () => { setCmdPaletteOpen(false); setShowPricing(true); } },
          { id: 'compare', label: 'Compare Repos', desc: 'Side-by-side AI analysis', icon: GitBranch, action: () => { setCmdPaletteOpen(false); setDashboardTab('compare'); } },
          { id: 'marketplace', label: 'Expert Marketplace', desc: 'Hire developers or list your skills', icon: Briefcase, action: () => { setCmdPaletteOpen(false); setDashboardTab('marketplace'); } },
          ...(authUser ? [
            { id: 'signout', label: 'Sign Out', desc: authUser.user_metadata?.user_name || 'GitHub account', icon: LogOut, action: () => { setCmdPaletteOpen(false); void signOutAuth(); } },
          ] : [
            { id: 'signin', label: 'Sign In with GitHub', desc: 'Unlock full features', icon: LogIn, action: () => { setCmdPaletteOpen(false); void signInWithGitHub(); } },
          ]),
          ...analysisHistory.map(a => ({
            id: `hist-${a.id}`,
            label: `${a.repoOwner}/${a.repoName}`,
            desc: `Analyzed ${new Date(a.createdAt).toLocaleDateString()}`,
            icon: Code,
            action: async () => {
              setCmdPaletteOpen(false);
              window.scrollTo({ top: 0, behavior: 'smooth' });
              const ok = await handleRehydrate(a.id);
              if (!ok) setUrl(a.repoUrl);
            },
          })),
        ];
        const filtered = cmdQuery ? actions.filter(a => `${a.label} ${a.desc}`.toLowerCase().includes(cmdQuery.toLowerCase())) : actions;
        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-start justify-center pt-[20vh] p-4" onClick={() => setCmdPaletteOpen(false)}>
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-800">
                <Search className="w-4 h-4 text-slate-500" />
                <input
                  ref={cmdInputRef}
                  value={cmdQuery}
                  onChange={e => setCmdQuery(e.target.value)}
                  placeholder="Search commands, repos..."
                  className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-slate-600"
                />
                <kbd className="text-[9px] text-slate-600 font-mono border border-slate-800 px-1.5 py-0.5 rounded">ESC</kbd>
              </div>
              <div className="max-h-[50vh] overflow-y-auto p-2">
                {filtered.length === 0 && (
                  <div className="text-center py-8 text-slate-600 text-sm">No results found</div>
                )}
                {filtered.map(a => (
                  <button
                    key={a.id}
                    onClick={() => void a.action()}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-800/80 text-left transition-colors group"
                  >
                    <a.icon className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white font-medium truncate">{a.label}</div>
                      <div className="text-xs text-slate-600 truncate">{a.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Free Tier Signup Prompt Modal */}
      {showSignupPrompt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 max-w-md shadow-2xl animate-in fade-in scale-95 duration-300">
            <div className="mb-6">
              <div className="w-16 h-16 bg-amber-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-amber-400" />
              </div>
              <h2 className="text-2xl font-black text-white mb-2 text-center">Free Analyses Used</h2>
              <p className="text-slate-400 text-center mb-6">
                You&apos;ve used all {freeTierStatus.limit} free analyses. Sign in with GitHub to get unlimited access!
              </p>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3 p-4 bg-slate-950 rounded-2xl border border-slate-800">
                <Rocket className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                <span className="text-sm text-slate-300">Unlimited analyses per month</span>
              </div>
              <div className="flex items-center gap-3 p-4 bg-slate-950 rounded-2xl border border-slate-800">
                <Users className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                <span className="text-sm text-slate-300">Save analysis history</span>
              </div>
              <div className="flex items-center gap-3 p-4 bg-slate-950 rounded-2xl border border-slate-800">
                <Shield className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                <span className="text-sm text-slate-300">Team workspaces &amp; invite codes</span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleSignIn}
                disabled={authBusy}
                className="w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" /> Sign in with GitHub
              </button>
              <button
                onClick={() => setShowSignupPrompt(false)}
                className="w-full px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-black rounded-2xl transition-all"
              >
                Maybe Later
              </button>
            </div>

            <p className="text-xs text-slate-500 text-center mt-6">
              Your analyses will be saved to your profile after signing in.
            </p>
          </div>
        </div>
      )}

      {/* Onboarding Wizard */}
      {showOnboarding && (
        <OnboardingWizard
          isAuthEnabled={authEnabled}
          isSignedIn={!!authUser}
          onSignIn={() => { void signInWithGitHub(); }}
          onComplete={(repoUrl) => {
            setShowOnboarding(false);
            if (repoUrl) {
              setUrl(repoUrl);
              setTimeout(() => {
                const form = document.querySelector('form');
                if (form) form.requestSubmit();
              }, 100);
            }
          }}
        />
      )}

      {/* Settings Panel */}
      {showSettings && authUser && (
        <SettingsPanel
          authUser={authUser}
          theme={theme}
          toggleTheme={toggleTheme}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Badge Embed Modal */}
      {showBadgeEmbed && repo && (
        <BadgeEmbed
          owner={repo.owner}
          repo={repo.repo}
          onClose={() => setShowBadgeEmbed(false)}
        />
      )}

      {/* Wave 22: Share Card Modal */}
      {showShareCard && analysis && repo && (
        <ShareCard
          repoOwner={repo.owner}
          repoName={repo.repo}
          scorecard={analysis.scorecard}
          summary={analysis.summary}
          techStack={analysis.techStack ?? []}
          shareUrl={lastShareToken ? `${window.location.origin}/share/${lastShareToken}` : undefined}
          onClose={() => setShowShareCard(false)}
        />
      )}

      {/* Analysis Diff Modal */}
      {showAnalysisDiff && (
        <AnalysisDiff
          analyses={analysisHistory}
          onClose={() => setShowAnalysisDiff(false)}
        />
      )}

      {/* Changelog / What's New */}
      {showChangelog && (
        <ChangelogModal onClose={() => setShowChangelog(false)} />
      )}

      {/* Global Search */}
      {showGlobalSearch && (
        <GlobalSearch
          analyses={analysisHistory}
          prReviews={prReviewHistory}
          onSelectAnalysis={async (repoUrl, analysisId) => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            const ok = await handleRehydrate(analysisId);
            if (!ok) setUrl(repoUrl);
          }}
          onClose={() => setShowGlobalSearch(false)}
        />
      )}

      {/* Team Activity Feed */}
      {showTeamActivity && authUser && activeWorkspaceId && (
        <TeamActivityFeed
          organizationId={activeWorkspaceId}
          authUser={authUser}
          onClose={() => setShowTeamActivity(false)}
        />
      )}

      {/* Export History CSV */}
      {showExportCSV && (
        <ExportHistoryCSV
          analyses={analysisHistory}
          prReviews={prReviewHistory}
          onClose={() => setShowExportCSV(false)}
        />
      )}

      {/* PR Diff Viewer */}
      {showDiffViewer && prReviewMeta && (
        <PRDiffViewer
          files={prReviewFiles}
          prNumber={prReviewMeta.number}
          prTitle={prReviewMeta.title}
          onClose={() => setShowDiffViewer(false)}
        />
      )}

      {/* Scheduled Reports */}
      {showScheduledReports && authUser && (
        <ScheduledReports
          userEmail={authUser.email || ''}
          watchedRepos={[...watchedRepos]}
          onClose={() => setShowScheduledReports(false)}
        />
      )}

      {/* Custom Scoring Weights */}
      {showScoringWeights && (
        <CustomScoringWeights
          currentScores={analysis?.scorecard || null}
          onClose={() => setShowScoringWeights(false)}
          onSave={(w) => setScoringWeights(w)}
        />
      )}

      {/* Wave 10: What's Next panel — slides up after analysis */}
      {showWhatsNext && (
        <WhatsNextPanel
          onClose={() => setShowWhatsNext(false)}
          onWatchRepo={() => {
            if (authUser && repo) {
              void watchRepo(authUser.id, repo.owner, repo.repo, activeWorkspaceId || null)
                .catch(() => { /* silent */ });
              addNotification({ type: 'analysis_complete', title: 'Watching Repo', message: `Now watching ${repo.owner}/${repo.repo}` });
            }
          }}
          onGoToPRTab={() => setActiveTab('pr-review' as AppTab)}
          onShareScorecard={() => void handleShareAnalysis()}
          hasShareToken={!!lastShareToken}
        />
      )}

      {/* Keyboard Shortcuts Overlay */}
      {showShortcuts && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowShortcuts(false)}>
          <div onClick={e => e.stopPropagation()} className="bg-slate-900 border border-slate-700 rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl animate-in zoom-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-white flex items-center gap-2"><Zap className="w-5 h-5 text-amber-400" /> Keyboard Shortcuts</h2>
              <button onClick={() => setShowShortcuts(false)} className="text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              {[
                { keys: '⌘ K', desc: 'Open command palette' },
                { keys: '?', desc: 'Show this overlay' },
                { keys: 'Esc', desc: 'Close any modal' },
                { keys: '⌘ Enter', desc: 'Submit analysis' },
                { keys: '/', desc: 'Focus search bar' },
              ].map(shortcut => (
                <div key={shortcut.keys} className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-slate-800/50 transition-colors">
                  <span className="text-slate-300 text-sm">{shortcut.desc}</span>
                  <kbd className="px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-lg text-xs font-mono text-slate-400">{shortcut.keys}</kbd>
                </div>
              ))}
            </div>
            <p className="text-slate-600 text-xs mt-6 text-center">Press <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-[10px] font-mono">Esc</kbd> to close</p>
          </div>
        </div>
      )}

      {/* Privacy Policy Modal */}
      {showPrivacy && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[300] flex items-center justify-center p-4" onClick={() => setShowPrivacy(false)}>
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl max-h-[85vh] overflow-y-auto custom-scrollbar shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-slate-900 border-b border-slate-800 px-8 py-5 flex items-center justify-between rounded-t-3xl z-10">
              <h2 className="text-lg font-black text-white">Privacy Policy</h2>
              <button onClick={() => setShowPrivacy(false)} className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="px-8 py-6 space-y-6 text-sm text-slate-400 leading-relaxed">
              <p className="text-slate-500 text-xs">Last updated: March 27, 2026</p>

              <div>
                <h3 className="font-bold text-white mb-2">What We Collect</h3>
                <p>When you sign in with GitHub OAuth we receive your GitHub username, email address, and avatar. We store the repository URLs you analyze and your analysis history so you can access them later. We collect usage data (analyses run, plan type) to enforce limits and improve the service.</p>
              </div>

              <div>
                <h3 className="font-bold text-white mb-2">What We Do Not Collect</h3>
                <p>We do not store your source code. When you analyze a repository, we query the GitHub API on your behalf and forward repository metadata to Google Gemini for AI processing. No source code is retained on our servers beyond the duration of a single request.</p>
              </div>

              <div>
                <h3 className="font-bold text-white mb-2">Third-Party Services</h3>
                <ul className="space-y-1.5 list-disc list-inside">
                  <li><span className="text-white font-medium">Supabase</span> — stores your account, analysis history, and workspace data.</li>
                  <li><span className="text-white font-medium">Stripe</span> — handles billing and subscriptions. We never see your full card details.</li>
                  <li><span className="text-white font-medium">Google Gemini</span> — processes repository metadata to generate AI insights.</li>
                  <li><span className="text-white font-medium">GitHub OAuth</span> — authenticates your identity. We request only the minimum scopes required.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-white mb-2">Data Retention</h3>
                <p>Your data is retained while your account is active. You may request deletion of your account and all associated data at any time by contacting us below.</p>
              </div>

              <div>
                <h3 className="font-bold text-white mb-2">Your Rights</h3>
                <p>You have the right to access, correct, or delete your personal data. To exercise these rights, contact us at <a href="mailto:support@gitmindpro.com" className="text-indigo-400 hover:underline">support@gitmindpro.com</a>.</p>
              </div>

              <div className="pt-4 border-t border-slate-800">
                <p className="text-slate-500 text-xs">Questions? <a href="mailto:support@gitmindpro.com" className="text-indigo-400 hover:underline">support@gitmindpro.com</a></p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Terms of Service Modal */}
      {showTerms && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[300] flex items-center justify-center p-4" onClick={() => setShowTerms(false)}>
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl max-h-[85vh] overflow-y-auto custom-scrollbar shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-slate-900 border-b border-slate-800 px-8 py-5 flex items-center justify-between rounded-t-3xl z-10">
              <h2 className="text-lg font-black text-white">Terms of Service</h2>
              <button onClick={() => setShowTerms(false)} className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="px-8 py-6 space-y-6 text-sm text-slate-400 leading-relaxed">
              <p className="text-slate-500 text-xs">Last updated: March 27, 2026</p>

              <div>
                <h3 className="font-bold text-white mb-2">Using GitMindPro</h3>
                <p>You may use GitMindPro to analyze public GitHub repositories. To analyze private repositories, you must provide a GitHub Personal Access Token (PAT) with the appropriate scopes. You are responsible for ensuring you have the right to analyze any repository you submit.</p>
              </div>

              <div>
                <h3 className="font-bold text-white mb-2">Free &amp; Pro Plans</h3>
                <p>Free accounts receive 3 analyses per day. Pro accounts receive unlimited analyses. Billing is as described on the pricing page. Subscriptions auto-renew until cancelled. You may cancel at any time through your billing portal.</p>
              </div>

              <div>
                <h3 className="font-bold text-white mb-2">No Warranty</h3>
                <p>GitMindPro is provided "as is" without warranty of any kind. AI-generated analysis may contain errors and should not be used as the sole basis for security or architectural decisions. We are not liable for actions taken based on analysis output.</p>
              </div>

              <div>
                <h3 className="font-bold text-white mb-2">Your Data &amp; Outputs</h3>
                <p>AI analysis outputs you receive are yours. We do not claim ownership of insights generated from your repositories.</p>
              </div>

              <div>
                <h3 className="font-bold text-white mb-2">Prohibited Use</h3>
                <p>You may not use GitMindPro to: (a) probe for vulnerabilities in systems you do not own or have permission to test; (b) mass-scrape analysis outputs; (c) resell or sublicense access to the service; (d) circumvent rate limits or access controls.</p>
              </div>

              <div>
                <h3 className="font-bold text-white mb-2">Termination</h3>
                <p>We reserve the right to suspend or terminate accounts that violate these terms, with or without notice.</p>
              </div>

              <div className="pt-4 border-t border-slate-800">
                <p className="text-slate-500 text-xs">Questions? <a href="mailto:support@gitmindpro.com" className="text-indigo-400 hover:underline">support@gitmindpro.com</a></p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pricing Modal */}
      {showPricing && authUser && (
        <PricingModal
          subscription={subscription}
          onClose={() => setShowPricing(false)}
          onUpgrade={async (priceId, trial) => {
            await startCheckout({ priceId, userId: authUser.id, email: authUser.email || '', trial });
          }}
          onManage={async () => {
            await openBillingPortal(authUser.id);
          }}
        />
      )}

      {/* Expert Hire Modal */}
      {showExpertHire && authUser && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar">
            <ExpertMarketplace
              authUser={authUser}
              repoUrl={repo?.url || undefined}
              analysisId={lastAnalysisId || undefined}
              onClose={() => setShowExpertHire(false)}
            />
          </div>
        </div>
      )}

      <div className={`fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 transition-all duration-500 z-[100] ${isTerminalOpen ? 'h-[400px]' : 'h-14'}`}>
         <div className="h-14 flex items-center justify-between px-10 border-b border-slate-800 cursor-pointer" onClick={() => setIsTerminalOpen(!isTerminalOpen)}>
            <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.2em]"><Terminal className="w-4 h-4 text-indigo-500" /><span className="text-white">Autonomous Ecosystem Log</span></div>
            {isTerminalOpen ? <ChevronDown className="w-5 h-5 text-slate-500" /> : <ChevronUp className="w-5 h-5 text-slate-500" />}
         </div>
         <div className="p-10 h-[340px] overflow-y-auto mono text-xs space-y-3 custom-scrollbar bg-black/40">
            {terminalLogs.map(log => (
               <div key={log.id} className="flex gap-6 items-start">
                  <span className="text-slate-700 shrink-0">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                  <span className={`font-black uppercase text-[8px] px-2 py-0.5 rounded shrink-0 ${log.type === 'ai' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-800 text-slate-500'}`}>{log.type}</span>
                  <span className="text-slate-400">{log.message}</span>
               </div>
            ))}
         </div>
      </div>
    </div>
  );
};

export default App;
