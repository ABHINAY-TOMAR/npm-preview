/**
 * ServerManager
 * - Spawns the npm script as a child process
 * - Watches files for hot-reload triggers
 * - Emits status events to the rest of the extension
 * - Auto-detects port and framework
 */
import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import treeKill from 'tree-kill';

type StatusCallback = (running: boolean, port: number) => void;

interface LogLine {
  time: string;
  level: 'log' | 'warn' | 'error' | 'info';
  message: string;
}

const FRAMEWORK_PORTS: Record<string, { port: number; script: string }> = {
  next: { port: 3000, script: 'dev' },
  'nuxt': { port: 3000, script: 'dev' },
  'vite': { port: 5173, script: 'dev' },
  'webpack': { port: 8080, script: 'start' },
  'parcel': { port: 1234, script: 'start' },
  'remix': { port: 3000, script: 'dev' },
  'astro': { port: 4321, script: 'dev' },
  'svelte-kit': { port: 5173, script: 'dev' },
};

function detectPortFromOutput(output: string, fallbackPort: number): number {
  const patterns = [
    /localhost:(\d{4,5})/i,
    /127\.0\.0\.1:(\d{4,5})/i,
    /http:\/\/[^:]+:(\d{4,5})/i,
    /listening on .*:(\d{4,5})/i,
    /running at .*:(\d{4,5})/i,
    /port\s*[:=]?\s*(\d{4,5})/i,
    /Server running at.*:(\d{4,5})/i,
    /Ready on.*:(\d{4,5})/i,
    /Local.*:(\d{4,5})/i,
  ];

  for (const pattern of patterns) {
    const match = output.match(pattern);
    if (match) {
      const port = parseInt(match[1]);
      if (port >= 1000 && port <= 65535) {
        return port;
      }
    }
  }
  return fallbackPort;
}

function detectFramework(pkg: Record<string, unknown>): { framework: string; port: number; script: string } | null {
  const deps = { ...(pkg.dependencies as Record<string, string> || {}), ...(pkg.devDependencies as Record<string, string> || {}) };
  
  for (const [framework, config] of Object.entries(FRAMEWORK_PORTS)) {
    if (deps[framework] || deps[`@${framework}`] || deps[`${framework.toLowerCase()}`]) {
      return { framework, ...config };
    }
  }
  return null;
}

function detectBestScript(scripts: Record<string, string>): string | null {
  const priority = ['dev', 'development', 'start', 'serve', 'preview', 'build:dev'];
  for (const name of priority) {
    if (scripts[name]) return name;
  }
  const keys = Object.keys(scripts);
  return keys.length > 0 ? keys[0] : null;
}

export class ServerManager {
  private process: cp.ChildProcess | undefined;
  private watcher: vscode.FileSystemWatcher | undefined;
  private callbacks: StatusCallback[] = [];
  private _logs: LogLine[] = [];
  private _port = 3000;
  private _running = false;
  private context: vscode.ExtensionContext;
  private disposed = false;

  public onLogLine?: (line: LogLine) => void;
  public onHotReload?: (file: string) => void;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  async start(script: string): Promise<void> {
    if (this._running) await this.stop();
    if (this.disposed) throw new Error('ServerManager has been disposed');

    const cfg = vscode.workspace.getConfiguration('npmPreview');
    const root = this.workspaceRoot();
    if (!root) throw new Error('No workspace folder open');

    const pkgPath = path.join(root, 'package.json');
    if (!fs.existsSync(pkgPath)) throw new Error('No package.json found in workspace root');
    
    let pkg: Record<string, unknown>;
    try {
      pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    } catch (err) {
      throw new Error(`Failed to parse package.json: ${err instanceof Error ? err.message : String(err)}`);
    }
    
    const scripts = pkg.scripts as Record<string, string> || {};
    
    if (!scripts[script]) {
      const suggestions = detectBestScript(scripts);
      throw new Error(
        `Script "${script}" not found. ${suggestions ? `Try "${suggestions}" or use "NPM Preview: Run Script" to select.` : `No scripts found in package.json.`}`
      );
    }

    const framework = detectFramework(pkg);
    if (framework) {
      this.addLog('info', `Detected ${framework.framework} framework`);
      if (this._port === 3000) {
        this._port = framework.port;
        this.addLog('info', `Auto-detected port ${framework.port}`);
      }
    } else {
      this._port = cfg.get<number>('port', 3000);
    }

    const isWin = process.platform === 'win32';
    this.process = cp.spawn(
      isWin ? 'npm.cmd' : 'npm',
      ['run', script],
      { cwd: root, shell: true, env: { ...process.env, FORCE_COLOR: '0' } }
    );

    // Handle process errors
    this.process.on('error', (err) => {
      this.addLog('error', `Process error: ${err.message}`);
    });

    // Handle process exit with code
    this.process.on('exit', (code, signal) => {
      if (!this.disposed) {
        this.addLog('info', `Process exited with code ${code}, signal ${signal}`);
        this.setRunning(false);
      }
    });

    // Collect output for port detection with debouncing
    let outputBuffer = '';
    let portDetectionTimeout: NodeJS.Timeout | undefined;
    
    const checkPortFromBuffer = (): void => {
      const detectedPort = detectPortFromOutput(outputBuffer, this._port);
      if (detectedPort !== this._port && detectedPort !== 3000) {
        this.addLog('info', `Auto-detected port ${detectedPort} from output`);
        this._port = detectedPort;
      }
    };

    this.process.stdout?.on('data', (data: Buffer) => {
      const text = data.toString();
      outputBuffer += text;
      this.handleOutput(text, 'log');
      
      // Debounce port detection
      if (portDetectionTimeout) clearTimeout(portDetectionTimeout);
      portDetectionTimeout = setTimeout(checkPortFromBuffer, 500);
    });
    this.process.stderr?.on('data', (data: Buffer) => {
      const text = data.toString();
      outputBuffer += text;
      this.handleOutput(text, 'error');
    });

    try {
      // Wait a bit for initial output, then detect port
      await new Promise(resolve => setTimeout(resolve, 2000));
      checkPortFromBuffer();
      
      await this.waitForPort(this._port, 30_000);
      this.setRunning(true);
      
      // Clear the timeout if still pending
      if (portDetectionTimeout) clearTimeout(portDetectionTimeout);
    } catch {
      const suggestions: string[] = [];
      if (framework) suggestions.push(`${framework.framework} typically uses port ${framework.port}`);
      suggestions.push('Check if your dev server started correctly');
      suggestions.push('Try adjusting the port in settings (npmPreview.port)');
      
      throw new Error(
        `Could not connect to dev server on port ${this._port}.\n` +
        `Suggestions:\n- ${suggestions.join('\n- ')}`
      );
    }

    if (cfg.get<boolean>('hotReload', true)) {
      this.startWatcher(
        cfg.get<string>('watchGlob', '**/*.{js,jsx,ts,tsx,css,html,vue,svelte}')
      );
    }
  }

