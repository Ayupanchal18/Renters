import { useState, useEffect, useCallback } from "react";
import { 
    DndContext, 
    closestCenter, 
    KeyboardSensor, 
    PointerSensor, 
    useSensor, 
    useSensors,
    DragOverlay
} from "@dnd-kit/core";
import { 
    arrayMove, 
    SortableContext, 
    sortableKeyboardCoordinates, 
    rectSortingStrategy, 
    useSortable 
} from "@dnd-kit/sortable";
import { restrictToFirstScrollableAncestor } from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";
import Cropper from "react-easy-crop";
import { 
    Upload, 
    X, 
    ImageIcon, 
    AlertTriangle, 
    Camera, 
    Crop, 
    Trash2, 
    Star, 
    ArrowLeft, 
    ArrowRight, 
    RotateCw, 
    Maximize2,
    Sliders,
    Check
} from "lucide-react";
import { Button } from "../../ui/button";

const PHOTO_RULES = {
    maxCount: 15,
    maxSizeMB: 5,
    allowedTypes: ["image/jpeg", "image/png", "image/webp"],
};

// ───────── Canvas Image Cropping Utilities ─────────

const createImage = (url) =>
    new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener("load", () => resolve(image));
        image.addEventListener("error", (error) => reject(error));
        image.setAttribute("crossOrigin", "anonymous");
        image.src = url;
    });

function getRadianAngle(degreeValue) {
    return (degreeValue * Math.PI) / 180;
}

function rotateSize(width, height, rotation) {
    const rotRad = getRadianAngle(rotation);
    return {
        width: Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
        height: Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
    };
}

async function getCroppedImg(imageSrc, pixelCrop, rotation = 0) {
    const image = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) return null;

    const rotRad = getRadianAngle(rotation);
    const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
        image.width,
        image.height,
        rotation
    );

    canvas.width = bBoxWidth;
    canvas.height = bBoxHeight;

    ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
    ctx.rotate(rotRad);
    ctx.translate(-image.width / 2, -image.height / 2);

    ctx.drawImage(image, 0, 0);

    const croppedCanvas = document.createElement("canvas");
    const croppedCtx = croppedCanvas.getContext("2d");

    if (!croppedCtx) return null;

    croppedCanvas.width = pixelCrop.width;
    croppedCanvas.height = pixelCrop.height;

    croppedCtx.drawImage(
        canvas,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
    );

    return croppedCanvas.toDataURL("image/jpeg");
}

function dataURLtoFile(dataurl, filename) {
    const arr = dataurl.split(",");
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
}

// ───────── Sortable Photo Component ─────────

