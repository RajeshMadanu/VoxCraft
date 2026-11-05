/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Mic,
  Radio,
  Users,
  Grid,
  Sparkles,
  Layers,
  Wand2,
  Play,
  Volume2,
  CheckCircle2,
  AlertCircle,
  Code2,
  Download,
  Flame,
  FileAudio,
} from 'lucide-react';
import { VoiceItem, DialogueLine, AudioTake, ProjectTemplate } from './types/voice';
import { VOICES } from './data/voices';
import { AudioPlayer } from './components/AudioPlayer';
import { VoiceSelector } from './components/VoiceSelector';
import { ScriptEditor } from './components/ScriptEditor';
import { DualSpeakerStudio } from './components/DualSpeakerStudio';
import { VoiceAuditionGrid } from './components/VoiceAuditionGrid';
import { ProjectTemplatesView } from './components/ProjectTemplatesView';
import { CodeExportModal } from './components/CodeExportModal';
import { AudioHistoryShelf } from './components/AudioHistoryShelf';

// Initial default single speaker script
const DEFAULT_SCRIPT =
  "Welcome to VoxCraft. <breath> Whether you're building a YouTube video, a mobile app, an indie game, or a product demo, our AI voices deliver studio-quality sound in seconds. <laugh> Let's create something extraordinary.";

// Initial default dual speaker dialogue
const DEFAULT_DIALOGUE: DialogueLine[] = [
  {
    id: 'turn-1',
    speaker: 'Alex',
    voiceName: 'Puck',
    text: 'Welcome back! Today we are testing a completely new kind of AI voice synthesis.',
    style: 'Enthusiastic podcast host',
  },
  {
    id: 'turn-2',
    speaker: 'Sam',
    voiceName: 'Kore',
    text: "That's right, |yeah| and what makes this special is how natural the turn-taking feels.",
    style: 'Articulate, engaged co-host',
  },
  {
    id: 'turn-3',
    speaker: 'Alex',
    voiceName: 'Puck',
    text: 'Exactly! No robotic pauses. Just seamless dialogue for any project.',
    style: 'Energetic and excited',
  },
];

