import { useEffect } from "react";
import { Toaster } from "./components/ui/toaster";
import { Toaster as Sonner } from "./components/ui/sonner.jsx";
import { TooltipProvider } from "./components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { register as registerSW } from "./utils/serviceWorker";
import { NavigationStateProvider } from "./components/ui/navigation-state-provider";
import { ThemeLoadingState } from "./components/ui/theme-error-boundary";
import { SocketProvider } from "./contexts/SocketContext";

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Listings from "./pages/Listings";
import Property from "./pages/Property";
import PostProperty from "./pages/PostProperty";
import SearchResults from "./pages/SearchResults";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Wishlist from "./pages/Wishlist";
import Messages from "./pages/Messages";
import Admin from "./pages/Admin";
import AdminDashboard from "./pages/AdminDashboard";
import About from "./pages/About";
import Contact from "./pages/Contact";
import FAQs from "./pages/FAQs";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Refund from "./pages/Refund";
import ComingSoon from "./pages/ComingSoon";
import Maintenance from "./pages/Maintenance";
import VerificationSection from "./components/dashboard/VerificationSection";
import Notifications from "./pages/Notifications";

// Admin pages
import AdminRoute from "./components/admin/AdminRoute";
import AdminLayout from "./components/admin/AdminLayout";
import AdminOverview from "./pages/admin/AdminOverview";
import UserManagement from "./pages/admin/UserManagement";
import PropertyManagement from "./pages/admin/PropertyManagement";
import LocationManagement from "./pages/admin/LocationManagement";
import CategoryManagement from "./pages/admin/CategoryManagement";
import ContentManagement from "./pages/admin/ContentManagement";
import NotificationManagement from "./pages/admin/NotificationManagement";
import ReviewModeration from "./pages/admin/ReviewModeration";
import SystemSettings from "./pages/admin/SystemSettings";
import Reports from "./pages/admin/Reports";
import AuditLogs from "./pages/admin/AuditLogs";

const queryClient = new QueryClient();

const App = () => {
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
    }, []);

    return (
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
                        <NavigationStateProvider>
                        <Routes>
                        <Route path="/" element={<Index />} />
                        <Route path="/listings" element={<Listings />} />
                        <Route path="/properties/:slug" element={<Property />} />
                        <Route path="/post-property" element={<PostProperty />} />
                        <Route path="/search" element={<SearchResults />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/signup" element={<Signup />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/wishlist" element={<Wishlist />} />
                        <Route path="/messages" element={<Messages />} />
                        <Route path="/admin" element={<AdminRoute><AdminLayout><AdminOverview /></AdminLayout></AdminRoute>} />
                        <Route path="/admin/monitoring" element={<AdminDashboard />} />
                        <Route path="/about" element={<About />} />
                        <Route path="/contact" element={<Contact />} />
                        <Route path="/faqs" element={<FAQs />} />
                        <Route path="/blog" element={<Blog />} />
                        <Route path="/blog/:slug" element={<BlogPost />} />
                        <Route path="/privacy-policy" element={<Privacy />} />
                        <Route path="/terms" element={<Terms />} />
                        <Route path="/refund-policy" element={<Refund />} />
                        <Route path="/coming-soon" element={<ComingSoon />} />
                        <Route path="/maintenance" element={<Maintenance />} />
                        <Route path="/notifications" element={<Notifications />} />

                        {/* Admin routes - protected with AdminRoute and wrapped in AdminLayout */}
                        <Route path="/admin/overview" element={<AdminRoute><AdminLayout><AdminOverview /></AdminLayout></AdminRoute>} />
                        <Route path="/admin/users" element={<AdminRoute><AdminLayout><UserManagement /></AdminLayout></AdminRoute>} />
                        <Route path="/admin/properties" element={<AdminRoute><AdminLayout><PropertyManagement /></AdminLayout></AdminRoute>} />
                        <Route path="/admin/locations" element={<AdminRoute><AdminLayout><LocationManagement /></AdminLayout></AdminRoute>} />
                        <Route path="/admin/categories" element={<AdminRoute><AdminLayout><CategoryManagement /></AdminLayout></AdminRoute>} />
                        <Route path="/admin/content" element={<AdminRoute><AdminLayout><ContentManagement /></AdminLayout></AdminRoute>} />
                        <Route path="/admin/notifications" element={<AdminRoute><AdminLayout><NotificationManagement /></AdminLayout></AdminRoute>} />
                        <Route path="/admin/reviews" element={<AdminRoute><AdminLayout><ReviewModeration /></AdminLayout></AdminRoute>} />
                        <Route path="/admin/settings" element={<AdminRoute><AdminLayout><SystemSettings /></AdminLayout></AdminRoute>} />
                        <Route path="/admin/reports" element={<AdminRoute><AdminLayout><Reports /></AdminLayout></AdminRoute>} />
                        <Route path="/admin/audit-logs" element={<AdminRoute><AdminLayout><AuditLogs /></AdminLayout></AdminRoute>} />

                            {/* Always keep last */}
                            <Route path="*" element={<NotFound />} />
                        </Routes>
                    </NavigationStateProvider>
                </BrowserRouter>
                </ThemeLoadingState>
            </TooltipProvider>
            </SocketProvider>
        </ThemeProvider>
    </QueryClientProvider>
    );
};

export default App;
