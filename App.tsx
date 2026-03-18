import React, { useEffect, useMemo, useState } from 'react';
import {
  COMPOUNDS,
  COMPOUND_TYPE_LABELS,
  DIFFICULTY_LABELS,
  NOMENCLATURE_LABELS,
  STUDY_GUIDE,
  CompoundType,
  Nomenclature,
} from './data/chemistry';
import {
  Exercise,
  ProgressState,
  Settings,
  buildExercise,
  createDefaultSettings,
  defaultProgressState,
  evaluateAnswer,
  getExercisePool,
  getNomenclatureSummary,
  getReviewPool,
  getTopicSummary,
  recordAnswer,
  recordExam,
  sampleExercises,
} from './lib/chemistry';
import './styles.css';

type View = 'inicio' | 'practica' | 'examen' | 'repaso' | 'estadisticas' | 'ajustes';
type Theme = 'light' | 'dark';

interface QuickState {
  exercise: Exercise;
  answer: string;
  checked: boolean;
  result: ReturnType<typeof evaluateAnswer> | null;
}

interface ExamState {
  id: string;
  items: Exercise[];
  answers: string[];
  submitted: boolean;
  results: ReturnType<typeof evaluateAnswer>[];
  startedAt: number;
  timerSecondsLeft: number;
  styleSeed: number;
}

const SETTINGS_KEY = 'lumilearn_inorganica_settings';
const PROGRESS_KEY = 'lumilearn_inorganica_progress';
const THEME_KEY = 'lumilearn_inorganica_theme';

const useLocalStorage = <T,>(key: string, initialValue: T) => {
  const [value, setValue] = useState<T>(() => {
    const stored = localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as T) : initialValue;
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue] as const;
};

const createQuickExercise = (pool: Exercise[]) => sampleExercises(pool, 1)[0];

const buildExam = (settings: Settings, styleSeed = Date.now()): ExamState => {
  const pool = getExercisePool({ ...settings, activeNomenclatures: settings.activeNomenclatures.length ? settings.activeNomenclatures : ['stock'] });
  const naming = sampleExercises(pool.filter((item) => item.direction === 'formula_to_name'), 20, styleSeed);
  const formulating = sampleExercises(pool.filter((item) => item.direction === 'name_to_formula'), 20, styleSeed + 77);
  const items = [...naming, ...formulating];
  return {
    id: `exam-${Date.now()}`,
    items,
    answers: Array.from({ length: 40 }, () => ''),
    submitted: false,
    results: [],
    startedAt: Date.now(),
    timerSecondsLeft: settings.examMinutes * 60,
    styleSeed,
  };
};

