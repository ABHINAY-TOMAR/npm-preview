# Research Summary: npm-preview

**Project:** npm-preview VS Code Extension
**Domain:** VS Code Extension for web development tooling
**Researched:** 2026-03-26
**Overall confidence:** HIGH (full codebase analysis)

## Executive Summary

The npm-preview extension is a mature, well-architected VS Code extension (v1.0.1) that allows developers to run npm scripts and preview web applications directly within the IDE. It provides hot reload, console panel, network inspector, and device viewport simulation features.

The project is in a **production-ready state** with all core features implemented. The codebase shows good software engineering practices including proper separation of concerns, event-driven architecture, and comprehensive error handling.

## Key Findings

**Stack:** VS Code Extension API with TypeScript, using WebviewPanel for the preview UI
**Architecture:** Event-driven with ServerManager as the central orchestrator
**Critical design pattern:** Webview-based iframe preview with injected JavaScript for console/network interception
**Main limitation:** Cross-origin iframe content cannot be intercepted

## What's Implemented

1. **ServerManager** - Core npm process spawning with framework auto-detection
2. **PreviewPanel** - Webview-based preview with toolbar, device chrome, and tabs
3. **ScriptsTree** - Sidebar tree view showing package.json scripts
4. **StatusBar** - Real-time server status in VS Code status bar
5. **Webview HTML** - Feature-rich preview panel with console, network, hot reload tabs

## What's Missing/Incomplete

1. **Screenshot feature** - Placeholder command exists but not implemented
2. **npmRunner.ts** - Alternative implementation that appears unused (not imported by extension.ts)
3. **Playwright integration** - Message types defined but not wired up
4. **MCP events** - Message types defined but not implemented
5. **No automated tests** - Test checklist exists but no actual test files
6. **Missing VS Code marketplace presence** - Packaged .vsix exists but not published

## Current Project State

| Area | Status |
|------|--------|
| Core functionality | ✅ Complete |
| UI/UX | ✅ Complete |
| Documentation | ✅ Complete |
| Error handling | ✅ Complete |
| Package structure | ✅ Complete |
| Unit tests | ❌ None |
| Published marketplace | ❌ Not published |
| Screenshot feature | ❌ Placeholder only |
| Playwright integration | ❌ Defined but unused |

## Implication for Roadmap

Given the project is essentially complete for v1.0.0 features:

**Recommended Phase Structure:**

1. **Polish Phase** - Address placeholder features, fix any edge cases
2. **Testing Phase** - Add automated tests, validate on more frameworks
3. **Distribution Phase** - Publish to marketplace, create demo videos
4. **Feature Expansion** - Optional v1.1 features (screenshot, accessibility audit)

## Confidence Assessment

| Area | Level | Notes |
|------|-------|-------|
| Stack | HIGH | Standard VS Code Extension API + TypeScript |
| Features | HIGH | All documented features implemented |
| Architecture | HIGH | Clean separation, event-driven, well-documented |
| Pitfalls | MEDIUM | Cross-origin limitation documented, edge cases need testing |

## Gaps to Address

- No automated test suite
- npmRunner.ts duplicate implementation needs cleanup
- Screenshot feature is placeholder
- Framework support limited to common ones (could expand)
