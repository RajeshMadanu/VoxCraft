import React, { useState } from 'react';
import { VoiceItem, DialogueLine } from '../types/voice';
import { Plus, Trash2, Users, Sparkles, MessageSquare, ArrowDown, Bot } from 'lucide-react';

interface DualSpeakerStudioProps {
  voices: VoiceItem[];
  dialogue: DialogueLine[];
  onChangeDialogue: (lines: DialogueLine[]) => void;
  speaker1: { name: string; voice: string };
  speaker2: { name: string; voice: string };
  onChangeSpeakers: (sp1: { name: string; voice: string }, sp2: { name: string; voice: string }) => void;
}

const SAMPLE_DIALOGUES = [
  {
    name: 'Tech Podcast Co-hosts',
    sp1: { name: 'Alex', voice: 'Puck' },
    sp2: { name: 'Sam', voice: 'Kore' },
    lines: [
      {
        speaker: 'Alex',
        voiceName: 'Puck',
        text: 'Welcome back everyone! <breath> Today we are testing a completely new kind of AI voice synthesis.',
        style: 'Enthusiastic podcast host',
      },
      {
        speaker: 'Sam',
        voiceName: 'Kore',
        text: "That's right, |yeah| and what makes this special is how natural the turn-taking feels.",
        style: 'Articulate, engaged co-host',
      },
      {
        speaker: 'Alex',
        voiceName: 'Puck',
        text: 'Exactly! No awkward robot pauses. Just seamless dialogue for any project.',
        style: 'Energetic and excited',
      },
    ],
  },
  {
    name: 'Game NPC & Adventurer',
    sp1: { name: 'Guardian', voice: 'Charon' },
    sp2: { name: 'Hero', voice: 'Fenrir' },
    lines: [
      {
        speaker: 'Guardian',
        voiceName: 'Charon',
        text: 'Halt, mortal. None may pass the gate of obsidian without offering the key.',
        style: 'Deep, threatening ancient guardian',
      },
      {
        speaker: 'Hero',
        voiceName: 'Fenrir',
        text: 'I bring the seal of the sun kingdom. <breath> Step aside, guardian.',
        style: 'Determined young adventurer',
      },
      {
        speaker: 'Guardian',
        voiceName: 'Charon',
        text: 'Then enter... |mhm| if your courage does not fail you.',
        style: 'Reluctant, solemn acknowledgment',
      },
    ],
  },
];

