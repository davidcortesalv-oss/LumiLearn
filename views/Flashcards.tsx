

import React, { useState, useEffect } from 'react';
import { useGamification } from '../components/GamificationContext';
import { generateFlashcardDeck } from '../services/geminiService';
import { saveDeckToStorage, getDecksFromStorage, deleteDeckFromStorage } from '../services/storageService';
import { Flashcard, FlashcardDeck, FlashcardMastery } from '../types';
import { 
  Layers, Plus, Brain, Sparkles, Clock, Check, X, 
  RotateCcw, Zap, Target, Flame, Trash2, ArrowRight, 
  Play, BookOpen, Repeat, AlertCircle, Eye, EyeOff, Lightbulb
} from 'lucide-react';

// --- UTILS: SPACED REPETITION LOGIC (SM-2 Inspired) ---
const calculateNextReview = (card: Flashcard, quality: number): Flashcard => {
    // Quality: 0 (Fail) to 5 (Perfect)
    // Map UI ratings: Again (0), Hard (3), Good (4), Easy (5)
    
    let newInterval = 0;
    let newRepetitions = 0;
    let newEase = card.easeFactor;

    if (quality >= 3) {
        if (card.repetitions === 0) {
            newInterval = 1;
        } else if (card.repetitions === 1) {
            newInterval = 6;
        } else {
            newInterval = Math.round(card.interval * card.easeFactor);
        }
        newRepetitions = card.repetitions + 1;
        newEase = card.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    } else {
        newRepetitions = 0;
        newInterval = 1;
        newEase = card.easeFactor; // Ease doesn't drop on fail immediately in simplified version
    }

    if (newEase < 1.3) newEase = 1.3;

    // Mastery State Logic
    let newMastery: FlashcardMastery = card.mastery;
    if (newRepetitions === 0) newMastery = 'learning';
    else if (newRepetitions > 0 && newRepetitions < 4) newMastery = 'reviewing';
    else if (newRepetitions >= 4 && newRepetitions < 8) newMastery = 'mastered';
    else if (newRepetitions >= 8) newMastery = 'legendary';

    return {
        ...card,
        interval: newInterval,
        repetitions: newRepetitions,
        easeFactor: newEase,
        nextReview: Date.now() + (newInterval * 24 * 60 * 60 * 1000),
        mastery: newMastery
    };
};

const THEMES = {
    candy: 'bg-gradient-to-br from-pink-100 to-indigo-100 border-pink-200',
    neon: 'bg-gradient-to-br from-slate-900 to-slate-800 border-indigo-500 text-white',
    ocean: 'bg-gradient-to-br from-cyan-50 to-blue-100 border-cyan-200',
    forest: 'bg-gradient-to-br from-green-50 to-emerald-100 border-green-200'
};

// --- COMPONENTS ---

