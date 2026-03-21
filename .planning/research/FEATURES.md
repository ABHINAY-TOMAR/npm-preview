# Feature Landscape

**Domain:** VS Code Extension for development server preview
**Researched:** March 2026

## Table Stakes (Expected Features)

These features are baseline expectations. Missing any = product feels incomplete.

| Feature | Why Expected | Complexity | Status |
|---------|--------------|------------|--------|
| Run npm script | Core purpose | Low | ✅ Implemented |
| Preview iframe | Core purpose | Low | ✅ Implemented |
| Stop server | Basic control | Low | ✅ Implemented |
| Hot reload | Standard expectation | Medium | ✅ Implemented |
| Console capture | Dev tool standard | Medium | ✅ Implemented |
| Status bar indicator | UX standard | Low | ✅ Implemented |

## Differentiators (Value Add)

Features that set this apart from alternatives like Live Server.

| Feature | Value Proposition | Complexity | Status |
|---------|-------------------|------------|--------|
| Device viewport simulator | Mobile-first debugging | Medium | ✅ Implemented |
| Network inspector | Performance debugging | Medium | ⚠️ Partial |
| Scripts tree view | Quick script access | Low | ✅ Implemented |
| Console/Network/Reload tabs | All-in-one debugging | Low | ✅ Implemented |
| HMR event log | Visual reload tracking | Low | ✅ Implemented |

## Anti-Features (Explicitly Don't Build)

| Anti-Feature | Why Avoid | What To Do Instead |
|--------------|-----------|-------------------|
| Built-in dev server | Reinventing wheel | Works with any existing server |
| Multiple simultaneous previews | Complexity, not requested | Single preview is simpler |
| Remote tunneling | Security concerns, maintenance | Suggest ngrok for sharing |
| Full browser emulation | Not feasible in webview | Device chrome simulation is sufficient |

## Feature Dependencies

```
extension.activate()
    ├── ServerManager.start()
    │       ├── child_process.spawn() → npm run <script>
    │       └── createFileSystemWatcher() → hot reload events
    ├── PreviewPanel.createOrShow()
    │       └── iframe.src = http://localhost:PORT
    └── ScriptsTreeProvider
            └── read package.json → list scripts
```

## MVP Recommendation

The current implementation is essentially MVP-complete. Priority for shipping:

1. **Fix compilation errors** - npmRunner.ts has broken imports
2. **Consolidate duplicate code** - Merge previewPanel.ts and previewPanelManager.ts
3. **Add missing files** - icons, statusBar.ts
4. **Test full workflow** - Ensure all features work end-to-end
5. **Write README** - Installation and usage documentation

## Sources

- Live Server extension (reference for expected features)
- VS Code webview samples (technical implementation)
- Developer community feedback patterns
