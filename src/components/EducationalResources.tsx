import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle2, BookOpen, HelpCircle } from 'lucide-react';
import { ANATOMY_LIST } from '../data/anatomyData';
import { EDUCATION_LESSONS, QUIZ_QUESTIONS, RBC_JOURNEY_STAGES } from '../data/educationData';
import { useSimulationStore } from '../store/useSimulationStore';

const EDU_PROGRESS_KEY = 'heart_twin_edu_progress_v1';

export function EducationalResources() {
  const { setSelectedStructure } = useSimulationStore();
  const [activeTab, setActiveTab] = useState<'journey' | 'lessons' | 'quiz' | 'identify'>('journey');
  const [rbcStep, setRbcStep] = useState(0);
  const [completedLessons, setCompletedLessons] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(EDU_PROGRESS_KEY) || '[]');
    } catch {
      return [];
    }
  });
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [idTargetIdx, setIdTargetIdx] = useState(0);
  const [idGuess, setIdGuess] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(EDU_PROGRESS_KEY, JSON.stringify(completedLessons));
    } catch {
      // ignore
    }
  }, [completedLessons]);

  const toggleLessonComplete = (id: string) => {
    setCompletedLessons((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const currentStage = RBC_JOURNEY_STAGES[rbcStep];
  const quizScore = QUIZ_QUESTIONS.reduce(
    (acc, q) => (quizAnswers[q.id] === q.correctIndex ? acc + 1 : acc),
    0
  );

  // Anatomical structure identification challenge
  const targetStructure = ANATOMY_LIST[idTargetIdx % ANATOMY_LIST.length];
  const idOptions = [
    targetStructure,
    ANATOMY_LIST[(idTargetIdx + 3) % ANATOMY_LIST.length],
    ANATOMY_LIST[(idTargetIdx + 7) % ANATOMY_LIST.length],
    ANATOMY_LIST[(idTargetIdx + 11) % ANATOMY_LIST.length],
  ].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Educational Learning Modules</h2>
          <p className="mt-1 text-sm text-slate-400">
            Interactive cardiovascular curriculum, guided blood-cell circuit, structure identification, and comprehension quizzes.
          </p>
        </div>
        <div className="font-mono text-xs text-cyan-300">
          Lessons Completed: {completedLessons.length} / {EDUCATION_LESSONS.length} · Quiz: {quizScore} / {QUIZ_QUESTIONS.length}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'journey', label: 'Journey of a Red Blood Cell' },
          { id: 'lessons', label: 'Physiology Lessons' },
          { id: 'identify', label: 'Structure Identification' },
          { id: 'quiz', label: 'Knowledge Quiz' },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id as typeof activeTab)}
            className={`rounded-md border px-3.5 py-2 text-xs font-medium whitespace-nowrap transition-colors ${
              activeTab === t.id
                ? 'border-cyan-500/60 bg-cyan-500/15 text-cyan-300'
                : 'border-slate-800 bg-[#0B111E] text-slate-300 hover:border-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 1. Journey of a Red Blood Cell */}
      {activeTab === 'journey' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="rounded-xl border border-slate-800 bg-[#0B111E] p-5 lg:col-span-4">
            <h3 className="text-sm font-semibold text-slate-100">12-Stage Vascular Circuit</h3>
            <div className="mt-3 max-h-[380px] space-y-1 overflow-y-auto pr-1">
              {RBC_JOURNEY_STAGES.map((st, idx) => (
                <button
                  key={st.step}
                  type="button"
                  onClick={() => {
                    setRbcStep(idx);
                    if (st.structureId !== 'lungs' && st.structureId !== 'body') {
                      setSelectedStructure(st.structureId);
                    }
                  }}
                  className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-xs transition-colors ${
                    rbcStep === idx
                      ? 'bg-cyan-500/15 font-semibold text-cyan-300 ring-1 ring-cyan-500/40'
                      : 'text-slate-300 hover:bg-slate-800/60'
                  }`}
                >
                  <span className="truncate">
                    {String(st.step).padStart(2, '0')}. {st.title}
                  </span>
                  <span
                    className={`ml-2 shrink-0 font-mono text-[10px] ${
                      st.oxygenation === 'oxygenated' ? 'text-rose-400' : 'text-blue-400'
                    }`}
                  >
                    {st.oxygenation === 'oxygenated' ? 'O2+' : 'CO2+'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-xl border border-slate-800 bg-[#0B111E] p-6 lg:col-span-8">
            <div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-cyan-300">Stage {currentStage.step} of {RBC_JOURNEY_STAGES.length}</span>
                <span className={currentStage.oxygenation === 'oxygenated' ? 'text-rose-400' : 'text-blue-400'}>
                  {currentStage.oxygenation === 'oxygenated' ? 'Oxygenated Arterial Phase' : 'Deoxygenated Venous Phase'}
                </span>
              </div>
              <h3 className="mt-3 text-2xl font-bold text-white">{currentStage.title}</h3>
              <div className="mt-1 font-mono text-xs text-slate-400">{currentStage.pressureNote}</div>
              <p className="mt-4 text-sm leading-relaxed text-slate-300">{currentStage.description}</p>
            </div>

            <div className="mt-8 flex items-center justify-between border-t border-slate-800 pt-4">
              <button
                type="button"
                onClick={() => setRbcStep((s) => (s - 1 + RBC_JOURNEY_STAGES.length) % RBC_JOURNEY_STAGES.length)}
                className="flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-200 hover:border-cyan-500/50"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Previous Stage</span>
              </button>

              <div className="h-1.5 flex-1 mx-6 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full bg-cyan-400 transition-all"
                  style={{ width: `${((rbcStep + 1) / RBC_JOURNEY_STAGES.length) * 100}%` }}
                />
              </div>

              <button
                type="button"
                onClick={() => setRbcStep((s) => (s + 1) % RBC_JOURNEY_STAGES.length)}
                className="flex items-center gap-1.5 rounded-md bg-cyan-500 px-3.5 py-2 text-xs font-semibold text-slate-950 hover:bg-cyan-400"
              >
                <span>Next Stage</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Physiology Lessons */}
      {activeTab === 'lessons' && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {EDUCATION_LESSONS.map((lesson) => {
            const done = completedLessons.includes(lesson.id);
            return (
              <div key={lesson.id} className="flex flex-col justify-between rounded-xl border border-slate-800 bg-[#0B111E] p-5">
                <div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-cyan-300">{lesson.category}</span>
                    <BookOpen className="h-4 w-4 text-slate-500" />
                  </div>
                  <h3 className="mt-2 text-lg font-bold text-white">{lesson.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-slate-300">{lesson.summary}</p>
                  <ul className="mt-3 space-y-1.5 text-xs text-slate-400">
                    {lesson.keyPoints.map((kp) => (
                      <li key={kp}>• {kp}</li>
                    ))}
                  </ul>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-slate-800/80 pt-3">
                  <span className="font-mono text-[11px] text-amber-300">{lesson.equationOrMetric}</span>
                  <button
                    type="button"
                    onClick={() => toggleLessonComplete(lesson.id)}
                    className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium ${
                      done
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>{done ? 'Completed' : 'Mark Complete'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 3. Anatomical Structure Identification Exercise */}
      {activeTab === 'identify' && (
        <div className="rounded-xl border border-slate-800 bg-[#0B111E] p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white">Anatomical Structure Identification Exercise</h3>
            <span className="font-mono text-xs text-slate-400">
              Item {(idTargetIdx % ANATOMY_LIST.length) + 1} of {ANATOMY_LIST.length}
            </span>
          </div>
          <p className="mt-3 text-sm text-slate-200">{targetStructure.description}</p>
          <p className="mt-2 font-mono text-xs text-cyan-300">
            Normal Pressure Profile: {targetStructure.normalPressureMmHg}
          </p>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {idOptions.map((opt) => {
              const selected = idGuess === opt.id;
              const isCorrect = opt.id === targetStructure.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setIdGuess(opt.id)}
                  className={`rounded-lg border p-3.5 text-left text-xs font-medium transition-colors ${
                    selected
                      ? isCorrect
                        ? 'border-emerald-500 bg-emerald-500/20 text-emerald-200'
                        : 'border-rose-500 bg-rose-500/20 text-rose-200'
                      : 'border-slate-800 bg-[#070B14] text-slate-200 hover:border-cyan-500/50'
                  }`}
                >
                  {opt.name}
                </button>
              );
            })}
          </div>

          <div className="mt-5 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              {idGuess
                ? idGuess === targetStructure.id
                  ? 'Correct anatomical match.'
                  : `Incorrect — clue: ${targetStructure.hemodynamicRole}`
                : 'Select the matching cardiovascular structure.'}
            </span>
            <button
              type="button"
              onClick={() => {
                setIdTargetIdx((i) => i + 1);
                setIdGuess(null);
              }}
              className="rounded-md bg-cyan-500 px-3.5 py-2 text-xs font-semibold text-slate-950 hover:bg-cyan-400"
            >
              Next Structure
            </button>
          </div>
        </div>
      )}

      {/* 4. Interactive Quiz */}
      {activeTab === 'quiz' && (
        <div className="space-y-4">
          {QUIZ_QUESTIONS.map((q, idx) => {
            const chosen = quizAnswers[q.id];
            return (
              <div key={q.id} className="rounded-xl border border-slate-800 bg-[#0B111E] p-5">
                <div className="flex items-start gap-2">
                  <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" />
                  <h4 className="text-sm font-semibold text-white">
                    {idx + 1}. {q.question}
                  </h4>
                </div>
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {q.options.map((opt, oIdx) => {
                    const isPicked = chosen === oIdx;
                    const isRight = q.correctIndex === oIdx;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setQuizAnswers((prev) => ({ ...prev, [q.id]: oIdx }))}
                        className={`rounded-lg border px-3 py-2 text-left text-xs transition-colors ${
                          chosen !== undefined
                            ? isRight
                              ? 'border-emerald-500/70 bg-emerald-500/15 text-emerald-200'
                              : isPicked
                              ? 'border-rose-500/70 bg-rose-500/15 text-rose-200'
                              : 'border-slate-800 bg-[#070B14] text-slate-400'
                            : 'border-slate-800 bg-[#070B14] text-slate-300 hover:border-cyan-500/50'
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
                {chosen !== undefined && (
                  <p className="mt-3 text-xs text-cyan-300">{q.explanation}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
