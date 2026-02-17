import React, { useCallback, useState, useRef, useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  EdgeLabelRenderer,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { MousePointer2, Link2, Palette, ImagePlus, Plus } from 'lucide-react';

import FloatingEdge from './FloatingEdge';
import EditableNode from './EditableNode';
import EdgeSettingsPanel from './EdgeSettingsPanel';
import AddNodeButton from './AddNodeButton';
import { getTheme, THEME_IDS, themes } from '../utils/themeConfig';

const edgeTypes = { floating: FloatingEdge };
const nodeTypes = { editable: EditableNode };

export default function MindMapViewer({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  setNodes,
  setEdges,
  themeId,
  onThemeChange,
  onNodeLabelChange,
  onEdgeUpdate,
  onAddImage,
}) {
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [toolMode, setToolMode] = useState('select');
  const [connectSourceNodeId, setConnectSourceNodeId] = useState(null);
  const [editingEdgeLabel, setEditingEdgeLabel] = useState(null);
  const edgeLabelInputRef = useRef(null);

  const theme = getTheme(themeId);

  const onConnect = useCallback(
    (params) =>
      setEdges((eds) =>
        addEdge({
          ...params,
          type: 'floating',
          animated: false,
          markerEnd: { type: 'arrowclosed' },
          label: '',
          style: {
            stroke: theme.edge.stroke,
            strokeWidth: theme.edge.strokeWidth ?? 3,
            filter: theme.edge.filter,
          },
        }, eds)
      ),
    [setEdges, theme]
  );

  const onNodeClick = useCallback(
    (event, node) => {
      if (toolMode !== 'connect') return;
      event.stopPropagation();
      if (connectSourceNodeId === null) {
        setConnectSourceNodeId(node.id);
        return;
      }
      if (connectSourceNodeId === node.id) return;
      setEdges((eds) =>
        addEdge(
          {
            source: connectSourceNodeId,
            target: node.id,
            type: 'floating',
            markerEnd: { type: 'arrowclosed' },
            label: '',
            style: {
              stroke: theme.edge.stroke,
              strokeWidth: theme.edge.strokeWidth ?? 3,
              filter: theme.edge.filter,
            },
          },
          eds
        )
      );
      setConnectSourceNodeId(null);
    },
    [toolMode, connectSourceNodeId, setEdges, theme]
  );

  const onEdgeClick = useCallback((event, edge) => {
    event.stopPropagation();
    const target = event.target;
    if (target.classList.contains('edge-label') || target.closest('.edge-label')) {
      setEditingEdgeLabel(edge.id);
      return;
    }
    setSelectedEdge(edge);
  }, []);


  const handleEdgeLabelChange = useCallback(
    (edgeId, newLabel) => {
      setEdges((eds) =>
        eds.map((edge) => (edge.id === edgeId ? { ...edge, label: newLabel } : edge))
      );
      setEditingEdgeLabel(null);
    },
    [setEdges]
  );

  useEffect(() => {
    if (editingEdgeLabel && edgeLabelInputRef.current) {
      edgeLabelInputRef.current.focus();
    }
  }, [editingEdgeLabel]);

  const handleEdgeUpdate = useCallback(
    (updatedEdge) => {
      if (onEdgeUpdate) onEdgeUpdate(updatedEdge);
      setSelectedEdge(null);
    },
    [onEdgeUpdate]
  );

  const enhancedNodes = nodes.map((node) => ({
    ...node,
    data: {
      ...node.data,
      onLabelChange: onNodeLabelChange,
      isConnectSource: node.id === connectSourceNodeId,
    },
    draggable: toolMode === 'select',
  }));

  return (
    <div
      className="w-full h-full relative"
      style={{
        background: theme.background,
      }}
    >
      {/* Toolbar: theme switcher + tool mode */}
      {nodes.length > 0 && (
        <div
          className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-3 p-2 rounded-xl shadow-lg border border-white/10"
          style={{
            background: theme.backgroundPattern || 'rgba(0,0,0,0.4)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <span className="text-sm text-slate-300 px-2 flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Theme
          </span>
          <select
            value={themeId}
            onChange={(e) => onThemeChange(e.target.value)}
            className="bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
          >
            {Object.values(THEME_IDS).map((id) => (
              <option key={id} value={id} className="bg-slate-800 text-white">
                {themes[id].name}
              </option>
            ))}
          </select>
          <div className="w-px h-6 bg-white/20" />
          <span className="text-sm text-slate-300 px-2">Tool</span>
          <div className="flex rounded-lg overflow-hidden border border-white/20">
            <button
              type="button"
              onClick={() => setToolMode('select')}
              className={`p-2 ${toolMode === 'select' ? 'bg-cyan-500/30 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'} transition-colors`}
              title="Select / drag nodes"
            >
              <MousePointer2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setToolMode('connect');
                setConnectSourceNodeId(null);
              }}
              className={`p-2 ${toolMode === 'connect' ? 'bg-cyan-500/30 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'} transition-colors`}
              title="Connect: click node A, then node B"
            >
              <Link2 className="w-4 h-4" />
            </button>
          </div>
          {connectSourceNodeId && (
            <span className="text-xs text-emerald-400 animate-pulse">
              Click target node
            </span>
          )}
        </div>
      )}

      {nodes.length > 0 ? (
        <ReactFlow
          nodes={enhancedNodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onEdgeClick={onEdgeClick}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          connectionLineComponent={FloatingEdge}
          fitView
          attributionPosition="bottom-right"
          style={{
            background: theme.background,
          }}
          className={toolMode === 'connect' ? 'cursor-crosshair' : ''}
        >
          <Background
            color={theme.backgroundPattern || theme.background}
            gap={20}
            size={1}
          />
          <Controls
            className="!bg-white/10 !border-white/20 !rounded-lg"
            showInteractive={false}
          />
          <MiniMap
            nodeStrokeColor={(n) => n.style?.borderColor || n.style?.border || '#06b6d4'}
            nodeColor={(n) => n.style?.background || 'rgba(15,23,42,0.9)'}
            nodeBorderRadius={8}
            className="!bg-white/10 !border-white/20"
          />
          <EdgeLabelRenderer>
            {edges.map((edge) => {
              const sourceNode = nodes.find((n) => n.id === edge.source);
              const targetNode = nodes.find((n) => n.id === edge.target);
              if (!sourceNode || !targetNode) return null;

              const sx = sourceNode.position.x + (sourceNode.style?.width || 240) / 2;
              const sy = sourceNode.position.y + (sourceNode.style?.height || 60) / 2;
              const tx = targetNode.position.x + (targetNode.style?.width || 240) / 2;
              const ty = targetNode.position.y + (targetNode.style?.height || 60) / 2;
              const mx = (sx + tx) / 2;
              const my = (sy + ty) / 2;

              return (
                <div
                  key={edge.id}
                  className="edge-label nodrag"
                  style={{
                    position: 'absolute',
                    transform: `translate(-50%, -50%) translate(${mx}px,${my}px)`,
                    pointerEvents: 'all',
                    zIndex: 1000,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingEdgeLabel(edge.id);
                  }}
                >
                  {editingEdgeLabel === edge.id ? (
                    <input
                      ref={(el) => {
                        edgeLabelInputRef.current = el;
                        if (el) el.focus();
                      }}
                      type="text"
                      defaultValue={edge.label || ''}
                      onBlur={(e) => handleEdgeLabelChange(edge.id, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.target.blur();
                        } else if (e.key === 'Escape') {
                          setEditingEdgeLabel(null);
                        }
                      }}
                      className="px-2 py-1 text-xs rounded border-2 border-cyan-400 bg-white/90 text-gray-800 focus:outline-none focus:ring-2 focus:ring-cyan-400 nodrag"
                      style={{
                        minWidth: '60px',
                        fontSize: '11px',
                      }}
                    />
                  ) : (
                    <div
                      className="px-2 py-1 rounded cursor-pointer transition-all hover:bg-white/20"
                      style={{
                        background: edge.label
                          ? 'rgba(255,255,255,0.9)'
                          : 'rgba(255,255,255,0.1)',
                        color: edge.label ? theme.node.textColor : 'rgba(255,255,255,0.5)',
                        fontSize: '11px',
                        minWidth: '20px',
                        textAlign: 'center',
                        border: edge.label ? 'none' : '1px dashed rgba(255,255,255,0.3)',
                      }}
                    >
                      {edge.label || '+'}
                    </div>
                  )}
                </div>
              );
            })}
          </EdgeLabelRenderer>
          {nodes.length > 0 && (
            <>
              <AddNodeButton theme={theme} onNodeLabelChange={onNodeLabelChange} setNodes={setNodes} />
              {onAddImage && (
                <Panel position="bottom-right" className="mb-16">
                  <button
                    type="button"
                    onClick={onAddImage}
                    className="w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-white transition-transform hover:scale-105"
                    style={{
                      background: theme.edge?.stroke || '#06b6d4',
                      boxShadow: `0 4px 14px ${theme.edge?.stroke || '#06b6d4'}66`,
                    }}
                    title="Thêm ảnh"
                  >
                    <ImagePlus className="w-5 h-5" />
                  </button>
                </Panel>
              )}
            </>
          )}
        </ReactFlow>
      ) : null}

      {selectedEdge && (
        <EdgeSettingsPanel
          edge={selectedEdge}
          onClose={() => setSelectedEdge(null)}
          onUpdate={handleEdgeUpdate}
        />
      )}

      {nodes.length === 0 && (
        <div
          className="flex flex-col items-center justify-center h-full text-slate-400 space-y-4"
          style={{ background: theme.background }}
        >
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center animate-pulse opacity-50"
            style={{ background: theme.backgroundPattern }}
          >
            <span className="text-4xl">✨</span>
          </div>
          <p className="font-medium">Chưa có dữ liệu. Hãy tải ảnh vở ghi lên để bắt đầu!</p>
        </div>
      )}

    </div>
  );
}
