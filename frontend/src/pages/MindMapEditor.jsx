import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { applyEdgeChanges, applyNodeChanges } from 'reactflow';
import {
  AlertCircle,
  Bot,
  CheckCircle2,
  Download,
  Image as ImageIcon,
  Loader2,
  PanelLeftOpen,
  Printer,
} from 'lucide-react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import {
  createMindMap,
  deleteMindMap,
  generateAssistantMindMap,
  getApiErrorMessage,
  getMindMap,
  getMindMaps,
  renameMindMap,
  updateMindMap,
  uploadImages,
} from '../api/axiosClient';
import AIAssistantSidebar from '../components/AIAssistantSidebar';
import DiagramSidebar from '../components/DiagramSidebar';
import MindMapViewer from '../components/MindMapViewer';
import UploadPanel from '../components/UploadPanel';
import {
  exportDiagramPng,
  exportDiagramPdf,
} from '../utils/exportUtils';
import {
  applyThemeToDiagram,
  autoLayoutDiagram,
  buildDiagramThumbnail,
  mergeAssistantDiagram,
  normalizeSavedDiagram,
  processMindMapData,
} from '../utils/graphUtils';
import { DEFAULT_THEME_ID, getTheme } from '../utils/themeConfig';

const DEFAULT_DIAGRAM_TITLE = 'Sơ đồ chưa đặt tên';

const INITIAL_ASSISTANT_MESSAGE = {
  id: 'assistant-welcome',
  role: 'assistant',
  content:
    'Mình có thể đọc sơ đồ hiện tại, thêm nhánh mới, xóa nút hoặc nhánh theo yêu cầu, tinh gọn bố cục hoặc dựng lại mindmap từ prompt của bạn. Mọi cập nhật sẽ được áp dụng trực tiếp lên canvas.',
};

function createBlankSnapshot(themeId = DEFAULT_THEME_ID) {
  return { nodes: [], edges: [], themeId };
}

function cloneSnapshot(snapshot) {
  return JSON.parse(JSON.stringify(snapshot));
}

function serializeSnapshot(snapshot) {
  return JSON.stringify(snapshot);
}

function createMessage(role, content) {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    role,
    content,
  };
}

function hasPersistableContent(snapshot, title = '') {
  void title;
  return snapshot.nodes.length > 0 || snapshot.edges.length > 0;
}

function resolveAssistantSnapshot(response, currentNodes, currentEdges, fallbackThemeId) {
  const diagramPayload = response?.diagram || response?.root || response;
  const resolvedThemeId = diagramPayload?.themeId || response?.themeId || fallbackThemeId;
  const nextSnapshot = mergeAssistantDiagram(currentNodes, currentEdges, diagramPayload, resolvedThemeId);

  return {
    nodes: nextSnapshot.nodes,
    edges: nextSnapshot.edges,
    themeId: resolvedThemeId,
    mode: diagramPayload?.mode || (diagramPayload?.root || diagramPayload?.children ? 'replace' : 'merge'),
  };
}

function getInitialAssistantOpen() {
  return false;
}

