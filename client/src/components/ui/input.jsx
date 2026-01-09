import * as React from "react";
import { CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "../../lib/utils";

/**
 * Premium Input Component with enhanced focus and error states
 * 
 * Props:
 * - error: boolean - Whether the input is in an error state
 * - success: boolean - Whether the input is in a success/valid state
 * - showValidation: boolean - Whether to show validation indicator icons
 * - errorMessage: string - Error message to display (for aria-describedby)
 * - errorId: string - ID of the error message element (for aria-describedby)
 */
const Input = React.forwardRef(
    ({ className, type, error, success, showValidation, errorMessage, errorId, ...props }, ref) => {
        const showIcon = showValidation && (success || error);
        
        return (
            <div className="relative w-full">
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
                        // Smooth transition on focus
                        "transition-all duration-180 ease-smooth",
                        // Focus border enhancement
                        "focus-visible:border-primary",
                        // Disabled state
                        "disabled:cursor-not-allowed disabled:opacity-50",
                        // Responsive text
                        "md:text-sm",
                        // Default border (non-error state)
                        !error && !success && "border-input",
                        // Success state styling
                        success && !error && "border-green-500 focus-visible:ring-green-500/30 focus-visible:border-green-500",
                        // Error state styling with shake animation
                        error && "border-destructive focus-visible:ring-destructive/30 focus-visible:border-destructive animate-shake",
                        // Add right padding for validation icon
                        showIcon && "pr-10",
                        className
                    )}
                    ref={ref}
                    // ARIA attributes for error states
                    aria-invalid={error ? "true" : undefined}
                    aria-describedby={error && errorId ? errorId : undefined}
                    {...props}
                />
                {showValidation && success && !error && (
                    <CheckCircle 
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" 
                        aria-hidden="true"
                    />
                )}
                {showValidation && error && (
                    <AlertCircle 
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-destructive" 
                        aria-hidden="true"
                    />
                )}
            </div>
        );
    }
);

Input.displayName = "Input";

export { Input };
