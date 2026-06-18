import { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Persisted state that survives app restarts.
 * Works just like useState but reads/writes from AsyncStorage.
 *
 * @param key    - Unique AsyncStorage key (e.g. 'home:scrollY')
 * @param initial - Default value if nothing is stored yet
 * @param debounceMs - How long to debounce writes (default 300ms)
 */
export function usePersistedState<T>(
  key: string,
  initial: T,
  debounceMs = 300
): [T, (value: T | ((prev: T) => T)) => void, boolean] {
  const [value, setValueRaw] = useState<T>(initial);
  const [hydrated, setHydrated] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Load from storage on mount ────────────────────────────────────────────
  useEffect(() => {
    AsyncStorage.getItem(key)
      .then((raw) => {
        if (raw !== null) {
          try {
            setValueRaw(JSON.parse(raw));
          } catch {
            // Corrupted data — use default
          }
        }
      })
      .catch(() => {/* ignore read errors */})
      .finally(() => setHydrated(true));
  }, [key]);

  // ── Setter — debounced write back to storage ──────────────────────────────
  const setValue = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValueRaw((prev) => {
        const resolved = typeof next === 'function'
          ? (next as (p: T) => T)(prev)
          : next;

        // Debounce the write
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          AsyncStorage.setItem(key, JSON.stringify(resolved)).catch(() => {});
        }, debounceMs);

        return resolved;
      });
    },
    [key, debounceMs]
  );

  return [value, setValue, hydrated];
}
