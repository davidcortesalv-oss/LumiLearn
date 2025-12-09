
import React, { useState } from 'react';
import { createVisualPrompt, improveNotes } from '../services/geminiService';
import { generateInfographic } from '../services/storyService';
import { uploadToGoogleDrive } from '../services/storageService';
import { 
  LayoutTemplate, Upload, Sparkles, Loader2, Download, 
  Smartphone, Monitor, Columns, X, Maximize, ZoomIn, Cloud, Palette
} from 'lucide-react';
import { useGamification } from '../components/GamificationContext';

// --- MAIN VIEW ---
export const InfographicGenerator = () => {
  const { gainXP } = useGamification();
  
  // Input State
  const [inputText, setInputText] = useState('');
  const [goal, setGoal] = useState('');
  const [orientation, setOrientation] = useState<'vertical' | 'horizontal' | 'cuadrada'>('vertical');
  
  // Process State
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [analyzingFile, setAnalyzingFile] = useState(false);
  const [isDriveUploading, setIsDriveUploading] = useState(false);
  
  // Output State
  // resultSvgContent stores the RAW SVG string returned by Gemini
  const [resultSvgContent, setResultSvgContent] = useState<string | null>(null);
  const [isZoomOpen, setIsZoomOpen] = useState(false);

  const handleGenerate = async () => {
    if (!inputText.trim() || !goal.trim()) return;
    setLoading(true);
    setResultSvgContent(null);
    
    try {
       // STEP 1: Optimize Prompt with Gemini
       setStatusMessage('Diseñando estructura visual...');
       const visualPrompt = await createVisualPrompt(inputText, goal, orientation);
       
       // STEP 2: Generate SVG with Gemini
       setStatusMessage('Renderizando vectores...');
       const svgCode = await generateInfographic(visualPrompt, orientation);
       
       if (svgCode) {
          setResultSvgContent(svgCode);
          gainXP(50);
       } else {
          alert("No se pudo generar la infografía. Por favor intenta de nuevo.");
       }
    } catch (e) {
       console.error(e);
       alert("Error de conexión.");
    } finally {
       setLoading(false);
       setStatusMessage('');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setAnalyzingFile(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
          const base64Data = (reader.result as string).split(',')[1];
          const text = await improveNotes(base64Data);
          setInputText(text);
          setAnalyzingFile(false);
      };
      reader.readAsDataURL(file);
  };

  const handleDownload = () => {
      if (!resultSvgContent) return;
      const blob = new Blob([resultSvgContent], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Lumi_Infografia_${Date.now()}.svg`;
      a.click();
  };

  const handleSaveToDrive = async () => {
      if (!resultSvgContent) return;
      setIsDriveUploading(true);
      
      try {
          // Upload SVG directly as text/blob
          const blob = new Blob([resultSvgContent], { type: 'image/svg+xml;charset=utf-8' });
          
          const success = await uploadToGoogleDrive(blob, `Infografia_Lumi_${Date.now()}.svg`);
          if (success) {
              alert("¡Guardado en Google Drive!");
          }
      } catch (e) {
          alert("Error al guardar en Drive.");
      } finally {
          setIsDriveUploading(false);
      }
  };

  // --- RENDER RESULT ---
  if (resultSvgContent) {
     return (
        <div className="h-full flex flex-col">
           {/* Top Bar */}
           <div className="mb-6 flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
               <button 
                  onClick={() => setResultSvgContent(null)} 
                  className="flex items-center gap-2 text-gray-500 font-bold hover:text-gray-800 transition-colors"
               >
                  <X size={20}/> Volver al Editor
               </button>
               <h3 className="font-bold text-gray-800 hidden sm:block">Infografía Vectorial Generada</h3>
               <div className="flex gap-3">
                   <button 
                      onClick={handleSaveToDrive}
                      disabled={isDriveUploading}
                      className="flex items-center gap-2 bg-green-600 text-white px-6 py-2 rounded-xl font-bold shadow-lg hover:bg-green-700 transition-all hover:scale-105 disabled:opacity-70"
                   >
                      {isDriveUploading ? <Loader2 size={18} className="animate-spin"/> : <Cloud size={18}/>} 
                      Guardar
                   </button>
                   <button 
                      onClick={handleDownload}
                      className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition-all hover:scale-105"
                   >
                      <Download size={18}/> Descargar SVG
                   </button>
               </div>
           </div>

           {/* Main Preview Area */}
           <div className="flex-1 bg-gray-100 rounded-[2.5rem] border border-gray-200 overflow-hidden relative flex items-center justify-center group">
               {/* Background Pattern */}
               <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:20px_20px]"></div>
               
               {/* SVG Container */}
               <div 
                  className="relative cursor-zoom-in max-h-full max-w-full p-8 shadow-2xl transition-transform hover:scale-[1.01] bg-white rounded-xl overflow-hidden"
                  onClick={() => setIsZoomOpen(true)}
                  dangerouslySetInnerHTML={{ __html: resultSvgContent }}
                  style={{ maxHeight: '70vh', maxWidth: '90%' }}
               />
               
               {/* Overlay Hover Button */}
               <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/10 rounded-xl pointer-events-none">
                   <div className="bg-white/90 backdrop-blur text-gray-800 px-4 py-2 rounded-full font-bold shadow-lg flex items-center gap-2">
                       <ZoomIn size={18}/> Ampliar
                   </div>
               </div>
           </div>

           {/* MODAL LIGHTBOX */}
           {isZoomOpen && (
               <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]" onClick={() => setIsZoomOpen(false)}>
                   <button className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors">
                       <X size={32}/>
                   </button>
                   <div 
                       className="max-h-[95vh] w-auto max-w-[95vw] bg-white rounded-lg shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-auto"
                       onClick={(e) => e.stopPropagation()} 
                       dangerouslySetInnerHTML={{ __html: resultSvgContent }}
                   />
               </div>
           )}
        </div>
     );
  }

  // --- EDITOR VIEW ---
  return (
    <div className="h-full max-w-5xl mx-auto animate-[scaleIn_0.3s_ease-out]">
        <div className="text-center mb-10">
            <div className="bg-teal-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 rotate-3 shadow-lg shadow-teal-50">
               <LayoutTemplate className="w-10 h-10 text-teal-600" />
            </div>
            <h1 className="text-4xl font-black text-gray-800 font-logo mb-3">Estudio de Infografías</h1>
            <p className="text-gray-500 text-lg">Crea infografías vectoriales SVG perfectas para imprimir o ampliar.</p>
        </div>

        <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-gray-100 relative overflow-hidden">
             {/* Decorative */}
             <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-teal-400 via-candy-sky to-candy-pink"></div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                 {/* Left: Configuration */}
                 <div className="space-y-6">
                     <div className="space-y-2">
                         <label className="text-xs font-extrabold text-gray-400 uppercase ml-1">Tu Contenido</label>
                         <div className="relative">
                             <textarea 
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                placeholder="Pega aquí tus apuntes, resumen o tema..."
                                className="w-full h-48 bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-teal-200 outline-none resize-none"
                             />
                             <label className={`absolute bottom-3 right-3 p-2 bg-white rounded-lg border shadow-sm cursor-pointer hover:bg-gray-50 transition-all ${analyzingFile ? 'animate-pulse' : ''}`}>
                                 {analyzingFile ? <Loader2 size={16} className="animate-spin text-teal-500"/> : <Upload size={16} className="text-gray-500"/>}
                                 <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} disabled={analyzingFile}/>
                             </label>
                         </div>
                     </div>

                     <div className="space-y-2">
                         <label className="text-xs font-extrabold text-gray-400 uppercase ml-1">Objetivo Visual</label>
                         <input 
                            type="text" 
                            value={goal}
                            onChange={(e) => setGoal(e.target.value)}
                            placeholder="Ej: Comparativa visual, Línea de tiempo histórica..."
                            className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 font-bold text-gray-700 outline-none focus:border-teal-300"
                         />
                     </div>
                 </div>

                 {/* Right: Layout & Action */}
                 <div className="flex flex-col justify-between space-y-6">
                     <div className="space-y-2">
                         <label className="text-xs font-extrabold text-gray-400 uppercase ml-1">Formato</label>
                         <div className="grid grid-cols-3 gap-3">
                             <button 
                                onClick={() => setOrientation('vertical')}
                                className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${orientation === 'vertical' ? 'bg-teal-50 border-teal-400 text-teal-800' : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'}`}
                             >
                                 <Smartphone size={24}/>
                                 <span className="text-[10px] font-bold uppercase">Vertical</span>
                             </button>
                             <button 
                                onClick={() => setOrientation('horizontal')}
                                className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${orientation === 'horizontal' ? 'bg-teal-50 border-teal-400 text-teal-800' : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'}`}
                             >
                                 <Monitor size={24}/>
                                 <span className="text-[10px] font-bold uppercase">Horizontal</span>
                             </button>
                             <button 
                                onClick={() => setOrientation('cuadrada')}
                                className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${orientation === 'cuadrada' ? 'bg-teal-50 border-teal-400 text-teal-800' : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'}`}
                             >
                                 <Columns size={24}/>
                                 <span className="text-[10px] font-bold uppercase">Post</span>
                             </button>
                         </div>
                     </div>

                     <div className="bg-teal-50 p-6 rounded-2xl border border-teal-100">
                        <h4 className="font-bold text-teal-800 mb-2 flex items-center gap-2"><Palette size={16}/> Vector Magic (SVG)</h4>
                        <p className="text-xs text-teal-600 leading-relaxed">
                           Lumi generará código SVG puro. Esto significa que podrás ampliar la imagen infinitamente sin perder calidad.
                        </p>
                     </div>

                     <button 
                        onClick={handleGenerate}
                        disabled={loading || !inputText.trim() || !goal.trim()}
                        className="w-full py-5 bg-teal-500 hover:bg-teal-600 text-white font-extrabold text-xl rounded-2xl shadow-xl shadow-teal-200 transition-all hover:scale-[1.02] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed mt-auto"
                     >
                        {loading ? <Loader2 className="animate-spin"/> : <Sparkles className="fill-current"/>}
                        {loading ? statusMessage : 'Generar Infografía SVG'}
                     </button>
                 </div>
             </div>
        </div>
    </div>
  );
};