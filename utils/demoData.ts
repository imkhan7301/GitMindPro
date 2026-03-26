/**
 * Wave 14: Interactive Demo Mode
 * Pre-baked analysis data for facebook/react so users can explore
 * the full dashboard instantly without API keys, auth, or waiting.
 */

import type { GithubRepo, FileNode, AnalysisResult, DeepAudit, ProjectInsights, OnboardingGuide } from '../types';
import type { BlameInsight, TechDebtReport, CVEReport } from '../services/geminiService';

export const DEMO_REPO: GithubRepo = {
  owner: 'facebook',
  repo: 'react',
  description: 'The library for web and native user interfaces.',
  stars: 228000,
  forks: 46500,
  language: 'JavaScript',
  defaultBranch: 'main',
  url: 'https://github.com/facebook/react',
  topics: ['javascript', 'ui', 'frontend', 'declarative', 'component-based'],
};

export const DEMO_STRUCTURE: FileNode[] = [
  { path: 'packages', type: 'tree', sha: 'a1', name: 'packages', children: [
    { path: 'packages/react', type: 'tree', sha: 'a2', name: 'react', children: [
      { path: 'packages/react/src', type: 'tree', sha: 'a3', name: 'src', children: [
        { path: 'packages/react/src/React.js', type: 'blob', sha: 'b1', name: 'React.js', size: 4200, aiTag: 'Core Module' },
        { path: 'packages/react/src/ReactHooks.js', type: 'blob', sha: 'b2', name: 'ReactHooks.js', size: 3100, aiTag: 'Hooks API' },
        { path: 'packages/react/src/ReactContext.js', type: 'blob', sha: 'b3', name: 'ReactContext.js', size: 1800, aiTag: 'Context API' },
      ]},
      { path: 'packages/react/index.js', type: 'blob', sha: 'b4', name: 'index.js', size: 680 },
    ]},
    { path: 'packages/react-dom', type: 'tree', sha: 'a4', name: 'react-dom', children: [
      { path: 'packages/react-dom/src', type: 'tree', sha: 'a5', name: 'src', children: [
        { path: 'packages/react-dom/src/client/ReactDOM.js', type: 'blob', sha: 'b5', name: 'ReactDOM.js', size: 5600, aiTag: 'DOM Renderer' },
        { path: 'packages/react-dom/src/server/ReactDOMServer.js', type: 'blob', sha: 'b6', name: 'ReactDOMServer.js', size: 3400, aiTag: 'SSR Engine' },
      ]},
    ]},
    { path: 'packages/react-reconciler', type: 'tree', sha: 'a6', name: 'react-reconciler', children: [
      { path: 'packages/react-reconciler/src/ReactFiber.js', type: 'blob', sha: 'b7', name: 'ReactFiber.js', size: 12000, aiTag: 'Fiber Architecture' },
      { path: 'packages/react-reconciler/src/ReactFiberWorkLoop.js', type: 'blob', sha: 'b8', name: 'ReactFiberWorkLoop.js', size: 18000, aiTag: 'Work Loop' },
      { path: 'packages/react-reconciler/src/ReactFiberScheduler.js', type: 'blob', sha: 'b9', name: 'ReactFiberScheduler.js', size: 8200, aiTag: 'Scheduler' },
    ]},
    { path: 'packages/scheduler', type: 'tree', sha: 'a7', name: 'scheduler', children: [
      { path: 'packages/scheduler/src/Scheduler.js', type: 'blob', sha: 'b10', name: 'Scheduler.js', size: 6800, aiTag: 'Priority Queue' },
    ]},
  ]},
  { path: 'scripts', type: 'tree', sha: 'a8', name: 'scripts', children: [
    { path: 'scripts/rollup', type: 'tree', sha: 'a9', name: 'rollup', children: [
      { path: 'scripts/rollup/build.js', type: 'blob', sha: 'b11', name: 'build.js', size: 4500, aiTag: 'Build System' },
    ]},
  ]},
  { path: 'fixtures', type: 'tree', sha: 'a10', name: 'fixtures' },
  { path: 'package.json', type: 'blob', sha: 'b12', name: 'package.json', size: 2100 },
  { path: 'README.md', type: 'blob', sha: 'b13', name: 'README.md', size: 3400 },
  { path: 'LICENSE', type: 'blob', sha: 'b14', name: 'LICENSE', size: 1100 },
];

