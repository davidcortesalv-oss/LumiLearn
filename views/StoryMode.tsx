
import React, { useState, useEffect, useRef } from 'react';
import { GeneratedVideo, ProductionStep, VideoScene } from '../types';
import { generateLongVideoContent, generateAudioFromText, generateVeoVideo, generateIllustration } from '../services/storyService';
import { 
  Clapperboard, Sparkles, Play, Pause, 
  Volume2, Clock, Loader2, Maximize, Minimize, Video, Film,
  RefreshCw, Key, ShieldAlert, ImageIcon, BookOpen, Zap, PenTool
} from 'lucide-react';

export const StoryMode = () => {
  const [topic, setTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoData, setVideoData] = useState<GeneratedVideo | null>(null);
  
  // Player State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [currentSubtitle, setCurrentSubtitle] = useState('');
  
  // Scene Logic
  const [activeSceneIndex, setActiveSceneIndex] = useState(0);

  // Refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const srtParserRef = useRef<Array<{start: number, end: number, text: string}>>([]);

  // Production Steps State
  const [steps, setSteps] = useState<ProductionStep[]>([
    { step: 'Guion (8 Escenas)', status: 'pending', message: 'Estructurando lección completa...' },
    { step: 'Arte (OpenAI)', status: 'pending', message: 'Generando 8 bocetos únicos...' },
    { step: 'Narración', status: 'pending', message: 'Sintetizando voz...' },
    { step: 'Montaje', status: 'pending', message: 'Renderizando vídeo final...' }
  ]);

  // --- PARSE SRT HELPER ---
  const parseSRT = (srt: string) => {
      const regex = /(\d+)\n(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})\n([\s\S]*?)(?=\n\n|\n*$)/g;
      const items = [];
      let match;
      while ((match = regex.exec(srt)) !== null) {
          const startParts = match[2].replace(',', '.').split(':');
          const endParts = match[3].replace(',', '.').split(':');
          const startSeconds = (+startParts[0]) * 60 * 60 + (+startParts[1]) * 60 + (+startParts[2]);
          const endSeconds = (+endParts[0]) * 60 * 60 + (+endParts[1]) * 60 + (+endParts[2]);
          items.push({
              start: startSeconds,
              end: endSeconds,
              text: match[4].replace(/\n/g, ' ')
          });
      }
      return items;
  };

  // --- GENERATION PIPELINE ---
  const handleGenerate = async () => {
    if (!topic.trim()) return;
    
    setIsGenerating(true);
    setVideoData(null);
    setSteps(prev => prev.map(s => ({...s, status: 'pending', message: s.message.split('...')[0] + '...'})));

    try {
        // STEP 1: Content (8 Scenes)
        updateStep(0, 'processing');
        const content = await generateLongVideoContent(topic);
        if (!content || !content.scenes) throw new Error("Error generando estructura de clase");
        updateStep(0, 'completed');

        // STEP 2: Illustrations (DALL-E 3 - Parallel)
        // We generate images for ALL scenes to ensure the visual narrative is complete
        updateStep(1, 'processing');
        const scenePromises = content.scenes.map(async (scene) => {
             const imageUrl = await generateIllustration(scene.imagePrompt);
             return { ...scene, imageUrl: imageUrl || undefined };
        });
        const scenesWithImages = await Promise.all(scenePromises);
        updateStep(1, 'completed');

        // STEP 3: Audio & Veo Background
        updateStep(2, 'processing');
        const fullScript = content.scenes.map(s => s.narration).join(' ');
        
        // Parallel execution for speed
        const [audioUrl, videoUrl] = await Promise.all([
            generateAudioFromText(fullScript),
            generateVeoVideo(topic, content.visualPrompt)
        ]);
        
        if (!audioUrl) throw new Error("Error generando audio");
        updateStep(2, 'completed');

        // STEP 4: Assembly
        updateStep(3, 'processing');
        srtParserRef.current = parseSRT(content.srt);
        
        setVideoData({
            metadata: content.metadata,
            scenes: scenesWithImages,
            script: fullScript,
            audioUrl: audioUrl,
            videoUrl: videoUrl || "",
            subtitles: content.srt
        });
        updateStep(3, 'completed');

    } catch (e) {
        console.error(e);
        alert("Hubo un error en la producción. Por favor intenta de nuevo.");
    } finally {
        setIsGenerating(false);
    }
  };

  const updateStep = (index: number, status: 'pending' | 'processing' | 'completed') => {
      setSteps(prev => {
          const newSteps = [...prev];
          newSteps[index] = { ...newSteps[index], status };
          return newSteps;
      });
  };

  // --- PLAYER LOGIC ---

  useEffect(() => {
      if (!videoData) return;
      if (audioRef.current) {
          audioRef.current.src = videoData.audioUrl;
          audioRef.current.load();
      }
  }, [videoData]);

  const togglePlay = () => {
      if (!audioRef.current || !videoRef.current) return;
      
      if (isPlaying) {
          audioRef.current.pause();
          videoRef.current.pause();
      } else {
          audioRef.current.play();
          videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
      if (!audioRef.current) return;
      const t = audioRef.current.currentTime;
      const d = audioRef.current.duration || 1; // Avoid divide by zero
      
      setCurrentTime(t);
      setDuration(d);

      // Determine active scene based on time division
      // NOTE: For perfect sync, we would need per-sentence timestamps from TTS.
      // Here we approximate by dividing total duration by number of scenes.
      const sceneCount = videoData?.scenes.length || 1;
      const sceneDuration = d > 0 ? d / sceneCount : 0;
      const newSceneIndex = sceneDuration > 0 ? Math.min(Math.floor(t / sceneDuration), sceneCount - 1) : 0;
      
      if (newSceneIndex !== activeSceneIndex) {
          setActiveSceneIndex(newSceneIndex);
      }

      // Sync Subtitles
      const activeSub = srtParserRef.current.find(s => t >= s.start && t <= s.end);
      setCurrentSubtitle(activeSub ? activeSub.text : '');
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!audioRef.current || !videoRef.current) return;
      const time = parseFloat(e.target.value);
      audioRef.current.currentTime = time;
      setCurrentTime(time);
      
      if (duration > 0 && videoData?.scenes.length) {
          const sceneDuration = duration / videoData.scenes.length;
          setActiveSceneIndex(Math.min(Math.floor(time / sceneDuration), videoData.scenes.length - 1));
      }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
      if (!document.fullscreenElement) {
          containerRef.current.requestFullscreen();
          setIsFullscreen(true);
      } else {
          document.exitFullscreen();
          setIsFullscreen(false);
      }
  };

  // --- RENDER LOADING SCREEN ---
  if (isGenerating) {
      return (
          <div className="h-full flex flex-col items-center justify-center p-8 animate-[fadeIn_0.5s_ease-out]">
              <div className="max-w-xl w-full bg-white rounded-[2rem] p-8 shadow-2xl border border-gray-100 relative overflow-hidden">
                   {/* Header */}
                   <div className="text-center mb-8">
                       <Loader2 className="w-16 h-16 text-indigo-500 animate-spin mx-auto mb-4"/>
                       <h2 className="text-2xl font-black text-gray-800">Diseñando Clase Sketch</h2>
                       <p className="text-gray-500 font-medium">Creando 8 láminas educativas...</p>
                   </div>

                   {/* Steps */}
                   <div className="space-y-4">
                       {steps.map((step, i) => (
                           <div key={i} className="flex items-center gap-4">
                               <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                                   step.status === 'completed' ? 'bg-green-50 border-green-500 text-green-600' :
                                   step.status === 'processing' ? 'bg-indigo-50 border-indigo-500 text-indigo-600 animate-pulse' :
                                   'bg-gray-50 border-gray-200 text-gray-300'
                               }`}>
                                   <span className="text-xs font-bold">{i+1}</span>
                               </div>
                               <div className="flex-1">
                                   <div className="flex justify-between mb-1">
                                       <span className={`font-bold text-sm ${step.status === 'processing' ? 'text-indigo-600' : 'text-gray-700'}`}>{step.step}</span>
                                       {step.status === 'processing' && <span className="text-xs text-indigo-400 font-medium animate-pulse">Procesando...</span>}
                                   </div>
                                   <p className="text-xs text-gray-400">{step.message}</p>
                                   <div className="h-1 w-full bg-gray-100 rounded-full mt-2 overflow-hidden">
                                       <div className={`h-full transition-all duration-1000 ${
                                           step.status === 'completed' ? 'w-full bg-green-400' :
                                           step.status === 'processing' ? 'w-2/3 bg-indigo-400 animate-[shimmer_1s_infinite_linear]' :
                                           'w-0'
                                       }`}></div>
                                   </div>
                               </div>
                           </div>
                       ))}
                   </div>
              </div>
          </div>
      );
  }

  // --- RENDER VIDEO PLAYER ---
  if (videoData) {
      const activeScene = videoData.scenes[activeSceneIndex];

      return (
          <div className="h-full flex flex-col items-center justify-center p-4">
              <div 
                ref={containerRef}
                className={`bg-white relative group overflow-hidden shadow-2xl transition-all duration-300 border-4 border-gray-100 ${isFullscreen ? 'w-full h-full fixed inset-0 z-50 border-0' : 'w-full max-w-5xl aspect-video rounded-[2rem]'}`}
                onMouseMove={() => setShowControls(true)}
                onMouseLeave={() => setShowControls(false)}
              >
                  {/* Veo Video Background (Looping - Paper Texture) */}
                  <video 
                    ref={videoRef}
                    src={videoData.videoUrl}
                    className="w-full h-full object-cover opacity-30 mix-blend-multiply"
                    loop
                    muted
                    playsInline
                  />
                  
                  {/* --- ACTIVE SCENE CONTENT (SKETCH STYLE) --- */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-8 pointer-events-none">
                      
                      {/* Active Illustration */}
                      {activeScene && activeScene.imageUrl && (
                          <div className="relative w-full h-full flex flex-col items-center justify-center animate-[fadeIn_0.5s_ease-out]">
                             
                             {/* Floating Title for Scene */}
                             <h2 className="text-3xl md:text-4xl font-black text-gray-800 mb-6 bg-white/80 backdrop-blur px-6 py-2 rounded-xl shadow-sm transform -rotate-1">
                                {activeScene.title}
                             </h2>

                             {/* The Sketch Image */}
                             <div className="relative w-full max-w-2xl aspect-[4/3] overflow-hidden rounded-md">
                                <img 
                                    key={activeSceneIndex} 
                                    src={activeScene.imageUrl} 
                                    alt={activeScene.title} 
                                    className="w-full h-full object-contain mix-blend-multiply" 
                                />
                             </div>

                             {/* Key Concept Badge */}
                             <div className="mt-6 bg-yellow-300 text-yellow-900 px-6 py-2 rounded-full text-lg font-bold border-2 border-yellow-400 shadow-sm transform rotate-1">
                                 {activeScene.screenText}
                             </div>
                          </div>
                      )}
                  </div>

                  {/* Invisible Audio for Narration */}
                  <audio 
                    ref={audioRef}
                    onTimeUpdate={handleTimeUpdate}
                    onEnded={() => setIsPlaying(false)}
                  />

                  {/* Scene Progress Indicator (8 Segments) */}
                  <div className="absolute top-0 left-0 right-0 flex gap-1 p-2">
                      {videoData.scenes.map((_, idx) => (
                          <div key={idx} className="h-1.5 flex-1 bg-gray-200 rounded-full overflow-hidden border border-white/50">
                              <div 
                                className={`h-full bg-teal-500 transition-all duration-300 ${idx < activeSceneIndex ? 'w-full' : idx === activeSceneIndex ? 'w-full animate-pulse' : 'w-0'}`}
                              ></div>
                          </div>
                      ))}
                  </div>

                  {/* Watermark */}
                  <div className="absolute bottom-4 right-6 font-logo text-gray-400/50 font-bold text-lg pointer-events-none mix-blend-multiply">
                      LumiLearn Sketch
                  </div>

                  {/* Subtitles Overlay */}
                  <div className="absolute bottom-24 left-0 right-0 text-center px-8 pointer-events-none">
                      {currentSubtitle && (
                          <span className="inline-block bg-white/90 backdrop-blur-md text-gray-800 font-bold text-lg md:text-xl px-6 py-3 rounded-2xl shadow-lg border border-gray-100 leading-relaxed animate-[slideUp_0.1s_ease-out]">
                              {currentSubtitle}
                          </span>
                      )}
                  </div>

                  {/* Play Button Overlay */}
                  {!isPlaying && (
                      <button 
                        onClick={togglePlay}
                        className="absolute inset-0 flex items-center justify-center z-10 bg-white/20 backdrop-blur-sm hover:bg-white/10 transition-colors group"
                      >
                          <div className="w-24 h-24 bg-teal-500 rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                              <Play size={48} className="text-white fill-white ml-2"/>
                          </div>
                      </button>
                  )}

                  {/* Controls Bar */}
                  <div className={`absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white via-white/90 to-transparent transition-opacity duration-300 ${showControls || !isPlaying ? 'opacity-100' : 'opacity-0'}`}>
                      {/* Scrubber */}
                      <input 
                        type="range"
                        min="0"
                        max={duration || 100}
                        value={currentTime}
                        onChange={handleSeek}
                        className="w-full h-1 bg-gray-300 rounded-full appearance-none cursor-pointer mb-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-teal-500 [&::-webkit-slider-thumb]:shadow-md"
                      />

                      <div className="flex items-center justify-between text-gray-700">
                          <div className="flex items-center gap-4">
                              <button onClick={togglePlay} className="hover:text-teal-600 transition-colors">
                                  {isPlaying ? <Pause size={24} fill="currentColor"/> : <Play size={24} fill="currentColor"/>}
                              </button>
                              <div className="text-xs font-mono font-bold text-gray-500">
                                  {new Date(currentTime * 1000).toISOString().substr(14, 5)} / {new Date(duration * 1000).toISOString().substr(14, 5)}
                              </div>
                              <span className="text-xs font-bold text-teal-700 bg-teal-100 px-2 py-0.5 rounded border border-teal-200">
                                  Lámina {activeSceneIndex + 1}/{videoData.scenes.length}
                              </span>
                          </div>
                          <div className="flex items-center gap-4">
                               <button onClick={toggleFullscreen} className="hover:text-black transition-colors">
                                   {isFullscreen ? <Minimize size={20}/> : <Maximize size={20}/>}
                               </button>
                          </div>
                      </div>
                  </div>
              </div>

              {/* Back Button & Metadata */}
              <div className="max-w-5xl w-full mt-6 flex justify-between items-center px-2">
                  <button onClick={() => setVideoData(null)} className="text-gray-400 hover:text-gray-600 font-bold text-sm flex items-center gap-2">
                      <RefreshCw size={14}/> Nueva Clase
                  </button>
                  <div className="text-right">
                      <h3 className="font-bold text-gray-800">{videoData.metadata.title}</h3>
                      <p className="text-xs text-gray-400">{videoData.metadata.summary}</p>
                  </div>
              </div>
          </div>
      );
  }

  // --- RENDER INPUT ---
  return (
    <div className="h-full flex flex-col items-center justify-center p-6 relative overflow-hidden">
       {/* Background */}
       <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-teal-100/50 rounded-full blur-[100px] animate-pulse pointer-events-none" />
       <div className="absolute bottom-[-20%] right-[-10%] w-[40vw] h-[40vw] bg-yellow-100/50 rounded-full blur-[100px] animate-[pulse_5s_infinite_2s] pointer-events-none" />
       
       <div className="max-w-2xl w-full text-center relative z-10 animate-[scaleIn_0.3s_ease-out]">
           <div className="w-24 h-24 bg-white rounded-[2rem] shadow-xl flex items-center justify-center mx-auto mb-8 rotate-3 border border-gray-100">
               <PenTool className="w-12 h-12 text-teal-500 fill-current" />
           </div>
           
           <h1 className="text-5xl font-black text-gray-800 font-logo mb-6">
              Clase Sketch
           </h1>
           <p className="text-xl text-gray-500 font-medium mb-10 leading-relaxed max-w-lg mx-auto">
              Lumi explica cualquier tema en <strong className="text-teal-600">8 láminas ilustradas</strong> a mano (estilo Notebook).
           </p>

           <div className="bg-white p-3 rounded-[2rem] shadow-2xl shadow-teal-100 border-4 border-gray-50 flex flex-col sm:flex-row gap-3">
               <input 
                 type="text" 
                 value={topic}
                 onChange={(e) => setTopic(e.target.value)}
                 onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                 placeholder="Tema (ej: El Ciclo del Agua)"
                 className="flex-1 bg-transparent px-6 py-4 text-xl font-bold text-gray-700 placeholder-gray-300 outline-none"
                 autoFocus
               />
               <button 
                 onClick={handleGenerate}
                 disabled={!topic.trim()}
                 className="bg-teal-500 text-white px-8 py-4 rounded-[1.5rem] font-bold text-lg shadow-lg hover:shadow-xl hover:bg-teal-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
               >
                 <Sparkles size={20} className="text-white fill-current"/> Crear
               </button>
           </div>
           
           <div className="mt-8 flex justify-center gap-8 opacity-60">
               <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                  <Film size={14} className="text-indigo-400"/> Veo 3.1
               </div>
               <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                  <Volume2 size={14} className="text-pink-400"/> ElevenLabs
               </div>
                <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                  <ImageIcon size={14} className="text-yellow-500"/> OpenAI DALL-E
               </div>
           </div>
       </div>
    </div>
  );
};
