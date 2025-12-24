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
            {/* Main Gallery - Fixed height container */}
            <div className="relative h-[280px] sm:h-[360px] lg:h-[420px] lg:rounded-2xl overflow-hidden bg-slate-900">
                {displayImages.length === 1 ? (
                    // Single image layout
                    <div 
                        className="h-full cursor-pointer group"
                        onClick={() => setIsModalOpen(true)}
                    >
                        <img
                            src={getImageSrc(displayImages[0])}
                            alt={title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            onError={() => handleImageError(displayImages[0])}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <button className="absolute bottom-4 right-4 px-4 py-2 bg-white/90 backdrop-blur-sm rounded-lg text-sm font-medium text-slate-900 opacity-0 group-hover:opacity-100 transition-all hover:bg-white flex items-center gap-2">
                            <Expand className="w-4 h-4" />
                            View Photo
                        </button>
                    </div>
                ) : displayImages.length <= 3 ? (
                    // 2-3 images layout
                    <div className="grid grid-cols-2 gap-1 h-full">
                        <div 
                            className="relative cursor-pointer group"
                            onClick={() => { setCurrentIndex(0); setIsModalOpen(true); }}
                        >
                            <img
                                src={getImageSrc(displayImages[0])}
                                alt={`${title} - 1`}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                onError={() => handleImageError(displayImages[0])}
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                        </div>
                        <div className="grid grid-rows-2 gap-1">
                            {displayImages.slice(1, 3).map((img, idx) => (
                                <div 
                                    key={idx}
                                    className="relative cursor-pointer group"
                                    onClick={() => { setCurrentIndex(idx + 1); setIsModalOpen(true); }}
                                >
                                    <img
                                        src={getImageSrc(img)}
                                        alt={`${title} - ${idx + 2}`}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        onError={() => handleImageError(img)}
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    // 4+ images layout - Bento grid
                    <div className="grid grid-cols-4 grid-rows-2 gap-1 h-full">
                        {/* Main large image */}
                        <div 
                            className="col-span-2 row-span-2 relative cursor-pointer group"
                            onClick={() => { setCurrentIndex(0); setIsModalOpen(true); }}
                        >
                            <img
                                src={getImageSrc(displayImages[0])}
                                alt={`${title} - 1`}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                onError={() => handleImageError(displayImages[0])}
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                        </div>
                        
                        {/* Secondary images */}
                        {displayImages.slice(1, 5).map((img, idx) => (
                            <div 
                                key={idx}
                                className="relative cursor-pointer group"
                                onClick={() => { setCurrentIndex(idx + 1); setIsModalOpen(true); }}
                            >
                                <img
                                    src={getImageSrc(img)}
                                    alt={`${title} - ${idx + 2}`}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    onError={() => handleImageError(img)}
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                                
                                {/* Show more overlay on last visible image */}
                                {idx === 3 && displayImages.length > 5 && (
                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                        <span className="text-white text-lg font-semibold">
                                            +{displayImages.length - 5} more
                                        </span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* View All Photos Button */}
                {displayImages.length > 1 && (
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="absolute bottom-4 right-4 px-4 py-2.5 bg-white/95 backdrop-blur-sm rounded-lg text-sm font-medium text-slate-900 hover:bg-white transition-all shadow-lg flex items-center gap-2"
                    >
                        <Grid3X3 className="w-4 h-4" />
                        View all {displayImages.length} photos
                    </button>
                )}
            </div>

            {/* Fullscreen Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm">
                    {/* Header */}
                    <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
                        <div className="text-white">
                            <p className="font-medium">{title}</p>
                            <p className="text-sm text-white/70">{currentIndex + 1} of {displayImages.length}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            {displayImages.length > 1 && (
                                <button
                                    onClick={() => setViewMode(v => v === 'gallery' ? 'grid' : 'gallery')}
                                    className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                                >
                                    <Grid3X3 className="w-5 h-5" />
                                </button>
                            )}
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {viewMode === 'gallery' ? (
                        // Gallery View
                        <div className="h-full flex items-center justify-center p-4 pt-20 pb-24">
                            <img
                                src={getImageSrc(displayImages[currentIndex])}
                                alt={`${title} - ${currentIndex + 1}`}
                                className="max-w-full max-h-full object-contain rounded-lg"
                                onError={() => handleImageError(displayImages[currentIndex])}
                            />

                            {/* Navigation Arrows */}
                            {displayImages.length > 1 && (
                                <>
                                    <button
                                        onClick={goPrev}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                                    >
                                        <ChevronLeft className="w-6 h-6" />
                                    </button>
                                    <button
                                        onClick={goNext}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                                    >
                                        <ChevronRight className="w-6 h-6" />
                                    </button>
                                </>
                            )}

                            {/* Thumbnail Strip */}
                            {displayImages.length > 1 && (
                                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                                    <div className="flex justify-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                        {displayImages.map((img, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => goTo(idx)}
                                                className={`flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                                                    idx === currentIndex 
                                                        ? 'border-white scale-110' 
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
                        // Grid View
                        <div className="h-full overflow-y-auto p-4 pt-20">
                            <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                {displayImages.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => { setCurrentIndex(idx); setViewMode('gallery'); }}
                                        className="aspect-[4/3] rounded-lg overflow-hidden group"
                                    >
                                        <img
                                            src={getImageSrc(img)}
                                            alt={`${title} - ${idx + 1}`}
                                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                            onError={() => handleImageError(img)}
                                        />
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
