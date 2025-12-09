import React, { useState } from 'react';
import { improveNotes } from '../services/geminiService';
import { Wand2, Upload, FileText, ArrowRight, Loader2 } from 'lucide-react';

export const Corrector = () => {
    const [image, setImage] = useState<string | null>(null);
    const [result, setResult] = useState<string>("");
    const [loading, setLoading] = useState(false);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                // Remove data url prefix for API
                setImage(base64String);
            };
            reader.readAsDataURL(file);
        }
    };

    const processNotes = async () => {
        if (!image) return;
        setLoading(true);
        // Extract base64 part
        const base64Data = image.split(',')[1];
        const improvedText = await improveNotes(base64Data);
        setResult(improvedText);
        setLoading(false);
    };

    return (
        <div className="h-full flex flex-col md:flex-row gap-6">
            {/* Left: Upload */}
            <div className="flex-1 bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center justify-center relative overflow-hidden">
                 {!image ? (
                     <label className="cursor-pointer flex flex-col items-center justify-center w-full h-full border-2 border-dashed border-gray-300 rounded-2xl hover:bg-gray-50 transition-colors group">
                        <div className="bg-teal-50 p-6 rounded-full mb-4 group-hover:scale-110 transition-transform">
                            <Upload className="w-10 h-10 text-teal-500" />
                        </div>
                        <p className="font-bold text-gray-600">Sube una foto de tus apuntes</p>
                        <p className="text-sm text-gray-400 mt-2">Formatos: JPG, PNG</p>
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                     </label>
                 ) : (
                     <div className="w-full h-full relative">
                         <img src={image} alt="Uploaded notes" className="w-full h-full object-contain rounded-xl" />
                         <button 
                            onClick={() => setImage(null)}
                            className="absolute top-2 right-2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
                         >
                            ✕
                         </button>
                     </div>
                 )}

                 {image && !result && (
                     <button 
                        onClick={processNotes}
                        disabled={loading}
                        className="mt-4 w-full bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                     >
                        {loading ? <Loader2 className="animate-spin" /> : <Wand2 />}
                        {loading ? 'La IA está leyendo...' : 'Mejorar Apuntes'}
                     </button>
                 )}
            </div>

            {/* Right: Result */}
            <div className="flex-1 bg-teal-50 p-6 rounded-3xl border border-teal-100 flex flex-col">
                <h3 className="font-bold text-teal-800 mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5" /> Resultado Mágico
                </h3>
                
                <div className="flex-1 bg-white rounded-xl p-4 shadow-sm overflow-y-auto font-medium text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {result ? result : (
                        <div className="h-full flex items-center justify-center text-teal-200 italic text-center">
                            <p>El texto corregido y resumido<br/>aparecerá aquí.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
