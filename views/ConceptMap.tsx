
import React, { useState, useRef, useEffect } from 'react';
import { explainNodeConcept, generateNodePractice } from '../services/geminiService';
import { saveMapToStorage, getSavedMaps, deleteSavedMap, getFilesFromStorage, uploadToGoogleDrive } from '../services/storageService';
import { MapNode, NodeQuiz, SavedMap, StoredFile } from '../types';
import { useGamification } from '../components/GamificationContext';
import { 
  Network, Maximize, RefreshCw, Upload, FileText, CheckCircle, 
  Zap, Sparkles, X, BrainCircuit, Minimize, 
  Save, FolderOpen, Trash2, Clock, FolderHeart, Download, Eye, Image as ImageIcon, CloudLightning,
  Cloud
} from 'lucide-react';
import * as d3Base from 'd3';

// Cast d3 to avoid strict type conflicts
const d3 = d3Base as any;

const MOTIVATIONAL_QUOTES = [
  "Conectando neuronas digitales...",
  "Estructurando el conocimiento para ti...",
  "El aprendizaje es un tesoro que te seguirá siempre.",
  "Simplificando lo complejo...",
  "Creando puentes entre ideas...",
  "Organizando el caos en claridad...",
  "La sabiduría comienza con la curiosidad.",
  "Diseñando tu mapa hacia el éxito..."
];

