import React, { useState, useCallback, useEffect } from "react";
import { ChevronLeft, ChevronRight, X, ZoomIn, AlertCircle } from "lucide-react";

export default function ImageCarousel({ images = [], propertyTitle = "Property" }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [imageErrors, setImageErrors] = useState(new Set());
    const [imageLoadStates, setImageLoadStates] = useState(new Map());

    // Fallback images for different scenarios
    const FALLBACK_IMAGES = {
        property: "/property_image/placeholder.jpg",
        backup: "/placeholder.svg",
        error: "/property_image/placeholder.svg"
    };

    // Validate and sanitize images array
    const validImages = images?.filter(img => img && typeof img === 'string') || [];
    const hasValidImages = validImages.length > 0;

    // If no valid images, use fallback
    const displayImages = hasValidImages ? validImages : [FALLBACK_IMAGES.property];

    // Handle image loading errors
    const handleImageError = useCallback((imageUrl, index) => {
        setImageErrors(prev => new Set([...prev, imageUrl]));
        setImageLoadStates(prev => new Map([...prev, [imageUrl, 'error']]));
    }, []);

    // Handle successful image loading
    const handleImageLoad = useCallback((imageUrl) => {
        setImageLoadStates(prev => new Map([...prev, [imageUrl, 'loaded']]));
    }, []);

    // Get fallback image for failed loads
    const getFallbackImage = useCallback((originalUrl) => {
        if (imageErrors.has(originalUrl)) {
            return FALLBACK_IMAGES.property;
        }
        return originalUrl;
    }, [imageErrors, FALLBACK_IMAGES.property]);

    // Generate proper alt text
    const generateAltText = useCallback((index, isModal = false) => {
        const baseTitle = propertyTitle || "Property";
        const imageNumber = index + 1;
        const totalImages = displayImages.length;
        
        if (!hasValidImages) {
            return `${baseTitle} - No images available`;
        }
        
        const prefix = isModal ? "Full view of" : "";
        return `${prefix} ${baseTitle} - Image ${imageNumber} of ${totalImages}`.trim();
    }, [propertyTitle, displayImages.length, hasValidImages]);

    // Navigation functions with bounds checking
    const goToPrevious = useCallback(() => {
        if (displayImages.length <= 1) return;
        setCurrentIndex((prev) => (prev === 0 ? displayImages.length - 1 : prev - 1));
    }, [displayImages.length]);

    const goToNext = useCallback(() => {
        if (displayImages.length <= 1) return;
        setCurrentIndex((prev) => (prev === displayImages.length - 1 ? 0 : prev + 1));
    }, [displayImages.length]);

    // Reset current index if it's out of bounds
    useEffect(() => {
        if (currentIndex >= displayImages.length) {
            setCurrentIndex(0);
        }
    }, [currentIndex, displayImages.length]);

    // Keyboard navigation for modal
    useEffect(() => {
        if (!isModalOpen) return;

        const handleKeyDown = (e) => {
            switch (e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    goToPrevious();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    goToNext();
                    break;
                case 'Escape':
                    e.preventDefault();
                    setIsModalOpen(false);
                    break;
                default:
                    break;
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isModalOpen, goToPrevious, goToNext]);

    return (
        <>
            {/* Main Carousel */}
            <div className="relative group animate-fade-in overflow-hidden rounded-xl bg-slate-900">
                <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] lg:aspect-[16/9] overflow-hidden">
                    {!hasValidImages && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                            <AlertCircle className="w-12 h-12 mb-3 opacity-50" />
                            <p className="text-lg font-medium">No images available</p>
                            <p className="text-sm opacity-70">Property images will be displayed here when available</p>
                        </div>
                    )}
                    <img
                        src={getFallbackImage(displayImages[currentIndex])}
                        alt={generateAltText(currentIndex)}
                        className="absolute inset-0 w-full h-full object-contain bg-slate-900"
                        onError={(e) => {
                            handleImageError(displayImages[currentIndex], currentIndex);
                            // Prevent infinite error loops
                            if (e.target.src !== FALLBACK_IMAGES.backup) {
                                e.target.src = FALLBACK_IMAGES.backup;
                            }
                        }}
                        onLoad={() => handleImageLoad(displayImages[currentIndex])}
                        loading="lazy"
                    />
                    {imageErrors.has(displayImages[currentIndex]) && (
                        <div className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-amber-500 text-white px-2 py-1 sm:px-3 sm:py-1.5 rounded text-xs sm:text-sm font-medium animate-slide-down">
                            <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" />
                            Image unavailable
                        </div>
                    )}
                </div>

                {/* Overlay Controls */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-between p-2 sm:p-4">
                    <button
                        onClick={goToPrevious}
                        disabled={displayImages.length <= 1}
                        className="touch-target bg-white/95 hover:bg-white text-slate-900 p-2 sm:p-2.5 rounded-full shadow-lg transition-all duration-200 opacity-0 group-hover:opacity-100 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 focus-visible-enhanced"
                        aria-label="Previous image"
                    >
                        <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>

                    <button
                        onClick={() => setIsModalOpen(true)}
                        disabled={!hasValidImages}
                        className="touch-target bg-white/95 hover:bg-white text-slate-900 p-2 sm:p-2.5 rounded-full shadow-lg transition-all duration-200 opacity-0 group-hover:opacity-100 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 focus-visible-enhanced"
                        aria-label="View fullscreen"
                    >
                        <ZoomIn className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>

                    <button
                        onClick={goToNext}
                        disabled={displayImages.length <= 1}
                        className="touch-target bg-white/95 hover:bg-white text-slate-900 p-2 sm:p-2.5 rounded-full shadow-lg transition-all duration-200 opacity-0 group-hover:opacity-100 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 focus-visible-enhanced"
                        aria-label="Next image"
                    >
                        <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                </div>

                {/* Counter */}
                {hasValidImages && (
                    <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 bg-black/70 text-white px-2 py-1 sm:px-3 sm:py-1.5 rounded-full text-xs sm:text-sm font-bold animate-fade-in">
                        {currentIndex + 1} / {displayImages.length}
                    </div>
                )}

                {/* Thumbnail Strip */}
                {hasValidImages && displayImages.length > 1 && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-2 sm:p-3">
                        <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-1 scrollbar-hide">
                            {displayImages.map((img, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setCurrentIndex(idx)}
                                    className={`flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden border-2 transition-all duration-200 focus-visible-enhanced ${idx === currentIndex
                                        ? "border-white shadow-lg scale-105 animate-bounce-gentle"
                                        : "border-white/30 hover:border-white/70 hover:scale-105"
                                        }`}
                                    aria-label={`View image ${idx + 1} of ${displayImages.length}`}
                                    aria-current={idx === currentIndex ? 'true' : 'false'}
                                >
                                    <img
                                        src={getFallbackImage(img)}
                                        alt={`Thumbnail ${idx + 1} of ${displayImages.length}`}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            handleImageError(img, idx);
                                            if (e.target.src !== FALLBACK_IMAGES.backup) {
                                                e.target.src = FALLBACK_IMAGES.backup;
                                            }
                                        }}
                                        onLoad={() => handleImageLoad(img)}
                                    />
                                    {imageErrors.has(img) && (
                                        <div className="absolute inset-0 bg-amber-500/20 flex items-center justify-center">
                                            <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 text-amber-600" />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && hasValidImages && (
                <div 
                    className="fixed inset-0 z-50 bg-black/98 flex items-center justify-center p-4"
                    onClick={(e) => {
                        // Close modal when clicking outside the image
                        if (e.target === e.currentTarget) {
                            setIsModalOpen(false);
                        }
                    }}
                    role="dialog"
                    aria-modal="true"
                    aria-label="Image gallery modal"
                >
                    <button
                        onClick={() => setIsModalOpen(false)}
                        className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white p-2.5 rounded-full transition-colors z-10"
                        aria-label="Close fullscreen view"
                    >
                        <X className="w-6 h-6" />
                    </button>

                    <div className="relative w-full max-w-4xl aspect-[4/3]">
                        <img
                            src={getFallbackImage(displayImages[currentIndex])}
                            alt={generateAltText(currentIndex, true)}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                                handleImageError(displayImages[currentIndex], currentIndex);
                                if (e.target.src !== FALLBACK_IMAGES.backup) {
                                    e.target.src = FALLBACK_IMAGES.backup;
                                }
                            }}
                            onLoad={() => handleImageLoad(displayImages[currentIndex])}
                        />

                        {imageErrors.has(displayImages[currentIndex]) && (
                            <div className="absolute top-4 left-4 bg-amber-500 text-white px-3 py-2 rounded text-sm font-medium">
                                <AlertCircle className="w-4 h-4 inline mr-2" />
                                Image could not be loaded
                            </div>
                        )}

                        {displayImages.length > 1 && (
                            <>
                                <button
                                    onClick={goToPrevious}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white p-3 rounded-full transition-colors"
                                    aria-label="Previous image"
                                >
                                    <ChevronLeft className="w-8 h-8" />
                                </button>

                                <button
                                    onClick={goToNext}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white p-3 rounded-full transition-colors"
                                    aria-label="Next image"
                                >
                                    <ChevronRight className="w-8 h-8" />
                                </button>
                            </>
                        )}

                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm font-bold bg-black/60 px-4 py-2 rounded-full">
                            {currentIndex + 1} / {displayImages.length}
                        </div>
                    </div>

                    {/* Keyboard navigation hint */}
                    <div className="absolute bottom-4 right-4 text-white/70 text-xs bg-black/40 px-3 py-2 rounded">
                        Use ← → keys or click to navigate
                    </div>
                </div>
            )}
        </>
    );
}
