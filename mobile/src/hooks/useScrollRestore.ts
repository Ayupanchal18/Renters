import { useRef, useCallback } from 'react';
import { ScrollView, FlatList } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_PREFIX = 'scroll:';

/**
 * Saves the scroll position when navigating away and restores it
 * when coming back (via React Navigation focus/blur events).
 *
 * Usage (ScrollView):
 *   const { scrollRef, onScroll } = useScrollRestore('home');
 *   <ScrollView ref={scrollRef} onScroll={onScroll} scrollEventThrottle={200}>
 *
 * Usage (FlatList):
 *   const { scrollRef, onScroll } = useScrollRestore('wishlist');
 *   <FlatList ref={scrollRef} onScroll={onScroll} scrollEventThrottle={200}>
 */
export function useScrollRestore(screenKey: string) {
  const scrollRef = useRef<ScrollView & FlatList>(null);
  const savedOffsetRef = useRef(0);

  const storageKey = `${STORAGE_PREFIX}${screenKey}`;

  // ── On focus: restore saved position ─────────────────────────────────────
  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      AsyncStorage.getItem(storageKey).then((raw) => {
        if (!mounted || !raw) return;
        const y = parseFloat(raw);
        if (!isNaN(y) && y > 0) {
          // Small delay to let the list render first
          setTimeout(() => {
            try {
              scrollRef.current?.scrollToOffset?.({ offset: y, animated: false });  // FlatList
              scrollRef.current?.scrollTo?.({ y, animated: false });                // ScrollView
            } catch { /* ignore */ }
          }, 80);
        }
      }).catch(() => {});

      // ── On blur: save current position ───────────────────────────────────
      return () => {
        mounted = false;
        if (savedOffsetRef.current > 0) {
          AsyncStorage.setItem(storageKey, String(savedOffsetRef.current)).catch(() => {});
        }
      };
    }, [storageKey])
  );

  // ── Track scroll position ─────────────────────────────────────────────────
  const onScroll = useCallback((event: any) => {
    savedOffsetRef.current = event.nativeEvent.contentOffset.y;
  }, []);

  return { scrollRef, onScroll };
}
