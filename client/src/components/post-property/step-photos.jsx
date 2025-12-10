import { Upload, X, ImageIcon } from 'lucide-react';
import { useState } from "react";

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

    // const handleFiles = (files) => {
    //     Array.from(files).forEach((file) => {
    //         if (file.type.startsWith("image/")) {
    //             const reader = new FileReader();
    //             reader.onload = (e) => {
    //                 const result = e.target?.result;

    //                 if (!formData.photos.includes(result)) {
    //                     setFormData({
    //                         ...formData,
    //                         photos: [...formData.photos, result],
    //                     });
    //                 }
    //             };
    //             reader.readAsDataURL(file);
    //         }
    //     });
    // };
    const handleFiles = (files) => {
        Array.from(files).forEach((file) => {
            if (file.type.startsWith("image/")) {

                // 1. Save preview (Base64)
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
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Upload Property Photos</h2>

            {/* Upload Area */}
            <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-12 text-center transition-all${dragActive ? "border-blue-600 bg-blue-50" : "border-slate-300 bg-slate-50"
                    }`}
            >
                <Upload size={48} className="mx-auto mb-4 text-slate-400" />
                <h3 className="text-lg font-semibold text-slate-900 mb-1">Drag and drop photos here</h3>
                <p className="text-slate-600 mb-4">or</p>

                <label className="inline-block">
                    <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleChange}
                        className="hidden"
                    />
                    <span className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer font-medium">
                        Select Files
                    </span>
                </label>

                <p className="text-sm text-slate-600 mt-4">JPG, PNG up to 5MB per file</p>
            </div>

            {/* Photo Gallery */}
            {formData.photos.length > 0 && (
                <div>
                    <h3 className="text-sm font-semibold text-slate-900 mb-4">
                        {formData.photos.length} Photo{formData.photos.length !== 1 ? "s" : ""} Uploaded
                    </h3>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {formData.photos.map((photo, index) => (
                            <div key={index} className="relative group">
                                <img
                                    src={photo || "/placeholder.svg"}
                                    alt={`Property photo${index + 1}`}
                                    className="w-full h-32 object-cover rounded-lg"
                                />

                                <button
                                    onClick={() => removePhoto(index)}
                                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* No Photos Placeholder */}
            {!formData.photos.length && (
                <div className="text-center py-8 bg-slate-50 rounded-lg">
                    <ImageIcon size={40} className="mx-auto text-slate-300 mb-2" />
                    <p className="text-slate-600">No photos uploaded yet</p>
                </div>
            )}
        </div>
    );
}
