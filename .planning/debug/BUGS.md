# NPM Preview Extension - Bug Report

**Generated:** 2026-03-26  
**Files Scanned:** 7 source files  
**Compiler:** TypeScript 5.3.0 (strict mode)

---

## Summary

| Severity | Count |
|----------|-------|
| High     | 4     |
| Medium   | 5     |
| Low      | 6     |

---

## TypeScript/Logic Issues

### HIGH: Multiple non-null assertions on potentially undefined values

**Files:** `src/extension.ts`

**Lines:** 51, 53, 55, 58, 62, 90, 119, 146, 148, 149

**Description:** The code uses `serverManager!` and `scriptsTree!` non-null assertions extensively, but these module-level variables can be `undefined` if `activate()` hasn't been called or if there's an error during initialization.

**Code Example:**
```typescript
// Line 51
await serverManager!.start(configuredScript);
// Line 119
const names = await scriptsTree!.getScriptNames();
```

**Severity:** High  
**Impact:** Runtime crashes if commands are invoked before activation or after deactivation.  
**Suggested Fix:** Add null checks or use early returns.

---

### HIGH: Promise not awaited in tree-kill callback

**File:** `src/serverManager.ts`  
**Line:** 176

**Description:** The `treeKill` callback doesn't properly handle errors or verify process termination.

```typescript
await new Promise<void>((res) => {
  treeKill(this.process!.pid!, 'SIGTERM', () => res());
});
```

**Severity:** High  
**Impact:** Process may not terminate cleanly; error cases silently swallowed.  
**Suggested Fix:**
```typescript
await new Promise<void>((resolve, reject) => {
  treeKill(this.process!.pid!, 'SIGTERM', (err) => {
    if (err) reject(err);
    else resolve();
  });
});
```

---

### HIGH: Race condition in port detection

**File:** `src/serverManager.ts`  
**Lines:** 132-146

**Description:** Port detection attempts to parse `outputBuffer` immediately after spawning, but stdout/stderr are async. The buffer may not contain the port information yet.

```typescript
this.process.stdout?.on('data', (data: Buffer) => {
  const text = data.toString();
  outputBuffer += text;
  // ...
});

// Immediately after - buffer likely empty!
const detectedPort = detectPortFromOutput(outputBuffer, this._port);
```

**Severity:** High  
**Impact:** Port may not be correctly detected; connection failures.  
**Suggested Fix:** Move port detection inside the data handler or use a more robust detection mechanism.

---

### HIGH: Missing error handling in fs.watch callback

**File:** `src/serverManager.ts`  
**Lines:** 185-192

**Description:** The file watcher callback doesn't handle errors, and watcher disposal may be incomplete.

```typescript
private startWatcher(glob: string): void {
  this.watcher = vscode.workspace.createFileSystemWatcher(glob);
  const handler = (uri: vscode.Uri) => {
    // No error handling for workspace.asRelativePath
    const rel = vscode.workspace.asRelativePath(uri);
    this.onHotReload?.(rel);
    this.addLog('info', `HMR triggered by: ${rel}`);
  };
  // Watcher errors not handled
}
```

**Severity:** High  
**Impact:** Silent failures, potential memory leaks.  
**Suggested Fix:** Add error handler and verify watcher disposal.

---

### MEDIUM: Undefined return value in deactivate

**File:** `src/extension.ts`  
**Lines:** 237-240

**Description:** `deactivate()` calls `serverManager?.stop()` but doesn't await it, and doesn't wait for cleanup to complete.

```typescript
export function deactivate(): void {
  serverManager?.stop(); // Not awaited!
  statusBar?.dispose();
}
```

**Severity:** Medium  
**Impact:** Server may not stop cleanly; may leave zombie processes.  
**Suggested Fix:** Make `deactivate` async and await stop.

---

### MEDIUM: Memory leak - Event listeners not cleaned up

**File:** `src/serverManager.ts`  
**Lines:** 80-81

**Description:** The `callbacks` array accumulates but is never cleaned up. If ServerManager is recreated, old callbacks remain.

```typescript
private callbacks: StatusCallback[] = [];
// Added to, never removed
onStatusChange(cb: StatusCallback): void {
  this.callbacks.push(cb);
}
```

**Severity:** Medium  
**Impact:** Memory leak if extension is reloaded or updated.  
**Suggested Fix:** Add removeCallback method or use vscode.Disposable pattern.

---

### MEDIUM: Error in panel disposal

**File:** `src/previewPanel.ts`  
**Line:** 245

**Description:** When panel is disposed, `boundServer` is set to undefined but the callbacks (onLogLine, onHotReload) on the server are not cleared, leading to stale references.

```typescript
dispose(): void {
  PreviewPanel.currentPanel = undefined;
  this.boundServer = undefined; // Server still holds callbacks to this panel!
  this.panel.dispose();
  // ...
}
```

**Severity:** Medium  
**Impact:** Memory leak; potential callback to disposed panel.  
**Suggested Fix:** Clear server callbacks before setting boundServer to undefined.

---

### MEDIUM: Unhandled promise rejection in extension

**File:** `src/extension.ts`  
**Line:** 24

**Description:** The setTimeout callback doesn't handle promise rejections from showInformationMessage.

```typescript
setTimeout(() => {
  vscode.window.showInformationMessage(...)
    .then(choice => { ... }); // No .catch()
}, 2000);
```

**Severity:** Medium  
**Impact:** Unhandled promise rejections in console.  
**Suggested Fix:** Add `.catch()` handler.

