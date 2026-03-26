# Feature Landscape

**Domain:** VS Code Extension for web development preview
**Researched:** 2026-03-26

## Table Stakes

Features users expect. Missing = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Run npm scripts | Core functionality | Low | Via ServerManager |
| Preview iframe | View app | Low | Embedded webview |
| Hot reload | DX improvement | Medium | FileSystemWatcher + iframe reload |
| Console capture | Debugging | Medium | Inject script into iframe |
| Network inspector | Debugging | Medium | Fetch interception in iframe |
| Status bar | Server status | Low | StatusBarManager |
| Scripts tree | Discover scripts | Low | TreeDataProvider |

## Differentiators

Features that set product apart. Not expected, but valued.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Device viewport simulator | Mobile-first DX | Low | Desktop/Tablet/Mobile sizes |
| Framework auto-detection | Zero-config | Medium | Detects Vite, Next.js, Nuxt, etc. |
| Port auto-detection | No config needed | Medium | Parses server output |
| Sidebar integration | Quick access | Low | Scripts tree in activity bar |

## Anti-Features

Features to explicitly NOT build.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Full DevTools replacement | Reinventing wheel | Keep browser DevTools for complex debugging |
| Cloud deployment | Out of scope | Keep local-only |
| Multi-workspace support | Complexity | Single workspace first |

## Feature Dependencies

```
npmPreview.start command
       ↓
ServerManager.start(script)
       ↓
┌──────┴──────┐
↓             ↓
Port detection   npm process spawn
       ↓             ↓
waitForPort ──→ StatusBar update
       ↓
PreviewPanel.createOrShow
       ↓
Webview loads iframe
       ↓
Console/Network interception script injected
```

## MVP Recommendation

**Current state IS the MVP.** All table stakes and key differentiators are implemented.

Prioritize for future:
1. **Screenshot feature** - Already in docs but placeholder only
2. **Automated testing** - Test checklist exists but no actual tests
3. **More framework detection** - Could expand beyond current 7 frameworks

## Implemented Features Summary

| Feature | Status | File(s) |
|---------|--------|---------|
| npm script execution | ✅ | serverManager.ts |
| Port auto-detection | ✅ | serverManager.ts (detectPortFromOutput) |
| Framework auto-detection | ✅ | serverManager.ts (detectFramework) |
| Hot reload | ✅ | serverManager.ts (startWatcher) |
| Console panel | ✅ | panel.html (injected script) |
| Network inspector | ✅ | panel.html (fetch interception) |
| Device viewport | ✅ | panel.html (setDevice) |
| Scripts tree | ✅ | scriptsTree.ts |
| Status bar | ✅ | statusBar.ts |
| Welcome message | ✅ | extension.ts (firstRun) |
| Error handling | ✅ | extension.ts (try/catch) |
| Screenshot | ❌ | placeholder only |

## Sources

- TEST_CHECKLIST.md - Feature validation checklist
- README.md - User-facing feature documentation
