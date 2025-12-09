


import React, { useState, useEffect } from 'react';
import { CalendarEvent, CalendarEventType, StudyPlanConfig } from '../types';
import { generateStudyPlanHtml, analyzeStudyMaterial } from '../services/geminiService';
import { 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, 
  Clock, BookOpen, AlertCircle, Sparkles, CheckCircle, 
  Printer, Download, Save, X, BrainCircuit, FileText, Loader2,
  Upload, Image as ImageIcon
} from 'lucide-react';

// --- STYLES & UTILS ---
const eventColors: Record<CalendarEventType, string> = {
  exam: 'bg-candy-pink text-white shadow-pink-200',
  task: 'bg-candy-mint text-teal-800 shadow-teal-100',
  review: 'bg-candy-yellow text-orange-800 shadow-orange-100',
  project: 'bg-candy-lilac text-purple-800 shadow-purple-100',
  study_session: 'bg-candy-sky text-blue-800 shadow-blue-100',
};

const LOADING_QUOTES = [
  "Conectando neuronas artificiales... 🧠",
  "Analizando la mejor ruta hacia tu 10... 🚀",
  "Organizando tu tiempo para que tengas vida social... ☕",
  "Consultando con los expertos en la materia... 📚",
  "Estructurando el éxito, paso a paso... ✨",
  "Cargando motivación extra... 🔋",
  "Diseñando tu estrategia ganadora... 🏆"
];

// --- BACKGROUND ANIMATION ---
const PastelBlobBackground = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10 rounded-[2.5rem]">
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-candy-pink/10 rounded-full blur-[100px] animate-[pulse_10s_infinite]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-candy-sky/10 rounded-full blur-[100px] animate-[pulse_12s_infinite_2s]" />
      <div className="absolute top-[30%] right-[20%] w-[300px] h-[300px] bg-candy-yellow/10 rounded-full blur-[80px] animate-[pulse_15s_infinite_4s]" />
  </div>
);

// --- COMPONENTES ---

