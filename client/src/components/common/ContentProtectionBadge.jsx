import React, { useState } from "react";
import { ShieldCheck, Info, X, Lock } from "lucide-react";

/**
 * ContentProtectionBadge Component
 * Displays a badge & popup tooltip informing users about Widevine L3 DRM protection.
 */
export default function ContentProtectionBadge({ 
    variant = "badge", 
    label = "Protected with advanced L3 DRM encryption",
    className = ""
}) {
    const [open, setOpen] = useState(false);

    return (
        <div className={`relative inline-flex items-center ${className}`}>
            {/* Main Trigger Badge */}
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900/90 text-slate-100 border border-slate-700/80 shadow-md backdrop-blur-md hover:bg-slate-800 transition-all cursor-pointer group"
                title="Click for DRM security information"
            >
                <div className="relative flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                    <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping opacity-75" />
                </div>
                <span>{label}</span>
                <Info className="w-3.5 h-3.5 text-slate-400 ml-0.5 group-hover:text-slate-200" />
            </button>

            {/* Popup Tooltip Modal (matching user reference screenshot) */}
            {open && (
                <>
                    {/* Backdrop click listener */}
                    <div 
                        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]" 
                        onClick={() => setOpen(false)} 
                    />
                    
                    {/* Tooltip Card */}
                    <div className="absolute top-full left-0 mt-2 z-50 w-72 sm:w-80 p-4 rounded-xl bg-slate-900 text-slate-100 border border-slate-800 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
                        {/* Diamond Pointer Arrow */}
                        <div className="absolute -top-1.5 left-6 w-3 h-3 bg-slate-900 border-t border-l border-slate-800 rotate-45" />

                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2 text-emerald-400 font-medium text-xs">
                                <Lock className="w-4 h-4" />
                                <span className="uppercase tracking-wider font-semibold">Widevine L3 DRM Security</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                className="text-slate-400 hover:text-white rounded-md p-0.5 hover:bg-slate-800 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <p className="mt-2 text-xs leading-relaxed text-slate-300 font-normal">
                            Protect your content with advanced L3 DRM encryption to prevent piracy and unauthorized sharing.
                        </p>

                        <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                            <span className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                Encrypted Session Active
                            </span>
                            <span className="font-mono text-[10px] text-slate-500">EME CENC v3</span>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