export const DualSpeakerStudio: React.FC<DualSpeakerStudioProps> = ({
  voices,
  dialogue,
  onChangeDialogue,
  speaker1,
  speaker2,
  onChangeSpeakers,
}) => {
  const addLine = (speakerName: string) => {
    const isSp1 = speakerName === speaker1.name;
    const newLine: DialogueLine = {
      id: Math.random().toString(36).substring(2, 9),
      speaker: speakerName,
      voiceName: isSp1 ? speaker1.voice : speaker2.voice,
      text: '',
      style: isSp1 ? 'Natural conversational' : 'Engaged response',
    };
    onChangeDialogue([...dialogue, newLine]);
  };

  const updateLine = (id: string, updates: Partial<DialogueLine>) => {
    onChangeDialogue(
      dialogue.map((line) => (line.id === id ? { ...line, ...updates } : line))
    );
  };

  const removeLine = (id: string) => {
    onChangeDialogue(dialogue.filter((l) => l.id !== id));
  };

  const loadSample = (sample: typeof SAMPLE_DIALOGUES[0]) => {
    onChangeSpeakers(sample.sp1, sample.sp2);
    onChangeDialogue(
      sample.lines.map((l) => ({
        ...l,
        id: Math.random().toString(36).substring(2, 9),
      }))
    );
  };

  return (
    <div className="space-y-4">
      {/* Header and Quick Samples */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold tracking-wide uppercase text-slate-400 flex items-center gap-1.5">
            <Users className="h-4 w-4 text-indigo-400" />
            Dual-Speaker Screenplay & Dialogue
          </h2>
          <p className="text-xs text-slate-500">
            Powered by Gemini 3.8 Flash TTS. Co-host podcasts, dramatic dialogues, or NPC conversations.
          </p>
        </div>

        {/* Load Preset Dialogue */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-slate-500">Presets:</span>
          {SAMPLE_DIALOGUES.map((sample) => (
            <button
              key={sample.name}
              type="button"
              onClick={() => loadSample(sample)}
              className="rounded-md border border-slate-800 bg-slate-900/80 px-2 py-0.5 text-[11px] text-slate-400 hover:border-slate-700 hover:text-white transition"
            >
              {sample.name}
            </button>
          ))}
        </div>
      </div>

      {/* Speaker Configuration Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-3.5">
        {/* Speaker 1 */}
        <div className="rounded-lg border border-indigo-900/40 bg-indigo-950/20 p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-indigo-400" />
              Speaker 1
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">Name</label>
              <input
                type="text"
                value={speaker1.name}
                onChange={(e) =>
                  onChangeSpeakers({ ...speaker1, name: e.target.value }, speaker2)
                }
                className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 text-slate-100"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">Voice Timbre</label>
              <select
                value={speaker1.voice}
                onChange={(e) =>
                  onChangeSpeakers({ ...speaker1, voice: e.target.value }, speaker2)
                }
                className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 text-slate-100"
              >
                {voices.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.gender})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Speaker 2 */}
        <div className="rounded-lg border border-cyan-900/40 bg-cyan-950/20 p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-cyan-300 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-cyan-400" />
              Speaker 2
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">Name</label>
              <input
                type="text"
                value={speaker2.name}
                onChange={(e) =>
                  onChangeSpeakers(speaker1, { ...speaker2, name: e.target.value })
                }
                className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 text-slate-100"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">Voice Timbre</label>
              <select
                value={speaker2.voice}
                onChange={(e) =>
                  onChangeSpeakers(speaker1, { ...speaker2, voice: e.target.value })
                }
                className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 text-slate-100"
              >
                {voices.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.gender})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Dialogue Script Turns */}
      <div className="space-y-2.5">
        {dialogue.map((line, idx) => {
          const isSp1 = line.speaker === speaker1.name;
          return (
            <div
              key={line.id}
              className={`rounded-xl border p-3 transition ${
                isSp1
                  ? 'border-indigo-900/50 bg-slate-950/80 pl-4 border-l-4 border-l-indigo-500'
                  : 'border-cyan-900/50 bg-slate-950/80 pl-4 border-l-4 border-l-cyan-500'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5 text-xs">
                <div className="flex items-center gap-2">
                  <select
                    value={line.speaker}
                    onChange={(e) => {
                      const newSpeaker = e.target.value;
                      const newVoice = newSpeaker === speaker1.name ? speaker1.voice : speaker2.voice;
                      updateLine(line.id, { speaker: newSpeaker, voiceName: newVoice });
                    }}
                    className="font-semibold bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-white"
                  >
                    <option value={speaker1.name}>{speaker1.name} ({speaker1.voice})</option>
                    <option value={speaker2.name}>{speaker2.name} ({speaker2.voice})</option>
                  </select>
                  <span className="text-[11px] text-slate-500 font-mono">Turn #{idx + 1}</span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={line.style || ''}
                    placeholder="Style, e.g. 'Curious, laughing'"
                    onChange={(e) => updateLine(line.id, { style: e.target.value })}
                    className="rounded border border-slate-800 bg-slate-900/80 px-2 py-0.5 text-[11px] text-slate-300 placeholder-slate-600 focus:outline-none w-36 sm:w-48"
                  />
                  {dialogue.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLine(line.id)}
                      className="text-slate-500 hover:text-red-400 p-1 transition"
                      title="Delete turn"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <textarea
                rows={2}
                value={line.text}
                onChange={(e) => updateLine(line.id, { text: e.target.value })}
                placeholder={`What does ${line.speaker} say? Support backchannels like |yeah|, |mhm|, <breath>, <laugh>`}
                className="w-full resize-none rounded-lg bg-transparent text-sm text-slate-200 placeholder-slate-600 focus:outline-none"
              />
            </div>
          );
        })}
      </div>

      {/* Add Turn Buttons */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <button
          type="button"
          onClick={() => addLine(speaker1.name)}
          className="flex items-center gap-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 text-xs font-medium text-indigo-300 hover:bg-indigo-500/20 transition"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add Turn: {speaker1.name}</span>
        </button>

        <button
          type="button"
          onClick={() => addLine(speaker2.name)}
          className="flex items-center gap-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-medium text-cyan-300 hover:bg-cyan-500/20 transition"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add Turn: {speaker2.name}</span>
        </button>
      </div>
    </div>
  );
};