---

### MEDIUM: Missing null check on package.json parse

**File:** `src/serverManager.ts`  
**Line:** 104

**Description:** No validation that parsed JSON is valid or contains expected structure.

```typescript
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
const scripts = pkg.scripts || {}; // pkg could be undefined if parse fails oddly
```

**Severity:** Medium  
**Impact:** Runtime errors if package.json is malformed.  
**Suggested Fix:** Add try-catch and validation.

---

### LOW: Variable scope issue in catch block

**File:** `src/extension.ts`  
**Line:** 152

**Description:** The `details` variable may be empty string which is falsy but different from undefined.

```typescript
const title = lines[0];
const details = lines.slice(1).join('\n');
if (details) { // Empty string is falsy, but so is "undefined" from join
  vscode.window.showErrorMessage(title, { detail: details, modal: false });
} else {
  vscode.window.showErrorMessage(`NPM Preview: ${title}`);
}
```

**Severity:** Low  
**Impact:** Minor logic inconsistency.  
**Suggested Fix:** Use `if (details.trim())` for clearer intent.

---

### LOW: StatusBar not added to subscriptions

**File:** `src/extension.ts`  
**Lines:** 17-19

**Description:** `statusBar` is created but not added to `context.subscriptions`, so it's not automatically disposed on extension deactivation.

```typescript
statusBar = new StatusBarManager();
// Not added: context.subscriptions.push(statusBar);
```

**Severity:** Low  
**Impact:** Manual disposal in deactivate works, but inconsistent pattern.  
**Suggested Fix:** Add to subscriptions for consistency.

---

### LOW: Tree view not stored/managed

**File:** `src/extension.ts`  
**Lines:** 40-42

**Description:** The tree view created with `createTreeView` is not stored or disposed.

```typescript
vscode.window.createTreeView('npmPreviewScripts', {
  treeDataProvider: scriptsTree,
});
// Return value not stored!
```

**Severity:** Low  
**Impact:** Potential resource leak.  
**Suggested Fix:** Store reference and dispose in deactivate.

---

### LOW: No validation of script arguments

**File:** `src/extension.ts`  
**Line:** 118

**Description:** The `scriptName` argument to `runScript` command isn't validated before use.

```typescript
async (scriptName?: string) => {
  // scriptName not validated - could be empty string
```

**Severity:** Low  
**Impact:** Minor - code handles this case, but implicitly.  
**Suggested Fix:** Add explicit validation.

---

### LOW: Hardcoded timeout value

**File:** `src/serverManager.ts`  
**Line:** 151

**Description:** Port wait timeout is hardcoded (30 seconds) with no configuration option.

```typescript
await this.waitForPort(this._port, 30_000); // Hardcoded
```

**Severity:** Low  
**Impact:** No flexibility for slow-starting servers.  
**Suggested Fix:** Make configurable via vscode settings.

---

### LOW: Network interceptor may fail silently

**File:** `webview/panel.html`  
**Lines:** 353-381

**Description:** The fetch/console patching in iframe uses try-catch with empty handler, errors are swallowed.

```typescript
try {
  const iw = document.getElementById('iframe').contentWindow;
  // ... patching ...
} catch(_) { /* cross-origin — cannot patch */ }
```

**Severity:** Low  
**Impact:** Silent failures make debugging difficult.  
**Suggested Fix:** Log to console in development mode.

---

## HTML/Webview Issues

### MEDIUM: External CDN dependency without fallback

**File:** `webview/panel.html`  
**Line:** 383

**Description:** html2canvas loaded from CDN with comment about local fallback that isn't implemented.

```html
<script src="https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js"></script>
<!-- Using CDN as fallback - for production, use: ... -->
```

**Severity:** Medium  
**Impact:** Screenshot feature fails if offline or CDN blocked.  
**Suggested Fix:** Bundle html2canvas locally and use asset URI.

---

### LOW: CSP allows unsafe-inline scripts

**File:** `webview/panel.html`  
**Line:** 6

**Description:** Content-Security-Policy uses `'unsafe-inline'` for scripts, which is a security concern.

```html
<meta http-equiv="Content-Security-Policy" content="... script-src 'unsafe-inline' ...">
```

**Severity:** Low  
**Impact:** XSS vulnerability if webview content is compromised.  
**Suggested Fix:** Use nonces or strict CSP if possible.

---

## Potential Issues (Not Confirmed)

### Unused imports

**File:** `src/serverManager.ts`  
**Lines:** 8-11

**Description:** The code imports `fs` but mostly uses Node's built-in APIs. Some usage may be redundant.

```typescript
import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as path from 'path';
import * as fs from 'fs'; // Used but could be minimized
import treeKill from 'tree-kill';
```

---

### Unused dependency

**File:** `package.json`  
**Line:** 163

**Description:** `portfinder` is in dependencies but doesn't appear to be imported/used in source.

```json
"dependencies": {
  "html2canvas": "^1.4.1",
  "portfinder": "^1.0.38",  // Not imported anywhere?
  "tree-kill": "^1.2.2",
  "ws": "^8.16.0"
}
```

---

## Recommendations Priority

1. **Immediate:** Fix non-null assertions with proper null checks
2. **High:** Fix tree-kill error handling
3. **High:** Fix race condition in port detection
4. **Medium:** Fix memory leaks (callbacks, event listeners)
5. **Medium:** Bundle html2canvas locally
6. **Low:** Add configuration options for timeouts

---

*Report generated by automated code analysis.*