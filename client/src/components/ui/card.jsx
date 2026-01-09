import * as React from "react";
import { cva } from "class-variance-authority";

import { cn } from "../../lib/utils";

/**
 * Premium Card Component with enhanced variants
 */
const cardVariants = cva(
    // Base styles: soft rounded corners (8px/12px), 1px border, transition for hover effects
    "rounded-xl border text-card-foreground",
    {
        variants: {
            variant: {
                // Default: soft corners, layered shadows, theme-aware border (Req 7.3)
                default: "bg-card border-neutral-200 dark:border-neutral-800 shadow-sm",
                
                // Glass: backdrop-filter blur(8px), semi-transparent (Req 7.5)
                glass: "bg-white/6 dark:bg-white/6 backdrop-blur-lg border-white/10 shadow-lg",
                
                // Elevated: larger shadow for prominent cards
                elevated: "bg-card border-neutral-200 dark:border-neutral-800 shadow-lg",
            },
            hover: {
                // Hover lift effect with elevated shadow - Requirements 2.3
                true: "hover-lift-shadow",
                // Subtle hover lift effect without elevated shadow - Requirements 2.3
                subtle: "hover-lift",
                false: "",
            },
        },
        defaultVariants: {
            variant: "default",
            hover: false,
        },
    }
);

const Card = React.forwardRef(({ className, variant, hover, ...props }, ref) => (
    <div
        ref={ref}
        className={cn(cardVariants({ variant, hover, className }))}
        {...props}
    />
));
Card.displayName = "Card";

const CardHeader = React.forwardRef(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("flex flex-col space-y-1.5 p-6", className)}
        {...props}
    />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef(({ className, ...props }, ref) => (
    <h3
        ref={ref}
        className={cn(
            "text-2xl font-semibold leading-none tracking-tight",
            className
        )}
        {...props}
    />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef(({ className, ...props }, ref) => (
    <p
        ref={ref}
        className={cn("text-sm text-muted-foreground", className)}
        {...props}
    />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef(({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("flex items-center p-6 pt-0", className)}
        {...props}
    />
));
CardFooter.displayName = "CardFooter";

export {
    Card,
    CardHeader,
    CardFooter,
    CardTitle,
    CardDescription,
    CardContent,
    cardVariants,
};
