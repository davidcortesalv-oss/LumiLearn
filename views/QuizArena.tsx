
import React, { useState, useEffect } from 'react';
import { useGamification } from '../components/GamificationContext';
import { generateSmartQuiz, analyzeQuizPerformance, generateAdaptiveQuestion, generateSingleQuizQuestion } from '../services/geminiService';
import { QuizQuestion, QuizType, Difficulty, QuizConfig, QuizAnalysis, BoostType } from '../types';
import { 
  Zap, Trophy, Loader2, Target, Settings, BrainCircuit, Check, X, 
  ArrowRight, RefreshCw, BookOpen, Star, Lightbulb, SkipForward, Repeat,
  CheckCircle, TrendingUp, AlertTriangle
} from 'lucide-react';

export const QuizArena = () => {
  const { loseEnergy, gainXP, stats } = useGamification();
  
  // States
  const [gameState, setGameState] = useState<'setup' | 'playing' | 'feedback' | 'summary'>('setup');
  const [config, setConfig] = useState<QuizConfig>({
    topic: '',
    difficulty: Difficulty.INTERMEDIATE,
    questionCount: 5,
    mode: 'random'
  });
  
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [resultsLog, setResultsLog] = useState<{question: string, correct: boolean}[]>([]);
  const [analysis, setAnalysis] = useState<QuizAnalysis | null>(null);
  
  // Feedback State
  const [feedbackState, setFeedbackState] = useState<{
      correct: boolean, 
      explanation: string, 
      analogy?: string, 
      distractorAnalysis?: string
  } | null>(null);

  // Boosts State
  const [boosts, setBoosts] = useState({
      hint_ia: 2,
      double_xp: 1,
      second_chance: 1
  });
  const [activeBoosts, setActiveBoosts] = useState<BoostType[]>([]);
  const [hiddenOptions, setHiddenOptions] = useState<string[]>([]); // For Hint
  const [retryActive, setRetryActive] = useState(false); // For Second Chance

  // Animations
  const [shake, setShake] = useState(false);
  const [regeneratingQ, setRegeneratingQ] = useState(false);

  // --- ACTIONS ---

  const handleStartQuiz = async () => {
    if (!config.topic.trim()) return;
    if (stats.energy < 10) {
      alert("No tienes suficiente energía (mínimo 10 ⚡)");
      return;
    }
    
    setLoading(true);
    loseEnergy(10);
    
    try {
        // Initial batch generation
        const generatedQuestions = await generateSmartQuiz(config);
        
        if (generatedQuestions.length > 0) {
            setQuestions(generatedQuestions);
            setGameState('playing');
            setCurrentQIndex(0);
            setResultsLog([]);
            setActiveBoosts([]);
            setHiddenOptions([]);
        } else {
            alert("La IA no pudo generar el quiz. Intenta otro tema.");
        }
    } catch (e) {
        console.error(e);
        alert("Error de conexión.");
    } finally {
        setLoading(false);
    }
  };

  const regenerateCurrentQuestion = async () => {
      setRegeneratingQ(true);
      try {
          const newQ = await generateSingleQuizQuestion(config);
          if (newQ) {
              const updatedQuestions = [...questions];
              updatedQuestions[currentQIndex] = newQ;
              setQuestions(updatedQuestions);
          } else {
              alert("No se pudo regenerar la pregunta.");
          }
      } catch (e) {
          console.error("Regen Error", e);
      } finally {
          setRegeneratingQ(false);
      }
  };

  const useBoost = (type: BoostType) => {
      if (boosts[type] <= 0 || activeBoosts.includes(type)) return;
      
      setBoosts(prev => ({...prev, [type]: prev[type] - 1}));
      setActiveBoosts(prev => [...prev, type]);

      const currentQ = questions[currentQIndex];

      if (type === 'hint_ia' && currentQ.options) {
          // Hide 2 wrong options
          const wrongOptions = currentQ.options.filter(o => o !== currentQ.correctAnswer);
          const toHide = wrongOptions.slice(0, 2);
          setHiddenOptions(toHide);
      }

      if (type === 'second_chance') {
          setRetryActive(true);
      }
  };

  const submitAnswer = async (answer: any) => {
      const currentQ = questions[currentQIndex];
      let isCorrect = false;

      if (currentQ.type === QuizType.ORDERING) {
          const correctArr = currentQ.correctAnswer as string[];
          isCorrect = JSON.stringify(answer) === JSON.stringify(correctArr);
      } else {
          isCorrect = answer === currentQ.correctAnswer;
      }

      // Handle Second Chance
      if (!isCorrect && retryActive) {
          setRetryActive(false);
          setShake(true);
          setTimeout(() => setShake(false), 500);
          return; // Don't submit yet, allow retry
      }

      // Animation
      if (!isCorrect) {
          setShake(true);
          setTimeout(() => setShake(false), 500);
      }

      // Log result
      const newLog = [...resultsLog, { question: currentQ.question, correct: isCorrect }];
      setResultsLog(newLog);

      // Save answer state (omitted for brevity, handled in log)

      // XP Logic
      if (isCorrect) {
          let xp = 20;
          if (activeBoosts.includes('double_xp')) xp *= 2;
          gainXP(xp);
      }

      // Show Feedback
      setFeedbackState({
          correct: isCorrect,
          explanation: currentQ.explanation,
          analogy: currentQ.analogy,
          distractorAnalysis: currentQ.distractorAnalysis
      });
      setGameState('feedback');

      // Adaptive Logic: Generate next question based on result if needed
      // (For now, we just proceed to existing next, but we could fetch a new one here)
      if (config.difficulty === Difficulty.ADAPTIVE && currentQIndex === questions.length - 1) {
          // Potentially extend quiz here, but we stick to fixed length for UI simplicity
      }
  };

  const nextQuestion = async () => {
      setFeedbackState(null);
      setActiveBoosts([]);
      setHiddenOptions([]);
      setRetryActive(false);

      if (currentQIndex < questions.length - 1) {
          setCurrentQIndex(prev => prev + 1);
          setGameState('playing');
          
          // Adaptive: Replace next question if we want real-time adaptation
          if (config.difficulty === Difficulty.ADAPTIVE) {
             const prevResult = resultsLog[resultsLog.length - 1].correct ? 'correct' : 'incorrect';
             // Generate specific next question
             // const nextQ = await generateAdaptiveQuestion(...)
             // setQuestions(prev => replaceAt(prev, currentQIndex + 1, nextQ))
          }

      } else {
          finishQuiz();
      }
  };

  const finishQuiz = async () => {
      setLoading(true);
      const analytics = await analyzeQuizPerformance(config.topic, resultsLog);
      setAnalysis(analytics);
      if (analytics.xpEarned > 0) gainXP(analytics.xpEarned);
      setLoading(false);
      setGameState('summary');
  };

  // --- RENDERERS ---

  const renderSetup = () => (
    <div className="max-w-2xl mx-auto space-y-8 animate-[scaleIn_0.3s_ease-out]">
        <div className="text-center space-y-2">
            <div className="inline-flex bg-candy-pink/20 p-4 rounded-full mb-2">
                <Target className="w-10 h-10 text-candy-pink" />
            </div>
            <h1 className="text-4xl font-black text-gray-800 font-logo">Quiz Arena</h1>
            <p className="text-gray-500 font-medium">Desafía tu conocimiento con IA</p>
        </div>

        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-candy-sky/30 space-y-6">
            <div className="space-y-2">
                <label className="text-xs font-extrabold text-gray-400 uppercase tracking-wider ml-1">Tema</label>
                <input 
                    type="text" 
                    value={config.topic}
                    onChange={e => setConfig({...config, topic: e.target.value})}
                    placeholder="Ej: Mitosis, Segunda Guerra Mundial..."
                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 text-lg font-bold text-gray-700 focus:border-candy-sky focus:bg-white outline-none transition-all placeholder-gray-300"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-xs font-extrabold text-gray-400 uppercase tracking-wider ml-1">Dificultad</label>
                    <div className="flex flex-col gap-2">
                        {Object.values(Difficulty).map((diff) => (
                            <button
                                key={diff}
                                onClick={() => setConfig({...config, difficulty: diff})}
                                className={`p-3 rounded-xl font-bold text-sm text-left transition-all border-2 ${
                                    config.difficulty === diff 
                                    ? 'bg-candy-lilac/20 border-candy-lilac text-candy-dark' 
                                    : 'bg-white border-gray-100 text-gray-400 hover:bg-gray-50'
                                }`}
                            >
                                {diff}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-extrabold text-gray-400 uppercase tracking-wider ml-1">Preguntas</label>
                    <div className="grid grid-cols-2 gap-2">
                        {[5, 10, 15].map(count => (
                            <button
                                key={count}
                                onClick={() => setConfig({...config, questionCount: count})}
                                className={`p-3 rounded-xl font-bold text-sm transition-all border-2 ${
                                    config.questionCount === count
                                    ? 'bg-candy-sky/20 border-candy-sky text-candy-dark' 
                                    : 'bg-white border-gray-100 text-gray-400 hover:bg-gray-50'
                                }`}
                            >
                                {count}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <button 
                onClick={handleStartQuiz}
                disabled={!config.topic || loading}
                className="w-full py-5 bg-candy-pink hover:bg-pink-400 text-white font-extrabold text-xl rounded-2xl shadow-lg shadow-pink-200 transform transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
                {loading ? <Loader2 className="animate-spin"/> : <Zap className="fill-current"/>}
                Comenzar Quiz
            </button>
        </div>
    </div>
  );

  const renderQuestion = () => {
      const q = questions[currentQIndex];
      
      // FALLBACK: If question is blank/undefined
      const isBlank = !q || !q.question;

      return (
          <div className={`max-w-2xl mx-auto space-y-6 ${shake ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}>
              {/* Progress & Stats */}
              <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                      <span className="font-black text-2xl text-candy-pink">{currentQIndex + 1}</span>
                      <span className="text-gray-300 font-bold text-lg">/ {questions.length}</span>
                  </div>
                  
                  {/* Boosts Bar */}
                  <div className="flex gap-2">
                      <button 
                          onClick={() => useBoost('hint_ia')} 
                          disabled={boosts.hint_ia === 0 || activeBoosts.includes('hint_ia')}
                          className={`p-2 rounded-xl border-2 transition-all ${activeBoosts.includes('hint_ia') ? 'bg-yellow-100 border-yellow-400 text-yellow-600' : 'bg-white border-gray-100 text-gray-400 hover:border-yellow-200'} disabled:opacity-50`}
                          title="Pista IA: Elimina 2 opciones"
                      >
                          <Lightbulb size={20} className={activeBoosts.includes('hint_ia') ? 'fill-current' : ''}/>
                          <span className="text-[10px] font-bold block text-center">{boosts.hint_ia}</span>
                      </button>
                      
                      <button 
                          onClick={() => useBoost('double_xp')} 
                          disabled={boosts.double_xp === 0 || activeBoosts.includes('double_xp')}
                          className={`p-2 rounded-xl border-2 transition-all ${activeBoosts.includes('double_xp') ? 'bg-purple-100 border-purple-400 text-purple-600' : 'bg-white border-gray-100 text-gray-400 hover:border-purple-200'} disabled:opacity-50`}
                          title="Doble XP"
                      >
                          <Zap size={20} className={activeBoosts.includes('double_xp') ? 'fill-current' : ''}/>
                          <span className="text-[10px] font-bold block text-center">{boosts.double_xp}</span>
                      </button>

                      <button 
                          onClick={() => useBoost('second_chance')} 
                          disabled={boosts.second_chance === 0 || activeBoosts.includes('second_chance')}
                          className={`p-2 rounded-xl border-2 transition-all ${activeBoosts.includes('second_chance') ? 'bg-green-100 border-green-400 text-green-600' : 'bg-white border-gray-100 text-gray-400 hover:border-green-200'} disabled:opacity-50`}
                          title="Segunda Oportunidad"
                      >
                          <Repeat size={20} className={retryActive ? 'animate-spin' : ''}/>
                          <span className="text-[10px] font-bold block text-center">{boosts.second_chance}</span>
                      </button>
                  </div>
              </div>

              {/* Progress Bar Jelly */}
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden w-full">
                  <div 
                    className="h-full bg-candy-sky rounded-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(174,228,255,0.6)]"
                    style={{ width: `${((currentQIndex) / questions.length) * 100}%` }}
                  ></div>
              </div>

              {/* Question Card */}
              <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100 min-h-[400px] flex flex-col relative overflow-hidden animate-[scaleIn_0.2s_ease-out]">
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-candy-pink via-candy-lilac to-candy-sky"></div>
                  
                  {isBlank ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                           <AlertTriangle className="w-16 h-16 text-yellow-400 mb-4"/>
                           <h3 className="text-xl font-bold text-gray-800 mb-2">Error de carga</h3>
                           <p className="text-gray-500 mb-6">Esta pregunta no se cargó correctamente.</p>
                           <button 
                              onClick={regenerateCurrentQuestion}
                              disabled={regeneratingQ}
                              className="px-6 py-3 bg-indigo-500 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-600 transition-colors"
                           >
                              {regeneratingQ ? <Loader2 className="animate-spin"/> : <RefreshCw/>}
                              Regenerar Pregunta
                           </button>
                      </div>
                  ) : (
                      <>
                        <h2 className="text-2xl font-bold text-gray-800 mb-8 leading-relaxed">
                            {q.question}
                        </h2>

                        {/* Options */}
                        <div className="space-y-3 flex-1">
                            {q.options?.map((opt, idx) => {
                                if (hiddenOptions.includes(opt)) return null;
                                return (
                                    <button
                                        key={idx}
                                        onClick={() => submitAnswer(opt)}
                                        className="w-full text-left p-5 rounded-2xl border-2 border-gray-100 hover:border-candy-sky hover:bg-sky-50 font-bold text-gray-600 transition-all flex items-center gap-4 group transform hover:translate-x-1"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center font-black text-sm group-hover:bg-candy-sky group-hover:text-white transition-colors shadow-sm">
                                            {String.fromCharCode(65 + idx)}
                                        </div>
                                        {opt}
                                    </button>
                                )
                            })}
                        </div>
                      </>
                  )}
              </div>
              
              {/* FALLBACK BUTTON FOR ANY GLITCH */}
              <div className="text-center">
                  <button 
                    onClick={regenerateCurrentQuestion}
                    disabled={regeneratingQ}
                    className="text-xs font-bold text-gray-400 hover:text-indigo-500 transition-colors underline flex items-center justify-center gap-1 mx-auto"
                  >
                     {regeneratingQ ? <Loader2 size={12} className="animate-spin"/> : <RefreshCw size={12}/>}
                     ¿Si no te carga la pregunta toca aquí?
                  </button>
              </div>
          </div>
      );
  };

  const renderFeedback = () => (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-white max-w-lg w-full rounded-[2.5rem] p-8 shadow-2xl animate-[slideUp_0.4s_cubic-bezier(0.16, 1, 0.3, 1)] relative overflow-hidden">
              {/* Background Glow */}
              <div className={`absolute top-0 left-0 w-full h-32 opacity-20 ${feedbackState?.correct ? 'bg-green-400' : 'bg-pink-400'} blur-3xl pointer-events-none`}></div>

              <div className={`w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center shadow-lg transform -translate-y-4 ${feedbackState?.correct ? 'bg-green-100' : 'bg-pink-100'}`}>
                  {feedbackState?.correct ? <Check className="w-12 h-12 text-green-500 animate-[bounce_0.5s]"/> : <X className="w-12 h-12 text-pink-500 animate-[shake_0.5s]"/>}
              </div>
              
              <h2 className={`text-4xl font-black mb-2 text-center ${feedbackState?.correct ? 'text-green-500' : 'text-pink-500'}`}>
                  {feedbackState?.correct ? '¡Correcto!' : '¡Ups!'}
              </h2>
              
              <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 mt-6 mb-6">
                  <p className="text-gray-700 font-bold mb-3 leading-relaxed">
                      {feedbackState?.explanation}
                  </p>
                  
                  {feedbackState?.analogy && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                          <p className="text-xs font-extrabold text-indigo-400 uppercase mb-1">Analogía para recordar</p>
                          <p className="text-gray-600 text-sm italic">"{feedbackState.analogy}"</p>
                      </div>
                  )}

                  {!feedbackState?.correct && feedbackState?.distractorAnalysis && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                           <p className="text-xs font-extrabold text-pink-400 uppercase mb-1">Por qué fallaste</p>
                           <p className="text-gray-600 text-sm">{feedbackState.distractorAnalysis}</p>
                      </div>
                  )}
              </div>

              <button 
                onClick={nextQuestion}
                className="w-full py-5 bg-gray-900 text-white rounded-2xl font-bold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 shadow-xl"
              >
                  {currentQIndex < questions.length - 1 ? 'Siguiente Pregunta' : 'Ver Resultados'} <ArrowRight size={20}/>
              </button>
          </div>
      </div>
  );

  const renderSummary = () => (
      <div className="max-w-5xl mx-auto text-center space-y-8 animate-[fadeIn_0.5s_ease-out]">
          <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-candy-sky/20 relative overflow-hidden">
              <div className="inline-block p-6 bg-yellow-100 rounded-full mb-6 shadow-md animate-[bounce_2s_infinite]">
                  <Trophy className="w-16 h-16 text-yellow-500" />
              </div>
              <h2 className="text-5xl font-black text-gray-800 mb-2 font-logo">¡Quiz Completado!</h2>
              <p className="text-gray-400 font-medium mb-10 text-lg">Resumen de tu sesión de aprendizaje</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                  <div className="p-6 bg-indigo-50 rounded-3xl border border-indigo-100">
                      <div className="text-4xl font-black text-indigo-600">{analysis?.score}/{questions.length}</div>
                      <div className="text-xs font-bold text-indigo-300 uppercase mt-1">Aciertos</div>
                  </div>
                  <div className="p-6 bg-pink-50 rounded-3xl border border-pink-100">
                      <div className="text-4xl font-black text-candy-pink">{analysis?.xpEarned}</div>
                      <div className="text-xs font-bold text-pink-300 uppercase mt-1">XP Ganado</div>
                  </div>
                  <div className="p-6 bg-green-50 rounded-3xl border border-green-100">
                      <div className="text-4xl font-black text-green-600">{(analysis?.score || 0) > (questions.length / 2) ? 'Aprobado' : 'Repasar'}</div>
                      <div className="text-xs font-bold text-green-300 uppercase mt-1">Resultado</div>
                  </div>
              </div>

              {/* Redesigned Analysis Section - Visual Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                  {/* Strengths Card */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-8 rounded-[2.5rem] border border-green-100 relative overflow-hidden group hover:shadow-lg transition-all">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-green-200/20 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-green-300/30 transition-colors"></div>
                      
                      <h3 className="font-black text-green-700 mb-6 flex items-center gap-3 text-xl">
                          <div className="p-2 bg-green-100 rounded-xl">
                             <CheckCircle className="w-6 h-6 fill-current text-green-600"/> 
                          </div>
                          Lo has clavado
                      </h3>
                      
                      <div className="flex flex-col gap-3">
                          {analysis?.strengths.length === 0 ? (
                              <p className="text-green-600/60 italic text-sm">Sigue practicando para descubrir tus poderes.</p>
                          ) : (
                              analysis?.strengths.map((s, i) => (
                                  <div key={i} className="bg-white/60 backdrop-blur-sm border border-green-200/50 px-5 py-4 rounded-2xl shadow-sm flex items-start gap-4 hover:scale-[1.02] transition-transform">
                                      <div className="w-6 h-6 rounded-full bg-green-200 flex items-center justify-center shrink-0 mt-0.5">
                                          <Check size={14} className="text-green-700 stroke-[4]"/>
                                      </div>
                                      <span className="text-sm font-bold text-gray-700 leading-snug">{s}</span>
                                  </div>
                              ))
                          )}
                      </div>
                  </div>

                  {/* Weaknesses Card */}
                  <div className="bg-gradient-to-br from-orange-50 to-red-50 p-8 rounded-[2.5rem] border border-orange-100 relative overflow-hidden group hover:shadow-lg transition-all">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-orange-200/20 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-orange-300/30 transition-colors"></div>
                      
                      <h3 className="font-black text-orange-700 mb-6 flex items-center gap-3 text-xl">
                          <div className="p-2 bg-orange-100 rounded-xl">
                             <Target className="w-6 h-6 fill-current text-orange-600"/> 
                          </div>
                          Áreas de Mejora
                      </h3>
                      
                      <div className="flex flex-col gap-3">
                           {analysis?.weaknesses.length === 0 ? (
                              <p className="text-orange-600/60 italic text-sm">¡Impecable! Nada que corregir por ahora.</p>
                          ) : (
                              analysis?.weaknesses.map((w, i) => (
                                  <div key={i} className="bg-white/60 backdrop-blur-sm border border-orange-200/50 px-5 py-4 rounded-2xl shadow-sm flex items-start gap-4 hover:scale-[1.02] transition-transform">
                                      <div className="w-6 h-6 rounded-full bg-orange-200 flex items-center justify-center shrink-0 mt-0.5">
                                          <TrendingUp size={14} className="text-orange-700 stroke-[3]"/>
                                      </div>
                                      <span className="text-sm font-bold text-gray-700 leading-snug">{w}</span>
                                  </div>
                              ))
                          )}
                      </div>
                  </div>
              </div>

              <div className="mt-10 flex gap-4 justify-center pt-6">
                  <button onClick={() => setGameState('setup')} className="px-8 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-2xl transition-colors">
                      Volver al Inicio
                  </button>
                  <button onClick={() => handleStartQuiz()} className="px-8 py-4 bg-candy-pink hover:bg-pink-400 text-white font-bold rounded-2xl shadow-xl shadow-pink-200/50 transition-all hover:scale-105 flex items-center gap-2">
                      <RefreshCw size={20}/> Nuevo Quiz
                  </button>
              </div>
          </div>
      </div>
  );

  return (
    <div className="h-full">
        {loading && (
            <div className="fixed inset-0 z-[60] bg-white/90 backdrop-blur-sm flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-20 h-20 text-candy-pink animate-spin mx-auto mb-6"/>
                    <h3 className="text-2xl font-black text-gray-800">La IA está pensando...</h3>
                    <p className="text-gray-400 font-medium mt-2">Preparando tu experiencia de aprendizaje</p>
                </div>
            </div>
        )}
        
        {gameState === 'setup' && renderSetup()}
        {gameState === 'playing' && renderQuestion()}
        {gameState === 'feedback' && renderFeedback()}
        {gameState === 'summary' && renderSummary()}
    </div>
  );
};
