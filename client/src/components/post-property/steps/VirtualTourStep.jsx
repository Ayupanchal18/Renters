import { useState, useRef } from "react";
import {
    Video,
    Scan,
    Link,
    Upload,
    X,
    Info,
    ChevronDown,
    ChevronUp,
    Globe,
    Play,
} from "lucide-react";

const TOUR_TYPES = [
    {
        id: "none",
        label: "No Virtual Tour",
        description: "Skip this step — you can add one later.",
        icon: X,
        color: "muted",
    },
    {
        id: "matterport",
        label: "Matterport 3D Tour",
        description: "Paste your Matterport share link for an immersive 3D walkthrough.",
        icon: Globe,
        color: "blue",
    },
    {
        id: "panorama",
        label: "360° Panorama Photos",
        description: "Upload equirectangular images for an interactive panorama viewer.",
        icon: Scan,
        color: "purple",
    },
    {
        id: "video",
        label: "Video Tour",
        description: "Paste a YouTube, Vimeo, or direct video link.",
        icon: Play,
        color: "emerald",
    },
];

const COLOR_CLASSES = {
    muted: {
        border: "border-border",
        bg: "bg-muted/40",
        icon: "bg-muted text-muted-foreground",
        active: "border-border bg-muted/60",
    },
    blue: {
        border: "border-blue-200 dark:border-blue-800",
        bg: "bg-blue-50/50 dark:bg-blue-950/20",
        icon: "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400",
        active: "border-blue-400 dark:border-blue-600 bg-blue-50 dark:bg-blue-950/40 ring-2 ring-blue-400/30",
    },
    purple: {
        border: "border-purple-200 dark:border-purple-800",
        bg: "bg-purple-50/50 dark:bg-purple-950/20",
        icon: "bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400",
        active: "border-purple-400 dark:border-purple-600 bg-purple-50 dark:bg-purple-950/40 ring-2 ring-purple-400/30",
    },
    emerald: {
        border: "border-emerald-200 dark:border-emerald-800",
        bg: "bg-emerald-50/50 dark:bg-emerald-950/20",
        icon: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-400",
        active: "border-emerald-400 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 ring-2 ring-emerald-400/30",
    },
};

function TourTypeCard({ type, selected, onClick }) {
    const Icon = type.icon;
    const colors = COLOR_CLASSES[type.color];
    const isSelected = selected === type.id;

    return (
        <button
            type="button"
            onClick={() => onClick(type.id)}
            className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                isSelected
                    ? colors.active
                    : `${colors.border} ${colors.bg} hover:brightness-105`
            }`}
        >
            <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg flex-shrink-0 ${colors.icon}`}>
                    <Icon size={16} />
                </div>
                <div>
                    <p className="text-sm font-semibold text-foreground">{type.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                        {type.description}
                    </p>
                </div>
            </div>
        </button>
    );
}

