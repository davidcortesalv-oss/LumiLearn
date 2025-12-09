
import React, { useState, useEffect, useRef } from 'react';
import { useGamification } from '../components/GamificationContext';
import { sendWebhookMessage } from '../services/geminiService';
import { saveChatHistory, getChatHistory } from '../services/storageService';
import { ChatMessage, Difficulty } from '../types';
import { Send, Bot, User, MoreHorizontal, ArrowLeft, GraduationCap } from 'lucide-react';

export const SubjectChat = () => {
  const { selectedSubjectId, selectSubject, subjects } = useGamification();
  const [activeSubjectId, setActiveSubjectId] = useState<string | null>(null);
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.BEGINNER);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Create a persistent mock user ID for the session
  const [userId] = useState(() => 'student_' + Math.random().toString(36).substr(2, 9));

  // Handle entering a chat
  const handleSelectSubject = (id: string) => {
    selectSubject(id);
    setActiveSubjectId(id);
    
    // Restore history if exists
    const allHistory = getChatHistory();
    const savedMessages = allHistory[id] || [];
    
    if (savedMessages.length > 0) {
        setMessages(savedMessages);
    } else {
        setMessages([]); 
    }
  };

  const handleBackToMenu = () => {
    setActiveSubjectId(null);
  };

  const currentSubject = subjects.find(s => s.id === activeSubjectId);

  useEffect(() => {
    // Initial greeting specific to the subject but powered by the concept of "Lumi"
    if (activeSubjectId && currentSubject && messages.length === 0) {
      const initMsg: ChatMessage = {
        id: 'init',
        role: 'model',
        text: `¡Hola! Soy Lumi, tu tutor de ${currentSubject.name}. 🌟\n¿En qué te puedo ayudar hoy?`,
        timestamp: Date.now()
      };
      setMessages([initMsg]);
      saveChatHistory(activeSubjectId, [initMsg]);
    }
  }, [activeSubjectId, currentSubject, messages.length]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading || !currentSubject) return;

    const userText = input;
    
    // Prepare history for potential fallback (excluding the message about to be sent)
    const historyForGemini = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
    }));

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: userText,
      timestamp: Date.now()
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    saveChatHistory(currentSubject.id, newMessages);
    
    setInput('');
    setIsLoading(true);

    try {
      // Call the webhook service with subject ID for specific routing
      const responseText = await sendWebhookMessage(userText, userId, currentSubject.id, historyForGemini);

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: Date.now()
      };

      const finalMessages = [...newMessages, botMsg];
      setMessages(finalMessages);
      saveChatHistory(currentSubject.id, finalMessages);
      
    } catch (error) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "Lo siento, tuve un problema crítico conectando con mi cerebro central. 🧠💥 Intenta de nuevo.",
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // --- RENDER SELECTION MENU ---
  if (!activeSubjectId || !currentSubject) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 animate-[fadeIn_0.5s_ease-out]">
        <div className="text-center mb-12">
          <div className="bg-candy-pink/10 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
             <GraduationCap className="w-12 h-12 text-candy-pink" />
          </div>
          <h1 className="text-4xl font-black text-gray-800 font-logo mb-4">Habla con un profe experto</h1>
          <p className="text-gray-500 text-lg">Selecciona una materia para comenzar tu clase particular.</p>
        </div>

        <div className="grid grid-cols-2 gap-6 w-full max-w-2xl">
          {subjects.map((subject) => (
            <button
              key={subject.id}
              onClick={() => handleSelectSubject(subject.id)}
              className="group relative bg-white border-2 border-gray-100 hover:border-transparent rounded-[2rem] aspect-square flex flex-col items-center justify-center p-6 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 hover:bg-gradient-to-br from-white to-gray-50 overflow-hidden"
            >
              {/* Colored Background on Hover */}
              <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 ${subject.color}`}></div>
              
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-4 shadow-sm transition-transform group-hover:scale-110 ${subject.color} text-white`}>
                {subject.icon}
              </div>
              <span className="text-xl font-bold text-gray-700 group-hover:text-gray-900">{subject.name}</span>
              <span className="text-xs font-bold text-gray-400 mt-2 group-hover:text-gray-500">Tutor IA</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // --- RENDER CHAT INTERFACE ---
  return (
    <div className="h-[calc(100vh-140px)] flex flex-col bg-white rounded-[2.5rem] shadow-xl overflow-hidden border border-gray-100 relative animate-[slideUp_0.3s_ease-out]">
      
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-indigo-50/50 to-transparent pointer-events-none"></div>

      {/* Chat Header */}
      <div className="p-5 flex justify-between items-center border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button 
            onClick={handleBackToMenu}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          
          <div className="relative">
             <div className={`w-12 h-12 rounded-full ${currentSubject.color} flex items-center justify-center text-white text-xl shadow-lg ring-4 ring-white`}>
                <Bot className="w-7 h-7" />
             </div>
             <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-400 border-2 border-white rounded-full animate-pulse"></div>
          </div>
          <div>
            <h3 className="font-extrabold text-gray-800 text-lg">Tutor {currentSubject.name}</h3>
            <p className="text-xs text-indigo-500 font-bold bg-indigo-50 px-2 py-0.5 rounded-md inline-block">
               En línea
            </p>
          </div>
        </div>

        {/* Difficulty Selector */}
        <div className="hidden sm:block">
           <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mr-2">Nivel</span>
           <select 
             value={difficulty}
             onChange={(e) => setDifficulty(e.target.value as Difficulty)}
             className="text-sm border-2 border-gray-100 rounded-xl p-2 bg-gray-50 text-gray-700 font-bold focus:ring-2 focus:ring-indigo-200 outline-none cursor-pointer hover:bg-white transition-colors"
           >
             <option value={Difficulty.BEGINNER}>🐣 Inicial</option>
             <option value={Difficulty.INTERMEDIATE}>🦁 Intermedio</option>
             <option value={Difficulty.ADVANCED}>🚀 Avanzado</option>
           </select>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-gray-50/30">
        {messages.map((msg, idx) => (
          <div 
            key={msg.id} 
            className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex max-w-[85%] sm:max-w-[75%] gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
               
               {/* Avatar */}
               <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center self-end mb-1 shadow-sm ${msg.role === 'user' ? 'bg-indigo-100' : 'bg-white border border-gray-200'}`}>
                  {msg.role === 'user' ? <User className="w-4 h-4 text-indigo-600" /> : <Bot className="w-4 h-4 text-pink-500" />}
               </div>

               {/* Bubble */}
               <div className={`p-4 shadow-sm relative group transition-all duration-300 ${
                 msg.role === 'user' 
                   ? 'bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-[20px] rounded-br-none' 
                   : 'bg-white text-gray-700 border border-gray-100 rounded-[20px] rounded-bl-none hover:shadow-md'
               }`}>
                 <p className="whitespace-pre-wrap leading-relaxed text-[15px]">{msg.text}</p>
                 <span className={`text-[10px] absolute -bottom-5 ${msg.role === 'user' ? 'right-0' : 'left-0'} text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                 </span>
               </div>
            </div>
          </div>
        ))}
        
        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex justify-start w-full animate-[fadeIn_0.3s_ease-out]">
             <div className="flex gap-3 max-w-[75%]">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center self-end mb-1">
                   <Bot className="w-4 h-4 text-pink-500" />
                </div>
                <div className="bg-white p-4 rounded-[20px] rounded-bl-none border border-gray-100 shadow-sm flex items-center gap-2">
                   <span className="text-xs font-bold text-gray-400 mr-2">Lumi está pensando</span>
                   <div className="flex gap-1">
                     <div className="w-2 h-2 bg-pink-400 rounded-full animate-[bounce_1s_infinite_0ms]"></div>
                     <div className="w-2 h-2 bg-pink-400 rounded-full animate-[bounce_1s_infinite_200ms]"></div>
                     <div className="w-2 h-2 bg-pink-400 rounded-full animate-[bounce_1s_infinite_400ms]"></div>
                   </div>
                </div>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-100">
        <div className="flex gap-3 items-end bg-gray-50 p-2 rounded-[24px] border border-gray-200 focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-300 transition-all shadow-inner">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={`Pregunta algo sobre ${currentSubject.name}...`}
            className="flex-1 bg-transparent text-gray-800 px-4 py-3 focus:outline-none placeholder-gray-400 font-medium"
            disabled={isLoading}
          />
          <button 
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className={`p-3 rounded-full mb-1 mr-1 transition-all duration-300 flex items-center justify-center ${
              !input.trim() 
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg hover:shadow-indigo-500/30 transform hover:scale-105 active:scale-95'
            }`}
          >
            {isLoading ? <MoreHorizontal className="w-5 h-5 animate-pulse" /> : <Send className="w-5 h-5 ml-0.5" />}
          </button>
        </div>
        <div className="text-center mt-2">
           <p className="text-[10px] text-gray-400">La IA puede cometer errores. Verifica la información importante.</p>
        </div>
      </div>
    </div>
  );
};