

import React, { useState } from 'react';
import { useGamification } from '../components/GamificationContext';
import { Logo } from '../components/Logo';
import { 
  Upload, ChevronRight, User, Sparkles, Mail, Lock, 
  Phone, AlertCircle, Loader2, ArrowRight 
} from 'lucide-react';

const PRESET_AVATARS = [
  'https://cdn.jsdelivr.net/gh/alohe/avatars/png/memo_1.png',
  'https://cdn.jsdelivr.net/gh/alohe/avatars/png/vibrent_1.png',
  'https://cdn.jsdelivr.net/gh/alohe/avatars/png/notion_4.png',
  'https://cdn.jsdelivr.net/gh/alohe/avatars/png/memo_12.png',
  'https://cdn.jsdelivr.net/gh/alohe/avatars/png/vibrent_5.png',
  'https://cdn.jsdelivr.net/gh/alohe/avatars/png/notion_12.png',
];

type AuthMode = 'login' | 'register';

export const Login = () => {
  const { login, register } = useGamification();
  const [mode, setMode] = useState<AuthMode>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form States
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    avatar: PRESET_AVATARS[0]
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, avatar: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === 'login') {
        const success = await login(formData.email, formData.password);
        if (!success) {
          setError("Credenciales incorrectas. Verifica tu correo y contraseña.");
        }
      } else {
        if (!formData.name || !formData.email || !formData.password || !formData.phone) {
          setError("Por favor completa todos los campos.");
          setLoading(false);
          return;
        }
        await register({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          avatar: formData.avatar
        });
      }
    } catch (err: any) {
      setError(err.message || "Ocurrió un error inesperado.");
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setError(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      password: '',
      avatar: PRESET_AVATARS[0]
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-pink-50 flex flex-col items-center justify-center p-4 md:p-6 font-sans">
      
      {/* Decorative Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-64 h-64 bg-candy-sky/20 rounded-full blur-[80px] animate-pulse" />
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-candy-pink/20 rounded-full blur-[100px] animate-[pulse_5s_infinite_1s]" />
      </div>

      <div className="relative z-10 w-full max-w-lg bg-white/90 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-white p-8 md:p-10 animate-[scaleIn_0.3s_ease-out]">
        
        <div className="flex justify-center mb-6">
           <Logo className="w-14 h-14" showText={false} />
        </div>

        <div className="text-center mb-8">
           <h1 className="text-3xl font-black text-gray-800 font-logo mb-2">
             {mode === 'login' ? 'Bienvenido de nuevo' : 'Únete a LumiLearn'}
           </h1>
           <p className="text-gray-500 font-medium">
             {mode === 'login' ? 'Tu tutor IA te está esperando' : 'Crea tu cuenta y empieza a aprender'}
           </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 animate-[fadeIn_0.3s_ease-out]">
          
          {/* REGISTER EXTRA FIELDS */}
          {mode === 'register' && (
            <div className="space-y-5 animate-[slideUp_0.2s_ease-out]">
              {/* Avatar Selector */}
              <div className="flex flex-col items-center gap-4 mb-6">
                 <div className="relative group">
                     <div className="w-24 h-24 rounded-full p-1 border-4 border-white shadow-lg bg-gradient-to-br from-candy-sky to-candy-lilac overflow-hidden">
                        <img src={formData.avatar} alt="Avatar" className="w-full h-full object-cover rounded-full bg-white" />
                     </div>
                     <label className="absolute bottom-0 right-0 bg-gray-900 text-white p-2 rounded-full cursor-pointer hover:scale-110 transition-transform shadow-md">
                        <Upload size={14} />
                        <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                     </label>
                 </div>
                 <div className="flex gap-2 justify-center">
                    {PRESET_AVATARS.slice(0, 4).map((avatar, i) => (
                       <button 
                         type="button"
                         key={i}
                         onClick={() => setFormData(prev => ({ ...prev, avatar }))}
                         className={`w-8 h-8 rounded-full overflow-hidden border-2 transition-all ${formData.avatar === avatar ? 'border-candy-pink scale-110' : 'border-transparent hover:border-gray-200'}`}
                       >
                          <img src={avatar} alt={`Avatar ${i}`} className="w-full h-full object-cover" />
                       </button>
                    ))}
                 </div>
              </div>

              <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
                  <input 
                    type="text" 
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Nombre Completo"
                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl py-3.5 pl-12 pr-4 font-bold text-gray-700 outline-none focus:border-candy-sky focus:bg-white transition-all"
                  />
              </div>

              <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
                  <input 
                    type="tel" 
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Número de Teléfono"
                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl py-3.5 pl-12 pr-4 font-bold text-gray-700 outline-none focus:border-candy-sky focus:bg-white transition-all"
                  />
              </div>
            </div>
          )}

          {/* COMMON FIELDS */}
          <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
              <input 
                type="email" 
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Correo Electrónico"
                className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl py-3.5 pl-12 pr-4 font-bold text-gray-700 outline-none focus:border-candy-sky focus:bg-white transition-all"
                required
              />
          </div>

          <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
              <input 
                type="password" 
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Contraseña"
                className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl py-3.5 pl-12 pr-4 font-bold text-gray-700 outline-none focus:border-candy-sky focus:bg-white transition-all"
                required
              />
          </div>
          
          {error && (
            <div className="flex items-center gap-2 text-red-500 text-sm font-bold bg-red-50 p-3 rounded-xl animate-[shake_0.5s_ease-in-out]">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gray-900 hover:bg-black text-white font-bold rounded-2xl shadow-xl shadow-gray-200 transition-all flex items-center justify-center gap-2 disabled:opacity-70 group"
          >
             {loading ? <Loader2 size={20} className="animate-spin" /> : (
               <>
                 {mode === 'login' ? 'Iniciar Sesión' : 'Registrarse'} 
                 <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform"/>
               </>
             )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <p className="text-gray-500 text-sm font-medium">
            {mode === 'login' ? "¿No tienes cuenta? " : "¿Ya tienes cuenta? "}
            <button 
              onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
              className="text-candy-pink font-bold hover:underline"
            >
              {mode === 'login' ? 'Regístrate aquí' : 'Inicia Sesión'}
            </button>
          </p>
        </div>

      </div>
      
      <p className="mt-8 text-gray-400 text-xs font-bold uppercase tracking-widest">LumiLearn Secure Auth v2.0</p>
    </div>
  );
};