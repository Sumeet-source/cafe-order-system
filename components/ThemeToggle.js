import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle({ className = '' }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className={`w-14 h-8 rounded-full bg-emerald-100 border border-emerald-200 ${className}`} />
    );
  }

  const isDark = theme === 'dark';

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label="Toggle theme"
      className={`group relative w-14 h-8 rounded-full border transition-all duration-500 overflow-hidden ${
        isDark
          ? 'bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-950 border-emerald-500/50 shadow-lg shadow-emerald-500/30'
          : 'bg-gradient-to-r from-emerald-100 via-white to-emerald-50 border-emerald-300/70 shadow-lg shadow-emerald-300/40'
      } ${className}`}
    >
      {/* Background sparkles (visible in dark mode) */}
      <div className={`absolute inset-0 transition-opacity duration-500 ${isDark ? 'opacity-100' : 'opacity-0'}`}>
        <div className="absolute top-1 left-2 w-0.5 h-0.5 rounded-full bg-emerald-200 animate-pulse"></div>
        <div className="absolute top-4 left-3 w-0.5 h-0.5 rounded-full bg-emerald-100 animate-pulse" style={{ animationDelay: '0.3s' }}></div>
        <div className="absolute top-2 right-4 w-0.5 h-0.5 rounded-full bg-emerald-200 animate-pulse" style={{ animationDelay: '0.6s' }}></div>
      </div>

      {/* Sun rays (visible in light mode) */}
      <div className={`absolute inset-0 transition-opacity duration-500 ${isDark ? 'opacity-0' : 'opacity-100'}`}>
        <div className="absolute top-1.5 left-1.5 w-1 h-1 rounded-full bg-emerald-400/70"></div>
        <div className="absolute bottom-1.5 left-2 w-0.5 h-0.5 rounded-full bg-emerald-400/50"></div>
        <div className="absolute top-2 right-2 w-0.5 h-0.5 rounded-full bg-emerald-400/50"></div>
      </div>

      {/* House Bird logo badge — opposite side of the knob */}
      <div className={`absolute top-1/2 -translate-y-1/2 transition-all duration-500 ${
        isDark ? 'right-1.5' : 'left-1.5'
      }`}>
        <div className={`w-6 h-6 rounded-full flex items-center justify-center shadow-sm ring-1 ${
          isDark ? 'bg-emerald-50 ring-emerald-300/30' : 'bg-emerald-700 ring-emerald-800/20'
        }`}>
          <img
            src="/logo.png"
            alt=""
            className="w-5 h-5 rounded-full"
          />
        </div>
      </div>

      {/* Sliding knob with sun/moon */}
      <div
        className={`absolute top-0.5 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-500 ease-out shadow-lg z-10 ${
          isDark
            ? 'left-0.5 bg-gradient-to-br from-emerald-600 to-emerald-700 shadow-emerald-500/50 ring-2 ring-emerald-400/40'
            : 'left-6 bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-emerald-500/40 ring-2 ring-emerald-300/60'
        }`}
      >
        <div className="relative w-4 h-4">
          <Sun
            size={16}
            strokeWidth={2.5}
            className={`absolute inset-0 text-white transition-all duration-500 ${
              isDark ? 'opacity-0 rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'
            }`}
          />
          <Moon
            size={16}
            strokeWidth={2.5}
            className={`absolute inset-0 text-white transition-all duration-500 ${
              isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0'
            }`}
          />
        </div>
      </div>

      {/* Glow ring on hover */}
      <div
        className={`absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none shadow-[0_0_15px_rgba(16,185,129,0.5)]`}
      ></div>
    </button>
  );
}