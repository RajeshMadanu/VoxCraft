import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// Server-side GoogleGenAI client initialization
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

import { VOICES } from './src/data/voices.ts';

// 1. Get Voice Catalog
app.get('/api/voice/catalog', (_req: Request, res: Response) => {
  res.json({ voices: VOICES });
});

// 2. Generate Single or Dual-Speaker Speech
app.post('/api/voice/generate', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      mode = 'single', // 'single' | 'dialogue'
      text,
      voiceName = 'Kore',
      stylePrompt,
      // For dialogue mode:
      dialogue = [], // [{ speaker: 'Alex', voiceName: 'Puck', text: '...', style: '...' }]
    } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      res.status(500).json({
        error: 'GEMINI_API_KEY is not configured. Please ensure your API key is configured in Settings > Secrets.',
      });
      return;
    }

    if (mode === 'single') {
      if (!text || typeof text !== 'string' || !text.trim()) {
        res.status(400).json({ error: 'Text prompt is required.' });
        return;
      }

      // Use gemini-3.8-flash-lite-tts for high efficiency TTS
      // If advanced speechMetadata is provided or custom style, it works seamlessly
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash-lite-tts',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: text.trim(),
                ...(stylePrompt ? { speechMetadata: { style: stylePrompt } } : {}),
              },
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voiceName || 'Kore' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

      if (!base64Audio) {
        res.status(500).json({ error: 'Audio model did not return any audio data. Please try adjusting your text.' });
        return;
      }

      res.json({
        audioBase64: base64Audio,
        mimeType: 'audio/wav',
        voiceName,
        text: text.trim(),
        stylePrompt: stylePrompt || '',
      });
    } else if (mode === 'dialogue') {
      // Dual-speaker screenplay mode requires gemini-3.8-flash-tts
      if (!Array.isArray(dialogue) || dialogue.length === 0) {
        res.status(400).json({ error: 'Dialogue turns are required.' });
        return;
      }

      // Identify two unique speakers
      const speakerNames = Array.from(new Set(dialogue.map((d: any) => d.speaker || 'Speaker')));
      if (speakerNames.length < 2) {
        speakerNames.push('Speaker 2');
      }

      const speaker1 = speakerNames[0];
      const speaker2 = speakerNames[1];

      // Map speakers to their designated voices
      const speaker1Voice = dialogue.find((d: any) => d.speaker === speaker1)?.voiceName || 'Puck';
      const speaker2Voice = dialogue.find((d: any) => d.speaker === speaker2)?.voiceName || 'Kore';

      const parts = dialogue.map((line: any) => {
        const assignedSpeaker = line.speaker === speaker2 ? speaker2 : speaker1;
        return {
          text: `${assignedSpeaker}: ${line.text}`,
          speechMetadata: {
            speaker: assignedSpeaker,
            ...(line.style ? { style: line.style } : {}),
          },
        };
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash-tts',
        contents: [
          {
            role: 'user',
            parts,
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            multiSpeakerVoiceConfig: {
              speakerVoiceConfigs: [
                {
                  speaker: speaker1,
                  voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: speaker1Voice },
                  },
                },
                {
                  speaker: speaker2,
                  voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: speaker2Voice },
                  },
                },
              ],
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

      if (!base64Audio) {
        res.status(500).json({ error: 'Dual-speaker model did not return audio data.' });
        return;
      }

      res.json({
        audioBase64: base64Audio,
        mimeType: 'audio/wav',
        dialogue,
        speakers: [
          { name: speaker1, voice: speaker1Voice },
          { name: speaker2, voice: speaker2Voice },
        ],
      });
    } else {
      res.status(400).json({ error: `Unsupported mode: ${mode}` });
    }
  } catch (err: any) {
    console.error('Speech generation error:', err);
    res.status(500).json({
      error: err.message || 'Failed to generate speech. Please check your prompt and API key settings.',
    });
  }
});

// 3. AI Script Doctor & Optimizer (using gemini-3.8-flash)
app.post('/api/voice/enhance-script', async (req: Request, res: Response): Promise<void> => {
  try {
    const { script, targetTone = 'Professional & Clear', vocalFx = true } = req.body;

    if (!script || typeof script !== 'string') {
      res.status(400).json({ error: 'Script text is required.' });
      return;
    }

    const systemInstruction = `You are an expert voice-over director and speech synthesis script doctor.
Your job is to rewrite raw text so it sounds astonishingly natural, human, and captivating when spoken by an AI voice.
Guidelines:
1. Optimize cadence, breath pauses, and natural rhythm for speech.
2. Break run-on sentences into spoken fragments with natural commas and ellipses.
3. If requested, tastefully insert supported speech markers:
   - '<breath>' for a natural breath intake before an impactful point
   - '<laugh>' or '<gasp>' for emotional vocal bursts
   - '|yeah|' or '|mhm|' for conversational acknowledgment
4. Match target tone: ${targetTone}.
5. Do NOT output markdown code blocks or commentary. Output ONLY the optimized voiceover script text ready for synthesis.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: script,
      config: {
        systemInstruction,
      },
    });

    const enhanced = response.text?.trim() || script;
    res.json({ enhancedScript: enhanced });
  } catch (err: any) {
    console.error('Script enhancement error:', err);
    res.status(500).json({ error: err.message || 'Failed to enhance script.' });
  }
});

// 4. Generate Script from Topic/Idea (using gemini-3.8-flash)
app.post('/api/voice/generate-script', async (req: Request, res: Response): Promise<void> => {
  try {
    const { topic, format = 'YouTube Voiceover', targetDurationSeconds = 30, persona = 'Tech Enthusiast' } = req.body;

    if (!topic || typeof topic !== 'string') {
      res.status(400).json({ error: 'Topic is required.' });
      return;
    }

    const approxWords = Math.round((targetDurationSeconds / 60) * 140); // ~140 words per minute average speaking rate

    const systemInstruction = `You are a professional audio scriptwriter for top creators, games, and commercial brands.
Write a voiceover script for:
- Format: ${format}
- Topic: ${topic}
- Persona: ${persona}
- Target length: approx ${targetDurationSeconds} seconds (roughly ${approxWords} words).
Include expressive punctuation (ellipses, commas) and occasional speech tags like '<breath>' or '<laugh>' where natural.
Output ONLY the clean script text to be read by the AI voice. Do not include sound effect labels like [Music swells] or speaker tags unless it is a screenplay dialogue.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Write a compelling script about: ${topic}`,
      config: {
        systemInstruction,
      },
    });

    const generated = response.text?.trim() || '';
    res.json({ script: generated, estimatedWords: approxWords });
  } catch (err: any) {
    console.error('Script generation error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate script.' });
  }
});

// Mount Vite or serve static assets
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    // In production, serve dist folder
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    // In dev mode, use Vite dev server middlewares
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: {
        middlewareMode: true,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, () => {
    console.log(`VoxCraft Voice Studio running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
