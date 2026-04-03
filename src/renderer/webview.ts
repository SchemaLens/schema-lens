import * as vscode from 'vscode';
import { CanonicalSchema } from '../types';

export function buildWebviewHtml(
  schema: CanonicalSchema,
  filename: string,
  webview: vscode.Webview
): string {
  const isDark = vscode.window.activeColorTheme.kind !== vscode.ColorThemeKind.Light;
  const schemaJson = JSON.stringify(schema);

  return /* html */ `<!DOCTYPE html>
<html lang="en" data-theme="${isDark ? 'dark' : 'light'}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline' https://fonts.googleapis.com https://fonts.gstatic.com; font-src https://fonts.gstatic.com; script-src 'unsafe-inline';">
<title>ERD — ${filename}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

:root {
  --bg: #1e1e1e;
  --surface: #252526;
  --surface2: #2d2d2d;
  --surface3: #333333;
  --border: #3c3c3c;
  --border2: #4a4a4a;
  --text: #d4d4d4;
  --text-muted: #8a8a8a;
  --text-faint: #555;
  --accent: #4ec9b0;
  --accent-dim: rgba(78,201,176,0.12);
  --accent-glow: rgba(78,201,176,0.25);
  --blue: #569cd6;
  --yellow: #f0ab04;
  --red: #f44747;
  --pk: #f0ab04;
  --fk: #569cd6;
  --font-mono: 'JetBrains Mono', 'Cascadia Code', monospace;
  --font-ui: 'Inter', -apple-system, sans-serif;
  --radius: 6px;
  --shadow: 0 4px 20px rgba(0,0,0,0.5);
}

[data-theme="light"] {
  --bg: #f3f3f3;
  --surface: #ffffff;
  --surface2: #f0f0f0;
  --surface3: #e8e8e8;
  --border: #d4d4d4;
  --border2: #c0c0c0;
  --text: #1e1e1e;
  --text-muted: #666;
  --text-faint: #aaa;
  --accent: #0d7a68;
  --accent-dim: rgba(13,122,104,0.1);
  --accent-glow: rgba(13,122,104,0.2);
  --blue: #0451a5;
  --yellow: #795e26;
  --pk: #795e26;
  --fk: #0451a5;
}

html, body {
  height: 100%;
  overflow: hidden;
  font-family: var(--font-ui);
  background: var(--bg);
  color: var(--text);
  font-size: 13px;
  line-height: 1.4;
}

/* ── Shell ───────────────────────────────────────── */
.shell {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

/* ── Toolbar ─────────────────────────────────────── */
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  height: 40px;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
  gap: 12px;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.logo {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--accent);
  flex-shrink: 0;
}

.logo svg {
  width: 15px;
  height: 15px;
}

.divider {
  width: 1px;
  height: 16px;
  background: var(--border);
  flex-shrink: 0;
}

.filename-pill {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 2px 8px;
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 12px;
  font-size: 11px;
  font-family: var(--font-mono);
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.filename-pill .dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent);
  flex-shrink: 0;
}

.table-count {
  font-size: 11px;
  color: var(--text-faint);
  white-space: nowrap;
  flex-shrink: 0;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
}

.tb-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 4px;
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  transition: background 0.12s, color 0.12s;
}

.tb-btn:hover {
  background: var(--surface3);
  color: var(--text);
}

.tb-btn svg {
  width: 14px;
  height: 14px;
}

.tb-btn-group {
  display: flex;
  border: 1px solid var(--border);
  border-radius: 4px;
  overflow: hidden;
  margin: 0 2px;
}

.tb-btn-group .tb-btn {
  border-radius: 0;
  width: 26px;
  height: 26px;
  border-right: 1px solid var(--border);
}

.tb-btn-group .tb-btn:last-child {
  border-right: none;
}

.zoom-label {
  font-size: 10px;
  font-family: var(--font-mono);
  color: var(--text-muted);
  padding: 0 6px;
  min-width: 34px;
  text-align: center;
  cursor: default;
  display: flex;
  align-items: center;
  background: var(--surface);
  height: 26px;
}

/* ── Canvas ──────────────────────────────────────── */
.canvas-wrap {
  flex: 1;
  overflow: auto;
  position: relative;
  cursor: grab;
  background: var(--bg);
  background-image:
    radial-gradient(circle, var(--border) 1px, transparent 1px);
  background-size: 24px 24px;
}

.canvas-wrap:active { cursor: grabbing; }

.canvas-inner {
  position: relative;
  min-width: 1200px;
  min-height: 700px;
  transform-origin: top left;
  transition: none;
}

/* ── ERD Nodes ───────────────────────────────────── */
.erd-node {
  position: absolute;
  width: 230px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  transition: border-color 0.15s, box-shadow 0.15s;
  user-select: none;
}

.erd-node:hover {
  border-color: var(--accent);
  box-shadow: 0 4px 24px var(--accent-glow);
  z-index: 10;
}

.erd-node.selected {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px var(--accent-dim), 0 4px 24px var(--accent-glow);
  z-index: 20;
}

.node-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px 7px;
  background: var(--surface2);
  border-bottom: 1px solid var(--border);
  border-radius: calc(var(--radius) - 1px) calc(var(--radius) - 1px) 0 0;
  cursor: move;
}

.node-title {
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 600;
  color: var(--text);
  letter-spacing: 0.01em;
}

.node-badge {
  font-size: 9px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 10px;
  background: var(--accent-dim);
  color: var(--accent);
  border: 1px solid rgba(78,201,176,0.2);
  letter-spacing: 0.04em;
  flex-shrink: 0;
}

.node-cols {
  padding: 4px 0;
}

.erd-col {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 4px 10px;
  cursor: default;
  transition: background 0.1s;
  min-height: 26px;
}

.erd-col:hover {
  background: var(--surface2);
}

.col-key {
  width: 18px;
  font-size: 9px;
  font-weight: 700;
  text-align: center;
  flex-shrink: 0;
  letter-spacing: 0.02em;
}

.col-key.pk { color: var(--pk); }
.col-key.fk { color: var(--fk); }

.col-name {
  font-family: var(--font-mono);
  font-size: 11px;
  color: #9cdcfe;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

[data-theme="light"] .col-name { color: #0451a5; }

.col-type {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--text-faint);
  flex-shrink: 0;
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.col-flag {
  font-size: 9px;
  color: var(--text-faint);
  flex-shrink: 0;
}

.node-footer {
  padding: 5px 10px;
  border-top: 1px solid var(--border);
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.node-tag {
  font-size: 9px;
  padding: 1px 5px;
  border-radius: 3px;
  background: var(--surface2);
  color: var(--text-faint);
  border: 1px solid var(--border);
  font-family: var(--font-mono);
}

/* ── SVG lines ───────────────────────────────────── */
.erd-svg {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  overflow: visible;
}

.rel-path {
  fill: none;
  stroke: var(--border2);
  stroke-width: 1.5;
  stroke-dasharray: none;
  transition: stroke 0.15s;
}

.rel-path.highlighted {
  stroke: var(--accent);
  stroke-width: 2;
  opacity: 0.85;
}

.rel-dot {
  fill: var(--border2);
  transition: fill 0.15s;
}

.rel-dot.highlighted {
  fill: var(--accent);
}

/* ── Empty / Error states ────────────────────────── */
.state-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 12px;
  padding: 40px;
  text-align: center;
}

.state-icon {
  width: 48px;
  height: 48px;
  color: var(--text-faint);
  opacity: 0.5;
}

.state-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-muted);
}

.state-desc {
  font-size: 12px;
  color: var(--text-faint);
  max-width: 320px;
  line-height: 1.6;
}

.state-formats {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 4px;
}

.fmt-tag {
  font-size: 10px;
  font-family: var(--font-mono);
  padding: 3px 8px;
  border-radius: 4px;
  background: var(--surface2);
  border: 1px solid var(--border);
  color: var(--text-muted);
}

.error-box {
  background: rgba(244,71,71,0.08);
  border: 1px solid rgba(244,71,71,0.25);
  border-radius: var(--radius);
  padding: 10px 14px;
  font-family: var(--font-mono);
  font-size: 11px;
  color: #f44747;
  max-width: 480px;
  word-break: break-all;
  text-align: left;
}

/* ── Tooltip ─────────────────────────────────────── */
.tooltip {
  position: fixed;
  background: var(--surface3);
  border: 1px solid var(--border2);
  border-radius: 4px;
  padding: 6px 10px;
  font-size: 11px;
  font-family: var(--font-mono);
  color: var(--text);
  pointer-events: none;
  z-index: 9999;
  opacity: 0;
  transition: opacity 0.12s;
  max-width: 260px;
  line-height: 1.6;
  box-shadow: 0 4px 16px rgba(0,0,0,0.4);
}

.tooltip.visible { opacity: 1; }

.tooltip-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.tooltip-key {
  font-size: 9px;
  font-weight: 700;
  padding: 1px 4px;
  border-radius: 3px;
}

.tooltip-key.pk {
  background: rgba(240,171,4,0.15);
  color: var(--pk);
}

.tooltip-key.fk {
  background: rgba(86,156,214,0.15);
  color: var(--fk);
}

.tooltip-name { color: #9cdcfe; }
.tooltip-type { color: var(--text-muted); font-size: 10px; }
.tooltip-meta { color: var(--text-faint); font-size: 10px; margin-top: 3px; }

/* ── Status bar ──────────────────────────────────── */
.statusbar {
  display: flex;
  align-items: center;
  padding: 0 12px;
  height: 22px;
  background: #007acc;
  flex-shrink: 0;
  gap: 16px;
}

[data-theme="light"] .statusbar { background: #007acc; }

.sb-item {
  font-size: 11px;
  color: rgba(255,255,255,0.9);
  display: flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}

.sb-right { margin-left: auto; display: flex; gap: 14px; }

/* ── Scrollbar ───────────────────────────────────── */
::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-track { background: var(--bg); }
::-webkit-scrollbar-thumb { background: var(--surface3); border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: var(--border2); }
</style>
</head>
<body>

<div class="shell">

  <!-- Toolbar -->
  <div class="toolbar">
    <div class="toolbar-left">
      <div class="logo">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="2" y="3" width="8" height="6" rx="1"/>
          <rect x="14" y="3" width="8" height="6" rx="1"/>
          <rect x="8" y="15" width="8" height="6" rx="1"/>
          <path d="M6 9v3M18 9v3M6 12h6M18 12h-6M12 15v0"/>
        </svg>
        Schema Lens
      </div>
      <div class="divider"></div>
      <div class="filename-pill">
        <span class="dot"></span>
        ${escapeHtml(filename)}
      </div>
      <span class="table-count" id="table-count"></span>
    </div>

    <div class="toolbar-right">
      <div class="tb-btn-group">
        <button class="tb-btn" id="btn-zoom-out" title="Zoom Out (-)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35M8 11h6"/>
          </svg>
        </button>
        <span class="zoom-label" id="zoom-label">100%</span>
        <button class="tb-btn" id="btn-zoom-in" title="Zoom In (+)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35M11 8v6M8 11h6"/>
          </svg>
        </button>
      </div>
      <button class="tb-btn" id="btn-fit" title="Fit to screen">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
        </svg>
      </button>
      <button class="tb-btn" id="btn-layout" title="Re-layout">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="7" height="7" rx="1"/>
          <rect x="14" y="3" width="7" height="7" rx="1"/>
          <rect x="3" y="14" width="7" height="7" rx="1"/>
          <rect x="14" y="14" width="7" height="7" rx="1"/>
        </svg>
      </button>
    </div>
  </div>

  <!-- Main Canvas -->
  <div class="canvas-wrap" id="canvas-wrap">
    <div id="canvas-content"></div>
  </div>

  <!-- Status Bar -->
  <div class="statusbar">
    <div class="sb-item">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="2" y="3" width="8" height="6" rx="1"/><rect x="14" y="3" width="8" height="6" rx="1"/>
        <rect x="8" y="15" width="8" height="6" rx="1"/>
        <path d="M6 9v3M18 9v3M6 12h6M18 12h-6M12 15v0"/>
      </svg>
      Schema Lens
    </div>
    <div class="sb-item" id="sb-info">Parsing...</div>
    <div class="sb-right">
      <div class="sb-item" id="sb-relations">0 relations</div>
      <div class="sb-item" id="sb-zoom">100%</div>
    </div>
  </div>
</div>

<!-- Tooltip -->
<div class="tooltip" id="tooltip"></div>

<script>
// ──────────────────────────────────────────────────
// Data
// ──────────────────────────────────────────────────
const schema = ${schemaJson};

// ──────────────────────────────────────────────────
// State
// ──────────────────────────────────────────────────
let zoom = 1;
let positions = {};      // { tableName: {x, y} }
let selected = null;     // selected table name
let relCount = 0;

// ──────────────────────────────────────────────────
// Init
// ──────────────────────────────────────────────────
(function init() {
  if (!schema || !schema.tables || schema.tables.length === 0) {
    renderEmpty();
    return;
  }
  layoutTables();
  renderAll();
  updateStatusBar();
})();

// ──────────────────────────────────────────────────
// Layout — auto-position tables in a smart grid
// ──────────────────────────────────────────────────
function layoutTables() {
  const tables = schema.tables;
  const NODE_W = 250;
  const NODE_H_BASE = 80;
  const COL_H = 26;
  const GAP_X = 60;
  const GAP_Y = 50;
  const COLS = Math.min(3, Math.ceil(Math.sqrt(tables.length)));

  tables.forEach((t, i) => {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const nodeH = NODE_H_BASE + t.columns.length * COL_H;
    positions[t.name] = {
      x: 40 + col * (NODE_W + GAP_X),
      y: 40 + row * (nodeH + GAP_Y)
    };
  });
}

// ──────────────────────────────────────────────────
// Render all
// ──────────────────────────────────────────────────
function renderAll() {
  const container = document.getElementById('canvas-content');
  container.innerHTML = '';

  const inner = document.createElement('div');
  inner.className = 'canvas-inner';
  inner.id = 'canvas-inner';
  inner.style.transform = \`scale(\${zoom})\`;
  inner.style.transformOrigin = 'top left';

  // SVG layer for relationship lines
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.classList.add('erd-svg');
  svg.id = 'erd-svg';
  inner.appendChild(svg);

  // Nodes
  schema.tables.forEach(table => {
    const node = buildNode(table);
    inner.appendChild(node);
  });

  container.appendChild(inner);

  // Draw lines after DOM settles
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      drawRelations();
      sizeSvg();
    });
  });

  document.getElementById('table-count').textContent =
    \`\${schema.tables.length} table\${schema.tables.length !== 1 ? 's' : ''}\`;
}

// ──────────────────────────────────────────────────
// Build a single node element
// ──────────────────────────────────────────────────
function buildNode(table) {
  const pos = positions[table.name] || { x: 0, y: 0 };

  const node = document.createElement('div');
  node.className = 'erd-node';
  node.id = \`node-\${table.name}\`;
  node.style.left = pos.x + 'px';
  node.style.top = pos.y + 'px';

  // FK lookup for this table
  const fkCols = new Set(table.foreignKeys.map(fk => fk.column));

  // Header
  const header = document.createElement('div');
  header.className = 'node-header';
  header.innerHTML = \`
    <span class="node-title">\${escHtml(table.name)}</span>
    <span class="node-badge">\${table.columns.length}</span>
  \`;
  node.appendChild(header);

  // Columns
  const colsWrap = document.createElement('div');
  colsWrap.className = 'node-cols';

  table.columns.forEach(col => {
    const isPK = col.primaryKey;
    const isFK = fkCols.has(col.name);

    const div = document.createElement('div');
    div.className = 'erd-col';
    div.dataset.col = col.name;
    div.dataset.table = table.name;

    const keySpan = document.createElement('span');
    keySpan.className = 'col-key ' + (isPK ? 'pk' : isFK ? 'fk' : '');
    keySpan.textContent = isPK ? 'PK' : isFK ? 'FK' : '';

    const nameSpan = document.createElement('span');
    nameSpan.className = 'col-name';
    nameSpan.textContent = col.name;

    const typeSpan = document.createElement('span');
    typeSpan.className = 'col-type';
    typeSpan.textContent = col.type;

    const flagSpan = document.createElement('span');
    flagSpan.className = 'col-flag';
    flagSpan.textContent = col.nullable ? '?' : '';

    div.appendChild(keySpan);
    div.appendChild(nameSpan);
    div.appendChild(typeSpan);
    div.appendChild(flagSpan);

    // Tooltip
    div.addEventListener('mouseenter', (e) => showTooltip(e, col, isPK, isFK, table));
    div.addEventListener('mouseleave', hideTooltip);
    div.addEventListener('mousemove', moveTooltip);

    colsWrap.appendChild(div);
  });
  node.appendChild(colsWrap);

  // Footer tags
  if (table.foreignKeys.length > 0) {
    const footer = document.createElement('div');
    footer.className = 'node-footer';
    table.foreignKeys.forEach(fk => {
      const tag = document.createElement('span');
      tag.className = 'node-tag';
      tag.textContent = \`→ \${fk.referencesTable}\`;
      footer.appendChild(tag);
    });
    node.appendChild(footer);
  }

  // Drag behaviour
  makeDraggable(node, table.name);

  // Click to select / highlight relations
  node.addEventListener('click', (e) => {
    if (e.defaultPrevented) return;
    toggleSelect(table.name);
  });

  return node;
}

// ──────────────────────────────────────────────────
// Draw relationship lines
// ──────────────────────────────────────────────────
function drawRelations() {
  const svg = document.getElementById('erd-svg');
  if (!svg) return;

  let lines = '';
  relCount = 0;

  schema.tables.forEach(table => {
    table.foreignKeys.forEach(fk => {
      const fromEl = document.getElementById(\`node-\${table.name}\`);
      const toEl   = document.getElementById(\`node-\${fk.referencesTable}\`);
      if (!fromEl || !toEl) return;

      const fromPos = positions[table.name];
      const toPos   = positions[fk.referencesTable];
      if (!fromPos || !toPos) return;

      const fw = fromEl.offsetWidth  || 230;
      const fh = fromEl.offsetHeight || 100;
      const tw = toEl.offsetWidth    || 230;
      const th = toEl.offsetHeight   || 100;

      // Pick best edge (left or right) to exit/enter
      const fromCenterX = fromPos.x + fw / 2;
      const toCenterX   = toPos.x   + tw / 2;

      let x1, y1, x2, y2;
      if (toCenterX > fromCenterX) {
        x1 = fromPos.x + fw;  y1 = fromPos.y + fh / 2;
        x2 = toPos.x;         y2 = toPos.y   + th / 2;
      } else {
        x1 = fromPos.x;       y1 = fromPos.y + fh / 2;
        x2 = toPos.x + tw;    y2 = toPos.y   + th / 2;
      }

      // Cubic bezier
      const dx = Math.abs(x2 - x1) * 0.5;
      const isHL = selected === table.name || selected === fk.referencesTable;
      const cls  = isHL ? 'highlighted' : '';

      lines += \`<path class="rel-path \${cls}"
        data-from="\${escHtml(table.name)}"
        data-to="\${escHtml(fk.referencesTable)}"
        d="M\${x1},\${y1} C\${x1+dx},\${y1} \${x2-dx},\${y2} \${x2},\${y2}"/>\`;

      // Terminal dots
      lines += \`<circle class="rel-dot \${cls}" cx="\${x1}" cy="\${y1}" r="3.5"/>\`;
      lines += \`<circle class="rel-dot \${cls}" cx="\${x2}" cy="\${y2}" r="3.5"/>\`;

      relCount++;
    });
  });

  svg.innerHTML = lines;
  sizeSvg();

  document.getElementById('sb-relations').textContent =
    \`\${relCount} relation\${relCount !== 1 ? 's' : ''}\`;
}

function sizeSvg() {
  const inner = document.getElementById('canvas-inner');
  const svg   = document.getElementById('erd-svg');
  if (!inner || !svg) return;
  svg.setAttribute('width',  inner.scrollWidth);
  svg.setAttribute('height', inner.scrollHeight);
}

// ──────────────────────────────────────────────────
// Select / highlight
// ──────────────────────────────────────────────────
function toggleSelect(name) {
  selected = selected === name ? null : name;
  document.querySelectorAll('.erd-node').forEach(n => {
    n.classList.toggle('selected', n.id === \`node-\${name}\` && selected !== null);
  });
  drawRelations();
}

// ──────────────────────────────────────────────────
// Drag nodes
// ──────────────────────────────────────────────────
function makeDraggable(el, name) {
  let startX, startY, origX, origY, dragging = false;

  el.querySelector('.node-header').addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    dragging = true;
    startX = e.clientX;
    startY = e.clientY;
    origX  = positions[name].x;
    origY  = positions[name].y;
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    const dx = (e.clientX - startX) / zoom;
    const dy = (e.clientY - startY) / zoom;
    positions[name].x = Math.max(0, origX + dx);
    positions[name].y = Math.max(0, origY + dy);
    el.style.left = positions[name].x + 'px';
    el.style.top  = positions[name].y + 'px';
    drawRelations();
  });

  document.addEventListener('mouseup', () => { dragging = false; });
}

// ──────────────────────────────────────────────────
// Zoom
// ──────────────────────────────────────────────────
function setZoom(val) {
  zoom = Math.min(2.5, Math.max(0.25, val));
  const inner = document.getElementById('canvas-inner');
  if (inner) inner.style.transform = \`scale(\${zoom})\`;
  const pct = Math.round(zoom * 100) + '%';
  document.getElementById('zoom-label').textContent = pct;
  document.getElementById('sb-zoom').textContent = pct;
  sizeSvg();
}

document.getElementById('btn-zoom-in').addEventListener('click', () => setZoom(zoom + 0.15));
document.getElementById('btn-zoom-out').addEventListener('click', () => setZoom(zoom - 0.15));
document.getElementById('btn-fit').addEventListener('click', fitToScreen);
document.getElementById('btn-layout').addEventListener('click', () => { layoutTables(); renderAll(); });

document.getElementById('canvas-wrap').addEventListener('wheel', (e) => {
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    setZoom(zoom + (e.deltaY < 0 ? 0.1 : -0.1));
  }
}, { passive: false });

function fitToScreen() {
  const wrap = document.getElementById('canvas-wrap');
  const inner = document.getElementById('canvas-inner');
  if (!inner) return;

  const ww = wrap.clientWidth  - 48;
  const wh = wrap.clientHeight - 48;

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  schema.tables.forEach(t => {
    const el = document.getElementById(\`node-\${t.name}\`);
    const p  = positions[t.name];
    if (!el || !p) return;
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x + el.offsetWidth);
    maxY = Math.max(maxY, p.y + el.offsetHeight);
  });

  if (!isFinite(minX)) return;
  const contentW = maxX - minX + 40;
  const contentH = maxY - minY + 40;
  const newZoom  = Math.min(ww / contentW, wh / contentH, 1.5);
  setZoom(newZoom);
  wrap.scrollLeft = 0;
  wrap.scrollTop  = 0;
}

// ──────────────────────────────────────────────────
// Pan canvas
// ──────────────────────────────────────────────────
(function setupPan() {
  const wrap = document.getElementById('canvas-wrap');
  let panning = false, panX, panY, scrollX, scrollY;

  wrap.addEventListener('mousedown', (e) => {
    if (e.target.closest('.erd-node')) return;
    panning = true;
    panX = e.clientX;
    panY = e.clientY;
    scrollX = wrap.scrollLeft;
    scrollY = wrap.scrollTop;
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (!panning) return;
    wrap.scrollLeft = scrollX - (e.clientX - panX);
    wrap.scrollTop  = scrollY - (e.clientY - panY);
  });

  document.addEventListener('mouseup', () => { panning = false; });
})();

// ──────────────────────────────────────────────────
// Tooltip
// ──────────────────────────────────────────────────
const tooltipEl = document.getElementById('tooltip');

function showTooltip(e, col, isPK, isFK, table) {
  const fk = table.foreignKeys.find(f => f.column === col.name);

  let html = \`<div class="tooltip-row">\`;
  if (isPK) html += \`<span class="tooltip-key pk">PK</span>\`;
  if (isFK) html += \`<span class="tooltip-key fk">FK</span>\`;
  html += \`<span class="tooltip-name">\${escHtml(col.name)}</span>
    <span class="tooltip-type">\${escHtml(col.type)}</span>
  </div>\`;

  const meta = [];
  if (!col.nullable) meta.push('NOT NULL');
  if (col.unique)    meta.push('UNIQUE');
  if (col.default !== undefined && col.default !== null && col.default !== '')
    meta.push(\`DEFAULT \${col.default}\`);
  if (fk) meta.push(\`→ \${fk.referencesTable}(\${fk.referencesColumn})\`);

  if (meta.length > 0) {
    html += \`<div class="tooltip-meta">\${meta.join(' · ')}</div>\`;
  }

  tooltipEl.innerHTML = html;
  tooltipEl.classList.add('visible');
  positionTooltip(e);
}

function moveTooltip(e) { positionTooltip(e); }
function hideTooltip()  { tooltipEl.classList.remove('visible'); }

function positionTooltip(e) {
  const x = e.clientX + 14;
  const y = e.clientY - 4;
  const tw = tooltipEl.offsetWidth;
  const vw = window.innerWidth;
  tooltipEl.style.left = (x + tw > vw ? x - tw - 20 : x) + 'px';
  tooltipEl.style.top  = y + 'px';
}

// ──────────────────────────────────────────────────
// Empty state
// ──────────────────────────────────────────────────
function renderEmpty() {
  const container = document.getElementById('canvas-content');
  container.style.height = '100%';
  container.innerHTML = \`
    <div class="state-wrap">
      <svg class="state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <rect x="2" y="3" width="8" height="6" rx="1"/>
        <rect x="14" y="3" width="8" height="6" rx="1"/>
        <rect x="8" y="15" width="8" height="6" rx="1"/>
        <path d="M6 9v3M18 9v3M6 12h6M18 12h-6M12 15v0"/>
      </svg>
      <div class="state-title">No tables detected</div>
      <div class="state-desc">
        Open a supported schema file and click <strong>≋ View ERD</strong> to generate an interactive diagram.
      </div>
      <div class="state-formats">
        <span class="fmt-tag">.sql</span>
        <span class="fmt-tag">.prisma</span>
        <span class="fmt-tag">schema.ts (Drizzle)</span>
        <span class="fmt-tag">*.ts (Knex)</span>
      </div>
    </div>\`;

  document.getElementById('sb-info').textContent = 'No tables found';
}

// ──────────────────────────────────────────────────
// Status bar
// ──────────────────────────────────────────────────
function updateStatusBar() {
  const t = schema.tables.length;
  document.getElementById('sb-info').textContent =
    \`\${t} table\${t !== 1 ? 's' : ''} parsed\`;
}

// ──────────────────────────────────────────────────
// Utility: HTML escape (runs in webview JS context)
// ──────────────────────────────────────────────────
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
</script>

</body>
</html>`;
}

// Server-side HTML escape used by template literals above
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}