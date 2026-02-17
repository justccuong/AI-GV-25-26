import { useCallback } from 'react';
import { useReactFlow, Panel } from 'reactflow';
import { Plus } from 'lucide-react';

export default function AddNodeButton({ theme, onNodeLabelChange, setNodes }) {
  const { getViewport, screenToFlowPosition } = useReactFlow();

  const handleAddNode = useCallback(() => {
    const viewport = getViewport();
    const center = screenToFlowPosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    });
    const newNodeId = `node-${Date.now()}`;
    const newNode = {
      id: newNodeId,
      type: 'editable',
      position: center,
      data: {
        label: 'New Node',
        onLabelChange: onNodeLabelChange,
      },
      style: {
        ...(theme.node.childBg ? { background: theme.node.childBg } : {}),
        ...(theme.node.childBorder ? { border: theme.node.childBorder } : {}),
        color: theme.node.textColor,
        fontFamily: theme.node.fontFamily,
        padding: '10px',
        borderRadius: '20px',
        width: 240,
        height: 60,
      },
    };
    setNodes((nds) => [...nds, newNode]);
  }, [getViewport, screenToFlowPosition, theme, onNodeLabelChange, setNodes]);

  return (
    <Panel position="bottom-right" className="flex flex-col gap-3">
      <button
        type="button"
        onClick={handleAddNode}
        className="w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-white transition-transform hover:scale-105"
        style={{
          background: theme.edge?.stroke || '#06b6d4',
          boxShadow: `0 4px 14px ${theme.edge?.stroke || '#06b6d4'}66`,
        }}
        title="Thêm node mới"
      >
        <Plus className="w-5 h-5" />
      </button>
    </Panel>
  );
}
