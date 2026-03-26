# NPM Preview Extension - Complete Codebase Map

**Analysis Date:** 2026-03-26

---

## Extension Overview

| Property | Value |
|----------|-------|
| **Name** | npm-preview |
| **Version** | 1.0.1 |
| **Publisher** | ABHINAY-TOMAR |
| **Engine** | VS Code ^1.85.0 |
| **Repository** | https://github.com/ABHINAY-TOMAR/npm-preview |

---

## Complete File Tree

```
npm-preview-extension/
├── src/
│   ├── extension.ts          # Main entry point (205 lines)
│   ├── serverManager.ts      # NPM process management (264 lines)
│   ├── previewPanel.ts       # WebView panel controller (240 lines)
│   ├── statusBar.ts          # Status bar manager (62 lines)
│   ├── scriptsTree.ts        # Sidebar tree provider (53 lines)
│   ├── pmRunner.ts           # NOT PRESENT (see note below)
│   └── types/
│       └── portfinder.d.ts   # Type declarations for portfinder
├── webview/
│   └── panel.html            # WebView UI (376 lines - full HTML/CSS/JS)
├── icons/
│   ├── activity-icon.svg     # Activity bar icon (32x32 SVG)
│   └── logo.svg              # Extension logo (128x128 SVG)
├── out/                      # Compiled output (auto-generated)
│   ├── extension.js
│   ├── extension.js.map
│   ├── serverManager.js
│   ├── serverManager.js.map
│   ├── previewPanel.js
│   ├── previewPanel.js.map
│   ├── statusBar.js
│   ├── statusBar.js.map
│   ├── scriptsTree.js
│   ├── scriptsTree.js.map
│   ├── pmRunner.js           # Empty/not generated
│   └── pmRunner.js.map
├── package.json              # Extension manifest
├── package-lock.json         # Dependency lock file
├── tsconfig.json             # TypeScript configuration
├── .vscodeignore            # Files excluded from package
├── README.md                 # Documentation
├── LICENSE                  # MIT license
├── .gitignore
└── .git/                   # Git repository

test-project/                 # Test project for extension
├── package.json
├── package-lock.json
├── src/
│   ├── main.ts
│   └── style.css
├── vite.config.ts
├── tsconfig.json
└── index.html
```

**Note:** `src/pmRunner.ts` is referenced in `tsconfig.json` but the file doesn't exist. The `out/pmRunner.js` files are empty placeholders.

---

## Entry Points and Main Classes

### `src/extension.ts` (Main Entry)

```typescript
export function activate(context: vscode.ExtensionContext)  // Line 16
export function deactivate(): void                        // Line 202
```

**Responsibilities:**
- Registers all VS Code commands
- Creates tree view in sidebar
- Manages preview panel instance
- Handles welcome message on first run
- Sets up package.json file watcher for auto-refresh

**Key Instances:**
- `serverManager: ServerManager` - NPM process management
- `previewPanel: PreviewPanel | undefined` - WebView singleton
- `statusBar: StatusBarManager` - Status bar item
- `scriptsTree: ScriptsTreeProvider` - Sidebar tree data

---

### `src/serverManager.ts` - ServerManager Class

```typescript
class ServerManager {
  process: cp.ChildProcess | undefined
  port: number                              // Current port (readable)
  running: boolean                           // Running state (readable)
  logs: LogLine[]                           // Captured logs (readable)
  
  start(script: string): Promise<void>      // Start npm script
  stop(): Promise<void>                     // Stop server
  onStatusChange(cb: StatusCallback): void   // Register status callback
  onLogLine?: (line: LogLine) => void       // Log event callback
  onHotReload?: (file: string) => void      // Hot reload callback
}
```

**Key Features:**
- Auto-detects framework from package.json dependencies
- Auto-detects port from server output (30+ regex patterns)
- File watching for hot reload triggers
- Graceful process termination with tree-kill

**Framework Detection (`FRAMEWORK_PORTS`):**
```typescript
const FRAMEWORK_PORTS = {
  next:      { port: 3000, script: 'dev' },
  nuxt:      { port: 3000, script: 'dev' },
  vite:      { port: 5173, script: 'dev' },
  webpack:   { port: 8080, script: 'start' },
  parcel:    { port: 1234, script: 'start' },
  remix:     { port: 3000, script: 'dev' },
  astro:     { port: 4321, script: 'dev' },
  'svelte-kit': { port: 5173, script: 'dev' },
}
```

---

### `src/previewPanel.ts` - PreviewPanel Class

```typescript
class PreviewPanel {
  static currentPanel: PreviewPanel | undefined  // Singleton
  private panel: vscode.WebviewPanel
  private boundServer: ServerManager | undefined
  
  static createOrShow(ctx, server): PreviewPanel
  bindServer(server: ServerManager): void
  postMessage(msg: PanelMessage): void
  dispose(): void
}
```

