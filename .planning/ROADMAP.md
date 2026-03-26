# npm-preview Roadmap

**Project:** npm-preview VS Code Extension  
**Version:** 1.0.1 → 1.1.0  
**Goal:** Complete missing functionality and release to marketplace  
**Depth:** Standard (5-7 phases)

## Executive Summary

The npm-preview extension is production-ready for core features (v1.0.1). This roadmap addresses the remaining gaps to create a polished v1.1.0 release suitable for marketplace publication.

## Phases

- [ ] **Phase 1: Cleanup** - Remove dead code, verify codebase health
- [ ] **Phase 2: Screenshot Feature** - Implement the placeholder screenshot command
- [ ] **Phase 3: Testing** - Add automated tests, validate against checklist
- [ ] **Phase 4: Polish** - UI refinements, error handling improvements
- [ ] **Phase 5: Release** - Package and publish to marketplace

---

## Phase Details

### Phase 1: Cleanup

**Goal:** Remove dead code and verify codebase health

**Depends on:** Nothing

**Requirements:** 
- CLEAN-01: Remove npmRunner.ts (unused duplicate implementation)
- CLEAN-02: Remove unused Playwright message types or wire them up
- CLEAN-03: Verify no other dead code paths

**Success Criteria** (what must be TRUE):
1. npmRunner.ts is deleted from src/
2. No "npmRunner" imports exist in extension.ts or other files
3. Playwright message types are either implemented or removed (cleaned up)
4. No TypeScript compilation warnings related to unused code

**Plans:** TBD

---

### Phase 2: Screenshot Feature

**Goal:** Implement functional screenshot capability

**Depends on:** Phase 1

**Requirements:**
- SS-01: User can trigger screenshot from webview toolbar
- SS-02: Screenshot is saved to disk or copied to clipboard
- SS-03: User receives feedback on screenshot success/failure

**Success Criteria** (what must be TRUE):
1. Screenshot button visible in webview toolbar
2. Clicking button captures current iframe content
3. File saved to project folder or clipboard with notification
  4. Works for localhost content (cross-origin limitation acknowledged)

**Plans:** 
- [x] PHASE2-SCREENSHOT-01-PLAN.md — Implement screenshot feature (html2canvas capture + file save)

---

### Phase 3: Testing

**Goal:** Add automated test coverage

**Depends on:** Phase 2 (feature complete)

**Requirements:**
- TEST-01: Unit tests for ServerManager (process spawning, port detection)
- TEST-02: Unit tests for ScriptsTree (parsing, tree structure)
- TEST-03: Integration test for start/stop workflow
- TEST-04: Manual validation using TEST_CHECKLIST.md

**Success Criteria** (what must be TRUE):
1. Unit tests exist for core components
2. Test suite runs without errors (`npm test` or equivalent)
3. All manual test checklist items pass
4. Extension runs in fresh VS Code install without errors

**Plans:** TBD

---

### Phase 4: Polish

**Goal:** UI refinements and error handling improvements

**Depends on:** Phase 3 (tests passing)

**Requirements:**
- POL-01: Verify activity-icon.svg is appropriate for marketplace
- POL-02: Review error messages for clarity
- POL-03: Check keybinding conflicts with common extensions
- POL-04: Review package.json metadata for marketplace

**Success Criteria** (what must be TRUE):
1. Icon looks professional in VS Code activity bar
2. Error messages are user-friendly and actionable
3. No keybinding conflicts with top 20 extensions
4. Package.json has appropriate keywords, description, screenshots

**Plans:** TBD

---

### Phase 5: Release

**Goal:** Publish extension to VS Code marketplace

**Depends on:** Phase 4 (polish complete)

**Requirements:**
- REL-01: Extension packages successfully to .vsix
- REL-02: Published to marketplace (vsce publish)
- REL-03: GitHub release created with changelog

**Success Criteria** (what must be TRUE):
1. `npm run package` produces valid .vsix
2. Extension installs and runs from marketplace
3. GitHub release notes document changes from v1.0.1 to v1.1.0

**Plans:** TBD

---

## Coverage

| Requirement | Phase | Status |
|-------------|-------|--------|
| CLEAN-01: Remove npmRunner.ts | Phase 1 | Pending |
| CLEAN-02: Clean up Playwright types | Phase 1 | Pending |
| CLEAN-03: Verify no other dead code | Phase 1 | Pending |
| SS-01: Screenshot button in toolbar | Phase 2 | Pending |
| SS-02: Capture iframe content | Phase 2 | Pending |
| SS-03: Save/copy feedback | Phase 2 | Pending |
| TEST-01: Unit tests - ServerManager | Phase 3 | Pending |
| TEST-02: Unit tests - ScriptsTree | Phase 3 | Pending |
| TEST-03: Integration test | Phase 3 | Pending |
| TEST-04: Manual validation | Phase 3 | Pending |
| POL-01: Icon verification | Phase 4 | Pending |
| POL-02: Error message review | Phase 4 | Pending |
| POL-03: Keybinding check | Phase 4 | Pending |
| POL-04: Package metadata review | Phase 4 | Pending |
| REL-01: Package to .vsix | Phase 5 | Pending |
| REL-02: Publish to marketplace | Phase 5 | Pending |
| REL-03: GitHub release | Phase 5 | Pending |

**Mapped:** 17/17 requirements ✓

---

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Cleanup | 0/3 | Not started | - |
| 2. Screenshot Feature | 0/3 | Not started | - |
| 3. Testing | 0/4 | Not started | - |
| 4. Polish | 0/4 | Not started | - |
| 5. Release | 0/3 | Not started | - |

---

## Milestones

| Milestone | Target | Criteria |
|-----------|--------|----------|
| M1: Code Cleanup | Week 1 | Dead code removed, clean build |
| M2: Feature Complete | Week 2 | Screenshot works, all features done |
| M3: Tests Passing | Week 3 | Automated tests run, manual tests pass |
| M4: Ready for Market | Week 4 | Polish complete, .vsix builds |
| M5: Published | Week 5 | Marketplace published |

---

## Notes

- **Cross-origin limitation:** Document that screenshot only works for localhost content
- **Playwright:** Either implement properly or remove message types to avoid confusion
- **Keybindings:** Currently using Ctrl+Shift+R/X/V - check for conflicts with popular extensions (Live Server, Prettier, etc.)