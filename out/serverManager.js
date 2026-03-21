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
exports.ServerManager = void 0;
/**
 * ServerManager
 * - Spawns the npm script as a child process
 * - Watches files for hot-reload triggers
 * - Emits status events to the rest of the extension
 */
const vscode = __importStar(require("vscode"));
const cp = __importStar(require("child_process"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const tree_kill_1 = __importDefault(require("tree-kill"));
class ServerManager {
    constructor(context) {
        this.callbacks = [];
        this._logs = [];
        this._port = 3000;
        this._running = false;
        this.context = context;
    }
    async start(script) {
        if (this._running)
            await this.stop();
        const cfg = vscode.workspace.getConfiguration('npmPreview');
        this._port = cfg.get('port', 3000);
        const root = this.workspaceRoot();
        if (!root)
            throw new Error('No workspace folder open');
        const pkgPath = path.join(root, 'package.json');
        if (!fs.existsSync(pkgPath))
            throw new Error('No package.json found in workspace root');
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
        if (!pkg.scripts?.[script])
            throw new Error(`Script "${script}" not found in package.json`);
        const isWin = process.platform === 'win32';
        this.process = cp.spawn(isWin ? 'npm.cmd' : 'npm', ['run', script], { cwd: root, shell: true, env: { ...process.env, FORCE_COLOR: '0' } });
        this.process.stdout?.on('data', (data) => this.handleOutput(data.toString(), 'log'));
        this.process.stderr?.on('data', (data) => this.handleOutput(data.toString(), 'error'));
        this.process.on('exit', () => this.setRunning(false));
        await this.waitForPort(this._port, 30000);
        this.setRunning(true);
        if (cfg.get('hotReload', true)) {
            this.startWatcher(cfg.get('watchGlob', '**/*.{js,jsx,ts,tsx,css,html,vue,svelte}'));
        }
    }
    async stop() {
        this.watcher?.dispose();
        if (this.process?.pid) {
            await new Promise((res) => {
                (0, tree_kill_1.default)(this.process.pid, 'SIGTERM', () => res());
            });
        }
        this.process = undefined;
        this.setRunning(false);
    }
    startWatcher(glob) {
        this.watcher = vscode.workspace.createFileSystemWatcher(glob);
        const handler = (uri) => {
            const rel = vscode.workspace.asRelativePath(uri);
            this.onHotReload?.(rel);
            this.addLog('info', `HMR triggered by: ${rel}`);
        };
        this.watcher.onDidChange(handler);
        this.watcher.onDidCreate(handler);
        this.watcher.onDidDelete(handler);
    }
    handleOutput(raw, level) {
        const lines = raw.split('\n').filter((l) => l.trim());
        for (const line of lines) {
            const lvl = /warn/i.test(line) ? 'warn' : /error/i.test(line) ? 'error' : level;
            this.addLog(lvl, line.trim());
        }
    }
    addLog(level, message) {
        const line = {
            time: new Date().toLocaleTimeString('en-US', { hour12: false }),
            level,
            message,
        };
        this._logs.push(line);
        if (this._logs.length > 500)
            this._logs.shift();
        this.onLogLine?.(line);
    }
    setRunning(val) {
        this._running = val;
        this.callbacks.forEach((cb) => cb(val, this._port));
    }
    waitForPort(port, timeout) {
        return new Promise((resolve, reject) => {
            const start = Date.now();
            const net = require('net');
            const check = () => {
                const s = net.createConnection({ port }, () => {
                    s.destroy();
                    resolve();
                });
                s.on('error', () => {
                    if (Date.now() - start > timeout) {
                        reject(new Error(`Timed out waiting for port ${port}`));
                    }
                    else {
                        setTimeout(check, 500);
                    }
                });
            };
            check();
        });
    }
    workspaceRoot() {
        return vscode.workspace.workspaceFolders?.[0].uri.fsPath;
    }
    onStatusChange(cb) {
        this.callbacks.push(cb);
    }
    get logs() {
        return [...this._logs];
    }
    get port() {
        return this._port;
    }
    get running() {
        return this._running;
    }
    clearLogs() {
        this._logs = [];
    }
}
exports.ServerManager = ServerManager;
//# sourceMappingURL=serverManager.js.map