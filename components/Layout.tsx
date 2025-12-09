
import React, { useRef, useState, useEffect } from 'react';
import { useGamification } from './GamificationContext';
import { AppView } from '../types';
import { Logo } from './Logo';
import { 
  Home, 
  MessageCircle, 
  Network, 
  Gamepad2, 
  Calendar, 
  Film,
  Menu,
  X,
  PanelLeft,
  PanelLeftClose,
  LayoutTemplate,
  Upload,
  User as UserIcon,
  Flame,
  Zap,
  FolderOpen,
  Loader2,
  Cloud,
  CheckCircle,
  RefreshCw,
  Bot
} from 'lucide-react';

interface LayoutProps {
  children?: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const { stats, currentView, setView, user, updateUserAvatar, backgroundTasks, isCloudSyncing } = useGamification();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const menuItems = [
    { id: AppView.DASHBOARD, label: 'Inicio', icon: Home, color: 'text-sky-500', bg: 'bg-sky-50' },
    { id: AppView.MATERIALS, label: 'Archivos', icon: FolderOpen, color: 'text-orange-500', bg: 'bg-orange-50' },
    { id: AppView.ASSISTANT, label: 'Ayudante', icon: Bot, color: 'text-green-500', bg: 'bg-green-50' }, // NEW
    { id: AppView.CHAT, label: 'Tutor IA', icon: MessageCircle, color: 'text-pink-500', bg: 'bg-pink-50' },
    { id: AppView.MAP_GENERATOR, label: 'Mapas Mentales', icon: Network, color: 'text-violet-500', bg: 'bg-violet-50', loading: backgroundTasks.mapGenerator === 'loading' },
    { id: AppView.STORY, label: 'Modo Película', icon: Film, color: 'text-indigo-500', bg: 'bg-indigo-50', loading: backgroundTasks.storyGenerator === 'loading' },
    { id: AppView.INFOGRAPHIC, label: 'Infografías', icon: LayoutTemplate, color: 'text-teal-500', bg: 'bg-teal-50' },
    { id: AppView.QUIZ, label: 'Quiz Arena', icon: Gamepad2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { id: AppView.PLANNER, label: 'Planificador', icon: Calendar, color: 'text-amber-500', bg: 'bg-amber-50' },
  ];

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // Close profile menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateUserAvatar(reader.result as string);
        setIsProfileMenuOpen(false);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen bg-lumi-bg font-sans flex text-candy-dark overflow-x-hidden">
      {/* Sidebar Desktop */}
      <aside 
        className={`hidden md:flex flex-col fixed h-full z-30 shadow-xl transition-all duration-300 ease-in-out bg-white border-r border-gray-100 overflow-hidden ${
          isSidebarOpen ? 'w-72 translate-x-0 opacity-100' : 'w-0 -translate-x-10 opacity-0'
        }`}
      >
        <div className="w-72 flex flex-col h-full p-6">
          {/* Logo Section */}
          <div className="px-2 mb-10 mt-2 shrink-0">
            <Logo className="w-12 h-12" />
          </div>

          {/* SCROLLABLE NAV SECTION */}
          <nav className="flex-1 space-y-3 overflow-y-auto colorful-scrollbar pr-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`
                  w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-200 group relative overflow-hidden
                  ${currentView === item.id 
                    ? 'bg-gray-50 shadow-sm translate-x-1 ring-1 ring-black/5' 
                    : 'hover:bg-gray-50 hover:translate-x-1'
                  }
                `}
              >
                {/* Active Indicator Bar */}
                {currentView === item.id && (
                  <div className={`absolute left-0 top-2 bottom-2 w-1.5 rounded-r-full ${item.color.replace('text-', 'bg-')}`}></div>
                )}

                {/* Icon Box */}
                <div className={`
                  p-2.5 rounded-xl transition-all duration-300 shrink-0 relative
                  ${currentView === item.id ? 'bg-white shadow-sm scale-110' : 'bg-gray-50 group-hover:bg-white group-hover:shadow-sm'}
                `}>
                   {item.loading ? (
                       <Loader2 className={`w-6 h-6 ${item.color} animate-spin`} strokeWidth={2.5}/>
                   ) : (
                       <item.icon className={`w-6 h-6 ${item.color}`} strokeWidth={2.5} />
                   )}
                   {/* Mini Status Dot */}
                   {item.loading && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-indigo-500 rounded-full border-2 border-white animate-pulse"></span>
                   )}
                </div>
                
                {/* Text */}
                <span className={`
                  text-base font-extrabold tracking-wide flex-1 text-left
                  ${currentView === item.id ? 'text-gray-900' : 'text-gray-500 group-hover:text-gray-700'}
                `}>
                  {item.label}
                </span>

                {/* Status Text (Creating...) */}
                {item.loading && isSidebarOpen && (
                    <span className="text-[10px] font-bold text-indigo-500 animate-pulse bg-indigo-50 px-2 py-0.5 rounded-full absolute right-2">
                        Creando...
                    </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out ${isSidebarOpen ? 'md:ml-72' : 'md:ml-0'}`}>
        {/* Top Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-20 px-6 py-4 flex justify-between items-center shadow-sm">
           {/* Mobile Menu Button */}
           <div className="md:hidden">
              <button onClick={toggleMobileMenu} className="p-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
                <Menu className="w-7 h-7" />
              </button>
           </div>