function PanoramaUploadZone({ panoramas, onChange }) {
    const inputRef = useRef(null);
    const [dragging, setDragging] = useState(false);

    const handleFiles = (files) => {
        const imageFiles = Array.from(files).filter((f) =>
            f.type.startsWith("image/")
        );
        const previews = imageFiles.map((file) => ({
            file,
            preview: URL.createObjectURL(file),
            label: file.name.replace(/\.[^.]+$/, ""),
        }));
        onChange([...panoramas, ...previews]);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragging(false);
        handleFiles(e.dataTransfer.files);
    };

    const handleRemove = (index) => {
        const next = panoramas.filter((_, i) => i !== index);
        onChange(next);
    };

    const handleLabelChange = (index, label) => {
        const next = panoramas.map((p, i) => (i === index ? { ...p, label } : p));
        onChange(next);
    };

    return (
        <div className="space-y-3">
            <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors ${
                    dragging
                        ? "border-purple-400 bg-purple-50 dark:bg-purple-950/20"
                        : "border-border hover:border-purple-300 hover:bg-purple-50/30 dark:hover:bg-purple-950/10"
                }`}
            >
                <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900">
                    <Upload size={22} className="text-purple-600 dark:text-purple-400" />
                </div>
                <div className="text-center">
                    <p className="text-sm font-semibold text-foreground">
                        Drop equirectangular images here
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                        Or click to browse — use 2:1 aspect ratio JPEGs for best results
                    </p>
                </div>
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFiles(e.target.files)}
                />
            </div>

            {panoramas.length > 0 && (
                <div className="space-y-2">
                    {panoramas.map((pano, i) => (
                        <div
                            key={i}
                            className="flex items-center gap-3 p-3 bg-muted/40 rounded-xl border border-border"
                        >
                            <img
                                src={pano.preview}
                                alt={pano.label}
                                className="w-16 h-8 object-cover rounded-lg flex-shrink-0 border border-border"
                            />
                            <input
                                type="text"
                                value={pano.label}
                                onChange={(e) => handleLabelChange(i, e.target.value)}
                                placeholder="Scene label (e.g., Living Room)"
                                className="flex-1 text-xs bg-background border border-border rounded-lg px-3 py-1.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                            />
                            <button
                                type="button"
                                onClick={() => handleRemove(i)}
                                className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function VirtualTourStep({ formData, setFormData, validationErrors }) {
    const [showTips, setShowTips] = useState(false);

    const tourType = formData.virtualTour?.type || "none";

    const setTourField = (field, value) => {
        setFormData((prev) => ({
            ...prev,
            virtualTour: {
                ...prev.virtualTour,
                type: tourType,
                [field]: value,
            },
        }));
    };

    const handleTypeSelect = (type) => {
        setFormData((prev) => ({
            ...prev,
            virtualTour: {
                type,
                matterportUrl: prev.virtualTour?.matterportUrl || "",
                videoUrl: prev.virtualTour?.videoUrl || "",
                panoramaImages: prev.virtualTour?.panoramaImages || [],
            },
        }));
    };

    const handlePanoramaChange = (panoramaImages) => {
        setFormData((prev) => ({
            ...prev,
            virtualTour: {
                ...prev.virtualTour,
                panoramaImages,
            },
        }));
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                        Virtual Tour
                    </h2>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-medium">
                        Optional
                    </span>
                </div>
                <p className="text-sm text-muted-foreground">
                    Give potential tenants an immersive preview — listings with virtual tours get{" "}
                    <strong className="text-foreground">40% more inquiries</strong>.
                </p>
            </div>

            {/* Tips Accordion */}
            <div className="bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl overflow-hidden">
                <button
                    type="button"
                    onClick={() => setShowTips((v) => !v)}
                    className="w-full flex items-center justify-between px-4 py-3 text-left"
                >
                    <span className="flex items-center gap-2 text-sm font-semibold text-blue-700 dark:text-blue-300">
                        <Info size={15} />
                        Tips for best results
                    </span>
                    {showTips ? (
                        <ChevronUp size={15} className="text-blue-500" />
                    ) : (
                        <ChevronDown size={15} className="text-blue-500" />
                    )}
                </button>
                {showTips && (
                    <div className="px-4 pb-4 text-xs text-blue-800 dark:text-blue-200 space-y-1.5">
                        <p>🏠 <strong>Matterport</strong>: Publish your tour on matterport.com, then paste the share URL here.</p>
                        <p>📸 <strong>Panoramas</strong>: Use a 360° camera or smartphone app to capture equirectangular (2:1 ratio) images.</p>
                        <p>🎥 <strong>Video</strong>: Upload to YouTube or Vimeo first, then paste the link. Direct MP4 links also work.</p>
                    </div>
                )}
            </div>

            {/* Tour Type Selection */}
            <div>
                <p className="text-sm font-semibold text-foreground mb-3">
                    Choose tour type
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {TOUR_TYPES.map((type) => (
                        <TourTypeCard
                            key={type.id}
                            type={type}
                            selected={tourType}
                            onClick={handleTypeSelect}
                        />
                    ))}
                </div>
            </div>

            {/* ── Matterport URL ── */}
            {tourType === "matterport" && (
                <div className="space-y-2">
                    <label className="block text-sm font-semibold text-foreground">
                        Matterport Share URL
                    </label>
                    <div className="relative">
                        <Link
                            size={15}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        />
                        <input
                            type="url"
                            value={formData.virtualTour?.matterportUrl || ""}
                            onChange={(e) => setTourField("matterportUrl", e.target.value)}
                            placeholder="https://my.matterport.com/show/?m=..."
                            className={`w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-all ${
                                validationErrors?.matterportUrl
                                    ? "border-destructive focus:ring-destructive/30"
                                    : "border-border focus:ring-primary/30 focus:border-primary"
                            }`}
                        />
                    </div>
                    {validationErrors?.matterportUrl && (
                        <p className="text-xs text-destructive">
                            {validationErrors.matterportUrl}
                        </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                        The URL should look like:{" "}
                        <code className="font-mono text-[11px] bg-muted px-1 rounded">
                            https://my.matterport.com/show/?m=XXXXXX
                        </code>
                    </p>
                </div>
            )}

            {/* ── Panorama Images ── */}
            {tourType === "panorama" && (
                <div className="space-y-2">
                    <label className="block text-sm font-semibold text-foreground">
                        Upload 360° Panorama Images
                    </label>
                    <PanoramaUploadZone
                        panoramas={formData.virtualTour?.panoramaImages || []}
                        onChange={handlePanoramaChange}
                    />
                    <p className="text-xs text-muted-foreground">
                        Add a label for each scene so visitors can navigate between rooms.
                    </p>
                </div>
            )}

            {/* ── Video URL ── */}
            {tourType === "video" && (
                <div className="space-y-2">
                    <label className="block text-sm font-semibold text-foreground">
                        Video Tour URL
                    </label>
                    <div className="relative">
                        <Video
                            size={15}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        />
                        <input
                            type="url"
                            value={formData.virtualTour?.videoUrl || ""}
                            onChange={(e) => setTourField("videoUrl", e.target.value)}
                            placeholder="https://www.youtube.com/watch?v=..."
                            className={`w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-all ${
                                validationErrors?.videoUrl
                                    ? "border-destructive focus:ring-destructive/30"
                                    : "border-border focus:ring-primary/30 focus:border-primary"
                            }`}
                        />
                    </div>
                    {validationErrors?.videoUrl && (
                        <p className="text-xs text-destructive">
                            {validationErrors.videoUrl}
                        </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                        Supports YouTube, Vimeo, and direct .mp4 links.
                    </p>
                </div>
            )}

            {/* Skip note */}
            {tourType === "none" && (
                <div className="text-center py-4 text-sm text-muted-foreground">
                    No virtual tour selected — you can always add one later from your dashboard.
                </div>
            )}
        </div>
    );
}
