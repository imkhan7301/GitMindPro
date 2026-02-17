import { test, expect, Page } from '@playwright/test';

const mockAnalysis = {
  summary: 'Mock summary: GitMindPro analyzes repositories for onboarding.',
  startupPitch: 'Mock startup pitch.',
  qaScript: 'Mock Q&A script.',
  aiStrategy: 'Mock AI strategy.',
  techStack: ['React', 'Vite', 'Playwright'],
  architectureSuggestion: 'Mock architecture suggestion.',
  roadmap: ['Phase 1', 'Phase 2'],
  mermaidDiagram: 'graph TD; A-->B;',
  flowNodes: [
    {
      id: 'app',
      data: { label: 'App' },
      position: { x: 0, y: 0 },
      type: 'default'
    }
  ],
  flowEdges: [],
  scorecard: {
    maintenance: 82,
    documentation: 74,
    innovation: 88,
    security: 71
  },
  cloudArchitecture: [
    {
      serviceName: 'Vercel',
      platform: 'Vercel',
      reasoning: 'Fast deploys for a Vite app.',
      configSnippet: 'vercel.json',
      complexity: 'Low'
    }
  ],
  architectureTour: {
    title: 'Mock Tour',
    summary: 'Mock tour summary for the architecture walkthrough.',
    steps: [
      {
        nodeId: 'app',
        title: 'Entry Point',
        bullets: ['Bootstraps the UI.', 'Wires core services.']
      }
    ]
  }
};

const mockGuide = {
  quickStart: 'This mock guide explains the repository at a high level.',
  criticalFiles: ['README.md', 'src/main.ts'],
  recommendedPath: ['Read README', 'Review src/main.ts'],
  commonTasks: [
    {
      task: 'Run the app',
      steps: ['npm install', 'npm run dev']
    },
    {
      task: 'Run tests',
      steps: ['npm run test:dev']
    },
    {
      task: 'Build for production',
      steps: ['npm run build']
    }
  ],
  setupInstructions: 'npm install\nnpm run dev'
};

const mockTestingSetup = {
  hasTests: true,
  testFramework: 'Playwright',
  testCommand: 'npm run test:dev',
  testFiles: ['tests/smoke.spec.ts', 'tests/regression.spec.ts'],
  guidance: 'Use Playwright to validate critical flows.'
};

const mockRepoDetails = {
  description: 'Mock repo for Playwright.',
  stargazers_count: 123,
  forks_count: 9,
  language: 'TypeScript',
  default_branch: 'main',
  html_url: 'https://github.com/octocat/Hello-World',
  topics: ['mock', 'testing']
};

const mockTree = {
  tree: [
    { path: 'README.md', type: 'blob', sha: 'readme-sha', size: 20 },
    { path: 'src', type: 'tree', sha: 'src-sha' },
    { path: 'src/main.ts', type: 'blob', sha: 'main-sha', size: 120 }
  ]
};

const mockIssues = [
  {
    number: 1,
    title: 'Mock issue',
    state: 'open',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
    labels: [{ name: 'bug' }],
    user: { login: 'alice' },
    comments: 2,
    body: 'Mock issue body'
  }
];

const mockPullRequests = [
  {
    number: 42,
    title: 'Mock PR',
    state: 'closed',
    created_at: '2024-01-03T00:00:00Z',
    updated_at: '2024-01-04T00:00:00Z',
    user: { login: 'bob' },
    additions: 10,
    deletions: 2,
    changed_files: 1,
    merged_at: '2024-01-05T00:00:00Z',
    mergeable: true
  }
];

const mockContributors = [
  { login: 'alice', contributions: 25, avatar_url: 'https://example.com/a.png' },
  { login: 'bob', contributions: 12, avatar_url: 'https://example.com/b.png' }
];

const mockLanguages = {
  TypeScript: 5000,
  HTML: 600,
  CSS: 200
};

const mockIssuesSummary = {
  overview: 'Mock issues overview: stability is improving with minor bugs open.',
  sections: [
    { heading: 'Trends', bullets: ['Most issues are low severity.', 'Labels cluster around UI polish.'] },
    { heading: 'Risks', bullets: ['Two open bugs need triage.', 'One issue has high comment volume.'] },
    { heading: 'Next Steps', bullets: ['Close stale issues.', 'Add regression tests for UI flows.'] }
  ]
};

const mockPrSummary = {
  overview: 'Mock PR overview: steady merge pace with small changesets.',
  sections: [
    { heading: 'Velocity', bullets: ['PRs are merged within 2 days.', 'Low churn across files.'] },
    { heading: 'Quality', bullets: ['Tests are passing before merge.', 'Review comments are minimal.'] },
    { heading: 'Bottlenecks', bullets: ['One long-running PR remains open.'] }
  ]
};

