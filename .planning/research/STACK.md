# Technology Stack

**Project:** NPM Preview VS Code Extension
**Researched:** March 2026

## Recommended Stack

### Core Technologies
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| TypeScript | ^5.3.0 | Extension language | Type safety, VS Code API support |
| @types/vscode | ^1.85.0 | VS Code API types | IDE autocomplete, type checking |
| @vscode/vsce | ^2.24.0 | Publishing tool | Official marketplace packaging |
| tree-kill | ^1.2.2 | Process termination | Cross-platform npm process cleanup |
| ws | ^8.16.0 | WebSocket | Optional: custom HMR bridge |

### Build Tools
| Technology | Purpose | Notes |
|------------|---------|-------|
| TypeScript (tsc) | Compile TS → JS | Simple, no bundler needed for this project |
| vsce | Package extension | Creates .vsix for marketplace |

### Alternative Approaches Considered

| Category | Current Choice | Alternative | Why Not |
|----------|---------------|-------------|---------|
| Bundler | None (tsc only) | esbuild/webpack | Overkill for vanilla webview |
| Process management | tree-kill | cross-spawn | tree-kill is sufficient and smaller |
| Webview framework | Vanilla JS | React/Vue | Complexity not justified; HTML is well-structured |

## Installation

```bash
# Development
npm install

# Compile TypeScript
npm run compile

# Watch mode
npm run watch

# Package for distribution
npm run package

# Publish to marketplace
npm run publish
```

## TypeScript Configuration

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "target": "ES2020",
    "outDir": "./out",
    "rootDir": "./src",
    "lib": ["ES2020"],
    "strict": true,
    "esModuleInterop": true,
    "sourceMap": true,
    "skipLibCheck": true
  }
}
```

**Note:** `lib: ["ES2020"]` without DOM is intentional - webview runs separately.

## Dependencies Justification

### tree-kill
- **Problem:** `process.kill()` only kills immediate process, not children
- **Solution:** tree-kill traverses and kills entire process tree
- **Usage:** `tree-kill(pid, 'SIGTERM')` in serverManager.ts stop() method

### ws (WebSocket)
- **Current:** Not actively used
- **Future:** Could enable custom HMR protocol instead of file watching
- **Recommendation:** Keep as optional dependency for now

## Sources

- [VS Code Extension API - Extension Anatomy](https://code.visualstudio.com/api/get-started/extension-anatomy)
- [tree-kill npm package](https://www.npmjs.com/package/tree-kill)
- [VS Code Extension Samples](https://github.com/microsoft/vscode-extension-samples)
