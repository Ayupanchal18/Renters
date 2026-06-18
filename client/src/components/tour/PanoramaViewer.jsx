import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Maximize2, RotateCcw } from "lucide-react";

/**
 * PanoramaViewer
 * Lightweight 360° viewer using CSS 3D transforms — no external library needed.
 * Supports drag-to-rotate and multi-scene switching.
 *
 * Props:
 *   scenes: Array<{ url: string; label: string }>
 */
export default function PanoramaViewer({ scenes = [], className = "" }) {
    const [activeIdx, setActiveIdx] = useState(0);
    const [yaw, setYaw] = useState(0);          // horizontal rotation (deg)
    const [pitch, setPitch] = useState(0);      // vertical rotation (deg)
    const [dragging, setDragging] = useState(false);
    const [fullscreen, setFullscreen] = useState(false);
    const lastPos = useRef({ x: 0, y: 0 });
    const containerRef = useRef(null);

    // Reset view when scene changes
    useEffect(() => {
        setYaw(0);
        setPitch(0);
    }, [activeIdx]);

    // Cleanup pointer events on unmount
    useEffect(() => {
        const onUp = () => setDragging(false);
        window.addEventListener("pointerup", onUp);
        return () => window.removeEventListener("pointerup", onUp);
    }, []);

    if (!scenes || scenes.length === 0) return null;

    const scene = scenes[activeIdx];

    const onPointerDown = (e) => {
        setDragging(true);
        lastPos.current = { x: e.clientX, y: e.clientY };
        e.currentTarget.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e) => {
        if (!dragging) return;
        const dx = e.clientX - lastPos.current.x;
        const dy = e.clientY - lastPos.current.y;
        lastPos.current = { x: e.clientX, y: e.clientY };
        setYaw((y) => (y + dx * 0.3) % 360);
        setPitch((p) => Math.max(-80, Math.min(80, p - dy * 0.2)));
    };

    const toggleFullscreen = () => {
        if (!fullscreen) {
            containerRef.current?.requestFullscreen?.();
        } else {
            document.exitFullscreen?.();
        }
        setFullscreen((f) => !f);
    };

    return (
        <div ref={containerRef} className={`relative rounded-xl overflow-hidden border border-border bg-black select-none ${className}`} style={{ aspectRatio: "16/9" }}>
            {/* Panorama image with CSS 3D simulation */}
            <div
                className="w-full h-full overflow-hidden cursor-grab active:cursor-grabbing"
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={() => setDragging(false)}
                aria-label={`360° view of ${scene.label || "room"}`}
                role="img"
            >
                <img
                    src={scene.url}
                    alt={scene.label || "Panorama"}
                    className="w-full h-full object-cover pointer-events-none"
                    style={{
                        transform: `translateX(${-yaw * 0.8}px) translateY(${pitch * 0.8}px)`,
                        transition: dragging ? "none" : "transform 0.15s ease-out",
                        objectPosition: `${50 + yaw * 0.15}% ${50 - pitch * 0.2}%`,
                    }}
                    draggable={false}
                />
            </div>

            {/* Controls overlay */}
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between px-3 pb-3 pointer-events-none">
                {/* Scene switcher */}
                {scenes.length > 1 && (
                    <div className="flex items-center gap-1.5 pointer-events-auto">
                        <button
                            onClick={() => setActiveIdx((i) => Math.max(0, i - 1))}
                            disabled={activeIdx === 0}
                            className="p-1.5 rounded-lg bg-black/60 text-white disabled:opacity-40 hover:bg-black/80 transition-colors"
                            aria-label="Previous scene"
                        >
                            <ChevronLeft size={14} />
                        </button>
                        <span className="text-xs font-medium text-white bg-black/60 px-2 py-1 rounded-lg">
                            {scene.label || `Scene ${activeIdx + 1}`} ({activeIdx + 1}/{scenes.length})
                        </span>
                        <button
                            onClick={() => setActiveIdx((i) => Math.min(scenes.length - 1, i + 1))}
                            disabled={activeIdx === scenes.length - 1}
                            className="p-1.5 rounded-lg bg-black/60 text-white disabled:opacity-40 hover:bg-black/80 transition-colors"
                            aria-label="Next scene"
                        >
                            <ChevronRight size={14} />
                        </button>
                    </div>
                )}

                {/* Right controls */}
                <div className="flex items-center gap-1.5 pointer-events-auto ml-auto">
                    <button
                        onClick={() => { setYaw(0); setPitch(0); }}
                        className="p-1.5 rounded-lg bg-black/60 text-white hover:bg-black/80 transition-colors"
                        title="Reset view"
                        aria-label="Reset view"
                    >
                        <RotateCcw size={13} />
                    </button>
                    <button
                        onClick={toggleFullscreen}
                        className="p-1.5 rounded-lg bg-black/60 text-white hover:bg-black/80 transition-colors"
                        title="Fullscreen"
                        aria-label="Toggle fullscreen"
                    >
                        <Maximize2 size={13} />
                    </button>
                </div>
            </div>

            {/* Drag hint */}
            {!dragging && (
                <div className="absolute top-3 left-1/2 -translate-x-1/2 pointer-events-none">
                    <span className="text-[10px] text-white/80 bg-black/40 px-2.5 py-1 rounded-full">
                        Drag to explore
                    </span>
                </div>
            )}

            {/* Scene dots */}
            {scenes.length > 1 && (
                <div className="absolute top-3 right-3 flex flex-col gap-1 pointer-events-auto">
                    {scenes.map((s, i) => (
                        <button
                            key={i}
                            onClick={() => setActiveIdx(i)}
                            className={`w-1.5 h-1.5 rounded-full transition-all ${i === activeIdx ? "bg-white scale-125" : "bg-white/40 hover:bg-white/70"}`}
                            aria-label={s.label || `Scene ${i + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