export const DEMO_ANALYSIS: AnalysisResult = {
  summary: 'React is a declarative, component-based JavaScript library for building user interfaces. The codebase is organized as a monorepo with packages for the core reconciler (Fiber architecture), DOM rendering, server-side rendering, and a cooperative scheduler. The Fiber reconciler is the heart of React — it enables incremental rendering, priority-based scheduling, and Suspense. The codebase demonstrates world-class software engineering with rigorous testing, clear module boundaries, and extensive inline documentation.',
  startupPitch: 'React powers over 10 million websites and is the most popular UI framework in the world. Its component model and virtual DOM changed how developers build user interfaces. With React Server Components and the new compiler, the team continues to push the frontier of web development.',
  qaScript: '1. How does the Fiber reconciler differ from the old stack reconciler?\n2. What is the role of the Scheduler package?\n3. How does React handle concurrent rendering and priority levels?\n4. What is the purpose of ReactFiberWorkLoop?\n5. How does React\'s event system differ from native DOM events?',
  aiStrategy: 'React\'s AI integration strategy should focus on: (1) AI-assisted component generation from design files, (2) intelligent code-splitting based on usage analytics, (3) predictive pre-rendering using ML models, (4) automated accessibility auditing with AI, and (5) smart error boundary suggestions based on crash patterns.',
  techStack: ['JavaScript', 'Flow', 'Rollup', 'Jest', 'React', 'Fiber', 'Scheduler', 'Prettier', 'ESLint'],
  architectureSuggestion: 'The monorepo structure is well-organized. Consider: (1) Migrating from Flow to TypeScript for broader ecosystem compatibility, (2) Adding more granular bundle analysis to track package size regressions, (3) Implementing automated performance benchmarking in CI.',
  scorecard: {
    maintenance: 9,
    documentation: 8,
    innovation: 10,
    security: 8,
  },
  roadmap: [
    'Complete React Compiler (formerly React Forget) rollout',
    'Stabilize React Server Components API',
    'Ship Activity component for offscreen rendering',
    'Improve DevTools profiler for concurrent features',
    'Add built-in animation primitives',
    'Expand Server Actions capabilities',
  ],
  mermaidDiagram: `graph TD
    A[react] --> B[react-reconciler]
    B --> C[scheduler]
    A --> D[react-dom]
    D --> B
    D --> E[react-dom/server]
    B --> F[ReactFiber]
    B --> G[ReactFiberWorkLoop]
    F --> G
    G --> C
    H[shared] --> A
    H --> B
    H --> D`,
  cloudArchitecture: [
    { serviceName: 'React Docs Site', platform: 'Vercel', reasoning: 'Next.js-based documentation site with ISR for fast builds and global CDN.', configSnippet: '{\n  "framework": "nextjs",\n  "buildCommand": "next build",\n  "outputDirectory": ".next"\n}', complexity: 'Low' },
    { serviceName: 'CI/CD Pipeline', platform: 'Google Cloud', reasoning: 'Cloud Build for running 30,000+ tests across multiple packages with caching.', configSnippet: 'steps:\n  - name: node:20\n    entrypoint: yarn\n    args: [test, --ci]', complexity: 'Medium' },
    { serviceName: 'Package Registry', platform: 'Firebase', reasoning: 'Firebase Hosting for hosting canary builds and nightly documentation snapshots.', configSnippet: '{\n  "hosting": {\n    "public": "build",\n    "ignore": ["firebase.json"]\n  }\n}', complexity: 'Low' },
  ],
  flowNodes: [
    { id: '1', data: { label: 'react (Core API)' }, position: { x: 250, y: 0 } },
    { id: '2', data: { label: 'react-reconciler (Fiber)' }, position: { x: 250, y: 120 } },
    { id: '3', data: { label: 'scheduler' }, position: { x: 500, y: 120 } },
    { id: '4', data: { label: 'react-dom' }, position: { x: 50, y: 120 } },
    { id: '5', data: { label: 'react-dom/server' }, position: { x: 50, y: 240 } },
    { id: '6', data: { label: 'shared' }, position: { x: 250, y: 280 } },
  ],
  flowEdges: [
    { id: 'e1-2', source: '1', target: '2', label: 'reconciles', animated: true },
    { id: 'e2-3', source: '2', target: '3', label: 'schedules' },
    { id: 'e4-2', source: '4', target: '2', label: 'uses' },
    { id: 'e1-4', source: '1', target: '4', label: 'renders' },
    { id: 'e4-5', source: '4', target: '5', label: 'SSR' },
    { id: 'e6-1', source: '6', target: '1', label: 'utilities' },
    { id: 'e6-2', source: '6', target: '2', label: 'utilities' },
  ],
  architectureTour: {
    title: 'React Fiber Architecture Deep Dive',
    summary: 'A guided tour through React\'s core packages, from the public API down to the Fiber reconciler and cooperative scheduler.',
    steps: [
      { nodeId: '1', title: 'React Core (Public API)', bullets: ['Exports createElement, hooks (useState, useEffect, etc.), and Context', 'Thin wrapper — delegates real work to the reconciler', 'The API surface developers interact with daily'] },
      { nodeId: '2', title: 'Fiber Reconciler', bullets: ['Heart of React — builds and manages the Fiber tree', 'Enables incremental rendering (work can be paused and resumed)', 'Handles diffing, effects, and commit phases'] },
      { nodeId: '3', title: 'Scheduler', bullets: ['Cooperative scheduler using MessageChannel for yielding to the browser', 'Supports 5 priority levels (Immediate → Idle)', 'Enables concurrent features like startTransition'] },
      { nodeId: '4', title: 'React DOM', bullets: ['Platform-specific renderer for web browsers', 'Manages host DOM elements, events, and hydration', 'createRoot() is the main entry point'] },
      { nodeId: '5', title: 'Server Rendering', bullets: ['renderToPipeableStream for streaming SSR', 'React Server Components support', 'Supports progressive hydration'] },
      { nodeId: '6', title: 'Shared Utilities', bullets: ['Cross-package constants and helpers', 'React element symbol definitions', 'Feature flag system for gradual rollouts'] },
    ],
  },
};

