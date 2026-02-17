# GitMind Pro - VS Code Extension

> AI-powered repository intelligence directly in your IDE

## 🚀 Features

### **Instant Repository Analysis**
- Analyze any GitHub repository with a single click
- Get AI-powered insights on code quality, architecture, and health
- View tech stack detection automatically

### **Smart Code Explanations**
- Right-click any file → "GitMind: Explain Current File"
- Get detailed explanations of code purpose, structure, and improvements
- AI-powered code review suggestions

### **Team Health Dashboard**
- Analyze contributor patterns and collaboration
- Identify key person dependencies (bus factor)
- Get recommendations for team sustainability

### **Seamless Integration**
- Sidebar panel for quick access
- Commands in command palette (Cmd/Ctrl + Shift + P)
- Context menu integration

## 📦 Installation

1. Install from VS Code Marketplace (coming soon)
2. Or install manually:
   ```bash
   cd vscode-extension
   npm install
   npm run compile
   code --install-extension gitmind-pro-0.1.0.vsix
   ```

## ⚙️ Configuration

1. Get your Gemini API key: https://aistudio.google.com/app/apikey
2. Open VS Code Settings (Cmd/Ctrl + ,)
3. Search for "GitMind"
4. Enter your API key

### Settings

- `gitmind.geminiApiKey` - Your Google Gemini API key (required)
- `gitmind.githubToken` - GitHub token for higher rate limits (optional)
- `gitmind.autoAnalyze` - Auto-analyze on workspace open (default: false)

## 🎯 Usage

### Analyze Repository
1. Open any GitHub repository in VS Code
2. Click the GitMind icon in the sidebar
3. Click "Analyze Repository"

### Analyze File
1. Open any code file
2. Right-click → "GitMind: Explain Current File"
3. View detailed explanation in new tab

### Team Health
1. Open command palette (Cmd/Ctrl + Shift + P)
2. Type "GitMind: Team Health Dashboard"
3. View contributor insights

## 🔒 Privacy

- All analysis runs through Google Gemini API
- No data is stored on our servers
- Your API key is stored securely in VS Code settings
- Code is only sent to Gemini for analysis

## 📝 Commands

- `GitMind: Analyze Current Repository` - Analyze the open repository
- `GitMind: Show Project Insights` - Open insights panel
- `GitMind: Explain Current File` - Explain the current file
- `GitMind: Team Health Dashboard` - View team collaboration health
- `GitMind: Open Full Web App` - Open GitMind Pro web application

## 🐛 Issues & Feedback

Report issues: https://github.com/imkhan7301/GitMindPro/issues

## 📄 License

MIT License - See LICENSE file for details

## 🌟 Support

- Star us on GitHub: https://github.com/imkhan7301/GitMindPro
- Follow for updates: [@gitmindpro](https://twitter.com/gitmindpro)

---

**Made with 🧠 and AI by the GitMind Pro team**
