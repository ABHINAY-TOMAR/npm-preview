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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScriptsTreeProvider = exports.ScriptItem = void 0;
/**
 * ScriptsTreeProvider
 * Reads package.json scripts and shows them in the sidebar tree.
 */
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
class ScriptItem extends vscode.TreeItem {
    constructor(scriptName, scriptCmd) {
        super(scriptName, vscode.TreeItemCollapsibleState.None);
        this.scriptName = scriptName;
        this.scriptCmd = scriptCmd;
        this.tooltip = `npm run ${scriptName}: ${scriptCmd}`;
        this.description = scriptCmd.length > 40 ? scriptCmd.slice(0, 40) + '…' : scriptCmd;
        this.iconPath = new vscode.ThemeIcon('terminal');
        this.command = {
            command: 'npmPreview.runScript',
            title: 'Run Script',
            arguments: [scriptName],
        };
    }
}
exports.ScriptItem = ScriptItem;
class ScriptsTreeProvider {
    constructor() {
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    }
    refresh() { this._onDidChangeTreeData.fire(undefined); }
    getTreeItem(el) { return el; }
    async getChildren() {
        const scripts = await this.readScripts();
        return Object.entries(scripts).map(([k, v]) => new ScriptItem(k, v));
    }
    async getScriptNames() {
        const scripts = await this.readScripts();
        return Object.keys(scripts);
    }
    async readScripts() {
        const root = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (!root)
            return {};
        const pkgPath = path.join(root, 'package.json');
        if (!fs.existsSync(pkgPath))
            return {};
        try {
            const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
            return pkg.scripts ?? {};
        }
        catch {
            return {};
        }
    }
}
exports.ScriptsTreeProvider = ScriptsTreeProvider;
//# sourceMappingURL=scriptsTree.js.map