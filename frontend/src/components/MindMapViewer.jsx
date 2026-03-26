import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactFlow, { Background, MiniMap, Panel, useReactFlow } from 'reactflow';
import 'reactflow/dist/style.css';
import {
  Check,
  ChevronDown,
  Diamond,
  ImagePlus,
  LayoutGrid,
  Link2,
  Loader2,
  Maximize2,
  Palette,
  PenSquare,
  Redo2,
  RotateCcw,
  Save,
  Square,
  Trash2,
  Type,
  Undo2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import EditableNode from './EditableNode';
import EdgeSettingsPanel from './EdgeSettingsPanel';
import FloatingEdge from './FloatingEdge';
import {
  collectSubtreeNodeIds,
  createDiagramEdge,
  createDiagramNode,
  createNodeId,
  NODE_COLOR_SWATCHES,
  NODE_TYPES,
  stripHtml,
} from '../utils/graphUtils';
import { getTheme, THEME_IDS, themes } from '../utils/themeConfig';

const edgeTypes = { floating: FloatingEdge };
const nodeTypes = { editable: EditableNode };

function extractColorToken(value, fallback) {
  if (typeof value !== 'string') {
    return fallback;
  }

  const match = value.match(/(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\))/);
  return match?.[1] || fallback;
}

function ToolbarButton({
  icon,
  label,
  active = false,
  disabled = false,
  compact = false,
  showLabel = true,
  spinning = false,
  onClick,
  buttonStyle,
  activeStyle,
  onMouseEnter,
  onMouseLeave,
}) {
  const IconComponent = icon;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={[
        'inline-flex items-center gap-2 border text-sm font-medium transition-all',
        compact ? 'h-10 w-10 justify-center rounded-2xl px-0 py-0' : 'w-full justify-start rounded-2xl px-3 py-2.5',
        disabled ? 'cursor-not-allowed opacity-40' : 'hover:brightness-110',
      ].join(' ')}
      style={active ? { ...buttonStyle, ...activeStyle } : buttonStyle}
      aria-label={label}
    >
      <IconComponent className={['h-4 w-4', spinning ? 'animate-spin' : ''].join(' ')} />
      {showLabel && <span>{label}</span>}
    </button>
  );
}

