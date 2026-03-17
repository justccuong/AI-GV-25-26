import React, { useCallback, useMemo, useRef, useState } from 'react';
import ReactFlow, { Background, EdgeLabelRenderer, MiniMap, Panel, useReactFlow } from 'reactflow';
import 'reactflow/dist/style.css';
import {
  Diamond,
  ImagePlus,
  LayoutGrid,
  Link2,
  Maximize2,
  Palette,
  Redo2,
  Save,
  Square,
  Type,
  Undo2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';

import EditableNode from './EditableNode';
import EdgeSettingsPanel from './EdgeSettingsPanel';
import FloatingEdge from './FloatingEdge';
import { createDiagramEdge, createDiagramNode, createNodeId, NODE_TYPES } from '../utils/graphUtils';
import { getTheme, THEME_IDS, themes } from '../utils/themeConfig';

const edgeTypes = { floating: FloatingEdge };
const nodeTypes = { editable: EditableNode };

function ToolbarButton({ icon: Icon, label, active = false, disabled = false, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        'inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-medium transition-all',
        active
          ? 'bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-400/25'
          : 'bg-white/5 text-slate-200 hover:bg-white/10',
        disabled ? 'cursor-not-allowed opacity-40' : '',
      ].join(' ')}
      title={label}
    >
      <Icon className="h-4 w-4" />
      <span className="hidden xl:inline">{label}</span>
    </button>
  );
}

