import React, { useEffect, useState } from 'react';
import { X, Palette, Type, Minus, GitBranch, Move } from 'lucide-react';

const EDGE_TYPES = {
  floating: 'Bezier nổi',
  bezier: 'Bezier',
  straight: 'Thẳng',
  step: 'Bậc thang',
};

export default function EdgeSettingsPanel({ edge, onClose, onUpdate }) {
  const [edgeType, setEdgeType] = useState(edge?.type || 'floating');
  const [strokeWidth, setStrokeWidth] = useState(edge?.style?.strokeWidth || 3);
  const [strokeColor, setStrokeColor] = useState(edge?.style?.stroke || '#64748b');
  const [label, setLabel] = useState(edge?.label || '');

  useEffect(() => {
    if (edge) {
      setEdgeType(edge.type || 'floating');
      setStrokeWidth(edge.style?.strokeWidth || 3);
      setStrokeColor(edge.style?.stroke || '#64748b');
      setLabel(edge.label || '');
    }
  }, [edge]);

  const handleSave = () => {
    if (onUpdate && edge) {
      onUpdate({
        ...edge,
        type: edgeType,
        label: typeof label === 'string' ? label.trim() : '',
        markerEnd: edge.markerEnd || { type: 'arrowclosed' },
        style: {
          ...edge.style,
          stroke: strokeColor,
          strokeWidth: Number(strokeWidth),
        },
      });
    }

    onClose();
  };

  if (!edge) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-xl font-bold text-gray-800">
            <GitBranch className="h-5 w-5" />
            Tùy chỉnh cạnh nối
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 transition-colors hover:text-gray-600"
            aria-label="Đóng bảng tùy chỉnh cạnh"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4">
          <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
            <Move className="h-4 w-4" />
            Kiểu đường nối
          </label>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(EDGE_TYPES).map(([key, typeLabel]) => (
              <button
                key={key}
                type="button"
                onClick={() => setEdgeType(key)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                  edgeType === key
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {typeLabel}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
            <Minus className="h-4 w-4" />
            Độ dày: {strokeWidth}px
          </label>
          <input
            type="range"
            min="1"
            max="10"
            value={strokeWidth}
            onChange={(event) => setStrokeWidth(event.target.value)}
            className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200"
          />
        </div>

        <div className="mb-4">
          <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
            <Palette className="h-4 w-4" />
            Màu sắc
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={strokeColor}
              onChange={(event) => setStrokeColor(event.target.value)}
              className="h-12 w-12 cursor-pointer rounded-lg border-2 border-slate-300"
            />
            <input
              type="text"
              value={strokeColor}
              onChange={(event) => setStrokeColor(event.target.value)}
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="#64748b"
            />
          </div>
        </div>

        <div className="mb-6">
          <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
            <Type className="h-4 w-4" />
            Nhãn cạnh
          </label>
          <input
            type="text"
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Để trống nếu không cần hiển thị"
          />
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg bg-slate-100 px-4 py-2 font-medium text-slate-700 transition-colors hover:bg-slate-200"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white transition-colors hover:bg-indigo-700"
          >
            Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  );
}

