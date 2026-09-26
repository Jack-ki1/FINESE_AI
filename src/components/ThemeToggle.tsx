import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle() {
  const [dark, setDark] = useState(() => {
    if (typeof window === 'undefined') return false;
    const saved = localStorage.getItem('datum-theme');
    if (saved === 'dark') return true;
    if (saved === 'light') return false;
    // light is base: default light
    return false;
  });

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('datum-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('datum-theme', 'light');
    }
  }, [dark]);

  useEffect(() => {
    const saved = localStorage.getItem('datum-theme');
    if (saved === 'dark') {
      setDark(true);
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      // default light
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
      if (!saved) localStorage.setItem('datum-theme', 'light');
    }
  }, []);

  return (
    <button
      onClick={() => setDark(d => !d)}
      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {dark ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
    </button>
  );
}
