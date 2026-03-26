# Screenshot Implementation Research

**Domain:** VS Code Extension WebView Screenshot Capture
**Researched:** 2026-03-26
**Confidence:** HIGH

## Summary

Implementing screenshot functionality for the npm-preview VS Code extension requires capturing either the webview content or the iframe preview. Based on research, **the recommended approach is using html2canvas within the webview itself**, sending the captured image back to the extension via `postMessage` for file saving. This avoids adding heavy browser automation dependencies (Puppeteer/Playwright) while working within VS Code's webview architecture.

**Primary recommendation:** Implement client-side capture in `panel.html` using html2canvas, communicate the base64 image to extension host via `postMessage`, then save using VS Code's file dialog APIs.

---

## Option Comparison

| Approach | Pros | Cons | Recommended |
|----------|------|------|--------------|
| **html2canvas in webview** | No extra deps, works with existing architecture | Limited iframe support, CORS issues | ✅ **Yes** |
| **Puppeteer/Playwright** | Full browser capture, accurate | ~300MB extra, heavy for this use case | ❌ No |
| **html-to-image** | Modern alternative to html2canvas | Same iframe limitations | Optional |
| **VS Code Simple Browser API** | Native API | Not available to extensions, only for VS Code's internal use | ❌ No |

---

## Standard Stack

### Core Library
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| html2canvas | 1.4.1 | Client-side DOM to canvas rendering | Most popular, well-maintained, 2.6M weekly downloads |

**Installation:**
```bash
npm install html2canvas
```

### Alternative
| Library | Purpose | When to Use |
|---------|---------|-------------|
| html-to-image | Fork of dom-to-image with more formats | If html2canvas has issues with specific CSS |

---

## Architecture Patterns

### Recommended Pattern: Webview Capture → Extension Save

```
┌─────────────────────────────────────────────────────────────┐
│                      Extension Host                          │
│  ┌─────────────────────┐    ┌────────────────────────────┐   │
│  │ takeScreenshot cmd │───>│ Send "capture" to webview  │   │
│  └─────────────────────┘    └────────────────────────────┘   │
│           │                          │                        │
│           │                   postMessage                     │
│           ▼                          ▼                        │
│  ┌─────────────────────┐    ┌────────────────────────────┐   │
│  │ Save file dialog   │<───│ Return base64 image        │   │
│  │ Write to disk      │    │ via postMessage            │   │
│  └─────────────────────┘    └────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                      WebView (panel.html)                    │
│  ┌─────────────────────┐    ┌────────────────────────────┐   │
│  │ Receive "capture"  │───>│ html2canvas(element)        │   │
│  │ message            │    │ .then(canvas => toDataURL) │   │
│  └─────────────────────┘    └────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Implementation Flow

1. **User triggers screenshot** via command palette or button
2. **Extension sends message** to webview requesting capture
3. **WebView captures** the preview element using html2canvas
4. **WebView sends back** base64 image data via postMessage
5. **Extension opens** save dialog, writes file to disk

---

## Code Examples

### 1. Extension Side (extension.ts)

```typescript
// Take Screenshot command
context.subscriptions.push(
  vscode.commands.registerCommand('npmPreview.takeScreenshot', async () => {
    const panel = PreviewPanel.currentPanel;
    if (!panel) {
      vscode.window.showWarningMessage('No preview panel open');
      return;
    }

    // Request capture from webview
    panel.postMessage({ type: 'captureScreenshot' });

    // The response will be handled by onDidReceiveMessage in PreviewPanel
  })
);
```

### 2. PreviewPanel message handling (previewPanel.ts)

Add response handling in `handleMessage`:

```typescript
case 'screenshotData':
  // Save the base64 image to disk
  const base64Data = msg.data.replace(/^data:image\/png;base64,/, '');
  const buffer = Buffer.from(base64Data, 'base64');
  
  const uri = await vscode.window.showSaveDialog({
    defaultUri: vscode.Uri.file(`screenshot-${Date.now()}.png`),
    filters: [{ name: 'PNG Image', extensions: ['png'] }]
  });
  
  if (uri) {
    await vscode.workspace.fs.writeFile(uri, buffer);
    vscode.window.showInformationMessage(`Screenshot saved to ${uri.fsPath}`);
  }
  break;
```

### 3. WebView Side (panel.html)

```html
<!-- Add html2canvas script to panel.html -->
<script src="https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js"></script>