  async stop(): Promise<void> {
    // Dispose the watcher first
    if (this.watcher) {
      this.watcher.dispose();
      this.watcher = undefined;
    }
    
    if (this.process?.pid) {
      const pid = this.process.pid;
      await new Promise<void>((resolve, reject) => {
        treeKill(pid, 'SIGTERM', (err) => {
          if (err) {
            // Try SIGKILL as fallback on Windows
            if (process.platform === 'win32') {
              treeKill(pid, 'SIGKILL', (killErr) => {
                if (killErr) {
                  this.addLog('warn', `Failed to kill process ${pid}: ${killErr.message}`);
                  reject(killErr);
                } else {
                  resolve();
                }
              });
            } else {
              this.addLog('warn', `Failed to stop process ${pid}: ${err.message}`);
              reject(err);
            }
          } else {
            resolve();
          }
        });
      });
    }
    this.process = undefined;
    this.setRunning(false);
  }

  private startWatcher(glob: string): void {
    try {
      // Dispose existing watcher if any
      this.watcher?.dispose();
      
      this.watcher = vscode.workspace.createFileSystemWatcher(glob);
      
      const handler = (uri: vscode.Uri): void => {
        try {
          const rel = vscode.workspace.asRelativePath(uri);
          this.onHotReload?.(rel);
          this.addLog('info', `HMR triggered by: ${rel}`);
        } catch (err) {
          this.addLog('error', `Error handling file change: ${err instanceof Error ? err.message : String(err)}`);
        }
      };
      
      this.watcher.onDidChange(handler);
      this.watcher.onDidCreate(handler);
      this.watcher.onDidDelete(handler);
      
      // Handle watcher errors
      this.watcher.onDidChange(() => {/* Watcher is active */});
    } catch (err) {
      this.addLog('error', `Failed to create file watcher: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  private handleOutput(raw: string, level: 'log' | 'error'): void {
    const lines = raw.split('\n').filter((l) => l.trim());
    for (const line of lines) {
      const lvl =
        /warn/i.test(line) ? 'warn' : /error/i.test(line) ? 'error' : level;
      this.addLog(lvl, line.trim());
    }
  }

  private addLog(level: LogLine['level'], message: string): void {
    const line: LogLine = {
      time: new Date().toLocaleTimeString('en-US', { hour12: false }),
      level,
      message,
    };
    this._logs.push(line);
    if (this._logs.length > 500) this._logs.shift();
    this.onLogLine?.(line);
  }

  private setRunning(val: boolean): void {
    this._running = val;
    this.callbacks.forEach((cb) => cb(val, this._port));
  }

  private waitForPort(port: number, timeout: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const start = Date.now();
      const net = require('net') as typeof import('net');
      const check = (): void => {
        const s = net.createConnection({ port }, () => {
          s.destroy();
          resolve();
        });
        s.on('error', () => {
          if (Date.now() - start > timeout) {
            reject(new Error(`TIMEOUT: Server not ready on port ${port} after ${Math.round(timeout / 1000)}s`));
          } else {
            setTimeout(check, 500);
          }
        });
      };
      check();
    });
  }

  private workspaceRoot(): string | undefined {
    return vscode.workspace.workspaceFolders?.[0].uri.fsPath;
  }

  onStatusChange(cb: StatusCallback): { dispose: () => void } {
    this.callbacks.push(cb);
    // Return a disposable to allow removing the callback
    return {
      dispose: () => {
        const index = this.callbacks.indexOf(cb);
        if (index !== -1) {
          this.callbacks.splice(index, 1);
        }
      }
    };
  }

  removeAllCallbacks(): void {
    this.callbacks = [];
  }

  get logs(): LogLine[] {
    return [...this._logs];
  }

  get port(): number {
    return this._port;
  }

  get running(): boolean {
    return this._running;
  }

  clearLogs(): void {
    this._logs = [];
  }
  
  dispose(): void {
    this.disposed = true;
    this.watcher?.dispose();
    this.watcher = undefined;
    this.callbacks = [];
    this._logs = [];
    if (this.process?.pid) {
      try {
        treeKill(this.process.pid, 'SIGTERM');
      } catch {
        // Ignore errors during disposal
      }
    }
    this.process = undefined;
  }
}
