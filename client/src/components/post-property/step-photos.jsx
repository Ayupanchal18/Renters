import { Upload, X, ImageIcon, AlertTriangle, Camera } from 'lucide-react';
import { useState } from "react";
import { Button } from "../ui/button";

const PHOTO_RULES = {
    maxCount: 15,
    maxSizeMB: 5,
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
};

export default function StepPhotos({ formData, setFormData, validationErrors }) {
    const [dragActive, setDragActive] = useState(false);
    const [fileErrors, setFileErrors] = useState([]);

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
        const files = e.currentTarget.files;
        if (files) handleFiles(files);
        // Reset input so the same file can be re-selected
        e.currentTarget.value = '';
    };

    const handleFiles = (files) => {
        const errors = [];
        const currentCount = formData.photos?.length || 0;

        Array.from(files).forEach((file) => {
            // Check max count
            if (currentCount + formData.photos.length >= PHOTO_RULES.maxCount) {
                errors.push(`Maximum ${PHOTO_RULES.maxCount} photos allowed.`);
                return;
            }

            // Check file type
            if (!PHOTO_RULES.allowedTypes.includes(file.type)) {
                errors.push(`${file.name}: Only JPEG, PNG, and WebP images are allowed.`);
                return;
            }

            // Check file size
            if (file.size > PHOTO_RULES.maxSizeMB * 1024 * 1024) {
                errors.push(`${file.name}: File exceeds ${PHOTO_RULES.maxSizeMB}MB limit.`);
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                const preview = e.target?.result;

                setFormData((prev) => ({
                    ...prev,
                    photos: [...prev.photos, { preview, file }]
                }));
            };

            reader.readAsDataURL(file);
        });

        if (errors.length > 0) {
            setFileErrors(errors);
            setTimeout(() => setFileErrors([]), 5000);
        }
    };

    const removePhoto = (index) => {
        setFormData({
            ...formData,
            photos: formData.photos.filter((_, i) => i !== index),
        });
    };

    const movePhoto = (from, to) => {
        if (to < 0 || to >= formData.photos.length) return;
        const newPhotos = [...formData.photos];
        const [moved] = newPhotos.splice(from, 1);
        newPhotos.splice(to, 0, moved);
        setFormData({ ...formData, photos: newPhotos });
    };

    const photoCount = formData.photos?.length || 0;
    const canAddMore = photoCount < PHOTO_RULES.maxCount;

    return (
        <div className="space-y-5 sm:space-y-6">
            <div>
                <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-1 sm:mb-2">Upload Property Photos</h2>
                <p className="text-sm sm:text-base text-muted-foreground">Add high-quality photos to attract more interest</p>
            </div>

            {/* Photo quality tips */}
            <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                <p className="text-xs sm:text-sm text-foreground font-medium mb-1">📷 Photo Tips</p>
                <ul className="text-xs text-muted-foreground space-y-0.5">
                    <li>• Use natural daylight — photos taken during daytime get more clicks</li>
                    <li>• Include: living room, kitchen, bedroom(s), bathroom, balcony, exterior</li>
                    <li>• Landscape orientation works best for property photos</li>
                </ul>
            </div>

            {/* Upload Area */}
            {canAddMore && (
                <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-lg p-6 sm:p-12 text-center transition-all ${dragActive ? "border-primary bg-primary/5" : "border-border bg-muted/50"
                        }`}
                >
                    <Upload size={40} className="mx-auto mb-3 sm:mb-4 text-muted-foreground" />
                    <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1">Drag and drop photos here</h3>
                    <p className="text-sm text-muted-foreground mb-3 sm:mb-4">or</p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                        <label className="inline-block">
                            <input
                                type="file"
                                multiple
                                accept="image/jpeg,image/png,image/webp"
                                onChange={handleChange}
                                className="hidden"
                            />
                            <Button type="button" asChild>
                                <span className="cursor-pointer">Select Files</span>
                            </Button>
                        </label>

                        {/* Camera capture for mobile */}
                        <label className="inline-block sm:hidden">
                            <input
                                type="file"
                                accept="image/*"
                                capture="environment"
                                onChange={handleChange}
                                className="hidden"
                            />
                            <Button type="button" variant="outline" asChild>
                                <span className="cursor-pointer flex items-center gap-1.5">
                                    <Camera size={16} />
                                    Take Photo
                                </span>
                            </Button>
                        </label>
                    </div>

                    <p className="text-xs sm:text-sm text-muted-foreground mt-3 sm:mt-4">
                        JPEG, PNG, WebP — up to {PHOTO_RULES.maxSizeMB}MB per file — max {PHOTO_RULES.maxCount} photos
                    </p>
                </div>
            )}

            {/* File errors */}
            {fileErrors.length > 0 && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                    {fileErrors.map((err, i) => (
                        <p key={i} className="text-xs text-destructive">• {err}</p>
                    ))}
                </div>
            )}

            {/* Photo count nudge */}
            {photoCount > 0 && photoCount < 3 && (
                <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                    <AlertTriangle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-700 dark:text-amber-400">
                        Listings with <strong>3+ photos get 5× more inquiries</strong>. Upload {3 - photoCount} more photo{3 - photoCount !== 1 ? 's' : ''} for better results.
                    </p>
                </div>
            )}

            {/* Validation error */}
            {validationErrors.photos && (
                <p className="text-destructive text-xs sm:text-sm">{validationErrors.photos}</p>
            )}

            {/* Photo Gallery */}
            {photoCount > 0 && (
                <div>
                    <h3 className="text-sm font-semibold text-foreground mb-3 sm:mb-4">
                        {photoCount} Photo{photoCount !== 1 ? "s" : ""} Uploaded
                        <span className="text-muted-foreground font-normal ml-2">
                            ({PHOTO_RULES.maxCount - photoCount} more allowed)
                        </span>
                    </h3>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                        {formData.photos.map((photo, index) => (
                            <div key={index} className="relative group aspect-square">
                                <img
                                    src={photo.preview || photo || "/placeholder.svg"}
                                    alt={`Property photo ${index + 1}`}
                                    className="w-full h-full object-cover rounded-lg border border-border"
                                />

                                {/* Remove button */}
                                <button
                                    type="button"
                                    onClick={() => removePhoto(index)}
                                    className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 bg-destructive text-destructive-foreground p-1 rounded opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                                >
                                    <X size={16} />
                                </button>

                                {/* Reorder buttons */}
                                <div className="absolute bottom-1.5 right-1.5 sm:bottom-2 sm:right-2 flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                    {index > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => movePhoto(index, index - 1)}
                                            className="bg-background/80 backdrop-blur-sm text-foreground p-1 rounded text-xs border border-border hover:bg-background"
                                            title="Move left"
                                        >
                                            ←
                                        </button>
                                    )}
                                    {index < formData.photos.length - 1 && (
                                        <button
                                            type="button"
                                            onClick={() => movePhoto(index, index + 1)}
                                            className="bg-background/80 backdrop-blur-sm text-foreground p-1 rounded text-xs border border-border hover:bg-background"
                                            title="Move right"
                                        >
                                            →
                                        </button>
                                    )}
                                </div>

                                {/* Cover badge */}
                                {index === 0 && (
                                    <span className="absolute bottom-1.5 left-1.5 sm:bottom-2 sm:left-2 bg-primary text-primary-foreground text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded">
                                        Cover
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>

                    <p className="text-xs text-muted-foreground mt-3">
                        💡 The first photo is used as the cover image. Use the arrow buttons to reorder.
                    </p>
                </div>
            )}

            {/* No Photos Placeholder */}
            {!photoCount && !validationErrors.photos && (
                <div className="text-center py-6 sm:py-8 bg-muted/50 rounded-lg border border-border">
                    <ImageIcon size={32} className="mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">No photos uploaded yet</p>
                </div>
            )}
        </div>
    );
}
