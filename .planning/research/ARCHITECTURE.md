# Architecture Patterns

**Domain:** VS Code Extension - Development Server Preview
**Researched:** March 2026

## Recommended Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  VS Code Extension Host (Node.js)                           │
│                                                             │
│  ┌─────────────────┐  ┌──────────────────┐                  │
│  │   extension.ts  │  │  ServerManager   │                  │
│  │   (commands,    │──│  (child_process, │                  │
│  │   lifecycle)    │  │   file watcher)  │                  │
│  └────────┬────────┘  └────────┬─────────┘                  │
│           │                    │                            │
│  ┌────────▼────────────────────▼─────────┐                  │
│  │          PreviewPanel                 │                  │
│  │   (WebviewPanel lifecycle, messages)  │                  │
│  └────────────────────┬──────────────────┘                  │
└───────────────────────┼─────────────────────────────────────┘
                        │ postMessage / onDidReceiveMessage
                        ▼
┌─────────────────────────────────────────────────────────────┐
│               Webview (panel.html)                          │
│                                                             │
│  ┌─────────┐  ┌───────────┐  ┌───────────┐                  │
│  │ Toolbar │  │  iframe   │  │   Tabs    │                  │
│  │ (Run/   │  │ (preview) │  │(Console/  │                  │
│  │  Stop)  │  │           │  │ Network/  │                  │
│  │         │  │           │  │ HMR logs) │                  │
│  └─────────┘  └───────────┘  └───────────┘                  │
└─────────────────────────────────────────────────────────────┘
```

## Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| extension.ts | Command registration, lifecycle | ServerManager, PreviewPanel |
| ServerManager | Spawn npm, watch files, port detection | extension.ts (callbacks) |
| PreviewPanel | Webview lifecycle, message routing | extension.ts, Webview (postMessage) |
| scriptsTree.ts | Read package.json, tree UI | extension.ts (via TreeDataProvider) |
| panel.html | Render preview UI, handle user input | PreviewPanel (via postMessage) |

## Key Patterns Used

### 1. Singleton WebviewPanel
```typescript
class PreviewPanel {
  static currentPanel: PreviewPanel | undefined;
  
  static createOrShow(ctx, server): PreviewPanel {
    if (PreviewPanel.currentPanel) {
      PreviewPanel.currentPanel.panel.reveal();
      return PreviewPanel.currentPanel;
    }
    // Create new panel...
  }
}
```

### 2. Event Subscription Cleanup
```typescript
// All subscriptions go to context.subscriptions for cleanup
context.subscriptions.push(
  vscode.commands.registerCommand('cmd', handler),
  statusBarItem,
  fileWatcher
);
```

### 3. Message Passing Bridge
```typescript
// Extension → Webview
panel.webview.postMessage({ type: 'serverStatus', running: true, port: 3000 });

// Webview → Extension
window.addEventListener('message', ({ data }) => {
  if (data.command === 'stop') { /* handle */ }
});
```

## Anti-Patterns to Avoid

### ❌ Don't: Use DOM manipulation in extension host
Webview runs in separate context. Only communicate via postMessage.

### ❌ Don't: Spawn without cleanup
Always register process cleanup in deactivate():
```typescript
export function deactivate() {
  serverManager?.stop(); // Kills npm process + children
}
```

### ❌ Don't: Trust iframe content
Iframe content is untrusted. Never pass sensitive data to iframe.

## Scalability Considerations

| Concern | At 10 users | At 1000 users | At 100K users |
|---------|-------------|---------------|---------------|
| Memory | Webview ~50MB | Per-instance | Same (single workspace) |
| CPU | Minimal when idle | Same | Same |
| Network | Per-preview | Same | Same |

## Sources

- [VS Code Webview API](https://code.visualstudio.com/api/extension-guides/webview)
- [Webview Panel Serializer](https://code.visualstudio.com/api/extension-guides/webview#serialization)
- [Content Security Policy](https://code.visualstudio.com/api/extension-guides/webview#content-security-policy)
