
import React, { useState, useEffect, useRef } from 'react';
import { useGamification } from '../components/GamificationContext';
import { AppView } from '../types';
import { Logo } from '../components/Logo';
import { 
  X, Clock, Timer, Music, Play, Pause, 
  Volume2, CloudRain, Wind, Waves, Trees, 
  RotateCcw, Zap, Sun
} from 'lucide-react';

// --- CONFIGURATION ---

const QUOTES = [
  "La concentración es el secreto de la fuerza.",
  "El éxito es la suma de pequeños esfuerzos.",
  "Hazlo. Y si te da miedo, hazlo con miedo.",
  "No cuentes los días, haz que los días cuenten.",
  "Tu futuro depende de lo que hagas hoy.",
  "Silencia tu mente, despierta tu alma.",
  "Un paso a la vez, pero siempre adelante."
];

type BackgroundType = 'minimal' | 'dynamic' | 'rain' | 'forest' | 'sunset';
type SoundType = 'none' | 'rain' | 'white_noise' | 'waves' | 'forest';

const BACKGROUNDS: Record<BackgroundType, { class: string, label: string }> = {
  minimal: { class: 'bg-black', label: 'Void' },
  dynamic: { class: 'bg-gradient-to-br from-gray-900 via-indigo-950 to-black animate-[pulse_8s_ease-in-out_infinite]', label: 'Aura' },
  rain: { class: 'bg-gradient-to-b from-slate-900 to-slate-950', label: 'Rain' },
  forest: { class: 'bg-gradient-to-b from-green-950 to-black', label: 'Zen' },
  sunset: { class: 'bg-gradient-to-br from-orange-950 via-slate-900 to-black', label: 'Dusk' },
};

