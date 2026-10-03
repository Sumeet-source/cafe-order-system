import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle({ className = '' }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className={`w-14 h-8 rounded-full bg-white/10 border border-white/20 ${className}`} />
    );
  }

  const isDark = theme === 'dark';

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label="Toggle theme"
      className={`group relative w-14 h-8 rounded-full border transition-all duration-500 overflow-hidden ${
        isDark
          ? 'bg-gradient-to-r from-indigo-900 to-slate-900 border-indigo-500/40 shadow-lg shadow-indigo-500/20'
          : 'bg-gradient-to-r from-sky-300 to-amber-200 border-amber-300/60 shadow-lg shadow-amber-300/30'
      } ${className}`}
    >
      {/* Background stars (visible in dark mode) */}
      <div className={`absolute inset-0 transition-opacity duration-500 ${isDark ? 'opacity-100' : 'opacity-0'}`}>
        <div className="absolute top-1 left-2 w-0.5 h-0.5 rounded-full bg-white animate-pulse"></div>
        <div className="absolute top-4 left-3 w-0.5 h-0.5 rounded-full bg-white animate-pulse" style={{ animationDelay: '0.3s' }}></div>
        <div className="absolute top-2 right-4 w-0.5 h-0.5 rounded-full bg-white animate-pulse" style={{ animationDelay: '0.6s' }}></div>
      </div>

      {/* Sun rays (visible in light mode) */}
      <div className={`absolute inset-0 transition-opacity duration-500 ${isDark ? 'opacity-0' : 'opacity-100'}`}>
        <div className="absolute top-1.5 left-1.5 w-1 h-1 rounded-full bg-white/80"></div>
        <div className="absolute bottom-1.5 left-2 w-0.5 h-0.5 rounded-full bg-white/60"></div>
        <div className="absolute top-2 right-2 w-0.5 h-0.5 rounded-full bg-white/60"></div>
      </div>

      {/* Sliding knob */}
      <div
        className={`absolute top-0.5 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-500 ease-out shadow-lg ${
          isDark
            ? 'left-0.5 bg-gradient-to-br from-indigo-500 to-purple-600 shadow-indigo-500/50'
            : 'left-6 bg-gradient-to-br from-amber-300 to-orange-400 shadow-amber-400/50'
        }`}
      >
        {/* Icon crossfade */}
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
        className={`absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
          isDark
            ? 'shadow-[0_0_15px_rgba(129,140,248,0.5)]'
            : 'shadow-[0_0_15px_rgba(251,191,36,0.5)]'
        }`}
      ></div>
    </button>
  );
}