/**
 * StatusBarManager
 * Manages the extension's status bar item.
 */
import * as vscode from 'vscode';

export type StatusState = 'running' | 'stopped' | 'idle';

export class StatusBarManager {
  private item: vscode.StatusBarItem;
  private currentState: StatusState = 'stopped';
  private currentPort?: number;

  constructor() {
    this.item = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      100
    );
    this.item.command = 'npmPreview.openPanel';
    this.item.text = '$(globe) NPM Preview';
    this.item.tooltip = 'Click to open NPM Preview panel';
    this.item.show();
  }

  setStatus(state: StatusState, port?: number): void {
    this.currentState = state;
    this.currentPort = port;

    switch (state) {
      case 'running':
        this.item.text = port ? `$(broadcast) :${port}` : '$(broadcast) Running';
        this.item.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
        this.item.tooltip = `NPM Preview running on port ${port || 'unknown'}`;
        break;

      case 'stopped':
        this.item.text = '$(globe) NPM Preview';
        this.item.backgroundColor = undefined;
        this.item.tooltip = 'Click to open NPM Preview panel';
        break;

      case 'idle':
        this.item.text = '$(globe) NPM Preview';
        this.item.backgroundColor = undefined;
        this.item.tooltip = 'Click to open NPM Preview panel';
        break;
    }

    this.item.show();
  }

  getStatus(): { state: StatusState; port?: number } {
    return {
      state: this.currentState,
      port: this.currentPort
    };
  }

  dispose(): void {
    this.item.dispose();
  }
}
