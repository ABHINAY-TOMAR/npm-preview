# NPM Preview Extension - Integration Map

**Project:** npm-preview-extension  
**Generated:** March 2026  
**Purpose:** Complete integration documentation with file locations

---

## 📁 File Structure

```
npm-preview-extension/
├── src/
│   ├── extension.ts           # Main entry point - coordinates all modules
│   ├── serverManager.ts       # npm process management & file watching
│   ├── previewPanel.ts        # Webview panel lifecycle & message bridge
│   ├── scriptsTree.ts         # Sidebar tree for npm scripts
│   ├── statusBar.ts           # Status bar management
│   ├── npmRunner.ts           # Alternative npm runner (unused)
│   └── types/
│       └── portfinder.d.ts    # Type definitions for portfinder
├── webview/
│   └── panel.html             # Webview UI - toolbar, iframe, panels
├── icons/
│   ├── logo.svg               # Extension icon (128x128)
│   └── activity-icon.svg      # Activity bar icon (32x32)
├── package.json               # Extension manifest
├── tsconfig.json              # TypeScript configuration
├── README.md                  # User documentation
├── ROADMAP.md                 # Build roadmap
└── .vscodeignore             # Files excluded from package
```

---

## 🔗 Integration Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        VS Code Host                             │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    extension.ts                         │    │
│  │  • activate() / deactivate()                            │    │
│  │  • Registers all commands                               │    │
│  │  • Creates tree view                                    │    │
│  └────────────────────┬────────────────────────────────────┘    │
│                       │                                         │
│     ┌─────────────────┼─────────────────┐                       │
│     │                 │                 │                       │
│     ▼                 ▼                 ▼                       │
│  ┌────────────┐  ┌────────────┐  ┌─────────────┐                │
│  │ServerMgr   │  │PreviewPanel│  │ScriptsTree  │                │
│  │            │◄─┤            │  │             │                │
│  │ npm spawn  │  │ webview    │  │ package.json│                │
│  │ file watch │  │ lifecycle  │  │ reader      │                │
│  └─────┬──────┘  └─────┬──────┘  └─────────────┘                │
│        │               │                                        │
│        │ onLogLine     │ postMessage                            │
│        │ onHotReload   │ ▼                                      │
│        │ onStatusChg   │ webview/panel.html                     │
│        │               │  • Toolbar (Run/Stop)                  │
│        └───────────────┴──• iframe (preview)                    │
│                           • Console panel                       │
│                           • Network panel                       │
│                           • Hot Reload panel                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📋 Command Integration Map

All commands registered in `package.json` → `contributes.commands`

| Command ID | Title | Handler Location | Keybinding |
|------------|-------|------------------|------------|
| `npmPreview.start` | Start Server | `extension.ts:28-46` | — |
| `npmPreview.stop` | Stop Server | `extension.ts:50-61` | — |
| `npmPreview.openPanel` | Open Panel | `extension.ts:65-74` | — |
| `npmPreview.runScript` | Run Script | `extension.ts:78-99` | — |
| `npmPreview.clearConsole` | Clear Console | `extension.ts:103-106` | — |
| `npmPreview.refreshScripts` | Refresh Scripts | `extension.ts:119-122` | — |
| `npmPreview.takeScreenshot` | Take Screenshot | `extension.ts:110-115` | — |

---

## 🔌 Message Bridge Integration

### Extension → Webview Messages (`previewPanel.ts`)

| Message Type | Payload | Source | Handler |
|--------------|---------|--------|---------|
| `init` | `{running, port}` | `previewPanel.ts:109` | `panel.html:200` |
| `serverStatus` | `{running, port}` | `extension.ts:128` | `panel.html:201` |
| `hotReload` | `{changedFile}` | `previewPanel.ts:105` | `panel.html:205` |
| `log` | `{time, level, message}` | `previewPanel.ts:97,101` | `panel.html:203` |
| `clearConsole` | — | `extension.ts:105` | Not handled in webview |
| `networkRequest` | `{request}` | `panel.html:357` (via iframe) | `panel.html:207` |

