import React from 'react';
import { Bot, LayoutTemplate, ShieldCheck, Sparkles } from 'lucide-react';

const cards = [
  {
    icon: LayoutTemplate,
    title: 'Workspace presets',
    description: 'The editor now supports structured layout control, saved canvases, and a faster blank-diagram reset flow.',
  },
  {
    icon: Bot,
    title: 'AI assistant mode',
    description: 'Use the assistant sidebar to generate a fresh mind map or reshape the current graph from natural language prompts.',
  },
  {
    icon: ShieldCheck,
    title: 'Session & persistence',
    description: 'Mind maps are saved per user account through secured FastAPI endpoints using your current access token.',
  },
];

export default function Settings() {
  return (
    <div className="h-full overflow-y-auto bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.1),_transparent_38%),linear-gradient(180deg,_#020617,_#0f172a_50%,_#020617)] px-6 py-8 text-slate-100">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-1 text-xs uppercase tracking-[0.24em] text-cyan-200">
            <Sparkles className="h-3.5 w-3.5" />
            Workspace settings
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-white">Editor Configuration</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
            This view is a polished landing point for workspace controls. It gives your navigation a complete structure while the main editor remains focused on diagram creation, saved history, and AI-assisted generation.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {cards.map(({ icon: Icon, title, description }) => (
            <section
              key={title}
              className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur-xl"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/15 text-cyan-200">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-semibold text-white">{title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">{description}</p>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
