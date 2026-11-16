import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    const aiConfigured = Boolean(getAiClient());
    res.json({
      status: 'ok',
      aiConfigured,
      simulationEngine: 'typescript-lumped-parameter',
      pythonBackendStatus: 'scaffold-only',
    });
  });

  app.post('/api/ai/ask', async (req, res) => {
    const { question, history, simulationContext } = req.body ?? {};
    if (!question || typeof question !== 'string') {
      return res.status(400).json({ error: 'Question text is required.' });
    }

    const ai = getAiClient();
    if (!ai) {
      return res.status(503).json({
        code: 'AI_UNCONFIGURED',
        error: 'Live AI model is not configured in this environment. Use Educational Reference Mode.',
      });
    }

    try {
      const contextSummary = simulationContext
        ? `Current Simulation Snapshot (Illustrative, not clinical):
- Heart Rate: ${simulationContext.heartRate} BPM
- EDV: ${simulationContext.edv} mL, ESV: ${simulationContext.esv} mL
- Stroke Volume: ${simulationContext.strokeVolume} mL, Ejection Fraction: ${simulationContext.ejectionFraction}%
- Cardiac Output: ${simulationContext.cardiacOutput} L/min
- Simulated BP: ${simulationContext.systolicBp}/${simulationContext.diastolicBp} mmHg (MAP ${simulationContext.map} mmHg)
- Active Scenario: ${simulationContext.diseaseName}
- ECG Rhythm: ${simulationContext.ecgRhythm}
- Exercise Speed: ${simulationContext.exerciseSpeedKmh} km/h (${simulationContext.exerciseMode})`
        : 'No live snapshot attached.';

      const systemInstruction = `You are a biomedical engineering and cardiovascular physiology educator embedded inside the "Digital Twin of the Human Heart" research prototype.
Explain concepts clearly and rigorously (heart anatomy, cardiac cycle, Wiggers diagram, Starling mechanism, Windkessel hemodynamics, ECG waves, exercise physiology, and educational cardiovascular conditions).
Rules:
1. Always treat the platform metrics as illustrative educational simulations, never real patient measurements.
2. Never diagnose, prescribe, or predict personal medical risk.
3. Keep responses concise, structured with clear physiological reasoning, and include relevant units (BPM, mL, L/min, mmHg).
4. End or include a brief reminder when discussing clinical conditions that simulated outputs are educational only.`;

      const priorTurns = Array.isArray(history)
        ? history
            .slice(-6)
            .map((m: { role: string; text: string }) => `${m.role === 'user' ? 'Student' : 'Educator'}: ${m.text}`)
            .join('\n')
        : '';

      const prompt = `${contextSummary}\n\n${priorTurns ? `Recent conversation:\n${priorTurns}\n\n` : ''}Student question: ${question}`;

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          systemInstruction,
        },
      });

      const answer = response.text?.trim();
      if (!answer) {
        return res.status(502).json({ error: 'Model returned an empty response.' });
      }

      return res.json({ answer, mode: 'live-gemini' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to query Gemini API.';
      console.error('Gemini API error:', message);
      return res.status(500).json({
        code: 'AI_ERROR',
        error: message,
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Digital Twin Cardiovascular Platform listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Server startup failed:', err);
  process.exit(1);
});