**PanelMessage Types:**
```typescript
type PanelMessage =
  | { type: 'serverStarted'; url: string; script: string; port: number }
  | { type: 'serverStopped' }
  | { type: 'hotReload'; changedFile?: string }
  | { type: 'consoleLog'; level: string; args: string[]; timestamp: number }
  | { type: 'networkRequest'; request: NetworkRequest }
  | { type: 'clearConsole' }
  | { type: 'log'; time: string; level: string; message: string }
  | { type: 'init'; running: boolean; port: number }
  | { type: 'serverStatus'; running: boolean; port: number }
```

---

### `src/statusBar.ts` - StatusBarManager Class

```typescript
class StatusBarManager {
  item: vscode.StatusBarItem
  currentState: StatusState
  currentPort?: number
  
  setStatus(state: StatusState, port?: number): void
  getStatus(): { state: StatusState; port?: number }
  dispose(): void
}

type StatusState = 'running' | 'stopped' | 'idle'
```

---

### `src/scriptsTree.ts` - ScriptsTreeProvider Class

```typescript
class ScriptsTreeProvider implements vscode.TreeDataProvider<ScriptItem> {
  refresh(): void
  getTreeItem(element: ScriptItem): TreeItem
  getChildren(): Promise<ScriptItem[]>
  getScriptNames(): Promise<string[]>
}

class ScriptItem extends vscode.TreeItem {
  scriptName: string
  scriptCmd: string
}
```

---

## UI Components and Their Locations

### WebView Panel (`webview/panel.html`)

**Structure:**
```
panel.html
├── CSS Variables (:root)
├── Styles (lines 10-99)
│   ├── Toolbar styles
│   ├── Preview area styles
│   ├── Device chrome styles (desktop/tablet/mobile)
│   ├── Bottom tabs styles
│   └── Console/Network/HotReload panel styles
├── HTML Structure (lines 101-183)
│   ├── .toolbar - Buttons and URL bar
│   ├── .preview-area - iframe container
│   ├── .btabs - Bottom tab navigation
│   ├── .panels - Console/Network/HotReload panels
│   └── .statusbar - Bottom status bar
└── JavaScript (lines 184-374)
    ├── State variables
    ├── Message handler (from extension)
    ├── Server state update function
    ├── Console/log functions
    ├── Network panel functions
    ├── Hot reload handler
    └── Utility functions
```

**UI Elements:**

| Element ID | Type | Purpose |
|------------|------|---------|
| `#btnStart` | Button | Start server |
| `#btnStop` | Button | Stop server |
| `#urlText` | Span | Display current URL |
| `#dot` | Div | Live indicator dot |
| `#iframe` | Iframe | App preview |
| `#devDesktop/Tablet/Mobile` | Buttons | Viewport switcher |
| `#hmrBtn` | Button | Toggle hot reload |
| `#panelConsole` | Div | Console log output |
| `#panelNetwork` | Div | Network requests table |
| `#panelReload` | Div | Hot reload events |
| `#slive` | Span | Status bar live indicator |

---

### Activity Bar / Sidebar

**Activity Bar Container:**
- ID: `npm-preview`
- Icon: `icons/activity-icon.svg`
- Registered in: `package.json` `contributes.viewsContainers.activitybar`

**Sidebar Tree View:**
- ID: `npmPreviewScripts`
- Type: Tree view
- Provider: `ScriptsTreeProvider`
- Registered in: `package.json` `contributes.views.npm-preview`

---

## Asset Locations

### Icons

| File | Path | Size | Usage |
|------|------|------|-------|
| `activity-icon.svg` | `icons/activity-icon.svg` | 32x32 | Activity bar icon |
| `logo.svg` | `icons/logo.svg` | 128x128 | Extension marketplace logo |

**activity-icon.svg:**
```svg
<svg viewBox="0 0 32 32">
  <circle cx="16" cy="16" r="9" stroke="#00ffa3"/>
  <circle cx="16" cy="16" r="4" fill="#00ffa3"/>
  <path d="M16 5v4M16 23v4M5 16h4M23 16h4" stroke="#00ffa3"/>
</svg>
```

**logo.svg:**
```svg
<svg viewBox="0 0 128 128">
  <circle cx="64" cy="64" r="36" stroke="#00ffa3"/>
  <circle cx="64" cy="64" r="14" fill="#00ffa3"/>
  <path d="M64 20v12..."/>
</svg>
```

---

## Configuration and Build Setup

### `package.json` - Extension Manifest

**Build Scripts:**
```json
{
  "scripts": {
    "compile": "tsc -p ./",
    "watch": "tsc -watch -p ./",
    "package": "vsce package",
    "publish": "vsce publish"
  }
}
```

