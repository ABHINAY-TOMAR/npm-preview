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

  const isFirstRun = !context.globalState.get('npmPreview.hasShownWelcome');
  if (isFirstRun) {
    context.globalState.update('npmPreview.hasShownWelcome', true);
    setTimeout(async () => {
      try {
        const choice = await vscode.window.showInformationMessage(
          '🎉 NPM Preview installed! Press Ctrl+Shift+R to start your dev server.',
          'Open Settings',
          'Run Script'
        );
        if (choice === 'Open Settings') {
          vscode.commands.executeCommand('workbench.action.openSettings', 'npmPreview');
        } else if (choice === 'Run Script') {
          vscode.commands.executeCommand('npmPreview.runScript');
        }
      } catch (err) {
        console.error('Welcome message error:', err);
      }
    }, 2000);
  }

  // Create tree view in sidebar
  const treeView = vscode.window.createTreeView('npmPreviewScripts', {
    treeDataProvider: scriptsTree,
  });
  context.subscriptions.push(treeView);
  
  // Add statusBar to subscriptions for proper disposal
  context.subscriptions.push(statusBar);

  // ── Start ──────────────────────────────────────────────────
  context.subscriptions.push(
    vscode.commands.registerCommand('npmPreview.start', async () => {
      const sm = serverManager;
      if (!sm) {
        vscode.window.showErrorMessage('NPM Preview: Extension not properly initialized');
        return;
      }
      
      const cfg = vscode.workspace.getConfiguration('npmPreview');
      const configuredScript = cfg.get<string>('startScript', 'start');
      
      try {
        await sm.start(configuredScript);
        vscode.commands.executeCommand('setContext', 'npmPreview.running', true);
        statusBar?.setStatus('running', sm.port);
        if (cfg.get<boolean>('openPanelOnStart', true)) {
          previewPanel = PreviewPanel.createOrShow(context, sm);
        }
        const port = sm.port;
        try {
          const choice = await vscode.window.showInformationMessage(
            `✅ Server started on port ${port}`,
            'Open Panel'
          );
          if (choice === 'Open Panel' && serverManager) {
            previewPanel = PreviewPanel.createOrShow(context, serverManager);
          }
        } catch (err) {
          console.error('Open Panel choice error:', err);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        const lines = message.split('\n');
        const title = lines[0].replace(/^TIMEOUT: |^Error: /i, '');
        const details = lines.slice(1).join('\n').trim();
        
        if (details) {
          try {
            const choice = await vscode.window.showErrorMessage(title, { detail: details, modal: false }, 'Open Settings');
            if (choice === 'Open Settings') {
              vscode.commands.executeCommand('workbench.action.openSettings', 'npmPreview');
            }
          } catch (err) {
            console.error('Error message choice error:', err);
          }
        } else {
          vscode.window.showErrorMessage(`NPM Preview: ${title}`);
        }
        statusBar?.setStatus('idle');
      }
    })
  );

  // ── Stop ───────────────────────────────────────────────────
  context.subscriptions.push(
    vscode.commands.registerCommand('npmPreview.stop', async () => {
      if (!serverManager) {
        vscode.window.showErrorMessage('NPM Preview: Extension not properly initialized');
        return;
      }
      try {
        await serverManager.stop();
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
        if (!scriptsTree || !serverManager) {
          vscode.window.showErrorMessage('NPM Preview: Extension not properly initialized');
          return;
        }
        
        const names = await scriptsTree.getScriptNames();
        
        if (names.length === 0) {
          vscode.window.showWarningMessage('No npm scripts found in package.json');
          return;
        }

        const prioritized = [...names].sort((a, b) => {
          const priority = ['dev', 'development', 'start', 'serve', 'preview'];
          const aIdx = priority.indexOf(a.toLowerCase());
          const bIdx = priority.indexOf(b.toLowerCase());
          if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
          if (aIdx !== -1) return -1;
          if (bIdx !== -1) return 1;
          return 0;
        });

        const name =
          scriptName ??
          (await vscode.window.showQuickPick(prioritized, {
            placeHolder: 'Select npm script to run (dev/start highlighted)',
            matchOnDescription: true,
          }));
        if (!name) return;

        try {
          vscode.window.showInformationMessage(`Starting "${name}"...`, { modal: false });
          await serverManager.start(name);
          vscode.commands.executeCommand('setContext', 'npmPreview.running', true);
          statusBar?.setStatus('running', serverManager.port);
          previewPanel = PreviewPanel.createOrShow(context, serverManager);
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          const lines = message.split('\n');
          const title = lines[0];
          const details = lines.slice(1).join('\n').trim();
          if (details) {
            vscode.window.showErrorMessage(title, { detail: details, modal: false });
          } else {
            vscode.window.showErrorMessage(`NPM Preview: ${title}`);
          }
        }
      })
  );

  // ── Clear Console ─────────────────────────────────────────
  context.subscriptions.push(
    vscode.commands.registerCommand('npmPreview.clearConsole', () => {
      previewPanel?.postMessage({ type: 'clearConsole' });
    })
  );

  // ── Take Screenshot ──────────────────────────────────────────
  context.subscriptions.push(
    vscode.commands.registerCommand('npmPreview.takeScreenshot', async () => {
      const panel = PreviewPanel.currentPanel;
      if (!panel) {
        vscode.window.showWarningMessage('No preview panel open');
        return;
      }
      
      // Request capture from webview
      panel.postMessage({ type: 'captureScreenshot' });
      
      vscode.window.setStatusBarMessage('$(camera) Capturing screenshot...', 2000);
    })
  );

  // ── Save Screenshot ───────────────────────────────────────────
  context.subscriptions.push(
    vscode.commands.registerCommand('npmPreview.saveScreenshot', async (_: unknown, base64Data: string) => {
      try {
        // Remove data URL prefix
        const base64 = base64Data.replace(/^data:image\/png;base64,/, '');
        const buffer = Buffer.from(base64, 'base64');
        
        // Open save dialog
        const uri = await vscode.window.showSaveDialog({
          defaultUri: vscode.Uri.file(`screenshot-${Date.now()}.png`),
          filters: {
            'PNG Image': ['png'],
            'All Files': ['*']
          }
        });
        
        if (uri) {
          await vscode.workspace.fs.writeFile(uri, buffer);
          vscode.window.showInformationMessage(`📷 Screenshot saved to ${uri.fsPath}`);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        vscode.window.showErrorMessage(`Failed to save screenshot: ${message}`);
      }
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

export async function deactivate(): Promise<void> {
  // Stop the server properly
  if (serverManager) {
    try {
      await serverManager.stop();
    } catch (err) {
      console.error('Error stopping server on deactivate:', err);
    }
  }
  // Dispose status bar
  statusBar?.dispose();
}