function FlowToolbar({
  containerRef,
  toolMode,
  setToolMode,
  onAddNode,
  onAutoLayout,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onOpenUploadPanel,
  onSave,
  saveState,
  themeId,
  onThemeChange,
}) {
  const { fitView, screenToFlowPosition, zoomIn, zoomOut } = useReactFlow();

  const addNodeAtCenter = (nodeType) => {
    const bounds = containerRef.current?.getBoundingClientRect();
    const position = screenToFlowPosition({
      x: bounds ? bounds.left + bounds.width / 2 : window.innerWidth / 2,
      y: bounds ? bounds.top + bounds.height / 2 : window.innerHeight / 2,
    });

    onAddNode(nodeType, position);
  };

  return (
    <Panel position="top-center" className="pointer-events-none mt-4 w-[min(100%-2rem,1180px)]">
      <div className="pointer-events-auto rounded-[2rem] border border-white/10 bg-slate-950/75 px-3 py-3 shadow-2xl backdrop-blur-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <ToolbarButton icon={Square} label="Standard" onClick={() => addNodeAtCenter(NODE_TYPES.STANDARD)} />
            <ToolbarButton icon={Type} label="Text" onClick={() => addNodeAtCenter(NODE_TYPES.TEXT)} />
            <ToolbarButton icon={ImagePlus} label="Image" onClick={() => addNodeAtCenter(NODE_TYPES.IMAGE)} />
            <ToolbarButton icon={Diamond} label="Decision" onClick={() => addNodeAtCenter(NODE_TYPES.DECISION)} />
            <ToolbarButton
              icon={Link2}
              label="Add Edge"
              active={toolMode === 'connect'}
              onClick={() => setToolMode((current) => (current === 'connect' ? 'select' : 'connect'))}
            />
            <ToolbarButton
              icon={LayoutGrid}
              label="Auto layout"
              onClick={() => {
                onAutoLayout();
                requestAnimationFrame(() => fitView({ padding: 0.2, duration: 350 }));
              }}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <ToolbarButton icon={Undo2} label="Undo" onClick={onUndo} disabled={!canUndo} />
            <ToolbarButton icon={Redo2} label="Redo" onClick={onRedo} disabled={!canRedo} />
            <ToolbarButton icon={ZoomOut} label="Zoom out" onClick={() => zoomOut({ duration: 250 })} />
            <ToolbarButton icon={ZoomIn} label="Zoom in" onClick={() => zoomIn({ duration: 250 })} />
            <ToolbarButton icon={Maximize2} label="Fit view" onClick={() => fitView({ padding: 0.2, duration: 350 })} />
            <ToolbarButton icon={ImagePlus} label="Scan note" onClick={onOpenUploadPanel} />

            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200">
              <Palette className="h-4 w-4 text-cyan-300" />
              <select
                value={themeId}
                onChange={(event) => onThemeChange(event.target.value)}
                className="bg-transparent text-sm outline-none"
              >
                {Object.values(THEME_IDS).map((id) => (
                  <option key={id} value={id} className="bg-slate-900 text-white">
                    {themes[id].name}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={onSave}
              className="inline-flex items-center gap-2 rounded-2xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-400/25 transition-transform hover:scale-[1.01]"
            >
              <Save className="h-4 w-4" />
              {saveState === 'saving' ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </Panel>
  );
}

export default function MindMapViewer({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onNodesDelete,
  setNodes,
  setEdges,
  themeId,
  onThemeChange,
  onNodeDataChange,
  onEdgeUpdate,
  onAutoLayout,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onOpenUploadPanel,
  onSave,
  saveState,
}) {
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [toolMode, setToolMode] = useState('select');
  const [connectSourceNodeId, setConnectSourceNodeId] = useState(null);
  const [editingEdgeLabel, setEditingEdgeLabel] = useState(null);
  const containerRef = useRef(null);
  const theme = getTheme(themeId);

  const addNode = useCallback(
    (nodeType, position) => {
      const nextNode = createDiagramNode({
        id: createNodeId(nodeType),
        nodeType,
        themeId,
        position,
      });

      setNodes((currentNodes) => [...currentNodes, nextNode]);
      setToolMode('select');
    },
    [setNodes, themeId]
  );

  const handleAddChild = useCallback(
    (nodeId) => {
      const parentNode = nodes.find((node) => node.id === nodeId);

      if (!parentNode) {
        return;
      }

      const nextNode = createDiagramNode({
        id: createNodeId('child'),
        nodeType: NODE_TYPES.STANDARD,
        themeId,
        position: {
          x: parentNode.position.x + (Number(parentNode.style?.width) || 220) + 120,
          y: parentNode.position.y + 120,
        },
        accentColor: parentNode.data?.accentColor || theme.edge.stroke,
      });
      const nextEdge = createDiagramEdge({
        source: parentNode.id,
        target: nextNode.id,
        themeId,
        accentColor: parentNode.data?.accentColor || theme.edge.stroke,
      });

      setNodes((currentNodes) => [...currentNodes, nextNode]);
      setEdges((currentEdges) => [...currentEdges, nextEdge]);
    },
    [nodes, setEdges, setNodes, theme.edge.stroke, themeId]
  );

  const handleDeleteNode = useCallback(
    (nodeId) => {
      setNodes((currentNodes) => currentNodes.filter((node) => node.id !== nodeId));
      setEdges((currentEdges) =>
        currentEdges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId)
      );
      setSelectedEdge((currentEdge) =>
        currentEdge && (currentEdge.source === nodeId || currentEdge.target === nodeId)
          ? null
          : currentEdge
      );
      setConnectSourceNodeId((currentSource) => (currentSource === nodeId ? null : currentSource));
    },
    [setEdges, setNodes]
  );

  const handleConnect = useCallback(
    (params) => {
      if (!params.source || !params.target || params.source === params.target) {
        return;
      }

      setEdges((currentEdges) => [
        ...currentEdges,
        createDiagramEdge({
          source: params.source,
          target: params.target,
          themeId,
        }),
      ]);
      setConnectSourceNodeId(null);
    },
    [setEdges, themeId]
  );

  const handleNodeClick = useCallback(
    (event, node) => {
      if (toolMode !== 'connect') {
        return;
      }

      event.stopPropagation();

      if (!connectSourceNodeId) {
        setConnectSourceNodeId(node.id);
        return;
      }

      if (connectSourceNodeId === node.id) {
        setConnectSourceNodeId(null);
        return;
      }

      setEdges((currentEdges) => [
        ...currentEdges,
        createDiagramEdge({
          source: connectSourceNodeId,
          target: node.id,
          themeId,
        }),
      ]);
      setConnectSourceNodeId(null);
    },
    [connectSourceNodeId, setEdges, themeId, toolMode]
  );

  const handlePaneClick = useCallback(() => {
    setSelectedEdge(null);
    setEditingEdgeLabel(null);
    setConnectSourceNodeId(null);
  }, []);

  const handleEdgeClick = useCallback((event, edge) => {
    event.stopPropagation();
    setSelectedEdge(edge);
  }, []);

  const handleEdgeLabelChange = useCallback(
    (edgeId, newLabel) => {
      setEdges((currentEdges) =>
        currentEdges.map((edge) =>
          edge.id === edgeId
            ? {
                ...edge,
                label: newLabel,
              }
            : edge
        )
      );
      setEditingEdgeLabel(null);
    },
    [setEdges]
  );

  const enhancedNodes = useMemo(
    () =>
      nodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          style: node.style,
          disableEditing: toolMode === 'connect',
          isConnectSource: node.id === connectSourceNodeId,
          onDataChange: onNodeDataChange,
          onAddChild: () => handleAddChild(node.id),
          onDelete: () => handleDeleteNode(node.id),
        },
        draggable: toolMode !== 'connect',
      })),
    [connectSourceNodeId, handleAddChild, handleDeleteNode, nodes, onNodeDataChange, toolMode]
  );

  return (
    <div
      ref={containerRef}
      className="h-full w-full"
      style={{
        background: theme.background,
      }}
    >
      <ReactFlow
        nodes={enhancedNodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodesDelete={onNodesDelete}
        onConnect={handleConnect}
        onNodeClick={handleNodeClick}
        onEdgeClick={handleEdgeClick}
        onPaneClick={handlePaneClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={1.8}
        attributionPosition="bottom-left"
        className={toolMode === 'connect' ? 'cursor-crosshair' : ''}
        style={{ background: theme.background }}
        deleteKeyCode={['Delete', 'Backspace']}
      >
        <Background color={theme.backgroundPattern || '#1e293b'} gap={20} size={1.2} />
        <MiniMap
          pannable
          zoomable
          className="!border !border-white/10 !bg-slate-950/70 !backdrop-blur-xl"
          nodeStrokeColor={(node) => node.style?.borderColor || node.style?.border || '#22d3ee'}
          nodeColor={(node) => node.style?.background || '#0f172a'}
          nodeBorderRadius={18}
        />

        <FlowToolbar
          containerRef={containerRef}
          toolMode={toolMode}
          setToolMode={setToolMode}
          onAddNode={addNode}
          onAutoLayout={onAutoLayout}
          onUndo={onUndo}
          onRedo={onRedo}
          canUndo={canUndo}
          canRedo={canRedo}
          onOpenUploadPanel={onOpenUploadPanel}
          onSave={onSave}
          saveState={saveState}
          themeId={themeId}
          onThemeChange={onThemeChange}
        />

        <EdgeLabelRenderer>
          {edges.map((edge) => {
            const sourceNode = nodes.find((node) => node.id === edge.source);
            const targetNode = nodes.find((node) => node.id === edge.target);

            if (!sourceNode || !targetNode) {
              return null;
            }

            const sourceWidth = Number(sourceNode.style?.width) || 220;
            const sourceHeight = Number(sourceNode.style?.height) || 80;
            const targetWidth = Number(targetNode.style?.width) || 220;
            const targetHeight = Number(targetNode.style?.height) || 80;
            const midpointX = (sourceNode.position.x + sourceWidth / 2 + targetNode.position.x + targetWidth / 2) / 2;
            const midpointY = (sourceNode.position.y + sourceHeight / 2 + targetNode.position.y + targetHeight / 2) / 2;

            return (
              <div
                key={edge.id}
                className="nodrag"
                style={{
                  position: 'absolute',
                  transform: `translate(-50%, -50%) translate(${midpointX}px, ${midpointY}px)`,
                  pointerEvents: 'all',
                }}
              >
                {editingEdgeLabel === edge.id ? (
                  <input
                    type="text"
                    defaultValue={edge.label || ''}
                    onBlur={(event) => handleEdgeLabelChange(edge.id, event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.currentTarget.blur();
                      }

                      if (event.key === 'Escape') {
                        setEditingEdgeLabel(null);
                      }
                    }}
                    className="rounded-full border border-cyan-300/60 bg-white/95 px-3 py-1 text-xs text-slate-900 shadow-lg outline-none"
                    autoFocus
                  />
                ) : (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setEditingEdgeLabel(edge.id);
                    }}
                    className="rounded-full border border-white/10 bg-slate-950/80 px-3 py-1 text-xs text-slate-100 shadow-lg backdrop-blur-xl transition-colors hover:bg-slate-900"
                  >
                    {edge.label || 'Label'}
                  </button>
                )}
              </div>
            );
          })}
        </EdgeLabelRenderer>
      </ReactFlow>

      {selectedEdge && (
        <EdgeSettingsPanel
          edge={selectedEdge}
          onClose={() => setSelectedEdge(null)}
          onUpdate={(updatedEdge) => {
            onEdgeUpdate(updatedEdge);
            setSelectedEdge(null);
          }}
        />
      )}

      {nodes.length === 0 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-6">
          <div className="max-w-xl rounded-[2rem] border border-white/10 bg-slate-950/70 px-8 py-10 text-center shadow-2xl backdrop-blur-xl">
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/80">Blank canvas</p>
            <h2 className="mt-3 text-3xl font-semibold text-white">Start from AI, notes, or manual nodes</h2>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              Use the floating toolbar to add standard, text, image, and decision nodes. You can also open the note scanner or ask the AI assistant to generate a complete mind map for you.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
