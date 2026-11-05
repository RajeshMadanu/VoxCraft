import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, Download, Code2, Volume2, VolumeX, Sliders, Sparkles } from 'lucide-react';

interface AudioPlayerProps {
  audioBase64: string;
  title: string;
  voiceName?: string;
  stylePrompt?: string;
  onOpenExportModal: () => void;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  audioBase64,
  title,
  voiceName = 'Kore',
  stylePrompt,
  onOpenExportModal,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [volume, setVolume] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const [showPitchControls, setShowPitchControls] = useState(false);
  const [pitchShift, setPitchShift] = useState(0); // in semitones: -6 to +6
  const [waveformPeaks, setWaveformPeaks] = useState<number[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Setup audio URL from base64
  const audioSrc = React.useMemo(() => {
    if (!audioBase64) return '';
    return `data:audio/wav;base64,${audioBase64}`;
  }, [audioBase64]);

  // Decode audio peaks for realistic waveform display
  useEffect(() => {
    if (!audioBase64) return;
    let isMounted = true;

    async function extractPeaks() {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        audioContextRef.current = ctx;

        // Base64 to ArrayBuffer
        const binaryString = window.atob(audioBase64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        const buffer = await ctx.decodeAudioData(bytes.buffer);
        if (!isMounted) return;

        const rawData = buffer.getChannelData(0);
        const samples = 80; // number of bars
        const blockSize = Math.floor(rawData.length / samples);
        const peaks: number[] = [];

        for (let i = 0; i < samples; i++) {
          const start = i * blockSize;
          let sum = 0;
          for (let j = 0; j < blockSize; j++) {
            sum += Math.abs(rawData[start + j] || 0);
          }
          const avg = sum / blockSize;
          peaks.push(avg);
        }

        // Normalize
        const max = Math.max(...peaks, 0.001);
        const normalized = peaks.map((p) => Math.max(0.12, Math.min(1.0, p / max)));
        setWaveformPeaks(normalized);
      } catch (err) {
        console.warn('Could not decode audio peaks for visualizer, using fallback:', err);
        // Fallback procedural waveform
        const fallback = Array.from({ length: 80 }, (_, i) => {
          const sine = Math.sin(i * 0.25) * 0.4 + 0.5;
          return Math.max(0.15, Math.min(0.9, sine + (Math.random() * 0.2 - 0.1)));
        });
        setWaveformPeaks(fallback);
      }
    }

    extractPeaks();

    return () => {
      isMounted = false;
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, [audioBase64]);

  // Audio element listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => {
      setDuration(audio.duration || 0);
      setCurrentTime(0);
      setIsPlaying(false);
    };
    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
    };
  }, [audioSrc]);

  // Playback rate sync
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  // Volume sync
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch((err) => console.error('Playback error:', err));
    }
  };

  const handleRestart = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(() => {});
  };

  const handleSeek = (index: number, totalBars: number) => {
    if (!audioRef.current || duration <= 0) return;
    const ratio = index / totalBars;
    audioRef.current.currentTime = ratio * duration;
  };

  const handleDownload = () => {
    if (!audioBase64) return;
    const link = document.createElement('a');
    link.href = audioSrc;
    const cleanTitle = (title || voiceName || 'ai-voice')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    link.download = `${cleanTitle}-voice.wav`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progressRatio = duration > 0 ? currentTime / duration : 0;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/90 to-slate-950/90 p-5 shadow-2xl backdrop-blur-md">
      <audio ref={audioRef} src={audioSrc} preload="auto" />

      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-indigo-500/15 px-2 py-0.5 text-xs font-medium text-indigo-400 border border-indigo-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
              Studio WAV 24kHz
            </span>
            <span className="rounded-md bg-slate-800/80 px-2 py-0.5 text-xs text-slate-300 font-mono">
              Voice: {voiceName}
            </span>
          </div>
          <h3 className="mt-1.5 truncate text-sm font-semibold text-white tracking-tight">
            {title || 'Generated AI Voiceover'}
          </h3>
          {stylePrompt && (
            <p className="mt-0.5 truncate text-xs text-slate-400 italic">
              Style: "{stylePrompt}"
            </p>
          )}
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPitchControls(!showPitchControls)}
            title="Audio Tuning & Pitch"
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${
              showPitchControls
                ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300'
                : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700 hover:text-slate-200'
            }`}
          >
            <Sliders className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Tune</span>
          </button>

          <button
            onClick={onOpenExportModal}
            title="Export Code for your Project"
            className="flex items-center gap-1.5 rounded-lg border border-indigo-500/30 bg-indigo-600/20 px-3 py-1.5 text-xs font-medium text-indigo-300 transition hover:bg-indigo-600/30 hover:border-indigo-500/50"
          >
            <Code2 className="h-3.5 w-3.5" />
            <span>Use in Project</span>
          </button>

          <button
            onClick={handleDownload}
            title="Download Master WAV"
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-500 active:scale-95"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Download</span>
            <span className="font-mono text-[11px] opacity-80">.WAV</span>
          </button>
        </div>
      </div>

      {/* Waveform Scrubber Visualizer */}
      <div className="my-5">
        <div
          className="group relative flex h-20 w-full cursor-pointer items-center justify-between gap-[3px] rounded-xl bg-slate-950/70 px-3 py-2 border border-slate-800/60 transition hover:border-slate-700"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const ratio = Math.max(0, Math.min(1, clickX / rect.width));
            if (audioRef.current && duration > 0) {
              audioRef.current.currentTime = ratio * duration;
            }
          }}
        >
          {waveformPeaks.length > 0
            ? waveformPeaks.map((peak, idx) => {
                const barRatio = idx / waveformPeaks.length;
                const isPlayed = barRatio <= progressRatio;
                return (
                  <div
                    key={idx}
                    className="relative flex h-full flex-1 items-center justify-center"
                  >
                    <div
                      style={{ height: `${peak * 100}%` }}
                      className={`w-full rounded-full transition-all duration-75 ${
                        isPlayed
                          ? 'bg-gradient-to-t from-indigo-500 to-cyan-400 shadow-[0_0_8px_rgba(99,102,241,0.5)]'
                          : 'bg-slate-700 group-hover:bg-slate-600'
                      }`}
                    />
                  </div>
                );
              })
            : Array.from({ length: 60 }).map((_, idx) => (
                <div
                  key={idx}
                  className="h-1/3 flex-1 rounded-full bg-slate-800 animate-pulse"
                />
              ))}

          {/* Scrubber Playhead line */}
          <div
            className="pointer-events-none absolute top-1 bottom-1 w-0.5 bg-white shadow-[0_0_10px_#fff]"
            style={{ left: `${progressRatio * 100}%` }}
          />
        </div>

        {/* Timestamps */}
        <div className="mt-2 flex items-center justify-between text-xs font-mono text-slate-400">
          <span>{formatTime(currentTime)}</span>
          <span className="text-[11px] text-slate-500">Click wave to scrub</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Tuner Drawer (Speed & Pitch Detune) */}
      {showPitchControls && (
        <div className="mb-4 rounded-xl border border-indigo-950 bg-slate-950/80 p-3.5 text-xs text-slate-300">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="font-medium text-white flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                Audio Speed & Pacing
              </span>
              <div className="mt-1.5 flex gap-1.5">
                {[0.8, 1.0, 1.15, 1.25, 1.5].map((rate) => (
                  <button
                    key={rate}
                    onClick={() => setPlaybackRate(rate)}
                    className={`rounded-md px-2 py-1 text-xs font-medium transition ${
                      playbackRate === rate
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 max-w-xs">
              <div className="flex justify-between font-medium">
                <span className="text-white">Fine-tune Pitch Tone</span>
                <span className="text-indigo-400 font-mono">
                  {pitchShift > 0 ? `+${pitchShift}` : pitchShift} st
                </span>
              </div>
              <input
                type="range"
                min="-4"
                max="4"
                step="1"
                value={pitchShift}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setPitchShift(val);
                  // Approximate pitch alteration with playbackRate detune if Web Audio isn't routed
                  if (audioRef.current) {
                    const factor = Math.pow(2, val / 12);
                    audioRef.current.playbackRate = playbackRate * factor;
                  }
                }}
                className="mt-2 h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-800 accent-indigo-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>Deeper</span>
                <span>Normal</span>
                <span>Brighter</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Transport Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={togglePlay}
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white shadow-lg shadow-indigo-500/25 transition hover:brightness-110 active:scale-95"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current ml-0.5" />}
          </button>

          <button
            onClick={handleRestart}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-400 transition hover:border-slate-700 hover:text-white"
            title="Replay from start"
          >
            <RotateCcw className="h-4 w-4" />
          </button>

          {/* Speed Indicator */}
          <div className="hidden sm:flex items-center gap-1 rounded-lg border border-slate-800/80 bg-slate-950/60 px-2 py-1 text-xs text-slate-400">
            <span>Speed:</span>
            <span className="font-mono text-indigo-400 font-medium">{playbackRate}x</span>
          </div>
        </div>

        {/* Volume & Status */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="text-slate-400 transition hover:text-white"
          >
            {isMuted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={isMuted ? 0 : volume}
            onChange={(e) => {
              setVolume(parseFloat(e.target.value));
              if (isMuted) setIsMuted(false);
            }}
            className="h-1.5 w-16 sm:w-24 cursor-pointer appearance-none rounded-lg bg-slate-800 accent-indigo-500"
          />
        </div>
      </div>
    </div>
  );
};
