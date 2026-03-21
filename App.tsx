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
  showSolution: boolean;
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
      setQuickState({ exercise: createQuickExercise(exercisePool), answer: '', checked: false, result: null, showSolution: false });
    }
  }, [exercisePool, quickState]);

  useEffect(() => {
    if (!reviewState && reviewPool.length) {
      setReviewState({ exercise: createQuickExercise(reviewPool), answer: '', checked: false, result: null, showSolution: false });
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
    setQuickState({ exercise: createQuickExercise(exercisePool), answer: '', checked: false, result: null, showSolution: false });
  };

  const nextReview = () => {
    if (!reviewPool.length) return;
    setReviewState({ exercise: createQuickExercise(reviewPool), answer: '', checked: false, result: null, showSolution: false });
  };

  const checkQuick = (mode: 'quick' | 'review') => {
    const state = mode === 'quick' ? quickState : reviewState;
    if (!state) return;
    const result = evaluateAnswer(state.exercise, state.answer, settings);
    setProgress((prev) => recordAnswer(prev, state.exercise, state.answer, result.isCorrect));
    const updater = { ...state, checked: true, result, showSolution: result.isCorrect ? true : false };
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
    setReviewState({ exercise, answer: '', checked: false, result: null, showSolution: false });
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
    if (!state) return <div className="empty-state">No hi ha exercicis disponibles amb la configuració actual.</div>;
    return (
      <section className="panel practice-panel">
        <div className="practice-meta">
          <span className="pill">{COMPOUND_TYPE_LABELS[state.exercise.type]}</span>
          <span className="pill secondary">{NOMENCLATURE_LABELS[state.exercise.nomenclature]}</span>
          <span className="pill secondary">{DIFFICULTY_LABELS[state.exercise.difficulty]}</span>
        </div>
        <h2>{mode === 'quick' ? 'Pràctica ràpida' : 'Repàs intel·ligent'}</h2>
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
          placeholder={state.exercise.direction === 'formula_to_name' ? 'Escriu el nom correcte' : 'Escriu la fórmula correcta'}
        />
        <div className="row gap-sm">
          <button className="button primary" onClick={() => (state.checked ? (mode === 'quick' ? nextQuick() : nextReview()) : checkQuick(mode))}>
            {state.checked ? 'Següent' : 'Corregir'}
          </button>
          <button
            className="button ghost"
            onClick={() =>
              mode === 'quick'
                ? setQuickState({ ...state, checked: true, result: { isCorrect: false, expected: state.exercise.expected, explanation: state.exercise.explanation, normalizedUserAnswer: '' } })
                : setReviewState({ ...state, checked: true, result: { isCorrect: false, expected: state.exercise.expected, explanation: state.exercise.explanation, normalizedUserAnswer: '' } })
            }
          >
            Veure la solució pas a pas
          </button>
        </div>
        {state.checked && state.result && (
          <div className={`feedback ${state.result.isCorrect ? 'success' : 'error'}`}>
            <strong>{state.result.isCorrect ? '✅ Correcte.' : '❌ Incorrecte.'}</strong>
            {state.result.isCorrect ? (
              <>
                <span>Solució: {state.result.expected.join(' / ')}.</span>
                {(settings.autoExplanation || !state.result.isCorrect) && <p>{state.result.explanation}</p>}
              </>
            ) : state.showSolution ? (
              <>
                <span>Solució: {state.result.expected.join(' / ')}.</span>
                <p>{state.result.explanation}</p>
              </>
            ) : (
              <>
                <span>No es mostra la solució fins que la demanis.</span>
                <button
                  className="button ghost small"
                  onClick={() =>
                    mode === 'quick'
                      ? setQuickState({ ...state, showSolution: true })
                      : setReviewState({ ...state, showSolution: true })
                  }
                >
                  Mostrar solució
                </button>
              </>
            )}
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
          <h1>Nomenclatura inorgànica</h1>
          <p className="muted">Entrenador intensiu per a ESO i Batxillerat, centrat en rapidesa, rigor i exàmens tipus classe.</p>
        </div>
        <nav className="nav-list">
          {[
            ['inicio', 'Inici'],
            ['practica', 'Pràctica ràpida'],
            ['examen', 'Examen'],
            ['repaso', "Repàs d'errors"],
            ['estadisticas', 'Estadístiques'],
            ['ajustes', 'Ajustos'],
          ].map(([id, label]) => (
            <button key={id} className={`nav-item ${view === id ? 'active' : ''}`} onClick={() => setView(id as View)}>
              {label}
            </button>
          ))}
        </nav>
        <div className="theme-switcher">
          <button className="button ghost small" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
            {theme === 'light' ? 'Mode fosc' : 'Mode clar'}
          </button>
        </div>
      </aside>

      <main className="content">
        {view === 'inicio' && (
          <>
            <section className="hero panel">
              <div>
                <p className="eyebrow">Preparació d'examen</p>
                <h2>Fes molts exercicis seguits, corregeix a l’instant i repeteix exactament allò que més et costa.</h2>
                <p>
                  L'app genera exercicis d'òxids, hidrurs, hidròxids, àcids hidràcids, oxoàcids, sals binàries, oxisals i ions
                  amb nomenclatura Stock, sistemàtica i tradicional, sense casos avançats ni compostos fora del temari de 1r de Batxillerat.
                </p>
                <div className="row wrap">
                  <button className="button primary" onClick={() => setView('practica')}>Començar pràctica ràpida</button>
                  <button className="button" onClick={() => setView('examen')}>Anar a l'examen de 40 exercicis</button>
                </div>
              </div>
              <div className="stats-grid compact">
                <article className="stat-card"><strong>{COMPOUNDS.length}</strong><span>compostos base rigorosos</span></article>
                <article className="stat-card"><strong>{getExercisePool(settings).length}</strong><span>exercicis generables</span></article>
                <article className="stat-card"><strong>{globalPercentage}%</strong><span>percentatge global</span></article>
                <article className="stat-card"><strong>{progress.stats.streak}</strong><span>ratxa actual</span></article>
              </div>
            </section>

            <section className="panel">
              <div className="section-header">
                <h3>Guia ràpida integrada</h3>
                <span className="muted">Resum dels tipus de compostos i ions més preguntats a 1r de Batxillerat.</span>
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
              <h3>Repàs d'errors</h3>
              <p>
                Aquest mode prioritza compostos que ja has fallat. Si et costen Stock, les oxisals o els ions, apareixeran amb més freqüència.
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
                <h2>Full d'examen realista</h2>
                <p>20 fórmules per anomenar + 20 noms per formular, sense pistes i amb correcció final sobre 10.</p>
              </div>
              <div className="row wrap align-center">
                {settings.timerEnabled && <div className="timer">⏱ {minutes}:{seconds}</div>}
                <button className="button ghost" onClick={() => generateNewExam(false)}>Generar un altre examen</button>
                <button className="button ghost" onClick={() => generateNewExam(true)}>Generar un examen semblant a l'anterior</button>
                {!examState.submitted && <button className="button primary" onClick={submitExam}>Lliurar examen</button>}
                {examState.submitted && <button className="button" onClick={repeatExamMistakes}>Repetir només les errades</button>}
              </div>
            </div>

            <div className="exam-grid">
              <div>
                <h3>BLOC A: 20 fórmules per anomenar</h3>
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
                <h3>BLOC B: 20 noms per formular</h3>
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
                  <article className="stat-card"><strong>{examCorrect}</strong><span>encerts</span></article>
                  <article className="stat-card"><strong>{40 - examCorrect}</strong><span>errades</span></article>
                  <article className="stat-card"><strong>{examPercentage}%</strong><span>percentatge</span></article>
                </div>
                <div className="panel review-panel">
                  <div className="row between wrap">
                    <h3>Revisió una per una</h3>
                    <div className="row gap-sm wrap">
                      {examState.items.map((_, index) => (
                        <button key={index} className={`mini-pill ${activeExamReviewIndex === index ? 'active' : ''}`} onClick={() => setActiveExamReviewIndex(index)}>{index + 1}</button>
                      ))}
                    </div>
                  </div>
                  <div className={`feedback ${examState.results[activeExamReviewIndex]?.isCorrect ? 'success' : 'error'}`}>
                    <strong>{examState.results[activeExamReviewIndex]?.isCorrect ? 'Correcte' : 'Incorrecte'}</strong>
                    <p>La teva resposta: {examState.answers[activeExamReviewIndex] || '—'}</p>
                    <p>Solució correcta: {examState.results[activeExamReviewIndex]?.expected.join(' / ')}</p>
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
              <article className="stat-card"><strong>{progress.stats.totalCorrect}</strong><span>encerts totals</span></article>
              <article className="stat-card"><strong>{progress.stats.totalWrong}</strong><span>errades totals</span></article>
              <article className="stat-card"><strong>{globalPercentage}%</strong><span>percentatge global</span></article>
              <article className="stat-card"><strong>{progress.stats.streak}</strong><span>ratxa actual</span></article>
              <article className="stat-card"><strong>{progress.stats.bestStreak}</strong><span>millor ratxa</span></article>
              <article className="stat-card"><strong>{progress.examHistory[0]?.score ?? '—'}</strong><span>última nota</span></article>
            </section>
            <section className="two-columns">
              <article className="panel">
                <h3>Temes amb més errades</h3>
                <ul className="list-clean">
                  {topicSummary.length ? topicSummary.map((item) => <li key={item.label}><span>{item.label}</span><strong>{item.count}</strong></li>) : <li>Encara no hi ha dades.</li>}
                </ul>
              </article>
              <article className="panel">
                <h3>Nomenclatura amb més errades</h3>
                <ul className="list-clean">
                  {nomenclatureSummary.length ? nomenclatureSummary.map((item) => <li key={item.label}><span>{item.label}</span><strong>{item.count}</strong></li>) : <li>Encara no hi ha dades.</li>}
                </ul>
              </article>
            </section>
            <section className="two-columns">
              <article className="panel">
                <h3>Històric de notes</h3>
                <div className="chart">
                  {progress.examHistory.length ? progress.examHistory.slice(0, 10).reverse().map((exam) => (
                    <div key={exam.id} className="bar-wrap">
                      <div className="bar" style={{ height: `${Math.max(8, exam.score * 10)}%` }} />
                      <span>{exam.score}</span>
                    </div>
                  )) : <p className="muted">Encara no has lliurat cap examen.</p>}
                </div>
              </article>
              <article className="panel">
                <h3>Errades freqüents</h3>
                <ul className="list-clean dense">
                  {weakErrors.length ? weakErrors.map((item, index) => (
                    <li key={`${item.exerciseId}-${index}`}>
                      <div>
                        <strong>{item.correctAnswer}</strong>
                        <p>{COMPOUND_TYPE_LABELS[item.type]} · {item.nomenclature}</p>
                      </div>
                      <span>{item.answer || 'sense resposta'}</span>
                    </li>
                  )) : <li>Encara no hi ha errades registrades.</li>}
                </ul>
              </article>
            </section>
          </>
        )}

        {view === 'ajustes' && (
          <section className="panel settings-panel">
            <h2>Ajustos d'estudi</h2>
            <div className="settings-grid">
              <article>
                <h3>Nomenclatures actives</h3>
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
                <h3>Temes actius</h3>
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
                <h3>Dificultat</h3>
                <select value={settings.difficulty} onChange={(event) => setSettings({ ...settings, difficulty: event.target.value as Settings['difficulty'] })}>
                  {Object.entries(DIFFICULTY_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                </select>
              </article>
              <article>
                <h3>Temps per examen</h3>
                <input type="number" min={5} max={90} value={settings.examMinutes} onChange={(event) => setSettings({ ...settings, examMinutes: Number(event.target.value) })} />
              </article>
              <article>
                <h3>Correcció</h3>
                <label className="toggle"><input type="checkbox" checked={settings.autoCorrection} onChange={(event) => setSettings({ ...settings, autoCorrection: event.target.checked })} /> Correcció automàtica</label>
                <label className="toggle"><input type="checkbox" checked={settings.autoExplanation} onChange={(event) => setSettings({ ...settings, autoExplanation: event.target.checked })} /> Explicació automàtica</label>
                <label className="toggle"><input type="checkbox" checked={settings.acceptAccentsOptional} onChange={(event) => setSettings({ ...settings, acceptAccentsOptional: event.target.checked })} /> Accents opcionals</label>
                <label className="toggle"><input type="checkbox" checked={settings.timerEnabled} onChange={(event) => setSettings({ ...settings, timerEnabled: event.target.checked })} /> Cronòmetre a l’examen</label>
              </article>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
