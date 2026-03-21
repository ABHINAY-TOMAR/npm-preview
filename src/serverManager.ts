/**
 * ServerManager
 * - Spawns the npm script as a child process
 * - Watches files for hot-reload triggers
 * - Emits status events to the rest of the extension
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

export class ServerManager {
  private process: cp.ChildProcess | undefined;
  private watcher: vscode.FileSystemWatcher | undefined;
  private callbacks: StatusCallback[] = [];
  private _logs: LogLine[] = [];
  private _port = 3000;
  private _running = false;
  private context: vscode.ExtensionContext;

  public onLogLine?: (line: LogLine) => void;
  public onHotReload?: (file: string) => void;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  async start(script: string): Promise<void> {
    if (this._running) await this.stop();

    const cfg = vscode.workspace.getConfiguration('npmPreview');
    this._port = cfg.get<number>('port', 3000);
    const root = this.workspaceRoot();
    if (!root) throw new Error('No workspace folder open');

    const pkgPath = path.join(root, 'package.json');
    if (!fs.existsSync(pkgPath)) throw new Error('No package.json found in workspace root');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    if (!pkg.scripts?.[script])
      throw new Error(`Script "${script}" not found in package.json`);

    const isWin = process.platform === 'win32';
    this.process = cp.spawn(
      isWin ? 'npm.cmd' : 'npm',
      ['run', script],
      { cwd: root, shell: true, env: { ...process.env, FORCE_COLOR: '0' } }
    );

    this.process.stdout?.on('data', (data: Buffer) =>
      this.handleOutput(data.toString(), 'log')
    );
    this.process.stderr?.on('data', (data: Buffer) =>
      this.handleOutput(data.toString(), 'error')
    );
    this.process.on('exit', () => this.setRunning(false));

    await this.waitForPort(this._port, 30_000);
    this.setRunning(true);

    if (cfg.get<boolean>('hotReload', true)) {
      this.startWatcher(
        cfg.get<string>('watchGlob', '**/*.{js,jsx,ts,tsx,css,html,vue,svelte}')
      );
    }
  }

  async stop(): Promise<void> {
    this.watcher?.dispose();
    if (this.process?.pid) {
      await new Promise<void>((res) => {
        treeKill(this.process!.pid!, 'SIGTERM', () => res());
      });
    }
    this.process = undefined;
    this.setRunning(false);
  }

  private startWatcher(glob: string): void {
    this.watcher = vscode.workspace.createFileSystemWatcher(glob);
    const handler = (uri: vscode.Uri) => {
      const rel = vscode.workspace.asRelativePath(uri);
      this.onHotReload?.(rel);
      this.addLog('info', `HMR triggered by: ${rel}`);
    };
    this.watcher.onDidChange(handler);
    this.watcher.onDidCreate(handler);
    this.watcher.onDidDelete(handler);
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
            reject(new Error(`Timed out waiting for port ${port}`));
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

  onStatusChange(cb: StatusCallback): void {
    this.callbacks.push(cb);
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
}
