import { useCallback } from 'react';
import { BaseEdge, EdgeLabelRenderer, getBezierPath, getMarkerEnd, useStore } from 'reactflow';
import { getEdgeParams } from '../utils/floatingEdgeUtils';

export default function FloatingEdge({ id, source, target, markerEnd, style, label }) {
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
  const [edgePath, labelX, labelY] = getBezierPath({
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
  const visibleLabel = typeof label === 'string' ? label.trim() : '';

  return (
    <>
      <BaseEdge id={id} path={edgePath} markerEnd={markerEndUrl} style={edgeStyle} />
      {visibleLabel ? (
        <EdgeLabelRenderer>
          <div
            className="nodrag nopan rounded-full border border-white/12 bg-slate-950/82 px-3 py-1 text-[11px] font-medium text-slate-100 shadow-lg backdrop-blur-xl"
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: 'none',
            }}
          >
            {visibleLabel}
          </div>
        </EdgeLabelRenderer>
      ) : null}
    </>
  );
}
