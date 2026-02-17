# 🚀 Testing GitMind Pro Extension - Step by Step

## You're currently in the extension folder!

### Quick Start (2 minutes):

**Step 1:** Press **F5** in VS Code
- This will compile the extension and open a new window
- Look for "[Extension Development Host]" in the new window title

**Step 2:** In the NEW window that opens:
- Look at the left sidebar (Activity Bar)
- You should see a new GitMind icon (GM logo)
- Click it!

**Step 3:** Configure your API key:
- Click "⚙️ Configure API Key" button
- Search for "gitmind" in settings
- Paste your key: `AIzaSyAvfyXOUrLDQSU9XsxpNnyBdjWAbPJoU7w`
- Close settings

**Step 4:** Analyze a repository:
- Open any folder with a GitHub repo (or use File > Open Folder)
- Click the GitMind icon in sidebar
- Click "🔍 Analyze Repository"
- Watch the magic! ✨

---

## What You'll See:

✅ **Sidebar Panel** - GitMind Pro interface
✅ **Loading Animation** - While analyzing
✅ **Results Display:**
   - Repository summary
   - Tech stack badges
   - Health metrics (stars, issues)
   - AI insights

---

## Try These Commands:

1. **Explain a File:**
   - Open any code file
   - Right-click → "GitMind: Explain Current File"
   - See AI explanation in new tab

2. **Team Health:**
   - Cmd/Ctrl + Shift + P
   - Type: "GitMind: Team Health"
   - See contributor analysis

3. **Command Palette:**
   - Cmd/Ctrl + Shift + P  
   - Type "GitMind" to see all commands

---

## If Something Goes Wrong:

**Check Debug Console:**
- In the ORIGINAL VS Code window (not Extension Host)
- View → Debug Console
- Look for errors

**Recompile:**
```bash
npm run compile
```

**Restart Extension:**
- Close the Extension Development Host window
- Press F5 again

---

## Current Status:

✅ Extension compiled successfully
✅ All files in place
✅ Ready to test!

**Just press F5 now! 🎯**

---

## Quick Video Demo Script:

Once working, record this:

1. "Hi, I'm testing GitMind Pro - AI repository intelligence"
2. Show sidebar click
3. Show analyze repository
4. Show results appearing
5. Right-click a file and explain it
6. "This is now available as a VS Code extension!"

---

## After Testing:

If it works:
1. Package: `npm run package`
2. Share the .vsix file with beta testers
3. Publish to marketplace

If there are bugs:
1. Note them down
2. We'll fix together
3. Test again

---

**Ready? Press F5 and let's see your extension in action! 🚀**