export const DEMO_DEEP_AUDIT: DeepAudit = {
  reasoning: 'React employs rigorous security practices including input sanitization for dangerouslySetInnerHTML, script tag prevention in JSX, and attribute whitelisting. The event system uses synthetic events to prevent direct DOM manipulation. However, some areas warrant attention: (1) Third-party script injection via CDN builds, (2) Prototype pollution vectors in legacy context API, (3) XSS surface in server-rendered HTML strings.',
  vulnerabilities: [
    'MEDIUM: Server-side rendering can output unsanitized user strings if not using proper escaping utilities',
    'LOW: Legacy string refs could enable prototype pollution in edge cases',
    'LOW: Development-mode stack traces may leak internal file paths in error overlays',
    'INFO: CDN builds should use Subresource Integrity (SRI) hashes for integrity verification',
  ],
  architecturalDebt: 'The Flow type system is gradually being replaced by TypeScript in the ecosystem, creating a maintenance burden. Some legacy APIs (string refs, findDOMNode, legacy context) still need to be removed. The build system using custom Rollup plugins adds complexity.',
};

export const DEMO_ONBOARDING: OnboardingGuide = {
  quickStart: '1. Clone the repo: `git clone https://github.com/facebook/react.git`\n2. Install dependencies: `yarn install`\n3. Build all packages: `yarn build`\n4. Run tests: `yarn test`\n5. Start the fixtures server: `yarn start`',
  criticalFiles: [
    'packages/react/src/React.js — Core public API exports',
    'packages/react-reconciler/src/ReactFiber.js — Fiber node creation and management',
    'packages/react-reconciler/src/ReactFiberWorkLoop.js — Main rendering work loop',
    'packages/scheduler/src/Scheduler.js — Cooperative task scheduler',
    'packages/react-dom/src/client/ReactDOM.js — Browser DOM renderer entry point',
  ],
  recommendedPath: [
    'Read packages/react/src/React.js to understand the public API',
    'Study packages/react-reconciler/src/ReactFiber.js for Fiber nodes',
    'Trace the work loop in ReactFiberWorkLoop.js',
    'Understand scheduling in packages/scheduler/src/Scheduler.js',
    'Explore the DOM renderer in react-dom',
  ],
  commonTasks: [
    { task: 'Add a new hook', steps: ['Define the hook in packages/react/src/ReactHooks.js', 'Implement the dispatcher in react-reconciler', 'Add tests in packages/react/src/__tests__', 'Export from packages/react/index.js'] },
    { task: 'Fix a reconciler bug', steps: ['Reproduce with a fixture in fixtures/', 'Debug using React DevTools Profiler', 'Trace the Fiber tree in ReactFiberWorkLoop', 'Write a regression test before fixing'] },
    { task: 'Add a new event', steps: ['Register in react-dom/src/events/DOMPluginEventSystem', 'Add to the SimpleEventPlugin or create a new plugin', 'Handle SyntheticEvent creation', 'Test across browsers with fixtures'] },
  ],
  setupInstructions: 'Prerequisites: Node.js 18+, Yarn (classic). The project uses Yarn workspaces for the monorepo. Build with `yarn build` and test with `yarn test`. Use `yarn flow` for type checking and `yarn prettier` for formatting.',
  codeOwnership: 'Dan Abramov (core reconciler), Andrew Clark (Fiber architecture, hooks), Sebastian Markbåge (Server Components, compiler), Brian Vaughn (DevTools), Luna Ruan (event system). The team uses RFC process for major changes.',
  recentActivity: {
    summary: 'Active development on React Compiler and Server Components. Recent focus areas include improving error messages, optimizing the work loop for concurrent rendering, and shipping Server Actions.',
    hotFiles: [
      ['packages/react-reconciler/src/ReactFiberWorkLoop.js', 47],
      ['packages/react-dom/src/server/ReactDOMFizzServer.js', 38],
      ['packages/react/src/ReactHooks.js', 24],
      ['packages/scheduler/src/Scheduler.js', 19],
      ['compiler/packages/babel-plugin-react-compiler/src/index.ts', 52],
    ],
    totalCommits: 342,
    activeDevs: 28,
  },
  testingSetup: {
    hasTests: true,
    testFramework: 'Jest',
    testCommand: 'yarn test',
    testFiles: [
      'packages/react/src/__tests__/ReactElement-test.js',
      'packages/react-dom/src/__tests__/ReactDOM-test.js',
      'packages/react-reconciler/src/__tests__/ReactFiber-test.js',
    ],
    guidance: 'Tests use Jest with a custom React-specific test renderer. Use `yarn test --watch` for development. Fixtures in the fixtures/ directory provide browser-based test environments.',
  },
};

