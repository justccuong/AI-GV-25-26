import dagre from 'dagre';
import { getTheme, DEFAULT_THEME_ID } from './themeConfig';

// Only layout mode: center-out mindmap
export const LAYOUT_MODES = {
  MINDMAP: 'mindmap',
};

const nodeWidth = 240;
const baseNodeHeight = 60;
const ROOT_NODE_SIZE = 280;
const PADDING_VERTICAL = 24;
const LINE_HEIGHT = 22;
const CHARS_PER_LINE = 32;

function stripHtml(html) {
  if (typeof html !== 'string') return '';
  return html.replace(/<[^>]*>/g, '').trim();
}

function getNodeSize(label, isRoot) {
  if (isRoot) return { width: ROOT_NODE_SIZE, height: ROOT_NODE_SIZE };
  const raw = stripHtml(label || '');
  const lines = raw ? raw.split(/\r?\n/) : [''];
  let totalWrappedLines = 0;
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      totalWrappedLines += 1;
      continue;
    }
    totalWrappedLines += Math.max(1, Math.ceil(trimmed.length / CHARS_PER_LINE));
  }
  const contentHeight = totalWrappedLines * LINE_HEIGHT;
  const height = Math.max(baseNodeHeight, Math.ceil(contentHeight + PADDING_VERTICAL));
  return { width: nodeWidth, height };
}

const runDagreLayout = (nodes, edges, options = {}) => {
  const { rankdir = 'LR', ranksep = 200, nodesep = 50 } = options;
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir, ranksep, nodesep });

  const getSize = (node) => {
    const isRoot = node.id === 'root';
    const explicit = node.style?.width != null && node.style?.height != null;
    if (explicit && typeof node.style.width === 'number' && typeof node.style.height === 'number') {
      return { width: node.style.width, height: node.style.height };
    }
    return getNodeSize(node.data.label, isRoot);
  };

  nodes.forEach((node) => {
    const size = getSize(node);
    g.setNode(node.id, { width: size.width, height: size.height });
  });
  edges.forEach((edge) => g.setEdge(edge.source, edge.target));
  dagre.layout(g);

  return nodes.map((node) => {
    const pos = g.node(node.id);
    const size = getSize(node);
    return {
      ...node,
      position: { x: pos.x - size.width / 2, y: pos.y - size.height / 2 },
      style: { ...node.style, width: size.width, height: size.height },
    };
  });
};

/**
 * Process API mind map data into nodes and edges. Theme-aware (Future Tech / Pink Cyberpunk).
 */
export const processMindMapData = (rootNode, themeId = DEFAULT_THEME_ID) => {
  if (!rootNode) return { nodes: [], edges: [] };

  const theme = getTheme(themeId);
  const t = theme.node;
  const edgeTheme = theme.edge;

  const allNodesRaw = [];
  const allEdgesRaw = [];
  let branchIndex = 0;
  const branchColors =
    themeId === 'pink'
      ? ['#ec4899', '#f472b6', '#f9a8d4', '#fbcfe8', '#fce7f3', '#fdf2f8']
      : themeId === 'default'
        ? ['#64748b', '#94a3b8', '#cbd5e1', '#e2e8f0', '#f1f5f9', '#f8fafc']
        : ['#06b6d4', '#22d3ee', '#0ea5e9', '#38bdf8', '#7dd3fc', '#bae6fd'];

  const traverse = (node, parentId = null, currentBranchColor = null) => {
    let nodeColor = currentBranchColor;
    if (parentId === 'root') {
      nodeColor = branchColors[branchIndex % branchColors.length];
      branchIndex++;
    }

    const isRoot = node.id === 'root' || !parentId;
    const borderColor =
      nodeColor ||
      (themeId === 'pink'
        ? '#ec4899'
        : themeId === 'default'
          ? '#94a3b8'
          : '#06b6d4');

    let nodeStyle = {
      padding: '10px',
      borderRadius: '20px',
      color: t.textColor,
      fontWeight: '500',
      fontFamily: t.fontFamily,
      fontSize: '14px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      textAlign: 'center',
      boxShadow: t.boxShadow,
    };

    if (isRoot) {
      nodeStyle = {
        ...nodeStyle,
        background: t.rootBg,
        border: t.rootBorder,
        fontSize: '26px',
        fontWeight: '800',
        borderRadius: '50%',
        zIndex: 10,
      };
    } else {
      nodeStyle = {
        ...nodeStyle,
        background: t.childBg,
        border: `1px solid ${borderColor}`,
      };
    }

    allNodesRaw.push({
      id: node.id,
      data: { label: node.label },
      position: { x: 0, y: 0 },
      style: nodeStyle,
      type: 'editable',
    });

    if (parentId) {
      const stroke = nodeColor || edgeTheme.stroke;
      allEdgesRaw.push({
        id: `e-${parentId}-${node.id}`,
        source: parentId,
        target: node.id,
        type: 'floating',
        animated: false,
        markerEnd: { type: 'arrowclosed' },
        style: {
          stroke,
          strokeWidth: edgeTheme.strokeWidth ?? 3,
          filter: edgeTheme.filter,
        },
      });
    }

    if (node.children) {
      node.children.forEach((child) => traverse(child, node.id, nodeColor));
    }
  };

  const safeRoot = { ...rootNode, id: 'root' };
  traverse(safeRoot);

  const rootNodeObj = allNodesRaw.find((n) => n.id === 'root');
  const firstLevelEdges = allEdgesRaw.filter((e) => e.source === 'root');
  const leftNodeIds = new Set();
  const rightNodeIds = new Set();
  firstLevelEdges.forEach((edge, index) => {
    const targetSet = index % 2 === 0 ? rightNodeIds : leftNodeIds;
    const collectDescendants = (nodeId) => {
      targetSet.add(nodeId);
      allEdgesRaw.filter((e) => e.source === nodeId).forEach((e) => collectDescendants(e.target));
    };
    collectDescendants(edge.target);
  });

  const rightNodes = [rootNodeObj, ...allNodesRaw.filter((n) => rightNodeIds.has(n.id))];
  const rightEdges = allEdgesRaw.filter((e) => rightNodeIds.has(e.target));
  const leftNodes = [rootNodeObj, ...allNodesRaw.filter((n) => leftNodeIds.has(n.id))];
  const leftEdges = allEdgesRaw.filter((e) => leftNodeIds.has(e.target));

  const layoutedRight = runDagreLayout(rightNodes, rightEdges, { rankdir: 'LR', ranksep: 200, nodesep: 50 });
  const layoutedLeft = runDagreLayout(leftNodes, leftEdges, { rankdir: 'LR', ranksep: 200, nodesep: 50 });

  const allRightY = layoutedRight.map((n) => n.position.y + (n.style?.height || 0));
  const allLeftY = layoutedLeft.map((n) => n.position.y + (n.style?.height || 0));
  const minY = Math.min(...allRightY, ...allLeftY);
  const maxY = Math.max(...allRightY, ...allLeftY);
  const centerY = (minY + maxY) / 2;

  const finalNodes = [];
  layoutedRight.forEach((node) => {
    if (node.id === 'root') {
      node.position = { x: -node.style.width / 2, y: centerY - node.style.height / 2 };
    }
    finalNodes.push(node);
  });
  layoutedLeft.forEach((node) => {
    if (node.id === 'root') return;
    const newX = -node.position.x - node.style.width;
    finalNodes.push({ ...node, position: { x: newX, y: node.position.y } });
  });

  return { nodes: finalNodes, edges: allEdgesRaw };
};
