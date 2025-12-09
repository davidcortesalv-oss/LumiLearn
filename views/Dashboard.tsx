

import React, { useState, useEffect } from 'react';
import { useGamification } from '../components/GamificationContext';
import { AppView } from '../types';
import { 
  Network, LayoutTemplate, Zap, 
  Flame, Calendar, ArrowRight, Sparkles,
  MessageCircle, Target, Play, Star
} from 'lucide-react';

// --- COMPONENTS ---

const GlassCard = ({ children, className = "", onClick, hoverEffect = true }: { children?: React.ReactNode, className?: string, onClick?: () => void, hoverEffect?: boolean }) => (
  <div 
    onClick={onClick}
    className={`
      relative overflow-hidden bg-white/60 backdrop-blur-xl border border-white/60 shadow-xl rounded-[2rem] 
      ${hoverEffect ? 'hover:scale-[1.02] hover:bg-white/80 hover:shadow-2xl hover:shadow-indigo-500/10 cursor-pointer' : ''}
      transition-all duration-300 ease-out
      ${className}
    `}
  >
    {children}
  </div>
);

const StatWidget = ({ icon: Icon, label, value, subtext, color, delay }: any) => (
  <div className={`flex flex-col justify-between p-5 bg-white/70 rounded-3xl border border-white shadow-sm animate-[scaleIn_0.4s_ease-out]`} style={{ animationDelay: `${delay}ms` }}>
    <div className="flex justify-between items-start mb-2">
       <div className={`p-3 rounded-2xl ${color} text-white shadow-md`}>
          <Icon size={20} fill="currentColor" />
       </div>
       {subtext && <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-full">{subtext}</span>}
    </div>
    <div>
       <p className="text-3xl font-black text-gray-800 tracking-tight">{value}</p>
       <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</p>
    </div>
  </div>
);

const DailyQuestCard = ({ quest, onComplete }: { quest: any, onComplete: () => void }) => (
  <GlassCard className="p-6 flex items-center justify-between group bg-gradient-to-r from-indigo-50/50 to-white/50">
     <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200 group-hover:rotate-6 transition-transform">
           <Target size={28} />
        </div>
        <div>
           <h3 className="text-xs font-extrabold text-indigo-400 uppercase tracking-widest mb-1">Misión Diaria</h3>
           <p className="text-lg font-bold text-gray-800 leading-none mb-1">{quest.title}</p>
           <p className="text-xs text-gray-500">{quest.description}</p>
        </div>
     </div>
     <div className="flex items-center gap-4">
        <div className="text-right hidden sm:block">
           <p className="text-xs font-bold text-gray-400">Recompensa</p>
           <p className="text-sm font-black text-yellow-500 flex items-center justify-end gap-1">
              +{quest.rewardXP} XP <Zap size={12} fill="currentColor"/>
           </p>
        </div>
        <button 
           onClick={(e) => { e.stopPropagation(); onComplete(); }}
           className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${quest.completed ? 'bg-green-500 border-green-500 text-white' : 'border-gray-200 text-gray-300 hover:border-indigo-500 hover:text-indigo-500'}`}
        >
           {quest.completed ? <Sparkles size={18} fill="currentColor"/> : <ArrowRight size={20}/>}
        </button>
     </div>
  </GlassCard>
);

const Heatmap = () => {
   // Simulated data for visual purposes
   const weeks = 12;
   const days = 7;
   return (
      <div className="flex gap-1 justify-end opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
         {Array.from({ length: weeks }).map((_, w) => (
            <div key={w} className="flex flex-col gap-1">
               {Array.from({ length: days }).map((_, d) => {
                  const intensity = Math.random();
                  let color = "bg-gray-200";
                  if (intensity > 0.85) color = "bg-indigo-500";
                  else if (intensity > 0.6) color = "bg-indigo-400";
                  else if (intensity > 0.3) color = "bg-indigo-300";
                  
                  return <div key={`${w}-${d}`} className={`w-2 h-2 rounded-sm ${color}`}></div>
               })}
            </div>
         ))}
      </div>
   )
}

export const Dashboard = () => {
  const { user, stats, setView, completeQuest } = useGamification();
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Buenos días');
    else if (hour < 20) setGreeting('Buenas tardes');
    else setGreeting('Buenas noches');
  }, []);

  const activeQuest = stats.activeQuests.find(q => !q.completed) || stats.activeQuests[0];

  return (
    <div className="min-h-full pb-20 relative">
      
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
         <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-candy-sky/20 rounded-full blur-[120px] animate-[pulse_8s_infinite]" />
         <div className="absolute bottom-[10%] left-[-10%] w-[500px] h-[500px] bg-candy-pink/15 rounded-full blur-[100px] animate-[pulse_10s_infinite_2s]" />
      </div>

      <div className="max-w-[1600px] mx-auto space-y-8">
      
        {/* 1. HEADER & GREETING */}
        <header className="flex flex-col md:flex-row justify-between items-end gap-6 animate-[fadeIn_0.5s_ease-out]">
           <div className="flex items-center gap-6">
              <div className="relative group">
                 <div className="w-20 h-20 rounded-[2rem] bg-white p-1 shadow-lg shadow-indigo-100 transform group-hover:rotate-3 transition-transform">
                    {user?.avatar ? (
                        <img src={user.avatar} alt="User" className="w-full h-full object-cover rounded-[1.8rem]" />
                    ) : (
                        <div className="w-full h-full bg-candy-lilac rounded-[1.8rem] flex items-center justify-center text-3xl">😎</div>
                    )}
                 </div>
                 <div className="absolute -bottom-2 -right-2 bg-green-500 border-4 border-white w-6 h-6 rounded-full"></div>
              </div>
              <div>
                 <p className="text-gray-400 font-bold text-lg mb-0.5">{greeting},</p>
                 <h1 className="text-4xl md:text-5xl font-black text-gray-800 tracking-tight">
                    {user?.name?.split(' ')[0] || 'Estudiante'}
                 </h1>
              </div>
           </div>

           <div className="hidden md:block text-right">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Constancia de Estudio</p>
              <Heatmap />
           </div>
        </header>

        {/* 2. STATS ORBIT (Reduced Size) */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
           <StatWidget icon={Flame} label="Racha Actual" value={`${stats.streak} Días`} color="bg-orange-500" delay={100} />
           <StatWidget icon={Zap} label="Energía" value={`${stats.energy}%`} color="bg-yellow-400" delay={200} />
           <StatWidget icon={Star} label="Nivel" value={stats.level} subtext="Siguiente: +450 XP" color="bg-blue-500" delay={300} />
        </div>

        {/* 3. MAIN BENTO GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 auto-rows-[minmax(180px,auto)]">
            
            {/* LARGE: Daily Quest */}
            <div className="md:col-span-2 lg:col-span-2">
               {activeQuest ? (
                   <DailyQuestCard quest={activeQuest} onComplete={() => completeQuest(activeQuest.id)} />
               ) : (
                   <GlassCard className="p-6 flex items-center justify-center bg-gray-50 border-dashed border-2 border-gray-200">
                       <p className="text-gray-400 font-bold">¡Todas las misiones completadas! 🎉</p>
                   </GlassCard>
               )}
            </div>

            {/* TALL: AI Tutor */}
            <GlassCard 
               className="md:row-span-2 bg-gradient-to-b from-pink-50 to-white group"
               onClick={() => setView(AppView.CHAT)}
            >
               <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
               <div className="p-6 h-full flex flex-col relative z-10">
                  <div className="w-14 h-14 rounded-2xl bg-candy-pink text-white flex items-center justify-center shadow-lg shadow-pink-200 mb-6 group-hover:scale-110 transition-transform">
                     <MessageCircle size={28} />
                  </div>
                  <h3 className="text-2xl font-black text-gray-800 mb-2">Tutor IA</h3>
                  <p className="text-gray-500 font-medium mb-8 leading-relaxed">
                     Resuelve dudas, pide explicaciones y chatea 24/7.
                  </p>
                  
                  <div className="mt-auto space-y-3">
                     <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 shadow-sm text-xs font-bold text-gray-600">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        Matemáticas
                     </div>
                     <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 shadow-sm text-xs font-bold text-gray-600">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        Historia
                     </div>
                  </div>
               </div>
            </GlassCard>

            {/* SQUARE: Concept Maps */}
            <GlassCard 
               className="bg-gradient-to-br from-sky-50 to-white group"
               onClick={() => setView(AppView.MAP_GENERATOR)}
            >
               <div className="p-6 h-full flex flex-col justify-between">
                   <div className="flex justify-between items-start">
                       <div className="w-12 h-12 rounded-xl bg-candy-sky text-white flex items-center justify-center shadow-md shadow-sky-100 group-hover:rotate-12 transition-transform">
                          <Network size={24} />
                       </div>
                       <ArrowRight className="text-gray-300 group-hover:text-sky-500 group-hover:translate-x-1 transition-all" />
                   </div>
                   <div>
                       <h3 className="text-xl font-bold text-gray-800">Mapas Mentales</h3>
                       <p className="text-xs text-gray-500 font-bold mt-1">Generación visual</p>
                   </div>
               </div>
            </GlassCard>
            
            {/* SQUARE: Quiz Arena */}
            <GlassCard 
               className="bg-gradient-to-br from-yellow-50 to-white group"
               onClick={() => setView(AppView.QUIZ)}
            >
               <div className="p-6 h-full flex flex-col justify-between">
                   <div className="flex justify-between items-start">
                       <div className="w-12 h-12 rounded-xl bg-candy-yellow text-yellow-800 flex items-center justify-center shadow-md shadow-yellow-100 group-hover:scale-110 transition-transform">
                          <Zap size={24} fill="currentColor" />
                       </div>
                       <ArrowRight className="text-gray-300 group-hover:text-yellow-600 group-hover:translate-x-1 transition-all" />
                   </div>
                   <div>
                       <h3 className="text-xl font-bold text-gray-800">Quiz Arena</h3>
                       <p className="text-xs text-gray-500 font-bold mt-1">Gana XP compitiendo</p>
                   </div>
               </div>
            </GlassCard>

            {/* WIDE: Story Mode */}
            <div className="md:col-span-2 lg:col-span-2">
               <GlassCard 
                  className="h-full bg-gray-900 text-white overflow-hidden group relative"
                  onClick={() => setView(AppView.STORY)}
               >
                  <div className="absolute inset-0 opacity-30 bg-gradient-to-r from-purple-900 via-indigo-900 to-gray-900"></div>
                  <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-purple-500 rounded-full blur-[100px] group-hover:opacity-80 transition-opacity"></div>
                  
                  <div className="relative z-10 p-8 flex flex-col md:flex-row items-center justify-between gap-6 h-full">
                     <div className="flex-1">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[10px] font-bold uppercase tracking-wider mb-4">
                           <Sparkles size={12} className="text-yellow-400" /> Nuevo
                        </div>
                        <h3 className="text-3xl font-black mb-2">Modo Película</h3>
                        <p className="text-gray-300 text-sm max-w-sm">
                           Convierte tus apuntes aburridos en documentales narrados por IA con estilo "sketch".
                        </p>
                     </div>
                     <div className="w-16 h-16 rounded-full bg-white text-gray-900 flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.3)] group-hover:scale-110 transition-transform cursor-pointer">
                        <Play size={28} fill="currentColor" className="ml-1" />
                     </div>
                  </div>
               </GlassCard>
            </div>

            {/* SQUARE: Planner */}
            <GlassCard onClick={() => setView(AppView.PLANNER)}>
               <div className="p-6 h-full flex flex-col justify-between items-center text-center hover:bg-indigo-50/50 transition-colors">
                   <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mb-2">
                      <Calendar size={24} />
                   </div>
                   <h3 className="font-bold text-gray-700">Planificador</h3>
               </div>
            </GlassCard>

             {/* SQUARE: Infographic */}
             <GlassCard onClick={() => setView(AppView.INFOGRAPHIC)}>
               <div className="p-6 h-full flex flex-col justify-between items-center text-center hover:bg-teal-50/50 transition-colors">
                   <div className="w-12 h-12 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center mb-2">
                      <LayoutTemplate size={24} />
                   </div>
                   <h3 className="font-bold text-gray-700">Infografías</h3>
               </div>
            </GlassCard>

        </div>
      </div>
    </div>
  );
};