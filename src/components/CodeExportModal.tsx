import React, { useState } from 'react';
import { Copy, Check, Terminal, Code2, Globe, FileAudio, ExternalLink } from 'lucide-react';

interface CodeExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  voiceName: string;
  text: string;
  stylePrompt?: string;
  audioBase64?: string;
}

export const CodeExportModal: React.FC<CodeExportModalProps> = ({
  isOpen,
  onClose,
  voiceName,
  text,
  stylePrompt,
  audioBase64,
}) => {
  const [activeTab, setActiveTab] = useState<'react' | 'nodejs' | 'python' | 'html' | 'curl'>('react');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const sanitizedText = text.replace(/"/g, '\\"').replace(/\n/g, ' ');

  const getCodeSnippet = () => {
    switch (activeTab) {
      case 'react':
        return `// React Component: Play Generated AI Voice in your Project
import React, { useState } from 'react';

export function ProjectVoicePlayer() {
  const [isPlaying, setIsPlaying] = useState(false);

  // Play pre-generated or dynamic audio
  const playVoice = async () => {
    try {
      const res = await fetch('/api/voice/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: "${sanitizedText}",
          voiceName: "${voiceName}",
          stylePrompt: "${stylePrompt || ''}",
        }),
      });
      const data = await res.json();
      const audio = new Audio(\`data:audio/wav;base64,\${data.audioBase64}\`);
      audio.onended = () => setIsPlaying(false);
      setIsPlaying(true);
      await audio.play();
    } catch (err) {
      console.error('Failed to play voice:', err);
    }
  };

  return (
    <button 
      onClick={playVoice} 
      className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-500"
    >
      {isPlaying ? 'Playing Audio...' : 'Hear AI Voice'}
    </button>
  );
}`;

      case 'nodejs':
        return `// Node.js Backend with @google/genai SDK
import { GoogleGenAI } from '@google/genai';
import fs from 'fs';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

async function synthesizeVoice() {
  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash-lite-tts',
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: "${sanitizedText}",
            ${stylePrompt ? `speechMetadata: { style: "${stylePrompt}" },` : ''}
          },
        ],
      },
    ],
    config: {
      responseModalities: ['AUDIO'],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: '${voiceName}' },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (base64Audio) {
    const buffer = Buffer.from(base64Audio, 'base64');
    fs.writeFileSync('project-voice.wav', buffer);
    console.log('Voice file saved as project-voice.wav');
  }
}

synthesizeVoice();`;

      case 'python':
        return `# Python: Generate and play AI Voice with google-genai
import os
import base64
from google import genai
from google.genai import types

client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

response = client.models.generate_content(
    model="gemini-3.8-flash-lite-tts",
    contents="${sanitizedText}",
    config=types.GenerateContentConfig(
        response_modalities=["AUDIO"],
        speech_config=types.SpeechConfig(
            voice_config=types.VoiceConfig(
                prebuilt_voice_config=types.PrebuiltVoiceConfig(voice_name="${voiceName}")
            )
        ),
    ),
)

# Extract audio bytes
audio_data = response.candidates[0].content.parts[0].inline_data.data
with open("project_voice.wav", "wb") as f:
    f.write(base64.b64decode(audio_data))

print("Voice saved to project_voice.wav!")`;

      case 'html':
        return `<!-- Direct HTML5 Audio Embed -->
<!-- Option 1: Saved WAV file -->
<audio controls>
  <source src="project-voice.wav" type="audio/wav">
  Your browser does not support the audio element.
</audio>

<!-- Option 2: Inline Base64 Data URL -->
<audio controls src="data:audio/wav;base64,${audioBase64 ? audioBase64.slice(0, 80) + '...[base64-data]...' : '[BASE64_AUDIO_DATA]'}" />`;

      case 'curl':
        return `# Direct REST API Call using curl
curl -X POST "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash-lite-tts:generateContent?key=$GEMINI_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "contents": [{
      "parts": [{ "text": "${sanitizedText}" }]
    }],
    "generationConfig": {
      "responseModalities": ["AUDIO"],
      "speechConfig": {
        "voiceConfig": {
          "prebuiltVoiceConfig": {
            "voiceName": "${voiceName}"
          }
        }
      }
    }
  }'`;
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getCodeSnippet());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400">
              <Code2 className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100">
                Use Voice in Your Project
              </h3>
              <p className="text-xs text-slate-400">
                Integration snippets ready to drop into your app, game, or video workflow.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Integration Guidance Box */}
        <div className="bg-slate-950/60 px-6 py-3 border-b border-slate-800/80 text-xs text-slate-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileAudio className="h-4 w-4 text-emerald-400" />
            <span>
              For video editors (Premiere, CapCut, Unity): Click <strong>Download .WAV</strong> in the player.
            </span>
          </div>
        </div>

        {/* Language Tabs */}
        <div className="flex border-b border-slate-800 px-6 pt-2">
          {[
            { id: 'react', label: 'React / Next.js' },
            { id: 'nodejs', label: 'Node.js SDK' },
            { id: 'python', label: 'Python SDK' },
            { id: 'html', label: 'HTML5 Audio' },
            { id: 'curl', label: 'cURL / REST' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`border-b-2 px-3 py-2 text-xs font-medium transition ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Code Content */}
        <div className="relative flex-1 overflow-auto p-6 font-mono text-xs">
          <button
            onClick={handleCopy}
            className="absolute right-8 top-8 flex items-center gap-1 rounded-md border border-slate-700 bg-slate-800/90 px-2.5 py-1 text-xs font-sans font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition shadow"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copy Code</span>
              </>
            )}
          </button>

          <pre className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-slate-300 overflow-x-auto leading-relaxed">
            <code>{getCodeSnippet()}</code>
          </pre>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 px-6 py-3 text-xs text-slate-500">
          <span>Uses Gemini 3.8 TTS 24kHz Studio Audio</span>
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-800 px-4 py-1.5 font-medium text-slate-200 hover:bg-slate-700"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