export const DEMO_INSIGHTS: ProjectInsights = {
  issues: [
    { number: 28000, title: 'React Compiler: optimize memo boundaries', state: 'open', created_at: '2024-01-15T10:00:00Z', updated_at: '2024-02-01T14:30:00Z', labels: ['Component: Compiler', 'Type: Enhancement'], user: 'sebmarkbage', comments: 23, body: 'Improve automatic memoization boundaries in the React Compiler.' },
    { number: 27950, title: 'useActionState: handle async transitions', state: 'open', created_at: '2024-01-10T08:00:00Z', updated_at: '2024-01-28T11:00:00Z', labels: ['Component: Hooks', 'Type: Bug'], user: 'acdlite', comments: 15, body: 'Edge case in useActionState with concurrent transitions.' },
    { number: 27800, title: 'Improve hydration mismatch error messages', state: 'closed', created_at: '2023-12-01T09:00:00Z', updated_at: '2024-01-05T16:00:00Z', labels: ['Component: Server Rendering', 'Good First Issue'], user: 'gnoff', comments: 31, body: 'Hydration errors should show the exact DOM diff.' },
  ],
  pullRequests: [
    { number: 28100, title: 'Compiler: ship optimized output for loops', state: 'open', created_at: '2024-02-01T12:00:00Z', updated_at: '2024-02-05T09:00:00Z', user: 'josephsavona', additions: 1240, deletions: 380, changed_files: 24, mergeable: true },
    { number: 28050, title: 'Fix: Suspense boundary with useFormStatus', state: 'merged', created_at: '2024-01-20T10:00:00Z', updated_at: '2024-01-25T15:00:00Z', user: 'acdlite', additions: 450, deletions: 120, changed_files: 8, mergeable: null },
  ],
  contributors: [
    { login: 'sebmarkbage', contributions: 2840, avatar_url: 'https://avatars.githubusercontent.com/u/63648?' },
    { login: 'acdlite', contributions: 2100, avatar_url: 'https://avatars.githubusercontent.com/u/3624098?' },
    { login: 'gnoff', contributions: 1650, avatar_url: 'https://avatars.githubusercontent.com/u/63191?' },
    { login: 'josephsavona', contributions: 980, avatar_url: 'https://avatars.githubusercontent.com/u/6425824?' },
    { login: 'eps1lon', contributions: 870, avatar_url: 'https://avatars.githubusercontent.com/u/12292047?' },
  ],
  dependencies: [
    { name: 'jest', currentVersion: '29.7.0', latestVersion: '29.7.0', isOutdated: false },
    { name: 'rollup', currentVersion: '4.9.0', latestVersion: '4.12.0', isOutdated: true, severity: 'low' },
    { name: 'prettier', currentVersion: '3.1.0', latestVersion: '3.2.4', isOutdated: true, severity: 'low' },
    { name: 'eslint', currentVersion: '8.56.0', latestVersion: '9.0.0', isOutdated: true, severity: 'moderate' },
  ],
  codeHealth: {
    totalFiles: 3847,
    totalLines: 485000,
    languages: { JavaScript: 72, TypeScript: 15, Flow: 8, HTML: 3, CSS: 2 },
    complexity: 'high',
    testCoverage: 87,
    lastCommit: '2024-02-06T18:30:00Z',
    commitFrequency: '15-20 commits/week',
  },
  issuesSummary: {
    overview: 'React has 650+ open issues, primarily focused on Server Components, the new Compiler, and concurrent rendering edge cases. The team triages actively with clear labels.',
    sections: [
      { heading: 'Hot Topics', bullets: ['React Compiler optimization is the #1 priority', 'Server Components API stabilization', 'Hydration error messages improvement'] },
      { heading: 'Community Health', bullets: ['Average issue response time: 2-3 days', 'Good first issues are well-tagged', '85% of bugs are reproduced within a week'] },
    ],
  },
  prSummary: {
    overview: '120+ open PRs, dominated by Compiler team contributions. Merge velocity is high with thorough review process.',
    sections: [
      { heading: 'Active Areas', bullets: ['Compiler output optimization', 'Server Actions refinements', 'DevTools improvements'] },
      { heading: 'Process', bullets: ['All PRs require CI green + 1 core reviewer', 'Feature PRs need an RFC for major changes', 'Canary releases ship from main branch'] },
    ],
  },
  teamDynamics: {
    overview: 'The React core team at Meta is ~15 engineers, with significant open-source contributions from Vercel, Shopify, and individual contributors.',
    sections: [
      { heading: 'Team Structure', bullets: ['Sebastian Markbåge leads Server Components and Compiler', 'Andrew Clark leads concurrent rendering and hooks', 'Josh Story leads SSR and streaming'] },
      { heading: 'Collaboration', bullets: ['Weekly sync meetings (internal)', 'RFC process for public API changes', 'React Working Groups for major features'] },
    ],
  },
};

