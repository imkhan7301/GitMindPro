import * as vscode from 'vscode';
import { GitMindPanel } from './panels/GitMindPanel';
import { analyzeCurrentRepo, analyzeCurrentFile, getTeamHealth } from './services/analysisService';

export function activate(context: vscode.ExtensionContext) {
    const output = vscode.window.createOutputChannel('GitMind Pro');
    output.appendLine('GitMind Pro is now active!');
    context.subscriptions.push(output);

    // Register sidebar panel
    const provider = new GitMindPanel(context.extensionUri);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider('gitmind.insightsView', provider)
    );

    // Command: Analyze Repository
    const analyzeRepoCmd = vscode.commands.registerCommand('gitmind.analyzeRepo', async () => {
        const config = vscode.workspace.getConfiguration('gitmind');
        const apiKey = config.get<string>('geminiApiKey');
        
        if (!apiKey) {
            const action = await vscode.window.showWarningMessage(
                'GitMind Pro requires a Gemini API key to function.',
                'Configure Now',
                'Get API Key'
            );
            
            if (action === 'Configure Now') {
                vscode.commands.executeCommand('workbench.action.openSettings', 'gitmind.geminiApiKey');
            } else if (action === 'Get API Key') {
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
                const analysis = await analyzeCurrentRepo(apiKey);
                
                progress.report({ increment: 50, message: "Running AI analysis..." });
                
                // Send results to webview
                provider.updateAnalysis(analysis);
                
                progress.report({ increment: 100, message: "Complete!" });
                
                vscode.window.showInformationMessage('✨ Repository analysis complete!');
            } catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                vscode.window.showErrorMessage(`GitMind Pro: ${message}`);
            }
        });
    });

    // Command: Analyze Current File
    const analyzeFileCmd = vscode.commands.registerCommand('gitmind.analyzeFile', async () => {
        const config = vscode.workspace.getConfiguration('gitmind');
        const apiKey = config.get<string>('geminiApiKey');
        
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
                const explanation = await analyzeCurrentFile(apiKey, fileName, content);
                
                // Show explanation in new document
                const doc = await vscode.workspace.openTextDocument({
                    content: explanation,
                    language: 'markdown'
                });
                await vscode.window.showTextDocument(doc, { viewColumn: vscode.ViewColumn.Beside });
                
            } catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                vscode.window.showErrorMessage(`Analysis failed: ${message}`);
            }
        });
    });

    // Command: Show Team Health
    const teamHealthCmd = vscode.commands.registerCommand('gitmind.teamHealth', async () => {
        const config = vscode.workspace.getConfiguration('gitmind');
        const apiKey = config.get<string>('geminiApiKey');
        
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
                const health = await getTeamHealth(apiKey);
                provider.updateTeamHealth(health);
                vscode.window.showInformationMessage('Team health analysis complete!');
            } catch (error) {
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
    const autoAnalyze = vscode.workspace.getConfiguration('gitmind').get<boolean>('autoAnalyze');
    if (autoAnalyze && vscode.workspace.workspaceFolders) {
        setTimeout(() => {
            vscode.commands.executeCommand('gitmind.analyzeRepo');
        }, 2000);
    }

    context.subscriptions.push(analyzeRepoCmd, analyzeFileCmd, teamHealthCmd, openWebAppCmd);
}

export function deactivate() {}
