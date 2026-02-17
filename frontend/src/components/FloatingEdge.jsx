import { useCallback } from 'react';
import { useStore, getBezierPath, getMarkerEnd } from 'reactflow';
import { getEdgeParams } from '../utils/floatingEdgeUtils';

export default function FloatingEdge({ id, source, target, markerEnd, style }) {
  const markerEndUrl =
    typeof markerEnd === 'object' && markerEnd?.type
      ? getMarkerEnd(markerEnd.type)
      : markerEnd;
  const sourceNode = useStore(useCallback((store) => store.nodeInternals.get(source), [source]));
  const targetNode = useStore(useCallback((store) => store.nodeInternals.get(target), [target]));

  if (!sourceNode || !targetNode) {
    return null;
  }

  const { sx, sy, tx, ty, sourcePos, targetPos } = getEdgeParams(sourceNode, targetNode);

  const [edgePath] = getBezierPath({
    sourceX: sx,
    sourceY: sy,
    sourcePosition: sourcePos,
    targetPosition: targetPos,
    targetX: tx,
    targetY: ty,
  });

  const edgeStyle = {
    ...style,
    strokeWidth: style?.strokeWidth ?? 3,
    stroke: style?.stroke ?? '#64748b',
    strokeDasharray: 'none',
  };

  return (
    <path
      id={id}
      className="react-flow__edge-path"
      d={edgePath}
      markerEnd={markerEndUrl}
      style={edgeStyle} // Dùng style mới
    />
  );
}