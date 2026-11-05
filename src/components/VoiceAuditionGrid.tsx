import React, { useState } from 'react';
import { VoiceItem } from '../types/voice';
import { Play, Volume2, Sparkles, Check, RefreshCw } from 'lucide-react';

interface VoiceAuditionGridProps {
  voices: VoiceItem[];
  selectedVoice: string;
  onSelectAndUse: (voiceId: string) => void;
  onGenerateVoiceClip: (voiceId: string, testText: string) => Promise<string | null>;
}

export const VoiceAuditionGrid: React.FC<VoiceAuditionGridProps> = ({
  voices,
  selectedVoice,
  onSelectAndUse,
  onGenerateVoiceClip,
}) => {
  const [testPhrase, setTestPhrase] = useState(
    'Welcome to the future of voice. Everything you hear is synthesized in real time.'
  );
  const [loadingVoiceId, setLoadingVoiceId] = useState<string | null>(null);
  const [audioCache, setAudioCache] = useState<Record<string, string>>({});
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const audioPlayerRef = React.useRef<HTMLAudioElement | null>(null);

  const handlePlayVoice = async (voiceId: string) => {
    // If already playing this voice, toggle pause
    if (playingVoiceId === voiceId && audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      setPlayingVoiceId(null);
      return;
    }

    let base64 = audioCache[voiceId];
    if (!base64) {
      setLoadingVoiceId(voiceId);
      try {
        const audio = await onGenerateVoiceClip(voiceId, testPhrase);
        if (audio) {
          base64 = audio;
          setAudioCache((prev) => ({ ...prev, [voiceId]: audio }));
        }
      } finally {
        setLoadingVoiceId(null);
      }
    }

    if (base64) {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
      const audioObj = new Audio(`data:audio/wav;base64,${base64}`);
      audioPlayerRef.current = audioObj;
      setPlayingVoiceId(voiceId);
      audioObj.onended = () => setPlayingVoiceId(null);
      audioObj.onerror = () => setPlayingVoiceId(null);
      audioObj.play().catch(() => setPlayingVoiceId(null));
    }
  };

  const clearCacheForNewPhrase = () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
    }
    setPlayingVoiceId(null);
    setAudioCache({});
  };

  return (
    <div className="space-y-4">
      {/* Header and Test phrase bar */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            Audition Sentence Across All Voices
          </label>
          <span className="text-[11px] text-slate-500">
            Compare all 6 Gemini voices reading the exact same line
          </span>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={testPhrase}
            onChange={(e) => {
              setTestPhrase(e.target.value);
              clearCacheForNewPhrase();
            }}
            placeholder="Type any line you want to compare..."
            className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={clearCacheForNewPhrase}
            title="Reset cached clips"
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 transition"
          >
            Reset Takes
          </button>
        </div>

        {/* Quick sample chips */}
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-slate-500">Try phrases:</span>
          {[
            'Welcome to our app! Your project is ready to launch.',
            'Warning: critical pressure detected in reactor core.',
            'Take a deep breath and let go of tension.',
            'Hey guys, do NOT miss out on this week’s giveaway!',
          ].map((sample) => (
            <button
              key={sample}
              onClick={() => {
                setTestPhrase(sample);
                clearCacheForNewPhrase();
              }}
              className="rounded-md border border-slate-800 bg-slate-900 px-2 py-0.5 text-[11px] text-slate-400 hover:text-slate-200 transition"
            >
              "{sample.slice(0, 32)}..."
            </button>
          ))}
        </div>
      </div>

      {/* Voice Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {voices.map((voice) => {
          const isSelected = selectedVoice === voice.id;
          const isPlaying = playingVoiceId === voice.id;
          const isLoading = loadingVoiceId === voice.id;
          const isReady = !!audioCache[voice.id];

          return (
            <div
              key={voice.id}
              className={`rounded-xl border p-4 transition-all flex flex-col justify-between ${
                isSelected
                  ? 'border-indigo-500 bg-indigo-950/20 ring-1 ring-indigo-500/40'
                  : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800 font-mono font-bold text-white text-sm">
                      {voice.name[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-semibold text-slate-100 text-sm">{voice.name}</h4>
                        <span className="rounded bg-slate-800 px-1.5 py-0.2 text-[10px] text-slate-400">
                          {voice.gender}
                        </span>
                      </div>
                      <p className="text-[11px] text-indigo-400 font-medium">{voice.vibe}</p>
                    </div>
                  </div>

                  {isSelected && (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-indigo-400">
                      <Check className="h-3 w-3" /> Active
                    </span>
                  )}
                </div>

                <p className="mt-2.5 text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {voice.description}
                </p>

                <div className="mt-2 flex flex-wrap gap-1">
                  {voice.tags.map((t) => (
                    <span key={t} className="rounded bg-slate-800/80 px-1.5 py-0.5 text-[10px] text-slate-400">
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-800/80 pt-3">
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handlePlayVoice(voice.id)}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition ${
                    isPlaying
                      ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                      : 'border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Synthesizing...</span>
                    </>
                  ) : isPlaying ? (
                    <>
                      <Volume2 className="h-3.5 w-3.5 animate-pulse" />
                      <span>Pause Audition</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-3.5 w-3.5 fill-current" />
                      <span>{isReady ? 'Replay Voice' : 'Audition Line'}</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => onSelectAndUse(voice.id)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    isSelected
                      ? 'bg-indigo-600 text-white'
                      : 'border border-indigo-500/40 text-indigo-300 hover:bg-indigo-600/20'
                  }`}
                >
                  {isSelected ? 'Selected' : 'Use Voice'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
