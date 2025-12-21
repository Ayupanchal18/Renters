import { useState, useEffect, useRef, useMemo, useCallback } from 'react';

/**
 * Virtual scrolling component for performance optimization with large lists
 * Validates: Requirements 6.3
 */
export function VirtualScroll({
  items = [],
  itemHeight = 100,
  containerHeight = 600,
  renderItem,
  overscan = 5,
  className = '',
  onScroll,
  ...props
}) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef(null);

  // Calculate visible range
  const visibleRange = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight),
      items.length - 1
    );

    return {
      start: Math.max(0, startIndex - overscan),
      end: Math.min(items.length - 1, endIndex + overscan),
    };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

  // Get visible items
  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end + 1);
  }, [items, visibleRange]);

  // Handle scroll
  const handleScroll = useCallback((e) => {
    const newScrollTop = e.target.scrollTop;
    setScrollTop(newScrollTop);
    onScroll?.(e);
  }, [onScroll]);

  // Total height of all items
  const totalHeight = items.length * itemHeight;

  // Offset for visible items
  const offsetY = visibleRange.start * itemHeight;

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
      {...props}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          {visibleItems.map((item, index) => {
            const actualIndex = visibleRange.start + index;
            return (
              <div
                key={item.id || actualIndex}
                style={{ height: itemHeight }}
              >
                {renderItem(item, actualIndex)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * Virtual grid component for property cards
 */
export function VirtualGrid({
  items = [],
  itemWidth = 300,
  itemHeight = 400,
  containerWidth = 1200,
  containerHeight = 600,
  gap = 16,
  renderItem,
  className = '',
  ...props
}) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef(null);

  // Calculate columns
  const columnsPerRow = Math.floor((containerWidth + gap) / (itemWidth + gap));
  const totalRows = Math.ceil(items.length / columnsPerRow);
  const rowHeight = itemHeight + gap;

  // Calculate visible range
  const visibleRange = useMemo(() => {
    const startRow = Math.floor(scrollTop / rowHeight);
    const endRow = Math.min(
      startRow + Math.ceil(containerHeight / rowHeight),
      totalRows - 1
    );

    return {
      startRow: Math.max(0, startRow - 1),
      endRow: Math.min(totalRows - 1, endRow + 1),
      startIndex: Math.max(0, startRow - 1) * columnsPerRow,
      endIndex: Math.min(items.length - 1, (endRow + 1) * columnsPerRow + columnsPerRow - 1),
    };
  }, [scrollTop, rowHeight, containerHeight, totalRows, columnsPerRow, items.length]);

  // Get visible items
  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.startIndex, visibleRange.endIndex + 1);
  }, [items, visibleRange]);

  // Handle scroll
  const handleScroll = useCallback((e) => {
    setScrollTop(e.target.scrollTop);
  }, []);

  // Total height
  const totalHeight = totalRows * rowHeight;

  // Offset for visible items
  const offsetY = visibleRange.startRow * rowHeight;

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
      {...props}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            display: 'grid',
            gridTemplateColumns: `repeat(${columnsPerRow}, ${itemWidth}px)`,
            gap: `${gap}px`,
            justifyContent: 'center',
          }}
        >
          {visibleItems.map((item, index) => {
            const actualIndex = visibleRange.startIndex + index;
            return renderItem(item, actualIndex);
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * Hook for virtual scrolling with dynamic item heights
 */
export function useVirtualScroll({
  items,
  estimatedItemHeight = 100,
  containerHeight = 600,
  overscan = 5,
}) {
  const [scrollTop, setScrollTop] = useState(0);
  const [itemHeights, setItemHeights] = useState(new Map());
  const containerRef = useRef(null);

  // Calculate item positions
  const itemPositions = useMemo(() => {
    const positions = [];
    let totalHeight = 0;

    items.forEach((item, index) => {
      const height = itemHeights.get(index) || estimatedItemHeight;
      positions[index] = {
        top: totalHeight,
        height,
      };
      totalHeight += height;
    });

    return { positions, totalHeight };
  }, [items, itemHeights, estimatedItemHeight]);

  // Find visible range
  const visibleRange = useMemo(() => {
    const { positions } = itemPositions;
    let startIndex = 0;
    let endIndex = items.length - 1;

    // Binary search for start index
    let left = 0;
    let right = items.length - 1;
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const position = positions[mid];
      if (position.top + position.height < scrollTop) {
        left = mid + 1;
      } else {
        right = mid - 1;
        startIndex = mid;
      }
    }

    // Find end index
    for (let i = startIndex; i < items.length; i++) {
      const position = positions[i];
      if (position.top > scrollTop + containerHeight) {
        endIndex = i - 1;
        break;
      }
    }

    return {
      start: Math.max(0, startIndex - overscan),
      end: Math.min(items.length - 1, endIndex + overscan),
    };
  }, [itemPositions, scrollTop, containerHeight, items.length, overscan]);

  // Update item height
  const updateItemHeight = useCallback((index, height) => {
    setItemHeights(prev => {
      const newHeights = new Map(prev);
      newHeights.set(index, height);
      return newHeights;
    });
  }, []);

  return {
    containerRef,
    scrollTop,
    setScrollTop,
    visibleRange,
    itemPositions,
    updateItemHeight,
    totalHeight: itemPositions.totalHeight,
  };
}

/**
 * Intersection observer hook for infinite scrolling
 */
export function useInfiniteScroll({
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  threshold = 0.1,
  rootMargin = '100px',
}) {
  const loadMoreRef = useRef(null);

  useEffect(() => {
    const element = loadMoreRef.current;
    if (!element || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextPage();
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, threshold, rootMargin]);

  return loadMoreRef;
}

export default VirtualScroll;