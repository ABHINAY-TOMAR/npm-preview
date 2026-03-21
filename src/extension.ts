/**
 * NPM Preview – extension.ts
 * Registers all commands, tree view, and status bar.
 */
import * as vscode from 'vscode';
import { ServerManager } from './serverManager';
import { PreviewPanel } from './previewPanel';
import { ScriptsTreeProvider } from './scriptsTree';
import { StatusBarManager } from './statusBar';

let serverManager: ServerManager | undefined;
let previewPanel: PreviewPanel | undefined;
let statusBar: StatusBarManager | undefined;
let scriptsTree: ScriptsTreeProvider | undefined;

export function activate(context: vscode.ExtensionContext) {
  serverManager = new ServerManager(context);
  scriptsTree = new ScriptsTreeProvider();
  statusBar = new StatusBarManager();

  // Create tree view in sidebar
  vscode.window.createTreeView('npmPreviewScripts', {
    treeDataProvider: scriptsTree,
  });

  // ── Start ──────────────────────────────────────────────────
  context.subscriptions.push(
    vscode.commands.registerCommand('npmPreview.start', async () => {
      const cfg = vscode.workspace.getConfiguration('npmPreview');
      const script = cfg.get<string>('startScript', 'start');
      try {
        await serverManager!.start(script);
        vscode.commands.executeCommand('setContext', 'npmPreview.running', true);
        statusBar?.setStatus('running', serverManager!.port);
        if (cfg.get<boolean>('openPanelOnStart', true)) {
          previewPanel = PreviewPanel.createOrShow(context, serverManager!);
        }
        vscode.window.showInformationMessage(
          `NPM Preview: Server started on port ${serverManager!.port}`
        );
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        vscode.window.showErrorMessage(`NPM Preview: ${message}`);
        statusBar?.setStatus('idle');
      }
    })
  );

  // ── Stop ───────────────────────────────────────────────────
  context.subscriptions.push(
    vscode.commands.registerCommand('npmPreview.stop', async () => {
      try {
        await serverManager!.stop();
        vscode.commands.executeCommand('setContext', 'npmPreview.running', false);
        statusBar?.setStatus('stopped');
        vscode.window.showInformationMessage('NPM Preview: Server stopped');
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        vscode.window.showErrorMessage(`NPM Preview: ${message}`);
      }
    })
  );

  // ── Open Panel ─────────────────────────────────────────────
  context.subscriptions.push(
    vscode.commands.registerCommand('npmPreview.openPanel', () => {
      if (serverManager) {
        previewPanel = PreviewPanel.createOrShow(context, serverManager);
      } else {
        vscode.window.showWarningMessage(
          'NPM Preview: Start a server first to open the preview panel'
        );
      }
    })
  );

  // ── Run Script (from tree) ─────────────────────────────────
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'npmPreview.runScript',
      async (scriptName?: string) => {
        const names = await scriptsTree!.getScriptNames();
        const name =
          scriptName ??
          (await vscode.window.showQuickPick(names, {
            placeHolder: 'Select npm script to run',
          }));
        if (!name) return;

        try {
          await serverManager!.start(name);
          vscode.commands.executeCommand('setContext', 'npmPreview.running', true);
          statusBar?.setStatus('running', serverManager!.port);
          previewPanel = PreviewPanel.createOrShow(context, serverManager!);
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          vscode.window.showErrorMessage(`NPM Preview: ${message}`);
        }
      })
  );

  // ── Clear Console ─────────────────────────────────────────
  context.subscriptions.push(
    vscode.commands.registerCommand('npmPreview.clearConsole', () => {
      previewPanel?.postMessage({ type: 'clearConsole' });
    })
  );

  // ── Take Screenshot (placeholder) ───────────────────────────
  context.subscriptions.push(
    vscode.commands.registerCommand('npmPreview.takeScreenshot', () => {
      vscode.window.showInformationMessage(
        'Screenshot feature coming soon!'
      );
    })
  );

  // ── Refresh Scripts Tree ───────────────────────────────────
  context.subscriptions.push(
    vscode.commands.registerCommand('npmPreview.refreshScripts', () => {
      scriptsTree?.refresh();
    })
  );

  // ── Server Status Change Handler ───────────────────────────
  serverManager.onStatusChange((running, port) => {
    statusBar?.setStatus(running ? 'running' : 'stopped', port);
    previewPanel?.postMessage({ type: 'serverStatus', running, port });
  });

  // ── Auto-refresh scripts when package.json changes ─────────
  const packageJsonWatcher = vscode.workspace.createFileSystemWatcher(
    '**/package.json'
  );
  packageJsonWatcher.onDidChange(() => scriptsTree?.refresh());
  packageJsonWatcher.onDidCreate(() => scriptsTree?.refresh());
  context.subscriptions.push(packageJsonWatcher);
}

export function deactivate(): void {
  serverManager?.stop();
  statusBar?.dispose();
}
