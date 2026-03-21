# Domain Pitfalls

**Domain:** VS Code Extension Development
**Researched:** March 2026

## Critical Pitfalls

Mistakes that cause rewrites, crashes, or security issues.

### Pitfall 1: Cross-Origin iframe Access Blocked
**What goes wrong:** Console/network interception fails silently with "SecurityError" for cross-origin iframes.

**Why it happens:** Webview CSP and iframe origin restrictions prevent direct DOM access.

**Consequences:** 
- Console logs not captured from iframe
- Network requests not tracked
- Hot reload may fail

**Prevention:**
```typescript
// In panel.html iframe load handler
try {
  const iw = iframe.contentWindow;
  // Patch methods here
} catch (e) {
  // Cross-origin - show notice
  console.warn('Cannot access iframe (cross-origin)');
}
```

**Current status:** ✅ Handled with try/catch in panel.html

### Pitfall 2: Content Security Policy Blocking Scripts
**What goes wrong:** Webview shows blank, console errors about CSP.

**CSP in package.json:**
```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'none'; 
               frame-src http://localhost:*; 
               script-src 'unsafe-inline'; 
               style-src 'unsafe-inline' https://fonts.googleapis.com;
               font-src https://fonts.gstatic.com;">
```

**Prevention:** The current CSP is permissive. For production, use nonce-based approach:
```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'none'; 
               frame-src http://localhost:*;
               style-src ${webview.cspSource};
               script-src 'nonce-${nonce}';
               font-src ${webview.cspSource};">
```

### Pitfall 3: Orphaned Child Processes
**What goes wrong:** npm process keeps running after VS Code closes or extension deactivates.

**Why it happens:** tree-kill not called on deactivate, or process tree not fully killed.

**Consequences:**
- Port left occupied
- Zombie processes
- Developer frustration

**Prevention:**
```typescript
// extension.ts
export function deactivate() {
  serverManager?.stop(); // Must be called!
}

// serverManager.ts
async stop(): Promise<void> {
  this.watcher?.dispose();
  if (this.process?.pid) {
    await new Promise<void>(res => 
      treeKill(this.process!.pid!, 'SIGTERM', () => res())
    );
  }
}
```

**Current status:** ✅ Implemented correctly in serverManager.ts

### Pitfall 4: Memory Leaks in Webview
**What goes wrong:** Webview consumes increasing memory over time.

**Why it happens:** Event listeners not removed, logs array grows unbounded.

**Prevention:**
```typescript
// Limit log array size
private addLog(level, message) {
  const line = { time, level, message };
  this._logs.push(line);
  if (this._logs.length > 500) this._logs.shift(); // Cap at 500
}

// Always dispose webview
dispose() {
  PreviewPanel.currentPanel = undefined;
  this.panel.dispose();
  this.disposables.forEach(d => d.dispose());
}
```

**Current status:** ✅ Log array capped at 500 in serverManager.ts

## Moderate Pitfalls

### Pitfall 5: Duplicate Code Paths
**What goes wrong:** previewPanel.ts and previewPanelManager.ts have overlapping functionality.

**Consequences:** Maintenance burden, confusion about which to use, potential bugs.

**Prevention:** Consolidate into single class before shipping.

### Pitfall 6: Missing Icons
**What goes wrong:** Extension installs but activity bar shows broken icon.

**Requirements:**
- `icons/activity-icon.svg` or `icons/activity-icon.png` (32x32)
- `icons/logo.png` for marketplace (128x128)

**Prevention:** Create proper icons before publishing.

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Code cleanup | TypeScript compilation fails | Fix imports, remove duplicates first |
| Icon creation | Wrong dimensions | Use 32x32 for activity bar, 128x128 for logo |
| Publishing | Missing publisher token | Create Azure DevOps token before vsce publish |
| Marketplace | Screenshots required | Take screenshots of working extension |

## Sources

- VS Code Extension API Issues (GitHub)
- Community Stack Overflow discussions
- VS Code webview CSP documentation
- tree-kill package documentation
