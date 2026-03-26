# npm-preview Project Summary

**Project:** npm-preview VS Code Extension  
**Version:** 1.0.1 → 1.1.0  
**Goal:** Complete missing functionality and publish to VS Code Marketplace  
**Last Updated:** 2026-03-26

---

## Executive Summary

The npm-preview extension is a mature, production-ready VS Code extension that enables developers to run npm scripts and preview web applications directly within VS Code. It provides hot reload, console capture, network inspection, and device viewport simulation in a unified interface.

**Current State:** Core features are implemented (v1.0.1), but the project has dead code, missing features, and no automated tests. The roadmap addresses these gaps for a polished v1.1.0 release.

**Key Findings:**
- Architecture is well-designed with clear separation of concerns (ServerManager, PreviewPanel, ScriptsTree, StatusBar)
- Screenshot feature is the highest-priority missing feature (placeholder exists but unimplemented)
- Dead code (npmRunner.ts) and unused dependencies need cleanup before release
- Cross-origin iframe limitation is documented but unavoidable (browser security)

---

## Technical Decisions

### Stack

| Technology | Version | Purpose | Rationale |
|------------|---------|---------|-----------|
| VS Code API | ^1.85.0 | Extension framework | Minimum version for all extension features |
| TypeScript | ^5.3.0 | Language | Type safety, better IDE support |
| Node.js | 18+ | Runtime | For running npm scripts |
| @vscode/vsce | ^2.24.0 | Packaging | Official VS Code extension packager |
| tree-kill | ^1.2.2 | Process termination | Gracefully kill npm with children |

### Unused Dependencies (to review)
- `ws` ^8.16.0 - Listed but not imported
- `portfinder` ^1.0.38 - Listed but manual implementation used instead

### Screenshot Implementation Decision
**Recommended:** Use html2canvas in webview, communicate via postMessage, save with VS Code file APIs.

**Why not Puppeteer/Playwright:** 300MB vs 40KB - over-engineered for this use case.

---

## Implementation Strategy

### Current Architecture

```
VS Code Extension Host
├── extension.ts (Entry point)
├── ServerManager (npm process management)
├── PreviewPanel (WebView controller)
├── StatusBarManager (Server status)
└── ScriptsTreeProvider (Sidebar tree)

WebView (panel.html)
├── Toolbar (start/stop, viewport buttons)
├── iframe (App preview)
└── Bottom panels (Console, Network, HotReload)
```

### Data Flow

1. **Start Server:** User → Command → extension.ts → ServerManager.spawn() → Port detection → PreviewPanel opens → WebView loads iframe
2. **Hot Reload:** FileSystemWatcher → ServerManager.onHotReload → PreviewPanel.postMessage → WebView reloads iframe
3. **Console/Network:** Injected JS in iframe → postMessage to WebView → Display in panels

---

## What's Been Done

### Core Features (Complete ✅)

| Feature | File | Status |
|---------|------|--------|
| npm script execution | serverManager.ts | ✅ |
| Port auto-detection | serverManager.ts (detectPortFromOutput) | ✅ |
| Framework auto-detection | serverManager.ts (detectFramework) | ✅ |
| Hot reload | serverManager.ts (startWatcher) | ✅ |
| Console panel | panel.html (injected script) | ✅ |
| Network inspector | panel.html (fetch interception) | ✅ |
| Device viewport | panel.html (setDevice) | ✅ |
| Scripts tree | scriptsTree.ts | ✅ |
| Status bar | statusBar.ts | ✅ |
| Welcome message | extension.ts (firstRun) | ✅ |
| Error handling | extension.ts (try/catch) | ✅ |

### Framework Support (7 frameworks)
- Next.js (port 3000)
- Nuxt (port 3000)
- Vite (port 5173)
- Webpack (port 8080)
- Parcel (port 1234)
- Remix (port 3000)
- Astro (port 4321)
- SvelteKit (port 5173)

### Build & Package
- Package.json configured with commands, keybindings, settings
- .vsix file generated (npm-preview-1.0.1.vsix)
- TypeScript compiles without errors
- Icons in place (activity-icon.svg, logo.svg)

---

## What Needs to Be Done

