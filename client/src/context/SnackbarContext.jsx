import { createContext, useContext, useState, useCallback, useRef } from 'react';

const SnackbarContext = createContext();

/**
 * Deferred-execution snackbar context.
 * Pattern: show snackbar immediately, delay the real destructive API call by `duration` ms.
 * Clicking "Undo" before the timer fires cancels the call entirely.
 */

export function SnackbarProvider({ children }) {
  const [snackbars, setSnackbars] = useState([]);
  const timers = useRef({});

  const dismissSnackbar = useCallback((id) => {
    setSnackbars(prev => prev.filter(s => s.id !== id));
    if (timers.current[id]) {
      clearTimeout(timers.current[id]);
      delete timers.current[id];
    }
  }, []);

  /**
   * Show an undo snackbar.
   * @param {object} opts
   * @param {string} opts.message - Display message (e.g. "User deleted")
   * @param {Function} opts.onConfirm - The real destructive operation (async fn)
   * @param {number} [opts.duration=5000] - How long before confirming (ms)
   */
  const showUndo = useCallback(({ message, onConfirm, duration = 5000 }) => {
    const id = `snackbar-${Date.now()}-${Math.random()}`;
    const expiresAt = Date.now() + duration;

    setSnackbars(prev => {
      // Max 3 simultaneous
      const next = [...prev, { id, message, expiresAt, duration }];
      return next.slice(-3);
    });

    timers.current[id] = setTimeout(async () => {
      dismissSnackbar(id);
      try {
        await onConfirm();
      } catch (err) {
        console.error('[SnackbarContext] onConfirm error:', err);
      }
    }, duration);

    // Return cancel function (undo)
    return () => dismissSnackbar(id);
  }, [dismissSnackbar]);

  return (
    <SnackbarContext.Provider value={{ showUndo, dismissSnackbar, snackbars }}>
      {children}
    </SnackbarContext.Provider>
  );
}

export function useSnackbar() {
  const ctx = useContext(SnackbarContext);
  if (!ctx) throw new Error('useSnackbar must be used within SnackbarProvider');
  return ctx;
}

export default SnackbarContext;
