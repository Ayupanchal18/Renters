import { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";
import { cn } from "../../lib/utils";

export function BackToTop({ 
    threshold = 400, 
    className,
    smooth = true 
}) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const toggleVisibility = () => {
            setIsVisible(window.scrollY > threshold);
        };

        window.addEventListener("scroll", toggleVisibility, { passive: true });
        toggleVisibility(); // Check initial position

        return () => window.removeEventListener("scroll", toggleVisibility);
    }, [threshold]);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: smooth ? "smooth" : "auto"
        });
    };

    return (
        <button
            onClick={scrollToTop}
            className={cn(
                "fixed bottom-6 right-6 z-50 w-12 h-12 rounded-2xl bg-primary text-primary-foreground shadow-xl transition-all duration-300 hover:bg-primary/90 hover:scale-110 hover:shadow-2xl active:scale-95",
                "flex items-center justify-center",
                "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                isVisible 
                    ? "opacity-100 translate-y-0 pointer-events-auto" 
                    : "opacity-0 translate-y-4 pointer-events-none",
                className
            )}
            aria-label="Back to top"
        >
            <ArrowUp className="w-5 h-5" />
        </button>
    );
}