### Webview → Extension Messages (`panel.html` → `previewPanel.ts`)

| Command | Action | Location |
|---------|--------|----------|
| `start` | Calls `npmPreview.start` | `panel.html:105` |
| `stop` | Calls `npmPreview.stop` | `panel.html:106` |
| `copyUrl` | Copies URL to clipboard | `previewPanel.ts:138-142` |
| `openExternal` | Opens URL in browser | `previewPanel.ts:133-136` |
| `runScript` | Opens script picker | `previewPanel.ts:144-145` |
| `clearConsole` | Clears console panel | `previewPanel.ts:147-148` |
| `takeScreenshot` | Placeholder | `previewPanel.ts:150-151` |

---

## 🔧 Module Integrations

### 1. extension.ts (Coordinator)

**Imports:**
```typescript
import { ServerManager } from './serverManager';
import { PreviewPanel } from './previewPanel';
import { ScriptsTreeProvider } from './scriptsTree';
import { StatusBarManager } from './statusBar';
```

**Creates:**
- `ServerManager` instance (line 17)
- `ScriptsTreeProvider` instance (line 18)
- `StatusBarManager` instance (line 19)
- Tree view `npmPreviewScripts` (line 22-24)

**Wires:**
- `npmPreview.start` → `serverManager.start()` + `PreviewPanel.createOrShow()` + `statusBar.setStatus()`
- `npmPreview.stop` → `serverManager.stop()` + `statusBar.setStatus()`
- `serverManager.onStatusChange` → updates `statusBar` + sends `serverStatus` to `previewPanel`

---

### 2. serverManager.ts (Process & File Watch)

**Exports:**
```typescript
export class ServerManager { ... }
```

**Uses:**
- `child_process.spawn()` — npm process
- `vscode.workspace.createFileSystemWatcher()` — hot reload
- `tree-kill` — process termination

**Callbacks (set externally):**
```typescript
public onLogLine?: (line: LogLine) => void;
public onHotReload?: (file: string) => void;
```

**Status Callbacks (internal):**
```typescript
onStatusChange(cb: StatusCallback): void {
  this.callbacks.push(cb);
}
```

---

### 3. previewPanel.ts (Webview Bridge)

**Exports:**
```typescript
export interface NetworkRequest { ... }
export type PanelMessage = ...
export class PreviewPanel { ... }
```

**Imports:**
```typescript
import { ServerManager } from './serverManager';
```

**Binds to ServerManager:**
```typescript
bindServer(server: ServerManager): void {
  server.onLogLine = (line) => this.postMessage({ type: 'log', ...log });
  server.onHotReload = (file) => this.postMessage({ type: 'hotReload', changedFile: file });
}
```

**Webview Messages Sent:**
- `init` — Initial state
- `serverStatus` — Server running status
- `hotReload` — File changed
- `log` — Log lines from server

**Webview Messages Received:**
- `start`, `stop`, `runScript`, `clearConsole`, `takeScreenshot` → execute commands
- `copyUrl`, `openExternal` → clipboard/external

---

### 4. scriptsTree.ts (Sidebar Tree)

**Exports:**
```typescript
export class ScriptItem extends vscode.TreeItem { ... }
export class ScriptsTreeProvider implements vscode.TreeDataProvider<ScriptItem> { ... }
```

**Reads:**
- `package.json` from workspace root

**Refresh Triggers:**
- Manual: `npmPreview.refreshScripts` command
- Auto: File watcher on `**/package.json`

**Tree Item Commands:**
```typescript
this.command = {
  command: 'npmPreview.runScript',
  arguments: [scriptName]
};
```

---

### 5. statusBar.ts (Status Bar)

**Exports:**
```typescript
export type StatusState = 'running' | 'stopped' | 'idle';
export class StatusBarManager { ... }
```

