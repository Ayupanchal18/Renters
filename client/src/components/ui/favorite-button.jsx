import { useState, useEffect } from "react";
import { Heart, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import wishlistService from "../../api/wishlistService";
import { isAuthenticated } from "../../utils/auth";
import { cn } from "../../lib/utils";

/**
 * FavoriteButton - Reusable heart/favorite button component
 * Handles wishlist add/remove with authentication check
 */
export function FavoriteButton({ 
    propertyId, 
    initialSaved = false,
    size = "default", // "sm" | "default" | "lg"
    variant = "floating", // "floating" | "outline" | "ghost"
    className,
    onToggle
}) {
    const navigate = useNavigate();
    const [isSaved, setIsSaved] = useState(initialSaved);
    const [isLoading, setIsLoading] = useState(false);

    // Sync with initialSaved prop
    useEffect(() => {
        setIsSaved(initialSaved);
    }, [initialSaved]);

    const handleToggleFavorite = async (e) => {
        e.stopPropagation();
        e.preventDefault();
        
        if (!isAuthenticated()) {
            navigate('/login');
            return;
        }

        if (isLoading || !propertyId) return;

        setIsLoading(true);
        try {
            const result = await wishlistService.toggleWishlist(propertyId, isSaved);
            setIsSaved(result.isFavorited);
            onToggle?.(result.isFavorited);
        } catch (error) {
            console.error('Failed to toggle favorite:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const sizeClasses = {
        sm: "w-8 h-8",
        default: "w-9 h-9",
        lg: "w-10 h-10"
    };

    const iconSizes = {
        sm: "w-3.5 h-3.5",
        default: "w-4 h-4",
        lg: "w-5 h-5"
    };

    const variantClasses = {
        floating: cn(
            "bg-white/90 dark:bg-card/90 backdrop-blur-sm shadow-md border border-border/50",
            "hover:bg-white dark:hover:bg-card hover:scale-110",
            isSaved && "bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800"
        ),
        outline: cn(
            "border border-border bg-transparent",
            "hover:bg-muted",
            isSaved && "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800"
        ),
        ghost: cn(
            "bg-transparent",
            "hover:bg-muted",
            isSaved && "bg-red-50 dark:bg-red-950/30"
        )
    };

    return (
        <button
            onClick={handleToggleFavorite}
            disabled={isLoading}
            className={cn(
                "rounded-full flex items-center justify-center transition-all",
                sizeClasses[size],
                variantClasses[variant],
                isLoading && "opacity-50 cursor-not-allowed",
                className
            )}
            aria-label={isSaved ? "Remove from wishlist" : "Add to wishlist"}
            title={isSaved ? "Remove from wishlist" : "Add to wishlist"}
        >
            {isLoading ? (
                <Loader2 className={cn(iconSizes[size], "animate-spin text-muted-foreground")} />
            ) : (
                <Heart 
                    className={cn(
                        iconSizes[size],
                        "transition-colors",
                        isSaved 
                            ? "fill-red-500 text-red-500" 
                            : "text-muted-foreground hover:text-red-500"
                    )} 
                />
            )}
        </button>
    );
}

export default FavoriteButton;
