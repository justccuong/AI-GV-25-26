import { getViewportForBounds } from 'reactflow';

import { stripHtml } from './graphUtils';
import { getTheme } from './themeConfig';

const EXPORT_PADDING = 180;
const MIN_EXPORT_SIZE = 1200;
const MAX_EXPORT_SIZE = 1800;

function slugify(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

function buildFilename(title, extension) {
  const base = slugify(title) || 'mindmap-export';
  return `${base}.${extension}`;
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function downloadDataUrl(dataUrl, filename) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function getRootNodeId(nodes, edges) {
  const explicitRoot = nodes.find((node) => node.data?.isRoot);

  if (explicitRoot) {
    return String(explicitRoot.id);
  }

  const incoming = new Map(nodes.map((node) => [String(node.id), 0]));
  edges.forEach((edge) => {
    const target = String(edge.target);
    if (incoming.has(target)) {
      incoming.set(target, (incoming.get(target) || 0) + 1);
    }
  });

  return String(nodes.find((node) => (incoming.get(String(node.id)) || 0) === 0)?.id || nodes[0]?.id || '');
}

function sortNodeIds(nodeIds, nodeMap) {
  return [...nodeIds].sort((leftId, rightId) => {
    const left = nodeMap.get(String(leftId));
    const right = nodeMap.get(String(rightId));

    if (!left || !right) {
      return 0;
    }

    const topDelta = (left.position?.y || 0) - (right.position?.y || 0);
    if (topDelta !== 0) {
      return topDelta;
    }

    return (left.position?.x || 0) - (right.position?.x || 0);
  });
}

function buildOutline(snapshot) {
  const nodes = Array.isArray(snapshot?.nodes) ? snapshot.nodes : [];
  const edges = Array.isArray(snapshot?.edges) ? snapshot.edges : [];
  const nodeMap = new Map(nodes.map((node) => [String(node.id), node]));
  const adjacency = new Map(nodes.map((node) => [String(node.id), []]));

  edges.forEach((edge) => {
    const source = String(edge.source);
    const target = String(edge.target);

    if (adjacency.has(source) && nodeMap.has(target)) {
      adjacency.get(source).push(target);
    }
  });

  Array.from(adjacency.entries()).forEach(([nodeId, childIds]) => {
    adjacency.set(nodeId, sortNodeIds(childIds, nodeMap));
  });

  const visited = new Set();
  const rootId = getRootNodeId(nodes, edges);

  const renderNode = (nodeId, depth = 0) => {
    if (!nodeId || visited.has(nodeId) || !nodeMap.has(nodeId)) {
      return [];
    }

    visited.add(nodeId);
    const node = nodeMap.get(nodeId);
    const label = stripHtml(node.data?.label || 'Node chua dat ten');
    const lines = [{ depth, label }];

    (adjacency.get(nodeId) || []).forEach((childId) => {
      lines.push(...renderNode(childId, depth + 1));
    });

    return lines;
  };

  const lines = renderNode(rootId);
  const disconnected = sortNodeIds(
    nodes.map((node) => String(node.id)).filter((nodeId) => !visited.has(nodeId)),
    nodeMap
  );

  disconnected.forEach((nodeId) => {
    lines.push(...renderNode(nodeId, lines.length ? 1 : 0));
  });

  return lines;
}

function buildMarkdownOutline(lines) {
  return lines
    .map(({ depth, label }) => `${'  '.repeat(depth)}- ${label}`)
    .join('\n');
}

function getSnapshotBounds(nodes) {
  const initial = {
    minX: Infinity,
    minY: Infinity,
    maxX: -Infinity,
    maxY: -Infinity,
  };

  const bounds = nodes.reduce((accumulator, node) => {
    const width = Number(node.width) || Number(node.style?.width) || 220;
    const height = Number(node.height) || Number(node.style?.height) || 80;
    const x = Number(node.positionAbsolute?.x) || Number(node.position?.x) || 0;
    const y = Number(node.positionAbsolute?.y) || Number(node.position?.y) || 0;

    return {
      minX: Math.min(accumulator.minX, x),
      minY: Math.min(accumulator.minY, y),
      maxX: Math.max(accumulator.maxX, x + width),
      maxY: Math.max(accumulator.maxY, y + height),
    };
  }, initial);

  return {
    x: Number.isFinite(bounds.minX) ? bounds.minX : 0,
    y: Number.isFinite(bounds.minY) ? bounds.minY : 0,
    width: Number.isFinite(bounds.maxX - bounds.minX) ? Math.max(bounds.maxX - bounds.minX, 1) : 1,
    height: Number.isFinite(bounds.maxY - bounds.minY) ? Math.max(bounds.maxY - bounds.minY, 1) : 1,
  };
}

function expandBoundsToSquare(bounds, padding = EXPORT_PADDING) {
  const width = Math.max(bounds.width || 0, 1);
  const height = Math.max(bounds.height || 0, 1);
  const size = Math.max(width, height) + padding * 2;
  const centerX = bounds.x + width / 2;
  const centerY = bounds.y + height / 2;

  return {
    x: centerX - size / 2,
    y: centerY - size / 2,
    width: size,
    height: size,
  };
}

function getExportSize(bounds) {
  const base = Math.max(bounds.width || 0, bounds.height || 0);
  return Math.round(Math.min(MAX_EXPORT_SIZE, Math.max(MIN_EXPORT_SIZE, base * 1.35)));
}

function shouldIncludeExportNode(node) {
  if (!(node instanceof HTMLElement || node instanceof SVGElement)) {
    return true;
  }

  const className =
    typeof node.className === 'string'
      ? node.className
      : typeof node.getAttribute === 'function'
        ? node.getAttribute('class') || ''
        : '';

  const blockedTokens = [
    'react-flow__resize-control',
    'react-flow__handle',
    'rich-text-toolbar',
    'react-flow__selection',
    'react-flow__nodesselection',
    'react-flow__attribution',
    'react-flow__panel',
    'react-flow__minimap',
    'react-flow__controls',
  ];

  return !blockedTokens.some((token) => className.includes(token));
}

async function captureDiagramCanvas({ container, snapshot, pixelRatio = 1.5 }) {
  const nodes = Array.isArray(snapshot?.nodes) ? snapshot.nodes.filter((node) => !node.hidden) : [];

  if (!container) {
    throw new Error('Khong tim thay khong gian ve de xuat anh.');
  }

  if (!nodes.length) {
    throw new Error('So do dang trong, chua co du lieu de xuat.');
  }

  const reactFlowRoot = container.querySelector('.react-flow');
  const viewport = container.querySelector('.react-flow__viewport');
  if (!reactFlowRoot || !viewport) {
    throw new Error('Khong tim thay viewport de xuat anh.');
  }

  const { toPng } = await import('html-to-image');
  const bounds = expandBoundsToSquare(getSnapshotBounds(nodes));
  const size = getExportSize(bounds);
  const viewportState = getViewportForBounds(bounds, size, size, 0.05, 4, 0);
  const theme = getTheme(snapshot?.themeId);
  const originalTransform = viewport.style.transform;
  const originalTransition = viewport.style.transition;
  const selectedNodes = Array.from(reactFlowRoot.querySelectorAll('.selected'));
  selectedNodes.forEach((element) => element.classList.remove('selected'));

  try {
    viewport.style.transition = 'none';
    viewport.style.transform = `translate(${viewportState.x}px, ${viewportState.y}px) scale(${viewportState.zoom})`;

    await new Promise((resolve) =>
      window.requestAnimationFrame(() => window.requestAnimationFrame(resolve))
    );

    return await toPng(reactFlowRoot, {
      cacheBust: true,
      pixelRatio,
      width: size,
      height: size,
      filter: shouldIncludeExportNode,
      backgroundColor:
        typeof theme.background === 'string' && !theme.background.includes('gradient(')
          ? theme.background
          : '#f8fafc',
      style: {
        width: `${size}px`,
        height: `${size}px`,
      },
    });
  } finally {
    viewport.style.transform = originalTransform;
    viewport.style.transition = originalTransition;
    selectedNodes.forEach((element) => element.classList.add('selected'));
  }
}

export async function exportDiagramPng({ title, snapshot, container }) {
  const imageUrl = await captureDiagramCanvas({ container, snapshot, pixelRatio: 2 });
  downloadDataUrl(imageUrl, buildFilename(title, 'png'));
}

export function exportDiagramJson({ title, diagramId, snapshot }) {
  const payload = {
    version: 1,
    diagramId,
    title,
    exportedAt: new Date().toISOString(),
    data: snapshot,
  };

  downloadBlob(
    new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' }),
    buildFilename(title, 'json')
  );
}

export function exportDiagramMarkdown({ title, diagramId, snapshot }) {
  const lines = buildOutline(snapshot);
  const nodeCount = Array.isArray(snapshot?.nodes) ? snapshot.nodes.length : 0;
  const edgeCount = Array.isArray(snapshot?.edges) ? snapshot.edges.length : 0;
  const content = [
    `# ${title || 'Mindmap Export'}`,
    '',
    `- Diagram ID: ${diagramId || 'draft'}`,
    `- Exported at: ${new Date().toISOString()}`,
    `- Nodes: ${nodeCount}`,
    `- Edges: ${edgeCount}`,
    '',
    '## Outline',
    '',
    buildMarkdownOutline(lines) || '- So do hien chua co noi dung.',
    '',
  ].join('\n');

  downloadBlob(
    new Blob([content], { type: 'text/markdown;charset=utf-8' }),
    buildFilename(title, 'md')
  );
}

export async function exportDiagramPdf({ title, snapshot, container }) {
  const imageUrl = await captureDiagramCanvas({ container, snapshot, pixelRatio: 2 });
  const { jsPDF } = await import('jspdf');

  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: 'a4',
    compress: true,
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 24;
  const imageSize = Math.min(pageWidth - margin * 2, pageHeight - margin * 2);
  const offsetX = (pageWidth - imageSize) / 2;
  const offsetY = (pageHeight - imageSize) / 2;

  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');
  pdf.addImage(imageUrl, 'PNG', offsetX, offsetY, imageSize, imageSize, undefined, 'FAST');
  pdf.save(buildFilename(title, 'pdf'));
}