export const Planner = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week'>('month');
  const [events, setEvents] = useState<CalendarEvent[]>([
     { id: '1', title: 'Examen de Mates', date: '2025-11-20', type: 'exam', completed: false },
     { id: '2', title: 'Entrega Historia', date: '2025-11-15', type: 'task', completed: false },
     { id: '3', title: 'Repaso Biología', date: '2025-11-10', type: 'review', completed: true },
  ]);
  
  // Modal States
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventType, setNewEventType] = useState<CalendarEventType>('study_session');

  // Study Plan States
  const [isPlanConfigOpen, setIsPlanConfigOpen] = useState(false);
  const [planConfig, setPlanConfig] = useState<StudyPlanConfig>({
      subject: '', examTitle: '', examDate: '', difficulty: 'normal', dailyMinutes: 60
  });
  const [planLoading, setPlanLoading] = useState(false);
  const [analyzingFile, setAnalyzingFile] = useState(false); // New state for file analysis
  const [generatedHtml, setGeneratedHtml] = useState<string | null>(null);
  const [isPlanResultOpen, setIsPlanResultOpen] = useState(false);
  
  // Loading Animation State
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);

  // Rotate quotes while loading
  useEffect(() => {
    let interval: any;
    if (planLoading) {
        interval = setInterval(() => {
            setCurrentQuoteIndex(prev => (prev + 1) % LOADING_QUOTES.length);
        }, 3000);
    }
    return () => clearInterval(interval);
  }, [planLoading]);

  // --- CALENDAR LOGIC ---
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => {
     const day = new Date(year, month, 1).getDay();
     return day === 0 ? 6 : day - 1; // Ajuste Lunes (0) - Domingo (6)
  };

  const changeMonth = (delta: number) => {
     setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + delta, 1));
  };

  const handleDayClick = (dayStr: string) => {
     setSelectedDay(dayStr);
     setIsEventModalOpen(true);
  };

  const addEvent = () => {
     if (!selectedDay || !newEventTitle.trim()) return;
     const newEvent: CalendarEvent = {
         id: Date.now().toString(),
         title: newEventTitle,
         date: selectedDay,
         type: newEventType,
         completed: false
     };
     setEvents([...events, newEvent]);
     setNewEventTitle('');
     setIsEventModalOpen(false);
  };

  const openStudyPlanner = (evt: CalendarEvent) => {
      // Pre-fill config if clicking on an exam
      setPlanConfig(prev => ({
          ...prev, 
          examTitle: evt.title,
          examDate: evt.date
      }));
      setIsEventModalOpen(false);
      setIsPlanConfigOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setAnalyzingFile(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
          const base64Data = (reader.result as string).split(',')[1];
          const analysis = await analyzeStudyMaterial(base64Data, file.type);
          
          if (analysis) {
              setPlanConfig(prev => ({
                  ...prev,
                  subject: analysis.subject || prev.subject,
                  examTitle: analysis.topics || prev.examTitle
              }));
          } else {
              alert("No pudimos leer el archivo. Intenta con una imagen más clara o un PDF legible.");
          }
          setAnalyzingFile(false);
      };
      reader.readAsDataURL(file);
  };

  const generatePlan = async () => {
      setPlanLoading(true);
      // Close config immediately so we see the full screen loader
      setIsPlanConfigOpen(false);
      
      try {
        const html = await generateStudyPlanHtml(planConfig);
        setGeneratedHtml(html);
        setIsPlanResultOpen(true); // Open result screen
      } catch (error) {
        setGeneratedHtml("<p>Hubo un error generando el plan. Intenta de nuevo.</p>");
        setIsPlanResultOpen(true);
      } finally {
        setPlanLoading(false);
      }
  };

  const addToCalendarSimulated = () => {
      // Simulación: Añadir eventos visuales al calendario
      const today = new Date();
      const examDate = new Date(planConfig.examDate);
      const newEvents: CalendarEvent[] = [];
      
      let iterDate = new Date(today);
      iterDate.setDate(iterDate.getDate() + 1);

      while (iterDate < examDate) {
          if (Math.random() > 0.3) { // Añadir evento aleatorio
               newEvents.push({
                   id: 'ai-' + iterDate.getTime(),
                   title: `Estudiar: ${planConfig.examTitle}`,
                   date: iterDate.toISOString().split('T')[0],
                   type: 'study_session',
                   completed: false
               });
          }
          iterDate.setDate(iterDate.getDate() + 1);
      }
      setEvents([...events, ...newEvents]);
      setIsPlanResultOpen(false);
      alert("¡Plan añadido a tu calendario!");
  };

  const handlePrint = () => {
      if (!generatedHtml) return;
      const printWindow = window.open('', '_blank');
      if (printWindow) {
          printWindow.document.write(`
            <html>
              <head>
                <title>Plan de Estudio - ${planConfig.examTitle}</title>
                <style>
                  body { font-family: 'Nunito', sans-serif; padding: 40px; color: #333; }
                  h1 { color: #ec4899; font-size: 28px; margin-bottom: 10px; }
                  h2 { color: #6366f1; border-bottom: 2px solid #eee; padding-bottom: 10px; margin-top: 30px; font-size: 20px; }
                  p, li { font-size: 14px; line-height: 1.6; color: #555; }
                  ul { margin-left: 20px; }
                  li { margin-bottom: 8px; }
                  .header { text-align: center; margin-bottom: 40px; background: #fdf2f8; padding: 30px; border-radius: 20px; border: 1px solid #fbcfe8; }
                  .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #999; }
                </style>
              </head>
              <body>
                <div class="header">
                   <h1>${planConfig.examTitle}</h1>
                   <p>Generado por <strong>LumiLearn AI</strong></p>
                </div>
                ${generatedHtml}
                <div class="footer">
                  Plan de estudio personalizado generado el ${new Date().toLocaleDateString()}
                </div>
              </body>
            </html>
          `);
          printWindow.document.close();
          printWindow.print();
      }
  };

  // --- RENDERERS ---

  const renderMonthView = () => {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const daysInMonth = getDaysInMonth(year, month);
      const startDay = getFirstDayOfMonth(year, month);
      const days = [];

      // Padding empty days
      for (let i = 0; i < startDay; i++) {
          days.push(<div key={`empty-${i}`} className="h-24 md:h-32"></div>);
      }

      // Actual days
      for (let day = 1; day <= daysInMonth; day++) {
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const dayEvents = events.filter(e => e.date === dateStr);
          const isToday = new Date().toISOString().split('T')[0] === dateStr;

          days.push(
              <div 
                  key={day} 
                  onClick={() => handleDayClick(dateStr)}
                  className={`
                      relative group h-24 md:h-32 bg-white rounded-2xl border transition-all cursor-pointer hover:shadow-md hover:-translate-y-1 p-2 flex flex-col gap-1 overflow-hidden
                      ${isToday ? 'border-candy-pink shadow-pink-100 ring-2 ring-candy-pink/20' : 'border-gray-50 hover:border-candy-sky'}
                  `}
              >
                  <span className={`text-sm font-bold ${isToday ? 'text-candy-pink' : 'text-gray-400'}`}>{day}</span>
                  
                  {/* Event Chips */}
                  <div className="flex flex-col gap-1 overflow-y-auto custom-scrollbar">
                      {dayEvents.map(evt => (
                          <div key={evt.id} className={`text-[10px] px-2 py-1 rounded-lg font-bold truncate shadow-sm ${eventColors[evt.type]}`}>
                              {evt.title}
                          </div>
                      ))}
                      {dayEvents.length > 3 && (
                          <div className="text-[10px] text-gray-400 text-center font-bold">+{dayEvents.length - 3} más</div>
                      )}
                  </div>

                  {/* Add Button on Hover */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="bg-candy-sky text-white p-1 rounded-full shadow-sm"><Plus size={12}/></div>
                  </div>
              </div>
          );
      }

      return (
          <div className="grid grid-cols-7 gap-2 md:gap-4">
              {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => (
                  <div key={d} className="text-center text-xs font-extrabold text-gray-400 uppercase mb-2">{d}</div>
              ))}
              {days}
          </div>
      );
  };

  return (
    <div className="h-full flex flex-col space-y-6 relative">
      <PastelBlobBackground />

      {/* --- FULL SCREEN LOADING OVERLAY --- */}
      {planLoading && (
        <div className="fixed inset-0 z-[80] flex flex-col items-center justify-center p-8 bg-gradient-to-br from-candy-lilac/20 via-white/90 to-candy-sky/20 backdrop-blur-xl animate-[fadeIn_0.5s_ease-out]">
            {/* Animated Blobs for Waiting Screen */}
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-candy-pink/30 rounded-full blur-[80px] animate-[pulse_4s_infinite]" />
            <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-candy-mint/30 rounded-full blur-[80px] animate-[pulse_5s_infinite_1s]" />
            
            <div className="relative z-10 flex flex-col items-center max-w-md w-full text-center">
                {/* Central Brain Animation */}
                <div className="relative mb-10">
                    <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-xl shadow-indigo-100 animate-[bounce_3s_infinite]">
                        <BrainCircuit className="w-16 h-16 text-indigo-500 animate-pulse" />
                    </div>
                    {/* Orbiting Sparkle */}
                    <div className="absolute top-0 left-0 w-full h-full animate-[spin_4s_linear_infinite]">
                        <div className="w-8 h-8 bg-candy-yellow rounded-full absolute -top-2 left-1/2 -translate-x-1/2 flex items-center justify-center shadow-md">
                            <Sparkles className="w-4 h-4 text-orange-500 fill-current" />
                        </div>
                    </div>
                </div>

                {/* Rotating Quote */}
                <h3 className="text-2xl font-black text-gray-800 mb-4 h-16 flex items-center justify-center transition-all duration-500">
                    {LOADING_QUOTES[currentQuoteIndex]}
                </h3>
                
                {/* Progress Bar */}
                <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                    <div className="h-full bg-gradient-to-r from-candy-pink via-candy-lilac to-candy-sky animate-[shimmer_2s_infinite_linear] w-[200%] bg-[length:50%_100%]" style={{backgroundSize: '50% 100%'}}></div>
                </div>
                <p className="text-sm text-gray-400 font-bold mt-4 animate-pulse">Esto puede tomar unos segundos...</p>
            </div>
        </div>
      )}

      {/* HEADER CALENDARIO */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4 bg-white/60 backdrop-blur-md p-6 rounded-[2rem] border border-white shadow-sm">
          <div>
              <h2 className="text-4xl font-black text-gray-800 capitalize font-logo mb-1">
                  {currentDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}
              </h2>
              <div className="flex items-center gap-2 text-gray-500 font-medium text-sm">
                  <Sparkles size={16} className="text-candy-lilac"/>
                  <span>Tienes <strong className="text-candy-pink">{events.filter(e => e.date.startsWith(`${currentDate.getFullYear()}-${String(currentDate.getMonth()+1).padStart(2,'0')}`)).length} eventos</strong> este mes. ¡Planifica bien! 🧠✨</span>
              </div>
          </div>

          <div className="flex items-center gap-3">
              <button onClick={() => changeMonth(-1)} className="p-3 bg-white hover:bg-gray-50 rounded-xl border border-gray-100 shadow-sm transition-colors text-gray-600"><ChevronLeft/></button>
              <button onClick={() => changeMonth(1)} className="p-3 bg-white hover:bg-gray-50 rounded-xl border border-gray-100 shadow-sm transition-colors text-gray-600"><ChevronRight/></button>
              
              <button 
                  onClick={() => {
                      setSelectedDay(new Date().toISOString().split('T')[0]);
                      setIsEventModalOpen(true);
                  }} 
                  className="bg-candy-sky hover:bg-sky-300 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-sky-200 transition-all hover:scale-105 flex items-center gap-2"
              >
                  <Plus size={20}/> Añadir Evento
              </button>
          </div>
      </div>

      {/* GRID */}
      <div className="flex-1 bg-white/40 backdrop-blur-sm p-4 rounded-[2.5rem] border border-white/50 shadow-inner">
          {renderMonthView()}
      </div>

      {/* MODAL: EVENT DETAILS / CREATE */}
      {isEventModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
              <div className="bg-white w-full max-w-md rounded-[2rem] p-8 shadow-2xl animate-[scaleIn_0.2s_ease-out] relative">
                  <button onClick={() => setIsEventModalOpen(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600"><X/></button>
                  
                  <h3 className="text-2xl font-black text-gray-800 mb-1">Evento del Día</h3>
                  <p className="text-candy-sky font-bold mb-6">{selectedDay}</p>

                  <div className="space-y-4 mb-8 max-h-40 overflow-y-auto">
                      {events.filter(e => e.date === selectedDay).length === 0 ? (
                          <p className="text-gray-400 text-center italic py-4">No hay eventos. ¡Día libre! 🎉</p>
                      ) : (
                          events.filter(e => e.date === selectedDay).map(evt => (
                              <div key={evt.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                                  <div className="flex items-center gap-3">
                                      <div className={`w-3 h-3 rounded-full ${eventColors[evt.type].split(' ')[0]}`}></div>
                                      <span className="font-bold text-gray-700">{evt.title}</span>
                                  </div>
                                  {evt.type === 'exam' && (
                                      <button 
                                        onClick={() => openStudyPlanner(evt)}
                                        className="text-[10px] font-bold bg-indigo-100 text-indigo-600 px-2 py-1 rounded-lg hover:bg-indigo-200 transition-colors flex items-center gap-1"
                                      >
                                          <BrainCircuit size={12}/> Planificar
                                      </button>
                                  )}
                              </div>
                          ))
                      )}
                  </div>

                  <div className="border-t border-gray-100 pt-6">
                      <h4 className="font-bold text-gray-600 mb-3 text-sm uppercase">Nuevo Evento</h4>
                      <input 
                          type="text" 
                          placeholder="Título (ej: Examen Final)"
                          value={newEventTitle}
                          onChange={(e) => setNewEventTitle(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 mb-3 outline-none focus:ring-2 focus:ring-candy-sky"
                      />
                      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                          {['exam', 'task', 'review', 'project', 'study_session'].map(type => (
                              <button 
                                key={type}
                                onClick={() => setNewEventType(type as CalendarEventType)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize whitespace-nowrap transition-all border-2 ${
                                    newEventType === type 
                                    ? `border-transparent ${eventColors[type as CalendarEventType]}` 
                                    : 'bg-white border-gray-100 text-gray-400'
                                }`}
                              >
                                  {type === 'study_session' ? 'Estudio' : type}
                              </button>
                          ))}
                      </div>
                      <button onClick={addEvent} className="w-full py-3 bg-gray-800 text-white rounded-xl font-bold hover:bg-gray-900 transition-all">
                          Guardar Evento
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* SCREEN: CONFIGURAR PLAN (Reemplaza Modal) */}
      {isPlanConfigOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-candy-lilac/20 backdrop-blur-md">
              <div className="bg-white w-full max-w-2xl rounded-[2.5rem] p-8 shadow-2xl animate-[slideUp_0.4s_ease-out] relative overflow-hidden">
                   {/* Background Decor */}
                   <div className="absolute top-0 right-0 w-32 h-32 bg-candy-pink/10 rounded-bl-[100px] pointer-events-none"></div>

                   <button onClick={() => setIsPlanConfigOpen(false)} className="absolute top-8 right-8 text-gray-400 hover:text-gray-600"><X/></button>

                   <div className="text-center mb-6">
                       <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4 animate-[bounce_2s_infinite]">
                           <BrainCircuit className="w-10 h-10 text-indigo-500"/>
                       </div>
                       <h2 className="text-3xl font-black text-gray-800 mb-2">Planificación Inteligente</h2>
                       <p className="text-gray-500 font-medium">Vamos a crear el mejor plan para que saques notaza 📘✨</p>
                   </div>

                   {/* --- AI FILE UPLOAD SECTION --- */}
                   <div className="mb-8">
                       <label className={`
                           block w-full border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all group
                           ${analyzingFile ? 'bg-indigo-50 border-indigo-300 animate-pulse cursor-wait' : 'border-candy-sky hover:bg-sky-50 hover:border-sky-300'}
                       `}>
                           <div className="flex flex-col items-center justify-center gap-2">
                               {analyzingFile ? (
                                   <>
                                     <Loader2 className="w-8 h-8 text-indigo-500 animate-spin"/>
                                     <p className="text-indigo-600 font-bold text-sm">Analizando temario...</p>
                                   </>
                               ) : (
                                   <>
                                     <div className="bg-sky-100 p-3 rounded-full group-hover:scale-110 transition-transform">
                                         <Upload className="w-6 h-6 text-sky-600"/>
                                     </div>
                                     <div>
                                         <p className="font-bold text-gray-700 text-sm">Autocompletar con IA</p>
                                         <p className="text-xs text-gray-400">Sube tu PDF o Foto del temario</p>
                                     </div>
                                   </>
                               )}
                           </div>
                           <input 
                              type="file" 
                              accept="image/*,application/pdf" 
                              className="hidden" 
                              onChange={handleFileUpload}
                              disabled={analyzingFile}
                           />
                       </label>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                       <div className="space-y-2">
                           <label className="text-xs font-extrabold text-gray-400 uppercase ml-1">Asignatura</label>
                           <input 
                              type="text" 
                              value={planConfig.subject} 
                              onChange={e => setPlanConfig({...planConfig, subject: e.target.value})}
                              placeholder="Ej: Matemáticas"
                              className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 font-bold text-gray-700 outline-none focus:border-candy-sky transition-colors"
                           />
                       </div>
                       <div className="space-y-2">
                           <label className="text-xs font-extrabold text-gray-400 uppercase ml-1">Examen / Temas</label>
                           <input 
                              type="text" 
                              value={planConfig.examTitle} 
                              onChange={e => setPlanConfig({...planConfig, examTitle: e.target.value})}
                              placeholder="Ej: Derivadas e Integrales"
                              className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 font-bold text-gray-700 outline-none focus:border-candy-sky transition-colors"
                           />
                       </div>
                       <div className="space-y-2">
                           <label className="text-xs font-extrabold text-gray-400 uppercase ml-1">Fecha Examen</label>
                           <input 
                              type="date" 
                              value={planConfig.examDate} 
                              onChange={e => setPlanConfig({...planConfig, examDate: e.target.value})}
                              className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 font-bold text-gray-700 outline-none focus:border-candy-sky transition-colors"
                           />
                       </div>
                       <div className="space-y-2">
                           <label className="text-xs font-extrabold text-gray-400 uppercase ml-1">Minutos/Día</label>
                           <input 
                              type="number" 
                              value={planConfig.dailyMinutes} 
                              onChange={e => setPlanConfig({...planConfig, dailyMinutes: parseInt(e.target.value)})}
                              className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 font-bold text-gray-700 outline-none focus:border-candy-sky transition-colors"
                           />
                       </div>
                   </div>

                   <div className="space-y-2 mb-8">
                       <label className="text-xs font-extrabold text-gray-400 uppercase ml-1">Intensidad</label>
                       <div className="flex gap-4">
                           {['suave', 'normal', 'intenso'].map(lvl => (
                               <button 
                                  key={lvl}
                                  onClick={() => setPlanConfig({...planConfig, difficulty: lvl as any})}
                                  className={`flex-1 py-3 rounded-xl font-bold capitalize border-2 transition-all ${
                                      planConfig.difficulty === lvl 
                                      ? 'bg-candy-lilac/20 border-candy-lilac text-purple-700' 
                                      : 'bg-white border-gray-100 text-gray-400'
                                  }`}
                               >
                                   {lvl}
                               </button>
                           ))}
                       </div>
                   </div>

                   <button 
                      onClick={generatePlan}
                      disabled={planLoading || !planConfig.subject}
                      className="w-full py-5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-extrabold text-xl rounded-2xl shadow-xl hover:shadow-indigo-300 transition-all hover:scale-[1.02] flex items-center justify-center gap-3 disabled:opacity-50"
                   >
                       {planLoading ? <Loader2 className="animate-spin"/> : <BrainCircuit className="fill-current"/>}
                       Generar Plan con IA
                   </button>
              </div>
          </div>
      )}

      {/* SCREEN: RESULTADO PLAN (HTML View) */}
      {isPlanResultOpen && (
          <div className="fixed inset-0 z-[70] flex flex-col bg-gray-50 animate-[fadeIn_0.3s_ease-out]">
              {/* Header Result */}
              <div className="bg-white p-4 border-b border-gray-200 flex justify-between items-center shadow-sm">
                  <div className="flex items-center gap-4">
                      <button onClick={() => setIsPlanResultOpen(false)} className="p-2 hover:bg-gray-100 rounded-full"><ChevronLeft/></button>
                      <div>
                          <h2 className="text-xl font-black text-gray-800">{planConfig.examTitle}</h2>
                          <p className="text-xs text-gray-500 font-bold">Plan Generado por IA</p>
                      </div>
                  </div>
                  <div className="flex gap-2">
                      <button onClick={handlePrint} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-600 flex items-center gap-2 font-bold text-sm">
                          <Printer size={16}/> <span className="hidden sm:inline">Imprimir / PDF</span>
                      </button>
                      <button onClick={addToCalendarSimulated} className="px-4 py-2 bg-candy-pink hover:bg-pink-400 text-white rounded-xl font-bold text-sm shadow-md flex items-center gap-2">
                          <CheckCircle size={16}/> Añadir al Calendario
                      </button>
                  </div>
              </div>

              {/* HTML Viewer Container */}
              <div className="flex-1 overflow-y-auto p-6 md:p-10">
                  <div className="max-w-4xl mx-auto bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100 min-h-full">
                      {/* Avatar Motivation */}
                      <div className="flex items-center gap-4 mb-8 bg-green-50 p-4 rounded-2xl border border-green-100">
                          <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center text-2xl">💪</div>
                          <div>
                              <p className="font-bold text-green-800">¡Plan Listo!</p>
                              <p className="text-sm text-green-700">Si sigues este plan paso a paso, llegarás muy fuerte al examen. ¡Tú puedes!</p>
                          </div>
                      </div>

                      {/* Renderizado Seguro del HTML */}
                      {generatedHtml ? (
                          <div 
                            className="prose prose-lg prose-indigo max-w-none font-sans"
                            dangerouslySetInnerHTML={{ __html: generatedHtml }}
                          />
                      ) : (
                          <div className="text-center text-gray-400 py-10">
                             <p>Cargando contenido...</p>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};