export default function App() {
  // Navigation tab
  const [activeTab, setActiveTab] = useState<'single' | 'dialogue' | 'audition' | 'templates'>('single');

  // Voices list
  const [voices, setVoices] = useState<VoiceItem[]>(VOICES || []);
  const [selectedVoice, setSelectedVoice] = useState<string>('Kore');
  const [stylePrompt, setStylePrompt] = useState<string>('Clear, professional & articulate studio narrator');

  // Script states (Single mode)
  const [script, setScript] = useState<string>(DEFAULT_SCRIPT);
  const [isEnhancingScript, setIsEnhancingScript] = useState<boolean>(false);
  const [isGeneratingIdea, setIsGeneratingIdea] = useState<boolean>(false);

  // Dialogue states (Dual speaker mode)
  const [speaker1, setSpeaker1] = useState<{ name: string; voice: string }>({ name: 'Alex', voice: 'Puck' });
  const [speaker2, setSpeaker2] = useState<{ name: string; voice: string }>({ name: 'Sam', voice: 'Kore' });
  const [dialogue, setDialogue] = useState<DialogueLine[]>(DEFAULT_DIALOGUE);

  // Active generated audio
  const [currentAudio, setCurrentAudio] = useState<{
    base64: string;
    title: string;
    voiceName: string;
    stylePrompt?: string;
  } | null>(null);

  // Generation progress
  const [isSynthesizing, setIsSynthesizing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Audition audio state
  const [auditioningVoiceId, setAuditioningVoiceId] = useState<string | null>(null);
  const auditionAudioRef = React.useRef<HTMLAudioElement | null>(null);

  // History takes
  const [takes, setTakes] = useState<AudioTake[]>(() => {
    try {
      const saved = localStorage.getItem('voxcraft_takes');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Export code modal
  const [showExportModal, setShowExportModal] = useState<boolean>(false);

  // Sync takes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('voxcraft_takes', JSON.stringify(takes));
    } catch (e) {
      console.warn('Could not save takes to storage:', e);
    }
  }, [takes]);

  // Fetch voice catalog if endpoint is active
  useEffect(() => {
    fetch('/api/voice/catalog')
      .then((res) => res.json())
      .then((data) => {
        if (data.voices && Array.isArray(data.voices)) {
          setVoices(data.voices);
        }
      })
      .catch((err) => console.log('Using default voices catalog', err));
  }, []);

  // Keyboard shortcut: Cmd+Enter or Ctrl+Enter to trigger voice synthesis
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        if (activeTab === 'single' || activeTab === 'dialogue') {
          handleSynthesizeVoice();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // Handle single or multi-speaker voice synthesis
  const handleSynthesizeVoice = async () => {
    if (activeTab === 'single' && !script.trim()) {
      setErrorMessage('Please enter a voice script before generating.');
      return;
    }

    if (activeTab === 'dialogue' && dialogue.every((d) => !d.text.trim())) {
      setErrorMessage('Please enter dialogue lines before generating.');
      return;
    }

    setIsSynthesizing(true);
    setErrorMessage(null);

    try {
      const payload =
        activeTab === 'single'
          ? {
              mode: 'single',
              text: script,
              voiceName: selectedVoice,
              stylePrompt: stylePrompt.trim() || undefined,
            }
          : {
              mode: 'dialogue',
              dialogue: dialogue.map((line) => ({
                speaker: line.speaker,
                voiceName: line.speaker === speaker2.name ? speaker2.voice : speaker1.voice,
                text: line.text,
                style: line.style,
              })),
            };

      const res = await fetch('/api/voice/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to synthesize speech.');
      }

      const newAudio = {
        base64: data.audioBase64,
        title:
          activeTab === 'single'
            ? `${selectedVoice} - ${script.slice(0, 30).trim()}...`
            : `Dialogue: ${speaker1.name} & ${speaker2.name}`,
        voiceName: activeTab === 'single' ? selectedVoice : `${speaker1.voice} + ${speaker2.voice}`,
        stylePrompt: activeTab === 'single' ? stylePrompt : 'Dual-speaker screenplay',
      };

      setCurrentAudio(newAudio);

      // Save to project history takes
      const take: AudioTake = {
        id: Math.random().toString(36).substring(2, 9),
        timestamp: Date.now(),
        title: newAudio.title,
        mode: activeTab === 'single' ? 'single' : 'dialogue',
        voiceName: activeTab === 'single' ? selectedVoice : undefined,
        speakers:
          activeTab === 'dialogue'
            ? [
                { name: speaker1.name, voice: speaker1.voice },
                { name: speaker2.name, voice: speaker2.voice },
              ]
            : undefined,
        text: activeTab === 'single' ? script : dialogue.map((d) => `${d.speaker}: ${d.text}`).join(' | '),
        audioBase64: data.audioBase64,
        stylePrompt: stylePrompt,
      };

      setTakes((prev) => [take, ...prev.slice(0, 19)]); // keep latest 20 takes
    } catch (err: any) {
      console.error('Synthesis error:', err);
      setErrorMessage(err.message || 'An error occurred during voice synthesis.');
    } finally {
      setIsSynthesizing(false);
    }
  };

  // Quick single-phrase audition
  const handleAuditionVoice = async (voiceId: string) => {
    if (auditionAudioRef.current) {
      auditionAudioRef.current.pause();
    }

    if (auditioningVoiceId === voiceId) {
      setAuditioningVoiceId(null);
      return;
    }

    setAuditioningVoiceId(voiceId);
    try {
      const voiceObj = voices.find((v) => v.id === voiceId);
      const testText = voiceObj ? voiceObj.sampleText : 'Hello, testing this voice for your project.';

      const res = await fetch('/api/voice/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'single',
          text: testText,
          voiceName: voiceId,
        }),
      });

      const data = await res.json();
      if (data.audioBase64) {
        const audio = new Audio(`data:audio/wav;base64,${data.audioBase64}`);
        auditionAudioRef.current = audio;
        audio.onended = () => setAuditioningVoiceId(null);
        audio.onerror = () => setAuditioningVoiceId(null);
        await audio.play();
      } else {
        setAuditioningVoiceId(null);
      }
    } catch (err) {
      console.error('Audition error:', err);
      setAuditioningVoiceId(null);
    }
  };

  // Voice audition clip generator (used in comparison grid)
  const handleGenerateVoiceClip = async (voiceId: string, testText: string): Promise<string | null> => {
    try {
      const res = await fetch('/api/voice/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'single',
          text: testText,
          voiceName: voiceId,
        }),
      });
      const data = await res.json();
      return data.audioBase64 || null;
    } catch (err) {
      console.error('Failed to generate clip:', err);
      return null;
    }
  };

  // Polish script using AI Script Doctor
  const handleEnhanceScript = async (targetTone: string) => {
    if (!script.trim()) return;
    setIsEnhancingScript(true);
    try {
      const res = await fetch('/api/voice/enhance-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          script,
          targetTone,
        }),
      });
      const data = await res.json();
      if (data.enhancedScript) {
        setScript(data.enhancedScript);
      }
    } catch (err) {
      console.error('Script polish error:', err);
    } finally {
      setIsEnhancingScript(false);
    }
  };

  // Generate full script from topic idea
  const handleGenerateFromIdea = async (topic: string, format: string, duration: number) => {
    setIsGeneratingIdea(true);
    try {
      const res = await fetch('/api/voice/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          format,
          targetDurationSeconds: duration,
        }),
      });
      const data = await res.json();
      if (data.script) {
        setScript(data.script);
        setActiveTab('single');
      }
    } catch (err) {
      console.error('Script generation error:', err);
    } finally {
      setIsGeneratingIdea(false);
    }
  };

  // Apply starter project template
  const handleApplyTemplate = (template: ProjectTemplate) => {
    setSelectedVoice(template.recommendedVoice);
    setStylePrompt(template.stylePrompt);
    setScript(template.script);
    setActiveTab('single');
  };

  return (
    <div className="min-h-screen bg-[#090a0f] text-slate-100 flex flex-col selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Top Studio Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 shadow-md shadow-indigo-500/20 text-white">
              <Radio className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold tracking-tight text-base sm:text-lg text-white">
                  VoxCraft <span className="text-cyan-400">AI</span>
                </span>
                <span className="hidden sm:inline-flex items-center rounded-md bg-indigo-500/10 px-2 py-0.5 text-[10px] font-semibold text-indigo-400 border border-indigo-500/20">
                  Gemini 3.8 TTS Studio
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                High-fidelity voice synthesis & audio engineering for your projects
              </p>
            </div>
          </div>

          {/* Navigation Mode Switcher */}
          <nav className="flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-900/90 p-1 text-xs font-medium">
            <button
              onClick={() => setActiveTab('single')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
                activeTab === 'single'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Mic className="h-3.5 w-3.5" />
              <span>Voiceover</span>
            </button>

            <button
              onClick={() => setActiveTab('dialogue')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
                activeTab === 'dialogue'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              <span>Dialogue</span>
            </button>

            <button
              onClick={() => setActiveTab('audition')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
                activeTab === 'audition'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Grid className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Voice Explorer</span>
              <span className="md:hidden">Explore</span>
            </button>

            <button
              onClick={() => setActiveTab('templates')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
                activeTab === 'templates'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Templates</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Studio Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full space-y-6">
        {/* Active Audio Player (Hero when available) */}
        {currentAudio && (
          <section className="animate-in fade-in slide-in-from-top-4 duration-300">
            <AudioPlayer
              audioBase64={currentAudio.base64}
              title={currentAudio.title}
              voiceName={currentAudio.voiceName}
              stylePrompt={currentAudio.stylePrompt}
              onOpenExportModal={() => setShowExportModal(true)}
            />
          </section>
        )}

        {/* Error Notification Banner */}
        {errorMessage && (
          <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-950/40 p-4 text-xs text-red-200">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold text-red-300 block mb-0.5">Synthesis Alert</span>
              <p>{errorMessage}</p>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-red-400 hover:text-red-200"
            >
              ✕
            </button>
          </div>
        )}

        {/* Tab 1: Single Speaker Voiceover */}
        {activeTab === 'single' && (
          <div className="space-y-6">
            <VoiceSelector
              voices={voices}
              selectedVoice={selectedVoice}
              onSelectVoice={setSelectedVoice}
              stylePrompt={stylePrompt}
              onChangeStylePrompt={setStylePrompt}
              onAuditionVoice={handleAuditionVoice}
              auditioningVoiceId={auditioningVoiceId}
            />

            <ScriptEditor
              script={script}
              onChangeScript={setScript}
              onEnhanceScript={handleEnhanceScript}
              isEnhancing={isEnhancingScript}
              onGenerateFromIdea={handleGenerateFromIdea}
              isGeneratingIdea={isGeneratingIdea}
            />

            {/* Master Synthesis Trigger Bar */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 flex flex-wrap items-center justify-between gap-4">
              <div className="text-xs text-slate-400">
                <span className="text-slate-200 font-semibold block">Ready to synthesize</span>
                <span>
                  Voice: <strong className="text-indigo-400">{selectedVoice}</strong> · Unary 24kHz Studio WAV · Press{' '}
                  <kbd className="rounded border border-slate-700 bg-slate-800 px-1 py-0.5 font-mono text-[10px] text-slate-300">
                    ⌘+Enter
                  </kbd>
                </span>
              </div>

              <button
                type="button"
                disabled={isSynthesizing || !script.trim()}
                onClick={handleSynthesizeVoice}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 px-6 py-3 font-semibold text-sm text-white shadow-lg shadow-indigo-600/30 transition hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
              >
                {isSynthesizing ? (
                  <>
                    <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    <span>Synthesizing Voice...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Generate AI Voice</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Dual Speaker Screenplay & Dialogue */}
        {activeTab === 'dialogue' && (
          <div className="space-y-6">
            <DualSpeakerStudio
              voices={voices}
              dialogue={dialogue}
              onChangeDialogue={setDialogue}
              speaker1={speaker1}
              speaker2={speaker2}
              onChangeSpeakers={(sp1, sp2) => {
                setSpeaker1(sp1);
                setSpeaker2(sp2);
              }}
            />

            {/* Master Synthesis Trigger Bar for Dialogue */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 flex flex-wrap items-center justify-between gap-4">
              <div className="text-xs text-slate-400">
                <span className="text-slate-200 font-semibold block">Multi-Speaker Synthesis</span>
                <span>
                  Speakers: <strong className="text-indigo-400">{speaker1.name}</strong> ({speaker1.voice}) &{' '}
                  <strong className="text-cyan-400">{speaker2.name}</strong> ({speaker2.voice}) · Powered by Gemini 3.8 Flash TTS
                </span>
              </div>

              <button
                type="button"
                disabled={isSynthesizing || dialogue.length === 0}
                onClick={handleSynthesizeVoice}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 px-6 py-3 font-semibold text-sm text-white shadow-lg shadow-indigo-600/30 transition hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
              >
                {isSynthesizing ? (
                  <>
                    <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    <span>Synthesizing Screenplay...</span>
                  </>
                ) : (
                  <>
                    <Users className="h-4 w-4" />
                    <span>Generate Dual-Speaker Audio</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Voice Explorer / Audition Grid */}
        {activeTab === 'audition' && (
          <VoiceAuditionGrid
            voices={voices}
            selectedVoice={selectedVoice}
            onSelectAndUse={(voiceId) => {
              setSelectedVoice(voiceId);
              setActiveTab('single');
            }}
            onGenerateVoiceClip={handleGenerateVoiceClip}
          />
        )}

        {/* Tab 4: Project Starter Templates */}
        {activeTab === 'templates' && (
          <ProjectTemplatesView onApplyTemplate={handleApplyTemplate} />
        )}

        {/* Audio Takes & History Shelf */}
        <AudioHistoryShelf
          takes={takes}
          activeTakeId={takes.find((t) => t.audioBase64 === currentAudio?.base64)?.id}
          onSelectTake={(take) => {
            setCurrentAudio({
              base64: take.audioBase64,
              title: take.title,
              voiceName: take.voiceName || 'Dual-Speaker',
              stylePrompt: take.stylePrompt,
            });
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onDeleteTake={(id) => setTakes(takes.filter((t) => t.id !== id))}
          onClearAll={() => setTakes([])}
        />
      </main>

      {/* Code Export Modal */}
      <CodeExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        voiceName={selectedVoice}
        text={script}
        stylePrompt={stylePrompt}
        audioBase64={currentAudio?.base64}
      />

      {/* Studio Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>VoxCraft AI Voice Studio · High-Fidelity Gemini 3.8 TTS Engine</span>
          <span>Download studio WAV files or integrate directly into your projects</span>
        </div>
      </footer>
    </div>
  );
}
