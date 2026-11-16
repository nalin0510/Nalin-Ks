import React, { useEffect, useState } from 'react';
import { Send, Trash2, Bot, AlertCircle } from 'lucide-react';
import { DISEASE_SCENARIOS } from '../data/diseaseData';
import { useSimulationStore } from '../store/useSimulationStore';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  mode?: 'live-gemini' | 'offline-faq';
}

const SUGGESTED_QUESTIONS = [
  'How do EDV and ESV determine Stroke Volume and Ejection Fraction?',
  'Explain what the P wave, QRS complex, and T wave represent on an ECG.',
  'Why does cardiac output increase during running while systemic vascular resistance drops?',
  'How does aortic valve stenosis affect left ventricular pressure vs. aortic pressure?',
  'Trace the pathway of blood through pulmonary and systemic circulation.',
];

function offlineEducationalFaqLookup(question: string): string {
  const q = question.toLowerCase();
  if (q.includes('edv') || q.includes('esv') || q.includes('ejection') || q.includes('stroke')) {
    return [
      '**Stroke Volume & Ejection Fraction (Educational Reference Mode)**',
      '• **Stroke Volume (SV)** = EDV − ESV. At baseline (120 mL − 50 mL), SV = 70 mL/beat.',
      '• **Ejection Fraction (EF)** = (SV / EDV) × 100 = (70 / 120) × 100 = 58.33%.',
      '• **Cardiac Output (CO)** = (HR × SV) / 1000 = (72 × 70) / 1000 = 5.04 L/min.',
      'Increasing preload (EDV) via venous return or increasing myocardial contractility (lowering ESV) increases Stroke Volume.',
    ].join('\n\n');
  }
  if (q.includes('ecg') || q.includes('qrs') || q.includes('p wave') || q.includes('t wave')) {
    return [
      '**ECG Waveform Physiology (Educational Reference Mode)**',
      '• **P Wave**: Atrial depolarization originating from the SA node.',
      '• **QRS Complex**: Rapid depolarization of right and left ventricles via the His-Purkinje system, initiating mechanical systole.',
      '• **T Wave**: Ventricular repolarization restoring resting membrane potential.',
      'Note: The ECG monitor in this platform synthesizes representative Lead II-style waveforms and is not for clinical diagnosis.',
    ].join('\n\n');
  }
  if (q.includes('exercise') || q.includes('running') || q.includes('resistance')) {
    return [
      '**Exercise Physiology Response (Educational Reference Mode)**',
      'During dynamic running, sympathetic activation raises Heart Rate and myocardial contractility (E_max), while the skeletal muscle pump increases venous return (EDV). Simultaneously, active skeletal muscle arterioles vasodilate, lowering systemic vascular resistance (R_sys) so Cardiac Output can rise 3–4x without excessive diastolic blood pressure surges.',
    ].join('\n\n');
  }
  if (q.includes('stenosis') || q.includes('mitral') || q.includes('disease') || q.includes('hypertension')) {
    return [
      '**Valvular & Hemodynamic Perturbations (Educational Reference Mode)**',
      '• **Aortic Valve Stenosis**: High outflow resistance across the aortic valve forces peak left ventricular pressure (P_LV) well above aortic pressure while lowering forward Stroke Volume.',
      '• **Mitral Regurgitation**: Incomplete systolic closure allows backward flow into the left atrium, reducing net forward Cardiac Output.',
      '• **Systemic Hypertension**: Elevated R_sys and lower arterial compliance C_art increase afterload, raising systolic/diastolic pressure.',
    ].join('\n\n');
  }
  return [
    '**Cardiovascular Simulation Guide (Educational Reference Mode)**',
    'This platform couples a 15-part 3D anatomical heart with a 0D Time-Varying Elastance + Windkessel model: P_ventricle(t) = E(t) · (V(t) − V0) and Q = C · dP/dt.',
    'Try asking specifically about **EDV/ESV & Ejection Fraction**, **ECG waveforms**, **exercise physiology**, **blood circulation**, or **aortic stenosis**.',
    'Disclaimer: All simulated outputs are illustrative and educational only.',
  ].join('\n\n');
}

