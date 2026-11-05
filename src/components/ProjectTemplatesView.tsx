import React, { useState } from 'react';
import { ProjectTemplate } from '../types/voice';
import { PROJECT_TEMPLATES } from '../data/templates';
import { Sparkles, ArrowRight, Play, Check } from 'lucide-react';

interface ProjectTemplatesViewProps {
  onApplyTemplate: (template: ProjectTemplate) => void;
}

const CATEGORIES = [
  'All',
  'Video & YouTube',
  'SaaS & Tech',
  'Gaming & Story',
  'Audiobook & Podcasting',
  'App & UX',
] as const;

export const ProjectTemplatesView: React.FC<ProjectTemplatesViewProps> = ({
  onApplyTemplate,
}) => {
  const [selectedCat, setSelectedCat] = useState<string>('All');

  const filtered = PROJECT_TEMPLATES.filter((t) => {
    if (selectedCat === 'All') return true;
    return t.category === selectedCat;
  });

  return (
    <div className="space-y-4">
      {/* Category Pills */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold tracking-wide uppercase text-slate-400 flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-indigo-400" />
            Project Starter Templates
          </h2>
          <p className="text-xs text-slate-500">
            Pre-tuned voice settings, scripts, and directional cues tailored for specific project use cases.
          </p>
        </div>

        <div className="flex flex-wrap gap-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCat(cat)}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                selectedCat === cat
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {filtered.map((template) => (
          <div
            key={template.id}
            className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/40 p-4 transition hover:border-slate-700 hover:bg-slate-900/60"
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="rounded bg-indigo-500/10 px-2 py-0.5 text-[11px] font-medium text-indigo-400 border border-indigo-500/20">
                  {template.category}
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  Rec. Voice: <strong className="text-white">{template.recommendedVoice}</strong> (~{template.estimatedSeconds}s)
                </span>
              </div>

              <h3 className="mt-2 text-sm font-semibold text-slate-100">
                {template.title}
              </h3>

              <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                {template.description}
              </p>

              {/* Script preview snippet */}
              <div className="mt-3 rounded-lg border border-slate-800/80 bg-slate-950/60 p-2.5 text-xs text-slate-300 font-sans italic leading-relaxed">
                "{template.script}"
              </div>

              <div className="mt-2 text-[11px] text-indigo-300">
                <span className="text-slate-500">Persona: </span>
                {template.stylePrompt}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-end">
              <button
                type="button"
                onClick={() => onApplyTemplate(template)}
                className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 transition active:scale-95"
              >
                <span>Load into Studio</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
