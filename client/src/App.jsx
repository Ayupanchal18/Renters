import { useEffect, lazy, Suspense, useCallback } from "react";
import { Toaster } from "./components/ui/toaster";
import { Toaster as Sonner } from "./components/ui/sonner.jsx";
import { TooltipProvider } from "./components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { register as registerSW } from "./utils/serviceWorker";
import { NavigationStateProvider } from "./components/ui/navigation-state-provider";
import { ThemeLoadingState } from "./components/ui/theme-error-boundary";
import { RouteErrorBoundary } from "./components/ui/route-error-boundary";
import { SocketProvider } from "./contexts/SocketContext";
import { HelmetProvider } from "react-helmet-async";
import { useWebVitals, WEB_VITALS_THRESHOLDS } from "./hooks/useWebVitals";
import { setupTokenRefresh } from "./utils/auth";
import MaintenanceGuard from "./components/common/MaintenanceGuard";
import AiAssistantWidget from "./components/ai/AiAssistantWidget";
import AnalyticsTracker from "./components/common/AnalyticsTracker";

// Critical path - load immediately (lightweight)
import NotFound from "./pages/NotFound";

// Home page - lazy load since it's heavy
const Index = lazy(() => import("./pages/Index"));

// Route-based code splitting - lazy load all other pages
const Listings = lazy(() => import("./pages/Listings"));
const RentListings = lazy(() => import("./pages/RentListings"));
const BuyListings = lazy(() => import("./pages/BuyListings"));
const Property = lazy(() => import("./pages/Property"));
const RentPropertyDetail = lazy(() => import("./pages/RentPropertyDetail"));
const BuyPropertyDetail = lazy(() => import("./pages/BuyPropertyDetail"));
const PropertyRedirect = lazy(() => import("./pages/PropertyRedirect"));
const PostProperty = lazy(() => import("./pages/PostProperty"));
const SearchResults = lazy(() => import("./pages/SearchResults"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Wishlist = lazy(() => import("./pages/Wishlist"));
const Messages = lazy(() => import("./pages/Messages"));
const Admin = lazy(() => import("./pages/Admin"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const LeaseAgreement = lazy(() => import("./pages/LeaseAgreement"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const FAQs = lazy(() => import("./pages/FAQs"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const DoNotSellMyInfo = lazy(() => import("./pages/policies/DoNotSellMyInfo"));
const FairHousingPolicy = lazy(() => import("./pages/policies/FairHousingPolicy"));
const DMCAPolicy = lazy(() => import("./pages/policies/DMCAPolicy"));
const CookiePolicy = lazy(() => import("./pages/policies/CookiePolicy"));
const AccessibilityStatement = lazy(() => import("./pages/policies/AccessibilityStatement"));
const AvoidScams = lazy(() => import("./pages/policies/AvoidScams"));
const Investors = lazy(() => import("./pages/policies/Investors"));
const ComingSoon = lazy(() => import("./pages/ComingSoon"));
const Maintenance = lazy(() => import("./pages/Maintenance"));
const Notifications = lazy(() => import("./pages/Notifications"));

// Admin pages - lazy loaded
const AdminRoute = lazy(() => import("./components/admin/AdminRoute"));
const AdminLayout = lazy(() => import("./components/admin/AdminLayout"));
const ProtectedRoute = lazy(() => import("./components/auth/ProtectedRoute"));
const AdminOverview = lazy(() => import("./pages/admin/AdminOverview"));
const UserManagement = lazy(() => import("./pages/admin/UserManagement"));
const VaultReview = lazy(() => import("./pages/admin/VaultReview"));
const PropertyManagement = lazy(() => import("./pages/admin/PropertyManagement"));
const LocationManagement = lazy(() => import("./pages/admin/LocationManagement"));
const CategoryManagement = lazy(() => import("./pages/admin/CategoryManagement"));
const ContentManagement = lazy(() => import("./pages/admin/ContentManagement"));
const NotificationManagement = lazy(() => import("./pages/admin/NotificationManagement"));
const CampaignManagement = lazy(() => import("./pages/admin/CampaignManagement"));
const ReviewModeration = lazy(() => import("./pages/admin/ReviewModeration"));
const TestimonialManagement = lazy(() => import("./pages/admin/TestimonialManagement"));
const SystemSettings = lazy(() => import("./pages/admin/SystemSettings"));
const Reports = lazy(() => import("./pages/admin/Reports"));
const AuditLogs = lazy(() => import("./pages/admin/AuditLogs"));
const ConversationModeration = lazy(() => import("./pages/admin/ConversationModeration"));
const RolePermissions = lazy(() => import("./pages/admin/RolePermissions"));
const MediaLibrary = lazy(() => import("./pages/admin/MediaLibrary"));
const Analytics = lazy(() => import("./pages/admin/Analytics"));
const LegalRequests = lazy(() => import("./pages/admin/LegalRequests"));
const NewsletterSubscribers = lazy(() => import("./pages/admin/NewsletterSubscribers"));
const EmailTemplateManagement = lazy(() => import("./pages/admin/EmailTemplateManagement"));
const CustomEmailBroadcaster = lazy(() => import("./pages/admin/CustomEmailBroadcaster"));

// Minimal loading fallback for lazy routes
function PageLoader() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-muted-foreground">Loading...</p>
            </div>
        </div>
    );
}

// Admin route wrapper with lazy loading and error boundary
function AdminRouteWrapper({ children }) {
    return (
        <RouteErrorBoundary routeName="admin">
            <Suspense fallback={<PageLoader />}>
                <AdminRoute>
                    <AdminLayout>{children}</AdminLayout>
                </AdminRoute>
            </Suspense>
        </RouteErrorBoundary>
    );
}

// Protected route wrapper for authenticated users with error boundary
function ProtectedRouteWrapper({ children }) {
    return (
        <RouteErrorBoundary routeName="protected">
            <Suspense fallback={<PageLoader />}>
                <ProtectedRoute>
                    {children}
                </ProtectedRoute>
            </Suspense>
        </RouteErrorBoundary>
    );
}

// Public route wrapper with error boundary
function PublicRouteWrapper({ children, routeName }) {
    return (
        <RouteErrorBoundary routeName={routeName}>
            {children}
        </RouteErrorBoundary>
    );
}

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
            refetchOnWindowFocus: false,
            retry: 1,
        },
    },
});

// Route transition wrapper — re-mounts children on each path change to trigger page-enter animation
function PageTransition({ children }) {
    const location = useLocation();
    return (
        <div key={location.pathname} className="animate-page-enter">
            {children}
        </div>
    );
}

const App = () => {
    // Web Vitals reporting callback - logs metrics in development mode
    const handleWebVitalsReport = useCallback((metric) => {
        if (import.meta.env.DEV) {
            const threshold = WEB_VITALS_THRESHOLDS[metric.name];
            const isGood = threshold ? metric.value <= threshold.good : true;
            const style = isGood ? 'color: green' : 'color: orange';
            
            console.log(
                `%c[Web Vitals] ${metric.name}: ${metric.value.toFixed(2)} (${metric.rating})`,
                style
            );
        }
        
        // In production, you could send metrics to an analytics endpoint
        // Example: sendToAnalytics(metric);
    }, []);

    // Initialize Web Vitals monitoring
    useWebVitals(handleWebVitalsReport);

    // Register service worker for offline functionality
    useEffect(() => {
        registerSW({
            onSuccess: () => {
                console.log('App is ready for offline use');
            },
            onUpdate: () => {
                console.log('New app version available');
            },
        });
        
        // Setup automatic token refresh
        const cleanupTokenRefresh = setupTokenRefresh();
        return cleanupTokenRefresh;
    }, []);

    return (
    <HelmetProvider>
    <QueryClientProvider client={queryClient}>
        <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem={false}
            disableTransitionOnChange={false}
            storageKey="theme"
        >
            <SocketProvider>
            <TooltipProvider>
                <Toaster />
                <Sonner />
                <ThemeLoadingState>
                <BrowserRouter
                    future={{
                        v7_startTransition: true,
                        v7_relativeSplatPath: true
                    }}
                >
                    <AnalyticsTracker />
                    <MaintenanceGuard>
                    <NavigationStateProvider>
                    <RouteErrorBoundary routeName="app">
                    <Suspense fallback={<PageLoader />}>
                    <PageTransition>
                        <Routes>
                            {/* Public routes */}
                            <Route path="/" element={<PublicRouteWrapper routeName="home"><Index /></PublicRouteWrapper>} />
                            <Route path="/listings" element={<PublicRouteWrapper routeName="listings"><Listings /></PublicRouteWrapper>} />
                            <Route path="/rent-properties" element={<PublicRouteWrapper routeName="rent-listings"><RentListings /></PublicRouteWrapper>} />
                            <Route path="/buy-properties" element={<PublicRouteWrapper routeName="buy-listings"><BuyListings /></PublicRouteWrapper>} />
                            <Route path="/rent/:slug" element={<PublicRouteWrapper routeName="rent-property-detail"><RentPropertyDetail /></PublicRouteWrapper>} />
                            <Route path="/buy/:slug" element={<PublicRouteWrapper routeName="buy-property-detail"><BuyPropertyDetail /></PublicRouteWrapper>} />
                            <Route path="/properties/:slug" element={<PublicRouteWrapper routeName="property"><Property /></PublicRouteWrapper>} />
                            <Route path="/property/:slug" element={<PublicRouteWrapper routeName="property-redirect"><PropertyRedirect /></PublicRouteWrapper>} />
                            <Route path="/search" element={<PublicRouteWrapper routeName="search"><SearchResults /></PublicRouteWrapper>} />
                            <Route path="/login" element={<PublicRouteWrapper routeName="login"><Login /></PublicRouteWrapper>} />
                            <Route path="/signup" element={<PublicRouteWrapper routeName="signup"><Signup /></PublicRouteWrapper>} />
                            <Route path="/about" element={<PublicRouteWrapper routeName="about"><About /></PublicRouteWrapper>} />
                            <Route path="/contact" element={<PublicRouteWrapper routeName="contact"><Contact /></PublicRouteWrapper>} />
                            <Route path="/faqs" element={<PublicRouteWrapper routeName="faqs"><FAQs /></PublicRouteWrapper>} />
                            <Route path="/blog" element={<PublicRouteWrapper routeName="blog"><Blog /></PublicRouteWrapper>} />
                            <Route path="/blog/:slug" element={<PublicRouteWrapper routeName="blog-post"><BlogPost /></PublicRouteWrapper>} />
                            <Route path="/privacy-policy" element={<PublicRouteWrapper routeName="privacy"><Privacy /></PublicRouteWrapper>} />
                            <Route path="/terms" element={<PublicRouteWrapper routeName="terms"><Terms /></PublicRouteWrapper>} />
                            <Route path="/do-not-sell-my-info" element={<PublicRouteWrapper routeName="do-not-sell-my-info"><DoNotSellMyInfo /></PublicRouteWrapper>} />
                            <Route path="/fair-housing-policy" element={<PublicRouteWrapper routeName="fair-housing-policy"><FairHousingPolicy /></PublicRouteWrapper>} />
                            <Route path="/dmca-policy" element={<PublicRouteWrapper routeName="dmca-policy"><DMCAPolicy /></PublicRouteWrapper>} />
                            <Route path="/cookie-policy" element={<PublicRouteWrapper routeName="cookie-policy"><CookiePolicy /></PublicRouteWrapper>} />
                            <Route path="/accessibility-statement" element={<PublicRouteWrapper routeName="accessibility-statement"><AccessibilityStatement /></PublicRouteWrapper>} />
                            <Route path="/avoid-scams" element={<PublicRouteWrapper routeName="avoid-scams"><AvoidScams /></PublicRouteWrapper>} />
                            <Route path="/investors" element={<PublicRouteWrapper routeName="investors"><Investors /></PublicRouteWrapper>} />
                            <Route path="/coming-soon" element={<PublicRouteWrapper routeName="coming-soon"><ComingSoon /></PublicRouteWrapper>} />
                            <Route path="/maintenance" element={<PublicRouteWrapper routeName="maintenance"><Maintenance /></PublicRouteWrapper>} />

                            {/* Protected routes - require authentication */}
                            <Route path="/post-property" element={<ProtectedRouteWrapper><PostProperty /></ProtectedRouteWrapper>} />
                            <Route path="/dashboard" element={<ProtectedRouteWrapper><Dashboard /></ProtectedRouteWrapper>} />
                            <Route path="/wishlist" element={<ProtectedRouteWrapper><Wishlist /></ProtectedRouteWrapper>} />
                            <Route path="/messages" element={<ProtectedRouteWrapper><Messages /></ProtectedRouteWrapper>} />
                            <Route path="/messages/:conversationId" element={<ProtectedRouteWrapper><Messages /></ProtectedRouteWrapper>} />
                            <Route path="/notifications" element={<ProtectedRouteWrapper><Notifications /></ProtectedRouteWrapper>} />
                            <Route path="/leases/:id" element={<ProtectedRouteWrapper><LeaseAgreement /></ProtectedRouteWrapper>} />

                            {/* Admin routes - require admin role */}
                            <Route path="/admin" element={<AdminRouteWrapper><AdminOverview /></AdminRouteWrapper>} />
                            <Route path="/admin/monitoring" element={<AdminRouteWrapper><AdminDashboard /></AdminRouteWrapper>} />
                            <Route path="/admin/overview" element={<AdminRouteWrapper><AdminOverview /></AdminRouteWrapper>} />
                            <Route path="/admin/users" element={<AdminRouteWrapper><UserManagement /></AdminRouteWrapper>} />
                            <Route path="/admin/vault" element={<AdminRouteWrapper><VaultReview /></AdminRouteWrapper>} />
                            <Route path="/admin/properties" element={<AdminRouteWrapper><PropertyManagement /></AdminRouteWrapper>} />
                            <Route path="/admin/locations" element={<AdminRouteWrapper><LocationManagement /></AdminRouteWrapper>} />
                            <Route path="/admin/categories" element={<AdminRouteWrapper><CategoryManagement /></AdminRouteWrapper>} />
                            <Route path="/admin/content" element={<AdminRouteWrapper><ContentManagement /></AdminRouteWrapper>} />
                            <Route path="/admin/notifications" element={<AdminRouteWrapper><NotificationManagement /></AdminRouteWrapper>} />
                            <Route path="/admin/campaigns" element={<AdminRouteWrapper><CampaignManagement /></AdminRouteWrapper>} />
                            <Route path="/admin/reviews" element={<AdminRouteWrapper><ReviewModeration /></AdminRouteWrapper>} />
                            <Route path="/admin/testimonials" element={<AdminRouteWrapper><TestimonialManagement /></AdminRouteWrapper>} />
                            <Route path="/admin/settings" element={<AdminRouteWrapper><SystemSettings /></AdminRouteWrapper>} />
                            <Route path="/admin/reports" element={<AdminRouteWrapper><Reports /></AdminRouteWrapper>} />
                            <Route path="/admin/audit-logs" element={<AdminRouteWrapper><AuditLogs /></AdminRouteWrapper>} />
                            <Route path="/admin/conversations" element={<AdminRouteWrapper><ConversationModeration /></AdminRouteWrapper>} />
                            <Route path="/admin/roles" element={<AdminRouteWrapper><RolePermissions /></AdminRouteWrapper>} />
                            <Route path="/admin/media" element={<AdminRouteWrapper><MediaLibrary /></AdminRouteWrapper>} />
                            <Route path="/admin/analytics" element={<AdminRouteWrapper><Analytics /></AdminRouteWrapper>} />
                            <Route path="/admin/legal-requests" element={<AdminRouteWrapper><LegalRequests /></AdminRouteWrapper>} />
                            <Route path="/admin/subscribers" element={<AdminRouteWrapper><NewsletterSubscribers /></AdminRouteWrapper>} />
                            <Route path="/admin/email-templates" element={<AdminRouteWrapper><EmailTemplateManagement /></AdminRouteWrapper>} />
                            <Route path="/admin/email-broadcaster" element={<AdminRouteWrapper><CustomEmailBroadcaster /></AdminRouteWrapper>} />

                            {/* 404 - Always last */}
                            <Route path="*" element={<NotFound />} />
                        </Routes>
                    </PageTransition>
                    </Suspense>
                    </RouteErrorBoundary>
                    <AiAssistantWidget />
                    </NavigationStateProvider>
                    </MaintenanceGuard>
                </BrowserRouter>
                </ThemeLoadingState>
            </TooltipProvider>
            </SocketProvider>
        </ThemeProvider>
    </QueryClientProvider>
    </HelmetProvider>
    );
};

export default App;