export function LearningAssistant() {
  const { snapshot, activeDiseaseId, ecgRhythm, exerciseSpeedKmh, exerciseMode } = useSimulationStore();
  const [aiAvailable, setAiAvailable] = useState<boolean | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Welcome to the Cardiovascular Learning Assistant. Ask questions about heart anatomy, cardiac cycle mechanics, ECG waves, hemodynamics, or the current simulation state.',
      mode: 'offline-faq',
    },
  ]);
  const [input, setInput] = useState('');
  const [attachContext, setAttachContext] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json())
      .then((d) => setAiAvailable(Boolean(d.aiConfigured)))
      .catch(() => setAiAvailable(false));
  }, []);

  const sendQuestion = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || loading) return;

    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: 'user', text: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setErrorMsg(null);
    setLoading(true);

    try {
      const res = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: trimmed,
          history: messages.slice(-6).map((m) => ({ role: m.role, text: m.text })),
          simulationContext: attachContext
            ? {
                heartRate: Math.round(snapshot.heartRate),
                edv: Math.round(snapshot.edv),
                esv: Math.round(snapshot.esv),
                strokeVolume: snapshot.strokeVolume,
                ejectionFraction: snapshot.ejectionFraction,
                cardiacOutput: snapshot.cardiacOutput,
                systolicBp: snapshot.systolicBp,
                diastolicBp: snapshot.diastolicBp,
                map: snapshot.map,
                diseaseName: DISEASE_SCENARIOS[activeDiseaseId].name,
                ecgRhythm,
                exerciseSpeedKmh,
                exerciseMode,
              }
            : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.code === 'AI_UNCONFIGURED') {
          setAiAvailable(false);
          setMessages((prev) => [
            ...prev,
            {
              id: `a-${Date.now()}`,
              role: 'assistant',
              text: offlineEducationalFaqLookup(trimmed),
              mode: 'offline-faq',
            },
          ]);
        } else {
          setErrorMsg(data.error || 'Unable to reach AI educational service.');
          setMessages((prev) => [
            ...prev,
            {
              id: `a-${Date.now()}`,
              role: 'assistant',
              text: offlineEducationalFaqLookup(trimmed),
              mode: 'offline-faq',
            },
          ]);
        }
      } else {
        setAiAvailable(true);
        setMessages((prev) => [
          ...prev,
          {
            id: `a-${Date.now()}`,
            role: 'assistant',
            text: data.answer,
            mode: 'live-gemini',
          },
        ]);
      }
    } catch {
      setErrorMsg('Network error querying backend. Displaying Educational Reference Mode response.');
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          text: offlineEducationalFaqLookup(trimmed),
          mode: 'offline-faq',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">AI Cardiovascular Learning Assistant</h2>
          <p className="mt-1 text-sm text-slate-400">
            Interactive biomedical tutor grounded in live simulation parameters.
          </p>
        </div>
        <div className="font-mono text-xs text-slate-300">
          Mode:{' '}
          <strong className={aiAvailable ? 'text-cyan-300' : 'text-amber-300'}>
            {aiAvailable === null
              ? 'Checking Provider...'
              : aiAvailable
              ? 'Connected AI Model (Server Proxy)'
              : 'Educational Reference FAQ Mode (Offline Fallback)'}
          </strong>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Suggested Prompts & Controls */}
        <div className="space-y-4 rounded-xl border border-slate-800 bg-[#0B111E] p-5 lg:col-span-4">
          <h3 className="text-sm font-semibold text-slate-100">Suggested Educational Topics</h3>
          <div className="space-y-2">
            {SUGGESTED_QUESTIONS.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => sendQuestion(q)}
                className="w-full rounded-lg border border-slate-800 bg-[#070B14] p-3 text-left text-xs leading-relaxed text-slate-300 transition-colors hover:border-cyan-500/50 hover:text-cyan-200"
              >
                {q}
              </button>
            ))}
          </div>

          <div className="border-t border-slate-800 pt-4 text-xs">
            <label className="flex cursor-pointer items-center justify-between gap-2 text-slate-300">
              <span>Include Live Telemetry Context</span>
              <input
                type="checkbox"
                checked={attachContext}
                onChange={(e) => setAttachContext(e.target.checked)}
                className="accent-cyan-400"
              />
            </label>
            <p className="mt-2 text-[11px] leading-relaxed text-amber-300/90">
              Medical Disclaimer: Responses are strictly educational and illustrative. Never use this tool for clinical diagnosis, risk prediction, or treatment decisions.
            </p>
          </div>
        </div>

        {/* Chat Window */}
        <div className="flex h-[540px] flex-col rounded-xl border border-slate-800 bg-[#0B111E] lg:col-span-8">
          <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
              <Bot className="h-4 w-4 text-cyan-400" />
              <span>Cardiovascular Physiology Tutor</span>
            </div>
            <button
              type="button"
              onClick={() =>
                setMessages([
                  {
                    id: 'reset',
                    role: 'assistant',
                    text: 'Conversation cleared. Ask any cardiovascular anatomy, hemodynamics, or ECG question.',
                    mode: aiAvailable ? 'live-gemini' : 'offline-faq',
                  },
                ])
              }
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-rose-300"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear History</span>
            </button>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-xl px-4 py-3 text-xs leading-relaxed whitespace-pre-wrap ${
                    m.role === 'user'
                      ? 'bg-cyan-500/20 text-cyan-100 border border-cyan-500/40'
                      : 'bg-[#070B14] text-slate-200 border border-slate-800'
                  }`}
                >
                  {m.text}
                </div>
                {m.role === 'assistant' && m.mode && (
                  <span className="mt-1 font-mono text-[10px] text-slate-500">
                    {m.mode === 'live-gemini' ? 'Live AI Tutor' : 'Educational Reference Mode'}
                  </span>
                )}
              </div>
            ))}

            {loading && (
              <div className="text-xs font-mono text-cyan-400">Synthesizing physiological explanation...</div>
            )}

            {errorMsg && (
              <div className="flex items-center gap-2 rounded-lg border border-amber-800/60 bg-amber-950/30 px-3 py-2 text-xs text-amber-300">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendQuestion(input);
            }}
            className="flex items-center gap-2 border-t border-slate-800 p-3"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about cardiac cycle, preload, ECG, or active disease model..."
              className="flex-1 rounded-lg border border-slate-700 bg-[#070B14] px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="flex items-center gap-1.5 rounded-lg bg-cyan-500 px-4 py-2 text-xs font-semibold text-slate-950 transition-colors hover:bg-cyan-400 disabled:opacity-40"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Ask</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
