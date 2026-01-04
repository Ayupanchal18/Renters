import React, { useState, useEffect, useCallback } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from './button';
import { useTheme } from 'next-themes';

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Buttery smooth theme toggle using View Transitions API
  const toggleTheme = useCallback(() => {
    const newTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
    
    // Check if View Transitions API is supported
    if (document.startViewTransition) {
      // Use View Transitions API for smooth GPU-accelerated transition
      document.startViewTransition(() => {
        setTheme(newTheme);
      });
    } else {
      // Fallback: instant switch for browsers without View Transitions
      setTheme(newTheme);
    }
  }, [resolvedTheme, setTheme]);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="h-9 w-9 relative overflow-hidden">
        <Sun className="h-4 w-4" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    );
  }

  const isDark = resolvedTheme === 'dark';

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      className="h-9 w-9 relative overflow-hidden"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {/* Sun Icon - visible in light mode */}
      <Sun 
        className={`h-4 w-4 absolute transition-transform duration-300 ease-out ${
          isDark 
            ? 'rotate-90 scale-0' 
            : 'rotate-0 scale-100'
        }`}
        style={{ opacity: isDark ? 0 : 1 }}
      />
      {/* Moon Icon - visible in dark mode */}
      <Moon 
        className={`h-4 w-4 absolute transition-transform duration-300 ease-out ${
          isDark 
            ? 'rotate-0 scale-100' 
            : '-rotate-90 scale-0'
        }`}
        style={{ opacity: isDark ? 1 : 0 }}
      />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}

