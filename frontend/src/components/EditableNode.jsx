import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Handle, Position, NodeResizer } from 'reactflow';
import '../App.css';

const FONT_SIZE_OPTIONS = [12, 14, 16, 20, 24];

function isHtml(str) {
  if (typeof str !== 'string') return false;
  return /<[a-z][\s\S]*>/i.test(str);
}

export default function EditableNode({ data, selected, id }) {
  const [content, setContent] = useState(() => data.label || '');
  const [fontSizePx, setFontSizePx] = useState(() => {
    const v = data.fontSize;
    return typeof v === 'number' ? v : FONT_SIZE_OPTIONS.includes(Number(v)) ? Number(v) : 14;
  });
  const [isEditing, setIsEditing] = useState(false);
  const contentRef = useRef(null);
  const toolbarRef = useRef(null);

  useEffect(() => {
    setContent(data.label ?? '');
  }, [data.label]);

  useEffect(() => {
    const v = data.fontSize;
    if (v != null) setFontSizePx(FONT_SIZE_OPTIONS.includes(Number(v)) ? Number(v) : 14);
  }, [data.fontSize]);

  useEffect(() => {
    if (selected && contentRef.current && isEditing) {
      const raw = content || '';
      contentRef.current.innerHTML = isHtml(raw) ? raw : raw ? raw.replace(/\n/g, '<br/>') : '';
      contentRef.current.focus();
    }
  }, [selected, isEditing]);

  const notifyChange = useCallback(
    (newContent, newFontSizePx) => {
      if (data.onLabelChange) {
        data.onLabelChange(id, newContent, { fontSize: newFontSizePx });
      }
    },
    [id, data]
  );

  const handleInput = useCallback(() => {
    if (!contentRef.current) return;
    const html = contentRef.current.innerHTML;
    setContent(html);
    notifyChange(html, fontSizePx);
  }, [fontSizePx, notifyChange]);

  const handleTextClick = useCallback((e) => {
    if (!selected) return; 

    e.stopPropagation();
    setIsEditing(true);
    setTimeout(() => {
      if (contentRef.current) {
        contentRef.current.focus();
        const range = document.createRange();
        range.selectNodeContents(contentRef.current);
        range.collapse(false);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }, 0);
  }, [selected]);

  const handleBlur = useCallback(() => {
    setIsEditing(false);
    handleInput();
  }, [handleInput]);

  const execCommand = useCallback((command, value = null) => {
    document.execCommand(command, false, value);
    contentRef.current?.focus();
    handleInput();
  }, [handleInput]);

  const applyFontSize = useCallback(
    (px) => {
      const num = Number(px);
      if (!FONT_SIZE_OPTIONS.includes(num)) return;
      setFontSizePx(num);
      if (contentRef.current) notifyChange(contentRef.current.innerHTML, num);
    },
    [notifyChange]
  );

  const nodeStyle = data.style || {};
  const isConnectSource = data.isConnectSource === true;

  return (
    <div
      className="relative w-full h-full"
      style={{
        ...nodeStyle,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        boxSizing: 'border-box',
        cursor: 'move', 
        ...(isConnectSource
          ? { boxShadow: '0 0 0 3px #22c55e', borderRadius: 'inherit' }
          : {}),
      }}
    >
      {selected && (
        <NodeResizer color="#3b82f6" isVisible minWidth={100} minHeight={40} />
      )}

      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />

      {selected && (
        <div
          ref={toolbarRef}
          className="rich-text-toolbar nodrag"
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%) translateY(-12px)', // Đẩy lên tí cho thoáng
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: '#1f2937', // Chuyển sang dark mode nhìn cho ngầu
            padding: '6px 12px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            zIndex: 100,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Nút format text cũ của cậu, tớ style lại cho đồng bộ */}
          <button type="button" onClick={() => execCommand('bold')} title="Bold" style={{ background: 'transparent', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>B</button>
          <button type="button" onClick={() => execCommand('italic')} title="Italic" style={{ background: 'transparent', color: 'white', border: 'none', cursor: 'pointer', fontStyle: 'italic' }}>I</button>
          
          <select
            value={fontSizePx}
            onChange={(e) => applyFontSize(e.target.value)}
            title="Font size (px)"
            className="nodrag"
            style={{ background: '#374151', color: 'white', border: 'none', borderRadius: '4px', padding: '2px 4px', cursor: 'pointer', outline: 'none' }}
          >
            {FONT_SIZE_OPTIONS.map((px) => (
              <option key={px} value={px}>{px} px</option>
            ))}
          </select>

          {/* Vách ngăn chia khu vực */}
          <div style={{ width: '1px', height: '16px', background: '#4b5563', margin: '0 4px' }} />

          {/* Cặp nút thao tác siêu tốc mới thêm vào */}
          <button 
            type="button" 
            onClick={(e) => { e.stopPropagation(); if (data.onAddChild) data.onAddChild(); }} 
            title="Thêm nhánh con"
            style={{ background: 'transparent', color: '#10b981', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', padding: '0 4px' }}
          >
            + Nhánh
          </button>
          <button 
            type="button" 
            onClick={(e) => { e.stopPropagation(); if (data.onDelete) data.onDelete(); }} 
            title="Xóa Node này"
            style={{ background: 'transparent', color: '#ef4444', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', padding: '0 4px' }}
          >
            Xóa
          </button>
        </div>
      )}

      <div
        className={`mindmap-node-content ${isEditing ? 'nodrag' : ''}`}
        style={{
          color: nodeStyle.color || 'inherit', 
          fontFamily: nodeStyle.fontFamily || 'inherit',
          fontWeight: nodeStyle.fontWeight || 'inherit',
          padding: '10px',
          cursor: isEditing ? 'text' : 'move',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onClick={handleTextClick}
      >
        {selected && isEditing ? (
          <div
            ref={contentRef}
            contentEditable
            suppressContentEditableWarning
            className="mindmap-node-content nodrag"
            style={{
              fontSize: `${fontSizePx}px`,
              color: 'inherit',
              minHeight: '1.5em',
              width: '100%',
              cursor: 'text',
              outline: 'none',
            }}
            onInput={handleInput}
            onBlur={handleBlur}
          />
        ) : (
          <div
            className="mindmap-node-content"
            style={{
              fontSize: `${typeof data.fontSize === 'number' ? data.fontSize : fontSizePx}px`,
              color: 'inherit',
              cursor: selected ? 'text' : 'move',
              width: '100%',
            }}
            dangerouslySetInnerHTML={{
              __html: isHtml(content) ? content : content ? content.replace(/\n/g, '<br/>') : '',
            }}
          />
        )}
      </div>
    </div>
  );
}