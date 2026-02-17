# GitMind Pro - Testing Checklist

## 🌐 WEB APP TESTING

### Test 1: Basic Repository Analysis (5 min)
**URL:** http://localhost:3000/

#### Test Case 1.1: Small Popular Repo
- [ ] Paste: `https://github.com/vercel/next.js`
- [ ] Press Enter
- [ ] **Expected:** Loading animation appears
- [ ] **Expected:** Analysis completes in 30-60 seconds
- [ ] **Expected:** See scorecard with metrics
- [ ] **Expected:** See executive summary text
- [ ] **Note any issues:** _______________

#### Test Case 1.2: Different Repo Type
- [ ] Try: `https://github.com/facebook/react`
- [ ] **Expected:** Different tech stack detected
- [ ] **Expected:** Different analysis results
- [ ] **Note any issues:** _______________

#### Test Case 1.3: Invalid URL
- [ ] Try: `https://github.com/invalid/notexist`
- [ ] **Expected:** Error message shown
- [ ] **Note any issues:** _______________

---

### Test 2: Project Insights Tab (10 min)

After analyzing a repo, test the NEW features:

#### Test Case 2.1: Navigate to Insights
- [ ] Click "Insights" tab (second tab)
- [ ] **Expected:** Loading message appears
- [ ] **Expected:** Data loads in 10-20 seconds
- [ ] **Note any issues:** _______________

#### Test Case 2.2: Issues Section
- [ ] **Expected:** See issues count (Total & Open)
- [ ] **Expected:** See AI summary of issues
- [ ] **Expected:** See list of recent issues with labels
- [ ] Click on an issue number
- [ ] **Expected:** Should show issue details
- [ ] **Note any issues:** _______________

#### Test Case 2.3: Pull Requests Section
- [ ] **Expected:** See PR count (Total & Merged)
- [ ] **Expected:** See AI summary of PRs
- [ ] **Expected:** See list with +/- lines changed
- [ ] **Note any issues:** _______________

#### Test Case 2.4: Contributors Section
- [ ] **Expected:** See AI team dynamics analysis
- [ ] **Expected:** See contributor avatars
- [ ] **Expected:** See contribution counts
- [ ] **Note any issues:** _______________

#### Test Case 2.5: Dependencies
- [ ] **Expected:** See list of npm packages (if Node.js repo)
- [ ] **Expected:** See version numbers
- [ ] **Note any issues:** _______________

#### Test Case 2.6: Code Health
- [ ] **Expected:** See file count
- [ ] **Expected:** See lines of code
- [ ] **Expected:** See complexity rating
- [ ] **Expected:** See language distribution chart
- [ ] **Note any issues:** _______________

---

### Test 3: Other Tabs (10 min)

#### Test Case 3.1: Command Tab (Default)
- [ ] Click "Command" tab
- [ ] **Expected:** See scorecard
- [ ] **Expected:** See executive summary
- [ ] Click a file in the file tree (left sidebar)
- [ ] **Expected:** File content and explanation appear
- [ ] **Note any issues:** _______________

#### Test Case 3.2: Architect Tab
- [ ] Click "Architect" tab
- [ ] **Expected:** See visual flow diagram
- [ ] **Expected:** Can zoom and pan
- [ ] **Note any issues:** _______________

#### Test Case 3.3: Deep Scan Tab
- [ ] Click "Deep Scan" tab
- [ ] Click "Trigger Deep Reasoning"
- [ ] **Expected:** "CTO Thinking..." animation
- [ ] **Expected:** Results appear after 20-30 seconds
- [ ] **Expected:** See vulnerabilities and architectural analysis
- [ ] **Note any issues:** _______________

#### Test Case 3.4: Lab Tab
- [ ] Click "Lab" tab
- [ ] Select a file from left sidebar
- [ ] Click "Refactor" or "Generate Tests"
- [ ] **Expected:** Lab task runs
- [ ] **Expected:** Results appear
- [ ] **Note any issues:** _______________

#### Test Case 3.5: Pulse Tab
- [ ] Click "Pulse" tab
- [ ] **Expected:** See market sentiment
- [ ] **Expected:** See related resources
- [ ] **Note any issues:** _______________

---

### Test 4: Header Actions (5 min)

#### Test Case 4.1: Project Insights Button
- [ ] Click "Project Insights" button in header
- [ ] **Expected:** Switches to Insights tab
- [ ] **Expected:** Button turns green after loading
- [ ] **Note any issues:** _______________

#### Test Case 4.2: Boardroom Q&A
- [ ] Click "Boardroom Q&A" button
- [ ] **Expected:** Audio plays (multi-speaker conversation)
- [ ] **Expected:** Button animates during playback
- [ ] **Note any issues:** _______________

