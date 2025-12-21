import * as React from "react";
import { cn } from "../../lib/utils";

/**
 * Premium Input Component with enhanced focus and error states
 * 
 * Props:
 * - error: boolean - Whether the input is in an error state
 * - errorMessage: string - Error message to display (for aria-describedby)
 * - errorId: string - ID of the error message element (for aria-describedby)
 * 
 * Requirements: 5.1, 5.2, 5.5, 10.4
 */
const Input = React.forwardRef(
    ({ className, type, error, errorMessage, errorId, ...props }, ref) => {
        return (
            <input
                type={type}
                className={cn(
                    // Base styles
                    "flex h-10 w-full rounded-md border bg-background px-3 py-2 text-base",
                    // File input styles
                    "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
                    // Placeholder styles
                    "placeholder:text-muted-foreground",
                    // Premium focus styles with ring and 2px offset using primary color
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    // Smooth transition on focus (Requirements: 5.1)
                    "transition-all duration-180 ease-smooth",
                    // Focus border enhancement
                    "focus-visible:border-primary",
                    // Disabled state
                    "disabled:cursor-not-allowed disabled:opacity-50",
                    // Responsive text
                    "md:text-sm",
                    // Default border (non-error state)
                    !error && "border-input",
                    // Error state styling with shake animation (Requirements: 5.2)
                    error && "border-destructive focus-visible:ring-destructive/30 focus-visible:border-destructive animate-shake",
                    className
                )}
                ref={ref}
                // ARIA attributes for error states (Requirements: 5.5, 10.4)
                aria-invalid={error ? "true" : undefined}
                aria-describedby={error && errorId ? errorId : undefined}
                {...props}
            />
        );
    }
);

Input.displayName = "Input";

export { Input };
