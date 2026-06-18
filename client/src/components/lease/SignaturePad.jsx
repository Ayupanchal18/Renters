import React, { useRef, useState, useEffect } from "react";
import { Eraser, Check, X } from "lucide-react";
import { Button } from "../ui/button";

/**
 * SignaturePad component
 * Premium HTML5 drawing canvas with touch and mouse support
 */
export default function SignaturePad({ onSave, onCancel }) {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [isEmpty, setIsEmpty] = useState(true);

    // Set canvas dimensions and resolution
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Get container dimensions
        const rect = canvas.parentElement.getBoundingClientRect();
        canvas.width = rect.width || 400;
        canvas.height = 200;

        // Reset canvas context style
        const ctx = canvas.getContext("2d");
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 2.5;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        
        // Draw dotted baseline
        clearCanvas();
    }, []);

    // Get cursor position relative to canvas
    const getCoordinates = (e) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };

        const rect = canvas.getBoundingClientRect();
        
        // Support both mouse and touch events
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    };

    // Drawing handlers
    const startDrawing = (e) => {
        e.preventDefault();
        const coords = getCoordinates(e);
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        ctx.beginPath();
        ctx.moveTo(coords.x, coords.y);
        setIsDrawing(true);
        setIsEmpty(false);
    };

    const draw = (e) => {
        if (!isDrawing) return;
        e.preventDefault();
        
        const coords = getCoordinates(e);
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        ctx.lineTo(coords.x, coords.y);
        ctx.stroke();
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    // Clear canvas
    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Redraw faint baseline for signatures
        ctx.beginPath();
        ctx.strokeStyle = "#cbd5e1"; // slate-300
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.moveTo(30, canvas.height - 40);
        ctx.lineTo(canvas.width - 30, canvas.height - 40);
        ctx.stroke();

        // Reset styles for drawing
        ctx.setLineDash([]);
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 2.5;
        setIsEmpty(true);
    };

    // Export signature as base64 PNG
    const handleSave = () => {
        const canvas = canvasRef.current;
        if (!canvas || isEmpty) return;

        // Export data
        const dataUrl = canvas.toDataURL("image/png");
        onSave?.(dataUrl);
    };

    return (
        <div className="space-y-4">
            <div className="border border-dashed border-border rounded-xl bg-slate-50 dark:bg-slate-950 p-2 relative overflow-hidden h-[220px]">
                <canvas
                    ref={canvasRef}
                    className="w-full h-full cursor-crosshair touch-none block"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                />
                
                {isEmpty && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-xs text-muted-foreground italic select-none">
                        Sign here using your mouse or touch screen
                    </div>
                )}
            </div>

            <div className="flex items-center justify-between gap-3">
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs text-muted-foreground hover:text-foreground h-9"
                    onClick={clearCanvas}
                    disabled={isEmpty}
                >
                    <Eraser className="w-3.5 h-3.5 mr-1" />
                    Clear Canvas
                </Button>

                <div className="flex items-center gap-2">
                    {onCancel && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-xs h-9"
                            onClick={onCancel}
                        >
                            <X className="w-3.5 h-3.5 mr-1" />
                            Cancel
                        </Button>
                    )}
                    <Button
                        type="button"
                        size="sm"
                        className="text-xs bg-primary text-primary-foreground h-9 font-semibold"
                        onClick={handleSave}
                        disabled={isEmpty}
                    >
                        <Check className="w-3.5 h-3.5 mr-1" />
                        Apply Signature
                    </Button>
                </div>
            </div>
        </div>
    );
}
