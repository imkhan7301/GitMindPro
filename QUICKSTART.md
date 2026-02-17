# 🚀 Quick Start Checklist

## Pre-Production (Local Development)

### Step 1: Setup Environment
- [ ] Copy `.env.example` to `.env.local`
- [ ] Get Gemini API key from https://ai.google.dev/
- [ ] Add key to `.env.local`: `VITE_GEMINI_API_KEY=your_key`
- [ ] (Optional) Add GitHub token: `VITE_GITHUB_TOKEN=your_token`
- [ ] Add Supabase URL/key: `VITE_SUPABASE_URL=...` and `VITE_SUPABASE_ANON_KEY=...`
- [ ] In Supabase, enable GitHub OAuth provider

### Step 2: Install & Run
```bash
npm install          # Install dependencies
npm run dev         # Start dev server
```
Open http://localhost:5173 in your browser.

### Step 3: Test Locally
- [ ] Test with a GitHub repository URL
- [ ] Verify API calls work
- [ ] Check browser console for errors
- [ ] Test error handling with invalid inputs

#### Optional: Automated Dev Tests
```bash
PLAYWRIGHT_BASE_URL=http://localhost:5173 npm run test:dev
```

## Pre-Deployment

### Step 4: Code Quality
```bash
npm run lint         # Check for linting issues
npm run type-check   # Check TypeScript types
npm run check        # Run both checks
npm run lint:fix     # Auto-fix issues
```

- [ ] All linting passes
- [ ] No TypeScript errors
- [ ] No console warnings

### Step 5: Build Test
```bash
npm run build        # Create production build
npm run preview      # Preview the build locally
```

- [ ] Build succeeds without errors
- [ ] Preview works correctly
- [ ] No broken links or features

#### Optional: One-Command UAT
```bash
npm run uat
```

### Step 6: Security Check
- [ ] Review `.gitignore` (contains `.env.local`)
- [ ] No API keys in code
- [ ] No hardcoded secrets
- [ ] Run `npm audit` - no critical vulnerabilities
- [ ] Review SECURITY.md

## Production Deployment

### Step 7: Choose Deployment Method

#### Option A: Vercel (Easiest)
```bash
npm install -g vercel
vercel --prod
```
- [ ] Set environment variables in Vercel dashboard
- [ ] Deployment succeeds
- [ ] App is accessible at your domain

#### Option B: Docker
```bash
docker build -t gitmind-pro .
docker run -p 3000:3000 \
  -e VITE_GEMINI_API_KEY=$KEY \
  gitmind-pro
```
- [ ] Docker build succeeds
- [ ] Container runs without errors
- [ ] App accessible at localhost:3000

#### Option C: Google Cloud Run
```bash
gcloud run deploy gitmind-pro --source .
```
- [ ] Cloud Run deployment succeeds
- [ ] Service is running
- [ ] API keys set in environment

#### Option D: Self-Hosted (Nginx)
```bash
npm run build
# Copy dist/ to your server
# Configure Nginx with the config from PRODUCTION.md
```
- [ ] Files copied to server
- [ ] Nginx configured
- [ ] HTTPS enabled
- [ ] App accessible

### Step 8: Post-Deployment

#### Monitoring
- [ ] Set up error tracking (Sentry, DataDog, etc.)
- [ ] Configure analytics (Google Analytics, Mixpanel)
- [ ] Set up uptime monitoring
- [ ] Create alerts for errors

#### Security
- [ ] HTTPS enabled
- [ ] API keys rotated and secure
- [ ] CORS headers configured
- [ ] CSP headers configured
- [ ] Rate limiting working

#### Performance
- [ ] Page load time < 3 seconds
- [ ] Lighthouse score > 90
- [ ] No JavaScript errors
- [ ] Caching working

### Step 9: Health Check
```bash
# Run comprehensive checks
npm run check
npm audit
npm run build
npm run preview
```

- [ ] All checks pass
- [ ] No new dependencies added recently
- [ ] Latest security patches applied

## Ongoing Maintenance

### Weekly
- [ ] Check error logs
- [ ] Monitor API quota usage
- [ ] Verify uptime status

### Monthly
- [ ] Update dependencies: `npm update`
- [ ] Security audit: `npm audit`
- [ ] Review API costs
- [ ] Rotate API keys
- [ ] Check for new vulnerabilities

### Quarterly
- [ ] Performance review
- [ ] Security audit
- [ ] User feedback analysis
- [ ] Roadmap planning

## Troubleshooting

### Build Fails
```bash
rm -rf node_modules package-lock.json
npm install
npm run check
```

### API Key Errors
- [ ] Check `.env.local` exists
- [ ] Verify key format
- [ ] Check API key is active in Google Cloud Console
- [ ] Restart dev server

### Rate Limit Errors
- [ ] Check API quota in Google Cloud Console
- [ ] Upgrade quota if needed
- [ ] Reduce concurrent requests
- [ ] Check rate limiter configuration

### Deployment Issues
- [ ] Check logs: `docker logs container_id`
- [ ] Verify environment variables set correctly
- [ ] Check network connectivity
- [ ] Review deployment provider docs

## Deployment Specific Checks

### Vercel
- [ ] GitHub connected
- [ ] Environment variables set
- [ ] Build command correct
- [ ] Output directory is `dist/`
- [ ] Deployment preview works

### Docker
- [ ] Dockerfile builds successfully
- [ ] Image runs without errors
- [ ] Port mapping correct (3000)
- [ ] Environment variables passed correctly
- [ ] Health check passing

### GCP Cloud Run
- [ ] Project ID set correctly
- [ ] Service account has permissions
- [ ] Image built and pushed
- [ ] Cloud Run service created
- [ ] Public access enabled (if needed)

### Self-Hosted
- [ ] Server has Node.js/Node 18+
- [ ] Nginx/Apache configured correctly
- [ ] SSL certificate installed
- [ ] Firewall allows traffic
- [ ] DNS configured

## Success Criteria

Your app is production-ready when:

✅ **Code Quality**
- All tests pass
- No linting errors
- TypeScript strict mode compliant
- No console errors/warnings

✅ **Performance**
- Bundle < 500KB (gzipped)
- Page load < 3 seconds
- Lighthouse > 90
- API responses < 2 seconds

✅ **Security**
- No hardcoded credentials
- HTTPS enabled
- API keys in environment variables
- npm audit passes
- CORS configured

✅ **Reliability**
- 99.9% uptime
- Error logs monitored
- Automatic backups (if applicable)
- Rate limiting working
- Graceful error handling

✅ **Monitoring**
- Error tracking configured
- Analytics running
- Alerts set up
- Performance monitoring active
- Uptime monitoring active

---

## Need Help?

📖 Read: [PRODUCTION.md](./PRODUCTION.md) - Complete deployment guide
🔒 Read: [SECURITY.md](./SECURITY.md) - Security best practices
📝 Read: [PRODUCTION_SUMMARY.md](./PRODUCTION_SUMMARY.md) - What's been improved

---

**Ready to deploy?** Start with Step 1 above! 🎉