export const Flashcards = () => {
    const { gainXP, stats } = useGamification();
    
    // VIEW STATE: 'library' | 'generator' | 'session' | 'summary'
    const [viewMode, setViewMode] = useState<'library' | 'generator' | 'session' | 'summary'>('library');
    
    // DATA STATE
    const [decks, setDecks] = useState<FlashcardDeck[]>([]);
    const [activeDeck, setActiveDeck] = useState<FlashcardDeck | null>(null);
    const [sessionQueue, setSessionQueue] = useState<Flashcard[]>([]);
    const [sessionMode, setSessionMode] = useState<'classic' | 'speed'>('classic');
    
    // GENERATOR STATE
    const [genTopic, setGenTopic] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    // SESSION STATE
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [sessionResults, setSessionResults] = useState<{correct: number, incorrect: number, xp: number}>({correct:0, incorrect:0, xp:0});
    const [combo, setCombo] = useState(0);
    const [timer, setTimer] = useState(10); // For speed mode

    // Load Decks
    useEffect(() => {
        const savedDecks = getDecksFromStorage();
        setDecks(savedDecks);
    }, []);

    // Timer for Speed Mode
    useEffect(() => {
        let interval: any;
        if (viewMode === 'session' && sessionMode === 'speed' && !isFlipped && timer > 0) {
            interval = setInterval(() => setTimer(t => t - 1), 1000);
        } else if (timer === 0 && viewMode === 'session' && sessionMode === 'speed' && !isFlipped) {
            handleRate(0); // Auto fail
        }
        return () => clearInterval(interval);
    }, [timer, viewMode, sessionMode, isFlipped]);

    // --- ACTIONS ---

    const handleGenerateDeck = async () => {
        if (!genTopic.trim()) return;
        setIsGenerating(true);
        const newDeck = await generateFlashcardDeck(genTopic);
        if (newDeck) {
            saveDeckToStorage(newDeck);
            setDecks(getDecksFromStorage());
            setViewMode('library');
        } else {
            alert("Error generando mazo. Intenta de nuevo.");
        }
        setIsGenerating(false);
    };

    const deleteDeck = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm("¿Borrar este mazo?")) {
            const updated = deleteDeckFromStorage(id);
            setDecks(updated);
        }
    };

    const startSession = (deck: FlashcardDeck, mode: 'classic' | 'speed') => {
        // Filter cards due for review OR new cards
        // For demo simplicity: Take all cards sorted by urgency, max 20
        const now = Date.now();
        const dueCards = deck.cards
            .filter(c => c.nextReview <= now || c.mastery === 'new')
            .sort((a,b) => a.nextReview - b.nextReview)
            .slice(0, 20);

        if (dueCards.length === 0) {
            alert("¡Todo repasado por hoy! Vuelve mañana o usa el modo práctica libre.");
            // Optional: Allow forced review
            const allCards = [...deck.cards].sort(() => Math.random() - 0.5).slice(0, 10);
            setSessionQueue(allCards);
        } else {
            setSessionQueue(dueCards);
        }
        
        setActiveDeck(deck);
        setSessionMode(mode);
        setCurrentIndex(0);
        setIsFlipped(false);
        setSessionResults({correct: 0, incorrect: 0, xp: 0});
        setCombo(0);
        setTimer(mode === 'speed' ? 10 : 0);
        setViewMode('session');
    };

    const handleFlip = () => {
        setIsFlipped(true);
    };

    const handleRate = (quality: number) => {
        // Update Card Logic
        const currentCard = sessionQueue[currentIndex];
        const updatedCard = calculateNextReview(currentCard, quality);
        
        // Update Deck in Storage (Optimistic)
        if (activeDeck) {
            const updatedCards = activeDeck.cards.map(c => c.id === updatedCard.id ? updatedCard : c);
            const updatedDeck = { ...activeDeck, cards: updatedCards, lastStudied: Date.now() };
            saveDeckToStorage(updatedDeck);
            setActiveDeck(updatedDeck); // Local state update
            // Also update main deck list silently
            const newDecks = decks.map(d => d.id === updatedDeck.id ? updatedDeck : d);
            setDecks(newDecks);
            localStorage.setItem('lumi_flashcard_decks', JSON.stringify(newDecks));
        }

        // Gamification
        const isSuccess = quality >= 3;
        const newCombo = isSuccess ? combo + 1 : 0;
        setCombo(newCombo);
        
        const xpGain = isSuccess ? (10 + (newCombo * 2)) : 5;
        gainXP(xpGain);

        setSessionResults(prev => ({
            correct: prev.correct + (isSuccess ? 1 : 0),
            incorrect: prev.incorrect + (isSuccess ? 0 : 1),
            xp: prev.xp + xpGain
        }));

        // Next Card
        if (currentIndex < sessionQueue.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setIsFlipped(false);
            setTimer(10); // Reset speed timer
        } else {
            setViewMode('summary');
        }
    };

    // --- RENDERERS ---

    const renderLibrary = () => (
        <div className="max-w-6xl mx-auto space-y-8 animate-[fadeIn_0.5s_ease-out]">
            <div className="text-center mb-10">
                <div className="inline-block p-4 bg-orange-100 rounded-full mb-4 rotate-3 shadow-lg">
                    <Layers className="w-10 h-10 text-orange-500" />
                </div>
                <h1 className="text-4xl font-black text-gray-800 font-logo mb-2">LumiCards</h1>
                <p className="text-gray-500 font-medium text-lg">Entrena tu cerebro con Repetición Espaciada y Gamificación</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Create New Deck Card */}
                <button 
                    onClick={() => setViewMode('generator')}
                    className="aspect-[4/3] rounded-3xl border-4 border-dashed border-gray-200 hover:border-orange-300 hover:bg-orange-50/50 flex flex-col items-center justify-center gap-3 transition-all group"
                >
                    <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Plus className="w-8 h-8 text-gray-400 group-hover:text-orange-500" />
                    </div>
                    <span className="font-bold text-gray-400 group-hover:text-orange-600">Crear Nuevo Mazo IA</span>
                </button>

                {/* Existing Decks */}
                {decks.map(deck => {
                    const masteredCount = deck.cards.filter(c => c.mastery === 'mastered' || c.mastery === 'legendary').length;
                    const progress = (masteredCount / deck.cards.length) * 100;

                    return (
                        <div key={deck.id} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-xl transition-all relative group overflow-hidden">
                            <div className={`absolute top-0 left-0 w-full h-1.5 ${THEMES[deck.theme] || 'bg-gray-200'}`}></div>
                            
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-xl font-bold text-gray-800 line-clamp-1">{deck.title}</h3>
                                <button onClick={(e) => deleteDeck(deck.id, e)} className="text-gray-300 hover:text-red-400 p-1"><Trash2 size={16}/></button>
                            </div>
                            
                            <div className="flex items-center gap-2 mb-6">
                                <span className="text-xs font-bold px-2 py-1 bg-gray-100 rounded text-gray-500 uppercase">{deck.cards.length} Cartas</span>
                                <span className="text-xs font-bold px-2 py-1 bg-gray-100 rounded text-gray-500 uppercase">Tema: {deck.topic}</span>
                            </div>

                            <div className="mb-6">
                                <div className="flex justify-between text-xs font-bold text-gray-400 mb-1">
                                    <span>Maestría</span>
                                    <span>{Math.round(progress)}%</span>
                                </div>
                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-green-400 transition-all" style={{width: `${progress}%`}}></div>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button onClick={() => startSession(deck, 'classic')} className="flex-1 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-colors flex items-center justify-center gap-2 text-sm">
                                    <Brain size={16}/> Repaso
                                </button>
                                <button onClick={() => startSession(deck, 'speed')} className="flex-1 py-3 bg-orange-100 text-orange-600 rounded-xl font-bold hover:bg-orange-200 transition-colors flex items-center justify-center gap-2 text-sm">
                                    <Zap size={16}/> Speed
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );

    const renderGenerator = () => (
        <div className="h-full flex flex-col items-center justify-center p-6 animate-[slideUp_0.3s_ease-out]">
            <div className="max-w-lg w-full bg-white rounded-[2.5rem] p-8 shadow-2xl border border-gray-100 text-center relative overflow-hidden">
                <button onClick={() => setViewMode('library')} className="absolute top-6 left-6 text-gray-400 hover:text-gray-800"><ArrowRight className="rotate-180"/></button>
                
                <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-pink-500 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg transform rotate-3">
                    <Sparkles className="text-white w-10 h-10" />
                </div>
                
                <h2 className="text-3xl font-black text-gray-800 mb-2">Generador Neural</h2>
                <p className="text-gray-500 mb-8">Lumi creará cartas inteligentes con ganchos de memoria visuales.</p>

                <input 
                    type="text"
                    value={genTopic}
                    onChange={(e) => setGenTopic(e.target.value)}
                    placeholder="¿Qué quieres memorizar? (ej: Verbos en Inglés)"
                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 text-lg font-bold text-center mb-6 focus:border-orange-300 outline-none"
                    autoFocus
                />

                <button 
                    onClick={handleGenerateDeck}
                    disabled={isGenerating || !genTopic.trim()}
                    className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold text-lg hover:bg-black transition-all shadow-xl flex items-center justify-center gap-3 disabled:opacity-70"
                >
                    {isGenerating ? (
                        <>Generando Mazo <Sparkles className="animate-spin"/></>
                    ) : (
                        <>Crear Mazo Mágico <Zap className="fill-current"/></>
                    )}
                </button>
            </div>
        </div>
    );

    const renderSession = () => {
        if (!activeDeck || sessionQueue.length === 0) return null;
        const card = sessionQueue[currentIndex];
        
        return (
            <div className="h-full flex flex-col max-w-2xl mx-auto relative">
                
                {/* Header Info */}
                <div className="flex justify-between items-center mb-6 px-4">
                    <button onClick={() => setViewMode('library')} className="p-2 bg-white rounded-full shadow-sm hover:bg-gray-50"><X size={20}/></button>
                    
                    <div className="flex items-center gap-4">
                        {sessionMode === 'speed' && (
                            <div className="flex items-center gap-2 bg-red-50 text-red-500 px-3 py-1 rounded-full border border-red-100 font-bold font-mono">
                                <Clock size={16}/> {timer}s
                            </div>
                        )}
                        <div className="flex items-center gap-2 bg-orange-50 text-orange-500 px-3 py-1 rounded-full border border-orange-100 font-bold">
                            <Flame size={16} className="fill-current"/> {combo}
                        </div>
                    </div>

                    <div className="text-xs font-bold text-gray-400">
                        {currentIndex + 1} / {sessionQueue.length}
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-1.5 bg-gray-200 rounded-full mb-8">
                    <div className="h-full bg-orange-400 transition-all duration-300" style={{width: `${((currentIndex)/sessionQueue.length)*100}%`}}></div>
                </div>

                {/* THE CARD */}
                <div className="flex-1 perspective-[1200px] relative mb-24 cursor-pointer group" onClick={!isFlipped ? handleFlip : undefined}>
                    <div className={`w-full h-full relative transition-all duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
                        
                        {/* FRONT FACE */}
                        <div className="absolute inset-0 bg-white rounded-[2.5rem] shadow-2xl border-b-8 border-gray-100 p-8 md:p-12 flex flex-col items-center justify-center text-center backface-hidden">
                            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Pregunta</div>
                            <h2 className="text-3xl md:text-4xl font-black text-gray-800 leading-tight">
                                {card.front}
                            </h2>
                            <p className="mt-8 text-gray-400 text-sm font-medium animate-pulse">Toca para voltear</p>
                        </div>

                        {/* BACK FACE */}
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-white rounded-[2.5rem] shadow-2xl border-b-8 border-indigo-100 p-8 md:p-12 flex flex-col items-center justify-center text-center backface-hidden rotate-y-180">
                            <div className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-4">Respuesta</div>
                            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 leading-tight mb-6">
                                {card.back}
                            </h2>
                            
                            {/* Memory Hooks */}
                            <div className="bg-white/60 p-4 rounded-xl border border-indigo-100 w-full max-w-sm">
                                {card.visualHook && (
                                    <div className="flex items-start gap-3 mb-3 text-left">
                                        <Eye className="w-5 h-5 text-purple-500 shrink-0 mt-0.5"/>
                                        <p className="text-sm text-gray-600 italic">"{card.visualHook}"</p>
                                    </div>
                                )}
                                {card.memoryTip && (
                                    <div className="flex items-start gap-3 text-left">
                                        <Lightbulb className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5"/>
                                        <p className="text-sm text-gray-600">{card.memoryTip}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* CONTROLS */}
                <div className="absolute bottom-6 left-0 right-0 px-6">
                    {!isFlipped ? (
                        <button onClick={handleFlip} className="w-full py-5 bg-gray-900 text-white rounded-2xl font-bold shadow-xl hover:bg-black transition-all">
                            Mostrar Respuesta
                        </button>
                    ) : (
                        <div className="grid grid-cols-4 gap-3">
                            <button onClick={() => handleRate(0)} className="flex flex-col items-center justify-center py-3 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition-colors">
                                <RotateCcw size={20} className="mb-1"/>
                                <span className="text-xs font-bold">Repetir</span>
                            </button>
                            <button onClick={() => handleRate(3)} className="flex flex-col items-center justify-center py-3 bg-orange-100 text-orange-600 rounded-xl hover:bg-orange-200 transition-colors">
                                <span className="text-lg font-black mb-1">😐</span>
                                <span className="text-xs font-bold">Difícil</span>
                            </button>
                            <button onClick={() => handleRate(4)} className="flex flex-col items-center justify-center py-3 bg-blue-100 text-blue-600 rounded-xl hover:bg-blue-200 transition-colors">
                                <span className="text-lg font-black mb-1">🙂</span>
                                <span className="text-xs font-bold">Bien</span>
                            </button>
                            <button onClick={() => handleRate(5)} className="flex flex-col items-center justify-center py-3 bg-green-100 text-green-600 rounded-xl hover:bg-green-200 transition-colors">
                                <span className="text-lg font-black mb-1">😁</span>
                                <span className="text-xs font-bold">Fácil</span>
                            </button>
                        </div>
                    )}
                </div>

            </div>
        );
    };

    const renderSummary = () => (
        <div className="h-full flex flex-col items-center justify-center p-6 animate-[fadeIn_0.5s_ease-out]">
            <div className="bg-white rounded-[2.5rem] p-10 shadow-2xl text-center max-w-md w-full relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-400 to-pink-500"></div>
                
                <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Target className="w-12 h-12 text-yellow-600" />
                </div>
                
                <h2 className="text-3xl font-black text-gray-800 mb-2">¡Sesión Completada!</h2>
                <p className="text-gray-500 mb-8">Tu cerebro es un poco más fuerte ahora.</p>

                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="p-4 bg-green-50 rounded-2xl border border-green-100">
                        <div className="text-3xl font-black text-green-600">{sessionResults.correct}</div>
                        <div className="text-xs font-bold text-green-400 uppercase">Aciertos</div>
                    </div>
                    <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                        <div className="text-3xl font-black text-indigo-600">+{sessionResults.xp}</div>
                        <div className="text-xs font-bold text-indigo-400 uppercase">XP Ganado</div>
                    </div>
                </div>

                <button onClick={() => setViewMode('library')} className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold shadow-xl hover:bg-black transition-all">
                    Volver a la Librería
                </button>
            </div>
        </div>
    );

    return (
        <div className="h-full">
            {viewMode === 'library' && renderLibrary()}
            {viewMode === 'generator' && renderGenerator()}
            {viewMode === 'session' && renderSession()}
            {viewMode === 'summary' && renderSummary()}
        </div>
    );
};
