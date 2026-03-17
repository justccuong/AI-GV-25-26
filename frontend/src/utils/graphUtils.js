import { DEFAULT_THEME_ID, getTheme } from './themeConfig';

export const NODE_TYPES = {
  STANDARD: 'standard',
  TEXT: 'text',
  IMAGE: 'image',
  DECISION: 'decision',
};

const ROOT_SIZE = 196;
const RADIAL_BASE_RADIUS = 360;
const RADIAL_RADIUS_STEP = 230;
const RADIAL_MIN_ARC_GAP = 220;
const VALID_EDGE_TYPES = new Set(['floating', 'bezier', 'straight', 'step']);

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

export function normalizeTextValue(value) {
  return typeof value === 'string' ? value.trim() : '';
}

export function normalizeEdgeLabel(value) {
  return normalizeTextValue(value);
}

function slugify(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function branchPalette(themeId) {
  if (themeId === 'pink') {
    return ['#f0519c', '#fb7185', '#f472b6', '#c084fc', '#f9a8d4'];
  }

  if (themeId === 'tech') {
    return ['#06b6d4', '#38bdf8', '#22d3ee', '#14b8a6', '#60a5fa'];
  }

  return ['#ff5a99', '#4fd392', '#f4c842', '#fb9b4a', '#9a82ff', '#63a7ff'];
}

export function createNodeId(prefix = 'node') {
  const safePrefix = slugify(prefix) || 'node';
  return `${safePrefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createAssistantNodeId(label = 'nhanh-moi', index = 0) {
  return createNodeId(slugify(label) || `nhanh-moi-${index + 1}`);
}

function normalizeNodeType(nodeType = NODE_TYPES.STANDARD) {
  return Object.values(NODE_TYPES).includes(nodeType) ? nodeType : NODE_TYPES.STANDARD;
}

export function getDefaultNodeLabel(nodeType = NODE_TYPES.STANDARD) {
  switch (nodeType) {
    case NODE_TYPES.TEXT:
      return 'Ghi chú';
    case NODE_TYPES.IMAGE:
      return 'Hình ảnh';
    case NODE_TYPES.DECISION:
      return 'Điểm quyết định';
    default:
      return 'Nút mới';
  }
}

function getResolvedNodeLabel(label, nodeType = NODE_TYPES.STANDARD) {
  return normalizeTextValue(label) || getDefaultNodeLabel(nodeType);
}

function getNodeDimensions({ label, nodeType = NODE_TYPES.STANDARD, isRoot = false }) {
  if (isRoot) {
    return { width: ROOT_SIZE, height: ROOT_SIZE };
  }

  const contentWidth = clamp(stripHtml(label || getDefaultNodeLabel(nodeType)).length * 7.5 + 90, 180, 320);

  if (nodeType === NODE_TYPES.TEXT) {
    return {
      width: clamp(contentWidth + 30, 240, 340),
      height: DEFAULT_DIMENSIONS[NODE_TYPES.TEXT].height,
    };
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

function getPastelNodeBackground(accentColor, startAlpha = '28', endAlpha = '68') {
  return `linear-gradient(145deg, ${makeTransparent(accentColor, startAlpha)} 0%, ${makeTransparent(accentColor, endAlpha)} 100%)`;
}

function getSoftNodeShadow(accentColor, alpha = '28') {
  return `0 18px 38px ${makeTransparent(accentColor, alpha)}, 0 4px 14px rgba(148, 163, 184, 0.08)`;
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
  const isRainbowTheme = themeId === DEFAULT_THEME_ID;

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
    textShadow: themeNode.textShadow || 'none',
  };

  if (isRoot) {
    return {
      ...baseStyle,
      width: width ?? ROOT_SIZE,
      height: height ?? ROOT_SIZE,
      borderRadius: '50%',
      border: isRainbowTheme
        ? `1px solid ${makeTransparent(resolvedAccent, '74')}`
        : themeNode.rootBorder,
      background: isRainbowTheme
        ? `radial-gradient(circle at 30% 25%, ${makeTransparent(resolvedAccent, '4a')} 0%, ${makeTransparent(resolvedAccent, '24')} 42%, ${makeTransparent(resolvedAccent, '08')} 100%)`
        : themeNode.rootBg,
      color: isRainbowTheme ? '#312e81' : themeNode.rootTextColor,
      boxShadow: isRainbowTheme
        ? `0 22px 56px ${makeTransparent(resolvedAccent, '30')}, 0 6px 18px rgba(167, 139, 250, 0.08)`
        : baseStyle.boxShadow,
      textShadow: themeNode.textShadow || 'none',
    };
  }

  if (nodeType === NODE_TYPES.TEXT) {
    return {
      ...baseStyle,
      background: themeId === DEFAULT_THEME_ID
        ? 'linear-gradient(180deg, rgba(15, 23, 42, 0.92), rgba(30, 41, 59, 0.84))'
        : 'linear-gradient(180deg, rgba(15,23,42,0.92), rgba(15,23,42,0.78))',
      border: `1px dashed ${makeTransparent(resolvedAccent, '90')}`,
      borderRadius: 24,
      color: '#f8fafc',
      textShadow: '0 1px 2px rgba(15, 23, 42, 0.5)',
    };
  }

  if (nodeType === NODE_TYPES.IMAGE) {
    return {
      ...baseStyle,
      background: 'linear-gradient(180deg, rgba(255,255,255,0.96), rgba(226,232,240,0.92))',
      border: `1px solid ${makeTransparent(resolvedAccent, '70')}`,
      color: '#0f172a',
      borderRadius: 30,
      textShadow: 'none',
    };
  }

  if (nodeType === NODE_TYPES.DECISION) {
    return {
      ...baseStyle,
      background: isRainbowTheme
        ? getPastelNodeBackground(resolvedAccent, '2c', '74')
        : `linear-gradient(135deg, ${makeTransparent(resolvedAccent, '20')}, ${makeTransparent(resolvedAccent, '95')})`,
      border: `1px solid ${makeTransparent(resolvedAccent, isRainbowTheme ? '6c' : '95')}`,
      color: isRainbowTheme ? '#334155' : '#f8fafc',
      borderRadius: 0,
      clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
      textShadow: isRainbowTheme ? 'none' : '0 1px 2px rgba(15, 23, 42, 0.55)',
      boxShadow: isRainbowTheme ? getSoftNodeShadow(resolvedAccent, '24') : baseStyle.boxShadow,
    };
  }

  return {
    ...baseStyle,
    background: isRainbowTheme
      ? getPastelNodeBackground(resolvedAccent, '2a', '70')
      : `linear-gradient(135deg, ${makeTransparent(resolvedAccent, '20')}, ${makeTransparent(resolvedAccent, '88')})`,
    border: isRainbowTheme
      ? `1px solid ${makeTransparent(resolvedAccent, '72')}`
      : `1px solid ${makeTransparent(resolvedAccent, '88')}`,
    color: isRainbowTheme ? '#334155' : themeNode.textColor,
    textShadow: themeNode.textShadow || 'none',
    boxShadow: isRainbowTheme
      ? getSoftNodeShadow(resolvedAccent, '26')
      : baseStyle.boxShadow,
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
  const resolvedNodeType = normalizeNodeType(nodeType);
  const data = {
    label: getResolvedNodeLabel(label, resolvedNodeType),
    nodeType: resolvedNodeType,
    isRoot,
    imageUrl,
    accentColor,
    fontSize:
      typeof fontSize === 'number'
        ? fontSize
        : isRoot
          ? 22
          : resolvedNodeType === NODE_TYPES.TEXT
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
      nodeType: resolvedNodeType,
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
  type = 'floating',
}) {
  const style = getEdgeStyle(themeId, accentColor);
  const normalizedType = VALID_EDGE_TYPES.has(type) ? type : 'floating';

  return {
    id: id || `edge-${source}-${target}-${Math.random().toString(36).slice(2, 7)}`,
    source,
    target,
    type: normalizedType,
    label: normalizeEdgeLabel(label),
    markerEnd: { type: 'arrowclosed', color: style.stroke },
    data: { accentColor: accentColor || style.stroke },
    style,
  };
}

function hydrateNode(node, themeId = DEFAULT_THEME_ID) {
  const nodeType = normalizeNodeType(node.data?.nodeType || NODE_TYPES.STANDARD);
  const isRoot = Boolean(node.data?.isRoot);
  const accentColor = normalizeTextValue(node.data?.accentColor) || undefined;
  const fontSize = typeof node.data?.fontSize === 'number'
    ? node.data.fontSize
    : Number(node.data?.fontSize) || (isRoot ? 22 : nodeType === NODE_TYPES.TEXT ? 16 : 14);

  return {
    ...node,
    data: {
      ...node.data,
      label: getResolvedNodeLabel(node.data?.label, nodeType),
      nodeType,
      isRoot,
      fontSize,
      imageUrl: typeof node.data?.imageUrl === 'string' ? node.data.imageUrl : '',
      accentColor,
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
  const accentColor = normalizeTextValue(edge.data?.accentColor) || edge.style?.stroke;
  const style = getEdgeStyle(themeId, accentColor);

  return {
    ...edge,
    type: VALID_EDGE_TYPES.has(edge.type) ? edge.type : 'floating',
    label: normalizeEdgeLabel(edge.label),
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

function getLayoutRootId(nodes = [], edges = []) {
  const explicitRoot = nodes.find((node) => node.data?.isRoot);

  if (explicitRoot) {
    return explicitRoot.id;
  }

  const incomingCounts = new Map(nodes.map((node) => [node.id, 0]));

  edges.forEach((edge) => {
    incomingCounts.set(edge.target, (incomingCounts.get(edge.target) || 0) + 1);
  });

  return nodes.find((node) => (incomingCounts.get(node.id) || 0) === 0)?.id || nodes[0]?.id;
}

function getNodeCenterPosition(node) {
  const width = Number(node.style?.width) || getNodeDimensions({
    label: node.data?.label,
    nodeType: node.data?.nodeType,
    isRoot: node.data?.isRoot,
  }).width;
  const height = Number(node.style?.height) || getNodeDimensions({
    label: node.data?.label,
    nodeType: node.data?.nodeType,
    isRoot: node.data?.isRoot,
  }).height;

  return {
    width,
    height,
    x: node.position.x + width / 2,
    y: node.position.y + height / 2,
  };
}

function buildRadialTree(nodes = [], edges = []) {
  const rootId = getLayoutRootId(nodes, edges);
  const adjacency = new Map(nodes.map((node) => [node.id, []]));
  const childrenMap = new Map(nodes.map((node) => [node.id, []]));
  const depthMap = new Map();
  const nodeIds = new Set(nodes.map((node) => node.id));

  edges.forEach((edge) => {
    if (nodeIds.has(edge.source) && nodeIds.has(edge.target)) {
      adjacency.get(edge.source)?.push(edge.target);
    }
  });

  const visited = new Set();
  const queue = [];

  const traverseComponent = (startId, attachToRoot = false) => {
    if (!startId || visited.has(startId)) {
      return;
    }

    visited.add(startId);
    depthMap.set(startId, attachToRoot ? 1 : 0);

    if (attachToRoot && startId !== rootId) {
      childrenMap.get(rootId)?.push(startId);
    }

    queue.push(startId);

    while (queue.length) {
      const parentId = queue.shift();
      const parentDepth = depthMap.get(parentId) || 0;

      (adjacency.get(parentId) || []).forEach((childId) => {
        if (!nodeIds.has(childId) || visited.has(childId)) {
          return;
        }

        visited.add(childId);
        depthMap.set(childId, parentDepth + 1);
        childrenMap.get(parentId)?.push(childId);
        queue.push(childId);
      });
    }
  };

  traverseComponent(rootId);

  nodes.forEach((node) => {
    if (!visited.has(node.id)) {
      traverseComponent(node.id, true);
    }
  });

  const subtreeWeight = new Map();

  const computeWeight = (nodeId, stack = new Set()) => {
    if (subtreeWeight.has(nodeId)) {
      return subtreeWeight.get(nodeId);
    }

    if (stack.has(nodeId)) {
      return 1;
    }

    stack.add(nodeId);
    const children = childrenMap.get(nodeId) || [];

    if (!children.length) {
      subtreeWeight.set(nodeId, 1);
      stack.delete(nodeId);
      return 1;
    }

    const weight = children.reduce((total, childId) => total + computeWeight(childId, stack), 0);
    subtreeWeight.set(nodeId, Math.max(1, weight));
    stack.delete(nodeId);
    return subtreeWeight.get(nodeId);
  };

  computeWeight(rootId);

  const depthCounts = new Map();
  depthMap.forEach((depth) => {
    depthCounts.set(depth, (depthCounts.get(depth) || 0) + 1);
  });

  return {
    rootId,
    childrenMap,
    depthMap,
    depthCounts,
    subtreeWeight,
  };
}

function getRadiusForDepth(depth, depthCounts) {
  if (depth <= 0) {
    return 0;
  }

  const count = depthCounts.get(depth) || 1;
  const minimumRadius = (count * RADIAL_MIN_ARC_GAP) / (2 * Math.PI);
  return Math.max(RADIAL_BASE_RADIUS + (depth - 1) * RADIAL_RADIUS_STEP, minimumRadius);
}

function centerToNodePosition(node, centerX, centerY) {
  const width = Number(node.style?.width) || getNodeDimensions({
    label: node.data?.label,
    nodeType: node.data?.nodeType,
    isRoot: node.data?.isRoot,
  }).width;
  const height = Number(node.style?.height) || getNodeDimensions({
    label: node.data?.label,
    nodeType: node.data?.nodeType,
    isRoot: node.data?.isRoot,
  }).height;

  return {
    x: centerX - width / 2,
    y: centerY - height / 2,
  };
}

export function autoLayoutDiagram(nodes = [], edges = [], options = {}, themeId = DEFAULT_THEME_ID) {
  if (!nodes.length) {
    return applyThemeToDiagram(nodes, edges, themeId);
  }

  const { centerX = 0, centerY = 0 } = options;
  const themed = applyThemeToDiagram(nodes, edges, themeId);
  const nodeMap = new Map(themed.nodes.map((node) => [node.id, node]));
  const { rootId, childrenMap, depthMap, depthCounts, subtreeWeight } = buildRadialTree(themed.nodes, themed.edges);
  const centerPositions = new Map();

  if (rootId && nodeMap.has(rootId)) {
    centerPositions.set(rootId, { x: centerX, y: centerY });
  }

  const assignChildren = (parentId, startAngle, endAngle) => {
    const children = childrenMap.get(parentId) || [];

    if (!children.length) {
      return;
    }

    const distributeEvenly = parentId === rootId;
    const totalWeight = distributeEvenly
      ? children.length
      : children.reduce((total, childId) => total + (subtreeWeight.get(childId) || 1), 0) || children.length;
    let angleCursor = startAngle;

    children.forEach((childId, index) => {
      const weight = subtreeWeight.get(childId) || 1;
      const remainingAngle = endAngle - angleCursor;
      const segmentAngle = index === children.length - 1
        ? remainingAngle
        : (endAngle - startAngle) * ((distributeEvenly ? 1 : weight) / totalWeight);
      const childStart = angleCursor;
      const childEnd = angleCursor + segmentAngle;
      const childAngle = childStart + segmentAngle / 2;
      const depth = depthMap.get(childId) || 1;
      const radius = getRadiusForDepth(depth, depthCounts);

      centerPositions.set(childId, {
        x: centerX + Math.cos(childAngle) * radius,
        y: centerY + Math.sin(childAngle) * radius,
      });

      assignChildren(childId, childStart, childEnd);
      angleCursor = childEnd;
    });
  };

  assignChildren(rootId, -Math.PI / 2, (3 * Math.PI) / 2);

  const layoutedNodes = themed.nodes.map((node) => {
    const fallbackCenter = getNodeCenterPosition(node);
    const center = centerPositions.get(node.id) || {
      x: fallbackCenter.x,
      y: fallbackCenter.y,
    };

    return {
      ...node,
      position: centerToNodePosition(node, center.x, center.y),
    };
  });

  return {
    nodes: layoutedNodes,
    edges: themed.edges.map((edge) => hydrateEdge(edge, themeId)),
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
    const nodeType = normalizeNodeType(node.nodeType || NODE_TYPES.STANDARD);
    const nextNode = createDiagramNode({
      id: node.id || (isRoot ? 'root' : createNodeId('node')),
      label: node.label || (isRoot ? 'Chủ đề trung tâm' : getDefaultNodeLabel(nodeType)),
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

  return autoLayoutDiagram(rawNodes, rawEdges, {}, themeId);
}

function removeNodesAndConnectedEdges(nodeMap, edgeMap, removeNodeIds, removeEdgeIds) {
  removeNodeIds.forEach((nodeId) => {
    nodeMap.delete(nodeId);
  });

  Array.from(edgeMap.entries()).forEach(([edgeId, edge]) => {
    if (
      removeEdgeIds.has(edgeId) ||
      removeNodeIds.has(edge.source) ||
      removeNodeIds.has(edge.target)
    ) {
      edgeMap.delete(edgeId);
    }
  });
}

function findEdgeByEndpoints(edgeMap, source, target) {
  return Array.from(edgeMap.values()).find((edge) => edge.source === source && edge.target === target);
}

function getNodeUpdateFontSize(value, fallbackValue) {
  if (typeof value === 'number') {
    return value;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallbackValue;
}

export function mergeAssistantDiagram(currentNodes = [], currentEdges = [], payload = {}, themeId = DEFAULT_THEME_ID) {
  if (!payload) {
    return applyThemeToDiagram(currentNodes, currentEdges, themeId);
  }

  const parsedPayload = typeof payload === 'string' ? JSON.parse(payload) : payload;

  if (parsedPayload.mode === 'replace' || parsedPayload.root || parsedPayload.children) {
    const replacement = normalizeSavedDiagram(parsedPayload.root || parsedPayload, parsedPayload.themeId || themeId);
    return autoLayoutDiagram(replacement.nodes, replacement.edges, {}, replacement.themeId || themeId);
  }

  const nextThemeId = parsedPayload.themeId || themeId;
  const themedCurrent = applyThemeToDiagram(currentNodes, currentEdges, nextThemeId);
  const nodeMap = new Map(themedCurrent.nodes.map((node) => [String(node.id), node]));
  const edgeMap = new Map(themedCurrent.edges.map((edge) => [String(edge.id), edge]));
  const removeNodeIds = new Set((parsedPayload.removeNodeIds || parsedPayload.removedNodeIds || []).map((value) => String(value)));
  const removeEdgeIds = new Set((parsedPayload.removeEdgeIds || parsedPayload.removedEdgeIds || []).map((value) => String(value)));
  const nodeUpdates = Array.isArray(parsedPayload.nodes)
    ? parsedPayload.nodes
    : Array.isArray(parsedPayload.node_updates)
      ? parsedPayload.node_updates
      : [];
  const edgeUpdates = Array.isArray(parsedPayload.edges)
    ? parsedPayload.edges
    : Array.isArray(parsedPayload.edge_updates)
      ? parsedPayload.edge_updates
      : [];

  removeNodesAndConnectedEdges(nodeMap, edgeMap, removeNodeIds, removeEdgeIds);

  nodeUpdates.forEach((nodeUpdate, index) => {
    const requestedId = normalizeTextValue(nodeUpdate.id);
    const nextId = requestedId || createAssistantNodeId(nodeUpdate.label, index);
    const nodeType = normalizeNodeType(nodeUpdate.nodeType || nodeMap.get(nextId)?.data?.nodeType || NODE_TYPES.STANDARD);
    const existingNode = nodeMap.get(nextId);
    const parentId = normalizeTextValue(nodeUpdate.parentId);
    const accentColor = normalizeTextValue(nodeUpdate.accentColor) || existingNode?.data?.accentColor;
    const labelProvided = typeof nodeUpdate.label === 'string';
    const nextLabel = labelProvided
      ? getResolvedNodeLabel(nodeUpdate.label, nodeType)
      : existingNode?.data?.label || getDefaultNodeLabel(nodeType);

    if (existingNode) {
      nodeMap.set(
        nextId,
        hydrateNode(
          {
            ...existingNode,
            data: {
              ...existingNode.data,
              ...(labelProvided ? { label: nextLabel } : {}),
              ...(nodeUpdate.nodeType ? { nodeType } : {}),
              ...(Object.prototype.hasOwnProperty.call(nodeUpdate, 'imageUrl') ? { imageUrl: nodeUpdate.imageUrl || '' } : {}),
              ...(Object.prototype.hasOwnProperty.call(nodeUpdate, 'fontSize')
                ? { fontSize: getNodeUpdateFontSize(nodeUpdate.fontSize, existingNode.data?.fontSize) }
                : {}),
              ...(accentColor ? { accentColor } : {}),
            },
          },
          nextThemeId
        )
      );
    } else {
      const parentNode = parentId ? nodeMap.get(parentId) : null;
      const basePosition = parentNode
        ? {
            x: parentNode.position.x + (Number(parentNode.style?.width) || 220) + 120,
            y: parentNode.position.y,
          }
        : { x: index * 40, y: index * 40 };

      nodeMap.set(
        nextId,
        createDiagramNode({
          id: nextId,
          label: nextLabel,
          themeId: nextThemeId,
          nodeType,
          imageUrl: nodeUpdate.imageUrl || '',
          fontSize: getNodeUpdateFontSize(nodeUpdate.fontSize, undefined),
          accentColor,
          position: basePosition,
        })
      );
    }

    if (parentId && nodeMap.has(parentId) && parentId !== nextId) {
      Array.from(edgeMap.entries()).forEach(([edgeId, edge]) => {
        if (edge.target === nextId && edge.source !== parentId) {
          edgeMap.delete(edgeId);
        }
      });

      const existingEdge = findEdgeByEndpoints(edgeMap, parentId, nextId);
      const nextEdgeLabel = Object.prototype.hasOwnProperty.call(nodeUpdate, 'edgeLabel')
        ? normalizeEdgeLabel(nodeUpdate.edgeLabel)
        : existingEdge?.label || '';

      if (existingEdge) {
        edgeMap.set(
          existingEdge.id,
          hydrateEdge(
            {
              ...existingEdge,
              label: nextEdgeLabel,
              data: {
                ...existingEdge.data,
                ...(accentColor ? { accentColor } : {}),
              },
            },
            nextThemeId
          )
        );
      } else {
        const edgeId = `edge-${parentId}-${nextId}`;
        edgeMap.set(
          edgeId,
          createDiagramEdge({
            id: edgeId,
            source: parentId,
            target: nextId,
            themeId: nextThemeId,
            label: nextEdgeLabel,
            accentColor,
          })
        );
      }
    }
  });

  edgeUpdates.forEach((edgeUpdate, index) => {
    const source = normalizeTextValue(edgeUpdate.source);
    const target = normalizeTextValue(edgeUpdate.target);

    if (!source || !target || source === target || !nodeMap.has(source) || !nodeMap.has(target)) {
      return;
    }

    const explicitId = normalizeTextValue(edgeUpdate.id);
    const matchedEdge = explicitId ? edgeMap.get(explicitId) : findEdgeByEndpoints(edgeMap, source, target);
    const edgeId = matchedEdge?.id || explicitId || `edge-${source}-${target}-${index}`;
    const accentColor = normalizeTextValue(edgeUpdate.accentColor) || matchedEdge?.data?.accentColor;

    edgeMap.set(
      edgeId,
      hydrateEdge(
        {
          ...(matchedEdge || createDiagramEdge({ id: edgeId, source, target, themeId: nextThemeId, accentColor })),
          id: edgeId,
          source,
          target,
          type: VALID_EDGE_TYPES.has(edgeUpdate.type) ? edgeUpdate.type : matchedEdge?.type || 'floating',
          label: Object.prototype.hasOwnProperty.call(edgeUpdate, 'label')
            ? normalizeEdgeLabel(edgeUpdate.label)
            : matchedEdge?.label || '',
          style: {
            ...(matchedEdge?.style || {}),
            ...(edgeUpdate.strokeColor ? { stroke: edgeUpdate.strokeColor } : {}),
            ...(Object.prototype.hasOwnProperty.call(edgeUpdate, 'strokeWidth')
              ? { strokeWidth: Number(edgeUpdate.strokeWidth) || matchedEdge?.style?.strokeWidth || 3 }
              : {}),
          },
          data: {
            ...(matchedEdge?.data || {}),
            ...(accentColor ? { accentColor } : {}),
          },
        },
        nextThemeId
      )
    );
  });

  const mergedNodes = Array.from(nodeMap.values());
  const mergedEdges = Array.from(edgeMap.values()).filter(
    (edge) => nodeMap.has(edge.source) && nodeMap.has(edge.target)
  );

  return autoLayoutDiagram(mergedNodes, mergedEdges, {}, nextThemeId);
}

