/**
 * ScriptsTreeProvider
 * Reads package.json scripts and shows them in the sidebar tree.
 */
import * as vscode from 'vscode';
import * as path   from 'path';
import * as fs     from 'fs';

export class ScriptItem extends vscode.TreeItem {
  constructor(public readonly scriptName: string, public readonly scriptCmd: string) {
    super(scriptName, vscode.TreeItemCollapsibleState.None);
    this.tooltip      = `npm run ${scriptName}: ${scriptCmd}`;
    this.description  = scriptCmd.length > 40 ? scriptCmd.slice(0, 40) + '…' : scriptCmd;
    this.iconPath     = new vscode.ThemeIcon('terminal');
    this.command = {
      command:   'npmPreview.runScript',
      title:     'Run Script',
      arguments: [scriptName],
    };
  }
}

export class ScriptsTreeProvider implements vscode.TreeDataProvider<ScriptItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<ScriptItem | undefined>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  refresh() { this._onDidChangeTreeData.fire(undefined); }

  getTreeItem(el: ScriptItem) { return el; }

  async getChildren(): Promise<ScriptItem[]> {
    const scripts = await this.readScripts();
    return Object.entries(scripts).map(([k, v]) => new ScriptItem(k, v as string));
  }

  async getScriptNames(): Promise<string[]> {
    const scripts = await this.readScripts();
    return Object.keys(scripts);
  }

  private async readScripts(): Promise<Record<string, string>> {
    const root = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!root) return {};
    const pkgPath = path.join(root, 'package.json');
    if (!fs.existsSync(pkgPath)) return {};
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      return pkg.scripts ?? {};
    } catch {
      return {};
    }
  }
}
