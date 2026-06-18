import { useEffect, useState } from 'react';
import { useSnackbar } from '../../context/SnackbarContext';
import { X, RotateCcw } from 'lucide-react';
import { cn } from '../../lib/utils';

/**
 * UndoSnackbar — renders all active snackbars from SnackbarContext.
 * Fixed bottom-left, stacks up to 3 simultaneous items.
 * Each snackbar shows a countdown and an Undo button.
 */

function SingleSnackbar({ snackbar, onUndo }) {
  const { id, message, expiresAt, duration } = snackbar;
  const [remaining, setRemaining] = useState(
    Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000))
  );

  useEffect(() => {
    const interval = setInterval(() => {
      const r = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
      setRemaining(r);
    }, 200);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const progress = Math.max(0, Math.min(100, ((expiresAt - Date.now()) / duration) * 100));

  return (
    <div
      className={cn(
        'flex items-center gap-3 bg-gray-900 dark:bg-gray-800 text-white',
        'rounded-lg shadow-xl px-4 py-3 min-w-[300px] max-w-sm',
        'animate-in slide-in-from-bottom-4 duration-200 relative overflow-hidden'
      )}
      role="alert"
      aria-live="polite"
    >
      {/* Progress bar */}
      <div
        className="absolute bottom-0 left-0 h-0.5 bg-indigo-400 transition-all"
        style={{ width: `${progress}%` }}
      />

      <span className="flex-1 text-sm font-medium">
        {message}
        <span className="text-gray-400 ml-2 text-xs">· Undo ({remaining}s)</span>
      </span>

      <button
        onClick={() => onUndo(id)}
        className="flex items-center gap-1 text-indigo-300 hover:text-indigo-200 transition-colors text-xs font-semibold shrink-0"
        aria-label="Undo action"
      >
        <RotateCcw className="h-3.5 w-3.5" />
        Undo
      </button>

      <button
        onClick={() => onUndo(id)}
        className="text-gray-400 hover:text-white transition-colors shrink-0"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function UndoSnackbar() {
  const { snackbars, dismissSnackbar } = useSnackbar();

  if (snackbars.length === 0) return null;

  return (
    <div
      className="fixed bottom-4 left-4 z-[9999] flex flex-col gap-2"
      aria-label="Undo snackbar stack"
    >
      {snackbars.map(snackbar => (
        <SingleSnackbar
          key={snackbar.id}
          snackbar={snackbar}
          onUndo={dismissSnackbar}
        />
      ))}
    </div>
  );
}
