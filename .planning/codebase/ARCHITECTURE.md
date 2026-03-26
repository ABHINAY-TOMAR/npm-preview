# Architecture

**Analysis Date:** 2026-03-26

## Pattern Overview

**Overall:** VS Code Extension with WebView-based Preview

**Key Characteristics:**
- Main extension in TypeScript compiled to `out/`
- WebView panel (`panel.html`) provides UI with iframe preview
- ServerManager spawns npm child process for dev server
- Communication via VS Code WebView messaging API
- Tree view for sidebar script listing
- Status bar for global server status

## Layers

**Extension Host (VS Code):**
- Purpose: Main extension runtime, registers commands and views
- Location: `src/extension.ts`
- Contains: Command registration, tree view setup, welcome message
- Depends on: ServerManager, PreviewPanel, ScriptsTree, StatusBar
- Used by: VS Code activation events

**Server Management:**
- Purpose: Spawn npm script process, detect framework/port, file watching
- Location: `src/serverManager.ts`
- Contains: Child process management, port detection, hot reload triggers
- Depends on: VS Code API, fs, child_process, tree-kill
- Used by: extension.ts, PreviewPanel

**Preview Panel (WebView):**
- Purpose: Main UI with iframe preview, console, network inspector
- Location: `webview/panel.html`, `src/previewPanel.ts`
- Contains: WebviewPanel management, message handling, UI HTML
- Depends on: VS Code WebView API
- Used by: extension.ts

**Status Bar:**
- Purpose: Global server status indicator
- Location: `src/statusBar.ts`
- Contains: StatusBarItem management
- Depends on: VS Code API
- Used by: extension.ts

**Scripts Tree (Sidebar):**
- Purpose: Display npm scripts from package.json
- Location: `src/scriptsTree.ts`
- Contains: TreeDataProvider implementation
- Depends on: VS Code API, fs
- Used by: extension.ts

## Data Flow

**Server Start Flow:**

1. User invokes `npmPreview.start` command
2. `extension.ts` calls `serverManager.start(script)`
3. `ServerManager` spawns `npm run <script>` child process
4. Stdout/stderr captured, port auto-detected from output
5. Waits for port to be available (30s timeout)
6. On success: Sets running state, notifies callbacks
7. `extension.ts` updates status bar, opens preview panel
8. `PreviewPanel` receives `init` message with port

**Hot Reload Flow:**

1. `ServerManager.startWatcher()` creates FileSystemWatcher
2. File change detected in watched glob pattern
3. `onHotReload` callback fired with file path
4. `PreviewPanel` posts `hotReload` message to webview
5. Webview JavaScript reloads iframe

**WebView Messaging:**

1. Extension → Webview: `postMessage()` with typed `PanelMessage`
2. Webview → Extension: `vscode.postMessage()` with command strings
3. Commands handled: `start`, `stop`, `openExternal`, `copyUrl`, `runScript`, `clearConsole`, `takeScreenshot`

## Key Abstractions

**ServerManager Class:**
- Purpose: Manages the npm child process lifecycle
- Location: `src/serverManager.ts`
- Pattern: Event emitter via callback array
- Key methods: `start()`, `stop()`, `onStatusChange()`, `onLogLine`, `onHotReload`

**PreviewPanel Class:**
- Purpose: Manages the WebViewPanel singleton
- Location: `src/previewPanel.ts`
- Pattern: Static singleton (`currentPanel`)
- Key methods: `createOrShow()`, `postMessage()`, `bindServer()`

**ScriptsTreeProvider Class:**
- Purpose: Provides tree data for VS Code sidebar
- Location: `src/scriptsTree.ts`
- Pattern: VS Code TreeDataProvider interface
- Key methods: `getChildren()`, `refresh()`, `getScriptNames()`

**StatusBarManager Class:**
- Purpose: Manages status bar item state
- Location: `src/statusBar.ts`
- Pattern: Simple state machine
- States: `running`, `stopped`, `idle`

## Entry Points

**Extension Activation:**
- Location: `src/extension.ts:16` - `export function activate(context)`
- Triggers: `workspaceContains:package.json` activation event
- Responsibilities: Register all commands, create tree view, show welcome message

**Extension Deactivation:**
- Location: `src/extension.ts:202` - `export function deactivate()`
- Responsibilities: Stop server, dispose status bar

## Error Handling

**Strategy:** Try-catch with user-friendly error messages

**Patterns:**
- Server start errors: Show detailed suggestions based on framework detection
- Script not found: Offer alternative script suggestions
- Port timeout: Provide troubleshooting tips
- File system errors: Gracefully degrade (empty scripts list)

## Cross-Cutting Concerns

**Logging:** Server output captured and sent to PreviewPanel as `LogLine` objects

**Validation:** 
- Checks workspace folder exists before starting
- Validates package.json exists
- Validates script exists in package.json

**Authentication:** Not applicable (local npm script execution)

---

*Architecture analysis: 2026-03-26*