function App() {
  const [settings, setSettings] = useLocalStorage<Settings>(SETTINGS_KEY, createDefaultSettings());
  const [progress, setProgress] = useLocalStorage<ProgressState>(PROGRESS_KEY, defaultProgressState());
  const [theme, setTheme] = useLocalStorage<Theme>(THEME_KEY, 'light');
  const [view, setView] = useState<View>('inicio');

  const [quickState, setQuickState] = useState<QuickState | null>(null);
  const [reviewState, setReviewState] = useState<QuickState | null>(null);
  const [examState, setExamState] = useState<ExamState>(() => buildExam(createDefaultSettings()));
  const [activeExamReviewIndex, setActiveExamReviewIndex] = useState(0);

  const exercisePool = useMemo(() => getExercisePool(settings), [settings]);
  const reviewPool = useMemo(() => getReviewPool(settings, progress), [settings, progress]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    if (!quickState && exercisePool.length) {
      setQuickState({ exercise: createQuickExercise(exercisePool), answer: '', checked: false, result: null });
    }
  }, [exercisePool, quickState]);

  useEffect(() => {
    if (!reviewState && reviewPool.length) {
      setReviewState({ exercise: createQuickExercise(reviewPool), answer: '', checked: false, result: null });
    }
  }, [reviewPool, reviewState]);

  useEffect(() => {
    if (!settings.timerEnabled || examState.submitted || view !== 'examen') return undefined;
    const interval = window.setInterval(() => {
      setExamState((current) => {
        if (current.submitted) return current;
        if (current.timerSecondsLeft <= 1) {
          const results = current.items.map((item, index) => evaluateAnswer(item, current.answers[index], settings));
          const correct = results.filter((item) => item.isCorrect).length;
          const percentage = (correct / current.items.length) * 100;
          const score = Number(((percentage / 100) * 10).toFixed(2));
          setProgress((prev) => recordExam(prev, { id: current.id, score, percentage, correct, total: current.items.length, createdAt: Date.now() }));
          return { ...current, timerSecondsLeft: 0, submitted: true, results };
        }
        return { ...current, timerSecondsLeft: current.timerSecondsLeft - 1 };
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [examState.submitted, settings, setProgress, view]);

  const totals = progress.stats.totalCorrect + progress.stats.totalWrong;
  const globalPercentage = totals ? Math.round((progress.stats.totalCorrect / totals) * 100) : 0;
  const topicSummary = getTopicSummary(progress).slice(0, 5);
  const nomenclatureSummary = getNomenclatureSummary(progress).slice(0, 5);
  const weakErrors = progress.history.filter((item) => !item.isCorrect).slice(0, 8);

  const nextQuick = () => {
    if (!exercisePool.length) return;
    setQuickState({ exercise: createQuickExercise(exercisePool), answer: '', checked: false, result: null });
  };

  const nextReview = () => {
    if (!reviewPool.length) return;
    setReviewState({ exercise: createQuickExercise(reviewPool), answer: '', checked: false, result: null });
  };

  const checkQuick = (mode: 'quick' | 'review') => {
    const state = mode === 'quick' ? quickState : reviewState;
    if (!state) return;
    const result = evaluateAnswer(state.exercise, state.answer, settings);
    setProgress((prev) => recordAnswer(prev, state.exercise, state.answer, result.isCorrect));
    const updater = { ...state, checked: true, result };
    if (mode === 'quick') setQuickState(updater);
    else setReviewState(updater);
  };

  const generateNewExam = (similar = false) => {
    const nextSeed = similar ? examState.styleSeed + 1 : Date.now();
    setExamState(buildExam(settings, nextSeed));
    setActiveExamReviewIndex(0);
  };

  const submitExam = () => {
    const results = examState.items.map((item, index) => evaluateAnswer(item, examState.answers[index], settings));
    const correct = results.filter((item) => item.isCorrect).length;
    const percentage = (correct / examState.items.length) * 100;
    const score = Number(((percentage / 100) * 10).toFixed(2));

    results.forEach((result, index) => {
      setProgress((prev) => recordAnswer(prev, examState.items[index], examState.answers[index], result.isCorrect));
    });
    setProgress((prev) => recordExam(prev, { id: examState.id, score, percentage, correct, total: examState.items.length, createdAt: Date.now() }));

    setExamState((current) => ({ ...current, submitted: true, results }));
    setActiveExamReviewIndex(0);
  };

  const repeatExamMistakes = () => {
    const wrongItems = examState.items.filter((_, index) => examState.results[index] && !examState.results[index].isCorrect);
    if (!wrongItems.length) return;
    const exercise = wrongItems[0];
    setReviewState({ exercise, answer: '', checked: false, result: null });
    setView('repaso');
  };

  const toggleArrayValue = <T extends string,>(value: T, collection: T[]) =>
    collection.includes(value) ? collection.filter((item) => item !== value) : [...collection, value];

  const examCorrect = examState.results.filter((item) => item?.isCorrect).length;
  const examPercentage = examState.results.length ? Math.round((examCorrect / examState.items.length) * 100) : 0;
  const examScore = examState.results.length ? ((examCorrect / examState.items.length) * 10).toFixed(2) : '0.00';
  const minutes = Math.floor(examState.timerSecondsLeft / 60).toString().padStart(2, '0');
  const seconds = (examState.timerSecondsLeft % 60).toString().padStart(2, '0');

  const renderPracticeCard = (state: QuickState | null, mode: 'quick' | 'review') => {
    if (!state) return <div className="empty-state">No hay ejercicios disponibles con la configuración actual.</div>;
    return (
      <section className="panel practice-panel">
        <div className="practice-meta">
          <span className="pill">{COMPOUND_TYPE_LABELS[state.exercise.type]}</span>
          <span className="pill secondary">{NOMENCLATURE_LABELS[state.exercise.nomenclature]}</span>
          <span className="pill secondary">{DIFFICULTY_LABELS[state.exercise.difficulty]}</span>
        </div>
        <h2>{mode === 'quick' ? 'Práctica rápida' : 'Repaso inteligente'}</h2>
        <p className="prompt">{state.exercise.prompt}</p>
        <input
          className="answer-input"
          value={state.answer}
          onChange={(event) => {
            const value = event.target.value;
            mode === 'quick'
              ? setQuickState({ ...state, answer: value })
              : setReviewState({ ...state, answer: value });
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              if (state.checked) {
                mode === 'quick' ? nextQuick() : nextReview();
              } else {
                checkQuick(mode);
              }
            }
          }}
          placeholder={state.exercise.direction === 'formula_to_name' ? 'Escribe el nombre correcto' : 'Escribe la fórmula correcta'}
        />
        <div className="row gap-sm">
          <button className="button primary" onClick={() => (state.checked ? (mode === 'quick' ? nextQuick() : nextReview()) : checkQuick(mode))}>
            {state.checked ? 'Siguiente' : 'Corregir'}
          </button>
          <button
            className="button ghost"
            onClick={() =>
              mode === 'quick'
                ? setQuickState({ ...state, checked: true, result: { isCorrect: false, expected: state.exercise.expected, explanation: state.exercise.explanation, normalizedUserAnswer: '' } })
                : setReviewState({ ...state, checked: true, result: { isCorrect: false, expected: state.exercise.expected, explanation: state.exercise.explanation, normalizedUserAnswer: '' } })
            }
          >
            Ver solución paso a paso
          </button>
        </div>
        {state.checked && state.result && (
          <div className={`feedback ${state.result.isCorrect ? 'success' : 'error'}`}>
            <strong>{state.result.isCorrect ? '✅ Correcto.' : '❌ Incorrecto.'}</strong>
            <span>Solución: {state.result.expected.join(' / ')}.</span>
            {(settings.autoExplanation || !state.result.isCorrect) && <p>{state.result.explanation}</p>}
          </div>
        )}
      </section>
    );
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <p className="eyebrow">LumiLearn</p>
          <h1>Nomenclatura inorgánica</h1>
          <p className="muted">Entrenador intensivo para ESO y Bachillerato, centrado en rapidez, rigor y exámenes tipo clase.</p>
        </div>
        <nav className="nav-list">
          {[
            ['inicio', 'Inicio'],
            ['practica', 'Práctica rápida'],
            ['examen', 'Examen'],
            ['repaso', 'Repaso de errores'],
            ['estadisticas', 'Estadísticas'],
            ['ajustes', 'Ajustes'],
          ].map(([id, label]) => (
            <button key={id} className={`nav-item ${view === id ? 'active' : ''}`} onClick={() => setView(id as View)}>
              {label}
            </button>
          ))}
        </nav>
        <div className="theme-switcher">
          <button className="button ghost small" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
            {theme === 'light' ? 'Modo oscuro' : 'Modo claro'}
          </button>
        </div>
      </aside>

      <main className="content">
        {view === 'inicio' && (
          <>
            <section className="hero panel">
              <div>
                <p className="eyebrow">Preparación de examen</p>
                <h2>Haz muchos ejercicios seguidos, corrige al instante y repite justo lo que más fallas.</h2>
                <p>
                  La app genera ejercicios de óxidos, hidruros, hidróxidos, sales binarias, hidrácidos, oxoácidos, oxosales,
                  sales ácidas y amonio con nomenclatura Stock, sistemática y tradicional.
                </p>
                <div className="row wrap">
                  <button className="button primary" onClick={() => setView('practica')}>Empezar práctica rápida</button>
                  <button className="button" onClick={() => setView('examen')}>Ir al examen de 40 ejercicios</button>
                </div>
              </div>
              <div className="stats-grid compact">
                <article className="stat-card"><strong>{COMPOUNDS.length}</strong><span>compuestos base rigurosos</span></article>
                <article className="stat-card"><strong>{getExercisePool(settings).length}</strong><span>ejercicios generables</span></article>
                <article className="stat-card"><strong>{globalPercentage}%</strong><span>porcentaje global</span></article>
                <article className="stat-card"><strong>{progress.stats.streak}</strong><span>racha actual</span></article>
              </div>
            </section>

            <section className="panel">
              <div className="section-header">
                <h3>Guía rápida integrada</h3>
                <span className="muted">Resumen de los tipos de compuestos más preguntados.</span>
              </div>
              <div className="guide-grid">
                {STUDY_GUIDE.map((item) => (
                  <article key={item.title} className="guide-card">
                    <h4>{item.title}</h4>
                    <p>{item.text}</p>
                  </article>
                ))}
              </div>
            </section>
          </>
        )}

        {view === 'practica' && renderPracticeCard(quickState, 'quick')}

        {view === 'repaso' && (
          <>
            <section className="panel info-bar">
              <h3>Repaso de errores</h3>
              <p>
                Este modo prioriza compuestos que ya has fallado. Si te cuesta Stock u oxosales, aparecerán con más frecuencia.
              </p>
            </section>
            {renderPracticeCard(reviewState, 'review')}
          </>
        )}

        {view === 'examen' && (
          <section className="panel exam-panel">
            <div className="section-header between">
              <div>
                <p className="eyebrow">Pantalla específica: Examen</p>
                <h2>Hoja de examen realista</h2>
                <p>20 fórmulas para nombrar + 20 nombres para formular, sin pistas y con corrección final sobre 10.</p>
              </div>
              <div className="row wrap align-center">
                {settings.timerEnabled && <div className="timer">⏱ {minutes}:{seconds}</div>}
                <button className="button ghost" onClick={() => generateNewExam(false)}>Generar otro examen</button>
                <button className="button ghost" onClick={() => generateNewExam(true)}>Generar examen parecido al anterior</button>
                {!examState.submitted && <button className="button primary" onClick={submitExam}>Entregar examen</button>}
                {examState.submitted && <button className="button" onClick={repeatExamMistakes}>Repetir solo los fallos</button>}
              </div>
            </div>

            <div className="exam-grid">
              <div>
                <h3>BLOQUE A: 20 fórmulas para nombrar</h3>
                {examState.items.slice(0, 20).map((item, index) => (
                  <div key={item.id} className={`exam-row ${examState.submitted ? (examState.results[index]?.isCorrect ? 'ok' : 'ko') : ''}`}>
                    <label>{index + 1}. {item.formula}</label>
                    <input
                      value={examState.answers[index]}
                      onChange={(event) => {
                        const answers = [...examState.answers];
                        answers[index] = event.target.value;
                        setExamState({ ...examState, answers });
                      }}
                      disabled={examState.submitted}
                    />
                  </div>
                ))}
              </div>
              <div>
                <h3>BLOQUE B: 20 nombres para formular</h3>
                {examState.items.slice(20).map((item, localIndex) => {
                  const index = localIndex + 20;
                  return (
                    <div key={item.id} className={`exam-row ${examState.submitted ? (examState.results[index]?.isCorrect ? 'ok' : 'ko') : ''}`}>
                      <label>{index + 1}. {item.displayName}</label>
                      <input
                        value={examState.answers[index]}
                        onChange={(event) => {
                          const answers = [...examState.answers];
                          answers[index] = event.target.value;
                          setExamState({ ...examState, answers });
                        }}
                        disabled={examState.submitted}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {examState.submitted && (
              <div className="exam-results">
                <div className="stats-grid compact">
                  <article className="stat-card"><strong>{examScore}</strong><span>nota sobre 10</span></article>
                  <article className="stat-card"><strong>{examCorrect}</strong><span>aciertos</span></article>
                  <article className="stat-card"><strong>{40 - examCorrect}</strong><span>errores</span></article>
                  <article className="stat-card"><strong>{examPercentage}%</strong><span>porcentaje</span></article>
                </div>
                <div className="panel review-panel">
                  <div className="row between wrap">
                    <h3>Revisión uno por uno</h3>
                    <div className="row gap-sm wrap">
                      {examState.items.map((_, index) => (
                        <button key={index} className={`mini-pill ${activeExamReviewIndex === index ? 'active' : ''}`} onClick={() => setActiveExamReviewIndex(index)}>{index + 1}</button>
                      ))}
                    </div>
                  </div>
                  <div className={`feedback ${examState.results[activeExamReviewIndex]?.isCorrect ? 'success' : 'error'}`}>
                    <strong>{examState.results[activeExamReviewIndex]?.isCorrect ? 'Correcto' : 'Incorrecto'}</strong>
                    <p>Tu respuesta: {examState.answers[activeExamReviewIndex] || '—'}</p>
                    <p>Solución correcta: {examState.results[activeExamReviewIndex]?.expected.join(' / ')}</p>
                    <p>{examState.results[activeExamReviewIndex]?.explanation}</p>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {view === 'estadisticas' && (
          <>
            <section className="stats-grid">
              <article className="stat-card"><strong>{progress.stats.totalCorrect}</strong><span>aciertos totales</span></article>
              <article className="stat-card"><strong>{progress.stats.totalWrong}</strong><span>errores totales</span></article>
              <article className="stat-card"><strong>{globalPercentage}%</strong><span>porcentaje global</span></article>
              <article className="stat-card"><strong>{progress.stats.streak}</strong><span>racha actual</span></article>
              <article className="stat-card"><strong>{progress.stats.bestStreak}</strong><span>mejor racha</span></article>
              <article className="stat-card"><strong>{progress.examHistory[0]?.score ?? '—'}</strong><span>última nota</span></article>
            </section>
            <section className="two-columns">
              <article className="panel">
                <h3>Temas más fallados</h3>
                <ul className="list-clean">
                  {topicSummary.length ? topicSummary.map((item) => <li key={item.label}><span>{item.label}</span><strong>{item.count}</strong></li>) : <li>Sin datos todavía.</li>}
                </ul>
              </article>
              <article className="panel">
                <h3>Nomenclatura más fallada</h3>
                <ul className="list-clean">
                  {nomenclatureSummary.length ? nomenclatureSummary.map((item) => <li key={item.label}><span>{item.label}</span><strong>{item.count}</strong></li>) : <li>Sin datos todavía.</li>}
                </ul>
              </article>
            </section>
            <section className="two-columns">
              <article className="panel">
                <h3>Histórico de notas</h3>
                <div className="chart">
                  {progress.examHistory.length ? progress.examHistory.slice(0, 10).reverse().map((exam) => (
                    <div key={exam.id} className="bar-wrap">
                      <div className="bar" style={{ height: `${Math.max(8, exam.score * 10)}%` }} />
                      <span>{exam.score}</span>
                    </div>
                  )) : <p className="muted">Todavía no has entregado ningún examen.</p>}
                </div>
              </article>
              <article className="panel">
                <h3>Errores frecuentes</h3>
                <ul className="list-clean dense">
                  {weakErrors.length ? weakErrors.map((item, index) => (
                    <li key={`${item.exerciseId}-${index}`}>
                      <div>
                        <strong>{item.correctAnswer}</strong>
                        <p>{COMPOUND_TYPE_LABELS[item.type]} · {item.nomenclature}</p>
                      </div>
                      <span>{item.answer || 'sin respuesta'}</span>
                    </li>
                  )) : <li>Sin errores registrados todavía.</li>}
                </ul>
              </article>
            </section>
          </>
        )}

        {view === 'ajustes' && (
          <section className="panel settings-panel">
            <h2>Ajustes de estudio</h2>
            <div className="settings-grid">
              <article>
                <h3>Nomenclaturas activas</h3>
                <div className="chip-grid">
                  {(Object.keys(NOMENCLATURE_LABELS) as Nomenclature[]).map((item) => (
                    <button
                      key={item}
                      className={`chip ${settings.activeNomenclatures.includes(item) ? 'active' : ''}`}
                      onClick={() => setSettings({ ...settings, activeNomenclatures: toggleArrayValue(item, settings.activeNomenclatures) })}
                    >
                      {NOMENCLATURE_LABELS[item]}
                    </button>
                  ))}
                </div>
              </article>
              <article>
                <h3>Temas activos</h3>
                <div className="chip-grid">
                  {(Object.keys(COMPOUND_TYPE_LABELS) as CompoundType[]).map((item) => (
                    <button
                      key={item}
                      className={`chip ${settings.activeTypes.includes(item) ? 'active' : ''}`}
                      onClick={() => setSettings({ ...settings, activeTypes: toggleArrayValue(item, settings.activeTypes) })}
                    >
                      {COMPOUND_TYPE_LABELS[item]}
                    </button>
                  ))}
                </div>
              </article>
              <article>
                <h3>Dificultad</h3>
                <select value={settings.difficulty} onChange={(event) => setSettings({ ...settings, difficulty: event.target.value as Settings['difficulty'] })}>
                  {Object.entries(DIFFICULTY_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                </select>
              </article>
              <article>
                <h3>Tiempo por examen</h3>
                <input type="number" min={5} max={90} value={settings.examMinutes} onChange={(event) => setSettings({ ...settings, examMinutes: Number(event.target.value) })} />
              </article>
              <article>
                <h3>Corrección</h3>
                <label className="toggle"><input type="checkbox" checked={settings.autoCorrection} onChange={(event) => setSettings({ ...settings, autoCorrection: event.target.checked })} /> Corrección automática</label>
                <label className="toggle"><input type="checkbox" checked={settings.autoExplanation} onChange={(event) => setSettings({ ...settings, autoExplanation: event.target.checked })} /> Explicación automática</label>
                <label className="toggle"><input type="checkbox" checked={settings.acceptAccentsOptional} onChange={(event) => setSettings({ ...settings, acceptAccentsOptional: event.target.checked })} /> Acentos opcionales</label>
                <label className="toggle"><input type="checkbox" checked={settings.timerEnabled} onChange={(event) => setSettings({ ...settings, timerEnabled: event.target.checked })} /> Cronómetro en examen</label>
              </article>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
