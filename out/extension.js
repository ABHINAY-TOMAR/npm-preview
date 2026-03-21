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
/**
 * NPM Preview – extension.ts
 * Registers all commands, tree view, and status bar.
 */
const vscode = __importStar(require("vscode"));
const serverManager_1 = require("./serverManager");
const previewPanel_1 = require("./previewPanel");
const scriptsTree_1 = require("./scriptsTree");
const statusBar_1 = require("./statusBar");
let serverManager;
let previewPanel;
let statusBar;
let scriptsTree;
function activate(context) {
    serverManager = new serverManager_1.ServerManager(context);
    scriptsTree = new scriptsTree_1.ScriptsTreeProvider();
    statusBar = new statusBar_1.StatusBarManager();
    // Create tree view in sidebar
    vscode.window.createTreeView('npmPreviewScripts', {
        treeDataProvider: scriptsTree,
    });
    // ── Start ──────────────────────────────────────────────────
    context.subscriptions.push(vscode.commands.registerCommand('npmPreview.start', async () => {
        const cfg = vscode.workspace.getConfiguration('npmPreview');
        const script = cfg.get('startScript', 'start');
        try {
            await serverManager.start(script);
            vscode.commands.executeCommand('setContext', 'npmPreview.running', true);
            statusBar?.setStatus('running', serverManager.port);
            if (cfg.get('openPanelOnStart', true)) {
                previewPanel = previewPanel_1.PreviewPanel.createOrShow(context, serverManager);
            }
            vscode.window.showInformationMessage(`NPM Preview: Server started on port ${serverManager.port}`);
        }
        catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            vscode.window.showErrorMessage(`NPM Preview: ${message}`);
            statusBar?.setStatus('idle');
        }
    }));
    // ── Stop ───────────────────────────────────────────────────
    context.subscriptions.push(vscode.commands.registerCommand('npmPreview.stop', async () => {
        try {
            await serverManager.stop();
            vscode.commands.executeCommand('setContext', 'npmPreview.running', false);
            statusBar?.setStatus('stopped');
            vscode.window.showInformationMessage('NPM Preview: Server stopped');
        }
        catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            vscode.window.showErrorMessage(`NPM Preview: ${message}`);
        }
    }));
    // ── Open Panel ─────────────────────────────────────────────
    context.subscriptions.push(vscode.commands.registerCommand('npmPreview.openPanel', () => {
        if (serverManager) {
            previewPanel = previewPanel_1.PreviewPanel.createOrShow(context, serverManager);
        }
        else {
            vscode.window.showWarningMessage('NPM Preview: Start a server first to open the preview panel');
        }
    }));
    // ── Run Script (from tree) ─────────────────────────────────
    context.subscriptions.push(vscode.commands.registerCommand('npmPreview.runScript', async (scriptName) => {
        const names = await scriptsTree.getScriptNames();
        const name = scriptName ??
            (await vscode.window.showQuickPick(names, {
                placeHolder: 'Select npm script to run',
            }));
        if (!name)
            return;
        try {
            await serverManager.start(name);
            vscode.commands.executeCommand('setContext', 'npmPreview.running', true);
            statusBar?.setStatus('running', serverManager.port);
            previewPanel = previewPanel_1.PreviewPanel.createOrShow(context, serverManager);
        }
        catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            vscode.window.showErrorMessage(`NPM Preview: ${message}`);
        }
    }));
    // ── Clear Console ─────────────────────────────────────────
    context.subscriptions.push(vscode.commands.registerCommand('npmPreview.clearConsole', () => {
        previewPanel?.postMessage({ type: 'clearConsole' });
    }));
    // ── Take Screenshot (placeholder) ───────────────────────────
    context.subscriptions.push(vscode.commands.registerCommand('npmPreview.takeScreenshot', () => {
        vscode.window.showInformationMessage('Screenshot feature coming soon!');
    }));
    // ── Refresh Scripts Tree ───────────────────────────────────
    context.subscriptions.push(vscode.commands.registerCommand('npmPreview.refreshScripts', () => {
        scriptsTree?.refresh();
    }));
    // ── Server Status Change Handler ───────────────────────────
    serverManager.onStatusChange((running, port) => {
        statusBar?.setStatus(running ? 'running' : 'stopped', port);
        previewPanel?.postMessage({ type: 'serverStatus', running, port });
    });
    // ── Auto-refresh scripts when package.json changes ─────────
    const packageJsonWatcher = vscode.workspace.createFileSystemWatcher('**/package.json');
    packageJsonWatcher.onDidChange(() => scriptsTree?.refresh());
    packageJsonWatcher.onDidCreate(() => scriptsTree?.refresh());
    context.subscriptions.push(packageJsonWatcher);
}
function deactivate() {
    serverManager?.stop();
    statusBar?.dispose();
}
//# sourceMappingURL=extension.js.map