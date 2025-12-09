
import React, { useState, useEffect, useRef } from 'react';
import { useGamification } from '../components/GamificationContext';
import { getFilesFromStorage, saveFileToStorage, deleteFileFromStorage } from '../services/storageService';
import { extractTextFromMaterial } from '../services/geminiService';
import { StoredFile } from '../types';
import { 
  FolderOpen, Upload, FileText, Image as ImageIcon, Trash2, 
  Search, Grid, List, Download, AlertCircle, CheckCircle, Plus,
  CloudLightning, Loader2
} from 'lucide-react';

export const Materials = () => {
  const { subjects, gainXP } = useGamification();
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  
  // Upload State
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0); // 0-100
  const [processingStatus, setProcessingStatus] = useState<'idle' | 'uploading' | 'analyzing' | 'done'>('idle');
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFiles(getFilesFromStorage());
  }, []);

  // --- ACTIONS ---

  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(true);
  };

  const handleDragLeave = () => {
      setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (!selectedSubjectId) return; // Should not happen due to UI logic
      const droppedFiles = e.dataTransfer.files;
      if (droppedFiles && droppedFiles.length > 0) {
          processFile(droppedFiles[0]);
      }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
          processFile(e.target.files[0]);
      }
  };

  const processFile = (file: File) => {
      if (file.size > 5 * 1024 * 1024) {
          alert("El archivo es demasiado grande (Máx 5MB para almacenamiento local).");
          return;
      }

      setProcessingStatus('uploading');
      
      // Simulate rapid upload progress
      let p = 0;
      const interval = setInterval(() => {
          p += 10;
          if (p > 50) clearInterval(interval);
          setUploadProgress(p);
      }, 50);

      const reader = new FileReader();
      reader.onloadend = async () => {
          clearInterval(interval);
          setUploadProgress(60);
          
          const base64Data = (reader.result as string).split(',')[1];
          
          // STEP: Background AI Pre-processing for Speed Later
          setProcessingStatus('analyzing');
          // Simulate progress for analysis part
          setUploadProgress(80);
          
          // Call the text extraction service immediately
          const extractedText = await extractTextFromMaterial(base64Data, file.type);
          
          setUploadProgress(100);

          const newFile: StoredFile = {
            id: Date.now().toString(),
            name: file.name,
            type: file.type,
            data: base64Data,
            subjectId: selectedSubjectId || 'general',
            createdAt: Date.now(),
            size: file.size,
            extractedContent: extractedText // STORED FOR SPEED
          };

          const success = saveFileToStorage(newFile);
          if (success) {
            setFiles(prev => [newFile, ...prev]);
            gainXP(15);
            setTimeout(() => {
                setProcessingStatus('idle');
                setUploadProgress(0);
            }, 1000);
          } else {
            alert("Espacio lleno. Borra archivos antiguos.");
            setProcessingStatus('idle');
          }
      };
      reader.readAsDataURL(file);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("¿Borrar este archivo?")) {
      const updated = deleteFileFromStorage(id);
      setFiles(updated);
    }
  };

  const getSubjectColor = (subId: string) => {
    const sub = subjects.find(s => s.id === subId);
    return sub ? sub.color : 'bg-gray-400';
  };

  // --- RENDER ---

  const renderSubjectSelector = () => (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-[fadeIn_0.3s_ease-out]">
          {subjects.map(sub => (
              <button
                key={sub.id}
                onClick={() => setSelectedSubjectId(sub.id)}
                className="p-6 rounded-3xl bg-white border-2 border-gray-100 hover:border-indigo-300 hover:shadow-lg transition-all flex flex-col items-center gap-3 group"
              >
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${sub.color.replace('bg-', 'bg-opacity-20 text-').replace('500', '600')} group-hover:scale-110 transition-transform`}>
                      {sub.icon}
                  </div>
                  <span className="font-bold text-gray-700">{sub.name}</span>
              </button>
          ))}
          <button
            onClick={() => setSelectedSubjectId('general')}
            className="p-6 rounded-3xl bg-white border-2 border-gray-100 hover:border-gray-400 hover:shadow-lg transition-all flex flex-col items-center gap-3 group"
          >
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl bg-gray-100 text-gray-500 group-hover:scale-110 transition-transform">
                  <FolderOpen />
              </div>
              <span className="font-bold text-gray-700">General</span>
          </button>
      </div>
  );

  const renderUploadZone = () => (
      <div className="animate-[scaleIn_0.3s_ease-out]">
          <div className="flex justify-between items-center mb-4">
              <button 
                onClick={() => setSelectedSubjectId(null)}
                className="text-gray-400 hover:text-gray-700 font-bold text-sm"
              >
                 ← Volver a Asignaturas
              </button>
              <h2 className="text-xl font-black text-gray-800 flex items-center gap-2">
                 <span className={`w-3 h-3 rounded-full ${getSubjectColor(selectedSubjectId!)}`}></span>
                 {subjects.find(s => s.id === selectedSubjectId)?.name || 'General'}
              </h2>
          </div>

          <div 
             className={`
                relative w-full h-48 rounded-[2rem] border-4 border-dashed transition-all flex flex-col items-center justify-center text-center p-6 cursor-pointer group overflow-hidden
                ${isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 bg-white hover:border-indigo-300 hover:bg-gray-50'}
             `}
             onDragOver={handleDragOver}
             onDragLeave={handleDragLeave}
             onDrop={handleDrop}
             onClick={() => fileInputRef.current?.click()}
          >
             {processingStatus !== 'idle' ? (
                 <div className="w-full max-w-md">
                     <div className="flex justify-between text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">
                         <span>{processingStatus === 'uploading' ? 'Subiendo...' : 'Optimizando para IA...'}</span>
                         <span>{uploadProgress}%</span>
                     </div>
                     {/* Custom Gray to Green Progress Bar */}
                     <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
                         <div 
                           className="h-full bg-green-500 transition-all duration-300 ease-out flex items-center justify-center relative"
                           style={{width: `${uploadProgress}%`}}
                         >
                            <div className="absolute inset-0 bg-white/30 animate-[shimmer_1s_infinite_linear] w-full h-full transform skew-x-12"></div>
                         </div>
                     </div>
                     <p className="text-xs text-gray-400 mt-3 animate-pulse">
                        {processingStatus === 'analyzing' ? 'Extrayendo conocimiento para uso instantáneo...' : 'Cargando archivo...'}
                     </p>
                 </div>
             ) : (
                 <>
                    <div className="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <CloudLightning size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-700">Arrastra tu archivo aquí</h3>
                    <p className="text-gray-400 text-sm">O haz clic para buscar. Se procesará automáticamente.</p>
                 </>
             )}
             <input ref={fileInputRef} type="file" className="hidden" accept="application/pdf,image/*" onChange={handleFileInput} disabled={processingStatus !== 'idle'}/>
          </div>
      </div>
  );

  const filteredFiles = selectedSubjectId 
      ? files.filter(f => f.subjectId === selectedSubjectId)
      : [];

  return (
    <div className="h-full flex flex-col space-y-8 max-w-6xl mx-auto p-4">
      
      {/* Header */}
      <div className="text-center mb-4">
          <h1 className="text-4xl font-black text-gray-800 font-logo mb-2">Biblioteca Veloz</h1>
          <p className="text-gray-500 font-medium">Sube tus archivos una vez, úsalos al instante en cualquier lugar.</p>
      </div>

      {/* Step 1 or 2 */}
      {!selectedSubjectId ? renderSubjectSelector() : renderUploadZone()}

      {/* Files List (Only shows if subject selected) */}
      {selectedSubjectId && (
          <div className="animate-[fadeIn_0.5s_ease-out] mt-8">
              <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                  <div className="flex items-center gap-2">
                     <h3 className="font-bold text-gray-600">Archivos Guardados</h3>
                     <span className="bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded-full font-bold">{filteredFiles.length}</span>
                  </div>
                  <div className="flex gap-2">
                     <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-white text-indigo-500 shadow-sm' : 'text-gray-400'}`}><Grid size={18}/></button>
                     <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-white text-indigo-500 shadow-sm' : 'text-gray-400'}`}><List size={18}/></button>
                  </div>
              </div>

              {filteredFiles.length === 0 ? (
                  <div className="text-center py-10 opacity-50">
                      <p className="text-gray-400 font-bold">Carpeta vacía</p>
                  </div>
              ) : (
                  <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4" : "flex flex-col gap-3"}>
                      {filteredFiles.map(file => (
                         <div 
                           key={file.id} 
                           className={`
                             bg-white p-4 rounded-2xl border border-gray-100 hover:shadow-lg transition-all group relative overflow-hidden cursor-grab active:cursor-grabbing
                             ${viewMode === 'list' ? 'flex items-center gap-4' : 'flex flex-col'}
                           `}
                           draggable
                         >
                             {/* Ready Indicator */}
                             {file.extractedContent && (
                                 <div className="absolute top-2 left-2 z-10" title="Optimizado para uso instantáneo">
                                     <div className="bg-green-100 text-green-600 p-1 rounded-full">
                                         <CloudLightning size={12} fill="currentColor"/>
                                     </div>
                                 </div>
                             )}

                             <div className={`
                                flex items-center justify-center rounded-xl bg-gray-50 text-gray-400 shrink-0
                                ${viewMode === 'list' ? 'w-12 h-12' : 'aspect-square mb-4'}
                             `}>
                                 {file.type.includes('pdf') ? <FileText size={viewMode === 'list' ? 24 : 48}/> : <ImageIcon size={viewMode === 'list' ? 24 : 48}/>}
                             </div>

                             <div className="flex-1 min-w-0">
                                 <h4 className="font-bold text-gray-800 truncate text-sm" title={file.name}>{file.name}</h4>
                                 <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] text-gray-400 uppercase">{(file.size / 1024 / 1024).toFixed(1)} MB</span>
                                 </div>
                             </div>

                             <button 
                               onClick={(e) => handleDelete(file.id, e)}
                               className="absolute top-2 right-2 p-2 bg-white/90 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                             >
                                <Trash2 size={16}/>
                             </button>
                         </div>
                      ))}
                  </div>
              )}
          </div>
      )}

    </div>
  );
};