export const DEMO_BLAME_INSIGHTS: BlameInsight[] = [
  { contributor: 'sebmarkbage', riskConcentration: 25, ownedAreas: ['ReactFiber.js', 'ReactFiberWorkLoop.js', 'ReactServerComponent.js'], finding: 'Key owner of Fiber architecture and Server Components. High bus factor risk for reconciler internals.', busFactor: true },
  { contributor: 'acdlite', riskConcentration: 20, ownedAreas: ['ReactHooks.js', 'ReactFiberHooks.js', 'ReactFiberLane.js'], finding: 'Primary maintainer of hooks system and concurrent lanes. Critical knowledge concentration.', busFactor: true },
  { contributor: 'gnoff', riskConcentration: 15, ownedAreas: ['ReactDOMFizzServer.js', 'ReactFlightServer.js'], finding: 'SSR and streaming specialist. Sole owner of Flight protocol implementation.', busFactor: false },
  { contributor: 'josephsavona', riskConcentration: 30, ownedAreas: ['babel-plugin-react-compiler/src/index.ts'], finding: 'Highest risk concentration — sole author of the React Compiler. Critical bus factor.', busFactor: true },
  { contributor: 'eps1lon', riskConcentration: 10, ownedAreas: ['ReactDOMComponent.js', 'ReactDOMInput.js'], finding: 'DOM renderer specialist. Good knowledge distribution with other contributors.', busFactor: false },
];

