import * as vscode from 'vscode';
import * as path from 'path';
import { parseFile } from './parsers';
import { buildWebviewHtml } from './renderer/webview';
import { diffSchemas } from './diff';
import { CanonicalSchema } from './types';

let currentPanel: vscode.WebviewPanel | undefined;

export function activate(context: vscode.ExtensionContext) {
  // Command: Open ERD
  const openERDCmd = vscode.commands.registerCommand('schema-lens.openERD', () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showWarningMessage('Schema Lens: No active editor.');
      return;
    }
    openERD(editor.document);
  });

  // Command: Compare With
  const compareCmd = vscode.commands.registerCommand('schema-lens.compareWith', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showWarningMessage('Schema Lens: No active editor.');
      return;
    }

    const fileUri = await vscode.window.showOpenDialog({
      canSelectMany: false,
      openLabel: 'Select file to compare with',
      filters: {
        'Schema files': ['sql', 'prisma', 'ts', 'js'],
      },
    });

    if (!fileUri || fileUri.length === 0) { return; }

    try {
      const baseDoc = editor.document;
      const headDoc = await vscode.workspace.openTextDocument(fileUri[0]);

      const baseSchema = parseFile(baseDoc.fileName, baseDoc.getText());
      const headSchema = parseFile(headDoc.fileName, headDoc.getText());

      const diff = diffSchemas(baseSchema, headSchema);

      const diffAsSchema: CanonicalSchema = {
        tables: diff.tables
          .filter(t => t.status !== 'removed')
          .map(t => ({
            name: t.status === 'added' ? `${t.name} (+)` : t.name,
            columns: t.columns
              .filter(c => c.column != null)
              .map(c => c.column!),
            foreignKeys: t.foreignKeys,
          })),
      };

      const baseName = path.basename(baseDoc.fileName);
      const headName = path.basename(headDoc.fileName);
      const title = `ERD Diff — ${baseName} vs ${headName}`;

      const diffPanel = vscode.window.createWebviewPanel(
        'schemaLensDiff',
        title,
        vscode.ViewColumn.Beside,
        { enableScripts: true }
      );

      diffPanel.webview.html = buildWebviewHtml(
        diffAsSchema,
        `${baseName} ↔ ${headName}`,
        diffPanel.webview
      );
    } catch (e: any) {
      vscode.window.showErrorMessage(`Schema Lens: ${e.message}`);
    }
  });

  // File save listener
  const saveListener = vscode.workspace.onDidSaveTextDocument((doc) => {
    if (currentPanel && currentPanel.visible) {
      const activeEditor = vscode.window.activeTextEditor;
      if (activeEditor && activeEditor.document.uri.toString() === doc.uri.toString()) {
        renderERD(doc, currentPanel);
      }
    }
  });

  context.subscriptions.push(openERDCmd, compareCmd, saveListener);
}

function openERD(document: vscode.TextDocument): void {
  const fileName = path.basename(document.fileName);

  if (currentPanel) {
    currentPanel.title = `ERD — ${fileName}`;
    currentPanel.reveal(vscode.ViewColumn.Beside);
    renderERD(document, currentPanel);
    return;
  }

  currentPanel = vscode.window.createWebviewPanel(
    'schemaLensERD',
    `ERD — ${fileName}`,
    vscode.ViewColumn.Beside,
    { enableScripts: true }
  );

  currentPanel.onDidDispose(() => {
    currentPanel = undefined;
  });

  renderERD(document, currentPanel);
}

function renderERD(document: vscode.TextDocument, panel: vscode.WebviewPanel): void {
  try {
    const schema = parseFile(document.fileName, document.getText());
    const filename = path.basename(document.fileName);
    panel.webview.html = buildWebviewHtml(schema, filename, panel.webview);
  } catch (e: any) {
    vscode.window.showErrorMessage(`Schema Lens: ${e.message || String(e)}`);
  }
}

function isDarkTheme(): boolean {
  const theme = vscode.window.activeColorTheme;
  return theme.kind === vscode.ColorThemeKind.Dark || theme.kind === vscode.ColorThemeKind.HighContrast;
}

export function deactivate() {}
