import { Position, getBezierPath } from 'reactflow';

// Hàm lấy điểm trung tâm của Node
function getNodeCenter(node) {
  return {
    x: node.position.x + node.width / 2,
    y: node.position.y + node.height / 2,
  };
}

// Hàm tính toán xem nên nối vào Top, Bottom, Left hay Right
function getHandlePosition(node, intersectionPoint) {
  const center = getNodeCenter(node);
  const { x, y } = intersectionPoint;
  const { x: cx, y: cy } = center;
  const { width, height } = node;

  // Xem điểm cắt gần cạnh nào nhất thì gán Position đó
  // Logic này giúp dây tự "nhảy" sang cạnh gần nhất
  const px = (x - cx) / (width / 2);
  const py = (y - cy) / (height / 2);

  if (Math.abs(px) > Math.abs(py)) {
    return px > 0 ? Position.Right : Position.Left;
  }
  return py > 0 ? Position.Bottom : Position.Top;
}

// Hàm tính giao điểm giữa đường thẳng nối tâm 2 node và cạnh của node
function getNodeIntersection(intersectionNode, targetNode) {
  const { width: w, height: h } = intersectionNode;
  const { x: x1, y: y1 } = getNodeCenter(intersectionNode);
  const { x: x2, y: y2 } = getNodeCenter(targetNode);

  const dx = x2 - x1;
  const dy = y2 - y1;

  if (dx === 0 && dy === 0) return { x: x1, y: y1 };

  const slope = dy / dx;
  const absSlope = Math.abs(slope);

  // Tính toán xem đường thẳng cắt cạnh ngang hay dọc
  let x, y;
  if (absSlope <= h / w) {
    // Cắt cạnh trái hoặc phải
    if (dx > 0) x = x1 + w / 2;
    else x = x1 - w / 2;
    y = y1 + slope * (x - x1);
  } else {
    // Cắt cạnh trên hoặc dưới
    if (dy > 0) y = y1 + h / 2;
    else y = y1 - h / 2;
    x = x1 + (y - y1) / slope;
  }

  return { x, y };
}

// Hàm chính để Component gọi: Trả về tọa độ và hướng cong của dây
export function getEdgeParams(source, target) {
  const sourceIntersectionPoint = getNodeIntersection(source, target);
  const targetIntersectionPoint = getNodeIntersection(target, source);

  const sourcePos = getHandlePosition(source, sourceIntersectionPoint);
  const targetPos = getHandlePosition(target, targetIntersectionPoint);

  return {
    sx: sourceIntersectionPoint.x,
    sy: sourceIntersectionPoint.y,
    tx: targetIntersectionPoint.x,
    ty: targetIntersectionPoint.y,
    sourcePos,
    targetPos,
  };
}