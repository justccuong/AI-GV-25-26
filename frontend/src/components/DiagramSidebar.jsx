import React, { useMemo, useState } from 'react';
import { ChevronLeft, Edit3, FilePlus2, FolderOpen, Loader2, Search, Trash2 } from 'lucide-react';
import { getTheme } from '../utils/themeConfig';

function formatTimestamp(value) {
  if (!value) {
    return 'Chưa lưu';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Mới cập nhật';
  }

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export default function DiagramSidebar({
  isOpen,
  diagrams,
  activeDiagramId,
  loading,
  error,
  themeId,
  onToggle,
  onCreateNew,
  onOpenDiagram,
  onRenameDiagram,
  onDeleteDiagram,
}) {
  const [query, setQuery] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [draftTitle, setDraftTitle] = useState('');
  const shellTheme = getTheme(themeId).shell || {};

  const filteredDiagrams = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return diagrams;
    }

    return diagrams.filter((diagram) => diagram.title.toLowerCase().includes(normalizedQuery));
  }, [diagrams, query]);

  const startRename = (diagram) => {
    setEditingId(diagram.id);
    setDraftTitle(diagram.title);
  };

  const submitRename = async () => {
    const nextTitle = draftTitle.trim();

    if (!editingId || !nextTitle) {
      setEditingId(null);
      return;
    }

    await onRenameDiagram(editingId, nextTitle);
    setEditingId(null);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={onToggle}
        className="absolute inset-0 z-30 bg-slate-950/16 backdrop-blur-[2px]"
        aria-label="Đóng danh sách sơ đồ"
      />

      <aside
        className="absolute inset-y-0 left-0 z-40 flex min-h-0 w-[min(88vw,320px)] flex-col border-r shadow-[0_30px_80px_rgba(15,23,42,0.24)] backdrop-blur-2xl"
        style={{
          borderColor: shellTheme.panelBorder,
          background: shellTheme.panelBg,
        }}
      >
        <div className="border-b px-3.5 py-3.5" style={{ borderColor: shellTheme.panelBorder }}>
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.24em]" style={{ color: shellTheme.accent }}>
                Lịch sử làm việc
              </p>
              <h2 className="mt-1 text-base font-semibold" style={{ color: shellTheme.panelText }}>
                Sơ đồ đã lưu
              </h2>
            </div>

            <button
              type="button"
              onClick={onToggle}
              className="flex h-10 w-10 items-center justify-center rounded-2xl border transition-colors hover:brightness-105"
              title="Thu gọn thư viện"
              style={{
                borderColor: shellTheme.panelBorder,
                background: shellTheme.accentSoft,
                color: shellTheme.panelText,
              }}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          </div>

          <button
            type="button"
            onClick={onCreateNew}
            className="mb-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition-transform hover:scale-[1.01]"
          >
            <FilePlus2 className="h-4 w-4" />
            Tạo sơ đồ trống
          </button>

          <label
            className="flex items-center gap-3 rounded-2xl border px-3 py-2.5 text-sm"
            style={{
              borderColor: shellTheme.panelBorder,
              background: shellTheme.panelStrongBg,
              color: shellTheme.panelText,
            }}
          >
            <Search className="h-4 w-4" style={{ color: shellTheme.panelMuted }} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm trong các sơ đồ đã lưu"
              className="w-full bg-transparent outline-none placeholder:opacity-60"
              style={{ color: shellTheme.panelText }}
            />
          </label>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-3">
          {loading ? (
            <div
              className="flex h-full items-center justify-center text-sm"
              style={{ color: shellTheme.panelMuted }}
            >
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Đang tải danh sách sơ đồ...
            </div>
          ) : (
            <div className="space-y-3">
              {error && (
                <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                  {error}
                </div>
              )}

              {!filteredDiagrams.length && !error && (
                <div
                  className="rounded-3xl border border-dashed px-5 py-10 text-center text-sm"
                  style={{
                    borderColor: shellTheme.panelBorder,
                    background: shellTheme.panelStrongBg,
                    color: shellTheme.panelMuted,
                  }}
                >
                  Chưa có sơ đồ nào. Tạo sơ đồ mới và chúng sẽ xuất hiện ở đây.
                </div>
              )}

              {filteredDiagrams.map((diagram) => {
                const isActive = String(diagram.id) === String(activeDiagramId);
                const isEditing = editingId === diagram.id;

                return (
                  <article
                    key={diagram.id}
                    className={[
                      'rounded-[1.55rem] border px-3.5 py-3.5 transition-all',
                      isActive
                        ? 'border-cyan-400/40 bg-cyan-400/10 shadow-[0_0_0_1px_rgba(34,211,238,0.2)]'
                        : '',
                    ].join(' ')}
                    style={
                      isActive
                        ? undefined
                        : {
                            borderColor: shellTheme.panelBorder,
                            background: shellTheme.panelStrongBg,
                          }
                    }
                  >
                    <div className="mb-2.5 flex items-start justify-between gap-3">
                      {isEditing ? (
                        <input
                          value={draftTitle}
                          onChange={(event) => setDraftTitle(event.target.value)}
                          onBlur={submitRename}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                              submitRename();
                            }

                            if (event.key === 'Escape') {
                              setEditingId(null);
                            }
                          }}
                          className="w-full rounded-2xl border px-3 py-2 text-sm outline-none"
                          style={{
                            borderColor: shellTheme.accent,
                            background: shellTheme.panelBg,
                            color: shellTheme.panelText,
                          }}
                          autoFocus
                        />
                      ) : (
                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-semibold" style={{ color: shellTheme.panelText }}>
                            {diagram.title}
                          </h3>
                          <p className="mt-1 text-xs" style={{ color: shellTheme.panelMuted }}>
                            Cập nhật {formatTimestamp(diagram.updated_at || diagram.created_at)}
                          </p>
                        </div>
                      )}

                      <div
                        className="rounded-full border px-2 py-1 text-[11px] uppercase tracking-[0.16em]"
                        style={{
                          borderColor: shellTheme.panelBorder,
                          background: shellTheme.accentSoft,
                          color: shellTheme.panelMuted,
                        }}
                      >
                        #{diagram.id}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onOpenDiagram(diagram.id)}
                        className="flex flex-1 items-center justify-center gap-2 rounded-2xl px-3 py-2 text-sm font-medium transition-colors hover:brightness-105"
                        style={{
                          background: shellTheme.accentSoft,
                          color: shellTheme.panelText,
                        }}
                      >
                        <FolderOpen className="h-4 w-4" style={{ color: shellTheme.accent }} />
                        Mở
                      </button>
                      <button
                        type="button"
                        onClick={() => startRename(diagram)}
                        className="flex h-10 w-10 items-center justify-center rounded-2xl border transition-colors hover:brightness-105"
                        title="Đổi tên sơ đồ"
                        style={{
                          borderColor: shellTheme.panelBorder,
                          background: shellTheme.panelBg,
                          color: shellTheme.panelText,
                        }}
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteDiagram(diagram.id)}
                        className="flex h-10 w-10 items-center justify-center rounded-2xl border border-rose-500/20 bg-rose-500/10 text-rose-200 transition-colors hover:bg-rose-500/15"
                        title="Xóa sơ đồ"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
