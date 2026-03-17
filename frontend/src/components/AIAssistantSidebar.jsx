import React, { useState } from 'react';
import { Bot, ChevronLeft, ChevronRight, Loader2, SendHorizonal, Sparkles, Wand2 } from 'lucide-react';

const QUICK_PROMPTS = [
  'Generate a mind map about DevOps',
  'Turn this into a cleaner project plan',
  'Expand the current map with testing strategies',
];

export default function AIAssistantSidebar({
  isOpen,
  messages,
  loading,
  error,
  onToggle,
  onSendPrompt,
}) {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextPrompt = prompt.trim();

    if (!nextPrompt || loading) {
      return;
    }

    setPrompt('');
    await onSendPrompt(nextPrompt);
  };

  if (!isOpen) {
    return (
      <aside className="flex h-full w-16 flex-col items-center justify-between border-l border-white/10 bg-slate-950/75 py-5 backdrop-blur-xl">
        <button
          type="button"
          onClick={onToggle}
          className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-200 transition-colors hover:bg-white/10"
          title="Open AI assistant"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 text-slate-950">
          <Bot className="h-5 w-5" />
        </div>
      </aside>
    );
  }

  return (
    <aside className="flex h-full w-[360px] flex-col border-l border-white/10 bg-slate-950/75 backdrop-blur-xl">
      <div className="border-b border-white/10 px-4 py-4">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-cyan-300/80">AI co-pilot</p>
            <h2 className="mt-1 text-lg font-semibold text-white">Assistant Panel</h2>
            <p className="mt-1 text-sm text-slate-400">
              Ask for a new mind map, expand a branch, or restructure the canvas.
            </p>
          </div>
          <button
            type="button"
            onClick={onToggle}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-200 transition-colors hover:bg-white/10"
            title="Collapse assistant"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-2">
          {QUICK_PROMPTS.map((quickPrompt) => (
            <button
              key={quickPrompt}
              type="button"
              onClick={() => onSendPrompt(quickPrompt)}
              className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-left text-sm text-slate-200 transition-colors hover:bg-white/10"
              disabled={loading}
            >
              <Wand2 className="h-4 w-4 shrink-0 text-cyan-300" />
              <span>{quickPrompt}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 px-5 py-8 text-center text-sm text-slate-400">
            The assistant will keep a running conversation here and can replace the current diagram with generated nodes and edges.
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={[
              'rounded-3xl px-4 py-3 text-sm leading-6',
              message.role === 'user'
                ? 'ml-6 bg-cyan-400/15 text-cyan-50 shadow-[0_0_0_1px_rgba(34,211,238,0.15)]'
                : 'mr-6 border border-white/10 bg-white/5 text-slate-200',
            ].join(' ')}
          >
            <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-slate-400">
              {message.role === 'user' ? (
                <>
                  <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
                  You
                </>
              ) : (
                <>
                  <Bot className="h-3.5 w-3.5 text-cyan-300" />
                  AI Assistant
                </>
              )}
            </div>
            <p className="whitespace-pre-wrap">{message.content}</p>
          </div>
        ))}

        {loading && (
          <div className="mr-6 rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
            <Loader2 className="mr-2 inline h-4 w-4 animate-spin text-cyan-300" />
            Generating diagram update...
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="border-t border-white/10 p-4">
        <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-3">
          <textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="Ask the AI to generate or modify the diagram..."
            rows={4}
            className="w-full resize-none bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
          />
          <div className="mt-3 flex items-center justify-between">
            <p className="text-xs text-slate-500">JSON-backed diagram generation is applied directly to the canvas.</p>
            <button
              type="submit"
              disabled={loading || !prompt.trim()}
              className="inline-flex items-center gap-2 rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition-all disabled:cursor-not-allowed disabled:opacity-50"
            >
              <SendHorizonal className="h-4 w-4" />
              Send
            </button>
          </div>
        </div>
      </form>
    </aside>
  );
}
