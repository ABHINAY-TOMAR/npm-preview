/**
 * NpmRunner
 * Alternative implementation for running npm scripts with port detection.
 * This module provides advanced port detection using portfinder.
 */
import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import treeKill from 'tree-kill';
import { StatusBarManager } from './statusBar';
import { PreviewPanel } from './previewPanel';

const PORT_REGEX = /(?:localhost|127\.0\.0\.1|0\.0\.0\.0):(\d{2,5})|on port (\d{2,5})|:(\d{4,5})\s/i;

export interface NpmRunnerOptions {
  cwd?: string;
  port?: number;
  onPortDetected?: (port: number, url: string) => void;
  onOutput?: (text: string, stream: 'stdout' | 'stderr') => void;
  onExit?: (code: number | null) => void;
}

export class NpmRunner {
  private process: cp.ChildProcess | undefined;
  private currentPort: number | undefined;
  private currentUrl: string | undefined;
  private statusBar: StatusBarManager;
  private previewPanel: PreviewPanel | undefined;
  private portfinder: typeof import('portfinder') | undefined;

  constructor(statusBar: StatusBarManager) {
    this.statusBar = statusBar;
  }

  setPreviewPanel(panel: PreviewPanel): void {
    this.previewPanel = panel;
  }

  async getAvailableScripts(): Promise<string[]> {
    const pkgPath = await this.findPackageJson();
    if (!pkgPath) return [];
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      return Object.keys(pkg.scripts ?? {});
    } catch {
      return [];
    }
  }

  async start(script: string, options: NpmRunnerOptions = {}): Promise<number> {
    await this.stop();

    const cwd = options.cwd ?? await this.getWorkspaceRoot();
    const defaultPort = options.port ?? 3000;

    // Dynamically import portfinder
    try {
      this.portfinder = await import('portfinder');
    } catch {
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

      const handleOutput = (data: Buffer, stream: 'stdout' | 'stderr') => {
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
          } else {
            reject(new Error(`npm run ${script} exited with code ${code}`));
          }
        }
        this.statusBar.setStatus('stopped');
        options.onExit?.(code);
      });
    });
  }

  private resolvePort(
    defaultPort: number,
    resolve: (port: number) => void,
    reject: (reason: Error) => void
  ): void {
    if (this.portfinder) {
      this.portfinder.getPort({ port: defaultPort }, (err: Error | null | undefined, port: number) => {
        if (!err) {
          this.currentPort = port;
          this.currentUrl = `http://localhost:${port}`;
          this.statusBar.setStatus('running', port);
          resolve(port);
        } else {
          reject(new Error('Could not detect dev server port'));
        }
      });
    } else {
      this.currentPort = defaultPort;
      this.currentUrl = `http://localhost:${defaultPort}`;
      this.statusBar.setStatus('running', defaultPort);
      resolve(defaultPort);
    }
  }

  async stop(): Promise<void> {
    if (this.process?.pid) {
      await new Promise<void>((res) => {
        treeKill(this.process!.pid!, 'SIGTERM', () => res());
      });
      this.process = undefined;
      this.currentPort = undefined;
      this.currentUrl = undefined;
      this.statusBar.setStatus('stopped');
    }
  }

  getCurrentUrl(): string | undefined {
    return this.currentUrl;
  }

  getCurrentPort(): number | undefined {
    return this.currentPort;
  }

  isRunning(): boolean {
    return this.process !== undefined && !this.process.killed;
  }

  private async findPackageJson(): Promise<string | undefined> {
    const root = await this.getWorkspaceRoot();
    const p = path.join(root, 'package.json');
    return fs.existsSync(p) ? p : undefined;
  }

  private async getWorkspaceRoot(): Promise<string> {
    const folders = vscode.workspace.workspaceFolders;
    if (!folders?.length) throw new Error('No workspace folder open');
    return folders[0].uri.fsPath;
  }
}
