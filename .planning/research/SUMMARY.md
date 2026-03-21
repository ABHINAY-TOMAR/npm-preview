# Research Summary: NPM Preview Extension

**Domain:** VS Code Extension for development server management
**Researched:** March 2026
**Overall confidence:** HIGH

## Executive Summary

The NPM Preview Extension is a well-conceived project that aims to bring Live Server-like functionality directly into VS Code. The core architecture is sound, leveraging VS Code's WebviewPanel API for the preview interface and child_process for npm script execution. The webview HTML is exceptionally well-designed with a professional dark theme, device chrome simulation, console panel, network inspector, and hot reload tracking.

The project has a solid foundation but requires **cleanup, missing dependencies, and polish** before it can be published. Key issues include duplicate code paths (previewPanel vs previewPanelManager), missing files (icons, statusBar.ts, webview/index.html), and incorrect imports (npmRunner.ts references non-existent StatusBarManager).

## Key Findings

**Stack:** TypeScript + VS Code Extension API + Vanilla JS Webview
**Architecture:** Extension Host → ServerManager (child_process) + WebviewPanel (iframe preview)
**Critical pitfall:** Duplicate/unified code paths will cause maintenance nightmares; must consolidate before shipping

## Current Implementation Assessment

| Component | Status | Notes |
|-----------|--------|-------|
| extension.ts | ✅ Good | Clean command registration, proper subscriptions |
| serverManager.ts | ✅ Good | Child process spawning, file watching, port detection |
| previewPanel.ts | ✅ Good | WebviewPanel lifecycle, message bridging |
| previewPanelManager.ts | ⚠️ Duplicate | Overlaps with previewPanel.ts - needs consolidation |
| scriptsTree.ts | ✅ Good | Tree view provider for npm scripts |
| npmRunner.ts | ❌ Broken | References non-existent StatusBarManager |
| webview/panel.html | ✅ Excellent | Professional dark theme, all panels implemented |
| package.json | ✅ Good | Complete configuration, all contributes defined |

## Missing Components

1. **Icons** - activity-icon.svg (32x32 recommended for activity bar)
2. **statusBar.ts** - Referenced by npmRunner.ts but doesn't exist
3. **webview/index.html** - Referenced by previewPanelManager.ts but doesn't exist
4. **.vscodeignore** - Standard ignore file for vsce
5. **README.md** - Installation and usage documentation
6. **Consolidation** - Merge previewPanel.ts and previewPanelManager.ts

## Roadmap Recommendation

### Phase 1: Foundation Cleanup
Fix broken imports, remove duplicate code, ensure compilation succeeds.

### Phase 2: Missing Assets
Create icons, statusBar.ts, and any missing files.

### Phase 3: Integration Testing
Test full workflow: open project → run script → preview appears → hot reload works.

### Phase 4: Polish & Documentation
README, screenshots, marketplace metadata.

### Phase 5: Publishing
Package with vsce, create marketplace listing.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Standard VS Code extension patterns, well-researched |
| Features | HIGH | Features are well-defined in ROADMAP.md |
| Architecture | MEDIUM | Core is good, consolidation needed |
| Pitfalls | HIGH | Identified via research (CSP, cross-origin, process cleanup) |

## Sources

- VS Code Extension API Documentation (official)
- microsoft/vscode-extension-samples (GitHub)
- abdulkadersafi.com "Building VS Code Extensions in 2026"
- Stack Overflow community solutions
- VS Code GitHub issues on webview CSP
