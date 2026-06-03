"use client";
import React, { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';

const ThemeSwitch = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="w-8 h-8 shrink-0" />;

  const isLight = theme === 'light';

  return (
    <button
      onClick={() => setTheme(isLight ? 'dark' : 'light')}
      className="w-8 h-8 rounded-lg flex items-center justify-center border border-v-outline-variant/15 dark:border-white/10 bg-white/50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 transition-all text-slate-500 dark:text-slate-400 relative overflow-hidden shrink-0"
      aria-label="Toggle Theme"
    >
      <span className="material-symbols-outlined text-[18px] transition-all duration-500 absolute rotate-0 scale-100 dark:rotate-90 dark:scale-0 dark:opacity-0" style={{ fontVariationSettings: '"FILL" 1' }}>
        light_mode
      </span>
      <span className="material-symbols-outlined text-[18px] transition-all duration-500 absolute rotate-90 scale-0 opacity-0 dark:rotate-0 dark:scale-100 dark:opacity-100" style={{ fontVariationSettings: '"FILL" 1' }}>
        dark_mode
      </span>
    </button>
  );
}

export default ThemeSwitch;
