
import React, { useState, useRef } from 'react';
import { generateStudyGuide } from '../services/geminiService';
import { Bot, Upload, FileText, Youtube, Mic, Play, Download, Printer, Loader2, ArrowRight } from 'lucide-react';
import { useGamification } from '../components/GamificationContext';

type InputTab = 'text' | 'file' | 'youtube' | 'audio';

export const Assistant = () => {
    const { gainXP } = useGamification();
    const [activeTab, setActiveTab] = useState<InputTab>('text');
    
    // Inputs
    const [textInput, setTextInput] = useState('');
    const [fileData, setFileData] = useState<{base64: string, type: string, name: string} | null>(null);
    const [youtubeUrl, setYoutubeUrl] = useState('');
    
    // Processing
    const [loading, setLoading] = useState(false);
    const [resultHtml, setResultHtml] = useState<string | null>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = (reader.result as string).split(',')[1];
            setFileData({ base64, type: file.type, name: file.name });
        };
        reader.readAsDataURL(file);
    };

    const handleGenerate = async () => {
        setLoading(true);
        setResultHtml(null);

        try {
            let inputPayload: any = {};

            if (activeTab === 'text') {
                inputPayload.text = textInput;
            } else if (activeTab === 'file' || activeTab === 'audio') {
                // Audio is handled as a file upload too
                if (fileData) {
                    inputPayload.fileBase64 = fileData.base64;
                    inputPayload.mimeType = fileData.type;
                }
            } else if (activeTab === 'youtube') {
                inputPayload.text = `Analyze this YouTube Video Context: ${youtubeUrl}. (If you cannot access it, generate a guide based on the implied topic from the URL or title provided by the user).`;
            }

            const html = await generateStudyGuide(inputPayload);
            setResultHtml(html);
            gainXP(30);

        } catch (e) {
            console.error(e);
            alert("Hubo un error al generar la ayuda.");
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        if (!resultHtml) return;
        const printWindow = window.open('', '', 'height=600,width=800');
        if (printWindow) {
            printWindow.document.write(`
                <html>
                    <head>
                        <title>Lumi Ayudante - Documento de Estudio</title>
                        <script src="https://cdn.tailwindcss.com"></script>
                        <style>body { padding: 40px; font-family: sans-serif; }</style>
                    </head>
                    <body>
                        <div class="max-w-3xl mx-auto">
                            <h1 class="text-3xl font-bold mb-6 text-indigo-600">Guía de Estudio Generada</h1>
                            ${resultHtml}
                            <div class="mt-10 text-center text-xs text-gray-400">Generado por LumiLearn AI</div>
                        </div>
                    </body>
                </html>
            `);
            printWindow.document.close();
            setTimeout(() => {
                printWindow.print();
            }, 500);
        }
    };

    // --- RENDER INPUT FORM ---
    const renderForm = () => (
        <div className="max-w-4xl mx-auto animate-[fadeIn_0.3s_ease-out]">
            <div className="text-center mb-10">
                <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-50">
                    <Bot className="w-10 h-10 text-green-600" />
                </div>
                <h1 className="text-4xl font-black text-gray-800 font-logo mb-3">Tu Ayudante IA</h1>
                <p className="text-gray-500 text-lg">Dame tus deberes, apuntes o un video, y crearé una guía de estudio perfecta.</p>
            </div>

            <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-gray-100 overflow-hidden">
                
                {/* Tabs */}
                <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
                    {[
                        { id: 'text', label: 'Texto / Pregunta', icon: FileText },
                        { id: 'file', label: 'Archivo / Foto', icon: Upload },
                        { id: 'audio', label: 'Audio', icon: Mic },
                        { id: 'youtube', label: 'YouTube', icon: Youtube },
                    ].map(tab => (
                        <button 
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as InputTab)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${
                                activeTab === tab.id 
                                ? 'bg-gray-900 text-white shadow-lg' 
                                : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                            }`}
                        >
                            <tab.icon size={18}/> {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="min-h-[200px] mb-8">
                    {activeTab === 'text' && (
                        <textarea 
                            value={textInput}
                            onChange={(e) => setTextInput(e.target.value)}
                            placeholder="Pega aquí el texto de tus deberes o describe lo que necesitas..."
                            className="w-full h-48 bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-green-200 outline-none resize-none"
                        />
                    )}

                    {(activeTab === 'file' || activeTab === 'audio') && (
                        <div className="border-2 border-dashed border-gray-200 rounded-2xl p-10 flex flex-col items-center justify-center hover:bg-gray-50 transition-colors">
                            <label className="cursor-pointer text-center">
                                <div className="bg-green-50 p-4 rounded-full inline-block mb-4">
                                    {activeTab === 'audio' ? <Mic className="w-8 h-8 text-green-500"/> : <Upload className="w-8 h-8 text-green-500"/>}
                                </div>
                                <h3 className="text-lg font-bold text-gray-700 mb-1">
                                    {fileData ? fileData.name : (activeTab === 'audio' ? 'Sube tu grabación (mp3/wav)' : 'Sube PDF o Imagen')}
                                </h3>
                                <p className="text-xs text-gray-400">Clic para seleccionar archivo</p>
                                <input 
                                    type="file" 
                                    accept={activeTab === 'audio' ? "audio/*" : "application/pdf,image/*"} 
                                    className="hidden" 
                                    onChange={handleFileUpload} 
                                />
                            </label>
                        </div>
                    )}

                    {activeTab === 'youtube' && (
                        <div className="flex flex-col gap-4">
                            <div className="relative">
                                <Youtube className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"/>
                                <input 
                                    type="text"
                                    value={youtubeUrl}
                                    onChange={(e) => setYoutubeUrl(e.target.value)}
                                    placeholder="Pega el enlace de YouTube..."
                                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold focus:ring-2 focus:ring-red-100 outline-none"
                                />
                            </div>
                            <p className="text-xs text-gray-400 italic bg-yellow-50 p-3 rounded-xl border border-yellow-100">
                                🚧 Nota: Asegúrate de que el video tenga subtítulos o descripción clara para mejores resultados.
                            </p>
                        </div>
                    )}
                </div>

                <button 
                    onClick={handleGenerate}
                    disabled={loading || (activeTab === 'text' && !textInput) || ((activeTab === 'file' || activeTab === 'audio') && !fileData)}
                    className="w-full py-5 bg-green-500 hover:bg-green-600 text-white font-extrabold text-xl rounded-2xl shadow-xl shadow-green-200 transition-all hover:scale-[1.02] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? <Loader2 className="animate-spin"/> : <Bot className="fill-current"/>}
                    {loading ? 'Analizando material...' : 'Generar Guía de Estudio'}
                </button>
            </div>
        </div>
    );

    // --- RENDER RESULT ---
    const renderResult = () => (
        <div className="h-full flex flex-col">
            <div className="mb-6 flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <button 
                    onClick={() => setResultHtml(null)} 
                    className="flex items-center gap-2 text-gray-500 font-bold hover:text-gray-800 transition-colors"
                >
                    <ArrowRight className="rotate-180" size={20}/> Nueva Consulta
                </button>
                <button 
                    onClick={handlePrint}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition-all hover:scale-105"
                >
                    <Printer size={18}/> Imprimir / PDF
                </button>
            </div>

            <div className="flex-1 bg-white rounded-[2.5rem] border border-gray-200 p-8 md:p-12 shadow-xl overflow-y-auto">
                <div className="max-w-3xl mx-auto prose prose-indigo prose-lg">
                    {/* Render generated HTML safely */}
                    <div dangerouslySetInnerHTML={{ __html: resultHtml || '' }} />
                </div>
            </div>
        </div>
    );

    return (
        <div className="h-full">
            {resultHtml ? renderResult() : renderForm()}
        </div>
    );
};