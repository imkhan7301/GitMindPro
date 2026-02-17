"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitMindPanel = void 0;
const vscode = __importStar(require("vscode"));
class GitMindPanel {
    constructor(_extensionUri) {
        this._extensionUri = _extensionUri;
    }
    resolveWebviewView(webviewView, context, _token) {
        void _token;
        void context;
        this._view = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };
        webviewView.webview.html = this._getHtmlForWebview();
        // Handle messages from webview
        webviewView.webview.onDidReceiveMessage(data => {
            switch (data.type) {
                case 'analyze':
                    vscode.commands.executeCommand('gitmind.analyzeRepo');
                    break;
                case 'openSettings':
                    vscode.commands.executeCommand('workbench.action.openSettings', 'gitmind');
                    break;
                case 'openWebApp':
                    vscode.commands.executeCommand('gitmind.openWebApp');
                    break;
            }
        });
    }
    updateAnalysis(analysis) {
        if (this._view) {
            this._view.webview.postMessage({ type: 'analysis', data: analysis });
        }
    }
    updateTeamHealth(health) {
        if (this._view) {
            this._view.webview.postMessage({ type: 'teamHealth', data: health });
        }
    }
    _getHtmlForWebview() {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GitMind Pro</title>
    <style>
        body {
            padding: 0;
            margin: 0;
            color: var(--vscode-foreground);
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            background: var(--vscode-editor-background);
        }
        .container {
            padding: 20px;
        }
        .header {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 1px solid var(--vscode-panel-border);
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .button {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 13px;
            font-weight: 600;
            width: 100%;
            margin-top: 10px;
        }
        .button:hover {
            background: var(--vscode-button-hoverBackground);
        }
        .button.secondary {
            background: transparent;
            border: 1px solid var(--vscode-button-border);
            color: var(--vscode-button-secondaryForeground);
        }
        .section {
            margin-bottom: 20px;
            padding: 15px;
            background: var(--vscode-editor-inactiveSelectionBackground);
            border-radius: 6px;
        }
        .section-title {
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 10px;
            opacity: 0.7;
        }
        .stat {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid var(--vscode-panel-border);
        }
        .stat:last-child {
            border-bottom: none;
        }
        .stat-label {
            opacity: 0.7;
            font-size: 12px;
        }
        .stat-value {
            font-weight: bold;
            color: var(--vscode-charts-blue);
        }
        .summary {
            line-height: 1.6;
            opacity: 0.9;
            font-size: 13px;
        }
        .empty-state {
            text-align: center;
            padding: 40px 20px;
            opacity: 0.5;
        }
        .empty-state-icon {
            font-size: 48px;
            margin-bottom: 15px;
        }
        .tech-stack {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 10px;
        }
        .tech-badge {
            padding: 4px 12px;
            background: var(--vscode-badge-background);
            color: var(--vscode-badge-foreground);
            border-radius: 12px;
            font-size: 11px;
            font-weight: 600;
        }
        .loading {
            text-align: center;
            padding: 20px;
        }
        .spinner {
            border: 3px solid var(--vscode-panel-border);
            border-top: 3px solid var(--vscode-charts-blue);
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto 15px;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">GM</div>
            <div style="flex: 1;">
                <div style="font-weight: bold;">GitMind Pro</div>
                <div style="font-size: 11px; opacity: 0.6;">AI Repository Intelligence</div>
            </div>
        </div>

        <div id="content">
            <div class="empty-state">
                <div class="empty-state-icon">🧠</div>
                <p>Analyze your repository with AI</p>
            </div>
        </div>

        <button class="button" onclick="analyze()">
            🔍 Analyze Repository
        </button>
        
        <button class="button secondary" onclick="openWebApp()">
            🌐 Open Full Web App
        </button>
        
        <button class="button secondary" onclick="openSettings()">
            ⚙️ Configure API Key
        </button>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        
        function analyze() {
            vscode.postMessage({ type: 'analyze' });
            showLoading();
        }
        
        function openSettings() {
            vscode.postMessage({ type: 'openSettings' });
        }
        
        function openWebApp() {
            vscode.postMessage({ type: 'openWebApp' });
        }
        
        function showLoading() {
            document.getElementById('content').innerHTML = \`
                <div class="loading">
                    <div class="spinner"></div>
                    <p>Analyzing repository...</p>
                </div>
            \`;
        }
        
        window.addEventListener('message', event => {
            const message = event.data;
            
            if (message.type === 'analysis') {
                const data = message.data;
                document.getElementById('content').innerHTML = \`
                    <div class="section">
                        <div class="section-title">Summary</div>
                        <div class="summary">\${data.summary}</div>
                    </div>
                    
                    <div class="section">
                        <div class="section-title">Tech Stack</div>
                        <div class="tech-stack">
                            \${data.techStack.map(tech => \`<span class="tech-badge">\${tech}</span>\`).join('')}
                        </div>
                    </div>
                    
                    <div class="section">
                        <div class="section-title">Repository Health</div>
                        <div class="stat">
                            <span class="stat-label">⭐ Stars</span>
                            <span class="stat-value">\${data.health.stars}</span>
                        </div>
                        <div class="stat">
                            <span class="stat-label">🐛 Open Issues</span>
                            <span class="stat-value">\${data.health.issues}</span>
                        </div>
                    </div>
                    
                    <div class="section">
                        <div class="section-title">AI Insights</div>
                        <div class="summary">\${data.insights.substring(0, 500)}...</div>
                    </div>
                \`;
            }
        });
    </script>
</body>
</html>`;
    }
}
exports.GitMindPanel = GitMindPanel;
//# sourceMappingURL=GitMindPanel.js.map