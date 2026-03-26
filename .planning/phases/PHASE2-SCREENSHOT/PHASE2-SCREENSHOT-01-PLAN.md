---
phase: PHASE2-SCREENSHOT
plan: '01'
type: execute
wave: 1
depends_on: []
files_modified:
  - npm-preview-extension/package.json
  - npm-preview-extension/webview/panel.html
  - npm-preview-extension/src/previewPanel.ts
  - npm-preview-extension/src/extension.ts
autonomous: false
requirements:
  - SS-01
  - SS-02
  - SS-03

must_haves:
  truths:
    - "Screenshot button appears in webview toolbar"
    - "Clicking button captures the preview device chrome"
    - "File is saved to user-selected location with notification"
    - "Cross-origin limitation acknowledged (iframe content may be blank)"
  artifacts:
    - path: "npm-preview-extension/webview/panel.html"
      provides: "Toolbar with screenshot button + html2canvas capture logic"
      min_lines: 390
    - path: "npm-preview-extension/src/previewPanel.ts"
      provides: "Message handler for screenshot data response"
      contains: "screenshotData"
    - path: "npm-preview-extension/src/extension.ts"
      provides: "Screenshot command implementation (replaces placeholder)"
      contains: "takeScreenshot"
    - path: "npm-preview-extension/package.json"
      provides: "html2canvas dependency added"
      contains: "html2canvas"
  key_links:
    - from: "panel.html button"
      to: "previewPanel.ts handleMessage"
      via: "vscode.postMessage({command: 'takeScreenshot'})"
      pattern: "takeScreenshot"
    - from: "previewPanel.ts"
      to: "extension.ts command"
      via: "postMessage({type: 'screenshotData', data})"
      pattern: "screenshotData"
---

<objective>
Implement functional screenshot capability using html2canvas for DOM capture.

Purpose: Users can click a button in the webview toolbar to capture the preview content and save it as a PNG file.

Output: Working screenshot feature with file save dialog
</objective>

<execution_context>
@D:\PROJECTS\npm-preview-extension\npm-preview-extension\.planning\research\SCREENSHOT.md
</execution_context>

<context>
## Current State

The extension has a placeholder screenshot command (`npmPreview.takeScreenshot`) that shows "coming soon" message.

### Files to Modify

**panel.html (lines 104-123)** - Toolbar section:
- Has Run, Stop, Reload buttons
- Need to add Screenshot button between reload and URL bar

**previewPanel.ts (lines 124-154)** - handleMessage method:
- Already handles 'takeScreenshot' command by executing the VS Code command
- Need to add handler for 'screenshotData' response from webview

**extension.ts (lines 171-178)** - Current placeholder:
```typescript
// ── Take Screenshot (placeholder) ───────────────────────────
context.subscriptions.push(
  vscode.commands.registerCommand('npmPreview.takeScreenshot', () => {
    vscode.window.showInformationMessage(
      'Screenshot feature coming soon!'
    );
  })
);
```
Need to replace with actual implementation that:
1. Posts 'captureScreenshot' message to webview
2. Waits for 'screenshotData' response
3. Opens save dialog
4. Writes file to disk

### Architecture Flow

```
extension.ts command → postMessage({type: 'captureScreenshot'}) → 
panel.html listens → html2canvas captures → 
postMessage({type: 'screenshotData', data: base64}) → 
previewPanel.ts receives → saves to file
```
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add html2canvas dependency</name>
  <files>npm-preview-extension/package.json</files>
  <action>
    Add html2canvas@^1.4.1 to dependencies in package.json.
    
    Edit dependencies section to add:
    ```json
    "html2canvas": "^1.4.1"
    ```
    
    This library will be used by the webview to capture the DOM as an image.
  </action>
  <verify>
    <automated>grep -q '"html2canvas"' npm-preview-extension/package.json</automated>
  </verify>
  <done>html2canvas added to package.json dependencies</done>
</task>

<task type="auto">
  <name>Task 2: Add screenshot button and capture logic to panel.html</name>
  <files>npm-preview-extension/webview/panel.html</files>
  <action>
    Add screenshot button to toolbar and implement capture logic using html2canvas.

    **Step 2a: Add button to toolbar (after line 122)**
    Add after the HMR button:
    ```html
    <button class="btn" id="btnScreenshot" onclick="takeScreenshot()" title="Capture screenshot">📷</button>
    ```

    **Step 2b: Add html2canvas script (before </body>)**
    Add script include before the closing </body> tag:
    ```html
    <script src="https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js"></script>
    ```

    **Step 2c: Add capture function (in script section)**
    Add after the send function (around line 186):
    ```javascript
    async function takeScreenshot() {
      try {
        const element = document.getElementById('deviceChrome');
        if (!element) {
          vscode.postMessage({ type: 'screenshotError', error: 'No preview to capture' });
          return;
        }
        const canvas = await html2canvas(element, {
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#1a1a28'
        });
        const dataUrl = canvas.toDataURL('image/png');
        vscode.postMessage({ type: 'screenshotData', data: dataUrl });
      } catch (err) {
        vscode.postMessage({ type: 'screenshotError', error: String(err) });
      }
    }
    ```

    **Step 2d: Handle capture request from extension**
    Add in the window message listener (around line 198):
    ```javascript
    case 'captureScreenshot':
      takeScreenshot(); break;
    ```

    Note: The iframe content cannot be captured due to cross-origin restrictions - this is expected. The device chrome will be captured with the iframe showing as blank/frozen.
  </action>
  <verify>
    <automated>grep -q "takeScreenshot" npm-preview-extension/webview/panel.html && grep -q "html2canvas" npm-preview-extension/webview/panel.html</automated>
  </verify>
  <done>Screenshot button visible in toolbar, capture logic implemented</done>
