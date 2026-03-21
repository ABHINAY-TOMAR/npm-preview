"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NpmRunner = void 0;
/**
 * NpmRunner
 * Alternative implementation for running npm scripts with port detection.
 * This module provides advanced port detection using portfinder.
 */
const vscode = __importStar(require("vscode"));
const cp = __importStar(require("child_process"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const tree_kill_1 = __importDefault(require("tree-kill"));
const PORT_REGEX = /(?:localhost|127\.0\.0\.1|0\.0\.0\.0):(\d{2,5})|on port (\d{2,5})|:(\d{4,5})\s/i;
class NpmRunner {
    constructor(statusBar) {
        this.statusBar = statusBar;
    }
    setPreviewPanel(panel) {
        this.previewPanel = panel;
    }
    async getAvailableScripts() {
        const pkgPath = await this.findPackageJson();
        if (!pkgPath)
            return [];
        try {
            const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
            return Object.keys(pkg.scripts ?? {});
        }
        catch {
            return [];
        }
    }
    async start(script, options = {}) {
        await this.stop();
        const cwd = options.cwd ?? await this.getWorkspaceRoot();
        const defaultPort = options.port ?? 3000;
        // Dynamically import portfinder
        try {
            this.portfinder = await Promise.resolve().then(() => __importStar(require('portfinder')));
        }
        catch {
            // portfinder not available, will use default port
        }
        return new Promise((resolve, reject) => {
            const isWindows = process.platform === 'win32';
            const cmd = isWindows ? 'npm.cmd' : 'npm';
            this.process = cp.spawn(cmd, ['run', script], {
                cwd,
                shell: true,
                env: { ...process.env, FORCE_COLOR: '1' },
            });
            let resolved = false;
            const timeout = setTimeout(() => {
                if (!resolved) {
                    this.resolvePort(defaultPort, resolve, reject);
                }
            }, 15000);
            const handleOutput = (data, stream) => {
                const text = data.toString();
                options.onOutput?.(text, stream);
                this.previewPanel?.postMessage({ type: 'npmOutput', text, stream });
                if (!resolved) {
                    const match = PORT_REGEX.exec(text);
                    const port = parseInt(match?.[1] ?? match?.[2] ?? match?.[3] ?? '');
                    if (port && port > 1000) {
                        clearTimeout(timeout);
                        this.currentPort = port;
                        this.currentUrl = `http://localhost:${port}`;
                        resolved = true;
                        this.statusBar.setStatus('running', port);
                        options.onPortDetected?.(port, this.currentUrl);
                        this.previewPanel?.postMessage({
                            type: 'serverStarted',
                            url: this.currentUrl,
                            script,
                            port
                        });
                        resolve(port);
                    }
                }
            };
            this.process.stdout?.on('data', (d) => handleOutput(d, 'stdout'));
            this.process.stderr?.on('data', (d) => handleOutput(d, 'stderr'));
            this.process.on('error', (err) => {
                clearTimeout(timeout);
                this.statusBar.setStatus('idle');
                reject(err);
            });
            this.process.on('exit', (code) => {
                if (!resolved) {
                    clearTimeout(timeout);
                    this.statusBar.setStatus('idle');
                    this.previewPanel?.postMessage({ type: 'serverStopped' });
                    if (!code) {
                        this.resolvePort(defaultPort, resolve, reject);
                    }
                    else {
                        reject(new Error(`npm run ${script} exited with code ${code}`));
                    }
                }
                this.statusBar.setStatus('stopped');
                options.onExit?.(code);
            });
        });
    }
    resolvePort(defaultPort, resolve, reject) {
        if (this.portfinder) {
            this.portfinder.getPort({ port: defaultPort }, (err, port) => {
                if (!err) {
                    this.currentPort = port;
                    this.currentUrl = `http://localhost:${port}`;
                    this.statusBar.setStatus('running', port);
                    resolve(port);
                }
                else {
                    reject(new Error('Could not detect dev server port'));
                }
            });
        }
        else {
            this.currentPort = defaultPort;
            this.currentUrl = `http://localhost:${defaultPort}`;
            this.statusBar.setStatus('running', defaultPort);
            resolve(defaultPort);
        }
    }
    async stop() {
        if (this.process?.pid) {
            await new Promise((res) => {
                (0, tree_kill_1.default)(this.process.pid, 'SIGTERM', () => res());
            });
            this.process = undefined;
            this.currentPort = undefined;
            this.currentUrl = undefined;
            this.statusBar.setStatus('stopped');
        }
    }
    getCurrentUrl() {
        return this.currentUrl;
    }
    getCurrentPort() {
        return this.currentPort;
    }
    isRunning() {
        return this.process !== undefined && !this.process.killed;
    }
    async findPackageJson() {
        const root = await this.getWorkspaceRoot();
        const p = path.join(root, 'package.json');
        return fs.existsSync(p) ? p : undefined;
    }
    async getWorkspaceRoot() {
        const folders = vscode.workspace.workspaceFolders;
        if (!folders?.length)
            throw new Error('No workspace folder open');
        return folders[0].uri.fsPath;
    }
}
exports.NpmRunner = NpmRunner;
//# sourceMappingURL=npmRunner.js.map