#### Test Case 4.3: Deep Audit Button
- [ ] Click "Deep Audit" button
- [ ] **Expected:** Switches to audit tab and starts analysis
- [ ] **Note any issues:** _______________

---

### Test 5: Error Handling

#### Test Case 5.1: No API Key
- [ ] Clear API key from .env file
- [ ] Restart server
- [ ] Try to analyze
- [ ] **Expected:** Should show error about API key
- [ ] **Note:** Put API key back after test!

#### Test Case 5.2: Network Error
- [ ] Enter: `https://github.com/test/test`
- [ ] **Expected:** Clear error message
- [ ] **Note any issues:** _______________

---

## 🔌 VS CODE EXTENSION TESTING

### Test 6: Extension Installation & Setup (5 min)

#### Test Case 6.1: Launch Extension
- [ ] Open vscode-extension folder in VS Code
- [ ] Press **F5**
- [ ] **Expected:** New "Extension Development Host" window opens
- [ ] **Note any issues:** _______________

#### Test Case 6.2: Extension Appears
- [ ] Look at left sidebar (Activity Bar)
- [ ] **Expected:** See GitMind icon (GM)
- [ ] Click it
- [ ] **Expected:** Sidebar panel opens
- [ ] **Note any issues:** _______________

#### Test Case 6.3: Configure API Key
- [ ] Click "⚙️ Configure API Key" button
- [ ] **Expected:** Settings panel opens
- [ ] Search for "gitmind"
- [ ] Paste API key: `AIzaSyAvfyXOUrLDQSU9XsxpNnyBdjWAbPJoU7w`
- [ ] Close settings
- [ ] **Note any issues:** _______________

---

### Test 7: Extension Features (10 min)

#### Test Case 7.1: Analyze Repository
- [ ] In Extension Host window, open a GitHub repo folder
- [ ] (Or use File > Open Folder > GitMindPro)
- [ ] Click GitMind icon in sidebar
- [ ] Click "🔍 Analyze Repository"
- [ ] **Expected:** "Analyzing repository..." notification
- [ ] **Expected:** Results appear in sidebar after 20-30s
- [ ] **Expected:** See summary, tech stack, health metrics
- [ ] **Note any issues:** _______________

#### Test Case 7.2: Open Web App Button
- [ ] In sidebar, click "🌐 Open Full Web App"
- [ ] **Expected:** Browser opens to http://localhost:3000
- [ ] **Note any issues:** _______________

#### Test Case 7.3: Explain File
- [ ] Open any code file (e.g., App.tsx)
- [ ] Right-click in the file
- [ ] Click "GitMind: Explain Current File"
- [ ] **Expected:** New tab opens with explanation
- [ ] **Expected:** Detailed analysis of the file
- [ ] **Note any issues:** _______________

#### Test Case 7.4: Command Palette
- [ ] Press Cmd/Ctrl + Shift + P
- [ ] Type "GitMind"
- [ ] **Expected:** See all GitMind commands
- [ ] Try "GitMind: Team Health Dashboard"
- [ ] **Expected:** Team analysis appears
- [ ] **Note any issues:** _______________

---

## 🐛 BUG TRACKING

### Critical Bugs (Must Fix Before Launch)
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

### Minor Issues (Can Fix After Launch)
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

### UX Improvements Needed
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

---

## ✅ TESTING SUMMARY

### Web App
- [ ] All basic features work
- [ ] New Insights tab works
- [ ] Error handling is good
- [ ] Performance is acceptable
- [ ] Ready to deploy: YES / NO

### VS Code Extension
- [ ] Extension loads correctly
- [ ] Analysis works
- [ ] Commands work
- [ ] Links to web app work
- [ ] Ready to publish: YES / NO

---

## 📝 NOTES & OBSERVATIONS

### What Works Great:
_______________________________________________
_______________________________________________

### What Needs Improvement:
_______________________________________________
_______________________________________________

### User Experience Issues:
_______________________________________________
_______________________________________________

### Performance Issues:
_______________________________________________
_______________________________________________

---

## 🎯 NEXT STEPS AFTER TESTING

If everything works:
- [ ] Fix critical bugs
- [ ] Record demo video
- [ ] Deploy web app
- [ ] Publish extension

If major issues found:
- [ ] List them here: _______________
- [ ] We'll fix together
- [ ] Retest
- [ ] Then proceed to deployment

---

**Testing Date:** _____________
**Tested By:** _____________
**Overall Status:** PASS / NEEDS WORK / FAIL