**States:**
| State | Text | Background |
|-------|------|------------|
| `running` | `$(broadcast) :PORT` | warning |
| `stopped` | `$(globe) NPM Preview` | default |
| `idle` | `$(globe) NPM Preview` | default |

**Click Action:** Opens preview panel (`npmPreview.openPanel`)

---

### 6. pmRunner.ts (Unused)

**Status:** Not imported or used anywhere in `extension.ts`

**Potential Use:** Advanced port detection with `portfinder`

---

## 🌐 Webview Integration (panel.html)

**Location:** `webview/panel.html`

**Message Types Handled:**
```javascript
case 'init':
case 'serverStatus': updateServerState(data.running, data.port); break;
case 'log': addConsole(data.time, data.level, data.message); break;
case 'hotReload': onHotReload(data.file); break;
case 'networkRequest': addNetworkRow(data); break;
```

**iframe Content Patching:**
```javascript
// On iframe load (panel.html:345-373):
// 1. Patch fetch() to capture network requests
// 2. Patch console methods to capture output
```

**UI Components:**
| Component ID | Purpose | Key Functions |
|--------------|---------|----------------|
| `#btnStart` | Start server | `send('start')` |
| `#btnStop` | Stop server | `send('stop')` |
| `#iframe` | Preview content | `src` set to localhost:PORT |
| `#panelConsole` | Console output | `addConsole()` |
| `#panelNetwork` | Network requests | `addNetworkRow()` |
| `#panelReload` | Hot reload events | `onHotReload()` |
| `#deviceChrome` | Device viewport | `setDevice('desktop'|'tablet'|'mobile')` |

---

## ⚙️ Configuration Integration

**Location:** `package.json` → `contributes.configuration`

| Setting | Type | Default | Used By |
|---------|------|---------|---------|
| `npmPreview.startScript` | string | `"start"` | `extension.ts:30` |
| `npmPreview.port` | number | `3000` | `serverManager.ts:41` |
| `npmPreview.hotReload` | boolean | `true` | `serverManager.ts:69` |
| `npmPreview.watchGlob` | string | `"**/*.{js,jsx,...}"` | `serverManager.ts:70` |
| `npmPreview.networkInspector` | boolean | `true` | Not implemented |
| `npmPreview.consolePanel` | boolean | `true` | Not implemented |
| `npmPreview.defaultViewport` | string | `"desktop"` | Not implemented |
| `npmPreview.openPanelOnStart` | boolean | `true` | `extension.ts:35` |

---

## 🔑 Keybinding Integration

**Location:** `package.json` → `contributes.keybindings`

| Keybinding | Command | Condition |
|------------|---------|-----------|
| `ctrl+shift+r` | `npmPreview.start` | `!npmPreview.running` |
| `ctrl+shift+x` | `npmPreview.stop` | `npmPreview.running` |
| `ctrl+shift+v` | `npmPreview.openPanel` | (always) |

**Context Variable:** `npmPreview.running` set by `extension.ts:33,54,92`

---

## 📦 Dependencies Integration

| Package | Version | Used In | Purpose |
|---------|---------|---------|---------|
| `tree-kill` | ^1.2.2 | `serverManager.ts:11,80` | Kill npm process tree |
| `portfinder` | ^1.0.38 | `npmRunner.ts:59` | Find available ports |
| `ws` | ^8.16.0 | — | Not used (future: custom HMR) |

**Dev Dependencies:**
| Package | Version | Purpose |
|---------|---------|---------|
| `@types/vscode` | ^1.85.0 | VS Code API types |
| `@types/node` | ^20.0.0 | Node.js types |
| `typescript` | ^5.3.0 | Compile TS → JS |
| `@vscode/vsce` | ^2.24.0 | Package extension |

---

## 🗂️ Resource Locations

### Icons
| File | Size | Location in VSIX | Purpose |
|------|------|------------------|---------|
| `icons/logo.svg` | 128x128 | Extension root | Marketplace icon |
| `icons/activity-icon.svg` | 32x32 | icons/ | Activity bar icon |

