import React, { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from './button';
import { useTheme } from 'next-themes';

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="h-9 w-9">
        <Sun className="h-4 w-4" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    );
  }

  const toggleTheme = () => {
    // Simple toggle between light and dark only
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  // Use resolvedTheme for accurate theme detection
  const isDark = resolvedTheme === 'dark';

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      className="h-9 w-9"
      onClick={toggleTheme}
    >
      {isDark ? (
        <Moon className="h-4 w-4" />
      ) : (
        <Sun className="h-4 w-4" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