</task>

<task type="auto">
  <name>Task 3: Add screenshot response handler in previewPanel.ts</name>
  <files>npm-preview-extension/src/previewPanel.ts</files>
  <action>
    Add handler for screenshot data response from webview in previewPanel.ts.

    **Update handleMessage method (around line 124):**
    Add a new case in the switch statement after line 152:
    ```typescript
    case 'screenshotData':
      // Save the base64 image to disk via extension command
      vscode.commands.executeCommand('npmPreview.saveScreenshot', msg.data);
      break;
    case 'screenshotError':
      vscode.window.showErrorMessage(`Screenshot failed: ${msg.error}`);
      break;
    ```

    Then add the new command registration in extension.ts (next task).
  </action>
  <verify>
    <automated>grep -q "screenshotData" npm-preview-extension/src/previewPanel.ts</automated>
  </verify>
  <done>previewPanel.ts handles screenshot response messages</done>
</task>

<task type="auto">
  <name>Task 4: Implement actual screenshot command in extension.ts</name>
  <files>npm-preview-extension/src/extension.ts</files>
  <action>
    Replace the placeholder screenshot command with actual implementation.

    **Replace lines 171-178 with:**

    ```typescript
    // ── Take Screenshot ──────────────────────────────────────────
    context.subscriptions.push(
      vscode.commands.registerCommand('npmPreview.takeScreenshot', async () => {
        const panel = PreviewPanel.currentPanel;
        if (!panel) {
          vscode.window.showWarningMessage('No preview panel open');
          return;
        }
        
        // Request capture from webview
        panel.postMessage({ type: 'captureScreenshot' });
        
        vscode.window.setStatusBarMessage('$(camera) Capturing screenshot...', 2000);
      })
    );

    // ── Save Screenshot ───────────────────────────────────────────
    context.subscriptions.push(
      vscode.commands.registerCommand('npmPreview.saveScreenshot', async (_: unknown, base64Data: string) => {
        try {
          // Remove data URL prefix
          const base64 = base64Data.replace(/^data:image\/png;base64,/, '');
          const buffer = Buffer.from(base64, 'base64');
          
          // Open save dialog
          const uri = await vscode.window.showSaveDialog({
            defaultUri: vscode.Uri.file(`screenshot-${Date.now()}.png`),
            filters: [
              { name: 'PNG Image', extensions: ['png'] },
              { name: 'All Files', extensions: ['*'] }
            ]
          });
          
          if (uri) {
            await vscode.workspace.fs.writeFile(uri, buffer);
            vscode.window.showInformationMessage(`📷 Screenshot saved to ${uri.fsPath}`);
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          vscode.window.showErrorMessage(`Failed to save screenshot: ${message}`);
        }
      })
    );
    ```

    Note: The first parameter (_) is required because VS Code passes the command arguments as subsequent parameters.
  </action>
  <verify>
    <automated>grep -q "saveScreenshot" npm-preview-extension/src/extension.ts</automated>
  </verify>
  <done>Screenshot command saves file and shows notification</done>
</task>

</tasks>

<verification>
## Overall Phase Verification

1. **Build check:**
   ```bash
   cd npm-preview-extension && npm run compile
   ```
   Should compile without errors

2. **Manual verification steps:**
   - Open VS Code with extension loaded
   - Start a dev server (Ctrl+Shift+R)
   - Look for camera 📷 button in toolbar
   - Click the button
   - Save dialog should appear
   - File should be saved as PNG
   - Success notification should appear
</verification>

<success_criteria>
1. Screenshot button visible in webview toolbar ✓
2. Clicking button captures current iframe content (device chrome) ✓
3. File saved to user-selected location with notification ✓
4. Cross-origin limitation acknowledged (iframe shows blank in screenshot) ✓
</success_criteria>

<output>
After completion, create `.planning/phases/PHASE2-SCREENSHOT/PHASE2-SCREENSHOT-01-SUMMARY.md`
</output>