function ThemePreviewCanvas({ theme, compact = false }) {
  const shellTheme = theme.shell || {};
  const edgeColor = theme.edge?.stroke || shellTheme.accent;

  if (compact) {
    return (
      <div
        className="h-full w-full overflow-hidden rounded-[0.8rem] border p-1"
        style={{
          borderColor: shellTheme.panelBorder,
          background: theme.background,
        }}
      >
        <div className="flex h-full flex-col gap-1">
          <div
            className="h-2 rounded-full border"
            style={{
              borderColor: shellTheme.panelBorder,
              background: shellTheme.accentSoft,
            }}
          />

          <div className="grid min-h-0 flex-1 grid-cols-[1.3fr_0.9fr] gap-1">
            <div
              className="rounded-[0.55rem]"
              style={{
                background: theme.node.rootBg,
                border: theme.node.rootBorder,
                boxShadow: theme.node.boxShadow,
              }}
            />

            <div
              className="rounded-[0.55rem] border"
              style={{
                background: theme.node.childBg,
                borderColor: edgeColor,
              }}
            />
          </div>

          <div
            className="h-1 rounded-full opacity-80"
            style={{ background: edgeColor }}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-[1rem] border p-2"
      style={{
        borderColor: shellTheme.panelBorder,
        background: theme.background,
      }}
    >
      <div
        className="mb-2 rounded-[0.8rem] px-2 py-1.5"
        style={{
          background: theme.node.rootBg,
          border: theme.node.rootBorder,
        }}
      >
        <div
          className="h-1.5 w-8 rounded-full opacity-80"
          style={{ background: theme.node.rootTextColor }}
        />
      </div>

      <div className="flex items-center gap-1.5">
        <div
          className="h-3 w-3 rounded-full border"
          style={{
            background: theme.node.childBg,
            borderColor: edgeColor,
          }}
        />
        <div className="h-[2px] flex-1 rounded-full" style={{ background: edgeColor }} />
        <div className="h-2.5 w-2.5 rounded-full" style={{ background: shellTheme.accent }} />
      </div>
    </div>
  );
}

function ThemeSwatch({ themeKey, active, onClick, detailed = false, onMouseEnter, onMouseLeave }) {
  const theme = themes[themeKey];
  const shellTheme = theme.shell || {};

  return (
    <button
      type="button"
      onClick={() => onClick(themeKey)}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      aria-label={theme.name}
      className={[
        detailed
          ? 'w-full rounded-[1.1rem] border p-2 text-left transition-all hover:translate-y-[-1px]'
          : 'group relative flex h-7 w-7 items-center justify-center rounded-full border shadow-sm transition-transform hover:scale-110',
        active && !detailed ? 'shadow-[0_0_0_2px_rgba(255,255,255,0.7)]' : (!detailed ? 'hover:shadow-[0_0_0_1px_rgba(255,255,255,0.3)]' : ''),
        active && detailed ? 'shadow-[0_0_0_1px_rgba(255,255,255,0.16)]' : '',
      ].join(' ')}
      style={detailed ? {
        borderColor: active ? shellTheme.accent : shellTheme.panelBorder,
        background: shellTheme.panelBg,
      } : {
        borderColor: shellTheme.panelBorder,
        background: theme.node?.rootBg || theme.background,
        ...(active ? { outline: `2px solid ${shellTheme.accent}`, outlineOffset: '2px' } : {})
      }}
    >
      {detailed && (
        <div>
          <ThemePreviewCanvas theme={theme} />
          <div className="mt-2">
            <p className="text-sm font-semibold" style={{ color: shellTheme.panelText }}>
              {theme.name}
            </p>
            <p className="mt-1 text-[11px] leading-4" style={{ color: shellTheme.panelMuted }}>
              {theme.description}
            </p>
          </div>
        </div>
      )}
    </button>
  );
}

function DesktopToolRail({
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
  const [activeTooltip, setActiveTooltip] = useState(null);
  const { fitView, screenToFlowPosition, zoomIn, zoomOut } = useReactFlow();
  const shellTheme = getTheme(themeId).shell || {};
  const buttonStyle = {
    borderColor: shellTheme.panelBorder,
    background: shellTheme.panelBg || 'rgba(255,255,255,0.06)',
    color: shellTheme.panelText || '#e2e8f0',
  };
  const activeStyle = {
    borderColor: shellTheme.accent || '#22d3ee',
    background: shellTheme.accentSoft || 'rgba(34,211,238,0.16)',
    color: shellTheme.panelText || '#e2e8f0',
    boxShadow: `0 14px 28px ${shellTheme.accentSoft || 'rgba(34,211,238,0.22)'}`,
  };

  const handleTooltipEnter = (event, text) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setActiveTooltip({ text, x: rect.right + 12, y: rect.top + rect.height / 2 });
  };

  const addNodeAtCenter = (nodeType) => {
    const bounds = containerRef.current?.getBoundingClientRect();
    const position = screenToFlowPosition({
      x: bounds ? bounds.left + bounds.width / 2 : window.innerWidth / 2,
      y: bounds ? bounds.top + bounds.height / 2 : window.innerHeight / 2,
    });

    onAddNode(nodeType, position);
  };

  return (
    <Panel
      position="top-left"
      className="pointer-events-none ml-3 mt-3 hidden lg:block"
      style={{ height: 'calc(100% - 1.5rem)', zIndex: 100 }}
    >
      <div className="workspace-tool-rail-scroll pointer-events-auto">
        <div className="workspace-tool-rail">
        <div className="workspace-tool-group pointer-events-auto" style={{ borderColor: shellTheme.panelBorder, background: shellTheme.panelStrongBg }}>
          <div className="mb-2 px-1 text-center">
            <div className="flex items-center justify-center">
              <LayoutGrid className="h-4 w-4" style={{ color: shellTheme.accent }} />
            </div>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.22em]" style={{ color: shellTheme.panelMuted }}>
              Thêm
            </p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <ToolbarButton compact showLabel={false} icon={Square} label="Nút chuẩn" onClick={() => addNodeAtCenter(NODE_TYPES.STANDARD)} buttonStyle={buttonStyle} activeStyle={activeStyle} onMouseEnter={(e) => handleTooltipEnter(e, 'Nút chuẩn')} onMouseLeave={() => setActiveTooltip(null)} />
            <ToolbarButton compact showLabel={false} icon={Type} label="Văn bản" onClick={() => addNodeAtCenter(NODE_TYPES.TEXT)} buttonStyle={buttonStyle} activeStyle={activeStyle} onMouseEnter={(e) => handleTooltipEnter(e, 'Văn bản')} onMouseLeave={() => setActiveTooltip(null)} />
            <ToolbarButton compact showLabel={false} icon={ImagePlus} label="Hình ảnh" onClick={() => addNodeAtCenter(NODE_TYPES.IMAGE)} buttonStyle={buttonStyle} activeStyle={activeStyle} onMouseEnter={(e) => handleTooltipEnter(e, 'Hình ảnh')} onMouseLeave={() => setActiveTooltip(null)} />
            <ToolbarButton compact showLabel={false} icon={Diamond} label="Quyết định" onClick={() => addNodeAtCenter(NODE_TYPES.DECISION)} buttonStyle={buttonStyle} activeStyle={activeStyle} onMouseEnter={(e) => handleTooltipEnter(e, 'Nút quyết định')} onMouseLeave={() => setActiveTooltip(null)} />
            <ToolbarButton compact showLabel={false} icon={Link2} label="Nối cạnh" active={toolMode === 'connect'} onClick={() => setToolMode((current) => (current === 'connect' ? 'select' : 'connect'))} buttonStyle={buttonStyle} activeStyle={activeStyle} onMouseEnter={(e) => handleTooltipEnter(e, 'Chế độ nối cạnh')} onMouseLeave={() => setActiveTooltip(null)} />
            <ToolbarButton compact showLabel={false} icon={LayoutGrid} label="Bố cục tia" onClick={() => { onAutoLayout(); requestAnimationFrame(() => fitView({ padding: 0.2, duration: 350 })); }} buttonStyle={buttonStyle} activeStyle={activeStyle} onMouseEnter={(e) => handleTooltipEnter(e, 'Sắp xếp tự động')} onMouseLeave={() => setActiveTooltip(null)} />
          </div>
        </div>
        <div className="workspace-tool-group pointer-events-auto" style={{ borderColor: shellTheme.panelBorder, background: shellTheme.panelStrongBg }}>
          <div className="mb-2 px-1 text-center">
            <div className="flex items-center justify-center">
              <Maximize2 className="h-4 w-4" style={{ color: shellTheme.accent }} />
            </div>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.22em]" style={{ color: shellTheme.panelMuted }}>
              Công cụ
            </p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <ToolbarButton compact showLabel={false} icon={Undo2} label="Hoàn tác" onClick={onUndo} disabled={!canUndo} buttonStyle={buttonStyle} activeStyle={activeStyle} onMouseEnter={(e) => handleTooltipEnter(e, 'Hoàn tác (Undo)')} onMouseLeave={() => setActiveTooltip(null)} />
            <ToolbarButton compact showLabel={false} icon={Redo2} label="Làm lại" onClick={onRedo} disabled={!canRedo} buttonStyle={buttonStyle} activeStyle={activeStyle} onMouseEnter={(e) => handleTooltipEnter(e, 'Làm lại (Redo)')} onMouseLeave={() => setActiveTooltip(null)} />
            <ToolbarButton compact showLabel={false} icon={Maximize2} label="Vừa khung" onClick={() => fitView({ padding: 0.2, duration: 350 })} buttonStyle={buttonStyle} activeStyle={activeStyle} onMouseEnter={(e) => handleTooltipEnter(e, 'Vừa khung hình')} onMouseLeave={() => setActiveTooltip(null)} />
            <ToolbarButton compact showLabel={false} icon={ZoomOut} label="Thu nhỏ" onClick={() => zoomOut({ duration: 250 })} buttonStyle={buttonStyle} activeStyle={activeStyle} onMouseEnter={(e) => handleTooltipEnter(e, 'Thu nhỏ')} onMouseLeave={() => setActiveTooltip(null)} />
            <ToolbarButton compact showLabel={false} icon={ZoomIn} label="Phóng to" onClick={() => zoomIn({ duration: 250 })} buttonStyle={buttonStyle} activeStyle={activeStyle} onMouseEnter={(e) => handleTooltipEnter(e, 'Phóng to')} onMouseLeave={() => setActiveTooltip(null)} />
            <ToolbarButton compact showLabel={false} icon={ImagePlus} label="Quét ghi chú" onClick={onOpenUploadPanel} buttonStyle={buttonStyle} activeStyle={activeStyle} onMouseEnter={(e) => handleTooltipEnter(e, 'AI: Quét từ ảnh')} onMouseLeave={() => setActiveTooltip(null)} />
          </div>
        </div>
        <div className="workspace-tool-group pointer-events-auto" style={{ borderColor: shellTheme.panelBorder, background: shellTheme.panelStrongBg }}>
          <div className="mb-2 px-1 text-center">
            <div className="flex items-center justify-center">
              <Palette className="h-4 w-4" style={{ color: shellTheme.accent }} />
            </div>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.22em]" style={{ color: shellTheme.panelMuted }}>
              Chủ đề
            </p>
            <p className="mt-1 text-[11px] font-medium" style={{ color: shellTheme.panelText }}>
              {getTheme(themeId).name}
            </p>
          </div>
          <div className="flex flex-col items-center gap-2">
            {Object.values(THEME_IDS).map((id) => (
              <ThemeSwatch key={id} themeKey={id} active={themeId === id} onClick={onThemeChange} onMouseEnter={(e) => handleTooltipEnter(e, getTheme(id).name)} onMouseLeave={() => setActiveTooltip(null)} />
            ))}
          </div>
          <div className="mt-3 flex justify-center">
            <ToolbarButton
              compact
              showLabel={false}
              spinning={saveState === 'saving'}
              icon={saveState === 'saving' ? Loader2 : Save}
              label={saveState === 'saving' ? 'Đang lưu' : 'Lưu'}
              onClick={onSave}
              buttonStyle={{ borderColor: shellTheme.accent, background: shellTheme.accentSoft, color: shellTheme.panelText }}
              activeStyle={activeStyle}
              onMouseEnter={(e) => handleTooltipEnter(e, saveState === 'saving' ? 'Đang lưu...' : 'Lưu thay đổi')}
              onMouseLeave={() => setActiveTooltip(null)}
            />
          </div>
        </div>
        </div>
      </div>
      
      {activeTooltip && (
        <div
          className="pointer-events-none fixed z-[999999] -translate-y-1/2 rounded-lg border px-2.5 py-1.5 shadow-2xl backdrop-blur-xl animate-in fade-in duration-100"
          style={{
            left: activeTooltip.x,
            top: activeTooltip.y,
            borderColor: shellTheme.panelBorder,
            background: shellTheme.panelStrongBg,
          }}
        >
          <span className="whitespace-nowrap text-xs font-semibold" style={{ color: shellTheme.panelText }}>
            {activeTooltip.text}
          </span>
        </div>
      )}
    </Panel>
  );
}

