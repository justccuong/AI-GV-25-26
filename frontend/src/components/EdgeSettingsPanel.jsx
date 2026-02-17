import React, { useState, useEffect } from 'react';
import { X, Palette, Type, Minus, GitBranch, Move } from 'lucide-react';

const EDGE_TYPES = {
  floating: 'Bezier (Floating)',
  bezier: 'Bezier',
  straight: 'Straight',
  step: 'Step',
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
        label: label.trim() || undefined,
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

  const handleCancel = () => {
    onClose();
  };

  if (!edge) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={handleCancel}>
      <div
        className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <GitBranch className="w-5 h-5" />
            Edge Settings
          </h2>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Edge Type */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <Move className="w-4 h-4" />
            Line Type
          </label>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(EDGE_TYPES).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setEdgeType(key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  edgeType === key
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Stroke Width */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <Minus className="w-4 h-4" />
            Thickness: {strokeWidth}px
          </label>
          <input
            type="range"
            min="1"
            max="10"
            value={strokeWidth}
            onChange={(e) => setStrokeWidth(e.target.value)}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Stroke Color */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Color
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={strokeColor}
              onChange={(e) => setStrokeColor(e.target.value)}
              className="w-12 h-12 rounded-lg border-2 border-slate-300 cursor-pointer"
            />
            <input
              type="text"
              value={strokeColor}
              onChange={(e) => setStrokeColor(e.target.value)}
              className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="#64748b"
            />
          </div>
        </div>

        {/* Label */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <Type className="w-4 h-4" />
            Label Text
          </label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Enter edge label..."
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleCancel}
            className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
