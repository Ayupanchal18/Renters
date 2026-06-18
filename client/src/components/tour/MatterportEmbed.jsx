import { useState } from "react";
import { Globe, Play, ExternalLink, ShieldAlert } from "lucide-react";

// Trusted Matterport domains
const ALLOWED_DOMAINS = [
    "my.matterport.com",
    "matterport.com",
    "kuula.co",
    "roundme.com",
    "momento360.com",
];

/**
 * Validate that the URL is from a trusted virtual-tour domain.
 * Returns the sanitised URL string or null if untrusted.
 */
function getSafeUrl(rawUrl) {
    if (!rawUrl) return null;
    try {
        const url = new URL(rawUrl);
        const hostname = url.hostname.replace(/^www\./, "");
        const trusted = ALLOWED_DOMAINS.some(
            (d) => hostname === d || hostname.endsWith("." + d)
        );
        return trusted ? rawUrl : null;
    } catch {
        return null;
    }
}

/**
 * MatterportEmbed
 * Renders a Matterport (or compatible) 3D tour iframe with:
 * - Click-to-activate poster screen (avoids autoload perf hit)
 * - Domain allow-list security check
 * - External link fallback
 */
export default function MatterportEmbed({ url, className = "" }) {
    const [activated, setActivated] = useState(false);
    const safeUrl = getSafeUrl(url);

    if (!safeUrl) {
        return (
            <div className={`flex items-center justify-center rounded-xl border border-destructive/30 bg-destructive/5 p-6 gap-3 ${className}`}>
                <ShieldAlert className="w-5 h-5 text-destructive flex-shrink-0" />
                <div>
                    <p className="text-sm font-semibold text-destructive">Untrusted tour URL</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        The URL domain is not in our trusted list and cannot be embedded.
                    </p>
                </div>
            </div>
        );
    }

    if (!activated) {
        return (
            <div
                className={`relative flex items-center justify-center cursor-pointer rounded-xl overflow-hidden border border-border bg-slate-900 group ${className}`}
                style={{ aspectRatio: "16/9" }}
                onClick={() => setActivated(true)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && setActivated(true)}
                aria-label="Load 3D Virtual Tour"
            >
                {/* Background pattern */}
                <div className="absolute inset-0 opacity-20"
                    style={{
                        backgroundImage: "radial-gradient(circle at 25% 25%, #6366f1 0%, transparent 50%), radial-gradient(circle at 75% 75%, #8b5cf6 0%, transparent 50%)",
                    }}
                />
                <div className="relative z-10 flex flex-col items-center gap-3 text-white">
                    <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center group-hover:bg-white/30 transition-colors">
                        <Play className="w-7 h-7 fill-current ml-1" />
                    </div>
                    <div className="text-center">
                        <p className="font-semibold text-sm">Launch 3D Virtual Tour</p>
                        <p className="text-xs text-white/70 mt-0.5 flex items-center gap-1 justify-center">
                            <Globe size={11} /> Powered by Matterport
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`relative rounded-xl overflow-hidden border border-border ${className}`} style={{ aspectRatio: "16/9" }}>
            <iframe
                src={safeUrl}
                title="3D Virtual Tour"
                allowFullScreen
                allow="xr-spatial-tracking; gyroscope; accelerometer"
                loading="lazy"
                className="w-full h-full border-0"
            />
            <a
                href={safeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute top-3 right-3 p-1.5 rounded-lg bg-black/50 text-white hover:bg-black/70 transition-colors"
                title="Open in new tab"
            >
                <ExternalLink size={14} />
            </a>
        </div>
    );
}
