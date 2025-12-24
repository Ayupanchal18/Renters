import { useState, useRef, useEffect } from 'react';
import { normalizeImageUrl, getPlaceholderImage, handleImageError } from '../../utils/imageUtils';

/**
 * Default image dimensions to prevent CLS (Cumulative Layout Shift)
 * These defaults provide a 4:3 aspect ratio which is common for property images
 */
export const DEFAULT_IMAGE_WIDTH = 400;
export const DEFAULT_IMAGE_HEIGHT = 300;

// Internal constants for component defaults
const DEFAULT_WIDTH = DEFAULT_IMAGE_WIDTH;
const DEFAULT_HEIGHT = DEFAULT_IMAGE_HEIGHT;

/**
 * LazyImage component with intersection observer for performance optimization
 * Implements lazy loading, error handling, and responsive images
 * 
 * SEO & Core Web Vitals Optimizations:
 * - Explicit width/height to prevent CLS (Requirements 4.4)
 * - Native lazy loading for non-priority images (Requirements 4.3)
 * - Descriptive alt text for accessibility (Requirements 4.7, 10.1)
 * 
 * Validates: Requirements 4.3, 4.4, 4.7, 6.2
 */
export function LazyImage({
  src,
  alt,
  className = '',
  fallback = null,
  propertyType = 'default',
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  priority = false,
  onLoad,
  onError,
  ...props
}) {
  // Ensure alt text is always meaningful for accessibility
  // If no alt provided, use a descriptive default based on context
  const effectiveAlt = alt && alt.trim() !== '' 
    ? alt 
    : `${propertyType !== 'default' ? propertyType + ' ' : ''}property image`;
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority); // Load immediately if priority
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(null);
  const imgRef = useRef(null);
  const observerRef = useRef(null);

  // Set up intersection observer for lazy loading
  useEffect(() => {
    if (priority || isInView) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before image comes into view
        threshold: 0.1
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
      observerRef.current = observer;
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [priority, isInView]);

  // Set source when image should be loaded
  useEffect(() => {
    if (isInView && src && !currentSrc) {
      setCurrentSrc(normalizeImageUrl(src));
    }
  }, [isInView, src, currentSrc]);

  const handleLoad = (e) => {
    setIsLoaded(true);
    setHasError(false);
    onLoad?.(e);
  };

  const handleImageLoadError = (e) => {
    setHasError(true);
    const fallbackUrl = fallback || getPlaceholderImage(propertyType);
    
    // Prevent infinite loop if fallback also fails
    if (e.target.src !== fallbackUrl) {
      setCurrentSrc(fallbackUrl);
      handleImageError(e, fallbackUrl);
    }
    
    onError?.(e);
  };

  // Generate responsive image attributes
  // Always include width and height to prevent CLS
  const getResponsiveProps = () => {
    // Generate srcSet for different screen densities
    const srcSet = currentSrc ? [
      `${currentSrc} 1x`,
      `${currentSrc} 2x` // In production, this would be actual optimized versions
    ].join(', ') : '';

    return {
      srcSet: srcSet || undefined,
      sizes,
      width,
      height
    };
  };

  return (
    <div 
      ref={imgRef}
      className={`relative overflow-hidden bg-muted ${className}`}
      {...props}
    >
      {/* Placeholder/Loading state */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-muted animate-pulse flex items-center justify-center">
          <div className="w-8 h-8 text-muted-foreground">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
            </svg>
          </div>
        </div>
      )}

      {/* Actual image */}
      {currentSrc && (
        <img
          src={currentSrc}
          alt={effectiveAlt}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={handleLoad}
          onError={handleImageLoadError}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          {...getResponsiveProps()}
        />
      )}

      {/* Error state */}
      {hasError && !isLoaded && (
        <div className="absolute inset-0 bg-muted flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <div className="w-8 h-8 mx-auto mb-2">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M21 5v6.59l-3-3.01-4 4.01-4-4-4 4-3-3.01V5c0-1.1.9-2 2-2h14c1.1 0 2 .9 2 2zm-3 6.42l3 3.01V19c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2v-6.58l3 2.99 4-4 4 4 4-3.99z"/>
              </svg>
            </div>
            <span className="text-xs">Image unavailable</span>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Optimized image component for property cards
 * Provides sensible defaults for property listing images
 * 
 * Validates: Requirements 4.3, 4.4, 4.7
 */
export function PropertyImage({ 
  property, 
  className = '',
  priority = false,
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
  ...props 
}) {
  const images = property?.photos || [];
  const primaryImage = images[0];
  
  // Generate descriptive alt text from property data
  const generateAltText = () => {
    if (!property) return 'Property image';
    
    const parts = [];
    if (property.title) parts.push(property.title);
    if (property.category || property.propertyType) {
      parts.push(property.category || property.propertyType);
    }
    if (property.location?.city) parts.push(`in ${property.location.city}`);
    
    return parts.length > 0 ? parts.join(' - ') : 'Property image';
  };
  
  if (!primaryImage) {
    return (
      <div 
        className={`bg-muted flex items-center justify-center ${className}`}
        style={{ width, height }}
        role="img"
        aria-label="No property image available"
      >
        <div className="text-muted-foreground text-center">
          <div className="w-12 h-12 mx-auto mb-2">
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
            </svg>
          </div>
          <span className="text-sm">No image</span>
        </div>
      </div>
    );
  }

  return (
    <LazyImage
      src={primaryImage}
      alt={generateAltText()}
      className={className}
      propertyType={property?.category || property?.propertyType}
      priority={priority}
      width={width}
      height={height}
      {...props}
    />
  );
}