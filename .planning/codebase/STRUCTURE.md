# Codebase Structure

**Analysis Date:** 2026-03-26

## Directory Layout

```
npm-preview-extension/
├── src/                    # TypeScript source files
│   ├── extension.ts        # Main entry point
│   ├── serverManager.ts    # NPM process management
│   ├── previewPanel.ts      # WebView panel
│   ├── statusBar.ts         # Status bar manager
│   ├── scriptsTree.ts      # Sidebar tree provider
│   ├── pmRunner.ts         # (unused/missing)
│   └── types/
│       └── portfinder.d.ts # Type declarations
├── webview/
│   └── panel.html          # WebView HTML/CSS/JS
├── icons/
│   ├── activity-icon.svg   # Activity bar icon
│   └── logo.svg            # Extension logo
├── out/                    # Compiled JavaScript output
├── package.json            # Extension manifest
├── tsconfig.json          # TypeScript configuration
└── .vscodeignore          # Files excluded from package
```

## Directory Purposes

**`src/`:**
- Purpose: All TypeScript source code
- Contains: Extension entry point, managers, providers
- Key files: `extension.ts`, `serverManager.ts`, `previewPanel.ts`

**`webview/`:**
- Purpose: WebView content for preview panel
- Contains: `panel.html` (standalone HTML with embedded CSS/JS)
- Note: No separate JS/CSS files - all inlined in HTML

**`icons/`:**
- Purpose: Extension icon assets
- Contains: SVG icons (activity-bar, logo)

**`out/`:**
- Purpose: Compiled JavaScript output
- Generated: Yes (by `npm run compile`)
- Contains: Compiled `.js` and `.js.map` files

## Key File Locations

**Entry Points:**
- `src/extension.ts`: Main extension activation/deactivation

**Configuration:**
- `package.json`: Extension manifest with commands, views, keybindings, settings
- `tsconfig.json`: TypeScript compilation settings

**Core Logic:**
- `src/serverManager.ts`: NPM script execution and process management
- `src/previewPanel.ts`: WebView panel management
- `src/statusBar.ts`: VS Code status bar integration
- `src/scriptsTree.ts`: Sidebar tree view for npm scripts

**UI/View:**
- `webview/panel.html`: Complete WebView with toolbar, preview iframe, panels

## Naming Conventions

**Files:**
- PascalCase: `serverManager.ts`, `previewPanel.ts`, `scriptsTree.ts`
- kebab-case: Not used in source
- Descriptive nouns: `extension.ts`, `statusBar.ts`

**Directories:**
- lowercase: `src/`, `webview/`, `icons/`, `out/`

**TypeScript Classes:**
- PascalCase: `ServerManager`, `PreviewPanel`, `StatusBarManager`, `ScriptsTreeProvider`

**Commands:**
- dot notation with `npmPreview` prefix: `npmPreview.start`, `npmPreview.stop`

**Settings:**
- dot notation with `npmPreview` prefix: `npmPreview.port`, `npmPreview.hotReload`

## Where to Add New Code

**New Command:**
1. Add command definition in `package.json` `contributes.commands`
2. Add keybinding in `package.json` `contributes.keybindings` (optional)
3. Register handler in `src/extension.ts` `activate()` function

**New Configuration Setting:**
1. Add property in `package.json` `contributes.configuration.properties`

**New Tree View:**
1. Add view definition in `package.json` `contributes.views`
2. Create TreeDataProvider class like `ScriptsTreeProvider`
3. Register in `extension.ts`

**New WebView Panel:**
1. Extend `PreviewPanel` class or create new WebviewPanel
2. Add message types to `PanelMessage` union type
3. Handle in `handleMessage()` switch statement

**New Status Indicator:**
1. Add state to `StatusState` type in `src/statusBar.ts`
2. Handle in `setStatus()` switch statement

## Special Directories

**`.vscodeignore`:**
- Purpose: Specifies files excluded when packaging extension
- Generated: No (manually maintained)
- Committed: Yes
- Key exclusions: `src/` (source), `node_modules/`, `.git/`

**`node_modules/`:**
- Purpose: npm dependencies for development
- Generated: Yes (by `npm install`)
- Committed: No (in `.gitignore`)

**`out/`:**
- Purpose: Compiled JavaScript output
- Generated: Yes (by `npm run compile`)
- Committed: Yes (required for extension to run)

## WebView Architecture

**Message Types (extension → webview):**
```typescript
type PanelMessage =
  | { type: 'serverStarted'; url: string; script: string; port: number }
  | { type: 'serverStopped' }
  | { type: 'hotReload'; changedFile?: string }
  | { type: 'consoleLog'; level: 'log' | 'warn' | 'error' | 'info'; args: string[]; timestamp: number }
  | { type: 'networkRequest'; request: NetworkRequest }
  | { type: 'clearConsole' }
  | { type: 'log'; time: string; level: 'log' | 'warn' | 'error' | 'info'; message: string }
  | { type: 'init'; running: boolean; port: number }
  | { type: 'serverStatus'; running: boolean; port: number }
```

**Commands (webview → extension):**
- `start` - Start server
- `stop` - Stop server
- `openExternal` - Open URL in external browser
- `copyUrl` - Copy URL to clipboard
- `runScript` - Open script selector
- `clearConsole` - Clear console panel
- `takeScreenshot` - Placeholder for future feature

---

*Structure analysis: 2026-03-26*
