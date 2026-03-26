# Project State: npm-preview

**Project:** npm-preview VS Code Extension
**Core Value:** Run npm scripts and preview web apps inside VS Code with hot reload, console, network inspector, and viewport simulator
**Current Phase:** Planning (Roadmap created)
**Focus:** Complete missing functionality for marketplace release

---

## Current Position

| Attribute | Value |
|-----------|-------|
| Phase | Roadmap created |
| Plan | Ready for `/gsd-plan-phase 1` |
| Status | Not started |
| Progress | 0/5 phases complete |

---

## Performance Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Requirements | 17 mapped | 17 mapped ✓ |
| Dead code files | 1 (npmRunner.ts) | 0 |
| Test coverage | 0% | 70%+ |
| Version | 1.0.1 | 1.1.0 |

---

## Accumulated Context

### From Research

**What's Implemented:**
- ServerManager (npm process spawning, framework detection, port detection)
- PreviewPanel (webview-based preview with toolbar, console, network tabs)
- ScriptsTree (sidebar tree view of package.json scripts)
- StatusBar (real-time server status)
- Device viewport simulator (desktop/tablet/mobile)
- Hot reload via FileSystemWatcher

**What's Missing:**
- Screenshot feature (placeholder command only)
- npmRunner.ts (unused dead code)
- Playwright message types (defined but not wired)
- Automated tests

**Known Limitations:**
- Cross-origin iframes cannot be intercepted (console/network)
- Single workspace folder support only

### Decisions Made

1. **Phase structure:** 5 phases (Cleanup → Screenshot → Testing → Polish → Release)
2. **Screenshot approach:** Capture iframe content via webview JS, save to disk/clipboard
3. **Testing strategy:** Unit tests + manual validation via TEST_CHECKLIST.md

### Todo

- [ ] Run `/gsd-plan-phase 1` to start Cleanup phase
- [ ] Prior to Release: Verify keybinding conflicts

### Blockers

None currently. Roadmap approved and ready for execution.

---

## Session Continuity

**Last session:** Roadmap created with 5 phases, 17 requirements  
**Next step:** Begin Phase 1 (Cleanup) - remove npmRunner.ts, clean up Playwright types  
**User focus:** Complete v1.1.0 for marketplace release

---

*State updated: 2026-03-26*