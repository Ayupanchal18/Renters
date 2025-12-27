import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Home, Search, ArrowLeft, Building2, MapPin } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import SEOHead from "../components/seo/SEOHead";

const NotFound = () => {
    const location = useLocation();
    
    useEffect(() => {
        console.error("404 Error: User attempted to access non-existent route:", location.pathname);
    }, [location.pathname]);
    
    return (
        <>
            <SEOHead
                title="Page Not Found"
                description="The page you're looking for doesn't exist. Browse our rental and buy properties instead."
                url={typeof window !== 'undefined' ? `${window.location.origin}${location.pathname}` : 'https://renters.in/404'}
                type="website"
            />
            <Navbar />
            <div className="min-h-screen flex flex-col bg-background">
                <div className="flex-1 flex items-center justify-center px-4 py-12 sm:py-20">
                    <div className="max-w-lg w-full text-center">
                        {/* Animated House Illustration */}
                        <div className="relative mb-6 sm:mb-8">
                            <div className="flex justify-center items-end gap-2 sm:gap-3">
                                {/* Left building */}
                                <div className="w-12 h-20 sm:w-16 sm:h-28 bg-muted rounded-t-lg relative animate-pulse">
                                    <div className="absolute inset-2 grid grid-cols-2 gap-1">
                                        <div className="bg-primary/20 rounded-sm"></div>
                                        <div className="bg-primary/20 rounded-sm"></div>
                                        <div className="bg-primary/20 rounded-sm"></div>
                                        <div className="bg-primary/20 rounded-sm"></div>
                                    </div>
                                </div>
                                
                                {/* Center house with 404 */}
                                <div className="relative">
                                    <div className="w-24 h-16 sm:w-32 sm:h-20 bg-primary/10 dark:bg-primary/20 rounded-t-lg"></div>
                                    <div 
                                        className="w-0 h-0 mx-auto"
                                        style={{
                                            borderLeft: '60px solid transparent',
                                            borderRight: '60px solid transparent',
                                            borderBottom: '40px solid hsl(var(--primary))',
                                        }}
                                    ></div>
                                    <div className="absolute top-8 sm:top-10 left-1/2 -translate-x-1/2">
                                        <Building2 className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
                                    </div>
                                </div>
                                
                                {/* Right building */}
                                <div className="w-10 h-24 sm:w-14 sm:h-32 bg-muted rounded-t-lg relative animate-pulse delay-150">
                                    <div className="absolute inset-2 grid grid-cols-2 gap-1">
                                        <div className="bg-primary/20 rounded-sm"></div>
                                        <div className="bg-primary/20 rounded-sm"></div>
                                        <div className="bg-primary/20 rounded-sm"></div>
                                        <div className="bg-primary/20 rounded-sm"></div>
                                        <div className="bg-primary/20 rounded-sm"></div>
                                        <div className="bg-primary/20 rounded-sm"></div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Ground line */}
                            <div className="h-1 bg-muted rounded-full mt-0"></div>
                        </div>
                        
                        {/* 404 Text */}
                        <h1 className="text-7xl sm:text-9xl font-bold text-primary mb-2 sm:mb-4 tracking-tight">
                            404
                        </h1>
                        
                        {/* Message */}
                        <div className="mb-6 sm:mb-8">
                            <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-2">
                                Property Not Found
                            </h2>
                            <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto">
                                Looks like this address doesn't exist in our listings. 
                                The property might have been moved or the URL is incorrect.
                            </p>
                        </div>
                        
                        {/* Location badge */}
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full text-xs sm:text-sm text-muted-foreground mb-6 sm:mb-8">
                            <MapPin className="w-3.5 h-3.5" />
                            <span className="font-mono">{location.pathname}</span>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                            <Link 
                                to="/"
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all hover:scale-105 shadow-lg shadow-primary/20"
                            >
                                <Home className="w-4 h-4" />
                                Go Home
                            </Link>
                            
                            <Link 
                                to="/rent"
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-muted text-foreground rounded-xl font-semibold text-sm hover:bg-muted/80 transition-all hover:scale-105"
                            >
                                <Search className="w-4 h-4" />
                                Browse Rentals
                            </Link>
                            
                            <button 
                                onClick={() => window.history.back()}
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 border border-border text-foreground rounded-xl font-semibold text-sm hover:bg-muted/50 transition-all"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Go Back
                            </button>
                        </div>
                        
                        {/* Quick Links */}
                        <div className="mt-10 sm:mt-12 pt-6 sm:pt-8 border-t border-border">
                            <p className="text-xs sm:text-sm text-muted-foreground mb-4">Popular destinations</p>
                            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                                <Link 
                                    to="/rent" 
                                    className="px-3 py-1.5 text-xs sm:text-sm text-primary hover:text-primary/80 hover:underline transition-colors"
                                >
                                    Rent Properties
                                </Link>
                                <span className="text-muted-foreground">•</span>
                                <Link 
                                    to="/buy" 
                                    className="px-3 py-1.5 text-xs sm:text-sm text-primary hover:text-primary/80 hover:underline transition-colors"
                                >
                                    Buy Properties
                                </Link>
                                <span className="text-muted-foreground">•</span>
                                <Link 
                                    to="/contact" 
                                    className="px-3 py-1.5 text-xs sm:text-sm text-primary hover:text-primary/80 hover:underline transition-colors"
                                >
                                    Contact Us
                                </Link>
                                <span className="text-muted-foreground hidden sm:inline">•</span>
                                <Link 
                                    to="/about" 
                                    className="px-3 py-1.5 text-xs sm:text-sm text-primary hover:text-primary/80 hover:underline transition-colors"
                                >
                                    About Us
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </>
    );
};

export default NotFound;
