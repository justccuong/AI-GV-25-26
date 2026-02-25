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
    // Nếu chưa select thì return luôn, thả cho sự kiện bay lên để React Flow bôi xanh node!
    if (!selected) return; 

    // Đã select rồi thì mới chặn lại để bật chế độ Edit (không cho drag lung tung)
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

 // File: frontend/src/components/EditableNode.jsx

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
        cursor: 'move', // Cho con trỏ thành icon kéo cho oách
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
          className="rich-text-toolbar nodrag" // Toolbar thì luôn cấm kéo để bấm nút cho chuẩn
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%) translateY(-8px)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button type="button" onClick={() => execCommand('bold')} title="Bold">B</button>
          <button type="button" onClick={() => execCommand('italic')} title="Italic">I</button>
          <select
            value={fontSizePx}
            onChange={(e) => applyFontSize(e.target.value)}
            title="Font size (px)"
            className="nodrag"
          >
            {FONT_SIZE_OPTIONS.map((px) => (
              <option key={px} value={px}>{px} px</option>
            ))}
          </select>
        </div>
      )}

      {/* CHỖ FIX CỰC MẠNH ĐÂY NÈ HOÀNG TỬ: Chỉ nodrag khi isEditing = true */}
      <div
        className={`mindmap-node-content ${isEditing ? 'nodrag' : ''}`}
        style={{
          color: nodeStyle.color || 'inherit', // Thừa hưởng màu từ theme, hết trắng tinh nhé!
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
            className="mindmap-node-content" // Bỏ nodrag ở đây để tha hồ kéo node!
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
