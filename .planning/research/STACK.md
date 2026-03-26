# Technology Stack

**Project:** npm-preview VS Code Extension
**Researched:** 2026-03-26

## Recommended Stack

### Core Framework
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| VS Code API | ^1.85.0 | Extension host | Required for all extension functionality |
| TypeScript | ^5.3.0 | Language | Type safety, better IDE support |
| Node.js | 18+ | Runtime | For running npm scripts in child processes |

### Build & Packaging
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| TypeScript compiler | ^5.3.0 | Type checking & compilation | Standard for VS Code extensions |
| @vscode/vsce | ^2.24.0 | Packaging | Official VS Code extension packager |

### Dependencies
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| tree-kill | ^1.2.2 | Process termination | Gracefully kill npm processes with children |
| portfinder | ^1.0.38 | Port detection | Fallback port finding |
| ws | ^8.16.0 | WebSocket | Listed in deps, appears unused |

### Development Dependencies
| Library | Version | Purpose |
|---------|---------|---------|
| @types/node | ^20.0.0 | Node.js type definitions |
| @types/vscode | ^1.85.0 | VS Code API type definitions |
| @types/ws | ^8.18.1 | WebSocket type definitions |

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Language | TypeScript | JavaScript | Better type safety, IDE support |
| Bundler | None (tsc) | esbuild/webpack | Simpler setup, smaller output |
| Process management | tree-kill | manual pid kill | Handles child processes properly |

## Installation

```bash
# Development
npm install

# Compile TypeScript
npm run compile

# Package for distribution
npm run package

# Publish to marketplace (requires token)
npm run publish
```

## Build Scripts

```json
{
  "scripts": {
    "compile": "tsc -p ./",
    "watch": "tsc -watch -p ./",
    "package": "vsce package",
    "publish": "vsce publish"
  }
}
```

## Sources

- [VS Code Extension API](https://code.visualstudio.com/api)
- [VSCE Documentation](https://github.com/microsoft/vscode-vsce)
- [VS Code Webview Guide](https://code.visualstudio.com/api/extension-guides/webview)