<script>
// Handle capture request from extension
window.addEventListener('message', async ({ data }) => {
  if (data.type === 'captureScreenshot') {
    try {
      // Capture the preview device chrome (not just iframe)
      const element = document.getElementById('deviceChrome');
      
      const canvas = await html2canvas(element, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#1a1a28' // Match device-chrome background
      });
      
      const dataUrl = canvas.toDataURL('image/png');
      
      // Send back to extension
      vscode.postMessage({ 
        type: 'screenshotData', 
        data: dataUrl 
      });
    } catch (err) {
      vscode.postMessage({ 
        type: 'screenshotError', 
        error: String(err) 
      });
    }
  }
});
</script>
```

---

## Common Pitfalls

### Pitfall 1: Iframe Content Not Captured
**What goes wrong:** html2canvas cannot capture cross-origin iframe content (localhost counts as potentially cross-origin depending on CSP)

**Why it happens:** Browser security restrictions - iframe content is in a different security context

**How to avoid:** Capture the device chrome wrapper (`.device-chrome`) instead of the iframe directly. The preview content will show as a blank/frozen frame in the screenshot, but the UI chrome is captured. Alternatively, accept this limitation for MVP.

**Warning signs:** Console shows `DOMException: Blocked by CSP` or blank areas in screenshot

### Pitfall 2: CORS Issues with External Resources
**What goes wrong:** Images/fonts from external CDNs don't appear in screenshot

**Why it happens:** html2canvas needs CORS headers on external resources

**How to avoid:** 
```javascript
html2canvas(element, {
  useCORS: true,
  allowTaint: true
})
```
Also ensure server serves assets with proper CORS headers

### Pitfall 3: VS Code CSP Blocks External Scripts
**What goes wrong:** Can't load html2canvas from CDN due to Content Security Policy

**Why it happens:** WebView CSP restricts script sources

**How to avoid:** Bundle html2canvas locally in the extension or use inline script approach. VS Code webview CSP allows `vscode-resource:` scheme for local files

### Pitfall 4: Asynchronous Capture Takes Too Long
**What goes wrong:** Screenshot captures before page fully renders

**Why it happens:** html2canvas is async but caller doesn't wait

**How to avoid:** Ensure proper await/then chaining, optionally add timeout

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Browser automation | Custom Puppeteer/Playwright integration | html2canvas | 300MB vs 40KB, over-engineered for this |
| File system access | Custom Node.js fs implementation | vscode.workspace.fs | Extension host already has file APIs |
| Image encoding | Custom canvas encoding | html2canvas.toDataURL() | Well-tested, handles edge cases |

---

## Implementation Steps

### Step 1: Add html2canvas dependency
```bash
cd npm-preview-extension
npm install html2canvas
```

Or bundle it locally and copy to `webview/` folder

### Step 2: Update panel.html
- Add html2canvas script (CDN or local)
- Add message listener for capture request
- Add screenshot capture function
- Send base64 back via postMessage

### Step 3: Update PreviewPanel (previewPanel.ts)
- Add handler for screenshot response message
- Implement save dialog and file write

### Step 4: Update extension.ts
- Implement actual screenshot command (currently placeholder)
- Add to package.json commands if needed

---

## Additional Features from Codebase Analysis

Based on the existing codebase, here are additional potential features to research:

| Feature | Current State | Priority | Notes |
|---------|---------------|----------|-------|
| Screenshot | Placeholder | High | Main research topic |
| Automated tests | None | Medium | TEST_CHECKLIST.md exists but no tests |
| Framework auto-detection | Partial | Low | Only detects 7 frameworks |

---

## Validation Architecture

### Test Framework (if needed for screenshot feature)
| Property | Value |
|----------|-------|
| Framework | VS Code Extension Test (vscode-test) |
| Config file | .vscode/launch.json |
| Quick run | F5 in extension host |
| Full suite | npm test |

### Phase Requirements
Not applicable - this is a feature implementation, not a GSD phase.

---

## Sources

### Primary (HIGH confidence)
- [html2canvas Official Docs](https://html2canvas.org/) - Library API and usage
- [VS Code Webview API](https://code.visualstudio.com/api/extension-guides/webview) - Webview communication pattern
- [Microsoft VS Code Extension Samples - Webview](https://github.com/microsoft/vscode-extension-samples/tree/main/webview-sample) - Official patterns

### Secondary (MEDIUM confidence)
- [Stack Overflow: html2canvas iframe capture](https://stackoverflow.com/questions/64030602/) - Iframe capture limitations confirmed
- [VS Code Discussion: html2canvas in webview](https://github.com/microsoft/vscode-discussions/discussions/210) - CSP and resource loading issues
- [html2canvas npm package](https://www.npmjs.com/package/html2canvas) - Version and installation info

### Tertiary (LOW confidence)
- [WebSearch: VS Code extension screenshot](https://www.google.com/search?q=vs+code+extension+screenshot+webview) - General approaches

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - html2canvas is industry standard for client-side screenshots
- Architecture: HIGH - Webview message pattern is standard VS Code extension practice
- Pitfalls: MEDIUM - Iframe limitations are documented but may vary by browser/VS Code version

**Research date:** 2026-03-26
**Valid until:** 2026-06-26 (html2canvas stable, VS Code webview API stable)