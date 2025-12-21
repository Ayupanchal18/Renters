/**
 * Theme-specific Error Boundary Components
 * Handles theme context errors and provides fallback theme values
 * Validates: Requirements 1.1, 1.5, 3.5
 */

import React from 'react';
import { AlertTriangle, RefreshCw, Palette } from 'lucide-react';
import { Button } from './button';
import { Card } from './card';
import { 
  getSystemTheme, 
  applyTheme, 
  createFallbackThemeContext,
  emergencyThemeRecovery,
  detectThemeIssues
} from '../../utils/themeUtils';

// Import useTheme from next-themes - it's a required dependency
import { useTheme } from 'next-themes';

// Create fallback theme context OUTSIDE of components (module level)
const FallbackThemeContext = React.createContext({
  theme: 'light',
  setTheme: () => {},
  resolvedTheme: 'light',
  systemTheme: 'light',
  themes: ['light', 'dark', 'system'],
});

/**
 * Theme Context Error Boundary
 * Catches errors related to theme context and provides fallback theme values
 */
export class ThemeErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      fallbackTheme: 'light' // Default fallback theme
    };
  }

  static getDerivedStateFromError(error) {
    // Check if this is a theme-related error
    const isThemeError = error.message?.includes('useContext') || 
                        error.message?.includes('theme') ||
                        error.message?.includes('ThemeProvider');
    
    return { 
      hasError: true,
      isThemeError
    };
  }

  componentDidCatch(error, errorInfo) {
    // Log theme-specific errors
    console.error('Theme Error Boundary caught an error:', {
      error: error.message,
      component: this.props.context || 'theme-dependent',
      stack: error.stack,
      errorInfo
    });

    this.setState({
      error,
      errorInfo,
      fallbackTheme: this.determineFallbackTheme()
    });
  }

  determineFallbackTheme = () => {
    return getSystemTheme();
  };

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
    this.props.onRetry?.();
  };

  handleFallbackTheme = (theme) => {
    this.setState({ fallbackTheme: theme });
    applyTheme(theme);
  };

  render() {
    if (this.state.hasError) {
      // If it's a theme error, provide fallback theme context
      if (this.state.isThemeError) {
        return (
          <ThemeFallbackProvider 
            theme={this.state.fallbackTheme}
            onThemeChange={this.handleFallbackTheme}
          >
            <ThemeErrorFallback
              error={this.state.error}
              onRetry={this.handleRetry}
              fallbackTheme={this.state.fallbackTheme}
              onThemeChange={this.handleFallbackTheme}
              className={this.props.className}
            />
          </ThemeFallbackProvider>
        );
      }

      // For non-theme errors, use regular error display
      return (
        <div className="min-h-[200px] flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-medium text-card-foreground mb-2">
              Component Error
            </h3>
            <p className="text-muted-foreground mb-4">
              {this.state.error?.message || 'An unexpected error occurred in this component.'}
            </p>
            <Button onClick={this.handleRetry} className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Fallback Theme Provider
 * Provides minimal theme context when ThemeProvider fails
 */
export function ThemeFallbackProvider({ children, theme = 'light', onThemeChange }) {
  const fallbackContext = React.useMemo(() => {
    const baseContext = createFallbackThemeContext(theme);
    
    // Override setTheme if custom handler provided
    if (onThemeChange) {
      return {
        ...baseContext,
        setTheme: onThemeChange
      };
    }
    
    return baseContext;
  }, [theme, onThemeChange]);

  // Apply theme class to document
  React.useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Use the module-level context instead of creating a new one
  return (
    <FallbackThemeContext.Provider value={fallbackContext}>
      {children}
    </FallbackThemeContext.Provider>
  );
}

/**
 * Theme Error Fallback Component
 */
export function ThemeErrorFallback({ 
  error, 
  onRetry, 
  fallbackTheme, 
  onThemeChange, 
  className = '' 
}) {
  const handleThemeSelect = (theme) => {
    onThemeChange?.(theme);
  };

  return (
    <div className={`min-h-[300px] flex items-center justify-center p-4 ${className}`}>
      <Card className="w-full max-w-md p-6 text-center">
        <div className="w-16 h-16 bg-orange/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Palette className="w-8 h-8 text-orange" />
        </div>
        
        <h2 className="text-xl font-semibold text-card-foreground mb-2">
          Theme System Error
        </h2>
        
        <p className="text-muted-foreground mb-4">
          The theme system encountered an error. We've activated a fallback theme to keep things working.
        </p>
        
        <div className="mb-6">
          <p className="text-sm text-muted-foreground mb-3">Current fallback theme:</p>
          <div className="flex justify-center gap-2">
            {['light', 'dark'].map((theme) => (
              <Button
                key={theme}
                variant={fallbackTheme === theme ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleThemeSelect(theme)}
                className="capitalize"
              >
                {theme}
              </Button>
            ))}
          </div>
        </div>
        
        <div className="space-y-2">
          <Button onClick={onRetry} className="w-full">
            <RefreshCw className="w-4 h-4 mr-2" />
            Restore Theme System
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => window.location.reload()}
          >
            Reload Page
          </Button>
        </div>
        
        {import.meta.env.DEV && error && (
          <details className="mt-4 text-left">
            <summary className="text-sm text-muted-foreground cursor-pointer">
              Error Details (Development)
            </summary>
            <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto max-h-32">
              {error.message}
              {error.stack && `\n\n${error.stack}`}
            </pre>
          </details>
        )}
      </Card>
    </div>
  );
}

/**
 * Theme Loading State Component
 * Handles graceful loading states during theme initialization
 * 
 * IMPORTANT: This component MUST always render children with the exact same
 * component tree structure to prevent React hook count mismatches.
 * Never conditionally wrap children in different providers.
 */
export function ThemeLoadingState({ children }) {
  // Simply pass through children - theme loading is handled by next-themes internally
  // Removing the loading state logic prevents hook count mismatches during refresh
  return children;
}

/**
 * Safe Theme Hook
 * Simply wraps useTheme from next-themes with a fallback
 * 
 * Validates: Requirements 1.1, 1.2, 1.3, 1.5
 */
export function useSafeTheme() {
  // Call useTheme unconditionally - it's always available since we import it at module level
  const themeContext = useTheme();
  
  // Return the theme context, with fallback values if needed
  return {
    theme: themeContext?.theme || 'system',
    setTheme: themeContext?.setTheme || (() => {}),
    resolvedTheme: themeContext?.resolvedTheme || 'light',
    systemTheme: themeContext?.systemTheme || 'light',
    themes: themeContext?.themes || ['light', 'dark', 'system'],
  };
}

/**
 * Theme-Safe Component Wrapper
 * Wraps components that use theme to provide error boundaries and fallbacks
 */
export function ThemeSafeWrapper({ children, context, className }) {
  return (
    <ThemeErrorBoundary context={context} className={className}>
      <ThemeLoadingState>
        {children}
      </ThemeLoadingState>
    </ThemeErrorBoundary>
  );
}