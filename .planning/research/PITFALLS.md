# Domain Pitfalls

**Domain:** VS Code Extension Development
**Researched:** 2026-03-26

## Critical Pitfalls

Mistakes that cause rewrites or major issues.

### Pitfall 1: Cross-Origin iframe Limitations
**What goes wrong:** Console/network interception fails silently for non-localhost content
**Why it happens:** Browser CSP prevents contentWindow access for cross-origin iframes
**Consequences:** Users think feature is broken when using CDN resources
**Prevention:** Document clearly, check origin before attempting injection
**Detection:** try/catch in load event handler catches the error silently

```typescript
// In panel.html - catches but ignores cross-origin errors
try {
  const iw = document.getElementById('iframe').contentWindow;
  // ... injection code ...
} catch(_) { /* cross-origin — cannot patch */ }
```

### Pitfall 2: Process Termination on Windows
**What goes wrong:** npm processes don't terminate properly, leave orphaned processes
**Why it happens:** Windows process tree handling differs from Unix
**Consequences:** Zombie processes, port conflicts
**Prevention:** Use tree-kill package, spawn npm.cmd on Windows
**Detection:** Check Task Manager after multiple start/stop cycles

## Moderate Pitfalls

### Pitfall 3: Port Detection Fragility
**What goes wrong:** Framework output formats vary, port detection regex may miss
**Prevention:** Multiple regex patterns, fallback to configured port, reasonable timeout

### Pitfall 4: First-Run Welcome Message Timing
**What goes wrong:** Message shows too early before VS Code fully ready
**Prevention:** Delay with setTimeout (currently 2 seconds)

### Pitfall 5: Multiple Workspace Folders
**What goes wrong:** ServerManager assumes single workspace folder
**Prevention:** Only uses first workspace folder, document limitation

```typescript
private workspaceRoot(): string | undefined {
  return vscode.workspace.workspaceFolders?.[0].uri.fsPath;
}
```

## Minor Pitfalls

### Pitfall 6: Webview Content Security Policy
**What goes wrong:** iframe won't load due to CSP restrictions
**Prevention:** Configure CSP to allow localhost iframes
```html
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; frame-src http://localhost:*;">
```

### Pitfall 7: Log Buffer Overflow
**What goes wrong:** Console logs grow unbounded, memory issues
**Prevention:** Limit to 500 entries
```typescript
if (this._logs.length > 500) this._logs.shift();
```

### Pitfall 8: vsce Not Installed
**What goes wrong:** npm run package fails
**Prevention:** Install @vscode/vsce as dev dependency

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Publishing | Marketplace token not configured | Document vsce publish setup |
| Testing | No automated tests | Create unit tests before features |
| Screenshot | Complex implementation | Consider using webContents.capturePage (Electron only) |

## Known Limitations (from README)

1. Cross-origin iframes cannot be intercepted (console/network capture disabled)
2. Some dev servers may use non-standard ports
3. Very large console logs are truncated to 500 entries

## Sources

- Extension source code review
- TEST_CHECKLIST.md - Known issues checklist
- Browser security model documentation
