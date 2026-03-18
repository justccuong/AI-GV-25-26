import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarDays, Edit3, FolderOpen, LayoutGrid, Loader2, Plus, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { deleteMindMap, getApiErrorMessage, getMindMaps, renameMindMap } from '../api/axiosClient';

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

export default function DiagramsDashboard() {
  const navigate = useNavigate();
  const [diagrams, setDiagrams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [draftTitle, setDraftTitle] = useState('');

  const loadDiagrams = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await getMindMaps();
      setDiagrams(response);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Không thể tải danh sách sơ đồ.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDiagrams();
  }, [loadDiagrams]);

  const sortedDiagrams = useMemo(
    () =>
      [...diagrams].sort((left, right) => {
        const leftTime = new Date(left.updated_at || left.created_at || 0).getTime();
        const rightTime = new Date(right.updated_at || right.created_at || 0).getTime();
        return rightTime - leftTime;
      }),
    [diagrams]
  );

  const handleRename = useCallback(async (diagramId) => {
    const nextTitle = draftTitle.trim();
    if (!nextTitle) {
      setEditingId(null);
      return;
    }

    try {
      const updated = await renameMindMap(diagramId, nextTitle);
      setDiagrams((currentDiagrams) =>
        currentDiagrams.map((diagram) =>
          diagram.id === diagramId ? { ...diagram, title: updated.title } : diagram
        )
      );
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Không thể đổi tên sơ đồ.'));
    } finally {
      setEditingId(null);
    }
  }, [draftTitle]);

  const handleDelete = useCallback(async (diagramId) => {
    const shouldDelete = window.confirm('Bạn có chắc muốn xóa sơ đồ này không?');
    if (!shouldDelete) {
      return;
    }

    try {
      await deleteMindMap(diagramId);
      setDiagrams((currentDiagrams) =>
        currentDiagrams.filter((diagram) => diagram.id !== diagramId)
      );
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Không thể xóa sơ đồ.'));
    }
  }, []);

  return (
    <div className="h-full overflow-y-auto bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.12),_transparent_35%),linear-gradient(180deg,_#020617,_#0f172a_48%,_#020617)] px-4 py-6 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1600px]">
        <div className="mb-8 flex flex-col gap-4 rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-1 text-xs uppercase tracking-[0.24em] text-cyan-200">
              <LayoutGrid className="h-3.5 w-3.5" />
              Sơ đồ của tôi
            </p>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white">Dashboard sơ đồ đã lưu</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
              Mỗi thẻ là một mindmap đã lưu với thumbnail, thời gian cập nhật gần nhất và thao tác mở nhanh. Khu vực này tách riêng khỏi canvas để bạn duyệt thư viện sơ đồ dễ hơn, nhất là trên điện thoại.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate('/workspace')}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition-transform hover:scale-[1.01]"
          >
            <Plus className="h-4 w-4" />
            Tạo sơ đồ mới
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex min-h-[280px] items-center justify-center rounded-[2rem] border border-white/10 bg-white/5 text-sm text-slate-300 shadow-xl backdrop-blur-xl">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Đang tải dashboard sơ đồ...
          </div>
        ) : sortedDiagrams.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-white/10 bg-white/5 px-6 py-16 text-center shadow-xl backdrop-blur-xl">
            <p className="text-sm text-slate-300">Chưa có sơ đồ nào được lưu.</p>
            <button
              type="button"
              onClick={() => navigate('/workspace')}
              className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950"
            >
              <Plus className="h-4 w-4" />
              Bắt đầu từ canvas mới
            </button>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {sortedDiagrams.map((diagram) => (
              <article
                key={diagram.id}
                className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 shadow-2xl backdrop-blur-xl"
              >
                <div className="relative aspect-[16/10] overflow-hidden border-b border-white/10 bg-slate-900/40">
                  {diagram.thumbnail ? (
                    <img
                      src={diagram.thumbnail}
                      alt={`Xem trước ${diagram.title}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-slate-400">
                      Chưa có thumbnail
                    </div>
                  )}
                  <div className="absolute left-4 top-4 rounded-full border border-white/10 bg-slate-950/70 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-slate-300 backdrop-blur-xl">
                    #{diagram.id}
                  </div>
                </div>

                <div className="p-5">
                  {editingId === diagram.id ? (
                    <input
                      value={draftTitle}
                      onChange={(event) => setDraftTitle(event.target.value)}
                      onBlur={() => handleRename(diagram.id)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          handleRename(diagram.id);
                        }

                        if (event.key === 'Escape') {
                          setEditingId(null);
                        }
                      }}
                      className="w-full rounded-2xl border border-cyan-400/30 bg-slate-950/80 px-3 py-2 text-sm text-white outline-none"
                      autoFocus
                    />
                  ) : (
                    <h2 className="line-clamp-2 text-lg font-semibold text-white">{diagram.title}</h2>
                  )}

                  <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5 text-cyan-300" />
                      {formatTimestamp(diagram.updated_at || diagram.created_at)}
                    </span>
                    <span>{diagram.node_count || 0} node</span>
                    <span>{diagram.edge_count || 0} edge</span>
                  </div>

                  <div className="mt-5 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => navigate(`/editor/${diagram.id}`)}
                      className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition-transform hover:scale-[1.01]"
                    >
                      <FolderOpen className="h-4 w-4" />
                      Mở
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(diagram.id);
                        setDraftTitle(diagram.title);
                      }}
                      className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-200 transition-colors hover:bg-white/10"
                      title="Đổi tên"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(diagram.id)}
                      className="flex h-11 w-11 items-center justify-center rounded-2xl border border-rose-500/20 bg-rose-500/10 text-rose-200 transition-colors hover:bg-rose-500/15"
                      title="Xóa sơ đồ"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
