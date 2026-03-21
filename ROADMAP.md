# NPM Preview — Full Build Roadmap & Resource List

## What Is This?
A cross-IDE extension that runs any `npm` script and opens the app preview **inside the editor** as a panel tab — with hot reload, a network inspector, a console panel, and a device/viewport simulator. Inspired by Live Server, built for the npm ecosystem.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│  IDE Extension Host (Node.js)                           │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │ extension.ts│  │ServerManager │  │ ScriptsTree    │  │
│  │ (commands,  │──│ (spawn npm,  │  │ (sidebar UI,   │  │
│  │  keybinds,  │  │  fs watcher, │  │  package.json  │  │
│  │  status bar)│  │  kill, logs) │  │  reader)       │  │
│  └──────┬──────┘  └──────┬───────┘  └────────────────┘  │
│         │                │                              │
│  ┌──────▼────────────────▼───────────────────────────┐  │
│  │  PreviewPanel (WebviewPanel)                      │  │
│  │  ┌─────────────────────────────────────────────┐  │  │
│  │  │  webview/panel.html  (vanilla JS + CSS)     │  │  │
│  │  │  ┌───────────┐  ┌──────────┐  ┌──────────┐  │  │  │
│  │  │  │  Toolbar  │  │  iframe  │  │  Panels  │  │  │  │
│  │  │  │ Run/Stop  │  │ :3000    │  │ Console  │  │  │  │
│  │  │  │ URL bar   │  │ preview  │  │ Network  │  │  │  │
│  │  │  │ Viewports │  │          │  │ HMR log  │  │  │  │
│  │  │  └───────────┘  └──────────┘  └──────────┘  │  │  │
│  │  └─────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
         │
         ▼ localhost:PORT
    Dev Server (React / Vue / Svelte / Next / Vite / etc.)