function SortablePhoto({ photo, index, onRemove, onCropClick, onSetCover, totalPhotos, onMoveKeyboard }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: photo.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : "auto",
        opacity: isDragging ? 0.3 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`relative group aspect-square rounded-2xl overflow-hidden border-2 transition-all duration-300 bg-card select-none ${
                index === 0 
                    ? "border-primary/60 ring-2 ring-primary/10 shadow-lg" 
                    : "border-border hover:border-primary/30 shadow-sm hover:shadow-md"
            }`}
        >
            <img
                src={photo.preview || "/placeholder.svg"}
                alt={`Property photo ${index + 1}`}
                className="w-full h-full object-cover pointer-events-none"
            />

            {/* Drag Handle Layer - Click and Drag triggers reordering */}
            <div 
                {...attributes} 
                {...listeners} 
                className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors cursor-grab active:cursor-grabbing z-10"
                title="Drag to reorder"
            />

            {/* Action buttons - Elevated above the drag layer */}
            <div className="absolute top-2.5 right-2.5 flex gap-1.5 z-20">
                <button
                    type="button"
                    onClick={() => onCropClick(index)}
                    className="p-1.5 rounded-lg bg-background/90 hover:bg-background text-foreground hover:text-primary border border-border/80 transition-all shadow-sm active:scale-95"
                    title="Crop photo"
                >
                    <Crop size={14} />
                </button>
                <button
                    type="button"
                    onClick={() => onRemove(index)}
                    className="p-1.5 rounded-lg bg-destructive/95 hover:bg-destructive text-destructive-foreground transition-all shadow-sm active:scale-95"
                    title="Delete photo"
                >
                    <Trash2 size={14} />
                </button>
            </div>

            {/* Cover Badge / Cover Selector */}
            <div className="absolute bottom-2.5 left-2.5 z-20">
                {index === 0 ? (
                    <span className="flex items-center gap-1 bg-primary text-primary-foreground text-[10px] font-bold px-2.5 py-1 rounded-lg shadow-sm border border-primary/20">
                        <Star size={10} className="fill-primary-foreground text-primary-foreground" />
                        Cover Photo
                    </span>
                ) : (
                    <button
                        type="button"
                        onClick={() => onSetCover(index)}
                        className="flex items-center gap-1 px-2.5 py-1 bg-background/90 hover:bg-background text-muted-foreground hover:text-amber-500 backdrop-blur-sm rounded-lg border border-border/80 text-[10px] font-bold transition-all shadow-sm active:scale-95"
                        title="Designate as Cover"
                    >
                        <Star size={10} className="text-muted-foreground group-hover:text-amber-500" />
                        Set Cover
                    </button>
                )}
            </div>

            {/* Accessibility Keyboard Reorder Shortcuts */}
            <div className="absolute bottom-2.5 right-2.5 z-20 flex gap-1 bg-background/90 backdrop-blur-sm p-0.5 rounded-lg border border-border/85 shadow-sm opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-300">
                <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => onMoveKeyboard(index, index - 1)}
                    className="p-1 rounded text-foreground hover:bg-muted disabled:opacity-20 disabled:hover:bg-transparent"
                    title="Move photo left"
                >
                    <ArrowLeft size={11} />
                </button>
                <button
                    type="button"
                    disabled={index === totalPhotos - 1}
                    onClick={() => onMoveKeyboard(index, index + 1)}
                    className="p-1 rounded text-foreground hover:bg-muted disabled:opacity-20 disabled:hover:bg-transparent"
                    title="Move photo right"
                >
                    <ArrowRight size={11} />
                </button>
            </div>
        </div>
    );
}

// ───────── Main PhotosStep Component ─────────

