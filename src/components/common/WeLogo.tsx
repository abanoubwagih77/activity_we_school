import React from 'react';

interface WeLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

export const WeLogo: React.FC<WeLogoProps> = ({ 
  size = 'md', 
  showText = true, 
  className = '' 
}) => {
  const sizeMap = {
    sm: { box: 'w-8 h-8', icon: 20, text: 'text-lg', badge: 'text-[9px]' },
    md: { box: 'w-10 h-10', icon: 24, text: 'text-2xl', badge: 'text-[10px]' },
    lg: { box: 'w-14 h-14', icon: 34, text: 'text-3xl', badge: 'text-xs' },
    xl: { box: 'w-16 h-16', icon: 40, text: 'text-4xl', badge: 'text-sm' },
  };

  const current = sizeMap[size];

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`} dir="rtl">
      {/* Authentic WE Signature Brand Circle */}
      <div 
        className={`${current.box} rounded-2xl flex items-center justify-center shrink-0 shadow-md shadow-[#5B2D82]/25 transition-transform group-hover:scale-105`}
        style={{
          background: 'linear-gradient(135deg, #5B2D82 0%, #461b68 100%)',
        }}
      >
        {/* SVG of the iconic lowercase "we" monogram */}
        <svg 
          viewBox="0 0 100 100" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="w-4/5 h-4/5 text-white"
        >
          {/* Stylized 'w' and 'e' */}
          <path
            d="M18 36 C18 48, 22 66, 31 66 C37 66, 42 56, 46 45 C50 56, 55 66, 61 66 C68 66, 73 50, 73 42"
            stroke="white"
            strokeWidth="9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M62 50 C62 40, 70 34, 80 34 C89 34, 93 42, 93 52 C93 54, 91 55, 87 55 L63 55 C63 63, 69 66, 77 66 C82 66, 86 64, 89 61"
            stroke="white"
            strokeWidth="8.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Brand Text: وي */}
      {showText && (
        <div className="flex items-center gap-1.5">
          <span 
            className={`font-black ${current.text} tracking-tight`}
            style={{ color: '#5B2D82' }}
          >
            وي
          </span>
          <span className="text-xs font-bold text-slate-400 dark:text-slate-500 font-mono tracking-wider">
            | we
          </span>
        </div>
      )}
    </div>
  );
};
