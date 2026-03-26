# GitMindPro — Build History Log

## March 25-26, 2026 — Sprint Record

### What Shipped (Verified & Merged to main)

| # | Feature | Commit | Status |
|---|---------|--------|--------|
| 1 | Security: redacted exposed API keys from docs | `84ff390` | SHIPPED |
| 2 | Landing page: feature grid, testimonials, demo placeholder, copy polish | `fc716f1` | SHIPPED |
| 3 | Free tier (3 analyses) + GitHub org detection + signup prompt + nav indicator | `0016701` | SHIPPED |
| 4 | Export analysis report to PDF (jsPDF) | `d8dbfac` | SHIPPED |
| 5 | Retry analysis on timeout + increased timeout limit | `757dd20` | SHIPPED |
| 6 | Keep file tree visible during analysis + PDF export button exposed | `202ba27` | SHIPPED |
| 7 | Supabase env vars + Vercel redeploy with updated auth config | `b804561` | SHIPPED |
| 8 | Always show GitHub sign-in button in navbar | `19f4dda` | SHIPPED |
| 9 | Supabase fallback config when Vercel env is missing | `d4c669f` | SHIPPED |
| 10 | Workspace foundation: org schema, RLS, workspace selector | `20b93df` | SHIPPED |
| 11 | Workspace invites and join flow | `607038a` | SHIPPED |

### March 25 — Test Fix & Readiness Pass

- Fixed Playwright strict-mode failures in smoke + regression tests (ambiguous heading selector)
- `npm run check` — PASSED (0 errors, 7 `any` warnings)
- `npm run uat` — PASSED (5/5 tests, build + preview + Playwright green)
- Production build — PASSED (dist output verified)
- Deploy preflight — GO

### March 26 — Next Milestone: Saved Analysis History

- Schema: `analysis_history` table with workspace association
- Service: `saveAnalysis()` and `getAnalysisHistory()` in supabaseService
- UI: History sidebar/panel showing past analyses per workspace
- Goal: Users can revisit previous repo analyses without re-running

### Infrastructure Notes

- Build output: ~375 KB gzipped main chunk (optimization opportunity: code-split)
- Supabase SQL must be applied from `supabase/schema.sql` for workspace/invite/history features
- Vercel deploy config in `vercel.json`
- CI/CD pipeline defined in `.github/workflows/deploy.yml`

### Next Pipeline (Priority Order)

1. Saved analysis history per workspace ← IN PROGRESS
2. PR review intelligence
3. Bundle size optimization (dynamic imports)
4. Stripe integration for Pro tier ($19/mo)
5. Team tier workspace enhancements ($99/mo)
