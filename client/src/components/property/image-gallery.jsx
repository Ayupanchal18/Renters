import React, { useState, useCallback, useEffect } from "react";
import { ChevronLeft, ChevronRight, X, Expand, Grid3X3, ImageOff } from "lucide-react";

const FALLBACK_IMAGE = "/property_image/placeholder.jpg";

export default function ImageGallery({ images = [], title = "Property" }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [failedImages, setFailedImages] = useState(new Set());
    const [viewMode, setViewMode] = useState('gallery'); // 'gallery' or 'grid'

    // Filter valid images
    const validImages = images?.filter(img => img && typeof img === 'string') || [];
    const hasImages = validImages.length > 0;
    const displayImages = hasImages ? validImages : [FALLBACK_IMAGE];

    const handleImageError = useCallback((url) => {
        setFailedImages(prev => new Set([...prev, url]));
    }, []);

    const getImageSrc = useCallback((url) => {
        return failedImages.has(url) ? FALLBACK_IMAGE : url;
    }, [failedImages]);

    const goTo = useCallback((index) => {
        setCurrentIndex(index);
    }, []);

    const goNext = useCallback(() => {
        setCurrentIndex(prev => (prev + 1) % displayImages.length);
    }, [displayImages.length]);

    const goPrev = useCallback(() => {
        setCurrentIndex(prev => (prev - 1 + displayImages.length) % displayImages.length);
    }, [displayImages.length]);

    // Keyboard navigation
    useEffect(() => {
        if (!isModalOpen) return;
        
        const handleKey = (e) => {
            if (e.key === 'ArrowRight') goNext();
            else if (e.key === 'ArrowLeft') goPrev();
            else if (e.key === 'Escape') setIsModalOpen(false);
        };
        
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [isModalOpen, goNext, goPrev]);

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isModalOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isModalOpen]);

    if (!hasImages) {
        return (
            <div className="relative h-[280px] sm:h-[360px] lg:h-[420px] lg:rounded-2xl overflow-hidden bg-muted">
                <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                    <ImageOff className="w-12 h-12 mb-3 opacity-40" />
                    <p className="text-base font-medium">No images available</p>
                    <p className="text-sm opacity-70">Photos will appear here when uploaded</p>
                </div>
            </div>
        );
    }

    return (
        <>
            {/* Main Gallery - Featured Hero Slider */}
            <div className="relative w-full h-[300px] sm:h-[400px] lg:h-[480px] lg:rounded-2xl overflow-hidden bg-slate-950 shadow-xl border border-border/40 group select-none">
                {/* Active Image Container */}
                <div 
                    className="relative w-full h-full flex items-center justify-center cursor-pointer p-2 sm:p-4"
                    onClick={() => setIsModalOpen(true)}
                >
                    {/* Ambient Blurred Backdrop for soft lighting */}
                    <img
                        src={getImageSrc(displayImages[currentIndex])}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-30 scale-110 pointer-events-none transition-all duration-700"
                    />
                    
                    {/* Main Featured Photo - Complete & Uncropped */}
                    <img
                        src={getImageSrc(displayImages[currentIndex])}
                        alt={`${title} - Photo ${currentIndex + 1}`}
                        className="relative z-10 max-w-full max-h-full object-contain rounded-lg shadow-2xl transition-transform duration-300 group-hover:scale-[1.01]"
                        onError={() => handleImageError(displayImages[currentIndex])}
                    />

                    {/* Gradient Overlay for Controls */}
                    <div className="absolute inset-0 z-20 bg-gradient-to-t from-slate-950/60 via-transparent to-slate-950/30 opacity-80 pointer-events-none" />
                </div>

                {/* Photo Counter Badge (Top Left) */}
                <div className="absolute top-4 left-4 z-30 flex items-center gap-2">
                    <span className="px-3 py-1 bg-black/60 backdrop-blur-md text-white text-xs font-semibold rounded-full border border-white/10 shadow-sm">
                        {currentIndex + 1} / {displayImages.length}
                    </span>
                </div>

                {/* Navigation Arrows (Prev / Next) */}
                {displayImages.length > 1 && (
                    <>
                        <button
                            onClick={(e) => { e.stopPropagation(); goPrev(); }}
                            className="absolute left-3 top-1/2 -translate-y-1/2 z-30 p-2.5 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md transition-all duration-200 opacity-90 hover:scale-110 active:scale-95 border border-white/10"
                            aria-label="Previous photo"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); goNext(); }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 z-30 p-2.5 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md transition-all duration-200 opacity-90 hover:scale-110 active:scale-95 border border-white/10"
                            aria-label="Next photo"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </>
                )}

                {/* Bottom Bar: Thumbnail Strip & Expand Button */}
                <div className="absolute bottom-3 left-3 right-3 z-30 flex items-center justify-between gap-3 pointer-events-none">
                    {/* Thumbnail Strip */}
                    {displayImages.length > 1 ? (
                        <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-black/60 backdrop-blur-md rounded-xl border border-white/10 pointer-events-auto max-w-[calc(100%-140px)] scrollbar-hide">
                            {displayImages.map((img, idx) => (
                                <button
                                    key={idx}
                                    onClick={(e) => { e.stopPropagation(); goTo(idx); }}
                                    className={`relative flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                                        idx === currentIndex
                                            ? "border-primary ring-2 ring-primary/40 scale-105"
                                            : "border-transparent opacity-60 hover:opacity-100"
                                    }`}
                                >
                                    <img
                                        src={getImageSrc(img)}
                                        alt={`Thumbnail ${idx + 1}`}
                                        className="w-full h-full object-cover"
                                        onError={() => handleImageError(img)}
                                    />
                                </button>
                            ))}
                        </div>
                    ) : <div />}

                    {/* View All / Expand Button */}
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="px-4 py-2 bg-white/95 hover:bg-white text-slate-900 backdrop-blur-md rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 shadow-lg flex items-center gap-2 pointer-events-auto hover:scale-105 active:scale-95 flex-shrink-0 ml-auto"
                    >
                        <Grid3X3 className="w-4 h-4" />
                        <span>View all {displayImages.length} photos</span>
                    </button>
                </div>
            </div>

            {/* Fullscreen Lightbox Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-md flex flex-col">
                    {/* Header */}
                    <div className="relative z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
                        <div className="text-white">
                            <p className="font-semibold text-base">{title}</p>
                            <p className="text-xs text-white/70">{currentIndex + 1} of {displayImages.length}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            {displayImages.length > 1 && (
                                <button
                                    onClick={() => setViewMode(v => v === 'gallery' ? 'grid' : 'gallery')}
                                    className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                                    title={viewMode === 'gallery' ? "Switch to Grid View" : "Switch to Single View"}
                                >
                                    <Grid3X3 className="w-5 h-5" />
                                </button>
                            )}
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                                title="Close"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {viewMode === 'gallery' ? (
                        // Fullscreen Gallery View
                        <div className="flex-1 relative flex items-center justify-center p-4">
                            <img
                                src={getImageSrc(displayImages[currentIndex])}
                                alt={`${title} - ${currentIndex + 1}`}
                                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                                onError={() => handleImageError(displayImages[currentIndex])}
                            />

                            {/* Modal Navigation Arrows */}
                            {displayImages.length > 1 && (
                                <>
                                    <button
                                        onClick={goPrev}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                                        aria-label="Previous photo"
                                    >
                                        <ChevronLeft className="w-6 h-6" />
                                    </button>
                                    <button
                                        onClick={goNext}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                                        aria-label="Next photo"
                                    >
                                        <ChevronRight className="w-6 h-6" />
                                    </button>
                                </>
                            )}

                            {/* Modal Bottom Thumbnail Strip */}
                            {displayImages.length > 1 && (
                                <div className="absolute bottom-4 left-0 right-0 p-4">
                                    <div className="flex justify-center gap-2 overflow-x-auto pb-2 max-w-2xl mx-auto scrollbar-hide">
                                        {displayImages.map((img, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => goTo(idx)}
                                                className={`flex-shrink-0 w-14 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                                                    idx === currentIndex 
                                                        ? 'border-primary ring-2 ring-primary/50 scale-105' 
                                                        : 'border-transparent opacity-60 hover:opacity-100'
                                                }`}
                                            >
                                                <img
                                                    src={getImageSrc(img)}
                                                    alt={`Thumbnail ${idx + 1}`}
                                                    className="w-full h-full object-cover"
                                                    onError={() => handleImageError(img)}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        // Fullscreen Grid View
                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {displayImages.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => { setCurrentIndex(idx); setViewMode('gallery'); }}
                                        className={`relative aspect-[4/3] rounded-xl overflow-hidden group border-2 transition-all ${
                                            idx === currentIndex ? 'border-primary' : 'border-transparent'
                                        }`}
                                    >
                                        <img
                                            src={getImageSrc(img)}
                                            alt={`${title} - ${idx + 1}`}
                                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                            onError={() => handleImageError(img)}
                                        />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </>
    );
}
