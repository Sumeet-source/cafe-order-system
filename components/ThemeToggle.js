import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle({ className = '' }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className={`w-14 h-8 rounded-full bg-stone-800 border border-stone-700 ${className}`} />
    );
  }

  const isDark = theme === 'dark';

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label="Toggle theme"
      className={`relative w-14 h-8 rounded-full border transition-colors duration-200 ${
        isDark
          ? 'bg-stone-800 border-stone-700'
          : 'bg-stone-200 border-stone-300'
      } ${className}`}
    >
      {/* Sliding knob */}
      <div
        className={`absolute top-0.5 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 ease-out ${
          isDark
            ? 'left-0.5 bg-emerald-600'
            : 'left-6 bg-emerald-500'
        }`}
      >
        <div className="relative w-4 h-4">
          <Sun
            size={16}
            strokeWidth={2.5}
            className={`absolute inset-0 text-white transition-all duration-300 ${
              isDark ? 'opacity-0 rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'
            }`}
          />
          <Moon
            size={16}
            strokeWidth={2.5}
            className={`absolute inset-0 text-white transition-all duration-300 ${
              isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0'
            }`}
          />
        </div>
      </div>
    </button>
  );
}