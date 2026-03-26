# Architecture Patterns

**Domain:** VS Code Extension
**Researched:** 2026-03-26

## Recommended Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  VS Code Extension Host (Node.js)                           │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  extension.ts (Entry Point)                          │   │
│  │  - Registers commands                                │   │
│  │  - Creates tree view                                 │   │
│  │  - Manages status bar                                │   │
│  └─────────────────────────────────────────────────────┘   │
│                          │                                   │
│         ┌───────────────┼───────────────┐                  │
│         ▼               ▼               ▼                  │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │ServerManager│  │PreviewPanel│  │ScriptsTree │            │
│  │            │  │            │  │            │            │
│  │- spawn npm │  │- Webview   │  │- TreeData  │            │
│  │- port detect│ │- iframe    │  │  Provider  │            │
│  │- file watch│  │- postMsg   │  │            │            │
│  └────────────┘  └────────────┘  └────────────┘            │
│         │               │                                   │
│         │   postMessage │                                   │
│         └───────────────┼───────────────────────────────────┤
│                         ▼                                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Webview (panel.html)                                │   │
│  │  ┌──────────┐ ┌────────────┐ ┌──────────────┐       │   │
│  │  │ Toolbar  │ │ iframe     │ │ Bottom Panels │       │   │
│  │  │ Run/Stop │ │ (preview)  │ │ Console/     │       │   │
│  │  │ Device   │ │            │ │ Network/HMR  │       │   │
│  │  │ buttons  │ │            │ │              │       │   │
│  │  └──────────┘ └────────────┘ └──────────────┘       │   │
│  │                                                     │   │
│  │  Injected Scripts:                                  │   │
│  │  - console.* interception                          │   │
│  │  - fetch interception                               │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| extension.ts | Entry point, command registration, lifecycle | All components via callbacks |
| ServerManager | npm process management, port detection, file watching | extension.ts (callbacks), PreviewPanel (via postMessage) |
| PreviewPanel | Webview lifecycle, message relay | extension.ts (VS Code API), panel.html (postMessage) |
| StatusBarManager | Status bar UI | extension.ts (method calls) |
| ScriptsTreeProvider | Package.json script tree | extension.ts (TreeDataProvider interface) |
| panel.html | Preview UI, interception | PreviewPanel (postMessage API) |

## Patterns to Follow

### Pattern 1: Event-Driven Server Management
**What:** ServerManager emits events for state changes
**When:** When server starts/stops or emits logs
**Example:**
```typescript
// ServerManager
private callbacks: StatusCallback[] = [];

onStatusChange(cb: StatusCallback): void {
  this.callbacks.push(cb);
}

private setRunning(val: boolean): void {
  this._running = val;
  this.callbacks.forEach((cb) => cb(val, this._port));
}
```

### Pattern 2: Webview Message Protocol
**What:** Type-safe message passing between extension and webview
**When:** All communication via postMessage
**Example:**
```typescript
export type PanelMessage =
  | { type: 'serverStarted'; url: string; script: string; port: number }
  | { type: 'serverStopped' }
  | { type: 'hotReload'; changedFile?: string }
  | { type: 'log'; time: string; level: 'log' | 'warn' | 'error'; message: string };
```

### Pattern 3: Singleton Panel
**What:** PreviewPanel uses static currentPanel
**When:** Only one preview panel needed
**Example:**
```typescript
static currentPanel: PreviewPanel | undefined;

static createOrShow(ctx, server): PreviewPanel {
  if (PreviewPanel.currentPanel) {
    PreviewPanel.currentPanel.panel.reveal(vscode.ViewColumn.Beside);
    PreviewPanel.currentPanel.bindServer(server);
    return PreviewPanel.currentPanel;
  }
  // ... create new panel
}
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: Unused Duplicate Implementation
**What:** npmRunner.ts exists but is never imported
**Why bad:** Dead code, maintenance burden
**Instead:** Either use it or remove it

### Anti-Pattern 2: Cross-Origin iframe Attempt
**What:** Trying to inject scripts into non-localhost iframes
**Why bad:** Browser security prevents this
**Instead:** Document as limitation, only works for localhost

## Scalability Considerations

| Concern | At 10 users | At 1K users | At 100K users |
|---------|-------------|-------------|---------------|
| npm processes | 1 per user | Same (VS Code runs locally) | Same |
| Memory | <50MB | <50MB | <50MB |
| Webview | 1 per VS Code window | Same | Same |

The extension is inherently single-instance (VS Code constraint), so horizontal scaling isn't a concern.

## Sources

- Extension source code analysis
- VS Code Extension API documentation
- panel.html implementation