export const DEMO_TECH_DEBT: TechDebtReport = {
  totalDollarValue: 2850000,
  totalHours: 19000,
  hourlyRate: 150,
  headline: 'Your codebase carries $2,850,000 in tech debt',
  executiveSummary: 'React\'s monorepo has significant tech debt concentrated in the Flow→TypeScript migration and legacy API deprecation. The build system complexity and test infrastructure also contribute material costs. Quick wins in type migration and deprecation warnings can reduce debt by ~30% within 2 quarters.',
  quickWins: ['Start TypeScript migration with shared/ package', 'Add console warnings for string refs in StrictMode', 'Fix top 10 flaky tests in CI', 'Consolidate feature flags into single config file', 'Run dead code analysis and remove unused feature flags'],
  categories: [
    { category: 'Type System Migration', dollarValue: 850000, estimatedHours: 5667, severity: 'high', examples: ['Flow → TypeScript migration across 3000+ files', 'Missing type coverage in test utilities', 'Implicit any types in legacy event system'], recommendation: 'Start with shared/ package (smallest) and use ts-migrate for automated conversion.' },
    { category: 'Legacy API Deprecation', dollarValue: 620000, estimatedHours: 4133, severity: 'high', examples: ['String refs still supported for backwards compatibility', 'findDOMNode is deprecated but not removed', 'Legacy context API (contextTypes) still present'], recommendation: 'Add console warnings for string refs in StrictMode. Remove findDOMNode from react-dom/client.' },
    { category: 'Build System Complexity', dollarValue: 480000, estimatedHours: 3200, severity: 'medium', examples: ['Custom Rollup plugins for 30+ bundle configurations', 'Manual feature flag management across packages', 'Complex publishing pipeline for canary/stable channels'], recommendation: 'Consolidate feature flags into single config. Document the release process end-to-end.' },
    { category: 'Test Infrastructure', dollarValue: 340000, estimatedHours: 2267, severity: 'medium', examples: ['Custom test renderer adds maintenance burden', 'Flaky integration tests in CI', 'Missing coverage for concurrent edge cases'], recommendation: 'Fix top 10 flaky tests. Add concurrent mode stress tests.' },
    { category: 'Documentation Gaps', dollarValue: 280000, estimatedHours: 1867, severity: 'low', examples: ['Internal architecture docs are outdated', 'Fiber data structure not documented for contributors', 'Missing migration guide for class → hooks'], recommendation: 'Update ARCHITECTURE.md. Add inline docs to ReactFiber.js.' },
    { category: 'Dead Code', dollarValue: 280000, estimatedHours: 1867, severity: 'low', examples: ['Unused experimental features behind flags', 'Legacy server renderer code', 'Deprecated test utilities'], recommendation: 'Run dead code analysis. Remove unused feature flags.' },
  ],
};

export const DEMO_CVE_REPORT: CVEReport = {
  totalCritical: 0,
  totalHigh: 1,
  compliance: 'at_risk',
  remediationPriority: ['rollup', 'eslint', 'prettier', 'jest'],
  estimatedRiskExposure: '1 high-severity and 2 medium-severity vulnerabilities across build tooling dependencies. No critical findings in runtime packages.',
  findings: [
    { cveId: 'CVE-2024-DEMO-001', package: 'rollup', version: '4.9.0', patchVersion: '4.12.0', severity: 'high', cvssScore: 7.2, description: 'Path Traversal in Rollup Plugin Resolution — a crafted plugin name could resolve files outside the project root.', patchCommand: 'yarn upgrade rollup@4.12.0', affectedArea: 'Build pipeline — could affect bundle integrity' },
    { cveId: 'CVE-2024-DEMO-002', package: 'eslint', version: '8.56.0', patchVersion: '9.0.0', severity: 'medium', cvssScore: 5.4, description: 'ReDoS in ESLint Rule Parser — complex regex patterns in custom rules could cause denial of service.', patchCommand: 'yarn upgrade eslint@9.0.0', affectedArea: 'Developer tooling — CI pipeline performance' },
    { cveId: 'CVE-2024-DEMO-003', package: 'prettier', version: '3.1.0', patchVersion: '3.2.4', severity: 'medium', cvssScore: 4.8, description: 'Prototype Pollution in Options Merging — crafted .prettierrc could pollute Object prototype during config resolution.', patchCommand: 'yarn upgrade prettier@3.2.4', affectedArea: 'Code formatting — development environment' },
    { cveId: 'CVE-2024-DEMO-004', package: 'jest', version: '29.7.0', patchVersion: '29.7.1', severity: 'low', cvssScore: 2.1, description: 'Information Disclosure in Error Serialization — stack traces in CI environments could leak internal file paths.', patchCommand: 'yarn upgrade jest@29.7.1', affectedArea: 'Test infrastructure — CI environment' },
  ],
};