const SOUNDS: Record<SoundType, { label: string, url: string }> = {
  none: { label: 'Silencio', url: '' },
  rain: { label: 'Lluvia Suave', url: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3' },
  white_noise: { label: 'Ruido Blanco', url: 'https://cdn.pixabay.com/download/audio/2021/08/09/audio_03d6e32043.mp3' },
  waves: { label: 'Olas', url: 'https://cdn.pixabay.com/download/audio/2022/02/07/audio_6632f91345.mp3' },
  forest: { label: 'Bosque', url: 'https://cdn.pixabay.com/download/audio/2021/09/06/audio_3622442d87.mp3' },
};

// --- SUB-COMPONENTS ---

const BigNumber = ({ value, label, dim = false }: { value: string | number, label?: string, dim?: boolean }) => (
  <div className="flex flex-col items-center justify-center">
    <span className={`text-[12vw] md:text-[14rem] font-[system-ui] font-medium tracking-tighter leading-none transition-colors duration-500 tabular-nums ${dim ? 'text-white/30' : 'text-white'}`}>
      {String(value).padStart(2, '0')}
    </span>
    {label && <span className="text-xs font-bold tracking-[0.4em] text-white/40 uppercase mt-4">{label}</span>}
  </div>
);

const Separator = () => (
  <div className="text-[8vw] md:text-[10rem] font-[system-ui] font-light text-white/20 leading-none pb-8 select-none">:</div>
);

// --- MAIN COMPONENT ---

export const FocusMode = () => {
  const { setView } = useGamification();
  
  // View State
  const [activeSpace, setActiveSpace] = useState<'clock' | 'timer' | 'sound'>('timer');
  const [bg, setBg] = useState<BackgroundType>('minimal');
  
  // Settings State
  const [is24Hour, setIs24Hour] = useState(true);
  const [quoteIndex, setQuoteIndex] = useState(0);

  // Time State
  const [now, setNow] = useState(new Date());

  // Timer State
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [timerActive, setTimerActive] = useState(false);
  const [initialTime, setInitialTime] = useState(25 * 60);

  // Sound State
  const [activeSound, setActiveSound] = useState<SoundType>('none');
  const [volume, setVolume] = useState(0.5);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // --- LOGIC ---

  // Clock Ticker
  useEffect(() => {
    const i = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(i);
  }, []);

  // Timer Ticker
  useEffect(() => {
    let i: any;
    if (timerActive && timeLeft > 0) {
      i = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (timeLeft === 0) {
      setTimerActive(false);
    }
    return () => clearInterval(i);
  }, [timerActive, timeLeft]);

  // Quote Rotation
  useEffect(() => {
    const i = setInterval(() => setQuoteIndex(prev => (prev + 1) % QUOTES.length), 20000);
    return () => clearInterval(i);
  }, []);

  // Audio Engine
  useEffect(() => {
    if (activeSound === 'none') {
      audioRef.current?.pause();
      audioRef.current = null;
      return;
    }
    if (!audioRef.current || audioRef.current.src !== SOUNDS[activeSound].url) {
      audioRef.current?.pause();
      audioRef.current = new Audio(SOUNDS[activeSound].url);
      audioRef.current.loop = true;
    }
    audioRef.current.volume = volume;
    audioRef.current.play().catch(() => {}); // Catch autoplay block
  }, [activeSound]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  // Helpers
  const formatTime = () => {
    let h = now.getHours();
    const m = now.getMinutes();
    const s = now.getSeconds();
    const ampm = h >= 12 ? 'PM' : 'AM';
    if (!is24Hour) h = h % 12 || 12;
    return { h, m, s, ampm };
  };

  const formatTimer = () => {
    const m = Math.floor(timeLeft / 60);
    const s = timeLeft % 60;
    return { m, s };
  };

  const toggleTimer = () => setTimerActive(!timerActive);
  const resetTimer = () => {
    setTimerActive(false);
    setTimeLeft(initialTime);
  };
  const setTimerDuration = (min: number) => {
    setTimerActive(false);
    setInitialTime(min * 60);
    setTimeLeft(min * 60);
  };

  return (
    <div className={`fixed inset-0 z-[100] transition-colors duration-1000 ${BACKGROUNDS[bg].class} flex flex-col font-sans select-none overflow-hidden`}>
      
      {/* Rain CSS Overlay */}
      {bg === 'rain' && <div className="absolute inset-0 bg-[url('https://upload.wikimedia.org/wikipedia/commons/4/42/Rain_gif.gif')] bg-cover opacity-10 pointer-events-none mix-blend-overlay"></div>}

      {/* --- HEADER --- */}
      <div className="relative z-20 flex justify-between items-center p-8">
        <div className="opacity-80 hover:opacity-100 transition-opacity">
           <Logo light={true} className="w-10 h-10" showText={true} />
        </div>
        <button onClick={() => setView(AppView.DASHBOARD)} className="group p-2">
           <X className="text-white/40 group-hover:text-white transition-colors w-8 h-8" />
        </button>
      </div>

      {/* --- MAIN STAGE --- */}
      <div className="flex-1 relative z-10 flex flex-col items-center justify-center w-full">
        
        {/* CLOCK SPACE */}
        {activeSpace === 'clock' && (
          <div className="flex flex-col items-center animate-[fadeIn_0.5s_ease-out]">
            <div className="flex items-center gap-4 md:gap-12">
               <BigNumber value={formatTime().h} label={is24Hour ? 'HORAS' : ''} />
               <Separator />
               <BigNumber value={formatTime().m} label="MINUTOS" />
            </div>
            {!is24Hour && <span className="text-2xl font-bold text-white/30 tracking-[0.5em] mt-[-20px]">{formatTime().ampm}</span>}
            
            <button 
               onClick={() => setIs24Hour(!is24Hour)} 
               className="mt-12 px-6 py-2 border border-white/10 rounded-full text-white/40 text-xs font-bold tracking-widest hover:bg-white/5 hover:text-white transition-all"
            >
               {is24Hour ? 'CAMBIAR A 12H' : 'CAMBIAR A 24H'}
            </button>
          </div>
        )}

        {/* TIMER SPACE */}
        {activeSpace === 'timer' && (
           <div className="flex flex-col items-center animate-[fadeIn_0.5s_ease-out] w-full">
              {/* Numbers */}
              <div className="flex items-center justify-center gap-4 md:gap-16 w-full mb-16 relative">
                 <BigNumber value={formatTimer().m} label="MIN" dim={!timerActive && timeLeft !== initialTime} />
                 <Separator />
                 <BigNumber value={formatTimer().s} label="SEC" dim={!timerActive && timeLeft !== initialTime} />
              </div>

              {/* Minimal Controls */}
              <div className="flex flex-col items-center gap-8">
                 <button 
                   onClick={toggleTimer}
                   className={`
                      px-12 py-5 rounded-full font-bold text-sm tracking-[0.2em] uppercase transition-all duration-300 flex items-center gap-3
                      ${timerActive 
                        ? 'bg-transparent border border-white/20 text-white hover:border-white/50' 
                        : 'bg-[#74D39A] text-white shadow-[0_0_40px_rgba(116,211,154,0.3)] hover:scale-105 hover:shadow-[0_0_60px_rgba(116,211,154,0.5)] border border-transparent'
                      }
                   `}
                 >
                   {timerActive ? <Pause size={18} fill="currentColor"/> : <Play size={18} fill="currentColor"/>}
                   {timerActive ? 'Pausar' : 'Start Focus'}
                 </button>

                 {!timerActive && (
                    <div className="flex items-center gap-3 animate-[fadeIn_0.3s_ease-out]">
                        {[25, 45, 60].map(m => (
                           <button 
                             key={m}
                             onClick={() => setTimerDuration(m)}
                             className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-all border ${initialTime === m*60 ? 'bg-white text-black border-white' : 'text-white/40 border-white/10 hover:border-white/40 hover:text-white'}`}
                           >
                             {m}
                           </button>
                        ))}
                        <button onClick={resetTimer} className="w-10 h-10 rounded-full flex items-center justify-center text-white/40 hover:text-white transition-colors">
                           <RotateCcw size={16} />
                        </button>
                    </div>
                 )}
              </div>
           </div>
        )}

        {/* SOUND SPACE */}
        {activeSpace === 'sound' && (
           <div className="w-full max-w-4xl px-8 animate-[fadeIn_0.3s_ease-out]">
              <h3 className="text-center text-white/30 text-sm tracking-[0.4em] uppercase mb-16">Paisaje Sonoro</h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
                 {Object.entries(SOUNDS).filter(([key]) => key !== 'none').map(([key, sound]) => (
                    <button
                      key={key}
                      onClick={() => setActiveSound(activeSound === key ? 'none' : key as SoundType)}
                      className={`
                         group flex flex-col items-center justify-center py-12 rounded-2xl border transition-all duration-300
                         ${activeSound === key 
                            ? 'bg-white/10 border-white/50 text-white shadow-[0_0_30px_rgba(255,255,255,0.1)]' 
                            : 'bg-transparent border-white/5 text-white/40 hover:border-white/20 hover:text-white/80'
                         }
                      `}
                    >
                       {key === 'rain' && <CloudRain size={32} strokeWidth={1} className="mb-4" />}
                       {key === 'white_noise' && <Wind size={32} strokeWidth={1} className="mb-4" />}
                       {key === 'waves' && <Waves size={32} strokeWidth={1} className="mb-4" />}
                       {key === 'forest' && <Trees size={32} strokeWidth={1} className="mb-4" />}
                       <span className="text-xs font-bold tracking-widest uppercase">{sound.label}</span>
                    </button>
                 ))}
              </div>

              {/* Volume */}
              <div className={`max-w-md mx-auto flex items-center gap-6 transition-all duration-500 ${activeSound !== 'none' ? 'opacity-100' : 'opacity-20 blur-sm pointer-events-none'}`}>
                 <Volume2 className="text-white/50" size={20} />
                 <input 
                   type="range" min="0" max="1" step="0.01" value={volume} 
                   onChange={(e) => setVolume(parseFloat(e.target.value))}
                   className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                 />
              </div>
           </div>
        )}
      </div>

      {/* --- FOOTER --- */}
      <div className="relative z-20 flex flex-col items-center gap-8 pb-10 w-full px-6">
         
         {/* Motivational Quote */}
         <p className="text-white/60 font-[system-ui] font-light italic tracking-wide text-center text-sm md:text-lg min-h-[1.5em] transition-opacity duration-1000">
           "{QUOTES[quoteIndex]}"
         </p>

         {/* Navigation Bar */}
         <div className="flex flex-col md:flex-row items-center gap-6 md:gap-12 p-1">
             
             {/* Background Selector */}
             <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-full backdrop-blur-sm">
                {(Object.entries(BACKGROUNDS) as [BackgroundType, any][]).map(([key, config]) => (
                   <button
                     key={key}
                     onClick={() => setBg(key)}
                     title={config.label}
                     className={`w-4 h-4 rounded-full transition-all duration-300 ${bg === key ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-black bg-white' : 'bg-white/30 hover:bg-white/60'}`}
                   />
                ))}
             </div>

             {/* Space Switcher */}
             <div className="flex gap-8">
                 <button onClick={() => setActiveSpace('clock')} className={`flex flex-col items-center gap-1 group`}>
                    <Clock size={20} className={`transition-colors ${activeSpace === 'clock' ? 'text-white' : 'text-white/30 group-hover:text-white/60'}`} />
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${activeSpace === 'clock' ? 'text-white' : 'text-transparent group-hover:text-white/40'}`}>Reloj</span>
                 </button>
                 <button onClick={() => setActiveSpace('timer')} className={`flex flex-col items-center gap-1 group`}>
                    <Timer size={20} className={`transition-colors ${activeSpace === 'timer' ? 'text-white' : 'text-white/30 group-hover:text-white/60'}`} />
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${activeSpace === 'timer' ? 'text-white' : 'text-transparent group-hover:text-white/40'}`}>Timer</span>
                 </button>
                 <button onClick={() => setActiveSpace('sound')} className={`flex flex-col items-center gap-1 group`}>
                    <Music size={20} className={`transition-colors ${activeSpace === 'sound' ? 'text-white' : 'text-white/30 group-hover:text-white/60'}`} />
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${activeSpace === 'sound' ? 'text-white' : 'text-transparent group-hover:text-white/40'}`}>Sonido</span>
                 </button>
             </div>
         </div>
      </div>
    </div>
  );
};
