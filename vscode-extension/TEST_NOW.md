# Test the VS Code Extension NOW

## Quick Test in 2 Minutes

1. **Open the extension folder in a NEW VS Code window:**
   ```bash
   code /workspaces/GitMindPro/vscode-extension
   ```

2. **Press F5** (or Run → Start Debugging)
   - This opens a new "Extension Development Host" window
   - The extension is now running!

3. **In the new window, open any GitHub repository:**
   - File → Open Folder
   - Or use: `/workspaces/GitMindPro` (our own repo!)

4. **Test the extension:**
   - Click the GitMind icon in the left sidebar (activity bar)
   - Click "Configure API Key" button
   - Enter your Gemini API key in the prompt
   - Click "Analyze Repository" button
   - Watch the magic happen! ✨

5. **Test other features:**
   - Right-click any file → "GitMind: Explain Current File"
   - Open Command Palette (Cmd+Shift+P) → Type "GitMind"
   - Try "GitMind: Team Health Dashboard"

## What You Should See

✅ Sidebar with "GitMind Pro" panel
✅ Repository analysis with AI insights
✅ Tech stack detection
✅ Repository health metrics
✅ Commands in context menus

## If Something Doesn't Work

Check the Debug Console in the original VS Code window (where you pressed F5) for errors.

## Package for Distribution

Once testing works:

```bash
cd /workspaces/GitMindPro/vscode-extension
npm run package
```

This creates `gitmind-pro-0.1.0.vsix` that you can:
- Share with beta testers
- Submit to VS Code Marketplace
- Install manually with: `code --install-extension gitmind-pro-0.1.0.vsix`

---

**You're literally 2 minutes away from seeing your VS Code extension in action! 🚀**