           {/* Desktop Sidebar Toggle */}
           <div className="hidden md:block mr-4">
              <button 
                onClick={toggleSidebar} 
                className="p-2 text-gray-400 hover:text-gray-800 hover:bg-gray-50 rounded-xl transition-colors focus:outline-none"
                title={isSidebarOpen ? "Ocultar menú" : "Mostrar menú"}
              >
                {isSidebarOpen ? <PanelLeftClose className="w-6 h-6" /> : <PanelLeft className="w-6 h-6" />}
              </button>
           </div>
           
           {/* CLOUD SYNC INDICATOR (NEW) */}
           <div className="flex-1 flex items-center ml-4">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-500 ${
                  isCloudSyncing 
                  ? 'bg-blue-50 border-blue-200 text-blue-600' 
                  : 'bg-green-50 border-green-200 text-green-600'
              }`}>
                  {isCloudSyncing ? (
                      <RefreshCw size={14} className="animate-spin"/>
                  ) : (
                      <CheckCircle size={14}/>
                  )}
                  <span className="text-xs font-bold hidden sm:inline">
                      {isCloudSyncing ? 'Guardando en la Nube...' : 'Nube Segura'}
                  </span>
              </div>
           </div>

           <div className="flex items-center gap-4 md:gap-6">
              {/* Energy */}
              <div className="flex items-center gap-2 bg-amber-50 px-4 py-2 rounded-2xl border border-amber-100 shadow-sm">
                <Zap className="w-5 h-5 text-amber-500 fill-current" />
                <span className="font-black text-amber-700">{stats.energy}</span>
              </div>
              
              {/* Streak */}
              <div className="flex items-center gap-2 bg-rose-50 px-4 py-2 rounded-2xl border border-rose-100 shadow-sm">
                <Flame className="w-5 h-5 text-rose-500 fill-current" />
                <span className="font-black text-rose-700 hidden sm:inline">{stats.streak} días</span>
              </div>
              
              {/* User Avatar with Simple Dropdown (Only change photo) */}
              <div className="relative" ref={profileMenuRef}>
                <button 
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center gap-3 pl-2 pr-1 py-1 rounded-full hover:bg-gray-50 transition-colors"
                >
                  <span className="text-sm font-extrabold text-gray-700 hidden sm:block tracking-tight">{user?.name}</span>
                  <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 p-0.5 shadow-md hover:scale-105 transition-transform">
                    {user?.avatar ? (
                      <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover rounded-full bg-white border-2 border-white" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200 rounded-full border-2 border-white">
                        <UserIcon className="text-gray-400 w-5 h-5"/>
                      </div>
                    )}
                  </div>
                </button>

                {/* Dropdown Menu */}
                {isProfileMenuOpen && (
                  <div className="absolute right-0 top-full mt-3 w-64 bg-white rounded-3xl shadow-2xl border border-gray-100 py-2 animate-[scaleIn_0.1s_ease-out] z-50 overflow-hidden">
                     <div className="px-6 py-4 border-b border-gray-50 mb-2 bg-gray-50/50">
                        <p className="text-base font-black text-gray-800">{user?.name}</p>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{user?.role}</p>
                     </div>
                     
                     <label className="flex items-center gap-4 px-6 py-4 hover:bg-indigo-50 cursor-pointer text-sm font-bold text-gray-700 transition-colors group">
                        <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600 group-hover:bg-indigo-200 transition-colors">
                           <Upload size={18}/>
                        </div>
                        Cambiar Foto
                        <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                     </label>
                  </div>
                )}
              </div>
           </div>
        </header>
        
        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 bg-gray-900/40 backdrop-blur-sm md:hidden" onClick={toggleMobileMenu}>
            <div className="absolute left-0 top-0 bottom-0 w-80 bg-white shadow-2xl p-6 flex flex-col" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-10 shrink-0">
                 <Logo className="w-10 h-10" />
                 <button onClick={toggleMobileMenu} className="p-2 bg-gray-50 rounded-full hover:bg-gray-100"><X className="w-6 h-6 text-gray-500" /></button>
              </div>
              
              {/* Mobile Scrollable Nav */}
              <nav className="space-y-3 flex-1 overflow-y-auto colorful-scrollbar pr-2">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => { setView(item.id); toggleMobileMenu(); }}
                    className={`
                      w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all
                      ${currentView === item.id 
                        ? 'bg-gray-50 shadow-sm border border-gray-100' 
                        : 'bg-white hover:bg-gray-50'
                      }
                    `}
                  >
                    <div className={`
                       p-2.5 rounded-xl shrink-0 relative
                       ${currentView === item.id ? 'bg-white shadow-sm' : 'bg-gray-50'}
                    `}>
                        {item.loading ? (
                             <Loader2 className={`w-6 h-6 ${item.color} animate-spin`} strokeWidth={2.5}/>
                        ) : (
                             <item.icon className={`w-6 h-6 ${item.color}`} strokeWidth={2.5}/>
                        )}
                        {item.loading && (
                            <span className="absolute -top-1 -right-1 w-3 h-3 bg-indigo-500 rounded-full border-2 border-white animate-pulse"></span>
                        )}
                    </div>
                    
                    <span className={`
                       text-lg font-extrabold flex-1 text-left
                       ${currentView === item.id ? 'text-gray-900' : 'text-gray-500'}
                    `}>
                        {item.label}
                    </span>
                    
                     {item.loading && (
                         <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full animate-pulse">
                             Creando...
                         </span>
                     )}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        )}

        <div className="p-4 md:p-8 max-w-[1920px] mx-auto w-full flex-1">
          {children}
        </div>
      </main>
    </div>
  );
};