# GitMind Pro - Production Deployment Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Building for Production](#building-for-production)
4. [Deployment Options](#deployment-options)
5. [Security & Best Practices](#security--best-practices)
6. [Monitoring & Logging](#monitoring--logging)
7. [API Rate Limiting](#api-rate-limiting)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

- Node.js >= 18.0.0
- npm or yarn
- Google Gemini API key ([Get one here](https://ai.google.dev/))
- Optional: GitHub Personal Access Token for higher API limits

## Environment Setup

### 1. Local Development
```bash
# Clone the repository
git clone <repo-url>
cd GitMindPro

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Add your API keys to .env.local
VITE_GEMINI_API_KEY=your_key_here
VITE_GITHUB_TOKEN=your_token_here
VITE_ENABLE_ANALYTICS=true
```

### 2. Production Environment Variables
Create `.env.production` with:
```env
VITE_GEMINI_API_KEY=prod_key_here
VITE_GITHUB_TOKEN=prod_token_here
VITE_ENABLE_ANALYTICS=true
```

⚠️ **NEVER commit `.env.local` or `.env.production` files**

## Building for Production

### Type Checking
```bash
npm run type-check
```

### Linting
```bash
npm run lint
npm run lint:fix  # Auto-fix issues
```

### Production Build
```bash
npm run check  # Type check + lint
npm run build  # Create optimized build
```

The `dist/` folder contains your production-ready app.

## Deployment Options

### Option 1: Vercel (Recommended)
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod

# Configure environment variables in Vercel dashboard
```

**Vercel Configuration** (`vercel.json`):
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "env": {
    "VITE_GEMINI_API_KEY": "@gemini_api_key",
    "VITE_GITHUB_TOKEN": "@github_token"
  }
}
```

### Option 2: Google Cloud Run
```bash
# Build Docker image
docker build -t gitmind-pro:latest .

# Push to Container Registry
docker push gcr.io/YOUR_PROJECT/gitmind-pro:latest

# Deploy to Cloud Run
gcloud run deploy gitmind-pro \
  --image gcr.io/YOUR_PROJECT/gitmind-pro:latest \
  --platform managed \
  --region us-central1 \
  --set-env-vars VITE_GEMINI_API_KEY=$API_KEY
```

### Option 3: GitHub Pages
```bash
# Update vite.config.ts
export default {
  base: '/GitMindPro/',
  // ... rest of config
}

# Deploy
npm run build
git add dist/
git commit -m "Production build"
git push origin main
```

### Option 4: Self-Hosted (VPS/EC2)
```bash
# Build
npm run build

# Serve with Node.js
npm install -g serve
serve -s dist -l 3000
```

Or with Nginx:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        root /var/www/gitmind-pro;
        try_files $uri $uri/ /index.html;
    }
}
```

## Security & Best Practices

### API Key Management
- ✅ Use environment variables (never hardcode keys)
- ✅ Rotate keys periodically
- ✅ Use service accounts with minimal permissions
- ✅ Enable API quotas/limits in Google Cloud Console

### Input Validation
All user inputs are validated before API calls:
- GitHub URLs are validated with regex
- API responses are type-checked with TypeScript
- XSS protection through React's JSX escaping

### CORS & CSP
For production, configure CORS headers:
```nginx
# Nginx example
add_header 'Content-Security-Policy' "default-src 'self'; script-src 'self' 'unsafe-inline'";
add_header 'X-Content-Type-Options' 'nosniff';
add_header 'X-Frame-Options' 'SAMEORIGIN';
```

### Rate Limiting
Built-in rate limiting (20 requests/minute by default):
```typescript
// Configured in utils/rateLimiter.ts
const apiRateLimiter = new RateLimiter({
  maxRequests: 20,
  windowMs: 60000,
});
```

## Monitoring & Logging

### Client-Side Logging
Logs are captured in-memory and sent to analytics in production:
```typescript
import { logger } from './utils/logger';

logger.info('User action', { userId: 123 });
logger.error('API error', error);
```

Access logs programmatically:
```typescript
const allLogs = logger.getLogs();
const errorLogs = logger.getLogs(LogLevel.ERROR);
logger.clearLogs();
```

### Analytics Integration
Configure your analytics provider:
```typescript
// Google Analytics example
window.gtag?.('event', 'api_call', {
  api_name: 'analyze_repo',
  success: true,
});
```

### Error Tracking
Integrate with Sentry or similar:
```typescript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: process.env.VITE_SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

## API Rate Limiting

### Built-in Rate Limiter
- **Default**: 20 requests per minute
- **Customizable**: Adjust in `utils/rateLimiter.ts`
- **Per-endpoint**: Different limits for different operations

### Google Gemini API Limits
- **Free Tier**: 2 requests per minute
- **Upgrade Quota**: Contact Google for higher limits

Monitor your usage:
- Google Cloud Console > APIs & Services > Quotas
- Set alerts for quota usage

## Troubleshooting

### "API key not configured"
```bash
# Check if .env.local exists
cat .env.local

# Verify key format
echo $VITE_GEMINI_API_KEY
```

### Rate Limit Exceeded
- Reduce request frequency
- Upgrade API quota in Google Cloud Console
- Implement request queuing client-side

### CORS Errors
- Ensure backend properly sends CORS headers
- Check browser console for exact error
- Configure allowed origins

### Build Errors
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# TypeScript errors
npm run type-check

# Linting errors
npm run lint:fix
```

## Performance Optimization

### Code Splitting
Vite automatically code-splits for optimal loading.

### Caching
Built-in caches for API responses:
- Repository data: 10 minutes
- Analysis results: 30 minutes

### Bundle Analysis
```bash
npm install -D rollup-plugin-visualizer
npm run build -- --analyze
```

## Maintenance

### Regular Tasks
- [ ] Rotate API keys monthly
- [ ] Review error logs weekly
- [ ] Update dependencies monthly
- [ ] Run security audit: `npm audit`
- [ ] Monitor API quota usage

### Updating Dependencies
```bash
npm update
npm audit fix
npm run check
npm run build
```

---

**Need help?** Open an issue or contact the team.
