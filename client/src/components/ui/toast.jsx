import React, { useState, useEffect } from "react";
import * as ToastPrimitives from "@radix-ui/react-toast";
import { cva } from "class-variance-authority";
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react";
import { cn } from "../../lib/utils";

const ToastProvider = ToastPrimitives.Provider;

const ToastViewport = React.forwardRef(({ className, ...props }, ref) => {
    return (
        <ToastPrimitives.Viewport
            ref={ref}
            className={cn(
                // Base styles
                "fixed z-[100] flex max-h-screen w-full flex-col-reverse p-4",
                // Mobile: bottom positioning (<768px)
                "bottom-0 left-0 right-0",
                // Desktop: top-right positioning (≥768px)
                "md:bottom-auto md:top-0 md:right-0 md:left-auto md:flex-col md:max-w-[420px]",
                className
            )}
            {...props}
        />
    );
});
ToastViewport.displayName = ToastPrimitives.Viewport.displayName;

const toastVariants = cva(
    // Base styles with slide-in animations
    "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-lg border p-4 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-bottom-full md:data-[state=open]:slide-in-from-top-full",
    {
        variants: {
            variant: {
                default: "border-border bg-surface text-foreground",
                destructive:
                    "destructive group border-error/20 bg-error/10 text-error",
                success:
                    "success group border-success/20 bg-success/10 text-success",
                error:
                    "error group border-error/20 bg-error/10 text-error",
                warning:
                    "warning group border-warning/20 bg-warning/10 text-warning",
                info:
                    "info group border-primary/20 bg-primary/10 text-primary",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
);

// Progress bar component for auto-dismiss
const ToastProgress = React.forwardRef(({ className, variant, duration = 5000, ...props }, ref) => {
    const [progress, setProgress] = useState(100);
    
    useEffect(() => {
        const startTime = Date.now();
        const interval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
            setProgress(remaining);
            if (remaining <= 0) {
                clearInterval(interval);
            }
        }, 16); // ~60fps
        
        return () => clearInterval(interval);
    }, [duration]);
    
    const progressColorClass = {
        default: "bg-foreground/30",
        destructive: "bg-error",
        success: "bg-success",
        error: "bg-error",
        warning: "bg-warning",
        info: "bg-primary",
    }[variant || "default"];
    
    return (
        <div
            ref={ref}
            className={cn(
                "absolute bottom-0 left-0 h-1 transition-all duration-100",
                progressColorClass,
                className
            )}
            style={{ width: `${progress}%` }}
            {...props}
        />
    );
});
ToastProgress.displayName = "ToastProgress";

// Icon component for toast variants
const ToastIcon = ({ variant }) => {
    const iconClass = "h-5 w-5 shrink-0";
    
    switch (variant) {
        case "success":
            return <CheckCircle className={cn(iconClass, "text-success")} />;
        case "error":
        case "destructive":
            return <AlertCircle className={cn(iconClass, "text-error")} />;
        case "warning":
            return <AlertTriangle className={cn(iconClass, "text-warning")} />;
        case "info":
            return <Info className={cn(iconClass, "text-primary")} />;
        default:
            return null;
    }
};

const Toast = React.forwardRef(({ className, variant, showProgress = false, duration = 5000, ...props }, ref) => {
    // Determine ARIA role based on variant
    // Use "alert" for error/warning (important, time-sensitive)
    // Use "status" for success/info (informational)
    const ariaRole = variant === "error" || variant === "destructive" || variant === "warning" 
        ? "alert" 
        : "status";
    
    return (
        <ToastPrimitives.Root
            ref={ref}
            className={cn(toastVariants({ variant }), className)}
            role={ariaRole}
            aria-live="polite"
            {...props}
        >
            {props.children}
            {showProgress && <ToastProgress variant={variant} duration={duration} />}
        </ToastPrimitives.Root>
    );
});
Toast.displayName = ToastPrimitives.Root.displayName;

const ToastAction = React.forwardRef(({ className, ...props }, ref) => {
    return (
        <ToastPrimitives.Action
            ref={ref}
            className={cn(
                "inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                // Variant-specific action styles
                "group-[.destructive]:border-error/40 group-[.destructive]:hover:border-error/30 group-[.destructive]:hover:bg-error group-[.destructive]:hover:text-white group-[.destructive]:focus:ring-error",
                "group-[.success]:border-success/40 group-[.success]:hover:border-success/30 group-[.success]:hover:bg-success group-[.success]:hover:text-white group-[.success]:focus:ring-success",
                "group-[.error]:border-error/40 group-[.error]:hover:border-error/30 group-[.error]:hover:bg-error group-[.error]:hover:text-white group-[.error]:focus:ring-error",
                "group-[.warning]:border-warning/40 group-[.warning]:hover:border-warning/30 group-[.warning]:hover:bg-warning group-[.warning]:hover:text-white group-[.warning]:focus:ring-warning",
                "group-[.info]:border-primary/40 group-[.info]:hover:border-primary/30 group-[.info]:hover:bg-primary group-[.info]:hover:text-white group-[.info]:focus:ring-primary",
                className
            )}
            {...props}
        />
    );
});
ToastAction.displayName = ToastPrimitives.Action.displayName;

const ToastClose = React.forwardRef(({ className, ...props }, ref) => {
    return (
        <ToastPrimitives.Close
            ref={ref}
            className={cn(
                "absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100",
                // Variant-specific close button styles
                "group-[.destructive]:text-error/70 group-[.destructive]:hover:text-error group-[.destructive]:focus:ring-error",
                "group-[.success]:text-success/70 group-[.success]:hover:text-success group-[.success]:focus:ring-success",
                "group-[.error]:text-error/70 group-[.error]:hover:text-error group-[.error]:focus:ring-error",
                "group-[.warning]:text-warning/70 group-[.warning]:hover:text-warning group-[.warning]:focus:ring-warning",
                "group-[.info]:text-primary/70 group-[.info]:hover:text-primary group-[.info]:focus:ring-primary",
                className
            )}
            aria-label="Close notification"
            {...props}
        >
            <X className="h-4 w-4" />
        </ToastPrimitives.Close>
    );
});
ToastClose.displayName = ToastPrimitives.Close.displayName;

const ToastTitle = React.forwardRef(({ className, ...props }, ref) => {
    return (
        <ToastPrimitives.Title
            ref={ref}
            className={cn("text-sm font-semibold", className)}
            {...props}
        />
    );
});
ToastTitle.displayName = ToastPrimitives.Title.displayName;

const ToastDescription = React.forwardRef(({ className, ...props }, ref) => {
    return (
        <ToastPrimitives.Description
            ref={ref}
            className={cn("text-sm opacity-90", className)}
            {...props}
        />
    );
});
ToastDescription.displayName = ToastPrimitives.Description.displayName;

export {
    ToastProvider,
    ToastViewport,
    Toast,
    ToastTitle,
    ToastDescription,
    ToastClose,
    ToastAction,
    ToastProgress,
    ToastIcon,
};
