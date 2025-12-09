import React from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
  light?: boolean; // New prop for dark backgrounds
}

export const Logo = ({ className = "w-10 h-10", showText = true, light = false }: LogoProps) => {
  return (
    <div className="flex items-center gap-3 select-none group">
      {/* Isotipo: La Chispa Lumi */}
      <div className={`${className} relative flex-shrink-0 transition-transform duration-500 ease-out group-hover:rotate-12 group-hover:scale-110`}>
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-sm">
          {/* Petal Top-Left (Sky) */}
          <path 
            d="M50 50 L50 20 C50 10 40 0 30 10 C20 20 10 30 20 40 C30 50 40 50 50 50 Z" 
            fill={light ? "#AEE4FF" : "#AEE4FF"} 
            className="hover:opacity-90 transition-opacity"
          />
          {/* Petal Top-Right (Pink) */}
          <path 
            d="M50 50 L80 50 C90 50 100 40 90 30 C80 20 70 10 60 20 C50 30 50 40 50 50 Z" 
            fill={light ? "#FFB7C5" : "#FFB7C5"} 
            className="hover:opacity-90 transition-opacity"
          />
          {/* Petal Bottom-Right (Yellow) */}
          <path 
            d="M50 50 L50 80 C50 90 60 100 70 90 C80 80 90 70 80 60 C70 50 60 50 50 50 Z" 
            fill={light ? "#FEF4A6" : "#FEF4A6"} 
            className="hover:opacity-90 transition-opacity"
          />
          {/* Petal Bottom-Left (Mint) */}
          <path 
            d="M50 50 L20 50 C10 50 0 60 10 70 C20 80 30 90 40 80 C50 70 50 60 50 50 Z" 
            fill={light ? "#C8F7DC" : "#C8F7DC"} 
            className="hover:opacity-90 transition-opacity"
          />
          
          {/* Center Core (Lilac) */}
          <circle cx="50" cy="50" r="12" fill={light ? "#D9C6FF" : "#D9C6FF"} stroke={light ? "transparent" : "white"} strokeWidth="4" />
        </svg>
      </div>

      {/* Logotipo: Tipografía Estilizada */}
      {showText && (
        <div className="flex flex-col justify-center">
          <h1 className={`text-[1.75rem] font-bold tracking-tight leading-none font-['Quicksand'] transition-colors ${light ? 'text-white' : 'text-black'}`}>
            LumiLearn
          </h1>
          {/* Línea conectora suave */}
          <div className="h-1.5 w-full mt-1.5 rounded-full bg-gradient-to-r from-candy-sky via-candy-mint to-candy-yellow opacity-80 group-hover:scale-x-110 transition-transform duration-300 origin-left"></div>
        </div>
      )}
    </div>
  );
};