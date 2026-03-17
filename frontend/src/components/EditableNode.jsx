import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Handle, NodeResizer, Position } from 'reactflow';
import { Bold, Italic, Link2, Plus, Trash2 } from 'lucide-react';
import '../App.css';

const FONT_SIZE_OPTIONS = [12, 14, 16, 18, 22, 28];

const NODE_TYPE_LABELS = {
  standard: 'Chuẩn',
  text: 'Văn bản',
  image: 'Hình ảnh',
  decision: 'Quyết định',
};

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

export default function EditableNode({ data, selected, id }) {
  const [draftLabel, setDraftLabel] = useState(data.label || '');
  const [fontSizePx, setFontSizePx] = useState(
    typeof data.fontSize === 'number' ? data.fontSize : Number(data.fontSize) || 14
  );
  const [draftImageUrl, setDraftImageUrl] = useState(data.imageUrl || '');
  const [isEditing, setIsEditing] = useState(false);
  const contentRef = useRef(null);

  useEffect(() => {
    if (!isEditing) {
      setDraftLabel(data.label || '');
    }
  }, [data.label, isEditing]);

  useEffect(() => {
    setDraftImageUrl(data.imageUrl || '');
  }, [data.imageUrl]);

  useEffect(() => {
    setFontSizePx(typeof data.fontSize === 'number' ? data.fontSize : Number(data.fontSize) || 14);
  }, [data.fontSize]);

  useEffect(() => {
    if (selected && isEditing && contentRef.current) {
      contentRef.current.innerHTML = toHtml(draftLabel);
      contentRef.current.focus();
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(contentRef.current);
      range.collapse(false);
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
  }, [draftLabel, isEditing, selected]);

  const commitChanges = useCallback(
    (extra = {}) => {
      data.onDataChange?.(id, {
        label: draftLabel,
        fontSize: fontSizePx,
        imageUrl: draftImageUrl,
        ...extra,
      });
    },
    [data, draftImageUrl, draftLabel, fontSizePx, id]
  );

  const handleInput = useCallback(() => {
    if (!contentRef.current) {
      return;
    }

    setDraftLabel(contentRef.current.innerHTML);
  }, []);

  const handleTextClick = useCallback(
    (event) => {
      if (!selected || data.disableEditing) {
        return;
      }

      event.stopPropagation();
      setIsEditing(true);
    },
    [data.disableEditing, selected]
  );

  const handleBlur = useCallback(() => {
    setIsEditing(false);
    commitChanges();
  }, [commitChanges]);

  const execCommand = useCallback(
    (command) => {
      document.execCommand(command, false, null);
      handleInput();
      contentRef.current?.focus();
    },
    [handleInput]
  );

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
        ? '0 0 0 3px rgba(34,197,94,0.55), 0 18px 45px rgba(15,23,42,0.18)'
        : nodeStyle.boxShadow,
    };
  }, [data.isConnectSource, data.style]);

  const bodyClasses = `mindmap-node-content ${isEditing ? 'nodrag' : ''}`;
  const nodeType = data.nodeType || 'standard';
  const showTypeBadge = !data.isRoot && nodeType !== 'standard';

  return (
    <div style={wrapperStyle}>
      {selected && (
        <NodeResizer color="#22d3ee" isVisible minWidth={140} minHeight={70} />
      )}

      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />

      {selected && !data.disableEditing && (
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
              const nextSize = Number(event.target.value);
              setFontSizePx(nextSize);
              data.onDataChange?.(id, { fontSize: nextSize });
            }}
            aria-label="Cỡ chữ"
          >
            {FONT_SIZE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}px
              </option>
            ))}
          </select>
          <button type="button" onClick={() => data.onAddChild?.()} title="Thêm nút con">
            <Plus className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => data.onDelete?.()} title="Xóa nút">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )}

      <div style={surfaceStyle}>
        <div
          className="flex h-full w-full flex-col items-center justify-center gap-3 px-4 py-4"
          onClick={handleTextClick}
        >
          {showTypeBadge && (
            <span className="rounded-full border border-black/5 bg-white/35 px-2.5 py-0.5 text-[9px] uppercase tracking-[0.18em] text-current/45 backdrop-blur-sm">
              {NODE_TYPE_LABELS[nodeType] || NODE_TYPE_LABELS.standard}
            </span>
          )}

          {nodeType === 'image' && (
            <div className="flex w-full flex-1 flex-col items-center justify-center gap-3">
              {draftImageUrl ? (
                <img
                  src={draftImageUrl}
                  alt={stripHtml(data.label || 'Nút hình ảnh') || 'Nút hình ảnh'}
                  className="h-28 w-full rounded-2xl object-cover shadow-lg"
                />
              ) : (
                <div className="flex h-28 w-full items-center justify-center rounded-2xl border border-dashed border-slate-400/40 bg-slate-100 text-sm text-slate-500">
                  Thêm URL ảnh ở bên dưới
                </div>
              )}

              {selected && !data.disableEditing && (
                <label className="flex w-full items-center gap-2 rounded-2xl border border-slate-300 bg-white/80 px-3 py-2 text-xs text-slate-700 nodrag">
                  <Link2 className="h-3.5 w-3.5" />
                  <input
                    value={draftImageUrl}
                    onChange={(event) => setDraftImageUrl(event.target.value)}
                    onBlur={() => commitChanges()}
                    placeholder="Dán URL hình ảnh"
                    className="w-full bg-transparent outline-none placeholder:text-slate-400"
                  />
                </label>
              )}
            </div>
          )}

          {selected && isEditing && !data.disableEditing ? (
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
              onInput={handleInput}
              onBlur={handleBlur}
            />
          ) : (
            <div
              className={`${bodyClasses} w-full text-center`}
              style={{
                fontSize: `${fontSizePx}px`,
                color: 'inherit',
              }}
              dangerouslySetInnerHTML={{
                __html: toHtml(draftLabel),
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

