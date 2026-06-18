import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Slider } from '../ui/slider';
import { RotateCw, Crop as CropIcon, Image as ImageIcon, Save, Loader2, RefreshCw } from 'lucide-react';
import { toast } from '../ui/use-toast';

export default function MediaImageEditor({ open, onOpenChange, asset, onSaveComplete }) {
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
  
  // Crop state
  const [cropMode, setCropMode] = useState(false);
  const [aspectRatio, setAspectRatio] = useState('free'); // 'free', '1:1', '4:3', '16:9'
  const [cropBox, setCropBox] = useState({ x: 10, y: 10, w: 80, h: 80 }); // Percentage of image display
  
  const [saving, setSaving] = useState(false);
  const [saveMode, setSaveMode] = useState('new'); // 'new' | 'overwrite'
  
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const imageRef = useRef(null);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const initialCropBox = useRef({ x: 0, y: 0, w: 0, h: 0 });
  const resizeHandle = useRef(null); // 'nw', 'ne', 'se', 'sw', or null (for dragging whole box)

  // Load image
  useEffect(() => {
    if (open && asset && asset.cdnUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous'; // Avoid tainted canvas
      img.onload = () => {
        imageRef.current = img;
        resetEditor();
      };
      img.onerror = () => {
        toast({
          title: "Error loading image",
          description: "Failed to load image for editing.",
          variant: "destructive"
        });
      };
      img.src = asset.cdnUrl;
    }
  }, [open, asset]);

  // Redraw canvas whenever adjustments change
  useEffect(() => {
    if (imageRef.current) {
      drawCanvas();
    }
  }, [brightness, contrast, rotation, cropMode, cropBox, open]);

  const resetEditor = () => {
    setBrightness(100);
    setContrast(100);
    setRotation(0);
    setCropMode(false);
    setAspectRatio('free');
    setCropBox({ x: 10, y: 10, w: 80, h: 80 });
  };

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !imageRef.current) return;
    const ctx = canvas.getContext('2d');
    const img = imageRef.current;

    // Calculate dimensions based on rotation
    const isRotated90or270 = rotation === 90 || rotation === 270;
    const canvasWidth = isRotated90or270 ? img.height : img.width;
    const canvasHeight = isRotated90or270 ? img.width : img.height;

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Apply filters
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;

    // Handle rotation & translation
    ctx.save();
    ctx.translate(canvasWidth / 2, canvasHeight / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.drawImage(img, -img.width / 2, -img.height / 2);
    ctx.restore();
  };

  // Draggable crop box logic
  const handleMouseDown = (e, handle = null) => {
    if (!cropMode) return;
    e.preventDefault();
    isDragging.current = true;
    resizeHandle.current = handle;
    dragStart.current = { x: e.clientX, y: e.clientY };
    initialCropBox.current = { ...cropBox };
  };

  const handleMouseMove = (e) => {
    if (!isDragging.current || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const dx = ((e.clientX - dragStart.current.x) / containerRect.width) * 100;
    const dy = ((e.clientY - dragStart.current.y) / containerRect.height) * 100;

    let newBox = { ...initialCropBox.current };

    if (resizeHandle.current) {
      // Resize logic
      const handle = resizeHandle.current;
      if (handle.includes('e')) {
        newBox.w = Math.max(10, Math.min(100 - newBox.x, newBox.w + dx));
      }
      if (handle.includes('w')) {
        const potentialX = Math.max(0, Math.min(newBox.x + newBox.w - 10, newBox.x + dx));
        newBox.w = newBox.w + (newBox.x - potentialX);
        newBox.x = potentialX;
      }
      if (handle.includes('s')) {
        newBox.h = Math.max(10, Math.min(100 - newBox.y, newBox.h + dy));
      }
      if (handle.includes('n')) {
        const potentialY = Math.max(0, Math.min(newBox.y + newBox.h - 10, newBox.y + dy));
        newBox.h = newBox.h + (newBox.y - potentialY);
        newBox.y = potentialY;
      }

      // Enforce aspect ratios
      if (aspectRatio === '1:1') {
        const size = Math.min(newBox.w, newBox.h);
        newBox.w = size;
        newBox.h = size;
      } else if (aspectRatio === '4:3') {
        newBox.h = (newBox.w * 3) / 4;
      } else if (aspectRatio === '16:9') {
        newBox.h = (newBox.w * 9) / 16;
      }
    } else {
      // Drag whole box logic
      newBox.x = Math.max(0, Math.min(100 - newBox.w, newBox.x + dx));
      newBox.y = Math.max(0, Math.min(100 - newBox.h, newBox.y + dy));
    }

    setCropBox(newBox);
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    resizeHandle.current = null;
  };

  useEffect(() => {
    if (cropMode) {
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('mousemove', handleMouseMove);
    }
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [cropMode, cropBox, aspectRatio]);

  const changeAspectRatio = (ratio) => {
    setAspectRatio(ratio);
    let newBox = { ...cropBox };
    if (ratio === '1:1') {
      const size = Math.min(cropBox.w, cropBox.h);
      newBox.w = size;
      newBox.h = size;
    } else if (ratio === '4:3') {
      newBox.h = (cropBox.w * 3) / 4;
    } else if (ratio === '16:9') {
      newBox.h = (cropBox.w * 9) / 16;
    }
    
    // Ensure boundaries
    if (newBox.x + newBox.w > 100) newBox.x = 100 - newBox.w;
    if (newBox.y + newBox.h > 100) newBox.y = 100 - newBox.h;
    
    setCropBox(newBox);
  };

  const handleSave = async (mode = 'new') => {
    if (!canvasRef.current || !asset) return;
    setSaving(true);
    setSaveMode(mode);

    try {
      let finalCanvas = canvasRef.current;

      // If in crop mode, generate the cropped canvas content
      if (cropMode) {
        const sourceCanvas = canvasRef.current;
        const croppedCanvas = document.createElement('canvas');
        const ctx = croppedCanvas.getContext('2d');

        // Translate percentage crop box coordinates to actual canvas dimensions
        const cropX = (cropBox.x / 100) * sourceCanvas.width;
        const cropY = (cropBox.y / 100) * sourceCanvas.height;
        const cropW = (cropBox.w / 100) * sourceCanvas.width;
        const cropH = (cropBox.h / 100) * sourceCanvas.height;

        croppedCanvas.width = cropW;
        croppedCanvas.height = cropH;

        ctx.drawImage(sourceCanvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
        finalCanvas = croppedCanvas;
      }

      // Export canvas to blob
      finalCanvas.toBlob(async (blob) => {
        if (!blob) throw new Error("Canvas export failed");

        const filename = mode === 'new' 
          ? `edited_${Date.now()}_${asset.filename.replace(/[^a-zA-Z0-9.]/g, '_')}`
          : asset.originalName || asset.filename;

        const file = new File([blob], filename, { type: 'image/jpeg' });
        const formData = new FormData();
        
        const endpoint = mode === 'new' ? '/api/admin/media/upload' : `/api/admin/media/${asset._id}/replace`;
        
        if (mode === 'new') {
          formData.append('files', file);
          formData.append('module', asset.module);
        } else {
          formData.append('file', file);
        }

        const token = getToken();
        const headers = {};
        if (token) {
          headers['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
        }
        const userId = localStorage.getItem("userId");
        if (userId) {
          headers['x-user-id'] = userId;
        }

        const response = await fetch(endpoint, {
          method: mode === 'new' ? 'POST' : 'PATCH',
          headers,
          body: formData
        });

        const data = await response.json();

        if (response.ok && data.success) {
          toast({
            title: mode === 'new' ? "Saved as new asset" : "Asset replaced",
            description: data.message || "Canvas changes saved successfully."
          });
          onOpenChange(false);
          if (onSaveComplete) onSaveComplete(data.data);
        } else {
          throw new Error(data.message || "Failed to save edited image");
        }
      }, 'image/jpeg', 0.9);

    } catch (err) {
      console.error(err);
      toast({
        title: "Save Failed",
        description: err.message || "Could not save your changes. Try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-primary" />
            Image Editor: {asset?.originalName || asset?.filename}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 min-h-[400px]">
          {/* Main Workspace (Image Display) */}
          <div className="md:col-span-2 flex items-center justify-center bg-muted border rounded-lg p-4 relative min-h-[300px] select-none">
            <div 
              ref={containerRef} 
              className="relative max-w-full max-h-[400px] overflow-hidden shadow-md"
              style={{ userSelect: 'none' }}
            >
              {/* Canvas showing modified image */}
              <canvas 
                ref={canvasRef} 
                className="max-w-full max-h-[400px] object-contain block"
              />

              {/* Crop Box UI Overlay */}
              {cropMode && (
                <div
                  className="absolute border-2 border-primary bg-black/10 cursor-move"
                  style={{
                    left: `${cropBox.x}%`,
                    top: `${cropBox.y}%`,
                    width: `${cropBox.w}%`,
                    height: `${cropBox.h}%`,
                    boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)'
                  }}
                  onMouseDown={(e) => handleMouseDown(e)}
                >
                  {/* Grid Lines inside crop area */}
                  <div className="absolute inset-0 border border-white/20 grid grid-cols-3 grid-rows-3 pointer-events-none">
                    <div className="border-r border-b border-white/20"></div>
                    <div className="border-r border-b border-white/20"></div>
                    <div className="border-b border-white/20"></div>
                    <div className="border-r border-b border-white/20"></div>
                    <div className="border-r border-b border-white/20"></div>
                    <div className="border-b border-white/20"></div>
                    <div className="border-r border-white/20"></div>
                    <div className="border-r border-white/20"></div>
                    <div></div>
                  </div>

                  {/* Corner resizing anchors */}
                  <div 
                    className="absolute -top-1.5 -left-1.5 h-3.5 w-3.5 bg-white border border-primary rounded-full cursor-nwse-resize"
                    onMouseDown={(e) => handleMouseDown(e, 'nw')}
                  />
                  <div 
                    className="absolute -top-1.5 -right-1.5 h-3.5 w-3.5 bg-white border border-primary rounded-full cursor-nesw-resize"
                    onMouseDown={(e) => handleMouseDown(e, 'ne')}
                  />
                  <div 
                    className="absolute -bottom-1.5 -left-1.5 h-3.5 w-3.5 bg-white border border-primary rounded-full cursor-nesw-resize"
                    onMouseDown={(e) => handleMouseDown(e, 'sw')}
                  />
                  <div 
                    className="absolute -bottom-1.5 -right-1.5 h-3.5 w-3.5 bg-white border border-primary rounded-full cursor-nwse-resize"
                    onMouseDown={(e) => handleMouseDown(e, 'se')}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Controls */}
          <div className="space-y-6 flex flex-col justify-between">
            <div className="space-y-5">
              {/* Rotation & Crop Triggers */}
              <div className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Transformations</span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 justify-center"
                    onClick={() => setRotation((prev) => (prev + 90) % 360)}
                  >
                    <RotateCw className="h-4 w-4 mr-2" />
                    Rotate 90°
                  </Button>
                  <Button
                    variant={cropMode ? "default" : "outline"}
                    className="flex-1 justify-center"
                    onClick={() => setCropMode(!cropMode)}
                  >
                    <CropIcon className="h-4 w-4 mr-2" />
                    Crop Mode
                  </Button>
                </div>
              </div>

              {/* Crop Ratio Locking */}
              {cropMode && (
                <div className="space-y-2 p-3 bg-muted/40 rounded-lg border">
                  <span className="text-xs font-semibold text-muted-foreground block mb-1.5">Crop Aspect Ratio</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {['free', '1:1', '4:3', '16:9'].map((ratio) => (
                      <Button
                        key={ratio}
                        variant={aspectRatio === ratio ? "default" : "outline"}
                        size="sm"
                        onClick={() => changeAspectRatio(ratio)}
                        className="text-xs capitalize"
                      >
                        {ratio}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Sliders for Brightness & Contrast */}
              <div className="space-y-4 pt-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Adjustments</span>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Brightness</span>
                    <span className="font-medium">{brightness}%</span>
                  </div>
                  <Slider
                    min={50}
                    max={150}
                    step={1}
                    value={[brightness]}
                    onValueChange={(val) => setBrightness(val[0])}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Contrast</span>
                    <span className="font-medium">{contrast}%</span>
                  </div>
                  <Slider
                    min={50}
                    max={150}
                    step={1}
                    value={[contrast]}
                    onValueChange={(val) => setContrast(val[0])}
                  />
                </div>
              </div>
            </div>

            {/* Reset option */}
            <div className="pt-4 border-t flex flex-col gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={resetEditor}
                className="w-full text-xs hover:bg-muted"
              >
                <RefreshCw className="h-3.5 w-3.5 mr-2" />
                Reset Controls
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="mt-6 flex-col sm:flex-row gap-2 border-t pt-4">
          <Button
            variant="outline"
            disabled={saving}
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              disabled={saving}
              onClick={() => handleSave('overwrite')}
              className="w-full sm:w-auto text-amber-600 hover:text-amber-700 hover:bg-amber-50"
            >
              {saving && saveMode === 'overwrite' ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Replacing...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Overwrite Original
                </>
              )}
            </Button>
            <Button
              disabled={saving}
              onClick={() => handleSave('new')}
              className="w-full sm:w-auto"
            >
              {saving && saveMode === 'new' ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save as Copy
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
