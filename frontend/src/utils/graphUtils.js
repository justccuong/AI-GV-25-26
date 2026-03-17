import dagre from 'dagre';
import { DEFAULT_THEME_ID, getTheme } from './themeConfig';

export const NODE_TYPES = {
  STANDARD: 'standard',
  TEXT: 'text',
  IMAGE: 'image',
  DECISION: 'decision',
};

const ROOT_SIZE = 196;
const DEFAULT_DIMENSIONS = {
  [NODE_TYPES.STANDARD]: { width: 230, height: 78 },
  [NODE_TYPES.TEXT]: { width: 280, height: 160 },
  [NODE_TYPES.IMAGE]: { width: 240, height: 220 },
  [NODE_TYPES.DECISION]: { width: 220, height: 140 },
};

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function stripHtml(html) {
  if (typeof html !== 'string') {
    return '';
  }

  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function branchPalette(themeId) {
  if (themeId === 'pink') {
    return ['#ec4899', '#f472b6', '#fb7185', '#f9a8d4', '#fda4af'];
  }

  if (themeId === 'tech') {
    return ['#06b6d4', '#38bdf8', '#22d3ee', '#14b8a6', '#60a5fa'];
  }

  return ['#0ea5e9', '#22c55e', '#f97316', '#a855f7', '#ec4899'];
}

export function createNodeId(prefix = 'node') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function getDefaultNodeLabel(nodeType = NODE_TYPES.STANDARD) {
  switch (nodeType) {
    case NODE_TYPES.TEXT:
      return 'Text note';
    case NODE_TYPES.IMAGE:
      return 'Image reference';
    case NODE_TYPES.DECISION:
      return 'Decision point';
    default:
      return 'New node';
  }
}

function getNodeDimensions({ label, nodeType = NODE_TYPES.STANDARD, isRoot = false }) {
  if (isRoot) {
    return { width: ROOT_SIZE, height: ROOT_SIZE };
  }

  const contentWidth = clamp(stripHtml(label || getDefaultNodeLabel(nodeType)).length * 7.5 + 90, 180, 320);

  if (nodeType === NODE_TYPES.TEXT) {
    return { width: clamp(contentWidth + 30, 240, 340), height: DEFAULT_DIMENSIONS[NODE_TYPES.TEXT].height };
  }

  if (nodeType === NODE_TYPES.IMAGE) {
    return DEFAULT_DIMENSIONS[NODE_TYPES.IMAGE];
  }

  if (nodeType === NODE_TYPES.DECISION) {
    return DEFAULT_DIMENSIONS[NODE_TYPES.DECISION];
  }

  return { width: contentWidth, height: DEFAULT_DIMENSIONS[NODE_TYPES.STANDARD].height };
}

function makeTransparent(hexColor, alpha = '20') {
  if (typeof hexColor !== 'string' || !hexColor.startsWith('#') || hexColor.length !== 7) {
    return hexColor;
  }

  return `${hexColor}${alpha}`;
}

function getNodeStyle({
  themeId = DEFAULT_THEME_ID,
  nodeType = NODE_TYPES.STANDARD,
  label,
  isRoot = false,
  accentColor,
  width,
  height,
}) {
  const theme = getTheme(themeId);
  const themeNode = theme.node;
  const themeEdge = theme.edge;
  const dimensions = getNodeDimensions({ label, nodeType, isRoot });
  const resolvedAccent = accentColor || themeEdge.stroke;

  const baseStyle = {
    width: width ?? dimensions.width,
    height: height ?? dimensions.height,
    color: themeNode.textColor,
    borderRadius: 28,
    border: `1px solid ${makeTransparent(resolvedAccent, '60')}`,
    background: themeNode.childBg,
    boxShadow: themeNode.boxShadow || '0 18px 45px rgba(15, 23, 42, 0.18)',
    fontFamily: themeNode.fontFamily,
    fontWeight: 600,
    display: 'flex',
    alignItems: 'stretch',
    justifyContent: 'stretch',
    padding: 0,
    overflow: 'hidden',
    backdropFilter: 'blur(14px)',
  };

  if (isRoot) {
    return {
      ...baseStyle,
      width: width ?? ROOT_SIZE,
      height: height ?? ROOT_SIZE,
      borderRadius: '50%',
      border: '2px solid rgba(255,255,255,0.78)',
      background: 'linear-gradient(135deg, #0ea5e9 0%, #22d3ee 45%, #34d399 100%)',
      color: '#ecfeff',
      boxShadow: '0 28px 70px rgba(14, 165, 233, 0.35)',
    };
  }

  if (nodeType === NODE_TYPES.TEXT) {
    return {
      ...baseStyle,
      background: 'linear-gradient(180deg, rgba(15,23,42,0.92), rgba(15,23,42,0.78))',
      border: `1px dashed ${makeTransparent(resolvedAccent, '90')}`,
      borderRadius: 24,
      color: '#f8fafc',
    };
  }

  if (nodeType === NODE_TYPES.IMAGE) {
    return {
      ...baseStyle,
      background: 'linear-gradient(180deg, rgba(255,255,255,0.96), rgba(226,232,240,0.92))',
      border: `1px solid ${makeTransparent(resolvedAccent, '70')}`,
      color: '#0f172a',
      borderRadius: 30,
    };
  }

  if (nodeType === NODE_TYPES.DECISION) {
    return {
      ...baseStyle,
      background: `linear-gradient(135deg, ${makeTransparent(resolvedAccent, '20')}, ${makeTransparent(resolvedAccent, '95')})`,
      border: `1px solid ${makeTransparent(resolvedAccent, '95')}`,
      color: '#f8fafc',
      borderRadius: 0,
      clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
    };
  }

  return {
    ...baseStyle,
    background: `linear-gradient(135deg, ${makeTransparent(resolvedAccent, '20')}, ${makeTransparent(resolvedAccent, '88')})`,
    border: `1px solid ${makeTransparent(resolvedAccent, '88')}`,
    color: themeId === 'default' ? '#0f172a' : '#f8fafc',
  };
}

function getEdgeStyle(themeId = DEFAULT_THEME_ID, accentColor) {
  const theme = getTheme(themeId);
  const resolvedAccent = accentColor || theme.edge.stroke;

  return {
    stroke: resolvedAccent,
    strokeWidth: theme.edge.strokeWidth ?? 3,
    filter: theme.edge.filter,
  };
}

export function createDiagramNode({
  id = createNodeId('node'),
  label,
  themeId = DEFAULT_THEME_ID,
  position = { x: 0, y: 0 },
  nodeType = NODE_TYPES.STANDARD,
  isRoot = false,
  imageUrl = '',
  fontSize,
  accentColor,
}) {
  const data = {
    label: label || getDefaultNodeLabel(nodeType),
    nodeType,
    isRoot,
    imageUrl,
    accentColor,
    fontSize:
      typeof fontSize === 'number'
        ? fontSize
        : isRoot
          ? 22
          : nodeType === NODE_TYPES.TEXT
            ? 16
            : 14,
  };

  return {
    id,
    type: 'editable',
    position,
    data,
    style: getNodeStyle({
      themeId,
      nodeType,
      label: data.label,
      isRoot,
      accentColor,
    }),
  };
}

export function createDiagramEdge({
  id,
  source,
  target,
  themeId = DEFAULT_THEME_ID,
  label = '',
  accentColor,
}) {
  const style = getEdgeStyle(themeId, accentColor);

  return {
    id: id || `edge-${source}-${target}-${Math.random().toString(36).slice(2, 7)}`,
    source,
    target,
    type: 'floating',
    label,
    markerEnd: { type: 'arrowclosed', color: style.stroke },
    data: { accentColor: accentColor || style.stroke },
    style,
  };
}

function hydrateNode(node, themeId = DEFAULT_THEME_ID) {
  const nodeType = node.data?.nodeType || NODE_TYPES.STANDARD;
  const isRoot = Boolean(node.data?.isRoot);
  const accentColor = node.data?.accentColor;

  return {
    ...node,
    data: {
      ...node.data,
      nodeType,
      isRoot,
      fontSize:
        typeof node.data?.fontSize === 'number'
          ? node.data.fontSize
          : Number(node.data?.fontSize) || (isRoot ? 22 : nodeType === NODE_TYPES.TEXT ? 16 : 14),
      imageUrl: node.data?.imageUrl || '',
    },
    style: {
      ...getNodeStyle({
        themeId,
        nodeType,
        label: node.data?.label,
        isRoot,
        accentColor,
        width: node.style?.width,
        height: node.style?.height,
      }),
      ...('width' in (node.style || {}) ? { width: node.style.width } : {}),
      ...('height' in (node.style || {}) ? { height: node.style.height } : {}),
    },
  };
}

function hydrateEdge(edge, themeId = DEFAULT_THEME_ID) {
  const accentColor = edge.data?.accentColor || edge.style?.stroke;
  const style = getEdgeStyle(themeId, accentColor);

  return {
    ...edge,
    type: edge.type || 'floating',
    markerEnd: { type: 'arrowclosed', color: style.stroke },
    data: {
      ...edge.data,
      accentColor: accentColor || style.stroke,
    },
    style: {
      ...style,
      ...edge.style,
      stroke: accentColor || style.stroke,
      strokeWidth: edge.style?.strokeWidth ?? style.strokeWidth,
    },
  };
}

export function applyThemeToDiagram(nodes = [], edges = [], themeId = DEFAULT_THEME_ID) {
  return {
    nodes: nodes.map((node) => hydrateNode(node, themeId)),
    edges: edges.map((edge) => hydrateEdge(edge, themeId)),
  };
}

export function autoLayoutDiagram(nodes = [], edges = [], options = {}, themeId = DEFAULT_THEME_ID) {
  if (!nodes.length) {
    return applyThemeToDiagram(nodes, edges, themeId);
  }

  const { direction = 'LR', ranksep = 110, nodesep = 60 } = options;
  const graph = new dagre.graphlib.Graph();

  graph.setDefaultEdgeLabel(() => ({}));
  graph.setGraph({
    rankdir: direction,
    ranksep,
    nodesep,
    marginx: 40,
    marginy: 40,
  });

  nodes.forEach((node) => {
    const hydrated = hydrateNode(node, themeId);
    const width = Number(hydrated.style?.width) || getNodeDimensions({
      label: hydrated.data?.label,
      nodeType: hydrated.data?.nodeType,
      isRoot: hydrated.data?.isRoot,
    }).width;
    const height = Number(hydrated.style?.height) || getNodeDimensions({
      label: hydrated.data?.label,
      nodeType: hydrated.data?.nodeType,
      isRoot: hydrated.data?.isRoot,
    }).height;

    graph.setNode(node.id, { width, height });
  });

  edges.forEach((edge) => {
    graph.setEdge(edge.source, edge.target);
  });

  dagre.layout(graph);

  const layoutedNodes = nodes.map((node) => {
    const layout = graph.node(node.id);
    const hydrated = hydrateNode(node, themeId);
    const width = Number(hydrated.style?.width);
    const height = Number(hydrated.style?.height);

    return {
      ...hydrated,
      position: layout
        ? {
            x: layout.x - width / 2,
            y: layout.y - height / 2,
          }
        : node.position,
    };
  });

  return {
    nodes: layoutedNodes,
    edges: edges.map((edge) => hydrateEdge(edge, themeId)),
  };
}

export function normalizeSavedDiagram(payload, fallbackThemeId = DEFAULT_THEME_ID) {
  if (!payload) {
    return { nodes: [], edges: [], themeId: fallbackThemeId };
  }

  const parsedPayload = typeof payload === 'string' ? JSON.parse(payload) : payload;

  if (Array.isArray(parsedPayload.nodes) && Array.isArray(parsedPayload.edges)) {
    const resolvedThemeId = parsedPayload.themeId || fallbackThemeId;
    const themed = applyThemeToDiagram(parsedPayload.nodes, parsedPayload.edges, resolvedThemeId);

    return {
      nodes: themed.nodes,
      edges: themed.edges,
      themeId: resolvedThemeId,
    };
  }

  const root = parsedPayload.root || parsedPayload;
  const mindMap = processMindMapData(root, fallbackThemeId);

  return {
    nodes: mindMap.nodes,
    edges: mindMap.edges,
    themeId: fallbackThemeId,
  };
}

export function processMindMapData(rootNode, themeId = DEFAULT_THEME_ID) {
  if (!rootNode) {
    return { nodes: [], edges: [] };
  }

  const colors = branchPalette(themeId);
  const rawNodes = [];
  const rawEdges = [];
  let branchIndex = 0;

  const traverse = (node, parentId = null, depth = 0, inheritedColor = null) => {
    const isRoot = !parentId;
    const nodeColor = isRoot
      ? getTheme(themeId).edge.stroke
      : depth === 1
        ? colors[branchIndex++ % colors.length]
        : inheritedColor;

    const nodeType = node.nodeType || NODE_TYPES.STANDARD;
    const nextNode = createDiagramNode({
      id: node.id || (isRoot ? 'root' : createNodeId('node')),
      label: node.label || (isRoot ? 'Main Topic' : getDefaultNodeLabel(nodeType)),
      themeId,
      nodeType,
      isRoot,
      imageUrl: node.imageUrl || '',
      fontSize: node.fontSize,
      accentColor: nodeColor,
    });

    rawNodes.push(nextNode);

    if (parentId) {
      rawEdges.push(
        createDiagramEdge({
          source: parentId,
          target: nextNode.id,
          themeId,
          label: node.edgeLabel || '',
          accentColor: nodeColor,
        })
      );
    }

    (node.children || []).forEach((child) => {
      traverse(child, nextNode.id, depth + 1, nodeColor);
    });
  };

  traverse({ ...rootNode, id: rootNode.id || 'root' });

  return autoLayoutDiagram(rawNodes, rawEdges, { direction: 'LR' }, themeId);
}
