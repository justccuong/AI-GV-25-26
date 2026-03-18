import React, { useState } from 'react';
import { Bot, ChevronLeft, ChevronRight, Loader2, SendHorizonal, Sparkles, Wand2 } from 'lucide-react';
import { getTheme } from '../utils/themeConfig';

const QUICK_PROMPTS = [
  'Tạo mindmap về DevOps',
  'Xóa node được thêm cuối cùng',
  'Đọc sơ đồ hiện tại và sắp xếp lại cho gọn',
  'Mở rộng sơ đồ hiện tại với chiến lược kiểm thử',
];

export default function AIAssistantSidebar({
  isOpen,
  messages,
  loading,
  error,
  themeId,
  onToggle,
  onSendPrompt,
}) {
  const [prompt, setPrompt] = useState('');
  const shellTheme = getTheme(themeId).shell || {};

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
      <aside
        className="flex h-full w-16 flex-col items-center justify-between border-l py-5 backdrop-blur-xl"
        style={{
          borderColor: shellTheme.panelBorder,
          background: shellTheme.panelBg,
        }}
      >
        <button
          type="button"
          onClick={onToggle}
          className="flex h-11 w-11 items-center justify-center rounded-2xl border transition-colors hover:brightness-105"
          title="Mở trợ lý AI"
          style={{
            borderColor: shellTheme.panelBorder,
            background: shellTheme.accentSoft,
            color: shellTheme.panelText,
          }}
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
    <aside
      className="flex h-full w-[360px] flex-col border-l backdrop-blur-xl"
      style={{
        borderColor: shellTheme.panelBorder,
        background: shellTheme.panelBg,
      }}
    >
      <div className="border-b px-4 py-4" style={{ borderColor: shellTheme.panelBorder }}>
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.24em]" style={{ color: shellTheme.accent }}>
              Đồng hành cùng AI
            </p>
            <h2 className="mt-1 text-lg font-semibold" style={{ color: shellTheme.panelText }}>
              Trợ lý sơ đồ
            </h2>
            <p className="mt-1 text-sm" style={{ color: shellTheme.panelMuted }}>
              Hãy yêu cầu AI đọc mindmap hiện tại, thêm nhánh mới hoặc tái cấu trúc toàn bộ canvas theo ngữ cảnh đang có.
            </p>
          </div>
          <button
            type="button"
            onClick={onToggle}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border transition-colors hover:brightness-105"
            title="Thu gọn trợ lý"
            style={{
              borderColor: shellTheme.panelBorder,
              background: shellTheme.accentSoft,
              color: shellTheme.panelText,
            }}
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
              className="flex items-center gap-3 rounded-2xl border px-3 py-3 text-left text-sm transition-colors hover:brightness-105"
              disabled={loading}
              style={{
                borderColor: shellTheme.panelBorder,
                background: shellTheme.panelStrongBg,
                color: shellTheme.panelText,
              }}
            >
              <Wand2 className="h-4 w-4 shrink-0" style={{ color: shellTheme.accent }} />
              <span>{quickPrompt}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <div
            className="rounded-3xl border border-dashed px-5 py-8 text-center text-sm"
            style={{
              borderColor: shellTheme.panelBorder,
              background: shellTheme.panelStrongBg,
              color: shellTheme.panelMuted,
            }}
          >
            Tại đây trợ lý sẽ giữ lịch sử trao đổi và dùng chính dữ liệu nodes/edges hiện tại để cập nhật mindmap theo từng yêu cầu.
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={[
              'rounded-3xl px-4 py-3 text-sm leading-6',
              message.role === 'user' ? 'ml-6' : 'mr-6 border',
            ].join(' ')}
            style={
              message.role === 'user'
                ? {
                    background: shellTheme.accentSoft,
                    color: shellTheme.panelText,
                    boxShadow: `0 0 0 1px ${shellTheme.panelBorder}`,
                  }
                : {
                    borderColor: shellTheme.panelBorder,
                    background: shellTheme.panelStrongBg,
                    color: shellTheme.panelText,
                  }
            }
          >
            <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.18em]" style={{ color: shellTheme.panelMuted }}>
              {message.role === 'user' ? (
                <>
                  <Sparkles className="h-3.5 w-3.5" style={{ color: shellTheme.accent }} />
                  Bạn
                </>
              ) : (
                <>
                  <Bot className="h-3.5 w-3.5" style={{ color: shellTheme.accent }} />
                  Trợ lý AI
                </>
              )}
            </div>
            <p className="whitespace-pre-wrap">{message.content}</p>
          </div>
        ))}

        {loading && (
          <div
            className="mr-6 rounded-3xl border px-4 py-3 text-sm"
            style={{
              borderColor: shellTheme.panelBorder,
              background: shellTheme.panelStrongBg,
              color: shellTheme.panelText,
            }}
          >
            <Loader2 className="mr-2 inline h-4 w-4 animate-spin" style={{ color: shellTheme.accent }} />
            AI đang phân tích sơ đồ và chuẩn bị cập nhật canvas...
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="border-t p-4" style={{ borderColor: shellTheme.panelBorder }}>
        <div
          className="rounded-[1.75rem] border p-3"
          style={{
            borderColor: shellTheme.panelBorder,
            background: shellTheme.panelStrongBg,
          }}
        >
          <textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="Ví dụ: đọc sơ đồ hiện tại và thêm nhánh về CI/CD vào mục DevOps"
            rows={4}
            className="w-full resize-none bg-transparent text-sm outline-none placeholder:opacity-60"
            style={{ color: shellTheme.panelText }}
          />
          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-xs" style={{ color: shellTheme.panelMuted }}>
              Frontend sẽ gửi trạng thái canvas hiện tại để AI trả về cập nhật có cấu trúc.
            </p>
            <button
              type="submit"
              disabled={loading || !prompt.trim()}
              className="inline-flex items-center gap-2 rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition-all disabled:cursor-not-allowed disabled:opacity-50"
            >
              <SendHorizonal className="h-4 w-4" />
              Gửi
            </button>
          </div>
        </div>
      </form>
    </aside>
  );
}
