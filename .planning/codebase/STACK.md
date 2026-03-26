# Technology Stack

**Analysis Date:** 2026-03-26

## Languages

**Primary:**
- TypeScript 5.3.0 - All extension source code
- JavaScript - Compiled output, WebView scripts in HTML
- HTML/CSS - WebView UI (embedded in `panel.html`)

**Secondary:**
- SVG - Icon assets

## Runtime

**Environment:**
- VS Code Extension Host (Node.js)
- Minimum VS Code: 1.85.0

**Package Manager:**
- npm (standard Node.js)
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**
- VS Code Extension API (`@types/vscode` ^1.85.0) - Extension framework

**Build/Dev:**
- TypeScript ^5.3.0 - Language compiler
- `@vscode/vsce` ^2.24.0 - VSIX packaging tool

**Dependencies:**
- `tree-kill` ^1.2.2 - Kill npm process and all children
- `ws` ^8.16.0 - WebSocket library (listed but NOT used in code)
- `portfinder` ^1.0.38 - Port detection (listed but NOT used - manual implementation)

## Key Dependencies

**Critical:**
- `@types/vscode` ^1.85.0 - VS Code API type definitions
- `typescript` ^5.3.0 - TypeScript compiler
- `tree-kill` ^1.2.2 - Process tree termination

**Unused but Listed:**
- `ws` ^8.16.0 - WebSocket library (imported but not used)
- `portfinder` ^1.0.38 - Port finder (declared but not imported)

## Configuration

**Build:**
- `tsconfig.json` - TypeScript compilation settings
- `package.json` - Extension manifest with `contributes`

**Extension Packaging:**
- `.vscodeignore` - Files excluded from VSIX
- `vsce package` - Creates distributable .vsix file

## Platform Requirements

**Development:**
- Node.js 18+
- npm 8+
- VS Code 1.85.0+ (for testing)
- TypeScript 5.3.0+

**Production:**
- VS Code 1.85.0+ (user machine)
- Node.js 18+ (for running npm scripts)

---

*Stack analysis: 2026-03-26*