const mockTeamSummary = {
  overview: 'Mock team overview: balanced contributions with clear ownership.',
  sections: [
    { heading: 'Ownership', bullets: ['Alice owns core UI.', 'Bob handles integration work.'] },
    { heading: 'Bus Factor', bullets: ['No single point of failure detected.'] },
    { heading: 'Collaboration', bullets: ['Issues show consistent follow-ups.'] }
  ]
};

const toBase64 = (value: string) => Buffer.from(value, 'utf-8').toString('base64');

const mockGithubApi = async (page: Page) => {
  await page.route('https://api.github.com/**', async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;

    if (path.endsWith('/repos/octocat/Hello-World')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockRepoDetails)
      });
      return;
    }

    if (path.includes('/git/trees/')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockTree)
      });
      return;
    }

    if (path.includes('/contents/')) {
      const contentPath = decodeURIComponent(path.split('/contents/')[1] || '');
      let content = 'Mock file content.';

      if (contentPath === 'README.md') {
        content = '# Mock README\nThis is a mocked README.';
      }

      if (contentPath === 'package.json') {
        content = JSON.stringify({
          dependencies: { react: '^19.0.0' },
          devDependencies: { '@playwright/test': '^1.50.0' }
        });
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ content: toBase64(content) })
      });
      return;
    }

    if (path.endsWith('/issues')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockIssues)
      });
      return;
    }

    if (path.endsWith('/pulls')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockPullRequests)
      });
      return;
    }

    if (path.endsWith('/contributors')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockContributors)
      });
      return;
    }

    if (path.endsWith('/languages')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockLanguages)
      });
      return;
    }

    if (path.endsWith('/commits')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([])
    });
  });
};

const mockGeminiApi = async (page: Page) => {
  await page.route('https://generativelanguage.googleapis.com/**', async (route) => {
    const bodyText = route.request().postData() || '';
    let responseText = 'Mock response.';

    if (bodyText.includes('Generate a practical onboarding guide')) {
      responseText = JSON.stringify(mockGuide);
    } else if (bodyText.includes('Act as a world-class CTO')) {
      responseText = JSON.stringify(mockAnalysis);
    } else if (bodyText.includes('Analyze these GitHub issues')) {
      responseText = JSON.stringify(mockIssuesSummary);
    } else if (bodyText.includes('Analyze these pull requests')) {
      responseText = JSON.stringify(mockPrSummary);
    } else if (bodyText.includes("team's dynamics") || bodyText.includes('team dynamics')) {
      responseText = JSON.stringify(mockTeamSummary);
    } else if (bodyText.includes('Analyze the testing setup')) {
      responseText = JSON.stringify(mockTestingSetup);
    } else if (bodyText.includes('Explain ')) {
      responseText = 'Mock explanation for the selected file.';
    } else if (bodyText.includes('CONTEXT:')) {
      responseText = 'Mock chat response.';
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        candidates: [
          { content: { parts: [{ text: responseText }] } }
        ]
      })
    });
  });
};

test.describe('full regression', () => {
  test.beforeEach(async ({ page }) => {
    await mockGithubApi(page);
    await mockGeminiApi(page);
  });

  test('landing page loads', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /Understand Any Codebase/i })).toBeVisible();
    await expect(page.getByPlaceholder("Paste your company's GitHub repo URL...")).toBeVisible();
  });

  test('invalid URL logs error', async ({ page }) => {
    await page.goto('/');
    const input = page.getByPlaceholder("Paste your company's GitHub repo URL...");
    await input.fill('not-a-url');
    await input.press('Enter');

    await page.getByText('Autonomous Ecosystem Log').click();
    await expect(page.getByText('Invalid GitHub URL')).toBeVisible();
  });

  test('analyze flow renders core tabs', async ({ page }) => {
    await page.goto('/');

    const input = page.getByPlaceholder("Paste your company's GitHub repo URL...");
    await input.fill('https://github.com/octocat/Hello-World');
    await input.press('Enter');

    await expect(page.getByText('Start Reading These Files')).toBeVisible();

    await page.getByRole('button', { name: /README\.md/i }).click();
    await expect(page.getByText('Mock explanation for the selected file.')).toBeVisible();

    await page.getByRole('button', { name: /Tech Stack/i }).click();
    await expect(page.getByText('Technologies Detected')).toBeVisible();

    await page.getByRole('button', { name: /Team & Issues/i }).click();
    await expect(page.getByText('Issues Intelligence')).toBeVisible();
    await expect(page.getByText('Pull Requests')).toBeVisible();
  });
});
