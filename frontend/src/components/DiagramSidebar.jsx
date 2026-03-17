import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Edit3, FilePlus2, FolderOpen, Loader2, Search, Trash2 } from 'lucide-react';

function formatTimestamp(value) {
  if (!value) {
    return 'Unsaved';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Recently updated';
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

export default function DiagramSidebar({
  isOpen,
  diagrams,
  activeDiagramId,
  loading,
  error,
  onToggle,
  onCreateNew,
  onOpenDiagram,
  onRenameDiagram,
  onDeleteDiagram,
}) {
  const [query, setQuery] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [draftTitle, setDraftTitle] = useState('');

  const filteredDiagrams = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return diagrams;
    }

    return diagrams.filter((diagram) =>
      diagram.title.toLowerCase().includes(normalizedQuery)
    );
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
    return (
      <aside className="flex h-full w-16 flex-col items-center justify-between border-r border-white/10 bg-slate-950/75 py-5 backdrop-blur-xl">
        <div className="flex flex-col items-center gap-4">
          <button
            type="button"
            onClick={onToggle}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-200 transition-colors hover:bg-white/10"
            title="Open saved diagrams"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={onCreateNew}
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-400 text-slate-950 transition-transform hover:scale-[1.03]"
            title="New diagram"
          >
            <FilePlus2 className="h-5 w-5" />
          </button>
        </div>

        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-400">
          {diagrams.length}
        </div>
      </aside>
    );
  }

  return (
    <aside className="flex h-full w-[320px] flex-col border-r border-white/10 bg-slate-950/75 backdrop-blur-xl">
      <div className="border-b border-white/10 px-4 py-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-cyan-300/80">Workspace history</p>
            <h2 className="mt-1 text-lg font-semibold text-white">Saved Mind Maps</h2>
          </div>
          <button
            type="button"
            onClick={onToggle}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-200 transition-colors hover:bg-white/10"
            title="Collapse sidebar"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        </div>

        <button
          type="button"
          onClick={onCreateNew}
          className="mb-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition-transform hover:scale-[1.01]"
        >
          <FilePlus2 className="h-4 w-4" />
          New blank diagram
        </button>

        <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-slate-300">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search saved diagrams"
            className="w-full bg-transparent outline-none placeholder:text-slate-500"
          />
        </label>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3">
        {loading ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading diagrams...
          </div>
        ) : (
          <div className="space-y-3">
            {error && (
              <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {error}
              </div>
            )}

            {!filteredDiagrams.length && !error && (
              <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 px-5 py-10 text-center text-sm text-slate-400">
                No diagrams yet. Create one and it will appear here.
              </div>
            )}

            {filteredDiagrams.map((diagram) => {
              const isActive = String(diagram.id) === String(activeDiagramId);
              const isEditing = editingId === diagram.id;

              return (
                <article
                  key={diagram.id}
                  className={[
                    'rounded-3xl border px-4 py-4 transition-all',
                    isActive
                      ? 'border-cyan-400/40 bg-cyan-400/10 shadow-[0_0_0_1px_rgba(34,211,238,0.2)]'
                      : 'border-white/8 bg-white/5 hover:bg-white/[0.07]',
                  ].join(' ')}
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
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
                        className="w-full rounded-2xl border border-cyan-400/30 bg-slate-900/80 px-3 py-2 text-sm text-white outline-none"
                        autoFocus
                      />
                    ) : (
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-semibold text-white">{diagram.title}</h3>
                        <p className="mt-1 text-xs text-slate-400">
                          Updated {formatTimestamp(diagram.updated_at || diagram.created_at)}
                        </p>
                      </div>
                    )}

                    <div className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[11px] uppercase tracking-[0.16em] text-slate-400">
                      #{diagram.id}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onOpenDiagram(diagram.id)}
                      className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-white/10 px-3 py-2 text-sm font-medium text-slate-100 transition-colors hover:bg-white/15"
                    >
                      <FolderOpen className="h-4 w-4 text-cyan-300" />
                      Open
                    </button>
                    <button
                      type="button"
                      onClick={() => startRename(diagram)}
                      className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-300 transition-colors hover:bg-white/10"
                      title="Rename diagram"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteDiagram(diagram.id)}
                      className="flex h-10 w-10 items-center justify-center rounded-2xl border border-rose-500/20 bg-rose-500/10 text-rose-200 transition-colors hover:bg-rose-500/15"
                      title="Delete diagram"
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
  );
}
