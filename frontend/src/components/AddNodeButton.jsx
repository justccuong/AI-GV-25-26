import { useCallback } from 'react';
import { Panel, useReactFlow } from 'reactflow';
import { Plus } from 'lucide-react';

export default function AddNodeButton({ theme, onNodeLabelChange, setNodes }) {
  const { screenToFlowPosition } = useReactFlow();

  const handleAddNode = useCallback(() => {
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
        label: 'Nút mới',
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
  }, [screenToFlowPosition, theme, onNodeLabelChange, setNodes]);

  return (
    <Panel position="bottom-right" className="flex flex-col gap-3">
      <button
        type="button"
        onClick={handleAddNode}
        className="flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lg transition-transform hover:scale-105"
        style={{
          background: theme.edge?.stroke || '#06b6d4',
          boxShadow: `0 4px 14px ${theme.edge?.stroke || '#06b6d4'}66`,
        }}
        title="Thêm node mới"
      >
        <Plus className="h-5 w-5" />
      </button>
    </Panel>
  );
}
