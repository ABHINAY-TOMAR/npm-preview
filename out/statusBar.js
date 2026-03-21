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
exports.StatusBarManager = void 0;
/**
 * StatusBarManager
 * Manages the extension's status bar item.
 */
const vscode = __importStar(require("vscode"));
class StatusBarManager {
    constructor() {
        this.currentState = 'stopped';
        this.item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
        this.item.command = 'npmPreview.openPanel';
        this.item.text = '$(globe) NPM Preview';
        this.item.tooltip = 'Click to open NPM Preview panel';
        this.item.show();
    }
    setStatus(state, port) {
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
    getStatus() {
        return {
            state: this.currentState,
            port: this.currentPort
        };
    }
    dispose() {
        this.item.dispose();
    }
}
exports.StatusBarManager = StatusBarManager;
//# sourceMappingURL=statusBar.js.map