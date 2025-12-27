import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import propertyService from "../api/propertyService";
import Navbar from '../components/Navbar';

/**
 * PropertyRedirect Component
 * Handles legacy /property/:slug URLs by redirecting to the appropriate
 * /rent/:slug or /buy/:slug route based on the property's listingType
 * Requirements: 6.1, 6.2
 */

function LoadingState() {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-muted-foreground">Redirecting...</p>
            </div>
        </div>
    );
}

export default function PropertyRedirect() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAndRedirect = async () => {
            if (!slug) {
                navigate('/listings', { replace: true });
                return;
            }

            try {
                // Try to fetch the property to determine its listingType
                const response = await propertyService.getPropertyByID({ key: slug });
                const property = response.data?.data || response.data;

                if (property) {
                    const listingType = property.listingType || 'rent'; // Default to rent for backward compatibility
                    
                    if (listingType === 'buy') {
                        navigate(`/buy/${slug}`, { replace: true });
                    } else {
                        navigate(`/rent/${slug}`, { replace: true });
                    }
                } else {
                    // Property not found, redirect to listings
                    navigate('/listings', { replace: true });
                }
            } catch (error) {
                console.error('Error fetching property for redirect:', error);
                // On error, try rent first (most common case)
                navigate(`/rent/${slug}`, { replace: true });
            } finally {
                setLoading(false);
            }
        };

        fetchAndRedirect();
    }, [slug, navigate]);

    if (loading) {
        return (
            <>
                <Navbar />
                <LoadingState />
            </>
        );
    }

    return null;
}
