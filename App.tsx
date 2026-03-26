
import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { User } from '@supabase/supabase-js';
import { jsPDF } from 'jspdf';
import ReactFlow, { Background, Controls, MiniMap, useNodesState, useEdgesState, ConnectionLineType, useReactFlow, ReactFlowProvider, Node, Edge, OnNodesChange, OnEdgesChange } from 'reactflow';
import { parseGithubUrl, fetchRepoDetails, fetchRepoStructure, fetchFileContent, fetchIssues, fetchPullRequests, fetchContributors, analyzeDependencies, fetchLanguageStats, fetchRecentCommits, fetchCodeOwnership, fetchPullRequestFiles } from './services/githubService';
import { analyzeRepository, chatWithRepo, generateSpeech, synthesizeLabTask, explainCode, generateVisionVideo, performDeepAudit, analyzeIssues, analyzePullRequests, analyzeTeamDynamics, generateOnboardingGuide, analyzeCodeOwnership, analyzeRecentActivity, analyzeTestingSetup, generateVulnerabilityRemediation, analyzePullRequestFiles } from './services/geminiService';
import { acceptWorkspaceInvitation, canAnalyzeToday, createWorkspace, createWorkspaceInvitation, ensurePersonalWorkspace, ensureUserProfile, getAnalysisHistory, getPRReviewHistory, getCurrentUser, isAuthConfigured, listUserWorkspaces, listWorkspaceMembers, onAuthStateChange, saveAnalysisRecord, savePRReview, signInWithGitHub, signOutAuth } from './services/supabaseService';
import { canUseFreeTier, getFreeTierStatus, incrementFreeTierCount } from './utils/freeTier';
import { GithubRepo, FileNode, AnalysisResult, ChatMessage, AppTab, TerminalLog, DeepAudit, ProjectInsights, CodeHealth, OnboardingGuide, InsightSummary, VulnerabilityRemediationPlan, PRReviewResult, SavedAnalysis, SavedPRReview, Workspace } from './types';
import FileTree from './components/FileTree';
import Loader from './components/Loader';
import ScoreCard from './components/ScoreCard';
import AnalysisHistory from './components/AnalysisHistory';
import { Search, Code, Layout, TrendingUp, Shield, Send, Activity, Cloud, Zap, FlaskConical, Sparkles, Terminal, Rocket, Server, ChevronUp, ChevronDown, Video, MapPin, Users, BrainCircuit, AlertTriangle, GitPullRequest, Bug, Package, LogIn, LogOut, ClipboardCheck } from 'lucide-react';

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
  const freeDailyAnalysisLimit = Number(import.meta.env.VITE_FREE_DAILY_ANALYSIS_LIMIT ?? 3);
  const fastMode = fastModeFlag === 'true' || fastModeFlag === '1';
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
  const [prReviewFiles, setPrReviewFiles] = useState<{ filename: string; status: string; additions: number; deletions: number }[]>([]);
  
  // Free tier state
  const [freeTierStatus, setFreeTierStatus] = useState(getFreeTierStatus());
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);

  // Analysis history state
  const [analysisHistory, setAnalysisHistory] = useState<SavedAnalysis[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // PR review history state
  const [prReviewHistory, setPrReviewHistory] = useState<SavedPRReview[]>([]);
  const [prHistoryLoading, setPrHistoryLoading] = useState(false);
  
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

  const exportAnalysisPdf = useCallback(() => {
    if (!repo || !analysis) return;

    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const margin = 40;
    let y = 50;

    doc.setFontSize(20);
    doc.text('GitMindPro Repository Analysis', margin, y);
    y += 30;

    doc.setFontSize(12);
    doc.text(`Repository: ${repo.owner}/${repo.repo}`, margin, y);
    y += 18;
    doc.text(`URL: ${repo.url}`, margin, y);
    y += 18;
    doc.text(`Generated: ${new Date().toLocaleString()}`, margin, y);
    y += 24;

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
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);

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
        void (async () => {
          await ensureUserProfile(user).catch((err) => {
            addLog(`Profile sync warning: ${getErrorText(err)}`, 'error');
          });
          await loadUserWorkspaces(user);
        })();
      } else {
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

  const handleCreateWorkspace = async () => {
    if (!authUser) {
      addLog('Sign in first to create a workspace', 'warning');
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
      alert(`Workspace creation failed: ${message}`);
    } finally {
      setWorkspaceLoading(false);
    }
  };

  const handleSignIn = async () => {
    if (!authEnabled) {
      alert('Auth is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
      return;
    }

    setAuthBusy(true);
    try {
      await signInWithGitHub();
    } catch (err) {
      const message = getErrorText(err);
      addLog(`Sign-in failed: ${message}`, 'error');
      alert(`Sign-in failed: ${message}`);
    } finally {
      setAuthBusy(false);
    }
  };

  const handleSignOut = async () => {
    setAuthBusy(true);
    try {
      await signOutAuth();
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
    setTourHasAutoPlayed(true);
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
      alert(`Invite created for ${invite.invitedEmail}. The invite code has been copied to your clipboard.`);
      addLog(`Invite created for ${invite.invitedEmail}`, 'success');
    } catch (err) {
      const message = getErrorText(err);
      addLog(`Failed to create invite: ${message}`, 'error');
      alert(`Invite creation failed: ${message}`);
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
      alert('Workspace joined successfully.');
    } catch (err) {
      const message = getErrorText(err);
      addLog(`Failed to join workspace: ${message}`, 'error');
      alert(`Join failed: ${message}`);
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
        return `${member.role.toUpperCase()} - ${name}`;
      });
      alert(`${activeWorkspace.name} members\n\n${lines.join('\n') || 'No members found.'}`);
      addLog(`Loaded ${members.length} workspace members`, 'success');
    } catch (err) {
      const message = getErrorText(err);
      addLog(`Failed to load members: ${message}`, 'error');
      alert(`Could not load members: ${message}`);
    } finally {
      setWorkspaceLoading(false);
    }
  };

  const handleImport = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // Check free tier for non-authenticated users
    if (!authUser && !canUseFreeTier()) {
      addLog('Free analyses limit reached (3/3). Sign in to continue.', 'error');
      setShowSignupPrompt(true);
      alert('You\'ve used all 3 free analyses. Sign in with GitHub to get unlimited access or wait until tomorrow.');
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
            alert(`Daily free limit reached: ${usage.usedToday}/${usage.limit}. Please try again tomorrow or upgrade.`);
            return;
          }
          addLog(`Daily usage: ${usage.usedToday}/${usage.limit} analyses used`, 'info');
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
      
      // Increment free tier counter for non-authenticated users
      if (!authUser) {
        const newStatus = incrementFreeTierCount();
        setFreeTierStatus(newStatus);
        addLog(`Free analyses used: ${newStatus.used}/${newStatus.limit}`, 'info');
        
        // Show signup prompt if they've used all free analyses
        if (newStatus.used >= newStatus.limit) {
          setShowSignupPrompt(true);
        }
      }
      
      if (authEnabled && authUser) {
        void saveAnalysisRecord({
          userId: authUser.id,
          organizationId: activeWorkspaceId || null,
          repoOwner: details.owner,
          repoName: details.repo,
          repoUrl: details.url,
          analysis: res
        })
          .then(() => {
            addLog('Analysis saved to your profile', 'success');
            void loadAnalysisHistory(authUser.id, activeWorkspaceId || undefined);
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
        alert(`Analysis timed out. We have increased timeout to 180s and will retry in a moment. Please re-run the analysis.

${errorMessage}`);
      } else {
        addLog(`❌ Error: ${errorMessage}`, 'error');
        alert(`Failed to analyze repository:\n\n${errorMessage}\n\nCheck the browser console (F12) for more details.`);
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
      setPrReviewFiles(files.map(f => ({ filename: f.filename, status: f.status, additions: f.additions, deletions: f.deletions })));
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

  return (
    <div className="min-h-screen bg-[#020617] text-slate-300 font-sans selection:bg-indigo-500/30">
      <nav className="border-b border-slate-800 bg-[#020617]/95 backdrop-blur-2xl sticky top-0 z-50">
        <div className="max-w-[1900px] mx-auto px-10 h-24 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center font-black text-white shadow-2xl text-2xl neural-pulse cursor-pointer" onClick={() => window.location.reload()}>GM</div>
            <div className="hidden lg:block">
               <span className="text-white font-extrabold tracking-tighter text-3xl block leading-none">GitMind<span className="text-indigo-500">PRO</span></span>
               <span className="text-[10px] text-slate-500 uppercase tracking-[0.5em] font-black mt-1">Onboard to Any Codebase in 5 Minutes</span>
            </div>
          </div>
          
          <form onSubmit={handleImport} className="flex-grow max-w-xl mx-12 relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-500 transition-colors" />
            <input className="w-full bg-slate-900 border border-slate-800 rounded-3xl pl-16 pr-6 py-5 text-lg text-white outline-none placeholder:text-slate-600 shadow-2xl" placeholder="Paste your company's GitHub repo URL..." value={url} onChange={(e) => setUrl(e.target.value)} />
          </form>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
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
                      className="px-3 py-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-200"
                    >
                      {workspaces.length === 0 && <option value="">No Workspace</option>}
                      {workspaces.map((workspace) => (
                        <option key={workspace.id} value={workspace.id}>
                          {workspace.name}{workspace.isPersonal ? ' (Personal)' : ''}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleCreateWorkspace}
                      disabled={workspaceLoading}
                      className="px-4 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all bg-slate-900 border border-slate-800 text-indigo-300 hover:text-white disabled:opacity-50"
                    >
                      New Workspace
                    </button>
                    <button
                      onClick={handleJoinWorkspace}
                      disabled={workspaceLoading}
                      className="px-4 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all bg-slate-900 border border-slate-800 text-sky-300 hover:text-white disabled:opacity-50"
                    >
                      Join
                    </button>
                    <button
                      onClick={handleInviteMember}
                      disabled={workspaceLoading || !activeWorkspace || activeWorkspace.isPersonal || !['owner', 'admin'].includes(activeWorkspace.role)}
                      className="px-4 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all bg-slate-900 border border-slate-800 text-violet-300 hover:text-white disabled:opacity-50"
                    >
                      Invite
                    </button>
                    <button
                      onClick={handleViewMembers}
                      disabled={workspaceLoading || !activeWorkspace}
                      className="px-4 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all bg-slate-900 border border-slate-800 text-emerald-300 hover:text-white disabled:opacity-50"
                    >
                      Members
                    </button>
                  </div>
                  <span className="px-4 py-2 rounded-2xl bg-slate-900 border border-slate-800 text-[10px] font-black uppercase tracking-widest text-emerald-300">
                    {authUser.user_metadata?.user_name ? `@${authUser.user_metadata.user_name}` : (authUser.email || 'Signed in')}
                  </span>
                  <button
                    onClick={handleSignOut}
                    disabled={authBusy}
                    className="flex items-center gap-2 px-4 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-50"
                  >
                    <LogOut className="w-4 h-4" /> Sign out
                  </button>
                </>
              ) : (
                <button
                  onClick={handleSignIn}
                  disabled={authBusy || authLoading}
                  className="flex items-center gap-2 px-5 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50"
                >
                  <LogIn className="w-4 h-4" /> {authLoading ? 'Checking session...' : 'Sign in'}
                </button>
              )}
            </div>
            {!authUser && !authLoading && (
              <div className="px-4 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-[10px] font-black uppercase tracking-widest text-amber-400">
                {freeTierStatus.remaining} / {freeTierStatus.limit} free remaining
              </div>
            )}
            <div className="flex items-center gap-2">
              <a
                href={vscodeExtensionUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 px-5 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all bg-slate-900 border border-slate-800 text-indigo-300 hover:text-white"
              >
                <Code className="w-4 h-4" /> VS Code
              </a>
              <a
                href={vscodeExtensionDeepLink}
                className="px-3 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all bg-slate-900 border border-slate-800 text-slate-500 hover:text-white"
                aria-label="Open GitMind Pro extension in VS Code"
                title="Requires VS Code"
              >
                Open in VS Code
              </a>
            </div>
            {analysis && (
              <>
                <button onClick={() => { void fetchProjectInsights(); }} disabled={insightsLoading} className={`flex items-center gap-3 px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${insights ? 'bg-emerald-600 text-white' : 'bg-slate-900 border border-slate-800 text-emerald-400 hover:text-white'}`}>
                   <TrendingUp className="w-4 h-4" /> Team Health
                </button>
                <button onClick={runAudit} disabled={auditLoading} className={`flex items-center gap-3 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-slate-900 border border-slate-800 text-amber-400 hover:text-white transition-all`}>
                  <Shield className="w-4 h-4" /> Security Audit
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-[1900px] mx-auto p-12 pb-48">
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
          <div className="grid grid-cols-12 gap-12">
            
            <div className="col-span-12 xl:col-span-3 space-y-10">
               <div className="bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-10 backdrop-blur-3xl shadow-2xl relative overflow-hidden">
                  <h3 className="text-white font-black flex items-center gap-4 text-xl mb-10"><Layout className="w-6 h-6 text-indigo-400" /> File Explorer</h3>
                  <div className="max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar">
                    <FileTree nodes={structure} onSelectFile={handleFileSelect} selectedPath={selectedFile?.path} />
                  </div>
               </div>
            </div>

            <div className="col-span-12 xl:col-span-6 space-y-10">
               <div className="flex flex-wrap items-center gap-2 p-2 bg-slate-900/50 border border-slate-800 rounded-[2rem] shadow-2xl">
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: 'intelligence', label: 'Getting Started', icon: Rocket },
                      { id: 'blueprint', label: 'Architecture', icon: Layout },
                      { id: 'insights', label: 'Team & Issues', icon: Users },
                      { id: 'pr-review', label: 'PR Review', icon: ClipboardCheck },
                      { id: 'cloud', label: 'Tech Stack', icon: Server },
                      { id: 'audit', label: 'Security', icon: BrainCircuit }
                    ].map(tab => (
                      <button key={tab.id} onClick={() => { setActiveTab(tab.id as AppTab); if (tab.id === 'insights' && !insights) fetchProjectInsights(); }} className={`flex items-center gap-2 px-6 py-3 rounded-[1.2rem] text-[9px] font-black uppercase tracking-[0.15em] transition-all ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-2xl' : 'text-slate-500 hover:text-slate-200 hover:bg-slate-800/50'}`}>
                        <tab.icon className="w-3.5 h-3.5" /> {tab.label}
                      </button>
                    ))}
                  </div>
                  {analysis && (
                    <button onClick={exportAnalysisPdf} className="ml-auto px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white font-black rounded-xl transition-all text-xs">
                      Export to PDF
                    </button>
                  )}
               </div>

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
                                <h4 className="text-lg font-black text-white mb-4 group-hover:text-amber-400 transition-colors flex items-center gap-2 break-words">
                                  <span className="text-2xl">🎯</span>
                                  {task.task}
                                </h4>
                                <ol className="space-y-2">
                                  {task.steps.map((step, j) => (
                                    <li key={j} className="text-sm text-slate-400 group-hover:text-slate-300 flex gap-3 transition-colors min-w-0">
                                      <span className="text-amber-500 font-bold group-hover:scale-125 transition-transform inline-block">{j + 1}.</span>
                                      <span className="break-words">{step}</span>
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
                                      className="text-sm text-slate-300 font-mono cursor-pointer hover:text-emerald-300 transition-colors"
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
                      </>
                    ) : analysis ? (
                      <div className="bg-slate-900/40 border border-slate-800 rounded-[3rem] p-12 shadow-2xl">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                          <ScoreCard scores={analysis.scorecard} />
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
                                  {Math.random() > 0.5 
                                    ? "Click any file in the tree to get an AI explanation of what it does!"
                                    : "The 'Recent Activity' section will show you which files are being actively changed - avoid those at first!"}
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
                           </div>
                         )}
                      </div>
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
                       </div>

                       {prReviewFiles.length > 0 && (
                         <div className="bg-slate-900/40 border border-slate-800 rounded-[3rem] p-10 shadow-2xl">
                           <h4 className="text-lg font-black text-white mb-6">Changed Files ({prReviewFiles.length})</h4>
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
                 </div>
               )}

               {activeTab === 'blueprint' && (
                 <div className="grid grid-cols-12 gap-8">
                   <div className="col-span-12 xl:col-span-8 bg-slate-900/40 border border-slate-800 rounded-[3rem] p-0 shadow-2xl h-[700px] relative overflow-hidden flex flex-col">
                      <div className="p-10 pb-6 flex flex-wrap items-center justify-between gap-4">
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
                               setTourAutoPlay((prev) => !prev);
                               setTourHasAutoPlayed(true);
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

                   <div className="col-span-12 xl:col-span-4 bg-slate-900/40 border border-slate-800 rounded-[3rem] p-10 shadow-2xl h-[700px] flex flex-col">
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
                        <div className="mb-6 p-6 bg-slate-950 rounded-2xl border border-amber-500/20">
                          <div className="text-[10px] font-black uppercase tracking-widest text-amber-400 mb-3">
                            {analysis?.architectureTour?.title || 'Guided Walkthrough'}
                          </div>
                          <h4 className="text-white font-bold mb-3">{activeTourStep.title}</h4>
                          <ul className="space-y-2">
                            {activeTourStep.bullets.map((bullet, idx) => (
                              <li key={`${activeTourStep.nodeId}-${idx}`} className="text-slate-300 text-sm leading-relaxed flex gap-2">
                                <span className="text-amber-400 mt-1">•</span>
                                <span>{bullet}</span>
                              </li>
                            ))}
                          </ul>
                          <div className="flex items-center gap-3 mt-6">
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
                 </div>
               )}

               {activeTab === 'lab' && (
                 <div className="bg-slate-900/40 border border-slate-800 rounded-[3rem] p-12 shadow-2xl animate-in zoom-in-95 duration-500 min-h-[600px]">
                    <h2 className="text-3xl font-black text-white tracking-tighter mb-12 flex items-center gap-4"><FlaskConical className="w-8 h-8 text-indigo-400" /> Engineering Lab</h2>
                    {labLoading ? <Loader message="Synthesizing changes..." /> : labResult ? (
                       <div className="space-y-8">
                          <pre className="p-8 bg-slate-950 rounded-[2rem] border border-slate-800 overflow-x-auto text-xs text-indigo-400"><code>{labResult}</code></pre>
                          <button onClick={() => setLabResult(null)} className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white">Clear Lab Output</button>
                       </div>
                    ) : (
                       <div className="flex-grow flex flex-col items-center justify-center opacity-30 h-[400px] text-center">
                          <Rocket className="w-20 h-20 mb-8 text-slate-700" />
                          <p className="text-lg font-black uppercase tracking-widest text-slate-600">Select a file from the explorer to begin synthesis.</p>
                       </div>
                    )}
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

            <div className="col-span-12 xl:col-span-3 space-y-8">
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
        ) : (
          <div className="max-w-7xl mx-auto py-32 px-8">
            {/* Hero Section */}
            <div className="text-center mb-32">
              <h1 className="text-[10rem] font-black text-white mb-12 tracking-tighter leading-[0.8] bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent">
                Understand<br/>Any Codebase.
              </h1>
              <p className="text-slate-400 text-2xl max-w-4xl mx-auto mb-16 font-medium leading-relaxed">
                Stop spending hours understanding a new codebase. Get architecture, hot zones, learning path, and AI guidance in 5 minutes.
              </p>
              <button 
                onClick={() => document.querySelector('input')?.focus()} 
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-black py-6 px-16 rounded-3xl transition-all shadow-2xl shadow-indigo-500/50 text-xl mb-8"
              >
                Analyze a Repo
              </button>
              <p className="text-slate-500 text-sm">Free for 3 analyses • No signup required</p>
            </div>

            {/* Screenshots/Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-32">
              <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 hover:border-indigo-500/50 transition-all">
                <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center mb-6">
                  <Rocket className="w-6 h-6 text-indigo-400" />
                </div>
                <h3 className="text-xl font-black text-white mb-4">Getting Started Guide</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-6">
                  Instant onboarding with personalized learning path and critical files to read first.
                </p>
                <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800">
                  <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Example Output</div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                      <span className="text-slate-300 text-sm">Start with README.md</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                      <span className="text-slate-300 text-sm">Check package.json for dependencies</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                      <span className="text-slate-300 text-sm">Review main entry point</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 hover:border-indigo-500/50 transition-all">
                <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center mb-6">
                  <Layout className="w-6 h-6 text-indigo-400" />
                </div>
                <h3 className="text-xl font-black text-white mb-4">Architecture Overview</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-6">
                  Interactive blueprint showing how components connect and data flows.
                </p>
                <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800">
                  <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Tech Stack Detected</div>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 bg-indigo-500/10 text-indigo-400 text-xs rounded">React</span>
                    <span className="px-2 py-1 bg-indigo-500/10 text-indigo-400 text-xs rounded">TypeScript</span>
                    <span className="px-2 py-1 bg-indigo-500/10 text-indigo-400 text-xs rounded">Node.js</span>
                    <span className="px-2 py-1 bg-indigo-500/10 text-indigo-400 text-xs rounded">PostgreSQL</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 hover:border-indigo-500/50 transition-all">
                <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center mb-6">
                  <Users className="w-6 h-6 text-indigo-400" />
                </div>
                <h3 className="text-xl font-black text-white mb-4">Team Intelligence</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-6">
                  Know who owns what code and who&apos;s actively working on features.
                </p>
                <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800">
                  <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Code Ownership</div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-300 text-sm">@johndoe</span>
                      <span className="text-emerald-400 text-xs">Frontend Lead</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-300 text-sm">@sarahsmith</span>
                      <span className="text-emerald-400 text-xs">Backend Dev</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 hover:border-indigo-500/50 transition-all">
                <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center mb-6">
                  <Activity className="w-6 h-6 text-indigo-400" />
                </div>
                <h3 className="text-xl font-black text-white mb-4">Hot Zones & Activity</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-6">
                  See what&apos;s changing most and avoid stepping on active development.
                </p>
                <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800">
                  <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Recent Activity</div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-300 text-sm">auth/login.ts</span>
                      <span className="text-amber-400 text-xs">🔥 Hot</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-300 text-sm">api/users.js</span>
                      <span className="text-amber-400 text-xs">🔥 Hot</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 hover:border-indigo-500/50 transition-all">
                <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center mb-6">
                  <BrainCircuit className="w-6 h-6 text-indigo-400" />
                </div>
                <h3 className="text-xl font-black text-white mb-4">AI Copilot</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-6">
                  Ask questions about the codebase and get instant, contextual answers.
                </p>
                <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800">
                  <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Example Questions</div>
                  <div className="space-y-1">
                    <div className="text-slate-300 text-sm">• &quot;Who built the auth system?&quot;</div>
                    <div className="text-slate-300 text-sm">• &quot;How does data flow in this app?&quot;</div>
                    <div className="text-slate-300 text-sm">• &quot;What&apos;s actively being developed?&quot;</div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 hover:border-indigo-500/50 transition-all">
                <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center mb-6">
                  <Shield className="w-6 h-6 text-indigo-400" />
                </div>
                <h3 className="text-xl font-black text-white mb-4">Security & Testing</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-6">
                  Identify vulnerabilities, missing tests, and technical debt automatically.
                </p>
                <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800">
                  <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Security Insights</div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-3 h-3 text-amber-400" />
                      <span className="text-slate-300 text-sm">API keys exposed in logs</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Bug className="w-3 h-3 text-rose-400" />
                      <span className="text-slate-300 text-sm">Missing input validation</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Demo Video Placeholder */}
            {authUser && (analysisHistory.length > 0 || historyLoading) && (
              <div className="mb-32">
                <AnalysisHistory
                  analyses={analysisHistory}
                  loading={historyLoading}
                  onSelect={(repoUrl) => {
                    setUrl(repoUrl);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                />
              </div>
            )}
            <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-12 mb-32 text-center">
              <Video className="w-16 h-16 text-indigo-400 mx-auto mb-6" />
              <h3 className="text-2xl font-black text-white mb-4">See It In Action</h3>
              <p className="text-slate-400 text-lg mb-8 max-w-2xl mx-auto">
                Watch a 45-second demo showing how GitMind Pro analyzes a real codebase from GitHub URL to full insights.
              </p>
              <button className="bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 px-8 rounded-2xl transition-all">
                Watch Demo Video
              </button>
            </div>

            {/* Trust Signals */}
            <div className="text-center mb-32">
              <h3 className="text-xl font-black text-white mb-8">Trusted by Developers</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                  <div className="text-4xl mb-4">🚀</div>
                  <p className="text-slate-400 text-sm italic">&quot;Saved me 2 days onboarding to a new team. The AI explanations are spot-on.&quot;</p>
                  <div className="text-slate-500 text-xs mt-4">- Senior Developer</div>
                </div>
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                  <div className="text-4xl mb-4">💡</div>
                  <p className="text-slate-400 text-sm italic">&quot;Finally understand who owns what code. No more guessing who to ask.&quot;</p>
                  <div className="text-slate-500 text-xs mt-4">- Tech Lead</div>
                </div>
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                  <div className="text-4xl mb-4">⚡</div>
                  <p className="text-slate-400 text-sm italic">&quot;Hot zones feature prevented me from breaking active development. Game-changer.&quot;</p>
                  <div className="text-slate-500 text-xs mt-4">- Consultant</div>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="text-center">
              <h2 className="text-4xl font-black text-white mb-8">Ready to Understand Any Codebase?</h2>
              <button 
                onClick={() => document.querySelector('input')?.focus()} 
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-black py-6 px-12 rounded-3xl transition-all shadow-2xl shadow-indigo-500/50 text-xl"
              >
                Try GitMind Pro Free
              </button>
            </div>
          </div>
        )}
      </main>

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
                <span className="text-sm text-slate-300">Team workspace (coming soon)</span>
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
