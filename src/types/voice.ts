export interface VoiceItem {
  id: string;
  name: string;
  gender: 'Female' | 'Male';
  vibe: string;
  tags: string[];
  description: string;
  sampleText: string;
}

export interface DialogueLine {
  id: string;
  speaker: string;
  voiceName: string;
  text: string;
  style?: string;
}

export interface AudioTake {
  id: string;
  timestamp: number;
  title: string;
  mode: 'single' | 'dialogue';
  voiceName?: string;
  speakers?: { name: string; voice: string }[];
  text: string;
  audioBase64: string;
  duration?: number;
  stylePrompt?: string;
  tags?: string[];
}

export interface ProjectTemplate {
  id: string;
  title: string;
  category: 'Video & YouTube' | 'SaaS & Tech' | 'Gaming & Story' | 'Audiobook & Podcasting' | 'App & UX';
  recommendedVoice: string;
  stylePrompt: string;
  script: string;
  description: string;
  estimatedSeconds: number;
}
