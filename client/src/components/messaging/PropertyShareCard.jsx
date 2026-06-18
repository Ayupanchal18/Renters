import { useEffect, useState } from "react";
import propertyService from "../../api/propertyService";
import { MapPin, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

export function PropertyShareCard({ slug, type, originalLink }) {
    const [property, setProperty] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        let isMounted = true;
        const fetchProperty = async () => {
            try {
                let response;
                // Determine whether to call rent or buy API
                if (type === "rent") {
                    response = await propertyService.getRentPropertyBySlug(slug);
                } else if (type === "buy") {
                    response = await propertyService.getBuyPropertyBySlug(slug);
                } else {
                    // General fallback tries rent first, then buy
                    try {
                        response = await propertyService.getRentPropertyBySlug(slug);
                    } catch {
                        response = await propertyService.getBuyPropertyBySlug(slug);
                    }
                }
                const data = response?.data?.data || response?.data || response;
                if (isMounted) {
                    if (data && (data._id || data.id)) {
                        setProperty(data);
                    } else {
                        setError(true);
                    }
                    setLoading(false);
                }
            } catch {
                if (isMounted) {
                    setError(true);
                    setLoading(false);
                }
            }
        };

        fetchProperty();
        return () => { isMounted = false; };
    }, [slug, type]);

    const formatPrice = (price) => {
        if (!price) return "₹0";
        if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)} Cr`;
        if (price >= 100000) return `₹${(price / 100000).toFixed(2)} L`;
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(price);
    };

    if (loading) {
        return (
            <div className="w-60 p-2.5 bg-muted/40 rounded-xl animate-pulse space-y-2 mt-1 border border-border">
                <div className="h-24 bg-muted rounded-lg" />
                <div className="h-3.5 bg-muted rounded w-3/4 animate-pulse" />
                <div className="h-3.5 bg-muted rounded w-1/2 animate-pulse" />
            </div>
        );
    }

    if (error || !property) {
        return (
            <div className="text-xs text-destructive bg-destructive/10 p-2.5 rounded-xl mt-1 border border-destructive/20 max-w-xs break-words">
                Listing no longer available:{" "}
                <a 
                    href={originalLink} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="underline text-primary hover:text-primary/80"
                >
                    {originalLink}
                </a>
            </div>
        );
    }

    const image = property.photos?.[0] || property.images?.[0] || "/property_image/placeholder-logo.png";
    const priceSuffix = property.listingType === "buy" ? "" : "/mo";
    const detailUrl = property.listingType === "buy" ? `/buy/${property.slug}` : `/rent/${property.slug}`;

    return (
        <div className="w-60 bg-card text-foreground rounded-xl border border-border overflow-hidden shadow-sm mt-1 flex flex-col transition-all duration-200 hover:shadow-md hover:border-border/80">
            <div className="relative h-24 overflow-hidden bg-slate-100 flex-shrink-0">
                <img 
                    src={image} 
                    alt={property.title} 
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105" 
                />
            </div>
            <div className="p-2.5 flex-1 flex flex-col gap-1 min-h-[95px]">
                <h4 className="text-xs font-bold text-foreground truncate line-clamp-1">{property.title}</h4>
                <div className="text-xs font-extrabold text-primary">
                    {formatPrice(property.monthlyRent || property.price)}{priceSuffix}
                </div>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-1">
                    <MapPin className="w-3 h-3 flex-shrink-0 text-primary/75" />
                    <span className="truncate">{property.locality || property.city || property.address}</span>
                </div>
                <Link
                    to={detailUrl}
                    className="mt-auto flex items-center justify-center gap-1 w-full py-1.5 bg-primary hover:bg-primary/95 text-primary-foreground font-semibold text-[11px] rounded-lg transition-colors"
                >
                    View Listing
                    <ArrowUpRight className="w-3 h-3" />
                </Link>
            </div>
        </div>
    );
}
