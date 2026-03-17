import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { applyEdgeChanges, applyNodeChanges } from 'reactflow';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
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
  uploadImage,
} from '../api/axiosClient';
import AIAssistantSidebar from '../components/AIAssistantSidebar';
import DiagramSidebar from '../components/DiagramSidebar';
import MindMapViewer from '../components/MindMapViewer';
import UploadPanel from '../components/UploadPanel';
import {
  applyThemeToDiagram,
  autoLayoutDiagram,
  normalizeSavedDiagram,
  processMindMapData,
} from '../utils/graphUtils';
import { DEFAULT_THEME_ID } from '../utils/themeConfig';

const INITIAL_ASSISTANT_MESSAGE = {
  id: 'assistant-welcome',
  role: 'assistant',
  content: 'Ask me to generate a new mind map or restructure the current one. I will return diagram data that updates the React Flow canvas directly.',
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

export default function MindMapEditor() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();

  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [themeId, setThemeId] = useState(DEFAULT_THEME_ID);
  const [diagramTitle, setDiagramTitle] = useState('Untitled diagram');
  const [currentDiagramId, setCurrentDiagramId] = useState(null);
  const [diagrams, setDiagrams] = useState([]);
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(location.pathname === '/diagrams');
  const [assistantOpen, setAssistantOpen] = useState(true);
  const [showUploadPanel, setShowUploadPanel] = useState(false);
  const [listState, setListState] = useState({ loading: true, error: '' });
  const [saveState, setSaveState] = useState({ status: 'idle', message: '' });
  const [uploading, setUploading] = useState(false);
  const [assistantState, setAssistantState] = useState({ loading: false, error: '' });
  const [chatMessages, setChatMessages] = useState([INITIAL_ASSISTANT_MESSAGE]);
  const [isDirty, setIsDirty] = useState(false);
  const [historyState, setHistoryState] = useState({ canUndo: false, canRedo: false });

  const historyRef = useRef([]);
  const futureRef = useRef([]);
  const lastHistorySerializedRef = useRef('');
  const savedSnapshotRef = useRef(serializeSnapshot(createBlankSnapshot(DEFAULT_THEME_ID)));
  const savedTitleRef = useRef('Untitled diagram');
  const isRestoringRef = useRef(false);
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  const themeRef = useRef(themeId);

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

  const updateHistoryState = useCallback(() => {
    setHistoryState({
      canUndo: historyRef.current.length > 1,
      canRedo: futureRef.current.length > 0,
    });
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
        title = 'Untitled diagram',
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
      setSaveState({ status: markAsSaved ? 'saved' : 'idle', message: markAsSaved ? 'Diagram loaded.' : '' });

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
      }
    },
    [resetHistory]
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
        error: getApiErrorMessage(error, 'Unable to load saved diagrams.'),
      });
    }
  }, []);

  useEffect(() => {
    refreshMindMaps();
  }, [refreshMindMaps]);

  const loadDiagram = useCallback(
    async (diagramId, options = {}) => {
      const { shouldNavigate = true } = options;

      setSaveState({ status: 'loading', message: 'Loading diagram...' });

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
          createMessage('assistant', `Loaded "${diagram.title}". You can now ask me to expand or reorganize it.`),
        ]);

        if (shouldNavigate) {
          navigate(`/editor/${diagramId}`);
        }
      } catch (error) {
        setSaveState({
          status: 'error',
          message: getApiErrorMessage(error, 'Unable to load the selected diagram.'),
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
    const layouted = autoLayoutDiagram(nodesRef.current, edgesRef.current, { direction: 'LR' }, themeRef.current);
    setNodes(layouted.nodes);
    setEdges(layouted.edges);
    setSaveState({ status: 'idle', message: 'Auto-layout applied.' });
  }, []);

  const handleCreateNew = useCallback(() => {
    const blank = createBlankSnapshot(DEFAULT_THEME_ID);
    applySnapshot(blank, {
      title: 'Untitled diagram',
      diagramId: null,
      reset: true,
      markAsSaved: false,
    });
    savedSnapshotRef.current = serializeSnapshot(blank);
    savedTitleRef.current = 'Untitled diagram';
    setChatMessages([INITIAL_ASSISTANT_MESSAGE]);
    navigate('/workspace');
  }, [applySnapshot, navigate]);

  const handleSaveDiagram = useCallback(async () => {
    const payload = {
      title: diagramTitle.trim() || 'Untitled diagram',
      data: {
        nodes: nodesRef.current,
        edges: edgesRef.current,
        themeId: themeRef.current,
      },
    };

    setSaveState({ status: 'saving', message: 'Saving diagram...' });

    try {
      const response = currentDiagramId
        ? await updateMindMap(currentDiagramId, payload)
        : await createMindMap(payload);

      setCurrentDiagramId(response.id);
      setDiagramTitle(response.title);
      savedSnapshotRef.current = serializeSnapshot({
        nodes: nodesRef.current,
        edges: edgesRef.current,
        themeId: themeRef.current,
      });
      savedTitleRef.current = response.title;
      setSaveState({ status: 'saved', message: 'Diagram saved successfully.' });
      await refreshMindMaps();
      navigate(`/editor/${response.id}`);
    } catch (error) {
      setSaveState({
        status: 'error',
        message: getApiErrorMessage(error, 'Saving failed. Please try again.'),
      });
    }
  }, [currentDiagramId, diagramTitle, navigate, refreshMindMaps]);

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
          error: getApiErrorMessage(error, 'Unable to rename the selected diagram.'),
        }));
      }
    },
    [currentDiagramId]
  );

  const handleDeleteDiagram = useCallback(
    async (diagramId) => {
      const shouldDelete = window.confirm('Delete this diagram permanently?');

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
          error: getApiErrorMessage(error, 'Unable to delete the selected diagram.'),
        }));
      }
    },
    [currentDiagramId, handleCreateNew]
  );

  const handleUpload = useCallback(async (file) => {
    setUploading(true);
    setSaveState({ status: 'loading', message: 'Analyzing note image...' });

    try {
      const response = await uploadImage(file);
      const root = response.root || response;
      const generated = processMindMapData(root, themeRef.current);

      applySnapshot(
        {
          nodes: generated.nodes,
          edges: generated.edges,
          themeId: themeRef.current,
        },
        {
          title: response.title || root.label || 'Uploaded mind map',
          diagramId: currentDiagramId,
          reset: true,
          markAsSaved: false,
        }
      );
      setDiagramTitle(response.title || root.label || 'Uploaded mind map');
      setChatMessages((currentMessages) => [
        ...currentMessages,
        createMessage('assistant', 'I analyzed your note image and rebuilt the canvas as a structured mind map.'),
      ]);
      setSaveState({ status: 'idle', message: 'Canvas updated from note scan.' });
    } catch (error) {
      setSaveState({
        status: 'error',
        message: getApiErrorMessage(error, 'Image analysis failed. Please try another image.'),
      });
    } finally {
      setUploading(false);
    }
  }, [applySnapshot, currentDiagramId]);

  const handleAssistantPrompt = useCallback(async (prompt) => {
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

      const nextDiagram = normalizeSavedDiagram(response.diagram || response.root || response, themeRef.current);
      applySnapshot(nextDiagram, {
        title: response.title || response.diagram?.title || diagramTitle,
        diagramId: currentDiagramId,
        reset: true,
        markAsSaved: false,
      });

      if (response.title) {
        setDiagramTitle(response.title);
      }

      setChatMessages((currentMessages) => [
        ...currentMessages,
        createMessage(
          'assistant',
          response.message || 'I generated a new mind map and applied it to the canvas.'
        ),
      ]);
      setSaveState({ status: 'idle', message: 'AI update applied to the canvas.' });
    } catch (error) {
      const message = getApiErrorMessage(error, 'AI assistant failed to generate a diagram.');
      setAssistantState({ loading: false, error: message });
      setChatMessages((currentMessages) => [
        ...currentMessages,
        createMessage('assistant', `I could not update the canvas: ${message}`),
      ]);
      return;
    }

    setAssistantState({ loading: false, error: '' });
  }, [applySnapshot, currentDiagramId, diagramTitle]);

  const statusTone = useMemo(() => {
    if (saveState.status === 'error') {
      return 'border-rose-500/20 bg-rose-500/10 text-rose-100';
    }

    if (saveState.status === 'saved') {
      return 'border-emerald-500/20 bg-emerald-500/10 text-emerald-100';
    }

    if (saveState.status === 'saving' || saveState.status === 'loading') {
      return 'border-cyan-500/20 bg-cyan-500/10 text-cyan-100';
    }

    return 'border-white/10 bg-white/5 text-slate-200';
  }, [saveState.status]);

  return (
    <div className="flex h-full overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.14),_transparent_38%),linear-gradient(180deg,_#020617,_#0f172a_48%,_#020617)]">
      <DiagramSidebar
        isOpen={leftSidebarOpen}
        diagrams={diagrams}
        activeDiagramId={currentDiagramId}
        loading={listState.loading}
        error={listState.error}
        onToggle={() => setLeftSidebarOpen((current) => !current)}
        onCreateNew={handleCreateNew}
        onOpenDiagram={(diagramId) => loadDiagram(diagramId)}
        onRenameDiagram={handleRenameDiagram}
        onDeleteDiagram={handleDeleteDiagram}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="border-b border-white/10 bg-slate-950/60 px-5 py-4 backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-xs uppercase tracking-[0.24em] text-cyan-300/80">Editor session</p>
              <input
                value={diagramTitle}
                onChange={(event) => setDiagramTitle(event.target.value)}
                placeholder="Diagram title"
                className="mt-2 w-full max-w-2xl bg-transparent text-2xl font-semibold tracking-tight text-white outline-none placeholder:text-slate-500"
              />
              <p className="mt-2 text-sm text-slate-400">
                {currentDiagramId ? `Editing diagram #${currentDiagramId}` : 'Unsaved draft'}
                {isDirty ? ' · unsaved changes' : ' · all changes reflected in local state'}
              </p>
            </div>

            <div className={`rounded-2xl border px-4 py-3 text-sm ${statusTone}`}>
              <div className="flex items-center gap-2">
                {saveState.status === 'error' ? (
                  <AlertCircle className="h-4 w-4" />
                ) : saveState.status === 'saved' ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : saveState.status === 'saving' || saveState.status === 'loading' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                <span>{saveState.message || 'Workspace ready.'}</span>
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
          />
        </div>
      </div>

      <AIAssistantSidebar
        isOpen={assistantOpen}
        messages={chatMessages}
        loading={assistantState.loading}
        error={assistantState.error}
        onToggle={() => setAssistantOpen((current) => !current)}
        onSendPrompt={handleAssistantPrompt}
      />
    </div>
  );
}