function MobileToolDrawer({
  containerRef,
  toolMode,
  setToolMode,
  isOpen,
  onToggle,
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
  const shellTheme = getTheme(themeId).shell || {};
  const sharedButtonStyle = { borderColor: shellTheme.panelBorder, background: shellTheme.panelBg, color: shellTheme.panelText };
  const sharedActiveStyle = { borderColor: shellTheme.accent, background: shellTheme.accentSoft, color: shellTheme.panelText };

  const addNodeAtCenter = (nodeType) => {
    const bounds = containerRef.current?.getBoundingClientRect();
    const position = screenToFlowPosition({
      x: bounds ? bounds.left + bounds.width / 2 : window.innerWidth / 2,
      y: bounds ? bounds.top + bounds.height / 2 : window.innerHeight / 2,
    });

    onAddNode(nodeType, position);
    onToggle(false);
  };

  if (!isOpen) {
    return (
      <div className="pointer-events-none absolute left-3 top-3 z-20 lg:hidden">
        <button
          type="button"
          onClick={() => onToggle(true)}
          className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/85 px-4 py-2.5 text-sm font-semibold text-white shadow-2xl backdrop-blur-xl"
        >
          <LayoutGrid className="h-4 w-4 text-cyan-300" />
          Công cụ
        </button>
      </div>
    );
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-20 lg:hidden">
      <button
        type="button"
        onClick={() => onToggle(false)}
        className="pointer-events-auto absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
        aria-label="Đóng công cụ canvas"
      />
      <div
        className="pointer-events-auto absolute inset-y-3 left-3 flex w-[min(18rem,calc(100%-1.5rem))] flex-col rounded-[1.75rem] border p-4 shadow-2xl backdrop-blur-2xl"
        style={{ borderColor: shellTheme.panelBorder, background: shellTheme.panelStrongBg }}
      >
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold" style={{ color: shellTheme.panelText }}>
            Công cụ canvas
          </p>
          <button
            type="button"
            onClick={() => onToggle(false)}
            className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium"
            style={{ background: shellTheme.accentSoft, color: shellTheme.panelText }}
          >
            Đóng
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <ToolbarButton icon={Square} label="Nút" onClick={() => addNodeAtCenter(NODE_TYPES.STANDARD)} buttonStyle={sharedButtonStyle} activeStyle={sharedActiveStyle} />
          <ToolbarButton icon={Type} label="Văn bản" onClick={() => addNodeAtCenter(NODE_TYPES.TEXT)} buttonStyle={sharedButtonStyle} activeStyle={sharedActiveStyle} />
          <ToolbarButton icon={ImagePlus} label="Ảnh" onClick={() => addNodeAtCenter(NODE_TYPES.IMAGE)} buttonStyle={sharedButtonStyle} activeStyle={sharedActiveStyle} />
          <ToolbarButton icon={Diamond} label="Quyết định" onClick={() => addNodeAtCenter(NODE_TYPES.DECISION)} buttonStyle={sharedButtonStyle} activeStyle={sharedActiveStyle} />
          <ToolbarButton
            icon={Link2}
            label="Nối cạnh"
            active={toolMode === 'connect'}
            onClick={() => {
              setToolMode((current) => (current === 'connect' ? 'select' : 'connect'));
              onToggle(false);
            }}
            buttonStyle={sharedButtonStyle}
            activeStyle={sharedActiveStyle}
          />
          <ToolbarButton
            icon={LayoutGrid}
            label="Bố cục"
            onClick={() => {
              onAutoLayout();
              fitView({ padding: 0.2, duration: 250 });
              onToggle(false);
            }}
            buttonStyle={sharedButtonStyle}
            activeStyle={sharedActiveStyle}
          />
          <ToolbarButton icon={ImagePlus} label="OCR" onClick={() => { onOpenUploadPanel(); onToggle(false); }} buttonStyle={sharedButtonStyle} activeStyle={sharedActiveStyle} />
          <ToolbarButton icon={Undo2} label="Hoàn tác" onClick={() => { onUndo(); onToggle(false); }} disabled={!canUndo} buttonStyle={sharedButtonStyle} activeStyle={sharedActiveStyle} />
          <ToolbarButton icon={Redo2} label="Làm lại" onClick={() => { onRedo(); onToggle(false); }} disabled={!canRedo} buttonStyle={sharedButtonStyle} activeStyle={sharedActiveStyle} />
          <ToolbarButton icon={Maximize2} label="Vừa khung" onClick={() => { fitView({ padding: 0.2, duration: 250 }); onToggle(false); }} buttonStyle={sharedButtonStyle} activeStyle={sharedActiveStyle} />
          <ToolbarButton icon={ZoomOut} label="Thu nhỏ" onClick={() => zoomOut({ duration: 200 })} buttonStyle={sharedButtonStyle} activeStyle={sharedActiveStyle} />
          <ToolbarButton icon={ZoomIn} label="Phóng to" onClick={() => zoomIn({ duration: 200 })} buttonStyle={sharedButtonStyle} activeStyle={sharedActiveStyle} />
        </div>

        <div className="mt-3 rounded-[1.35rem] border px-3 py-3" style={{ borderColor: shellTheme.panelBorder }}>
          <div className="mb-3 flex items-center gap-2 text-sm" style={{ color: shellTheme.panelText }}>
            <Palette className="h-4 w-4" style={{ color: shellTheme.accent }} />
            <span>Chủ đề canvas</span>
          </div>
          <div className="grid gap-2">
            {Object.values(THEME_IDS).map((id) => (
              <ThemeSwatch key={id} themeKey={id} active={themeId === id} onClick={onThemeChange} detailed />
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            onSave();
            onToggle(false);
          }}
          className="mt-3 inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 shadow-lg"
        >
          {saveState === 'saving' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saveState === 'saving' ? 'Lưu...' : 'Lưu'}
        </button>
      </div>
    </div>
  );
}

function AutoFitController({ fitViewNonce }) {
  const { fitView } = useReactFlow();

  useEffect(() => {
    if (!fitViewNonce) {
      return undefined;
    }

    const frame = window.requestAnimationFrame(() => {
      fitView({ padding: 0.2, duration: 350 });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [fitView, fitViewNonce]);

  return null;
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
  fitViewNonce,
  onCanvasMount,
}) {
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [toolMode, setToolMode] = useState('select');
  const [connectSourceNodeId, setConnectSourceNodeId] = useState(null);
  const [nodeMenu, setNodeMenu] = useState(null);
  const [editingNodeId, setEditingNodeId] = useState(null);
  const [mobileToolbarOpen, setMobileToolbarOpen] = useState(false);
  const containerRef = useRef(null);
  const theme = getTheme(themeId);
  const shellTheme = theme.shell || {};
  const closeNodeMenu = useCallback(() => setNodeMenu(null), []);

  useEffect(() => {
    onCanvasMount?.(containerRef.current);

    return () => {
      onCanvasMount?.(null);
    };
  }, [onCanvasMount]);

  const openNodeMenu = useCallback((event, node) => {
    const bounds = containerRef.current?.getBoundingClientRect();
    if (!bounds) {
      return;
    }

    const rawX = event.clientX - bounds.left;
    const rawY = event.clientY - bounds.top;
    const menuWidth = 280;
    const menuHeight = 320;

    setNodeMenu({
      nodeId: node.id,
      x: Math.min(Math.max(rawX, 12), Math.max(bounds.width - menuWidth - 12, 12)),
      y: Math.min(Math.max(rawY, 12), Math.max(bounds.height - menuHeight - 12, 12)),
    });
  }, []);

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
      closeNodeMenu();
    },
    [closeNodeMenu, setNodes, themeId]
  );

  const handleAddChild = useCallback(
    (nodeId) => {
      const parentNode = nodes.find((node) => node.id === nodeId);

      if (!parentNode) {
        return;
      }

      const branchColor =
        parentNode.data?.branchAccentColor || parentNode.data?.accentColor || theme.edge.stroke;
      const nextNode = createDiagramNode({
        id: createNodeId('child'),
        nodeType: NODE_TYPES.STANDARD,
        themeId,
        position: {
          x: parentNode.position.x + (Number(parentNode.style?.width) || 220) + 120,
          y: parentNode.position.y + 120,
        },
        accentColor: branchColor,
        branchAccentColor: branchColor,
      });
      const nextEdge = createDiagramEdge({
        source: parentNode.id,
        target: nextNode.id,
        themeId,
        accentColor: branchColor,
      });

      setNodes((currentNodes) => [...currentNodes, nextNode]);
      setEdges((currentEdges) => [...currentEdges, nextEdge]);
      closeNodeMenu();
    },
    [closeNodeMenu, nodes, setEdges, setNodes, theme.edge.stroke, themeId]
  );

  const handleDeleteNode = useCallback(
    (nodeId) => {
      const cascadeNodeIds = collectSubtreeNodeIds(nodes, edges, [nodeId]);

      setNodes((currentNodes) =>
        currentNodes.filter((node) => !cascadeNodeIds.has(String(node.id)))
      );
      setEdges((currentEdges) =>
        currentEdges.filter(
          (edge) =>
            !cascadeNodeIds.has(String(edge.source)) && !cascadeNodeIds.has(String(edge.target))
        )
      );
      setSelectedEdge((currentEdge) =>
        currentEdge &&
        (cascadeNodeIds.has(String(currentEdge.source)) ||
          cascadeNodeIds.has(String(currentEdge.target)))
          ? null
          : currentEdge
      );
      setConnectSourceNodeId((currentSource) =>
        currentSource && cascadeNodeIds.has(String(currentSource)) ? null : currentSource
      );
      setEditingNodeId((currentNodeId) =>
        currentNodeId && cascadeNodeIds.has(String(currentNodeId)) ? null : currentNodeId
      );
      setNodeMenu((currentMenu) =>
        currentMenu && cascadeNodeIds.has(String(currentMenu.nodeId)) ? null : currentMenu
      );
    },
    [edges, nodes, setEdges, setNodes]
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
      closeNodeMenu();
    },
    [closeNodeMenu, setEdges, themeId]
  );

  const handleToggleNodeEditing = useCallback((nodeId) => {
    setEditingNodeId((currentNodeId) => (currentNodeId === nodeId ? null : nodeId));
    closeNodeMenu();
  }, [closeNodeMenu]);

  const handleFinishEditing = useCallback((nodeId) => {
    setEditingNodeId((currentNodeId) => (currentNodeId === nodeId ? null : currentNodeId));
  }, []);

  const handleNodeColorChange = useCallback((nodeId, color) => {
    onNodeDataChange(nodeId, { colorOverride: color || '' });
    closeNodeMenu();
  }, [closeNodeMenu, onNodeDataChange]);

  const handleNodeClick = useCallback(
    (event, node) => {
      if (toolMode !== 'connect') {
        event.stopPropagation();
        setSelectedEdge(null);
        setMobileToolbarOpen(false);
        openNodeMenu(event, node);
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
    [connectSourceNodeId, openNodeMenu, setEdges, themeId, toolMode]
  );

  const handleNodeContextMenu = useCallback(
    (event, node) => {
      event.preventDefault();
      if (toolMode === 'connect') {
        return;
      }

      setSelectedEdge(null);
      setMobileToolbarOpen(false);
      openNodeMenu(event, node);
    },
    [openNodeMenu, toolMode]
  );

  const handlePaneClick = useCallback(() => {
    setSelectedEdge(null);
    setConnectSourceNodeId(null);
    closeNodeMenu();
    setMobileToolbarOpen(false);
  }, [closeNodeMenu]);

  const handleEdgeClick = useCallback((event, edge) => {
    event.stopPropagation();
    closeNodeMenu();
    setSelectedEdge(edge);
  }, [closeNodeMenu]);

  const enhancedNodes = useMemo(
    () =>
      nodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          style: node.style,
          disableEditing: toolMode === 'connect',
          isConnectSource: node.id === connectSourceNodeId,
          isEditingActive: editingNodeId === node.id,
          onDataChange: onNodeDataChange,
          onFinishEditing: handleFinishEditing,
          onAddChild: () => handleAddChild(node.id),
          onDelete: () => handleDeleteNode(node.id),
        },
        draggable: toolMode !== 'connect',
      })),
    [connectSourceNodeId, editingNodeId, handleAddChild, handleDeleteNode, handleFinishEditing, nodes, onNodeDataChange, toolMode]
  );

  return (
    <div
      ref={containerRef}
      className="workspace-canvas-shell h-full w-full"
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
        onNodeContextMenu={handleNodeContextMenu}
        onNodeDragStart={closeNodeMenu}
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
          className="workspace-minimap !border !backdrop-blur-xl"
          style={{
            borderColor: shellTheme.panelBorder,
            background: shellTheme.panelBg,
          }}
          nodeStrokeColor={(node) =>
            extractColorToken(
              node.style?.borderColor || node.style?.border,
              node.data?.accentColor || theme.edge.stroke
            )
          }
          nodeColor={(node) => {
            const background = node.style?.background;

            if (typeof background === 'string' && background.includes('gradient')) {
              return node.data?.accentColor || theme.edge.stroke;
            }

            return background || '#0f172a';
          }}
          nodeBorderRadius={18}
        />

        <DesktopToolRail
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

        <MobileToolDrawer
          containerRef={containerRef}
          toolMode={toolMode}
          setToolMode={setToolMode}
          isOpen={mobileToolbarOpen}
          onToggle={setMobileToolbarOpen}
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

        <AutoFitController fitViewNonce={fitViewNonce} />
      </ReactFlow>
      {nodeMenu && (
        <div
          className="workspace-node-menu absolute z-30 rounded-[1.75rem] border p-4 shadow-2xl backdrop-blur-2xl"
          style={{
            left: nodeMenu.x,
            top: nodeMenu.y,
            borderColor: shellTheme.panelBorder,
            background: shellTheme.panelStrongBg,
          }}
          onMouseDown={(event) => event.stopPropagation()}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="mb-3">
            <p className="text-[11px] uppercase tracking-[0.24em]" style={{ color: shellTheme.accent }}>
              Tùy chọn node
            </p>
            <h3 className="mt-1 text-base font-semibold" style={{ color: shellTheme.panelText }}>
              {stripHtml(nodes.find((node) => node.id === nodeMenu.nodeId)?.data?.label) || 'Node đang chọn'}
            </h3>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => handleDeleteNode(nodeMenu.nodeId)}
              className="flex w-full items-center gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-left text-sm font-medium text-rose-200 transition-colors hover:bg-rose-500/15"
            >
              <Trash2 className="h-4 w-4" />
              Xóa Node
            </button>

            <button
              type="button"
              onClick={() => handleToggleNodeEditing(nodeMenu.nodeId)}
              className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium transition-colors hover:brightness-105"
              style={{
                background: shellTheme.accentSoft,
                color: shellTheme.panelText,
              }}
            >
              <PenSquare className="h-4 w-4" />
              {editingNodeId === nodeMenu.nodeId ? 'Đang chỉnh sửa' : 'Chỉnh sửa nội dung'}
            </button>

            <button
              type="button"
              onClick={() => handleAddChild(nodeMenu.nodeId)}
              className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium transition-colors hover:brightness-105"
              style={{
                background: shellTheme.accentSoft,
                color: shellTheme.panelText,
              }}
            >
              <Link2 className="h-4 w-4" />
              Thêm nhánh con
            </button>
          </div>

          <div className="mt-4 rounded-2xl border p-3" style={{ borderColor: shellTheme.panelBorder }}>
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4" style={{ color: shellTheme.accent }} />
                <span className="text-sm font-semibold" style={{ color: shellTheme.panelText }}>
                  Đổi màu node
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleNodeColorChange(nodeMenu.nodeId, '')}
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors hover:brightness-105"
                style={{
                  background: shellTheme.accentSoft,
                  color: shellTheme.panelText,
                }}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Mặc định
              </button>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {NODE_COLOR_SWATCHES.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => handleNodeColorChange(nodeMenu.nodeId, color)}
                  className="flex h-11 w-full items-center justify-center rounded-2xl border transition-transform hover:scale-[1.03]"
                  style={{
                    background: color,
                    borderColor: 'rgba(255,255,255,0.35)',
                  }}
                  title={`Đổi sang màu ${color}`}
                >
                  {nodes.find((node) => node.id === nodeMenu.nodeId)?.data?.colorOverride === color && (
                    <Check className="h-4 w-4 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {selectedEdge && (
        <EdgeSettingsPanel
          key={selectedEdge.id}
          edge={selectedEdge}
          onClose={() => setSelectedEdge(null)}
          onUpdate={(updatedEdge) => {
            onEdgeUpdate(updatedEdge);
            setSelectedEdge(null);
          }}
          onDelete={(edgeId) => {
            setEdges((currentEdges) => currentEdges.filter((e) => e.id !== edgeId));
            setSelectedEdge(null);
          }}
        />
      )}

      {nodes.length === 0 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-6">
          <div
            className="workspace-empty-state rounded-[2rem] border px-8 py-8 text-center shadow-2xl backdrop-blur-xl"
            style={{
              borderColor: shellTheme.panelBorder,
              background: shellTheme.panelStrongBg,
            }}
          >
            <p className="text-xs uppercase tracking-[0.3em]" style={{ color: shellTheme.accent }}>
              Khung vẽ trống
            </p>
            <h2 className="mt-3 text-2xl font-semibold" style={{ color: shellTheme.panelText }}>
              Bắt đầu từ AI, ảnh ghi chú hoặc tự thêm nút
            </h2>
            <p className="mt-4 text-sm leading-7" style={{ color: shellTheme.panelMuted }}>
              Dùng rail công cụ bên trái để thêm nút chuẩn, văn bản, hình ảnh hoặc nút quyết định. Bạn cũng có thể quét ghi chú hoặc yêu cầu trợ lý AI mở rộng sơ đồ hiện tại ngay trên canvas.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
