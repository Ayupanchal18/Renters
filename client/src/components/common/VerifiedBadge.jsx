import React from "react";
import { BadgeCheck } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "../ui/tooltip";
import { cn } from "../../lib/utils";

/**
 * VerifiedBadge Component
 * Renders a premium verification checkmark badge with a tooltip for verified users/owners.
 */
export default function VerifiedBadge({ className, size = "md" }) {
    const sizeClasses = {
        sm: "w-3.5 h-3.5",
        md: "w-4.5 h-4.5",
        lg: "w-5.5 h-5.5"
    };

    const iconSize = sizeClasses[size] || sizeClasses.md;

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <div className={cn("inline-flex items-center cursor-pointer select-none", className)}>
                    <BadgeCheck 
                        className={cn(
                            iconSize, 
                            "text-success fill-success/15 hover:scale-105 transition-transform duration-200"
                        )} 
                        aria-label="Verified User"
                    />
                </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs bg-success text-white border-success/35 px-2.5 py-1 font-semibold">
                Identity & Credentials Verified
            </TooltipContent>
        </Tooltip>
    );
}