```

---

## Build Phases

### Phase 1 — Scaffold & Core (Week 1)
**Goal:** Extension runs, opens a panel, shows iframe.

- [ ] Init project: `npm init`, install `@types/vscode`, `typescript`, `@vscode/vsce`
- [ ] Write `tsconfig.json` targeting CommonJS/ES2020
- [ ] `extension.ts` — activate/deactivate, register `npmPreview.start` command
- [ ] `ServerManager` — spawn child process, kill with `tree-kill`
- [ ] `PreviewPanel` — create WebviewPanel, load basic HTML with `<iframe>`
- [ ] Test on a CRA / Vite project
- [ ] Add `package.json` contributes: commands, keybindings, activation events
- [ ] Run `vsce package` to produce `.vsix`

**Deliverable:** `npm run start` opens a blank preview panel showing localhost.

---

### Phase 2 — Hot Reload (Week 2)
**Goal:** Saving any watched file refreshes the preview instantly.

- [ ] Add `vscode.workspace.createFileSystemWatcher(glob)` in `ServerManager`
- [ ] On `onDidChange` / `onDidCreate` → post `hotReload` message to webview
- [ ] Webview reloads iframe: `iframe.src = iframe.src`
- [ ] Flash animation overlay to give visual confirmation of reload
- [ ] CSS-only injection: detect `.css` changes → inject new `<link>` without full reload
- [ ] Add "Hot Reload" panel listing all reload events with timestamps & filetype badges
- [ ] Add setting: `npmPreview.watchGlob` to control watched files
- [ ] Add toggle button in toolbar (HMR ON/OFF)

**Deliverable:** Save any `.jsx`/`.css`/`.html` → preview updates in < 200ms.

---

### Phase 3 — Console Panel (Week 2–3)
**Goal:** `console.log/warn/error` from the iframe appear in the IDE panel.

- [ ] On iframe `load` event: patch `window.console` methods inside the iframe
- [ ] Send patched output via `postMessage` to the webview
- [ ] Render lines with level-based color coding (log/warn/error/info)
- [ ] Show timestamp for every line
- [ ] Add error count badge on tab
- [ ] Add "Clear" button
- [ ] Handle cross-origin iframes gracefully (show notice when patching fails)

**Deliverable:** Console output from the running app appears inline in the IDE.

---

### Phase 4 — Network Inspector (Week 3)
**Goal:** See all HTTP requests made by the app in a table inside the IDE.

- [ ] Patch `window.fetch` and `XMLHttpRequest` inside the iframe
- [ ] Capture: URL, method, status, response time, content-type, response size
- [ ] Render in a sortable table: #, Status (color coded), URL, Method, Type, Size, Time
- [ ] Highlight 4xx/5xx rows in red, 3xx in yellow
- [ ] Add request count badge on tab
- [ ] Add filter bar (filter by status, method, URL substring)
- [ ] Add "Clear" button

**Deliverable:** Every fetch/XHR call shows up in the Network panel with timing info.

---

### Phase 5 — Viewport Simulator (Week 3–4)
**Goal:** Preview the app at desktop / tablet / mobile widths with a device chrome.

- [ ] Three preset viewport sizes: Desktop (full width), Tablet (480px), Mobile (300px)
- [ ] Wrap iframe in a CSS "device chrome" div that resizes on toggle
- [ ] Smooth CSS transition between sizes
- [ ] Persist viewport choice to workspace state
- [ ] Add custom width/height input for arbitrary viewports
- [ ] Add orientation toggle (portrait ↔ landscape) for tablet/mobile

**Deliverable:** One-click switching between device viewports with accurate chrome UI.

---

### Phase 6 — Scripts Tree & UX Polish (Week 4)
**Goal:** Full sidebar with all npm scripts, status bar, notifications.

- [ ] `ScriptsTreeProvider` reads `package.json` and lists all scripts
- [ ] Clicking a script runs it (prompts if one is already running)
- [ ] Status bar item: shows port when live, grayed out when stopped
- [ ] File-change watcher also refreshes the scripts list when `package.json` changes
- [ ] Port conflict detection with friendly error + "try another port" prompt
- [ ] Auto-detect dev server port from stdout (regex match `localhost:XXXX`)
- [ ] Settings page: `startScript`, `port`, `hotReload`, `watchGlob`, `defaultViewport`
- [ ] Keybindings: Ctrl+Shift+P (start), Ctrl+Shift+S (stop), Ctrl+Shift+V (open panel)

**Deliverable:** Complete, polished extension ready for testing.

---

### Phase 7 — Cross-IDE & Publishing (Week 5)
**Goal:** Package for VS Code marketplace; lay groundwork for JetBrains.

**VS Code:**
- [ ] Write marketplace description, screenshots, demo GIF
- [ ] Add `icon.png` (128x128), fill all `package.json` metadata
- [ ] `vsce package` → `npm-preview-1.0.0.vsix`
- [ ] `vsce publish` to VS Code Marketplace

**JetBrains (separate project):**
- [ ] Init IntelliJ Platform Plugin project (Kotlin + Gradle)
- [ ] Use `JBCefBrowser` component as the iframe equivalent
- [ ] Implement `ToolWindowFactory` for the preview panel
- [ ] Use `ProcessHandlerKt` to spawn npm scripts
- [ ] Use `VirtualFileListener` for file watch / hot reload
- [ ] Publish to JetBrains Marketplace

---

## File Structure

```
npm-preview-extension/
├── src/
│   ├── extension.ts         # Entry point, command registration
│   ├── serverManager.ts     # Child process, file watcher, log streaming
│   ├── previewPanel.ts      # WebviewPanel lifecycle, message bridge
│   └── scriptsTree.ts       # Sidebar tree: reads package.json scripts
├── webview/
│   └── panel.html           # Full preview UI (toolbar, iframe, panels)
├── icons/
│   ├── logo.png             # Extension icon (128x128)
│   └── activity-icon.svg    # Activity bar icon
├── package.json             # Extension manifest + contributes
├── tsconfig.json            # TypeScript config
└── ROADMAP.md               # This file
```

---

## Key Dependencies

| Package | Role |
|---|---|
| `@types/vscode` | VS Code API type definitions |
| `typescript` | Compile TS → JS |
| `@vscode/vsce` | Package and publish the extension |
| `tree-kill` | Kill the npm process AND all child processes |
| `ws` | WebSocket (optional: for custom HMR bridge) |

---

## Resources

### VS Code Extension Development
- [VS Code Extension API](https://code.visualstudio.com/api) — official docs, start here
- [WebviewPanel API](https://code.visualstudio.com/api/extension-guides/webview) — iframe/webview guide
- [vscode-extension-samples](https://github.com/microsoft/vscode-extension-samples) — official samples repo
- [Your First Extension](https://code.visualstudio.com/api/get-started/your-first-extension) — quick start

### Process Management
- [Node.js child_process](https://nodejs.org/api/child_process.html) — `spawn`, `exec` docs
- [tree-kill npm](https://www.npmjs.com/package/tree-kill) — reliably kill process trees
- [cross-spawn](https://www.npmjs.com/package/cross-spawn) — Windows-compatible spawn

### File Watching
- [vscode.workspace.createFileSystemWatcher](https://code.visualstudio.com/api/references/vscode-api#workspace.createFileSystemWatcher)
- [chokidar](https://github.com/paulmillr/chokidar) — alternative file watcher (outside vscode API)

### Webview / UI
- [Content Security Policy for Webviews](https://code.visualstudio.com/api/extension-guides/webview#content-security-policy)
- [postMessage API](https://code.visualstudio.com/api/extension-guides/webview#passing-messages-from-an-extension-to-a-webview)
- [JetBrains Mono font](https://fonts.google.com/specimen/JetBrains+Mono) — IDE-native monospace

### Publishing
- [vsce CLI](https://github.com/microsoft/vscode-vsce) — VS Code Extension manager
- [VS Code Marketplace Publisher](https://marketplace.visualstudio.com/manage)
- [Extension Manifest reference](https://code.visualstudio.com/api/references/extension-manifest)

### JetBrains (future)
- [IntelliJ Platform SDK](https://plugins.jetbrains.com/docs/intellij/welcome.html)
- [JBCefBrowser](https://plugins.jetbrains.com/docs/intellij/jcef.html) — embedded browser component
- [Tool Windows](https://plugins.jetbrains.com/docs/intellij/tool-windows.html)
- [JetBrains Marketplace](https://plugins.jetbrains.com/)

---

## Enhancement Ideas (Post-MVP)

- **Error overlay** — display compile errors directly in the preview pane
- **Screenshot** — capture the current viewport as a PNG
- **Multi-port** — run and tab-switch between multiple npm scripts simultaneously
- **Tunnel** — one-click ngrok/localtunnel to share preview URL
- **Theme sync** — match preview background to the IDE color theme
- **Performance panel** — CPU/memory usage of the node process
- **PWA audit** — Lighthouse-style checks on the running app
 token = ovsxat_6135c347-1d55-4ce2-b65c-da97a1f5a22c