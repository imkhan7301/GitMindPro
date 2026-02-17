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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const GitMindPanel_1 = require("./panels/GitMindPanel");
const analysisService_1 = require("./services/analysisService");
function activate(context) {
    const output = vscode.window.createOutputChannel('GitMind Pro');
    output.appendLine('GitMind Pro is now active!');
    context.subscriptions.push(output);
    // Register sidebar panel
    const provider = new GitMindPanel_1.GitMindPanel(context.extensionUri);
    context.subscriptions.push(vscode.window.registerWebviewViewProvider('gitmind.insightsView', provider));
    // Command: Analyze Repository
    const analyzeRepoCmd = vscode.commands.registerCommand('gitmind.analyzeRepo', async () => {
        const config = vscode.workspace.getConfiguration('gitmind');
        const apiKey = config.get('geminiApiKey');
        if (!apiKey) {
            const action = await vscode.window.showWarningMessage('GitMind Pro requires a Gemini API key to function.', 'Configure Now', 'Get API Key');
            if (action === 'Configure Now') {
                vscode.commands.executeCommand('workbench.action.openSettings', 'gitmind.geminiApiKey');
            }
            else if (action === 'Get API Key') {
                vscode.env.openExternal(vscode.Uri.parse('https://aistudio.google.com/app/apikey'));
            }
            return;
        }
        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "GitMind Pro: Analyzing repository...",
            cancellable: false
        }, async (progress) => {
            try {
                progress.report({ increment: 0, message: "Gathering repository data..." });
                const analysis = await (0, analysisService_1.analyzeCurrentRepo)(apiKey);
                progress.report({ increment: 50, message: "Running AI analysis..." });
                // Send results to webview
                provider.updateAnalysis(analysis);
                progress.report({ increment: 100, message: "Complete!" });
                vscode.window.showInformationMessage('✨ Repository analysis complete!');
            }
            catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                vscode.window.showErrorMessage(`GitMind Pro: ${message}`);
            }
        });
    });
    // Command: Analyze Current File
    const analyzeFileCmd = vscode.commands.registerCommand('gitmind.analyzeFile', async () => {
        const config = vscode.workspace.getConfiguration('gitmind');
        const apiKey = config.get('geminiApiKey');
        if (!apiKey) {
            vscode.window.showWarningMessage('Please configure your Gemini API key first.');
            return;
        }
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('No file is currently open.');
            return;
        }
        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Analyzing file...",
            cancellable: false
        }, async () => {
            try {
                const fileName = editor.document.fileName.split('/').pop() || 'file';
                const content = editor.document.getText();
                const explanation = await (0, analysisService_1.analyzeCurrentFile)(apiKey, fileName, content);
                // Show explanation in new document
                const doc = await vscode.workspace.openTextDocument({
                    content: explanation,
                    language: 'markdown'
                });
                await vscode.window.showTextDocument(doc, { viewColumn: vscode.ViewColumn.Beside });
            }
            catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                vscode.window.showErrorMessage(`Analysis failed: ${message}`);
            }
        });
    });
    // Command: Show Team Health
    const teamHealthCmd = vscode.commands.registerCommand('gitmind.teamHealth', async () => {
        const config = vscode.workspace.getConfiguration('gitmind');
        const apiKey = config.get('geminiApiKey');
        if (!apiKey) {
            vscode.window.showWarningMessage('Please configure your Gemini API key first.');
            return;
        }
        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Analyzing team health...",
            cancellable: false
        }, async () => {
            try {
                const health = await (0, analysisService_1.getTeamHealth)(apiKey);
                provider.updateTeamHealth(health);
                vscode.window.showInformationMessage('Team health analysis complete!');
            }
            catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                vscode.window.showErrorMessage(`Team analysis failed: ${message}`);
            }
        });
    });
    // Command: Open Web App
    const openWebAppCmd = vscode.commands.registerCommand('gitmind.openWebApp', () => {
        // For now, open localhost. Change to production URL after deployment
        vscode.env.openExternal(vscode.Uri.parse('http://localhost:3000'));
        // Production: vscode.env.openExternal(vscode.Uri.parse('https://gitmindpro.app'));
    });
    // Auto-analyze on workspace open (if enabled)
    const autoAnalyze = vscode.workspace.getConfiguration('gitmind').get('autoAnalyze');
    if (autoAnalyze && vscode.workspace.workspaceFolders) {
        setTimeout(() => {
            vscode.commands.executeCommand('gitmind.analyzeRepo');
        }, 2000);
    }
    context.subscriptions.push(analyzeRepoCmd, analyzeFileCmd, teamHealthCmd, openWebAppCmd);
}
function deactivate() { }
//# sourceMappingURL=extension.js.map