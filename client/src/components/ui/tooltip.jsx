import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "../../lib/utils";

/**
 * Tooltip Component - Premium Design System
 * 
 * Features:
 * - Subtle shadow for depth
 * - Small arrow pointing to trigger
 * - Fade+grow animation on show
 */

const TooltipProvider = TooltipPrimitive.Provider;
const Tooltip = TooltipPrimitive.Root;
const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipContent = React.forwardRef(
    ({ className, sideOffset = 6, ...props }, ref) => {
        return (
            <TooltipPrimitive.Content
                ref={ref}
                sideOffset={sideOffset}
                className={cn(
                    // Base styles with premium shadow and rounded corners
                    "z-50 overflow-visible rounded-lg border border-neutral-200 dark:border-neutral-800",
                    "bg-popover px-3 py-1.5 text-sm text-popover-foreground",
                    // Premium layered shadow for depth
                    "shadow-[0_4px_12px_-2px_rgba(0,0,0,0.12),0_2px_4px_-1px_rgba(0,0,0,0.08)]",
                    "dark:shadow-[0_4px_12px_-2px_rgba(0,0,0,0.4),0_2px_4px_-1px_rgba(0,0,0,0.3)]",
                    // Fade+grow animation on show (scale from 95% to 100% with fade)
                    "animate-in fade-in-0 zoom-in-95",
                    "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
                    // Slide animations based on side
                    "data-[side=bottom]:slide-in-from-top-2",
                    "data-[side=left]:slide-in-from-right-2",
                    "data-[side=right]:slide-in-from-left-2",
                    "data-[side=top]:slide-in-from-bottom-2",
                    // Animation timing
                    "duration-150 ease-out",
                    className
                )}
                {...props}
            >
                {props.children}
                {/* Arrow pointing to trigger */}
                <TooltipPrimitive.Arrow 
                    className="fill-popover drop-shadow-sm"
                    width={10}
                    height={5}
                />
            </TooltipPrimitive.Content>
        );
    }
);

TooltipContent.displayName = TooltipPrimitive.Content.displayName;

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
