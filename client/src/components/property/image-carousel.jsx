import { useState } from "react";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";

export default function ImageCarousel({ images, propertyTitle }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const goToPrevious = () => {
        setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    };

    const goToNext = () => {
        setCurrentIndex((prev) =>
            prev === images.length - 1 ? 0 : prev + 1
        );
    };

    return (
        <>
            {/* Main Carousel */}
            <div className="relative bg-slate-200 rounded-xl overflow-hidden shadow-lg group">
                <div className="relative w-full aspect-[4/3] bg-slate-300">
                    <img
                        src={"/placeholder.svg"}
                        // src={images[currentIndex] || "/placeholder.svg"}
                        alt={`${propertyTitle} - Image ${currentIndex + 1}`}
                        className="w-full h-full object-cover"
                    />
                </div>

                {/* Overlay Controls */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-between p-4">
                    <button
                        onClick={goToPrevious}
                        className="bg-white/95 hover:bg-white text-slate-900 p-2.5 rounded-full shadow-lg transition-all duration-200 opacity-0 group-hover:opacity-100 hover:scale-110"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>

                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-white/95 hover:bg-white text-slate-900 p-2.5 rounded-full shadow-lg transition-all duration-200 opacity-0 group-hover:opacity-100 hover:scale-110"
                    >
                        <ZoomIn className="w-5 h-5" />
                    </button>

                    <button
                        onClick={goToNext}
                        className="bg-white/95 hover:bg-white text-slate-900 p-2.5 rounded-full shadow-lg transition-all duration-200 opacity-0 group-hover:opacity-100 hover:scale-110"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>

                {/* Counter */}
                <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1.5 rounded-full text-xs font-bold">
                    {currentIndex + 1} / {images.length}
                </div>

                {/* Thumbnail Strip */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-3">
                    <div className="flex gap-2 overflow-x-auto pb-1">
                        {images.map((img, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentIndex(idx)}
                                className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${idx === currentIndex
                                    ? "border-white shadow-lg scale-105"
                                    : "border-white/30 hover:border-white/70"
                                    }`}
                            >
                                <img
                                    src={img || "/placeholder.svg"}
                                    alt={`Thumbnail ${idx + 1}`}
                                    className="w-full h-full object-cover"
                                />
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/98 flex items-center justify-center p-4">
                    <button
                        onClick={() => setIsModalOpen(false)}
                        className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white p-2.5 rounded-full transition-colors z-10"
                    >
                        <X className="w-6 h-6" />
                    </button>

                    <div className="relative w-full max-w-4xl aspect-[4/3]">
                        <img
                            src={images[currentIndex] || "/placeholder.svg"}
                            alt={`${propertyTitle} - Full View ${currentIndex + 1}`}
                            className="w-full h-full object-contain"
                        />

                        <button
                            onClick={goToPrevious}
                            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white p-3 rounded-full"
                        >
                            <ChevronLeft className="w-8 h-8" />
                        </button>

                        <button
                            onClick={goToNext}
                            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white p-3 rounded-full"
                        >
                            <ChevronRight className="w-8 h-8" />
                        </button>

                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm font-bold bg-black/60 px-4 py-2 rounded-full">
                            {currentIndex + 1} / {images.length}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