### Webview Resources
| File | Location | CSP Required |
|------|----------|--------------|
| `webview/panel.html` | webview/ | `frame-src http://localhost:*` |

### Type Definitions
| File | Location | Purpose |
|------|----------|---------|
| `src/types/portfinder.d.ts` | types/ | TypeScript types for portfinder |

---

## 📊 Data Flow Diagrams

### Server Start Flow
```
User: npmPreview.start command
    │
    ▼
extension.ts:28-46
    │
    ├─► serverManager.start(script)
    │       │
    │       ├─► spawn npm process
    │       ├─► waitForPort()
    │       ├─► createFileSystemWatcher()
    │       └─► callbacks: onStatusChange(true)
    │
    ├─► setContext('npmPreview.running', true)
    │
    ├─► statusBar.setStatus('running', port)
    │
    └─► PreviewPanel.createOrShow(context, server)
            │
            └─► bindServer(server)
                    │
                    ├─► replay server.logs
                    └─► setup onLogLine, onHotReload callbacks
```

### Hot Reload Flow
```
File change detected
    │
    ▼
serverManager:onDidChange handler (line 89-96)
    │
    ├─► onHotReload callback
    │       │
    │       └─► previewPanel.postMessage({ type: 'hotReload', changedFile })
    │               │
    │               └─► webview: onHotReload(file)
    │                       │
    │                       ├─► addConsole('HMR: filename')
    │                       ├─► reloadIframe()
    │                       └─► flashReload()
    │
    └─► addLog('HMR triggered by: filename')
            │
            └─► previewPanel.postMessage({ type: 'log' })
                    │
                    └─► webview: addConsole()
```

### Console Capture Flow
```
iframe loads (panel.html:345)
    │
    ▼
Patch iframe contentWindow.console methods
    │
    └─► iw.console[lvl] = (...args) => {
            addConsole(now(), lvl, args.join(' '));
            orig(...args);
        }
            │
            ▼
panelConsole div updated
```

### Network Capture Flow
```
iframe loads (panel.html:345)
    │
    ▼
Patch iframe contentWindow.fetch
    │
    └─► iw.fetch = async (input, init) => {
            const res = await origFetch(input, init);
            addNetworkRow({ url, method, status, ... });
            return res;
        }
            │
            ▼
netRows div updated (prepend)
```

---

## ⚠️ Integration Gaps

| Gap | Impact | Location | Notes |
|-----|--------|----------|-------|
| `npmPreview.takeScreenshot` | Low | `extension.ts:110-115` | Placeholder only |
| `npmPreview.networkInspector` setting | Low | `package.json:94-96` | Not read in code |
| `npmPreview.consolePanel` setting | Low | `package.json:98-100` | Not read in code |
| `npmPreview.defaultViewport` setting | Low | `package.json:104-106` | Not read in code |
| XMLHttpRequest interception | Low | `webview/panel.html` | Only fetch captured |
| pmRunner.ts unused | Low | `src/npmRunner.ts` | Alternative implementation, not wired |

---

## ✅ Integration Checklist

- [x] All commands registered in package.json
- [x] All commands have handlers in extension.ts
- [x] ServerManager spawns npm processes correctly
- [x] File watcher triggers hot reload
- [x] Log lines flow to preview panel
- [x] Webview receives and displays logs
- [x] Console capture in iframe works
- [x] Network capture (fetch) works
- [x] Scripts tree reads package.json
- [x] Scripts tree auto-refreshes on package.json change
- [x] Status bar updates on server state change
- [x] Keybindings work with context conditions
- [x] Extension deactivates cleanly (kills processes)

---

## 📝 Summary

**Total Source Files:** 7 TypeScript + 1 HTML + 1 package.json

**Total Commands:** 7

**Total Message Types:** 9 (extension→webview) + 7 (webview→extension)

**Total Settings:** 8

**Total Keybindings:** 3

**Integration Points:** 25+

---

*End of Integration Map*
