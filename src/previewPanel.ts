/**
 * PreviewPanel
 * The main WebviewPanel that hosts the preview iframe + all enhancement panels.
 * Consolidated from previewPanel.ts and previewPanelManager.ts
 */
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { ServerManager } from './serverManager';

export interface NetworkRequest {
  id: string;
  method: string;
  url: string;
  status?: number;
  statusText?: string;
  duration?: number;
  requestHeaders?: Record<string, string>;
  responseHeaders?: Record<string, string>;
  size?: number;
  type?: string;
  timestamp: number;
}

export type PanelMessage =
  | { type: 'serverStarted'; url: string; script: string; port: number }
  | { type: 'serverStopped' }
  | { type: 'hotReload'; changedFile?: string }
  | { type: 'consoleLog'; level: 'log' | 'warn' | 'error' | 'info'; args: string[]; timestamp: number }
  | { type: 'networkRequest'; request: NetworkRequest }
  | { type: 'clearConsole' }
  | { type: 'npmOutput'; text: string; stream: 'stdout' | 'stderr' }
  | { type: 'mcpEvent'; event: string; data: unknown }
  | { type: 'init'; running: boolean; port: number }
  | { type: 'serverStatus'; running: boolean; port: number }
  | { type: 'log'; time: string; level: 'log' | 'warn' | 'error' | 'info'; message: string }
  | { type: 'captureScreenshot' }
  | { type: 'screenshotData'; data: string }
  | { type: 'screenshotError'; error: string };

export class PreviewPanel {
  static currentPanel: PreviewPanel | undefined;
  private panel: vscode.WebviewPanel;
  private disposables: vscode.Disposable[] = [];
  private messageQueue: PanelMessage[] = [];
  private boundServer: ServerManager | undefined;

  static createOrShow(ctx: vscode.ExtensionContext, server: ServerManager): PreviewPanel {
    const col = vscode.window.activeTextEditor?.viewColumn ?? vscode.ViewColumn.One;

    if (PreviewPanel.currentPanel) {
      PreviewPanel.currentPanel.panel.reveal(vscode.ViewColumn.Beside);
      PreviewPanel.currentPanel.bindServer(server);
      return PreviewPanel.currentPanel;
    }

    const panel = vscode.window.createWebviewPanel(
      'npmPreview',
      '🖥 NPM Preview',
      vscode.ViewColumn.Beside,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [vscode.Uri.joinPath(ctx.extensionUri, 'webview')],
      }
    );

    PreviewPanel.currentPanel = new PreviewPanel(panel, ctx, server);
    return PreviewPanel.currentPanel;
  }

  constructor(
    panel: vscode.WebviewPanel,
    private ctx: vscode.ExtensionContext,
    server?: ServerManager
  ) {
    this.panel = panel;
    this.panel.webview.html = this.getHtml();

    // Handle messages from the webview
    this.panel.webview.onDidReceiveMessage(
      (msg) => this.handleMessage(msg),
      undefined,
      this.disposables
    );

    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);

    if (server) {
      this.bindServer(server);
    }
  }

  bindServer(server: ServerManager): void {
    // Clear previous server bindings if any
    this.unbindServer();
    
    this.boundServer = server;

    // Replay existing logs
    for (const log of server.logs) {
      this.postMessage({ type: 'log', ...log });
    }

    // Stream future logs
    server.onLogLine = (line) => this.postMessage({ type: 'log', ...line });

    // Hot reload events
    server.onHotReload = (file) => {
      this.postMessage({ type: 'hotReload', changedFile: file });
    };

    // Initial server state
    this.postMessage({
      type: 'init',
      running: server.running,
      port: server.port,
    });
  }
  
  private unbindServer(): void {
    if (this.boundServer) {
      // Clear callbacks on the previous server
      this.boundServer.onLogLine = undefined;
      this.boundServer.onHotReload = undefined;
      this.boundServer.removeAllCallbacks();
    }
  }

  postMessage(msg: PanelMessage): void {
    if (this.panel.webview) {
      this.panel.webview.postMessage(msg);
    } else {
      this.messageQueue.push(msg);
    }
  }

  private handleMessage(msg: { command?: string; type?: string; [k: string]: unknown }): void {
    // Handle messages from the webview
    switch (msg.command) {
      case 'start':
        vscode.commands.executeCommand('npmPreview.start');
        break;
      case 'stop':
        vscode.commands.executeCommand('npmPreview.stop');
        break;
      case 'openExternal':
        if (typeof msg.url === 'string') {
          vscode.env.openExternal(vscode.Uri.parse(msg.url));
        }
        break;
      case 'copyUrl':
        if (typeof msg.url === 'string') {
          vscode.env.clipboard.writeText(msg.url);
          vscode.window.setStatusBarMessage('$(clippy) URL copied!', 2000);
        }
        break;
      case 'runScript':
        vscode.commands.executeCommand('npmPreview.runScript');
        break;
      case 'clearConsole':
        vscode.commands.executeCommand('npmPreview.clearConsole');
        break;
      case 'takeScreenshot':
        vscode.commands.executeCommand('npmPreview.takeScreenshot');
        break;
    }

    // Handle message types (not commands)
    if (msg.type === 'screenshotData' && typeof msg.data === 'string') {
      vscode.commands.executeCommand('npmPreview.saveScreenshot', msg.data);
    } else if (msg.type === 'screenshotError' && typeof msg.error === 'string') {
      vscode.window.showErrorMessage(`Screenshot failed: ${msg.error}`);
    }
  }

  private getHtml(): string {
    const webviewPath = path.join(this.ctx.extensionPath, 'webview', 'panel.html');
    if (fs.existsSync(webviewPath)) {
      return fs.readFileSync(webviewPath, 'utf-8');
    }
    return this.getFallbackHtml();
  }

  private getFallbackHtml(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; frame-src http://localhost:*; script-src 'unsafe-inline'; style-src 'unsafe-inline';">
  <title>NPM Preview</title>
  <style>
    body {
      margin: 0;
      background: #0a0a0f;
      color: #e2e2f0;
      font-family: 'Segoe UI', system-ui, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
    }
    .container {
      text-align: center;
    }
    .icon {
      font-size: 64px;
      margin-bottom: 16px;
    }
    .title {
      font-size: 24px;
      color: #00ffa3;
      margin-bottom: 8px;
    }
    .subtitle {
      color: #5a5a7a;
      font-size: 14px;
    }
    .loading {
      margin-top: 24px;
      color: #5a5a7a;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">🖥</div>
    <div class="title">NPM Preview</div>
    <div class="subtitle">Run an npm script to start the preview</div>
    <div class="loading" id="status">Waiting for server...</div>
  </div>
  <script>
    const vscode = acquireVsCodeApi();
    
    window.addEventListener('message', e => {
      const msg = e.data;
      if (msg.type === 'init' || msg.type === 'serverStatus') {
        const statusEl = document.getElementById('status');
        if (msg.running) {
          statusEl.textContent = 'Server running on port ' + msg.port;
          statusEl.style.color = '#00ffa3';
        } else {
          statusEl.textContent = 'Waiting for server...';
          statusEl.style.color = '#5a5a7a';
        }
      }
    });
  </script>
</body>
</html>`;
  }

  dispose(): void {
    // Clear server bindings first to prevent callbacks to disposed panel
    this.unbindServer();
    
    PreviewPanel.currentPanel = undefined;
    this.boundServer = undefined;
    
    // Dispose all disposables
    this.disposables.forEach((d) => d.dispose());
    this.disposables = [];
    
    // Dispose the panel
    this.panel.dispose();
  }
}
