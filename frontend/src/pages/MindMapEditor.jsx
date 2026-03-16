// src/pages/MindMapEditor.jsx
import React, { useState, useCallback } from 'react';
import { useNodesState, useEdgesState } from 'reactflow';
// Chú ý: Vì file này nằm trong thư mục 'pages', nên đường dẫn import phải lùi lại một bậc (../) nhé, Baka!
import { uploadImage } from '../api/axiosClient';
import { processMindMapData } from '../utils/graphUtils';
import { DEFAULT_THEME_ID } from '../utils/themeConfig';
import FloatingEdge from '../components/FloatingEdge';
import UploadPanel from '../components/UploadPanel';
import MindMapViewer from '../components/MindMapViewer';

export default function MindMapEditor() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(false);
  const [themeId, setThemeId] = useState(DEFAULT_THEME_ID);
  const [rawMindMapData, setRawMindMapData] = useState(null);
  const [showUploadPanel, setShowUploadPanel] = useState(true);

  const edgeTypes = {
    floating: FloatingEdge,
  };

  // Handle node label changes (optionally with { fontSize } for rich text)
  const handleNodeLabelChange = useCallback((nodeId, newLabel, options = {}) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, label: newLabel, ...options } }
          : node
      )
    );
  }, [setNodes]);

  // Handle edge updates
  const handleEdgeUpdate = useCallback((updatedEdge) => {
    setEdges((eds) =>
      eds.map((edge) => (edge.id === updatedEdge.id ? updatedEdge : edge))
    );
  }, [setEdges]);

  const applyLayout = useCallback((data, currentThemeId) => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = processMindMapData(data, currentThemeId);
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [setNodes, setEdges]);

  const handleUpload = async (file) => {
    setLoading(true);
    try {
      const response = await uploadImage(file);
      console.log("AI Response:", response.data);
      setRawMindMapData(response.data);
      setShowUploadPanel(false);
      applyLayout(response.data, themeId);
    } catch (error) {
      console.error("Lỗi:", error);
      alert("Có lỗi xảy ra khi phân tích ảnh. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  const handleThemeChange = useCallback((newThemeId) => {
    setThemeId(newThemeId);
    if (rawMindMapData) applyLayout(rawMindMapData, newThemeId);
  }, [rawMindMapData, applyLayout]);

  const handleAddImage = useCallback(() => {
    setShowUploadPanel(true);
  }, []);

  return (
    <div className="w-full h-full relative">
      {/* Upload Panel */}
      {(nodes.length === 0 || showUploadPanel) && (
        <UploadPanel 
          onUpload={handleUpload} 
          loading={loading} 
          onClose={nodes.length > 0 ? () => setShowUploadPanel(false) : undefined} 
        />
      )}

      {/* Sân chơi Mindmap của Hoàng tử đây */}
      <MindMapViewer
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        setNodes={setNodes}
        setEdges={setEdges}
        edgeTypes={edgeTypes}
        themeId={themeId}
        onThemeChange={handleThemeChange}
        onNodeLabelChange={handleNodeLabelChange}
        onEdgeUpdate={handleEdgeUpdate}
        onAddImage={handleAddImage}
      />
    </div>
  );
}