export default function MindMapEditor() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();

  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [themeId, setThemeId] = useState(DEFAULT_THEME_ID);
  const [diagramTitle, setDiagramTitle] = useState(DEFAULT_DIAGRAM_TITLE);
  const [currentDiagramId, setCurrentDiagramId] = useState(null);
  const [diagrams, setDiagrams] = useState([]);
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(location.pathname === '/diagrams');
  const [assistantOpen, setAssistantOpen] = useState(getInitialAssistantOpen);
  const [showUploadPanel, setShowUploadPanel] = useState(false);
  const [listState, setListState] = useState({ loading: true, error: '' });
  const [saveState, setSaveState] = useState({ status: 'idle', message: '' });
  const [uploading, setUploading] = useState(false);
  const [assistantState, setAssistantState] = useState({ loading: false, error: '' });
  const [chatMessages, setChatMessages] = useState([INITIAL_ASSISTANT_MESSAGE]);
  const [isDirty, setIsDirty] = useState(false);
  const [historyState, setHistoryState] = useState({ canUndo: false, canRedo: false });
  const [fitViewNonce, setFitViewNonce] = useState(0);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  const historyRef = useRef([]);
  const futureRef = useRef([]);
  const lastHistorySerializedRef = useRef('');
  const savedSnapshotRef = useRef(serializeSnapshot(createBlankSnapshot(DEFAULT_THEME_ID)));
  const savedTitleRef = useRef(DEFAULT_DIAGRAM_TITLE);
  const isRestoringRef = useRef(false);
  const saveInFlightRef = useRef(false);
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  const themeRef = useRef(themeId);
  const exportMenuRef = useRef(null);
  const canvasContainerRef = useRef(null);
  const activeTheme = useMemo(() => getTheme(themeId), [themeId]);
  const shellTheme = activeTheme.shell || {};

  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  useEffect(() => {
    edgesRef.current = edges;
  }, [edges]);

  useEffect(() => {
    themeRef.current = themeId;
  }, [themeId]);

  useEffect(() => {
    if (location.pathname === '/diagrams') {
      setLeftSidebarOpen(true);
    }
  }, [location.pathname]);

  useEffect(() => {
    if (!exportMenuOpen) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
        setExportMenuOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setExportMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [exportMenuOpen]);

  const updateHistoryState = useCallback(() => {
    setHistoryState({
      canUndo: historyRef.current.length > 1,
      canRedo: futureRef.current.length > 0,
    });
  }, []);

  const requestViewportFit = useCallback(() => {
    setFitViewNonce((current) => current + 1);
  }, []);

  const resetHistory = useCallback(
    (snapshot) => {
      const nextSnapshot = cloneSnapshot(snapshot);
      historyRef.current = [nextSnapshot];
      futureRef.current = [];
      lastHistorySerializedRef.current = serializeSnapshot(nextSnapshot);
      updateHistoryState();
    },
    [updateHistoryState]
  );

  const applySnapshot = useCallback(
    (snapshot, options = {}) => {
      const {
        title = DEFAULT_DIAGRAM_TITLE,
        diagramId = null,
        reset = true,
        markAsSaved = false,
      } = options;
      const normalized = normalizeSavedDiagram(snapshot, snapshot.themeId || DEFAULT_THEME_ID);

      isRestoringRef.current = true;
      setNodes(normalized.nodes);
      setEdges(normalized.edges);
      setThemeId(normalized.themeId || DEFAULT_THEME_ID);
      setDiagramTitle(title);
      setCurrentDiagramId(diagramId);
      setShowUploadPanel(false);
      setAssistantState({ loading: false, error: '' });
      setSaveState({
        status: markAsSaved ? 'saved' : 'idle',
        message: markAsSaved ? 'Đã tải sơ đồ thành công.' : '',
      });

      if (markAsSaved) {
        savedSnapshotRef.current = serializeSnapshot({
          nodes: normalized.nodes,
          edges: normalized.edges,
          themeId: normalized.themeId || DEFAULT_THEME_ID,
        });
        savedTitleRef.current = title;
      }

      if (reset) {
        resetHistory({
          nodes: normalized.nodes,
          edges: normalized.edges,
          themeId: normalized.themeId || DEFAULT_THEME_ID,
        });
        requestViewportFit();
      }
    },
    [requestViewportFit, resetHistory]
  );

  const refreshMindMaps = useCallback(async () => {
    setListState({ loading: true, error: '' });

    try {
      const data = await getMindMaps();
      setDiagrams(data);
      setListState({ loading: false, error: '' });
    } catch (error) {
      setListState({
        loading: false,
        error: getApiErrorMessage(error, 'Không thể tải danh sách sơ đồ đã lưu.'),
      });
    }
  }, []);

  useEffect(() => {
    refreshMindMaps();
  }, [refreshMindMaps]);

  const loadDiagram = useCallback(
    async (diagramId, options = {}) => {
      const { shouldNavigate = true } = options;

      setSaveState({ status: 'loading', message: 'Đang tải sơ đồ...' });

      try {
        const diagram = await getMindMap(diagramId);
        applySnapshot(diagram.data, {
          title: diagram.title,
          diagramId: diagram.id,
          reset: true,
          markAsSaved: true,
        });
        setChatMessages([
          INITIAL_ASSISTANT_MESSAGE,
          createMessage('assistant', `Mình đã mở sơ đồ "${diagram.title}". Bạn có thể yêu cầu mình mở rộng hoặc sắp xếp lại sơ đồ này.`),
        ]);

        if (shouldNavigate) {
          navigate(`/editor/${diagramId}`);
        }
      } catch (error) {
        setSaveState({
          status: 'error',
          message: getApiErrorMessage(error, 'Không thể mở sơ đồ đã chọn.'),
        });
      }
    },
    [applySnapshot, navigate]
  );

  useEffect(() => {
    if (id && String(id) !== String(currentDiagramId)) {
      loadDiagram(id, { shouldNavigate: false });
    }
  }, [currentDiagramId, id, loadDiagram]);

  useEffect(() => {
    const snapshot = { nodes, edges, themeId };
    const serialized = serializeSnapshot(snapshot);

    setIsDirty(serialized !== savedSnapshotRef.current || diagramTitle !== savedTitleRef.current);

    if (isRestoringRef.current) {
      isRestoringRef.current = false;
      lastHistorySerializedRef.current = serialized;
      return;
    }

    const timer = window.setTimeout(() => {
      if (lastHistorySerializedRef.current === serialized) {
        return;
      }

      historyRef.current = [...historyRef.current, cloneSnapshot(snapshot)].slice(-60);
      futureRef.current = [];
      lastHistorySerializedRef.current = serialized;
      updateHistoryState();
    }, 220);

    return () => window.clearTimeout(timer);
  }, [diagramTitle, edges, nodes, themeId, updateHistoryState]);

  const handleUndo = useCallback(() => {
    if (historyRef.current.length <= 1) {
      return;
    }

    const current = historyRef.current.pop();
    futureRef.current = [cloneSnapshot(current), ...futureRef.current];
    const previous = historyRef.current[historyRef.current.length - 1];

    isRestoringRef.current = true;
    setNodes(previous.nodes);
    setEdges(previous.edges);
    setThemeId(previous.themeId);
    lastHistorySerializedRef.current = serializeSnapshot(previous);
    updateHistoryState();
  }, [updateHistoryState]);

  const handleRedo = useCallback(() => {
    if (!futureRef.current.length) {
      return;
    }

    const next = futureRef.current.shift();
    historyRef.current = [...historyRef.current, cloneSnapshot(next)];

    isRestoringRef.current = true;
    setNodes(next.nodes);
    setEdges(next.edges);
    setThemeId(next.themeId);
    lastHistorySerializedRef.current = serializeSnapshot(next);
    updateHistoryState();
  }, [updateHistoryState]);

  const handleNodesChange = useCallback((changes) => {
    setNodes((currentNodes) => applyNodeChanges(changes, currentNodes));
  }, []);

  const handleEdgesChange = useCallback((changes) => {
    setEdges((currentEdges) => applyEdgeChanges(changes, currentEdges));
  }, []);

  const handleNodesDelete = useCallback((deletedNodes) => {
    const deletedIds = new Set(deletedNodes.map((node) => node.id));
    setEdges((currentEdges) =>
      currentEdges.filter((edge) => !deletedIds.has(edge.source) && !deletedIds.has(edge.target))
    );
  }, []);

  const handleNodeDataChange = useCallback((nodeId, updates) => {
    const nextNodes = nodesRef.current.map((node) =>
      node.id === nodeId
        ? {
            ...node,
            data: {
              ...node.data,
              ...updates,
            },
          }
        : node
    );
    const themed = applyThemeToDiagram(nextNodes, edgesRef.current, themeRef.current);

    setNodes(themed.nodes);
    setEdges(themed.edges);
  }, []);

  const handleEdgeUpdate = useCallback((updatedEdge) => {
    setEdges((currentEdges) =>
      currentEdges.map((edge) => (edge.id === updatedEdge.id ? updatedEdge : edge))
    );
  }, []);

  const handleThemeChange = useCallback((nextThemeId) => {
    const themed = applyThemeToDiagram(nodesRef.current, edgesRef.current, nextThemeId);
    setNodes(themed.nodes);
    setEdges(themed.edges);
    setThemeId(nextThemeId);
  }, []);

  const handleAutoLayout = useCallback(() => {
    const layouted = autoLayoutDiagram(nodesRef.current, edgesRef.current, {}, themeRef.current);
    setNodes(layouted.nodes);
    setEdges(layouted.edges);
    setSaveState({ status: 'idle', message: 'Đã áp dụng bố cục mindmap dạng tia.' });
    requestViewportFit();
  }, [requestViewportFit]);

  const handleCreateNew = useCallback(() => {
    const blank = createBlankSnapshot(DEFAULT_THEME_ID);
    applySnapshot(blank, {
      title: DEFAULT_DIAGRAM_TITLE,
      diagramId: null,
      reset: true,
      markAsSaved: false,
    });
    savedSnapshotRef.current = serializeSnapshot(blank);
    savedTitleRef.current = DEFAULT_DIAGRAM_TITLE;
    setChatMessages([INITIAL_ASSISTANT_MESSAGE]);
    navigate('/workspace');
  }, [applySnapshot, navigate]);

  const persistDiagram = useCallback(
    async ({ mode = 'manual' } = {}) => {
      if (saveInFlightRef.current) {
        return null;
      }

      const baseSnapshot = {
        nodes: nodesRef.current,
        edges: edgesRef.current,
        themeId: themeRef.current,
      };
      const snapshot = {
        ...baseSnapshot,
        thumbnail: buildDiagramThumbnail({
          nodes: nodesRef.current,
          edges: edgesRef.current,
        }),
      };
      const resolvedTitle = diagramTitle.trim() || DEFAULT_DIAGRAM_TITLE;

      if (!hasPersistableContent(baseSnapshot, resolvedTitle)) {
        if (mode === 'manual') {
          setSaveState({ status: 'idle', message: 'Sơ đồ đang trống, chưa có gì để lưu.' });
        }
        return null;
      }

      const payload = {
        title: resolvedTitle,
        data: snapshot,
      };

      saveInFlightRef.current = true;
      setSaveState({
        status: 'saving',
        message: mode === 'autosave' ? 'Đang tự lưu vào cơ sở dữ liệu...' : 'Đang lưu sơ đồ...',
      });

      try {
        const response = currentDiagramId
          ? await updateMindMap(currentDiagramId, payload)
          : await createMindMap(payload);

        setCurrentDiagramId(response.id);
        setDiagramTitle(response.title);
        savedSnapshotRef.current = serializeSnapshot(baseSnapshot);
        savedTitleRef.current = response.title;
        setSaveState({
          status: 'saved',
          message:
            mode === 'autosave'
              ? 'Đã tự lưu sơ đồ vào cơ sở dữ liệu.'
              : 'Đã lưu sơ đồ thành công.',
        });
        await refreshMindMaps();

        if (mode === 'manual' || !currentDiagramId) {
          navigate(`/editor/${response.id}`);
        }

        return response;
      } catch (error) {
        setSaveState({
          status: 'error',
          message: getApiErrorMessage(error, 'Lưu sơ đồ thất bại. Vui lòng thử lại.'),
        });
        return null;
      } finally {
        saveInFlightRef.current = false;
      }
    },
    [currentDiagramId, diagramTitle, navigate, refreshMindMaps]
  );

  const handleSaveDiagram = useCallback(async () => {
    await persistDiagram({ mode: 'manual' });
  }, [persistDiagram]);

  useEffect(() => {
    if (
      !isDirty ||
      isRestoringRef.current ||
      assistantState.loading ||
      uploading ||
      saveInFlightRef.current
    ) {
      return undefined;
    }

    const snapshot = {
      nodes,
      edges,
      themeId,
    };

    if (!hasPersistableContent(snapshot, diagramTitle)) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      persistDiagram({ mode: 'autosave' });
    }, 1400);

    return () => window.clearTimeout(timer);
  }, [assistantState.loading, diagramTitle, edges, isDirty, nodes, persistDiagram, themeId, uploading]);

  const handleRenameDiagram = useCallback(
    async (diagramId, title) => {
      try {
        const updated = await renameMindMap(diagramId, title);
        setDiagrams((currentDiagrams) =>
          currentDiagrams.map((diagram) =>
            diagram.id === diagramId ? { ...diagram, title: updated.title } : diagram
          )
        );

        if (String(diagramId) === String(currentDiagramId)) {
          setDiagramTitle(updated.title);
          savedTitleRef.current = updated.title;
        }
      } catch (error) {
        setListState((current) => ({
          ...current,
          error: getApiErrorMessage(error, 'Không thể đổi tên sơ đồ đã chọn.'),
        }));
      }
    },
    [currentDiagramId]
  );

  const handleDeleteDiagram = useCallback(
    async (diagramId) => {
      const shouldDelete = window.confirm('Bạn có chắc muốn xóa vĩnh viễn sơ đồ này không?');

      if (!shouldDelete) {
        return;
      }

      try {
        await deleteMindMap(diagramId);
        setDiagrams((currentDiagrams) =>
          currentDiagrams.filter((diagram) => diagram.id !== diagramId)
        );

        if (String(diagramId) === String(currentDiagramId)) {
          handleCreateNew();
        }
      } catch (error) {
        setListState((current) => ({
          ...current,
          error: getApiErrorMessage(error, 'Không thể xóa sơ đồ đã chọn.'),
        }));
      }
    },
    [currentDiagramId, handleCreateNew]
  );

  const handleUpload = useCallback(
    async (files) => {
      setUploading(true);
      setSaveState({ status: 'loading', message: 'Đang phân tích ảnh ghi chú...' });

      try {
        const response = await uploadImages(files);
        const root = response.root || response;
        const generated = processMindMapData(root, themeRef.current);
        const nextTitle = response.title || root.label || 'Mindmap từ ghi chú';

        applySnapshot(
          {
            nodes: generated.nodes,
            edges: generated.edges,
            themeId: themeRef.current,
          },
          {
            title: nextTitle,
            diagramId: currentDiagramId,
            reset: true,
            markAsSaved: false,
          }
        );
        setDiagramTitle(nextTitle);
        setChatMessages((currentMessages) => [
          ...currentMessages,
          createMessage('assistant', 'Mình đã đọc toàn bộ chồng ảnh ghi chú và dựng lại canvas thành một mindmap có cấu trúc rõ ràng.'),
        ]);
        setSaveState({ status: 'idle', message: 'Canvas đã được cập nhật từ tập ảnh ghi chú.' });
      } catch (error) {
        setSaveState({
          status: 'error',
          message: getApiErrorMessage(error, 'Phân tích ảnh thất bại. Vui lòng thử lại với ảnh khác.'),
        });
      } finally {
        setUploading(false);
      }
    },
    [applySnapshot, currentDiagramId]
  );

  const handleAssistantPrompt = useCallback(
    async (prompt) => {
      setAssistantState({ loading: true, error: '' });
      setChatMessages((currentMessages) => [...currentMessages, createMessage('user', prompt)]);

      try {
        const response = await generateAssistantMindMap({
          prompt,
          current_diagram: {
            title: diagramTitle,
            nodes: nodesRef.current,
            edges: edgesRef.current,
            themeId: themeRef.current,
          },
        });

        const resolved = resolveAssistantSnapshot(
          response,
          nodesRef.current,
          edgesRef.current,
          themeRef.current
        );
        const nextTitle = response.title || response.diagram?.title || diagramTitle;

        applySnapshot(
          {
            nodes: resolved.nodes,
            edges: resolved.edges,
            themeId: resolved.themeId,
          },
          {
            title: nextTitle,
            diagramId: currentDiagramId,
            reset: true,
            markAsSaved: false,
          }
        );

        if (response.title) {
          setDiagramTitle(response.title);
        }

        setChatMessages((currentMessages) => [
          ...currentMessages,
          createMessage(
            'assistant',
            response.message || 'Mình đã áp dụng cập nhật AI trực tiếp lên sơ đồ hiện tại.'
          ),
        ]);
        setSaveState({
          status: 'idle',
          message:
            resolved.mode === 'replace'
              ? 'AI đã dựng lại toàn bộ sơ đồ trên canvas.'
              : 'AI đã cập nhật sơ đồ hiện tại theo ngữ cảnh canvas.',
        });
      } catch (error) {
        const message = getApiErrorMessage(error, 'Trợ lý AI chưa thể cập nhật sơ đồ lúc này.');
        setAssistantState({ loading: false, error: message });
        setChatMessages((currentMessages) => [
          ...currentMessages,
          createMessage('assistant', `Mình chưa thể cập nhật canvas: ${message}`),
        ]);
        return;
      }

      setAssistantState({ loading: false, error: '' });
    },
    [applySnapshot, currentDiagramId, diagramTitle]
  );

  const diagramMetrics = useMemo(
    () => ({
      nodes: nodes.length,
      edges: edges.length,
    }),
    [edges.length, nodes.length]
  );

  const compactSaveMessage = useMemo(() => {
    if (saveState.status === 'error') {
      return 'Có lỗi';
    }

    if (saveState.status === 'saved') {
      return 'Đã lưu';
    }

    if (saveState.status === 'saving' || saveState.status === 'loading') {
      return 'Đang xử lý';
    }

    return isDirty ? 'Chưa lưu' : 'Sẵn sàng';
  }, [isDirty, saveState.status]);

  const handleExport = useCallback(
    async (format) => {
      const snapshot = {
        nodes: nodesRef.current,
        edges: edgesRef.current,
        themeId: themeRef.current,
      };
      const resolvedTitle = diagramTitle.trim() || DEFAULT_DIAGRAM_TITLE;

      if (!hasPersistableContent(snapshot, resolvedTitle)) {
        setSaveState({
          status: 'error',
          message: 'Sơ đồ đang trống, chưa có dữ liệu để xuất.',
        });
        setExportMenuOpen(false);
        return;
      }

      try {
        if (format === 'png') {
          await exportDiagramPng({
            title: resolvedTitle,
            snapshot,
            container: canvasContainerRef.current,
          });
        } else {
          await exportDiagramPdf({
            title: resolvedTitle,
            snapshot,
            container: canvasContainerRef.current,
          });
        }

        setSaveState({
          status: 'saved',
          message:
            format === 'png'
              ? 'Đã tải xuống ảnh PNG của sơ đồ hiện tại.'
              : format === 'pdf'
              ? 'Đã tải xuống file PDF của sơ đồ hiện tại.'
              : `Đã xuất sơ đồ dạng ${format.toUpperCase()}.`,
        });
      } catch (error) {
        setSaveState({
          status: 'error',
          message:
            error instanceof Error
              ? error.message
              : 'Không thể xuất sơ đồ lúc này.',
        });
      } finally {
        setExportMenuOpen(false);
      }
    },
    [currentDiagramId, diagramTitle]
  );

  const statusTone = useMemo(() => {
    const isLightTheme = themeId === DEFAULT_THEME_ID;

    if (saveState.status === 'error') {
      return isLightTheme
        ? 'border-rose-400/30 bg-rose-100/80 text-rose-700'
        : 'border-rose-500/20 bg-rose-500/10 text-rose-100';
    }

    if (saveState.status === 'saved') {
      return isLightTheme
        ? 'border-emerald-400/30 bg-emerald-100/80 text-emerald-700'
        : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-100';
    }

    if (saveState.status === 'saving' || saveState.status === 'loading') {
      return isLightTheme
        ? 'border-sky-400/30 bg-sky-100/80 text-sky-700'
        : 'border-cyan-500/20 bg-cyan-500/10 text-cyan-100';
    }

    return 'border-white/10 bg-white/5 text-slate-200';
  }, [saveState.status, themeId]);

  return (
    <div
      className="workspace-shell relative flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
      style={{
        background: shellTheme.workspaceBg,
      }}
    >
      <div
        className="relative z-40 overflow-visible border-b px-4 py-2.5 backdrop-blur-xl"
        style={{
          borderColor: shellTheme.panelBorder,
          background: shellTheme.panelStrongBg,
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setLeftSidebarOpen((current) => !current)}
              className="inline-flex h-10 items-center gap-2 rounded-2xl border px-3 text-sm font-medium transition-colors hover:brightness-105"
              style={{
                borderColor: shellTheme.panelBorder,
                background: leftSidebarOpen ? shellTheme.accentSoft : shellTheme.panelBg,
                color: shellTheme.panelText,
              }}
            >
              <PanelLeftOpen className="h-4 w-4" style={{ color: shellTheme.accent }} />
              <span className="hidden sm:inline">{leftSidebarOpen ? 'Ẩn thư viện' : 'Thư viện'}</span>
            </button>

            <div className="min-w-0 flex-1">
              <input
                value={diagramTitle}
                onChange={(event) => setDiagramTitle(event.target.value)}
                placeholder="Tên sơ đồ"
                className="w-full bg-transparent text-lg font-semibold tracking-tight outline-none sm:text-xl"
                style={{
                  color: shellTheme.panelText,
                }}
              />

              <div
                className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] uppercase tracking-[0.2em]"
                style={{ color: shellTheme.panelMuted }}
              >
                <span
                  className="rounded-full border px-2 py-1"
                  style={{
                    borderColor: shellTheme.panelBorder,
                    background: shellTheme.accentSoft,
                  }}
                >
                  {diagramMetrics.nodes} node
                </span>
                <span
                  className="rounded-full border px-2 py-1"
                  style={{
                    borderColor: shellTheme.panelBorder,
                    background: shellTheme.accentSoft,
                  }}
                >
                  {diagramMetrics.edges} edge
                </span>
                <span
                  className="rounded-full border px-2 py-1"
                  style={{
                    borderColor: shellTheme.panelBorder,
                    background: shellTheme.accentSoft,
                  }}
                >
                  {activeTheme.name}
                </span>
                <span>{currentDiagramId ? `#${currentDiagramId}` : 'Bản nháp'}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setAssistantOpen((current) => !current)}
              className="inline-flex h-10 items-center gap-2 rounded-2xl border px-3 text-sm font-medium transition-colors hover:brightness-105"
              style={{
                borderColor: shellTheme.panelBorder,
                background: assistantOpen ? shellTheme.accentSoft : shellTheme.panelBg,
                color: shellTheme.panelText,
              }}
            >
              <Bot className="h-4 w-4" style={{ color: shellTheme.accent }} />
              <span className="hidden sm:inline">{assistantOpen ? 'Ẩn AI' : 'AI'}</span>
            </button>

            <div ref={exportMenuRef} className="relative z-50">
              <button
                type="button"
                onClick={() => setExportMenuOpen((current) => !current)}
                className="inline-flex h-10 items-center gap-2 rounded-2xl bg-cyan-400 px-3.5 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-400/20 transition-transform hover:scale-[1.01]"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Xuất</span>
              </button>

              {exportMenuOpen && (
                <div
                  className="absolute right-0 top-[calc(100%+0.7rem)] z-[120] w-72 rounded-[1.6rem] border p-3 shadow-2xl backdrop-blur-2xl"
                  style={{
                    borderColor: shellTheme.panelBorder,
                    background: shellTheme.panelStrongBg,
                  }}
                >
                  <div className="mb-2 px-1">
                    <p className="text-[11px] uppercase tracking-[0.24em]" style={{ color: shellTheme.accent }}>
                      Export
                    </p>
                    <p className="mt-1 text-xs leading-5" style={{ color: shellTheme.panelMuted }}>
                      PNG chụp đúng canvas hiện tại, PDF là ảnh canvas trong tài liệu.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => handleExport('png')}
                      className="flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left text-sm font-medium transition-colors hover:brightness-105"
                      style={{
                        borderColor: shellTheme.panelBorder,
                        background: shellTheme.panelBg,
                        color: shellTheme.panelText,
                      }}
                    >
                      <ImageIcon className="h-4 w-4" style={{ color: shellTheme.accent }} />
                      PNG
                    </button>
                    <button
                      type="button"
                      onClick={() => handleExport('pdf')}
                      className="flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left text-sm font-medium transition-colors hover:brightness-105"
                      style={{
                        borderColor: shellTheme.panelBorder,
                        background: shellTheme.panelBg,
                        color: shellTheme.panelText,
                      }}
                    >
                      <Printer className="h-4 w-4" style={{ color: shellTheme.accent }} />
                      PDF
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div
              className={`rounded-2xl border px-3 py-2 text-xs ${statusTone}`}
              style={{
                borderColor:
                  saveState.status === 'error'
                    ? undefined
                    : saveState.status === 'saved'
                      ? undefined
                      : saveState.status === 'saving' || saveState.status === 'loading'
                        ? undefined
                        : shellTheme.panelBorder,
                background: saveState.status === 'idle' ? shellTheme.panelBg : undefined,
                color: saveState.status === 'idle' ? shellTheme.panelText : undefined,
              }}
            >
              <div className="flex items-center gap-2">
                {saveState.status === 'error' ? (
                  <AlertCircle className="h-3.5 w-3.5" />
                ) : saveState.status === 'saved' ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : saveState.status === 'saving' || saveState.status === 'loading' ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : null}
                <span>{compactSaveMessage}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative min-h-0 flex-1">
        {showUploadPanel && (
          <UploadPanel
            onUpload={handleUpload}
            loading={uploading}
            onClose={() => setShowUploadPanel(false)}
          />
        )}

        <MindMapViewer
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
          onNodesDelete={handleNodesDelete}
          setNodes={setNodes}
          setEdges={setEdges}
          themeId={themeId}
          onThemeChange={handleThemeChange}
          onNodeDataChange={handleNodeDataChange}
          onEdgeUpdate={handleEdgeUpdate}
          onAutoLayout={handleAutoLayout}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={historyState.canUndo}
          canRedo={historyState.canRedo}
          onOpenUploadPanel={() => setShowUploadPanel(true)}
          onSave={handleSaveDiagram}
          saveState={saveState.status}
          fitViewNonce={fitViewNonce}
          onCanvasMount={(node) => {
            canvasContainerRef.current = node;
          }}
        />
      </div>

      <DiagramSidebar
        isOpen={leftSidebarOpen}
        diagrams={diagrams}
        activeDiagramId={currentDiagramId}
        loading={listState.loading}
        error={listState.error}
        themeId={themeId}
        onToggle={() => setLeftSidebarOpen((current) => !current)}
        onCreateNew={handleCreateNew}
        onOpenDiagram={(diagramId) => loadDiagram(diagramId)}
        onRenameDiagram={handleRenameDiagram}
        onDeleteDiagram={handleDeleteDiagram}
      />

      <AIAssistantSidebar
        isOpen={assistantOpen}
        messages={chatMessages}
        loading={assistantState.loading}
        error={assistantState.error}
        themeId={themeId}
        onToggle={() => setAssistantOpen((current) => !current)}
        onSendPrompt={handleAssistantPrompt}
      />
    </div>
  );
}
