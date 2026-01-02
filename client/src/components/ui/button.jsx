import React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";

import { cn } from "../../lib/utils";

/**
 * Premium Button Component with enhanced variants
 */
const buttonVariants = cva(
    // Base styles with premium transitions
    // Transition timing: transform 180ms, box-shadow 180ms, background 160ms (Req 3.7)
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm ring-offset-background duration-180 ease-bounce focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed disabled:saturate-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
    {
        variants: {
            variant: {
                // Primary: solid bg, white text, subtle inset gradient, shadow-lg on focus with primary ring at 30% opacity (Req 3.1)
                // Hover: translateY(-1px), scale(1.01), elevated shadow (Req 3.2)
                default: "bg-primary text-primary-foreground shadow-md bg-gradient-to-b from-primary to-primary/90 hover:shadow-lg hover:-translate-y-0.5 hover:scale-[1.01] active:translate-y-0 active:scale-100",
                
                // Destructive: similar to primary but with error color
                destructive:
                    "bg-destructive text-destructive-foreground shadow-md bg-gradient-to-b from-destructive to-destructive/90 hover:shadow-lg hover:-translate-y-0.5 hover:scale-[1.01] active:translate-y-0 active:scale-100",
                
                // Outline: 1px border using neutral-300 in light mode and neutral-700 in dark mode (Req 3.5)
                outline:
                    "border border-neutral-300 dark:border-neutral-700 bg-transparent text-foreground hover:bg-muted hover:shadow-sm active:bg-muted/80",
                
                // Secondary: solid bg, white text, subtle border, elevation on hover (Req 3.3)
                secondary:
                    "bg-secondary text-secondary-foreground border border-secondary/20 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0",
                
                // Ghost: transparent bg, colored text, hover bg using primary at 8% opacity (Req 3.4)
                ghost: "bg-transparent text-primary hover:bg-primary/8 active:bg-primary/12",
                
                // Link: text styling with underline
                link: "text-primary underline-offset-4 hover:underline",
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