### Phase 1: Cleanup (Priority: HIGH)
- [ ] CLEAN-01: Remove npmRunner.ts (unused)
- [ ] CLEAN-02: Remove or wire up unused Playwright message types
- [ ] CLEAN-03: Verify no other dead code paths

### Phase 2: Screenshot Feature (Priority: HIGH)
- [ ] SS-01: Add screenshot button to webview toolbar
- [ ] SS-02: Implement html2canvas capture in panel.html
- [ ] SS-03: Wire up postMessage communication
- [ ] SS-04: Implement save dialog and file write

**Implementation approach (from research):**
1. Add html2canvas to webview (CDN or local bundle)
2. Listen for `captureScreenshot` message from extension
3. Use html2canvas to capture `.device-chrome` element
4. Send base64 back via postMessage
5. Extension opens save dialog, writes file

### Phase 3: Testing (Priority: HIGH)
- [ ] TEST-01: Unit tests for ServerManager
- [ ] TEST-02: Unit tests for ScriptsTree
- [ ] TEST-03: Integration test for start/stop
- [ ] TEST-04: Manual validation using TEST_CHECKLIST.md

### Phase 4: Polish (Priority: MEDIUM)
- [ ] POL-01: Verify activity-icon.svg is marketplace-ready
- [ ] POL-02: Review error messages for clarity
- [ ] POL-03: Check keybinding conflicts
- [ ] POL-04: Review package.json metadata

### Phase 5: Release (Priority: MEDIUM)
- [ ] REL-01: Package to .vsix
- [ ] REL-02: Publish to marketplace
- [ ] REL-03: Create GitHub release

---

## Risks and Mitigations

### Critical Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Cross-origin iframe limitation | Console/network/screenshot can't capture external content | Document limitation; works for localhost |
| Process termination on Windows | Zombie processes, port conflicts | Use tree-kill package |
| VS Code marketplace rejection | Extension fails review | Follow marketplace guidelines, proper metadata |

### Moderate Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Port detection fragility | Fails for non-standard frameworks | Multiple regex patterns, fallback to configured port |
| Keybinding conflicts | Conflicts with Live Server, Prettier | Review and document |

### Known Limitations (Documented)

1. Cross-origin iframes cannot be intercepted (console/network capture disabled)
2. Some dev servers may use non-standard ports
3. Very large console logs are truncated to 500 entries
4. Single workspace folder support only

---

## Project Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Version | 1.0.1 | 1.1.0 |
| Dead code files | 1 (npmRunner.ts) | 0 |
| Test coverage | 0% | 70%+ |
| Requirements mapped | 17 | 17 ✓ |
| Phases planned | 5 | 5 |

---

## Next Steps

1. **Begin Phase 1 (Cleanup):** Remove npmRunner.ts, clean up Playwright types
2. **Execute Phase 2 (Screenshot):** Implement html2canvas capture
3. **Execute Phase 3 (Testing):** Add unit tests and manual validation
4. **Execute Phase 4 (Polish):** UI refinements, keybinding review
5. **Execute Phase 5 (Release):** Publish to marketplace

---

## Research Sources

### Research Files
- `.planning/research/STACK.md` - Technology stack recommendations
- `.planning/research/FEATURES.md` - Feature landscape and priorities
- `.planning/research/ARCHITECTURE.md` - Architecture patterns
- `.planning/research/PITFALLS.md` - Domain pitfalls and mitigations
- `.planning/research/SCREENSHOT.md` - Screenshot implementation research
- `.planning/research/SUMMARY.md` - Previous research summary

### Codebase Analysis
- `.planning/codebase/STACK.md` - Technology inventory
- `.planning/codebase/COMPREHENSIVE.md` - Complete file map
- `.planning/codebase/STRUCTURE.md` - Directory structure
- `.planning/codebase/ARCHITECTURE.md` - Architecture analysis

### Planning Documents
- `.planning/ROADMAP.md` - 5-phase roadmap
- `.planning/STATE.md` - Current project state
- `TEST_CHECKLIST.md` - Manual test validation checklist

---

*This summary serves as the single source of truth for the npm-preview project. All implementers should reference this document for context before starting work.*
