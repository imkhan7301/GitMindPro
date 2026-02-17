# GitMind Pro - Onboard to Any Codebase in 5 Minutes

<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

Just joined a new company? Inherited a legacy codebase? **GitMind Pro** uses AI to help you understand complex codebases in minutes, not weeks.

Perfect for developers who need to get productive fast in unfamiliar code.

## Why GitMind Pro?

**The Problem:** You just joined a company with 200k+ lines of code. Documentation is outdated. The team is busy. You have 3 days to ship your first feature. You're lost.

**The Solution:** Paste the GitHub URL into GitMind Pro and instantly get:
- 🗺️ **Architecture Overview** - Understand how everything connects
- 📁 **Critical Files Identified** - Know which files matter most
- 🔍 **AI Code Explanations** - Click any file to understand what it does
- 🏗️ **Tech Stack Detection** - See all frameworks, libraries, and tools
- 👥 **Code Ownership Map** - Know who to ask about each part ⭐ NEW
- 🔥 **Recent Activity Heatmap** - See what's changing (hot zones to avoid) ⭐ NEW
- 🧪 **Testing Guide** - Learn how to run and write tests ⭐ NEW
- 🔐 **Security Insights** - Identify technical debt and vulnerabilities

## Perfect For

- ✅ **New Developers** joining companies
- ✅ **Consultants** analyzing client codebases
- ✅ **Tech Leads** evaluating new projects
- ✅ **Engineering Managers** understanding team codebases
- ✅ **Anyone** feeling lost in a complex repository

## Quick Start

### Prerequisites
- Node.js >= 18.0.0
- Google Gemini API key ([Get one here](https://ai.google.dev/))

### Installation

1. **Clone & Install**
   ```bash
   git clone <repo-url>
   cd GitMindPro
   npm install
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env.local
   # Edit .env.local and add your Gemini API key
   VITE_GEMINI_API_KEY=your_key_here
   # Optional: speeds up GitHub API calls and avoids rate limits
   VITE_GITHUB_TOKEN=your_github_token_here
   # Required for GitHub login + saved profiles/analyses
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Run Locally**
   ```bash
   npm run dev
   ```
   Open http://localhost:5173

## Production Deployment

For comprehensive production deployment guide, see [PRODUCTION.md](./PRODUCTION.md).
For domain go-live checklist on Vercel, see [SHIP_TO_VERCEL.md](./SHIP_TO_VERCEL.md).

### Quick Deploy to Vercel
```bash
npm install -g vercel
vercel --prod
```

## Auth + Profiles (MVP)

GitMind Pro now supports GitHub sign-in and profile-linked saved analyses.

1. Create a Supabase project and run [supabase/schema.sql](./supabase/schema.sql) in SQL editor.
2. In Supabase Auth providers, enable GitHub OAuth.
3. In GitHub OAuth App, set **Authorization callback URL** to your Supabase callback:
   - `https://<your-project-ref>.supabase.co/auth/v1/callback`
4. In Supabase Auth URL Configuration:
   - Site URL: `https://gitmindpro.com`
   - Redirect URLs: `http://localhost:5173`, `https://gitmindpro.com`, `https://www.gitmindpro.com`
5. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to env.

### Docker Deployment
```bash
docker build -t gitmind-pro .
docker run -p 3000:3000 \
  -e VITE_GEMINI_API_KEY=$API_KEY \
  gitmind-pro
```

## Development

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run test:dev` | Run Playwright tests against dev server |
| `npm run test:uat` | Run Playwright tests against preview server |
| `npm run uat` | One-command UAT: build + preview + tests |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Fix linting issues |
| `npm run type-check` | Check TypeScript types |
| `npm run check` | Run lint + type check |

### Testing (Dev + UAT)

**Dev tests** (run dev server first):
```bash
npm run dev
PLAYWRIGHT_BASE_URL=http://localhost:5173 npm run test:dev
```

**UAT tests** (one command):
```bash
npm run uat
```

### Code Quality

This project uses:
- **TypeScript** - Strict type checking
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **GitHub Actions** - CI/CD pipeline

```bash
# Check everything before commit
npm run check
```

## Architecture

```
GitMindPro/
├── components/      # React components
├── services/        # API & business logic
├── utils/          # Shared utilities
│   ├── errorHandler.ts
│   ├── rateLimiter.ts
│   ├── logger.ts
│   └── cache.ts
├── types.ts        # TypeScript definitions
├── App.tsx         # Main component
└── vite.config.ts  # Build config
```

## API Integration

### Google Gemini
- Deep reasoning audits
- Code analysis
- Content generation
- Video generation

### GitHub
- Repository analysis
- File structure reading
- Metadata extraction

### External Tools
- Google Search (market analysis)
- Google Maps (location data)
- Mermaid (diagrams)

## Rate Limiting

Built-in rate limiting to protect against quota exhaustion:
- **Default**: 20 requests/minute
- **Per-operation**: Different limits for different tasks
- **Configurable**: Edit `utils/rateLimiter.ts`

## Error Handling

Comprehensive error handling with:
- Input validation
- API error recovery
- User-friendly messages
- Detailed logging

```typescript
// Example: Validated GitHub URL
validateGithubUrl('https://github.com/user/repo') // ✅ true
validateGithubUrl('https://invalid.com') // ❌ false
```

## Security

- ✅ Environment variable isolation
- ✅ Input validation & sanitization
- ✅ API key protection
- ✅ CORS configuration
- ✅ CSP headers
- ✅ XSS prevention (React JSX)

## Logging

Structured logging with automatic analytics reporting:

```typescript
import { logger } from './utils/logger';

logger.info('User analyzed repo', { repo: 'facebook/react' });
logger.error('API call failed', error);

// Access logs
const allLogs = logger.getLogs();
```

## Caching

Smart caching to improve performance:
- Repository data: 10 minutes
- Analysis results: 30 minutes
- Configurable TTL

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards
- TypeScript strict mode
- ESLint compliance
- Prettier formatting
- Meaningful commit messages

## Environment Variables

See [.env.example](./.env.example) for all available options.

### Required
- `VITE_GEMINI_API_KEY` - Google Gemini API key

### Optional
- `VITE_GITHUB_TOKEN` - GitHub token (higher rate limits)
- `VITE_ENABLE_ANALYTICS` - Enable analytics tracking

## Performance

- **Bundle Size**: ~450KB (gzipped)
- **Initial Load**: <2 seconds
- **Time to Interactive**: <3 seconds
- **Lighthouse Score**: 95+

## Troubleshooting

### Common Issues

**"API key not configured"**
- Ensure `.env.local` file exists with `VITE_GEMINI_API_KEY`
- Restart dev server after changing environment

**"Rate limit exceeded"**
- Wait 1 minute before retrying
- Upgrade API quota in Google Cloud Console
- Reduce concurrent requests

**Build errors**
```bash
rm -rf node_modules package-lock.json
npm install
npm run check
```

## Resources

- [Google Gemini Docs](https://ai.google.dev/)
- [Vite Docs](https://vitejs.dev/)
- [React Docs](https://react.dev/)
- [TypeScript Docs](https://www.typescriptlang.org/)

## License

This project is licensed under the MIT License - see LICENSE file for details.

## Support

- 📧 Email: support@gitmindpro.com
- 🐛 Issues: [GitHub Issues](https://github.com/imkhan7301/GitMindPro/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/imkhan7301/GitMindPro/discussions)

## View Your App

[View on AI Studio](https://ai.studio/apps/drive/1L0aB1k9I2P9-8C8x1cTQWRx0x28Q927v)
