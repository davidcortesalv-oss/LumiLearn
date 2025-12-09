
import React, { useState } from 'react';
import { editUploadedImage } from '../services/geminiService';
import { useGamification } from '../components/GamificationContext';
import { Wand2, Upload, ImageIcon, RefreshCw, Download, ArrowRight, Palette } from 'lucide-react';

export const ImageEditor = () => {
  const { gainXP } = useGamification();
  const [image, setImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setResultImage(null); // Reset result on new upload
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEdit = async () => {
    if (!image || !prompt.trim()) return;
    
    setLoading(true);
    try {
      const base64Data = image.split(',')[1];
      const edited = await editUploadedImage(base64Data, prompt);
      if (edited) {
        setResultImage(edited);
        gainXP(30);
      } else {
        alert("No se pudo editar la imagen. Intenta con otro prompt.");
      }
    } catch (e) {
      console.error(e);
      alert("Error en la edición.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col items-center justify-center p-4 md:p-8 animate-[fadeIn_0.5s_ease-out]">
      
      <div className="text-center mb-8">
         <h1 className="text-4xl font-black text-gray-800 font-logo mb-2 flex items-center justify-center gap-3">
            <Palette className="text-purple-500" /> Editor Mágico
         </h1>
         <p className="text-gray-500 font-medium">Usa "Nano Banana" para transformar tus imágenes con palabras.</p>
      </div>

      <div className="w-full max-w-5xl bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden flex flex-col md:flex-row h-[600px]">
         
         {/* LEFT: Input & Controls */}
         <div className="w-full md:w-1/3 bg-gray-50 p-8 flex flex-col border-r border-gray-100">
             
             {/* Upload Area */}
             <div className="mb-6">
                 <label className="block w-full aspect-video border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-white hover:border-purple-300 transition-all group relative overflow-hidden bg-white">
                     {image ? (
                         <img src={image} alt="Original" className="w-full h-full object-cover absolute inset-0 opacity-50 group-hover:opacity-100 transition-opacity" />
                     ) : (
                         <div className="flex flex-col items-center text-gray-400 group-hover:text-purple-500">
                             <Upload size={32} className="mb-2"/>
                             <span className="text-xs font-bold uppercase">Subir Imagen</span>
                         </div>
                     )}
                     <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
                 </label>
             </div>

             {/* Prompt Input */}
             <div className="flex-1 flex flex-col gap-4">
                 <div>
                     <label className="text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-2 block">Tu Deseo</label>
                     <textarea 
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Ej: Añade un filtro retro, convierte en dibujo a lápiz, elimina el fondo..."
                        className="w-full h-32 bg-white border border-gray-200 rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-purple-200 outline-none resize-none"
                     />
                 </div>

                 <button 
                    onClick={handleEdit}
                    disabled={loading || !image || !prompt.trim()}
                    className="mt-auto w-full py-4 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold rounded-xl shadow-lg hover:shadow-purple-200 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                    {loading ? <RefreshCw className="animate-spin"/> : <Wand2 className="fill-current"/>}
                    {loading ? 'Transformando...' : 'Generar Magia'}
                 </button>
             </div>
         </div>

         {/* RIGHT: Preview */}
         <div className="w-full md:w-2/3 bg-gray-900 relative flex items-center justify-center p-8">
             {/* Background Pattern */}
             <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px]"></div>

             {!resultImage ? (
                 <div className="text-center text-gray-500">
                     <ImageIcon size={64} className="mx-auto mb-4 opacity-20"/>
                     <p className="text-lg font-bold">El resultado aparecerá aquí</p>
                 </div>
             ) : (
                 <div className="relative w-full h-full flex items-center justify-center group">
                     <img src={resultImage} alt="Edited Result" className="max-w-full max-h-full rounded-xl shadow-2xl animate-[scaleIn_0.3s_ease-out]" />
                     
                     <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <a href={resultImage} download="lumi-magic-edit.png" className="bg-white text-gray-900 px-4 py-2 rounded-lg font-bold shadow-lg flex items-center gap-2 hover:bg-gray-100 transition-colors">
                             <Download size={16}/> Descargar
                         </a>
                     </div>
                 </div>
             )}
         </div>
      </div>
    </div>
  );
};
