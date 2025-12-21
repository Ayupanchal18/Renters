import * as React from "react";
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Badge Component - Premium Design System
 * 
 * Features:
 * - Pill shape with border-radius: 9999px (rounded-full)
 * - 1px border slightly darker than fill color
 * - Small typography (text-xs)
 * 
 * Requirements: 7.1
 */
const badgeVariants = cva(
    // Base styles: pill shape, small typography, smooth transitions
    "inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
    {
        variants: {
            variant: {
                // Primary: Royal Indigo with darker border
                default:
                    "bg-primary text-white border border-primary/80 hover:bg-primary/90 hover:border-primary/70",
                // Secondary: Coral Accent with darker border
                secondary:
                    "bg-secondary text-white border border-secondary/80 hover:bg-secondary/90 hover:border-secondary/70",
                // Tertiary: Gold Amber with darker border
                tertiary:
                    "bg-tertiary text-slate-900 border border-tertiary/80 hover:bg-tertiary/90 hover:border-tertiary/70",
                // Success: Emerald with darker border
                success:
                    "bg-success text-white border border-success/80 hover:bg-success/90 hover:border-success/70",
                // Error/Destructive: Tomato with darker border
                destructive:
                    "bg-error text-white border border-error/80 hover:bg-error/90 hover:border-error/70",
                // Warning: Amber with darker border
                warning:
                    "bg-warning text-slate-900 border border-warning/80 hover:bg-warning/90 hover:border-warning/70",
                // Outline: transparent with visible border
                outline: 
                    "bg-transparent text-foreground border border-neutral-300 dark:border-neutral-700 hover:bg-muted/10",
                // Muted: subtle background with darker border
                muted:
                    "bg-muted/20 text-muted-foreground border border-muted/30 hover:bg-muted/30",
            },
            size: {
                default: "px-2.5 py-0.5 text-xs",
                sm: "px-2 py-0.5 text-[10px]",
                lg: "px-3 py-1 text-sm",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
);

function Badge({ className, variant, size, ...props }) {
    return (
        <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
    );
}

export { Badge, badgeVariants };