export default function PhotosStep({ formData, setFormData, validationErrors }) {
    const [dragActive, setDragActive] = useState(false);
    const [fileErrors, setFileErrors] = useState([]);
    
    // Crop Modal States
    const [croppingIndex, setCroppingIndex] = useState(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [aspect, setAspect] = useState(4 / 3);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

    // Active drag overlay state
    const [activeDragId, setActiveDragId] = useState(null);

    // Ensure all existing photos have stable unique ids
    useEffect(() => {
        if (formData.photos && formData.photos.some(p => !p.id)) {
            const updated = formData.photos.map((p, idx) => ({
                ...p,
                id: p.id || `photo-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`
            }));
            setFormData(prev => ({ ...prev, photos: updated }));
        }
    }, [formData.photos, setFormData]);

    // Setup sensors for dnd-kit
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // Minimum drag distance to distinguish from click
            }
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        const files = e.dataTransfer.files;
        handleFiles(files);
    };

    const handleChange = (e) => {
        const files = e.target.files;
        if (files) handleFiles(files);
        e.target.value = ""; // reset target input
    };

    const handleFiles = (files) => {
        const errors = [];
        const currentCount = formData.photos?.length || 0;
        const incomingFiles = Array.from(files);

        incomingFiles.forEach((file, index) => {
            // Count validation
            if (currentCount + index >= PHOTO_RULES.maxCount) {
                if (!errors.includes(`Maximum ${PHOTO_RULES.maxCount} photos allowed.`)) {
                    errors.push(`Maximum ${PHOTO_RULES.maxCount} photos allowed.`);
                }
                return;
            }

            // Type validation
            if (!PHOTO_RULES.allowedTypes.includes(file.type)) {
                errors.push(`${file.name}: Only JPEG, PNG, and WebP formats are allowed.`);
                return;
            }

            // Size validation
            if (file.size > PHOTO_RULES.maxSizeMB * 1024 * 1024) {
                errors.push(`${file.name}: Exceeds file size limit of ${PHOTO_RULES.maxSizeMB}MB.`);
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                const preview = e.target?.result;
                const newPhoto = {
                    id: `photo-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 6)}`,
                    preview,
                    file
                };
                setFormData(prev => ({
                    ...prev,
                    photos: [...prev.photos, newPhoto]
                }));
            };
            reader.readAsDataURL(file);
        });

        if (errors.length > 0) {
            setFileErrors(errors);
            setTimeout(() => setFileErrors([]), 6000);
        }
    };

    const removePhoto = (index) => {
        const updated = formData.photos.filter((_, i) => i !== index);
        setFormData({
            ...formData,
            photos: updated
        });
    };

    const setCoverPhoto = (index) => {
        if (index === 0) return;
        const newPhotos = [...formData.photos];
        const [target] = newPhotos.splice(index, 1);
        newPhotos.unshift(target); // move target to position 0 (Cover)
        setFormData({
            ...formData,
            photos: newPhotos
        });
    };

    const movePhotoKeyboard = (fromIndex, toIndex) => {
        if (toIndex < 0 || toIndex >= formData.photos.length) return;
        const reordered = [...formData.photos];
        const [movedItem] = reordered.splice(fromIndex, 1);
        reordered.splice(toIndex, 0, movedItem);
        setFormData({
            ...formData,
            photos: reordered
        });
    };

    // Drag-and-drop end handler
    const handleDragStart = (e) => {
        setActiveDragId(e.active.id);
    };

    const handleDragEnd = (e) => {
        const { active, over } = e;
        setActiveDragId(null);
        
        if (over && active.id !== over.id) {
            const oldIndex = formData.photos.findIndex((p) => p.id === active.id);
            const newIndex = formData.photos.findIndex((p) => p.id === over.id);
            
            if (oldIndex !== -1 && newIndex !== -1) {
                const reordered = arrayMove(formData.photos, oldIndex, newIndex);
                setFormData({
                    ...formData,
                    photos: reordered
                });
            }
        }
    };

    const handleDragCancel = () => {
        setActiveDragId(null);
    };

    // Cropping complete handler
    const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const triggerCropModal = (index) => {
        setCroppingIndex(index);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setRotation(0);
    };

    const applyCrop = async () => {
        if (croppingIndex === null || !croppedAreaPixels) return;

        try {
            const targetPhoto = formData.photos[croppingIndex];
            const croppedBase64 = await getCroppedImg(
                targetPhoto.preview,
                croppedAreaPixels,
                rotation
            );

            if (croppedBase64) {
                const fileName = targetPhoto.file?.name || `photo-${croppingIndex}.jpg`;
                const croppedFile = dataURLtoFile(croppedBase64, fileName);

                const updatedPhotos = [...formData.photos];
                updatedPhotos[croppingIndex] = {
                    ...targetPhoto,
                    preview: croppedBase64,
                    file: croppedFile
                };

                setFormData({
                    ...formData,
                    photos: updatedPhotos
                });
            }
        } catch (err) {
            console.error("Failed to crop image:", err);
        } finally {
            setCroppingIndex(null);
        }
    };

    const photoCount = formData.photos?.length || 0;
    const canAddMore = photoCount < PHOTO_RULES.maxCount;
    const activeDragPhoto = formData.photos.find(p => p.id === activeDragId);

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
                    <Camera size={22} className="text-primary" />
                    Property Photos
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                    Upload beautiful photos to showcase rooms, features, and locality.
                </p>
            </div>

            {/* Photo tips Banner */}
            <div className="p-4 bg-primary/5 border border-primary/15 rounded-2xl flex gap-3">
                <Camera className="text-primary w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm">
                    <p className="font-semibold text-foreground">💡 Quick Tips for High Quality Listings</p>
                    <ul className="text-muted-foreground mt-1 space-y-1">
                        <li>• Capture rooms in bright daylight for 4x higher tenant conversion.</li>
                        <li>• Reorder your photos to set the best image (living room/exterior) as the Cover photo.</li>
                    </ul>
                </div>
            </div>

            {/* File Errors Alert */}
            {fileErrors.length > 0 && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl space-y-1">
                    {fileErrors.map((err, idx) => (
                        <div key={idx} className="flex gap-2 items-center text-xs text-destructive">
                            <AlertTriangle size={13} className="flex-shrink-0" />
                            <span>{err}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Validation Errors */}
            {validationErrors.photos && (
                <p className="text-destructive text-xs sm:text-sm font-semibold">{validationErrors.photos}</p>
            )}

            {/* Drag & Drop Upload Zone */}
            {canAddMore && (
                <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-2xl p-6 sm:p-10 text-center transition-all duration-300 ${
                        dragActive 
                            ? "border-primary bg-primary/5 scale-99" 
                            : "border-border bg-muted/40 hover:bg-muted/60 hover:border-primary/40"
                    }`}
                >
                    <Upload size={38} className="mx-auto mb-3 text-muted-foreground animate-pulse" />
                    <h3 className="text-sm sm:text-base font-semibold text-foreground">
                        Drag and drop photos here
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 mb-4">
                        Supports JPEG, PNG, WebP &middot; Max {PHOTO_RULES.maxSizeMB}MB
                    </p>

                    <div className="flex flex-wrap items-center justify-center gap-3">
                        <label className="inline-block">
                            <input
                                type="file"
                                multiple
                                accept="image/jpeg,image/png,image/webp"
                                onChange={handleChange}
                                className="hidden"
                            />
                            <Button type="button" variant="default" asChild className="rounded-xl h-9">
                                <span className="cursor-pointer">Browse Files</span>
                            </Button>
                        </label>

                        {/* Mobile Camera Upload */}
                        <label className="inline-block sm:hidden">
                            <input
                                type="file"
                                accept="image/*"
                                capture="environment"
                                onChange={handleChange}
                                className="hidden"
                            />
                            <Button type="button" variant="outline" asChild className="rounded-xl h-9">
                                <span className="cursor-pointer flex items-center gap-1.5">
                                    <Camera size={14} />
                                    Camera
                                </span>
                            </Button>
                        </label>
                    </div>
                </div>
            )}

            {/* Image Gallery Context */}
            {photoCount > 0 ? (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xs sm:text-sm font-bold text-foreground">
                            {photoCount} Photo{photoCount > 1 ? "s" : ""} Added 
                            <span className="text-muted-foreground font-normal ml-1.5">
                                (Max {PHOTO_RULES.maxCount})
                            </span>
                        </h3>
                        {photoCount > 1 && (
                            <span className="text-[10px] text-muted-foreground italic flex items-center gap-1">
                                ↔ Drag photos to reorder
                            </span>
                        )}
                    </div>

                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                        onDragCancel={handleDragCancel}
                        modifiers={[restrictToFirstScrollableAncestor]}
                    >
                        <SortableContext
                            items={formData.photos.map(p => p.id)}
                            strategy={rectSortingStrategy}
                        >
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {formData.photos.map((photo, index) => (
                                    <SortablePhoto
                                        key={photo.id}
                                        photo={photo}
                                        index={index}
                                        onRemove={removePhoto}
                                        onCropClick={triggerCropModal}
                                        onSetCover={setCoverPhoto}
                                        totalPhotos={photoCount}
                                        onMoveKeyboard={movePhotoKeyboard}
                                    />
                                ))}
                            </div>
                        </SortableContext>

                        {/* Drag Overlay for smooth rendering */}
                        <DragOverlay adjustScale={true}>
                            {activeDragId && activeDragPhoto ? (
                                <div className="aspect-square rounded-2xl overflow-hidden border-2 border-primary shadow-2xl bg-card scale-105 opacity-90 cursor-grabbing">
                                    <img
                                        src={activeDragPhoto.preview}
                                        alt="Dragging element"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            ) : null}
                        </DragOverlay>
                    </DndContext>
                </div>
            ) : (
                <div className="text-center py-10 bg-muted/20 border rounded-2xl">
                    <ImageIcon size={30} className="mx-auto text-muted-foreground/60 mb-2" />
                    <p className="text-xs text-muted-foreground">No photos uploaded yet</p>
                </div>
            )}

            {/* Cropping Modal Dialog */}
            {croppingIndex !== null && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-card border border-border rounded-2xl shadow-2xl max-w-xl w-full flex flex-col overflow-hidden max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="flex justify-between items-center px-4 py-3 sm:px-6 border-b border-border bg-muted/20">
                            <div className="flex items-center gap-2">
                                <Crop size={18} className="text-primary" />
                                <h3 className="font-bold text-foreground text-sm sm:text-base">Crop Property Photo</h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setCroppingIndex(null)}
                                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Crop Canvas Wrapper */}
                        <div className="relative flex-1 bg-black min-h-[260px] sm:min-h-[350px]">
                            <Cropper
                                image={formData.photos[croppingIndex]?.preview}
                                crop={crop}
                                zoom={zoom}
                                rotation={rotation}
                                aspect={aspect}
                                onCropChange={setCrop}
                                onZoomChange={setZoom}
                                onRotationChange={setRotation}
                                onCropComplete={onCropComplete}
                            />
                        </div>

                        {/* Crop Dialog Toolbar Controls */}
                        <div className="p-4 sm:p-5 border-t border-border space-y-4 bg-card">
                            <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between text-xs">
                                {/* Aspect Ratio selector */}
                                <div className="flex items-center gap-2">
                                    <span className="text-muted-foreground flex items-center gap-1 font-semibold">
                                        <Maximize2 size={13} /> Aspect:
                                    </span>
                                    <div className="flex rounded-lg border border-border overflow-hidden">
                                        <button
                                            type="button"
                                            onClick={() => setAspect(4 / 3)}
                                            className={`px-3 py-1.5 font-bold transition-all ${
                                                aspect === 4 / 3 
                                                    ? "bg-primary text-primary-foreground" 
                                                    : "hover:bg-muted text-foreground"
                                            }`}
                                        >
                                            4:3 (Standard)
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setAspect(16 / 9)}
                                            className={`px-3 py-1.5 font-bold transition-all ${
                                                aspect === 16 / 9 
                                                    ? "bg-primary text-primary-foreground" 
                                                    : "hover:bg-muted text-foreground"
                                            }`}
                                        >
                                            16:9 (Wide)
                                        </button>
                                    </div>
                                </div>

                                {/* Rotation slider */}
                                <div className="flex items-center gap-2 flex-1 max-w-xs sm:ml-auto">
                                    <span className="text-muted-foreground flex items-center gap-1 font-semibold flex-shrink-0">
                                        <RotateCw size={13} /> Rotation:
                                    </span>
                                    <input
                                        type="range"
                                        min="0"
                                        max="360"
                                        step="1"
                                        value={rotation}
                                        onChange={(e) => setRotation(Number(e.target.value))}
                                        className="w-full h-1.5 rounded-lg bg-muted accent-primary cursor-pointer"
                                    />
                                    <span className="text-foreground w-8 text-right font-medium">{rotation}°</span>
                                </div>
                            </div>

                            {/* Zoom Slider */}
                            <div className="flex items-center gap-2 text-xs">
                                <span className="text-muted-foreground flex items-center gap-1 font-semibold flex-shrink-0">
                                    <Sliders size={13} /> Zoom:
                                </span>
                                <input
                                    type="range"
                                    min="1"
                                    max="3"
                                    step="0.1"
                                    value={zoom}
                                    onChange={(e) => setZoom(Number(e.target.value))}
                                    className="w-full h-1.5 rounded-lg bg-muted accent-primary cursor-pointer"
                                />
                                <span className="text-foreground w-8 text-right font-medium">{zoom}x</span>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-1">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setCroppingIndex(null)}
                                    className="flex-1 rounded-xl"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="button"
                                    onClick={applyCrop}
                                    className="flex-1 rounded-xl flex items-center justify-center gap-1.5"
                                >
                                    <Check size={16} />
                                    Apply Crop
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
