import React, { useState } from 'react';
import { VoiceItem } from '../types/voice';
import { Play, Volume2, Sparkles, Check, Wand2 } from 'lucide-react';

interface VoiceSelectorProps {
  voices: VoiceItem[];
  selectedVoice: string;
  onSelectVoice: (voiceId: string) => void;
  stylePrompt: string;
  onChangeStylePrompt: (style: string) => void;
  onAuditionVoice: (voiceId: string) => void;
  auditioningVoiceId: string | null;
}

const STYLE_PRESETS = [
  'Professional, articulate & clear narrator',
  'Energetic, charismatic tech YouTuber',
  'Deep, dramatic movie trailer tone',
  'Warm, friendly conversational podcast host',
  'Soft, soothing mindfulness meditation guide',
  'Urgent, authoritative news anchor',
  'Playful, expressive fantasy story narrator',
];

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({
  voices,
  selectedVoice,
  onSelectVoice,
  stylePrompt,
  onChangeStylePrompt,
  onAuditionVoice,
  auditioningVoiceId,
}) => {
  const [filter, setFilter] = useState<'All' | 'Female' | 'Male'>('All');

  const filteredVoices = voices.filter((v) => {
    if (filter === 'All') return true;
    return v.gender === filter;
  });

  return (
    <div className="space-y-4">
      {/* Header and Filter */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold tracking-wide uppercase text-slate-400">
            1. Select AI Voice Persona
          </h2>
          <p className="text-xs text-slate-500">
            Choose a voice timbre and accent profile tuned for your project type.
          </p>
        </div>

        {/* Gender Filter Buttons */}
        <div className="flex rounded-lg border border-slate-800 bg-slate-900/80 p-0.5">
          {(['All', 'Female', 'Male'] as const).map((opt) => (
            <button
              key={opt}
              onClick={() => setFilter(opt)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                filter === opt
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* Voice Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredVoices.map((voice) => {
          const isSelected = selectedVoice === voice.id;
          const isAuditioning = auditioningVoiceId === voice.id;

          return (
            <div
              key={voice.id}
              onClick={() => onSelectVoice(voice.id)}
              className={`group relative flex flex-col justify-between rounded-xl border p-3.5 transition-all cursor-pointer ${
                isSelected
                  ? 'border-indigo-500 bg-indigo-950/30 ring-1 ring-indigo-500/50 shadow-lg shadow-indigo-950/50'
                  : 'border-slate-800/80 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-900/80'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold font-mono ${
                        isSelected
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-800 text-slate-300 group-hover:bg-slate-700'
                      }`}
                    >
                      {voice.name[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-100 text-sm">
                          {voice.name}
                        </span>
                        <span className="rounded bg-slate-800/80 px-1.5 py-0.2 text-[10px] text-slate-400">
                          {voice.gender}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Audition Play Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAuditionVoice(voice.id);
                    }}
                    title={`Audition ${voice.name}'s voice`}
                    className={`flex h-7 items-center gap-1 rounded-md px-2 text-xs font-medium transition ${
                      isAuditioning
                        ? 'bg-cyan-500 text-slate-950 font-bold animate-pulse'
                        : 'border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    {isAuditioning ? (
                      <>
                        <Volume2 className="h-3 w-3 animate-bounce" />
                        <span>Playing</span>
                      </>
                    ) : (
                      <>
                        <Play className="h-3 w-3 fill-current" />
                        <span>Audition</span>
                      </>
                    )}
                  </button>
                </div>

                <p className="mt-2 text-xs text-indigo-300/90 font-medium">
                  {voice.vibe}
                </p>
                <p className="mt-1 line-clamp-2 text-xs text-slate-400">
                  {voice.description}
                </p>
              </div>

              {/* Tags */}
              <div className="mt-3 flex flex-wrap gap-1">
                {voice.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md bg-slate-800/60 px-1.5 py-0.5 text-[10px] text-slate-400"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {isSelected && (
                <div className="absolute top-2 right-2">
                  <div className="flex h-4 w-4 items-center justify-center rounded-full bg-indigo-500 text-white">
                    <Check className="h-2.5 w-2.5" />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Style Persona & Direction Directive */}
      <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-4">
        <div className="flex items-center justify-between mb-2">
          <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-300">
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            Voice Acting & Style Directive (speechMetadata)
          </label>
          <span className="text-[11px] text-slate-500">Optional emotional tuning</span>
        </div>

        <div className="relative">
          <input
            type="text"
            value={stylePrompt}
            onChange={(e) => onChangeStylePrompt(e.target.value)}
            placeholder="e.g. 'Energetic documentary host with breathless excitement' or 'Whispering cinematic narrator'"
            className="w-full rounded-lg border border-slate-700/80 bg-slate-950/80 px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          {stylePrompt && (
            <button
              onClick={() => onChangeStylePrompt('')}
              className="absolute right-2.5 top-2 text-xs text-slate-500 hover:text-slate-300"
            >
              Clear
            </button>
          )}
        </div>

        {/* Quick Style Directives Chips */}
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-slate-500 flex items-center gap-1 mr-1">
            <Wand2 className="h-3 w-3" /> Quick suggestions:
          </span>
          {STYLE_PRESETS.map((preset) => (
            <button
              key={preset}
              onClick={() => onChangeStylePrompt(preset)}
              className="rounded-md border border-slate-800 bg-slate-900/80 px-2 py-0.5 text-[11px] text-slate-400 hover:border-slate-700 hover:text-slate-200 transition"
            >
              {preset.split('&')[0]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
