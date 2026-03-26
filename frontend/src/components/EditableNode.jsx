import React, { useCallback, useEffect, useMemo, useRef, useState, memo } from 'react';
import { Handle, NodeResizer, Position } from 'reactflow';
import { Bold, Italic, Link2 } from 'lucide-react';

const FONT_SIZE_OPTIONS = [12, 14, 16, 18, 22, 28];

function isHtml(value) {
  return typeof value === 'string' && /<[a-z][\s\S]*>/i.test(value);
}

function toHtml(value) {
  if (!value) {
    return '';
  }

  return isHtml(value) ? value : value.replace(/\n/g, '<br />');
}

function stripHtml(value) {
  return typeof value === 'string' ? value.replace(/<[^>]*>/g, ' ').trim() : '';
}

function EditableNode({ data, selected, id }) {
  const [fontSizeDraft, setFontSizeDraft] = useState(null);
  const [draftImageUrl, setDraftImageUrl] = useState(null);
  const contentRef = useRef(null);
  const nodeRef = useRef(null);
  const isEditing = Boolean(data.isEditingActive && !data.disableEditing);
  const displayLabel = data.label || '';
  const fontSizePx =
    typeof fontSizeDraft === 'number'
      ? fontSizeDraft
      : typeof data.fontSize === 'number'
        ? data.fontSize
        : Number(data.fontSize) || 14;
  const resolvedImageUrl =
    draftImageUrl !== null ? draftImageUrl : typeof data.imageUrl === 'string' ? data.imageUrl : '';

  useEffect(() => {
    if (isEditing && contentRef.current) {
      contentRef.current.innerHTML = toHtml(displayLabel);
      contentRef.current.focus();
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(contentRef.current);
      range.collapse(false);
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
  }, [displayLabel, isEditing]);

  const commitChanges = useCallback(
    (extra = {}) => {
      const nextLabel =
        typeof extra.label === 'string'
          ? extra.label
          : contentRef.current?.innerHTML || displayLabel;

      data.onDataChange?.(id, {
        label: nextLabel,
        fontSize: typeof extra.fontSize === 'number' ? extra.fontSize : fontSizePx,
        imageUrl: typeof extra.imageUrl === 'string' ? extra.imageUrl : resolvedImageUrl,
        ...extra,
      });
    },
    [data, displayLabel, fontSizePx, id, resolvedImageUrl]
  );

  const handleBlur = useCallback(() => {
    commitChanges();
    setDraftImageUrl(null);
    setFontSizeDraft(null);
    data.onFinishEditing?.(id);
  }, [commitChanges, data, id]);

  const shouldKeepEditing = useCallback((nextTarget) => {
    if (!nextTarget || typeof nextTarget !== 'object' || !('nodeType' in nextTarget)) {
      return false;
    }

    return Boolean(nodeRef.current?.contains(nextTarget));
  }, []);

  const handleContentBlur = useCallback(
    (event) => {
      commitChanges();

      if (shouldKeepEditing(event.relatedTarget)) {
        return;
      }

      setDraftImageUrl(null);
      setFontSizeDraft(null);
      data.onFinishEditing?.(id);
    },
    [commitChanges, data, id, shouldKeepEditing]
  );

  const handleImageUrlBlur = useCallback(
    (event) => {
      commitChanges({
        imageUrl: event.target.value,
      });

      if (shouldKeepEditing(event.relatedTarget)) {
        return;
      }

      handleBlur();
    },
    [commitChanges, handleBlur, shouldKeepEditing]
  );

  const execCommand = useCallback((command) => {
    document.execCommand(command, false, null);
    contentRef.current?.focus();
  }, []);

  const wrapperStyle = useMemo(() => {
    const nodeStyle = data.style || {};

    return {
      width: nodeStyle.width,
      height: nodeStyle.height,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'stretch',
      alignItems: 'stretch',
      textAlign: 'center',
      position: 'relative',
      boxSizing: 'border-box',
      cursor: data.disableEditing ? 'crosshair' : 'move',
      overflow: 'visible',
    };
  }, [data.disableEditing, data.style]);

  const surfaceStyle = useMemo(() => {
    const nodeStyle = data.style || {};

    return {
      ...nodeStyle,
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'stretch',
      alignItems: 'stretch',
      textAlign: 'center',
      boxSizing: 'border-box',
      overflow: 'hidden',
      boxShadow: data.isConnectSource
        ? '0 0 0 3px rgba(34,197,94,0.5)'
        : nodeStyle.boxShadow,
    };
  }, [data.isConnectSource, data.style]);

  const bodyClasses = `mindmap-node-content ${isEditing ? 'nodrag' : ''}`;
  const nodeType = data.nodeType || 'standard';

  return (
    <div ref={nodeRef} style={wrapperStyle}>
      {selected && (
        <NodeResizer
          color="#22d3ee"
          isVisible
          minWidth={140}
          minHeight={70}
          handleClassName="mindmap-resize-handle"
          lineClassName="mindmap-resize-line"
        />
      )}

      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />

      {isEditing && (
        <div
          className="rich-text-toolbar nodrag"
          style={{
            position: 'absolute',
            left: '50%',
            bottom: 'calc(100% + 14px)',
            transform: 'translateX(-50%)',
          }}
          onMouseDown={(event) => event.preventDefault()}
          onClick={(event) => event.stopPropagation()}
        >
          <button type="button" onClick={() => execCommand('bold')} title="In đậm">
            <Bold className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => execCommand('italic')} title="In nghiêng">
            <Italic className="h-4 w-4" />
          </button>
          <select
            value={fontSizePx}
            onChange={(event) => {
              setFontSizeDraft(Number(event.target.value));
            }}
            aria-label="Cỡ chữ"
          >
            {FONT_SIZE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}px
              </option>
            ))}
          </select>
        </div>
      )}

      <div style={surfaceStyle}>
        <div className="flex h-full w-full flex-col items-center justify-center gap-3 px-4 py-4">
          {nodeType === 'image' && (
            <div className="flex w-full flex-1 flex-col items-center justify-center gap-3">
              {resolvedImageUrl ? (
                <img
                  src={resolvedImageUrl}
                  alt={stripHtml(displayLabel || 'Nút hình ảnh') || 'Nút hình ảnh'}
                  className="h-28 w-full rounded-2xl object-cover shadow-lg"
                />
              ) : (
                <div className="flex h-28 w-full items-center justify-center rounded-2xl border border-dashed border-slate-400/40 bg-slate-100 text-sm text-slate-500">
                  Thêm URL ảnh ở bên dưới
                </div>
              )}

              {isEditing && (
                <label className="flex w-full items-center gap-2 rounded-2xl border border-slate-300 bg-white/80 px-3 py-2 text-xs text-slate-700 nodrag">
                  <Link2 className="h-3.5 w-3.5" />
                  <input
                    value={resolvedImageUrl}
                    onChange={(event) => setDraftImageUrl(event.target.value)}
                    onBlur={handleImageUrlBlur}
                    placeholder="Dán URL hình ảnh"
                    className="w-full bg-transparent outline-none placeholder:text-slate-400"
                  />
                </label>
              )}
            </div>
          )}

          {isEditing ? (
            <div
              ref={contentRef}
              contentEditable
              suppressContentEditableWarning
              className={`${bodyClasses} w-full text-center`}
              style={{
                fontSize: `${fontSizePx}px`,
                color: 'inherit',
                minHeight: '1.5em',
                width: '100%',
              }}
              onMouseDown={(event) => event.stopPropagation()}
              onClick={(event) => event.stopPropagation()}
              onBlur={handleContentBlur}
            />
          ) : (
            <div
              className={`${bodyClasses} w-full text-center`}
              style={{
                fontSize: `${fontSizePx}px`,
                color: 'inherit',
              }}
              dangerouslySetInnerHTML={{
                __html: toHtml(displayLabel),
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default memo(EditableNode, (prev, next) => {
  return (
    prev.selected === next.selected &&
    prev.data.label === next.data.label &&
    prev.data.fontSize === next.data.fontSize &&
    prev.data.imageUrl === next.data.imageUrl &&
    prev.data.colorOverride === next.data.colorOverride &&
    prev.data.disableEditing === next.data.disableEditing &&
    prev.data.isConnectSource === next.data.isConnectSource &&
    prev.data.isEditingActive === next.data.isEditingActive &&
    prev.data.nodeType === next.data.nodeType &&
    prev.data.style?.background === next.data.style?.background &&
    prev.data.style?.borderColor === next.data.style?.borderColor &&
    prev.data.style?.boxShadow === next.data.style?.boxShadow &&
    prev.data.style?.width === next.data.style?.width &&
    prev.data.style?.height === next.data.style?.height
  );
});
