import React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";

import { cn } from "../../lib/utils";

/**
 * Premium Button Component with enhanced variants
 */
const buttonVariants = cva(
    // Base styles: smooth transitions, press-down feedback, keyboard focus
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed disabled:saturate-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 transition-all duration-200 active:scale-95",
    {
        variants: {
            variant: {
                // Primary: solid bg, white text, subtle gradient + glow on hover
                default: "bg-primary text-primary-foreground shadow-md bg-gradient-to-b from-primary to-primary/90 hover:shadow-rt-glow",
                
                // Destructive: similar to primary but with error color
                destructive:
                    "bg-destructive text-destructive-foreground shadow-md bg-gradient-to-b from-destructive to-destructive/90",
                
                // Outline: 1px border using neutral-300 in light mode and neutral-700 in dark mode (Req 3.5)
                outline:
                    "border border-neutral-300 dark:border-neutral-700 bg-transparent text-foreground hover:bg-muted",
                
                // Secondary: solid bg, white text, subtle border, elevation on hover (Req 3.3)
                secondary:
                    "bg-secondary text-secondary-foreground border border-secondary/20 shadow-sm",
                
                // Ghost: transparent bg, colored text, hover bg using primary at 8% opacity (Req 3.4)
                ghost: "bg-transparent text-primary hover:bg-primary/8 active:bg-primary/12",
                
                // Link: text styling with underline (no scale effect needed)
                link: "text-primary underline-offset-4 hover:underline [&]:active:scale-100",
            },
            size: {
                default: "h-10 px-4 py-2",
                sm: "h-9 rounded-md px-3",
                lg: "h-11 rounded-md px-8",
                icon: "h-10 w-10",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
);

const Button = React.forwardRef(
    ({ className, variant, size, asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : "button";

        return (
            <Comp
                ref={ref}
                className={cn(buttonVariants({ variant, size, className }))}
                {...props}
            />
        );
    }
);

Button.displayName = "Button";

export { Button, buttonVariants };
