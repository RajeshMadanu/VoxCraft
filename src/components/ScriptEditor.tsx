import React, { useState } from 'react';
import { Sparkles, Wand2, Clock, Type, HelpCircle, RefreshCw, PenTool, Flame, ShieldCheck, HeartHandshake } from 'lucide-react';

interface ScriptEditorProps {
  script: string;
  onChangeScript: (val: string) => void;
  onEnhanceScript: (tone: string) => Promise<void>;
  isEnhancing: boolean;
  onGenerateFromIdea: (topic: string, format: string, duration: number) => Promise<void>;
  isGeneratingIdea: boolean;
}

export const ScriptEditor: React.FC<ScriptEditorProps> = ({
  script,
  onChangeScript,
  onEnhanceScript,
  isEnhancing,
  onGenerateFromIdea,
  isGeneratingIdea,
}) => {
  const [showIdeaModal, setShowIdeaModal] = useState(false);
  const [ideaTopic, setIdeaTopic] = useState('');
  const [ideaFormat, setIdeaFormat] = useState('YouTube Voiceover');
  const [ideaDuration, setIdeaDuration] = useState(30);

  // Stats calculation
  const words = script.trim() ? script.trim().split(/\s+/).length : 0;
  const chars = script.length;
  // Average speaking pace ~ 140 words per minute
  const estimatedSeconds = Math.max(1, Math.round((words / 140) * 60));

  // Quick insertion at cursor or at end
  const insertTag = (tag: string) => {
    const textarea = document.getElementById('voice-script-input') as HTMLTextAreaElement | null;
    if (!textarea) {
      onChangeScript(script + ' ' + tag);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = script.substring(0, start);
    const after = script.substring(end);
    const updated = before + (before.endsWith(' ') || before === '' ? '' : ' ') + tag + (after.startsWith(' ') || after === '' ? '' : ' ') + after;
    onChangeScript(updated);

    setTimeout(() => {
      textarea.focus();
      const nextPos = start + tag.length + 1;
      textarea.setSelectionRange(nextPos, nextPos);
    }, 50);
  };

  const handleIdeaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ideaTopic.trim()) return;
    await onGenerateFromIdea(ideaTopic, ideaFormat, ideaDuration);
    setShowIdeaModal(false);
  };

  return (
    <div className="space-y-3">
      {/* Header and Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold tracking-wide uppercase text-slate-400">
            2. Voice Script & Direction
          </h2>
          <p className="text-xs text-slate-500">
            Compose or paste your script. Add natural breath marks and emotional bursts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* AI Scriptwriter Button */}
          <button
            type="button"
            onClick={() => setShowIdeaModal(true)}
            className="flex items-center gap-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-1 text-xs font-medium text-indigo-300 hover:bg-indigo-500/20 hover:border-indigo-500/50 transition"
          >
            <PenTool className="h-3.5 w-3.5 text-indigo-400" />
            <span>AI Draft from Idea</span>
          </button>

          {/* Quick Polish / Enhance Button */}
          <div className="relative group">
            <button
              type="button"
              disabled={isEnhancing || !script.trim()}
              onClick={() => onEnhanceScript('Natural & Spoken Cadence')}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600/20 border border-indigo-500/40 px-3 py-1 text-xs font-medium text-indigo-200 hover:bg-indigo-600/30 transition disabled:opacity-50"
            >
              {isEnhancing ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-indigo-400" />
              ) : (
                <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
              )}
              <span>Polish for Speech</span>
            </button>
          </div>
        </div>
      </div>

      {/* Script Text Area */}
      <div className="relative rounded-xl border border-slate-800 bg-slate-950/70 p-3 transition focus-within:border-indigo-500/80 focus-within:ring-1 focus-within:ring-indigo-500/80">
        <textarea
          id="voice-script-input"
          rows={6}
          value={script}
          onChange={(e) => onChangeScript(e.target.value)}
          placeholder="Enter the voice script here... For instance: 'Welcome everyone! <breath> In today’s update, we are thrilled to reveal our brand new real-time voice pipeline. <laugh> It is faster than ever!'"
          className="w-full resize-y bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none font-sans leading-relaxed"
        />

        {/* Vocal FX & Speech Cue Insert Toolbar */}
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/80 pt-2.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-medium text-slate-500 mr-1 flex items-center gap-1">
              Insert Vocal Cues:
            </span>
            {[
              { tag: '<breath>', label: 'Natural Breath', desc: 'Adds human breath intake' },
              { tag: '<laugh>', label: 'Laughter', desc: 'Adds natural vocal laugh burst' },
              { tag: '<gasp>', label: 'Gasp', desc: 'Adds sudden breath gasp' },
              { tag: '|yeah|', label: '|yeah|', desc: 'Natural agreement backchannel' },
              { tag: '|mhm|', label: '|mhm|', desc: 'Affirmative hum' },
              { tag: '...', label: 'Pause (...)', desc: 'Thoughtful pause' },
            ].map(({ tag, label, desc }) => (
              <button
                key={tag}
                type="button"
                onClick={() => insertTag(tag)}
                title={desc}
                className="rounded-md border border-slate-800 bg-slate-900/90 px-2 py-0.5 text-[11px] font-mono text-cyan-300 hover:border-cyan-500/50 hover:bg-slate-800 transition"
              >
                {label}
              </button>
            ))}
          </div>

          {/* Word count & Estimated Duration */}
          <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
            <span className="flex items-center gap-1">
              <Type className="h-3 w-3 text-slate-500" />
              {words} words
            </span>
            <span className="flex items-center gap-1 text-indigo-300">
              <Clock className="h-3 w-3" />
              ~{estimatedSeconds}s audio
            </span>
          </div>
        </div>
      </div>

      {/* Tone Preset Polish Strip */}
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        <span className="text-[11px] text-slate-500">Rewrite tone:</span>
        {[
          { name: 'Snappy & Viral', icon: Flame },
          { name: 'Corporate & Trustworthy', icon: ShieldCheck },
          { name: 'Warm & Conversational', icon: HeartHandshake },
          { name: 'Cinematic Drama', icon: Sparkles },
        ].map(({ name, icon: Icon }) => (
          <button
            key={name}
            type="button"
            disabled={isEnhancing || !script.trim()}
            onClick={() => onEnhanceScript(name)}
            className="flex items-center gap-1 rounded-md border border-slate-800 bg-slate-900/70 px-2 py-1 text-[11px] text-slate-400 hover:border-indigo-500/40 hover:text-slate-200 transition disabled:opacity-40"
          >
            <Icon className="h-3 w-3 text-indigo-400" />
            <span>{name}</span>
          </button>
        ))}
      </div>

      {/* AI Draft from Idea Modal */}
      {showIdeaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600/30 text-indigo-400">
                  <Wand2 className="h-4 w-4" />
                </div>
                <h3 className="font-semibold text-slate-100 text-sm">
                  AI Voice Script Generator
                </h3>
              </div>
              <button
                onClick={() => setShowIdeaModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleIdeaSubmit} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  What is your project or topic?
                </label>
                <textarea
                  required
                  rows={3}
                  value={ideaTopic}
                  onChange={(e) => setIdeaTopic(e.target.value)}
                  placeholder="e.g. Announcing a high-speed vector search engine for React developers with zero cold starts..."
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Format</label>
                  <select
                    value={ideaFormat}
                    onChange={(e) => setIdeaFormat(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-slate-100 focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="YouTube Video Voiceover">YouTube Video Hook</option>
                    <option value="SaaS Feature Explainer">SaaS Feature Explainer</option>
                    <option value="Commercial 15s Ad">Commercial 15s Ad</option>
                    <option value="Indie Game Cutscene Dialogue">Game Character Monologue</option>
                    <option value="Podcast Cold Open">Podcast Cold Open</option>
                    <option value="Mobile App Onboarding Prompt">App Audio Guide</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">Target Duration</label>
                  <select
                    value={ideaDuration}
                    onChange={(e) => setIdeaDuration(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-slate-100 focus:border-indigo-500 focus:outline-none"
                  >
                    <option value={10}>~10 seconds (Punchy)</option>
                    <option value={20}>~20 seconds (Promo)</option>
                    <option value={30}>~30 seconds (Standard)</option>
                    <option value={60}>~60 seconds (Full overview)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowIdeaModal(false)}
                  className="rounded-lg border border-slate-700 px-3 py-1.5 text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGeneratingIdea || !ideaTopic.trim()}
                  className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-1.5 font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
                >
                  {isGeneratingIdea ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Writing Script...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Generate Script</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
