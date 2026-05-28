"use client";
import React, { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import '@/app/theme-switch.css';

const ThemeSwitch = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="w-16 h-8" />;

  return (
    <div className="theme-switch-wrapper scale-[0.3] origin-left -ml-2 -mt-4">
      <label className="bb8-toggle">
        <input 
          className="bb8-toggle__checkbox" 
          type="checkbox" 
          checked={theme === 'light'} 
          onChange={(e) => setTheme(e.target.checked ? 'light' : 'dark')} 
        />
        <div className="bb8-toggle__container">
          <div className="bb8-toggle__scenery">
            <div className="bb8-toggle__star" />
            <div className="bb8-toggle__star" />
            <div className="bb8-toggle__star" />
            <div className="bb8-toggle__star" />
            <div className="bb8-toggle__star" />
            <div className="bb8-toggle__star" />
            <div className="bb8-toggle__star" />
            <div className="tatto-1" />
            <div className="tatto-2" />
            <div className="gomrassen" />
            <div className="hermes" />
            <div className="chenini" />
            <div className="bb8-toggle__cloud" />
            <div className="bb8-toggle__cloud" />
            <div className="bb8-toggle__cloud" />
          </div>
          <div className="bb8">
            <div className="bb8__head-container">
              <div className="bb8__antenna" />
              <div className="bb8__antenna" />
              <div className="bb8__head" />
            </div>
            <div className="bb8__body" />
          </div>
          <div className="artificial__hidden">
            <div className="bb8__shadow" />
          </div>
        </div>
      </label>
    </div>
  );
}

export default ThemeSwitch;