export const ConceptMap = () => {
  const { gainXP, subjects, backgroundTasks, activeMapData, generateMapInBackground, resetMapGeneration } = useGamification();
  const [inputText, setInputText] = useState('');
  
  // D3 Logic State
  const [hierarchicalData, setHierarchicalData] = useState<any>(null); // For Tree Layout
  const [savedMaps, setSavedMaps] = useState<SavedMap[]>([]); // Saved Maps List
  
  // Internal D3 controls for external access (Download)
  const d3Controls = useRef<{ root: any, update: (source: any) => void } | null>(null);
  
  // Local UI State (Global loading state comes from Context)
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [isOverlayMinimized, setIsOverlayMinimized] = useState(false);

  const [selectedNode, setSelectedNode] = useState<MapNode | null>(null);
  const [explanation, setExplanation] = useState<string>('');
  const [explaining, setExplaining] = useState(false);
  
  // View Modes
  const [isFullScreen, setIsFullScreen] = useState(false);
  
  // Modals
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false); // Save Modal
  const [mapTitleToSave, setMapTitleToSave] = useState("Mi Mapa Personalizado");

  const [libraryFiles, setLibraryFiles] = useState<StoredFile[]>([]);

  // Practice State
  const [practiceModalOpen, setPracticeModalOpen] = useState(false);
  const [currentQuiz, setCurrentQuiz] = useState<NodeQuiz | null>(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizAnswered, setQuizAnswered] = useState<boolean>(false);
  const [quizFeedback, setQuizFeedback] = useState<'correct' | 'incorrect' | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isDriveUploading, setIsDriveUploading] = useState(false);

  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const isLoading = backgroundTasks.mapGenerator === 'loading';
  const isReady = backgroundTasks.mapGenerator === 'success' && activeMapData !== null;

  // --- DARK THEME NODE STYLES ---
  const getNodeColor = (type: string, depth: number) => {
      if (depth === 0) return '#4f46e5'; 
      if (depth === 1) return '#334155'; 
      return '#1e293b'; 
  };

  const getStrokeColor = (type: string) => {
      if (type === 'Concept') return '#38bdf8'; 
      if (type === 'Definition') return '#4ade80'; 
      if (type === 'Example') return '#c084fc'; 
      return '#94a3b8'; 
  };

  // --- INITIALIZATION ---
  useEffect(() => {
    // Load saved maps on mount
    setSavedMaps(getSavedMaps());
    
    // If we have active map data from context, render it
    if (activeMapData) {
        processDataForD3(activeMapData);
    }
  }, [activeMapData]);

  // Reset minimized state when new loading starts
  useEffect(() => {
    if (isLoading) {
        setIsOverlayMinimized(false);
    }
  }, [isLoading]);

  // --- UTILS ---
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Rotate quotes
  useEffect(() => {
    let interval: any;
    if (isLoading) {
       interval = setInterval(() => {
          setQuoteIndex(prev => (prev + 1) % MOTIVATIONAL_QUOTES.length);
       }, 3000);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  useEffect(() => {
    if (isLibraryOpen) {
        setLibraryFiles(getFilesFromStorage());
    }
  }, [isLibraryOpen]);

  // --- D3 LOGIC ---
  const buildHierarchy = (data: any) => {
      const rootNode = data.nodes.find((n:any) => n.type === 'Root') || data.nodes[0];
      if (!rootNode) return null;

      const buildTree = (node: MapNode): any => {
          const children = data.nodes
              .filter((n:any) => n.parentId === node.id)
              .map(buildTree);
          return {
              ...node,
              children: children.length > 0 ? children : null,
              _children: null
          };
      };
      return buildTree(rootNode);
  };

  const processDataForD3 = (data: any) => {
      const tree = buildHierarchy(data);
      setHierarchicalData(tree);
  };

  useEffect(() => {
    if (!hierarchicalData || !svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); 

    const g = svg.append("g").attr("transform", "translate(100,0)"); 

    const zoom = d3.zoom()
        .scaleExtent([0.1, 3])
        .on("zoom", (event: any) => g.attr("transform", event.transform));
    svg.call(zoom);

    const treeMap = d3.tree().nodeSize([50, 250]); 
    const root = d3.hierarchy(hierarchicalData, (d: any) => d.children);
    // @ts-ignore
    root.x0 = height / 2;
    // @ts-ignore
    root.y0 = 0;

    // Define update function inside effect to have closure over g, treeMap, root
    function update(source: any) {
        const treeData = treeMap(root);
        const nodes = treeData.descendants();
        const links = treeData.links();

        nodes.forEach((d: any) => { d.y = d.depth * 280; });

        let i = 0;
        const node = g.selectAll('g.node')
            .data(nodes, (d: any) => d.id || (d.id = ++i));

        const nodeEnter = node.enter().append('g')
            .attr('class', 'node')
            .attr("transform", (d: any) => `translate(${source.y0},${source.x0})`)
            .on('click', handleClick);

        nodeEnter.append('rect')
            .attr('class', 'node-rect')
            .attr('width', 220)
            .attr('height', 44)
            .attr('x', -10)
            .attr('y', -22)
            .attr('rx', 12)
            .attr('ry', 12)
            .style("fill", (d: any) => getNodeColor(d.data.type, d.depth))
            .style("stroke", (d: any) => getStrokeColor(d.data.type))
            .style("stroke-width", "1px")
            .style("filter", "drop-shadow(0px 4px 6px rgba(0,0,0,0.3))")
            .style("cursor", "pointer");

        nodeEnter.append('rect')
            .attr('class', 'mastery-bar')
            .attr('x', -10)
            .attr('y', 20)
            .attr('height', 3)
            .attr('width', (d: any) => {
                 const pct = d.data.mastery || 0;
                 return (220 * pct) / 100;
            })
            .style("fill", (d: any) => {
                const m = d.data.mastery;
                if (m >= 80) return "#4ade80";
                if (m >= 40) return "#facc15";
                return "#f87171";
            });

        nodeEnter.append('text')
            .attr("dy", ".35em")
            .attr("x", 10)
            .attr("text-anchor", "start")
            .text((d: any) => d.data.label.length > 25 ? d.data.label.substring(0, 25) + '...' : d.data.label)
            .style("fill", "#f8fafc")
            .style("font-size", "12px")
            .style("font-weight", "600")
            .style("pointer-events", "none");
        
        nodeEnter.append('circle')
            .attr('class', 'toggle-btn')
            .attr('r', 8)
            .attr('cx', 210)
            .attr('cy', 0)
            .style("fill", "#1e293b")
            .style("stroke", "#64748b")
            .style("display", (d: any) => (d._children || d.children) ? "block" : "none");

        nodeEnter.append('text')
            .attr('class', 'toggle-icon')
            .attr('x', 210)
            .attr('y', 3)
            .style("text-anchor", "middle")
            .style("fill", "#94a3b8")
            .style("font-size", "10px")
            .style("font-weight", "bold")
            .style("pointer-events", "none")
            .text((d: any) => d._children ? ">" : "<")
            .style("display", (d: any) => (d._children || d.children) ? "block" : "none");


        const nodeUpdate = node.merge(nodeEnter as any);

        nodeUpdate.transition()
            .duration(400)
            .attr("transform", (d: any) => `translate(${d.y},${d.x})`);

        nodeUpdate.select('.toggle-icon')
            .text((d: any) => d._children ? "+" : (d.children ? "-" : ""));

        nodeUpdate.select('rect.node-rect')
            .style("fill", (d: any) => d._children ? "#0f172a" : getNodeColor(d.data.type, d.depth));

        const nodeExit = node.exit().transition()
            .duration(400)
            .attr("transform", (d: any) => `translate(${source.y},${source.x})`)
            .remove();

        nodeExit.select('rect').attr('width', 0);
        nodeExit.select('text').style('opacity', 1e-6);

        const link = g.selectAll('path.link')
            .data(links, (d: any) => d.target.id);

        const linkEnter = link.enter().insert('path', "g")
            .attr("class", "link")
            .attr('d', (d: any) => {
                const o = { x: source.x0, y: source.y0 };
                return diagonal(o, o);
            })
            .style("fill", "none")
            .style("stroke", "#475569")
            .style("stroke-width", "1.5px");

        const linkUpdate = link.merge(linkEnter as any);

        linkUpdate.transition()
            .duration(400)
            .attr('d', (d: any) => diagonal(d.source, d.target));

        link.exit().transition()
            .duration(400)
            .attr('d', (d: any) => {
                const o = { x: source.x, y: source.y };
                return diagonal(o, o);
            })
            .remove();

        nodes.forEach((d: any) => {
            d.x0 = d.x;
            d.y0 = d.y;
        });

        function diagonal(s: any, d: any) {
            const sourceX = s.y + 210; 
            const sourceY = s.x;
            const targetX = d.y - 10;
            const targetY = d.x;

            return `M ${sourceX} ${sourceY}
                    C ${(sourceX + targetX) / 2} ${sourceY},
                      ${(sourceX + targetX) / 2} ${targetY},
                      ${targetX} ${targetY}`;
        }

        function handleClick(event: any, d: any) {
            if (event.defaultPrevented) return;

            if (d.clickTimer) {
                clearTimeout(d.clickTimer);
                d.clickTimer = null;
                openPracticeDirectly(d.data);
            } else {
                d.clickTimer = setTimeout(() => {
                    d.clickTimer = null;
                    if (d.children) {
                        d._children = d.children;
                        d.children = null;
                    } else if (d._children) {
                        d.children = d._children;
                        d._children = null;
                    }
                    setSelectedNode(d.data);
                    update(d); 
                }, 250);
            }
        }
    }
    
    // Store D3 controls for external access
    d3Controls.current = { root, update };

    update(root);
    const initialTransform = d3.zoomIdentity.translate(50, height/2 - (root.x || 0));
    svg.call(zoom.transform, initialTransform);

  }, [hierarchicalData, isFullScreen]);

  // --- SAVE & LOAD LOGIC ---

  const handleOpenSaveModal = () => {
      if (!activeMapData) return;
      setIsSaveModalOpen(true);
  };

  const handleSaveMap = () => {
      if (!activeMapData || !mapTitleToSave.trim()) return;
      saveMapToStorage(mapTitleToSave, activeMapData);
      setSavedMaps(getSavedMaps()); // Refresh list
      showToast("¡Mapa guardado con éxito!");
      setIsSaveModalOpen(false);
  };

  const handleLoadMap = (savedMap: SavedMap) => {
      processDataForD3(savedMap.data);
      setHierarchicalData(buildHierarchy(savedMap.data));
  };

  const handleDeleteMap = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if(confirm("¿Estás seguro de que quieres eliminar este mapa?")) {
          const updated = deleteSavedMap(id);
          setSavedMaps(updated);
      }
  };

  // --- GENERATION HANDLERS (USING GLOBAL CONTEXT) ---

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if(!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
       const base64Data = (reader.result as string).split(',')[1];
       
       const storedFile: StoredFile = {
           id: "temp",
           name: file.name,
           type: file.type,
           data: base64Data,
           subjectId: "temp",
           createdAt: Date.now(),
           size: file.size
       };
       
       generateMapInBackground(storedFile, true);
    };
    reader.readAsDataURL(file);
  };

  const handleFileSelect = async (file: StoredFile) => {
      setIsLibraryOpen(false);
      generateMapInBackground(file, true);
  };

  const handleGenerate = async () => {
    if (!inputText.trim()) return;
    generateMapInBackground(inputText, false);
  };

  // --- SVG DOWNLOAD LOGIC (NEW: Center & Expand) ---
  const downloadAsSvg = async () => {
      if (!d3Controls.current || !svgRef.current) return;
      const { root, update } = d3Controls.current;

      // 1. Force Expand All Nodes
      root.descendants().forEach((d: any) => {
          if (d._children) {
              d.children = d._children;
              d._children = null;
          }
      });
      // Trigger update to render expanded state
      update(root);

      // 2. Wait slightly for transitions to settle (optional but recommended if transitions are active)
      await new Promise(r => setTimeout(r, 600));

      const svgEl = svgRef.current;
      // Get the main group which contains all nodes
      const g = d3.select(svgEl).select('g').node() as SVGGElement;
      
      // Calculate Bounding Box of the *content*
      const bbox = g.getBBox();
      const padding = 50;

      // Clone the SVG for export modification
      const clonedSvg = svgEl.cloneNode(true) as SVGSVGElement;
      
      // Set ViewBox to perfectly center the content
      // Note: We ignore the current zoom/pan transform of the parent group 
      // because we set viewBox relative to the internal BBox.
      // However, the cloned <g> might still have the zoom transform attribute.
      // We should reset the transform on the cloned group to identity, 
      // OR account for it. 
      // Simpler approach: Remove the transform on the cloned <g> and rely on viewBox.
      
      const clonedG = clonedSvg.querySelector('g');
      if (clonedG) {
         clonedG.setAttribute('transform', ''); // Remove zoom/pan transform
      }
      
      // Since we removed transform, the BBox x/y are relative to origin.
      // D3 tree layout writes x/y coordinates into transform attributes of .node groups.
      // The tree structure is already laid out. We just need to fit it.
      
      // Recalculate BBox if we stripped the main group transform? 
      // Actually, the BBox we got earlier `g.getBBox()` is in local coordinates of `g`.
      // Since we removed `g`'s transform, `g`'s local coords become global SVG coords.
      // So using that bbox for viewBox is correct.

      clonedSvg.setAttribute("viewBox", `${bbox.x - padding} ${bbox.y - padding} ${bbox.width + padding * 2} ${bbox.height + padding * 2}`);
      clonedSvg.setAttribute("width", `${bbox.width + padding * 2}`);
      clonedSvg.setAttribute("height", `${bbox.height + padding * 2}`);
      clonedSvg.style.backgroundColor = "#0f172a"; // Preserve dark theme background
      
      // Serialize and Download
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(clonedSvg);
      const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      link.href = url;
      link.download = `Mapa_Lumi_${Date.now()}.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const getImageBlob = async (scale = 3): Promise<Blob | null> => {
      if (!svgRef.current) return null;

      const svgElement = svgRef.current;
      const { width, height } = svgElement.getBoundingClientRect();

      const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement;
      const targetWidth = width * scale;
      const targetHeight = height * scale;
      
      clonedSvg.setAttribute("width", targetWidth.toString());
      clonedSvg.setAttribute("height", targetHeight.toString());
      clonedSvg.style.backgroundColor = "#0f172a"; 

      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(clonedSvg);
      
      return new Promise((resolve) => {
          const img = new Image();
          img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString)));

          img.onload = () => {
              const canvas = document.createElement('canvas');
              canvas.width = targetWidth;
              canvas.height = targetHeight;
              const ctx = canvas.getContext('2d');
              if (!ctx) { resolve(null); return; }

              ctx.fillStyle = "#0f172a"; 
              ctx.fillRect(0, 0, targetWidth, targetHeight);
              ctx.drawImage(img, 0, 0);

              canvas.toBlob(resolve, 'image/png');
          };
      });
  };

  const uploadToDrive = async () => {
      setIsDriveUploading(true);
      const blob = await getImageBlob();
      if (blob) {
          const success = await uploadToGoogleDrive(blob, `Mapa_Lumi_${Date.now()}.png`);
          if (success) {
              showToast("¡Guardado en Google Drive!");
          } else {
              showToast("Error al subir a Drive.");
          }
      }
      setIsDriveUploading(false);
  };

  // --- PRACTICE LOGIC ---
  const loadExplanation = async (node: MapNode) => {
      setExplaining(true);
      setExplanation('');
      const text = await explainNodeConcept(node.label, node.description);
      setExplanation(text);
      setExplaining(false);
  };

  useEffect(() => {
      if (selectedNode) loadExplanation(selectedNode);
  }, [selectedNode]);

  const openPracticeDirectly = async (node: MapNode) => {
      setSelectedNode(node); 
      setPracticeModalOpen(true);
      setQuizLoading(true);
      setQuizAnswered(false);
      setQuizFeedback(null);
      
      const quiz = await generateNodePractice(node.label, node.description);
      setCurrentQuiz(quiz);
      setQuizLoading(false);
  };

  const openPractice = async () => {
      if (!selectedNode) return;
      openPracticeDirectly(selectedNode);
  };

  const handleQuizAnswer = (option: string) => {
      if (!currentQuiz || !selectedNode || !activeMapData) return;
      setQuizAnswered(true);
      
      const isCorrect = option === currentQuiz.correctAnswer;
      setQuizFeedback(isCorrect ? 'correct' : 'incorrect');

      if (isCorrect) {
          gainXP(25);
      } 
  };

  return (
    <div className="h-full flex flex-col md:flex-row gap-4 relative">

      {/* --- BACKGROUND TASK LOADING OVERLAY --- */}
      {isLoading && !isOverlayMinimized && (
          <div className="fixed inset-0 z-[300] bg-[#0f172a] flex flex-col items-center justify-center p-8 animate-[fadeIn_0.5s_ease-out]">
              <button 
                  onClick={() => setIsOverlayMinimized(true)}
                  className="absolute top-6 right-6 p-2 bg-white/10 rounded-full text-white/50 hover:text-white hover:bg-white/20 transition-all"
                  title="Minimizar y continuar en segundo plano"
              >
                  <X size={32} />
              </button>

              <div className="relative w-40 h-40 mb-10">
                  <div className="absolute inset-0 border-4 border-indigo-500/30 rounded-full animate-[ping_3s_infinite]"></div>
                  <div className="absolute inset-4 border-4 border-pink-500/30 rounded-full animate-[ping_3s_infinite_1s]"></div>
                  <div className="w-full h-full bg-slate-900 rounded-full flex items-center justify-center border border-indigo-500/50 shadow-[0_0_50px_rgba(99,102,241,0.3)]">
                      <BrainCircuit className="w-20 h-20 text-white animate-pulse" />
                  </div>
              </div>
              <h2 className="text-3xl md:text-5xl font-black text-white mb-6 text-center tracking-tight">
                  Construyendo tu Mapa...
              </h2>
              <p className="text-indigo-300 text-lg md:text-xl font-medium text-center max-w-2xl h-16 animate-[fadeIn_0.5s_ease-out] transition-all">
                  "{MOTIVATIONAL_QUOTES[quoteIndex]}"
              </p>
              
              <div className="mt-8 bg-slate-800/50 px-6 py-4 rounded-xl border border-slate-700 text-slate-300 text-sm flex items-center gap-3">
                   <CloudLightning size={16} className="text-yellow-400"/>
                   <span>Puedes salir de esta pantalla. El proceso seguirá en segundo plano.</span>
              </div>
          </div>
      )}

      {/* LIBRARY MODAL */}
      {isLibraryOpen && (
          <div className="fixed inset-0 z-[250] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-[2rem] w-full max-w-3xl p-6 shadow-2xl animate-[scaleIn_0.2s_ease-out] max-h-[80vh] flex flex-col">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-2xl font-black text-gray-800 flex items-center gap-2"><FolderOpen className="text-orange-500"/> Mi Biblioteca</h3>
                      <button onClick={() => setIsLibraryOpen(false)} className="p-2 hover:bg-gray-100 rounded-full"><X/></button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-4 p-2">
                      {libraryFiles.length === 0 ? (
                          <div className="col-span-full text-center text-gray-400 py-10">
                              No hay archivos guardados. Sube uno primero en la sección "Archivos".
                          </div>
                      ) : (
                          libraryFiles.map(file => (
                              <button 
                                key={file.id}
                                onClick={() => handleFileSelect(file)}
                                className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-indigo-500 hover:bg-indigo-50 transition-all text-left group"
                              >
                                  <div className="relative w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 shrink-0">
                                      {file.type.includes('pdf') ? <FileText/> : <ImageIcon/>}
                                      {file.extractedContent && (
                                         <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-0.5 border-2 border-white" title="Carga Instantánea">
                                             <CloudLightning size={10} className="text-white"/>
                                         </div>
                                      )}
                                  </div>
                                  <div>
                                      <p className="font-bold text-gray-800 line-clamp-1 group-hover:text-indigo-600">{file.name}</p>
                                      <div className="flex items-center gap-2">
                                         <p className="text-xs text-gray-500 uppercase">{subjects.find(s => s.id === file.subjectId)?.name || 'General'}</p>
                                      </div>
                                  </div>
                              </button>
                          ))
                      )}
                  </div>
              </div>
          </div>
      )}

      {/* SAVE MODAL */}
      {isSaveModalOpen && (
          <div className="fixed inset-0 z-[250] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-[2rem] w-full max-w-md p-8 shadow-2xl animate-[scaleIn_0.2s_ease-out]">
                  <h3 className="text-2xl font-black text-gray-800 mb-2 flex items-center gap-2">
                      <Save className="text-indigo-500"/> Guardar Mapa
                  </h3>
                  <p className="text-gray-500 mb-6">Ponle un nombre épico a tu mapa mental para no perderlo.</p>
                  
                  <input 
                      type="text"
                      value={mapTitleToSave}
                      onChange={(e) => setMapTitleToSave(e.target.value)}
                      className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl p-4 font-bold text-gray-700 focus:border-indigo-500 outline-none mb-6"
                      autoFocus
                  />
                  
                  <div className="flex gap-4">
                      <button onClick={() => setIsSaveModalOpen(false)} className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-colors">Cancelar</button>
                      <button onClick={handleSaveMap} className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg">Guardar</button>
                  </div>
              </div>
          </div>
      )}

      {/* --- SIDEBAR IZQUIERDA (Controles) --- */}
      <div className={`w-full md:w-80 flex flex-col gap-4 z-10 shrink-0 overflow-y-auto max-h-screen pb-20 ${isFullScreen ? 'hidden' : 'block'}`}>
           <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                 <div className="bg-gray-900 p-2 rounded-lg text-white"><BrainCircuit size={20}/></div>
                 <h2 className="font-bold text-gray-800">Mapa Mental AI</h2>
              </div>

              {/* Upload Drag & Drop */}
              <label className="block border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center hover:bg-indigo-50 hover:border-indigo-300 transition-all cursor-pointer group mb-2">
                  <Upload className="w-8 h-8 mx-auto text-gray-300 group-hover:text-indigo-500 mb-2 transition-colors"/>
                  <p className="text-sm font-bold text-gray-600">Subir PDF o Apuntes</p>
                  <input type="file" className="hidden" accept="application/pdf,image/*" onChange={handleFileUpload} />
              </label>

              {/* Library Button */}
              <button 
                onClick={() => setIsLibraryOpen(true)}
                className="w-full mb-4 py-3 bg-orange-50 text-orange-600 rounded-xl font-bold hover:bg-orange-100 transition-colors flex items-center justify-center gap-2 text-sm border border-orange-100"
              >
                  <FolderOpen size={18}/> Usar de mi Biblioteca
              </button>

              <div className="relative mb-6">
                  <textarea 
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="O escribe un tema..."
                    className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-indigo-200 min-h-[80px] resize-none"
                  />
                  <button 
                    onClick={handleGenerate}
                    disabled={isLoading}
                    className="absolute bottom-2 right-2 p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-lg disabled:opacity-50 transition-all"
                  >
                     {isLoading ? <RefreshCw className="animate-spin w-4 h-4"/> : <Sparkles className="w-4 h-4"/>}
                  </button>
              </div>

              {/* SAVED MAPS LIST */}
              <div className="border-t border-gray-100 pt-4">
                  <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <FolderHeart size={14}/> Mapas Guardados
                  </h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {savedMaps.length === 0 ? (
                          <p className="text-gray-400 text-xs text-center py-4 italic">No tienes mapas antiguos.</p>
                      ) : (
                          savedMaps.map(map => (
                              <div key={map.id} onClick={() => handleLoadMap(map)} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 cursor-pointer group border border-transparent hover:border-gray-100 transition-all">
                                  <div>
                                      <p className="font-bold text-gray-700 text-sm line-clamp-1">{map.title}</p>
                                      <div className="flex items-center gap-2 text-[10px] text-gray-400">
                                          <span className="flex items-center gap-1"><Clock size={10}/> {new Date(map.timestamp).toLocaleDateString()}</span>
                                          <span className="flex items-center gap-1"><BrainCircuit size={10}/> {map.previewNodeCount} nodos</span>
                                      </div>
                                  </div>
                                  <button 
                                    onClick={(e) => handleDeleteMap(map.id, e)}
                                    className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                  >
                                      <Trash2 size={14}/>
                                  </button>
                              </div>
                          ))
                      )}
                  </div>
              </div>
           </div>
      </div>

      {/* --- LIENZO CENTRAL (DARK MODE) --- */}
      <div ref={containerRef} className={`
         shadow-2xl overflow-hidden transition-all duration-500 ease-in-out flex-1 bg-[#0f172a]
         ${isFullScreen ? 'fixed inset-0 z-[200] w-screen h-screen rounded-none' : 'relative rounded-[2.5rem] border border-gray-800'}
      `}>
          {/* Controls Overlay */}
          <div className="absolute top-4 right-4 z-20 flex gap-2">
             {activeMapData && (
                <>
                 <button 
                    onClick={uploadToDrive}
                    className="bg-green-600 p-2 rounded-xl text-white hover:bg-green-500 shadow-md border border-green-500/50"
                    title="Guardar en Google Drive"
                    disabled={isDriveUploading}
                 >
                     {isDriveUploading ? <RefreshCw className="animate-spin" size={20}/> : <Cloud size={20}/>}
                 </button>
                 <button 
                    onClick={handleOpenSaveModal}
                    className="bg-indigo-600 p-2 rounded-xl text-white hover:bg-indigo-500 shadow-md border border-indigo-400/50"
                    title="Guardar Mapa"
                 >
                     <Save size={20}/>
                 </button>
                </>
             )}
             <button onClick={downloadAsSvg} className="bg-gray-800/80 backdrop-blur p-2 rounded-xl text-gray-400 hover:text-white shadow-md border border-gray-700" title="Descargar SVG (Desplegado)">
                 <Download size={20}/>
             </button>
             <button onClick={() => setIsFullScreen(!isFullScreen)} className="bg-gray-800/80 backdrop-blur p-2 rounded-xl text-gray-400 hover:text-white shadow-md border border-gray-700">
                 {isFullScreen ? <Minimize size={20}/> : <Maximize size={20}/>}
             </button>
          </div>

          <svg ref={svgRef} className="w-full h-full touch-none cursor-move" />
          
          {!activeMapData && !isLoading && !hierarchicalData && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-20">
                  <div className="w-32 h-32 bg-gray-800 rounded-full flex items-center justify-center mb-4">
                      <Network className="w-16 h-16 text-gray-500"/>
                  </div>
                  <h3 className="text-xl font-bold text-gray-400">Lienzo Vacío</h3>
                  <p className="text-gray-500">Sube un PDF o selecciona un mapa antiguo</p>
              </div>
          )}
      </div>

      {/* --- SIDEBAR DERECHA (Detalles) --- */}
      {!isFullScreen && (
          <div className={`fixed inset-y-0 right-0 w-full md:w-96 bg-white shadow-2xl z-[60] transform transition-transform duration-300 ${selectedNode ? 'translate-x-0' : 'translate-x-full'}`}>
              {selectedNode && (
                  <div className="h-full flex flex-col">
                      <div className="p-6 relative bg-gradient-to-br from-slate-900 to-slate-800 text-white border-b border-gray-800">
                          <button onClick={() => setSelectedNode(null)} className="absolute top-6 right-6 text-gray-400 hover:text-white"><X/></button>
                          <span className="inline-block px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider mb-2 bg-white/10 border border-white/20">
                              {selectedNode.type}
                          </span>
                          <h2 className="text-2xl font-extrabold leading-tight mb-2">{selectedNode.label}</h2>
                          
                          <div className="flex items-center gap-2 mt-2">
                              <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                                  <div className="h-full transition-all duration-1000" style={{ width: `${selectedNode.mastery}%`, backgroundColor: selectedNode.mastery >= 80 ? '#4ade80' : selectedNode.mastery >= 40 ? '#facc15' : '#f87171' }}></div>
                              </div>
                              <span className="text-xs font-bold text-gray-400">{selectedNode.mastery}%</span>
                          </div>
                      </div>

                      <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-white text-slate-800">
                          <div>
                              <h4 className="flex items-center gap-2 font-bold text-gray-800 mb-2 text-sm uppercase"><FileText size={16}/> Definición</h4>
                              <p className="text-gray-600 text-sm leading-relaxed font-medium">{selectedNode.description}</p>
                          </div>

                          <div className="bg-indigo-50 p-5 rounded-2xl border border-indigo-100">
                              <h4 className="flex items-center gap-2 font-bold text-indigo-900 mb-2 text-sm uppercase"><Sparkles size={16}/> Explicación IA</h4>
                              <p className="text-indigo-800 text-sm italic">
                                  {explaining ? "Lumi está pensando..." : explanation || "Cargando explicación..."}
                              </p>
                          </div>

                          <button onClick={openPractice} className="w-full py-4 bg-gray-900 text-white font-bold rounded-2xl shadow-xl hover:bg-black transform transition-all active:scale-95 flex items-center justify-center gap-3">
                              <Zap className="fill-current text-yellow-400"/> Practicar Concepto
                          </button>
                      </div>
                  </div>
              )}
          </div>
      )}

      {/* --- PRACTICE MODAL REUSE --- */}
      {practiceModalOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
           <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-[scaleIn_0.2s_ease-out]">
              <div className="bg-indigo-600 p-4 text-white flex justify-between items-center">
                  <h3 className="font-bold flex items-center gap-2"><Zap className="text-yellow-300 fill-current"/> Práctica Rápida</h3>
                  <button onClick={() => setPracticeModalOpen(false)}><X/></button>
              </div>
              <div className="p-6">
                  {quizLoading ? (
                      <div className="text-center py-8 text-gray-500"><RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2"/> Generando desafío...</div>
                  ) : currentQuiz ? (
                      <>
                        <p className="text-lg font-bold text-gray-800 mb-6">{currentQuiz.question}</p>
                        <div className="space-y-3">
                            {currentQuiz.options?.map(opt => (
                                <button key={opt}
                                    disabled={quizAnswered}
                                    onClick={() => handleQuizAnswer(opt)}
                                    className={`w-full p-4 rounded-xl text-left font-bold transition-all border-2 ${
                                        quizAnswered 
                                        ? opt === currentQuiz.correctAnswer ? "bg-green-100 border-green-500 text-green-800" : "bg-gray-50 border-gray-100 text-gray-400"
                                        : "bg-white border-gray-100 hover:border-indigo-500 hover:bg-indigo-50 text-gray-700"
                                    }`}
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>
                        {quizAnswered && (
                            <div className={`mt-6 p-4 rounded-xl ${quizFeedback === 'correct' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                                <p className="font-bold mb-1">{quizFeedback === 'correct' ? "¡Correcto! +25 XP" : "Incorrecto"}</p>
                                <p className="text-sm">{currentQuiz.feedback}</p>
                            </div>
                        )}
                      </>
                  ) : <p>Error al cargar.</p>}
              </div>
           </div>
        </div>
      )}

      {/* TOAST MESSAGE */}
      {toastMessage && (
          <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-full shadow-2xl z-[400] animate-[fadeIn_0.3s_ease-out] font-bold">
              {toastMessage}
          </div>
      )}

    </div>
  );
};
