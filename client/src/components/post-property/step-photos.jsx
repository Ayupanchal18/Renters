import { Upload, X, ImageIcon } from 'lucide-react';
import { useState } from "react";
import { Button } from "../ui/button";

export default function StepPhotos({ formData, setFormData, validationErrors }) {
    const [dragActive, setDragActive] = useState(false);

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
    };

    const handleFiles = (files) => {
        Array.from(files).forEach((file) => {
            if (file.type.startsWith("image/")) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const preview = e.target?.result;

                    setFormData((prev) => ({
                        ...prev,
                        photos: [...prev.photos, { preview, file }]
                    }));
                };

                reader.readAsDataURL(file);
            }
        });
    };

    const removePhoto = (index) => {
        setFormData({
            ...formData,
            photos: formData.photos.filter((_, i) => i !== index),
        });
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Upload Property Photos</h2>
                <p className="text-muted-foreground">Add high-quality photos to attract more tenants</p>
            </div>

            {/* Upload Area */}
            <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-12 text-center transition-all ${dragActive ? "border-primary bg-primary/5" : "border-border bg-muted/50"
                    }`}
            >
                <Upload size={48} className="mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold text-foreground mb-1">Drag and drop photos here</h3>
                <p className="text-muted-foreground mb-4">or</p>

                <label className="inline-block">
                    <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleChange}
                        className="hidden"
                    />
                    <Button type="button" asChild>
                        <span className="cursor-pointer">Select Files</span>
                    </Button>
                </label>

                <p className="text-sm text-muted-foreground mt-4">JPG, PNG up to 5MB per file</p>
            </div>

            {/* Photo Gallery */}
            {formData.photos.length > 0 && (
                <div>
                    <h3 className="text-sm font-semibold text-foreground mb-4">
                        {formData.photos.length} Photo{formData.photos.length !== 1 ? "s" : ""} Uploaded
                    </h3>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {formData.photos.map((photo, index) => (
                            <div key={index} className="relative group">
                                <img
                                    src={photo.preview || photo || "/placeholder.svg"}
                                    alt={`Property photo ${index + 1}`}
                                    className="w-full h-32 object-cover rounded-lg border border-border"
                                />

                                <button
                                    type="button"
                                    onClick={() => removePhoto(index)}
                                    className="absolute top-2 right-2 bg-destructive text-destructive-foreground p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X size={20} />
                                </button>

                                {index === 0 && (
                                    <span className="absolute bottom-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                                        Cover
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* No Photos Placeholder */}
            {!formData.photos.length && (
                <div className="text-center py-8 bg-muted/50 rounded-lg border border-border">
                    <ImageIcon size={40} className="mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">No photos uploaded yet</p>
                </div>
            )}
        </div>
    );
}
