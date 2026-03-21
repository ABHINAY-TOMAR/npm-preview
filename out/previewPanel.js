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
exports.PreviewPanel = void 0;
/**
 * PreviewPanel
 * The main WebviewPanel that hosts the preview iframe + all enhancement panels.
 * Consolidated from previewPanel.ts and previewPanelManager.ts
 */
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
class PreviewPanel {
    static createOrShow(ctx, server) {
        const col = vscode.window.activeTextEditor?.viewColumn ?? vscode.ViewColumn.One;
        if (PreviewPanel.currentPanel) {
            PreviewPanel.currentPanel.panel.reveal(vscode.ViewColumn.Beside);
            PreviewPanel.currentPanel.bindServer(server);
            return PreviewPanel.currentPanel;
        }
        const panel = vscode.window.createWebviewPanel('npmPreview', '🖥 NPM Preview', vscode.ViewColumn.Beside, {
            enableScripts: true,
            retainContextWhenHidden: true,
            localResourceRoots: [vscode.Uri.joinPath(ctx.extensionUri, 'webview')],
        });
        PreviewPanel.currentPanel = new PreviewPanel(panel, ctx, server);
        return PreviewPanel.currentPanel;
    }
    constructor(panel, ctx, server) {
        this.ctx = ctx;
        this.disposables = [];
        this.messageQueue = [];
        this.panel = panel;
        this.panel.webview.html = this.getHtml();
        // Handle messages from the webview
        this.panel.webview.onDidReceiveMessage((msg) => this.handleMessage(msg), undefined, this.disposables);
        this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
        if (server) {
            this.bindServer(server);
        }
    }
    bindServer(server) {
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
    postMessage(msg) {
        if (this.panel.webview) {
            this.panel.webview.postMessage(msg);
        }
        else {
            this.messageQueue.push(msg);
        }
    }
    handleMessage(msg) {
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
    }
    getHtml() {
        const webviewPath = path.join(this.ctx.extensionPath, 'webview', 'panel.html');
        if (fs.existsSync(webviewPath)) {
            return fs.readFileSync(webviewPath, 'utf-8');
        }
        return this.getFallbackHtml();
    }
    getFallbackHtml() {
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
    dispose() {
        PreviewPanel.currentPanel = undefined;
        this.boundServer = undefined;
        this.panel.dispose();
        this.disposables.forEach((d) => d.dispose());
    }
}
exports.PreviewPanel = PreviewPanel;
//# sourceMappingURL=previewPanel.js.map