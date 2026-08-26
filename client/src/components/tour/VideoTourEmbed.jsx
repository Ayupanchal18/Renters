import { useState } from "react";
import { Play, ExternalLink, Youtube } from "lucide-react";
import DrmVideoPlayer from "./DrmVideoPlayer";
import ContentProtectionBadge from "../common/ContentProtectionBadge";

/**
 * Convert a public video URL to an embeddable iframe src:
 * - YouTube: watch?v=ID → https://www.youtube.com/embed/ID
 * - Vimeo:   vimeo.com/ID → https://player.vimeo.com/video/ID
 * - Direct video (.mp4, .webm, etc.) → returned as-is for <video> tag
 */
function getEmbedData(url) {
    if (!url) return null;

    // YouTube
    const ytMatch = url.match(
        /(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
    );
    if (ytMatch) {
        return {
            type: "iframe",
            src: `https://www.youtube.com/embed/${ytMatch[1]}?rel=0&modestbranding=1`,
            brand: "YouTube",
        };
    }

    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) {
        return {
            type: "iframe",
            src: `https://player.vimeo.com/video/${vimeoMatch[1]}?dnt=1`,
            brand: "Vimeo",
        };
    }

    // Direct video file
    const videoExt = url.match(/\.(mp4|webm|ogg|mov)(\?|$)/i);
    if (videoExt) {
        return { type: "video", src: url, brand: "Video" };
    }

    // Fallback — try as generic iframe
    return { type: "iframe", src: url, brand: "Tour" };
}

/**
 * VideoTourEmbed
 * Props:
 *   url: string — raw video URL (YouTube, Vimeo, or direct)
 *   className: string
 */
export default function VideoTourEmbed({ url, className = "" }) {
    const [activated, setActivated] = useState(false);
    const embed = getEmbedData(url);

    if (!embed) return null;

    if (!activated) {
        return (
            <div
                className={`relative flex items-center justify-center cursor-pointer rounded-xl overflow-hidden border border-border bg-slate-900 group ${className}`}
                style={{ aspectRatio: "16/9" }}
                onClick={() => setActivated(true)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && setActivated(true)}
                aria-label="Play video tour"
            >
                {/* DRM Badge overlay */}
                <div className="absolute top-3 left-3 z-20">
                    <ContentProtectionBadge />
                </div>

                <div
                    className="absolute inset-0 opacity-30"
                    style={{
                        backgroundImage:
                            "radial-gradient(circle at 30% 40%, #ef4444 0%, transparent 60%), radial-gradient(circle at 70% 60%, #f97316 0%, transparent 60%)",
                    }}
                />
                <div className="relative z-10 flex flex-col items-center gap-3 text-white">
                    <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center group-hover:bg-white/30 transition-colors">
                        <Play className="w-7 h-7 fill-current ml-1" />
                    </div>
                    <div className="text-center">
                        <p className="font-semibold text-sm">Play Encrypted Video Tour</p>
                        <p className="text-xs text-white/70 mt-0.5 flex items-center gap-1 justify-center">
                            {embed.brand === "YouTube" && <Youtube size={11} />}
                            {embed.brand} • Protected Stream
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`relative ${className}`}>
            {embed.type === "iframe" ? (
                <div
                    className="relative rounded-xl overflow-hidden border border-border"
                    style={{ aspectRatio: "16/9" }}
                >
                    {/* DRM Badge */}
                    <div className="absolute top-3 left-3 z-20">
                        <ContentProtectionBadge />
                    </div>

                    <iframe
                        src={embed.src}
                        title="Video Tour"
                        allowFullScreen
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        loading="lazy"
                        className="w-full h-full border-0"
                    />
                    <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute top-3 right-3 p-1.5 rounded-lg bg-black/50 text-white hover:bg-black/70 transition-colors"
                        title="Open in new tab"
                    >
                        <ExternalLink size={14} />
                    </a>
                </div>
            ) : (
                // Native DRM Video Player for direct file URLs
                <DrmVideoPlayer src={embed.src} title="Protected Video Walkthrough" />
            )}
        </div>
    );
}