**Dependencies:**
```json
{
  "dependencies": {
    "portfinder": "^1.0.38",
    "tree-kill": "^1.2.2",
    "ws": "^8.16.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/vscode": "^1.85.0",
    "@types/ws": "^8.18.1",
    "@vscode/vsce": "^2.24.0",
    "typescript": "^5.3.0"
  }
}
```

---

### `tsconfig.json` - TypeScript Configuration

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "target": "ES2020",
    "outDir": "./out",
    "rootDir": "./src",
    "lib": ["ES2020"],
    "strict": true,
    "esModuleInterop": true,
    "sourceMap": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", ".vscode-test"]
}
```

---

### Configuration Settings (`package.json` contributes)

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `npmPreview.startScript` | string | `"start"` | Default npm script |
| `npmPreview.port` | number | `3000` | Dev server port |
| `npmPreview.hotReload` | boolean | `true` | Enable hot reload |
| `npmPreview.watchGlob` | string | `**/*.{js,jsx,ts,tsx,css,html,vue,svelte}` | Watch pattern |
| `npmPreview.networkInspector` | boolean | `true` | Network tracking |
| `npmPreview.consolePanel` | boolean | `true` | Console capture |
| `npmPreview.defaultViewport` | string | `"desktop"` | Default viewport |
| `npmPreview.openPanelOnStart` | boolean | `true` | Auto-open panel |

---

## Command Structure

### Registered Commands

| Command ID | Title | Icon | Keybinding | Handler Location |
|------------|-------|------|------------|------------------|
| `npmPreview.start` | NPM Preview: Start | `$(play)` | `Ctrl+Shift+R` | `extension.ts:46` |
| `npmPreview.stop` | NPM Preview: Stop | `$(debug-stop)` | `Ctrl+Shift+X` | `extension.ts:88` |
| `npmPreview.openPanel` | NPM Preview: Open Panel | `$(browser)` | `Ctrl+Shift+V` | `extension.ts:103` |
| `npmPreview.runScript` | NPM Preview: Run Script | - | - | `extension.ts:116` |
| `npmPreview.clearConsole` | NPM Preview: Clear Console | - | - | `extension.ts:166` |
| `npmPreview.refreshScripts` | NPM Preview: Refresh Scripts | - | - | `extension.ts:182` |
| `npmPreview.takeScreenshot` | NPM Preview: Take Screenshot | - | - | `extension.ts:173` (placeholder) |

### Keybindings

| Key | Mac Key | Command | When Condition |
|-----|---------|---------|----------------|
| `Ctrl+Shift+R` | `Cmd+Shift+R` | `npmPreview.start` | `!npmPreview.running` |
| `Ctrl+Shift+X` | `Cmd+Shift+X` | `npmPreview.stop` | `npmPreview.running` |
| `Ctrl+Shift+V` | `Cmd+Shift+V` | `npmPreview.openPanel` | (always) |

### Command Execution Flow

```
User triggers command
        │
        ▼
extension.ts registers handler
        │
        ▼
Handler executes logic
        │
        ├── Updates ServerManager
        │         │
        │         ▼
        │   Spawns npm process
        │         │
        │         ▼
        │   Detects port/framework
        │         │
        │         ▼
        │   Sets running state ──────► StatusBarManager
        │                             │
        └── Opens PreviewPanel ────────► PreviewPanel
                                          │
                                          ▼
                                    Posts 'init' message
                                          │
                                          ▼
                                    WebView updates UI
```

---

## Views and ViewContainers

### Views Containers (`contributes.viewsContainers`)

```json
{
  "activitybar": [
    {
      "id": "npm-preview",
      "title": "NPM Preview",
      "icon": "icons/activity-icon.svg"
    }
  ]
}
```

### Views (`contributes.views`)

```json
{
  "npm-preview": [
    {
      "id": "npmPreviewScripts",
      "name": "Scripts",
      "type": "tree"
    }
  ]
}
```

---

## Type Definitions

### `src/types/portfinder.d.ts`

Custom type declaration for the `portfinder` module (used but not imported in code):

```typescript
declare module 'portfinder' {
  interface PortFinderOptions {
    port?: number;
    host?: string;
    stopPort?: number;
  }
  interface PortFinder {
    getPort(options: PortFinderOptions, callback: (err, port) => void): void;
  }
  const portfinder: PortFinder;
  export = portfinder;
}
```

**Note:** The `portfinder` package is listed in dependencies but not actually used in the code. Port detection is implemented manually in `serverManager.ts`.

---

## Context Variables

Set dynamically during runtime:

| Variable | Type | Set When | Used For |
|----------|------|----------|----------|
| `npmPreview.running` | boolean | Server start/stop | Keybinding conditions |

---

*Complete codebase map: 2026-03-26*
