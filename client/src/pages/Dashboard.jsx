import React, { useEffect, useState, useCallback, useMemo, lazy, Suspense } from "react";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";
import { isAuthenticated, getToken, getUser, setUser as setUserInStorage } from "../utils/auth";
import { propertiesAPI } from "../lib/api";
import { showSuccessToast, showErrorToast } from "../utils/toastNotifications";
import { Sparkles } from "lucide-react";
import { calculateProfileCompletion } from "../utils/profileCompletion";

// Lazy load heavy components
const ProfileCard = lazy(() => import("../components/dashboard/ProfileCard"));
const StatsGrid = lazy(() => import("../components/dashboard/StatsGrid"));
const PersonalInfoSection = lazy(() => import("../components/dashboard/PersonalInfoSection"));
const VerificationSection = lazy(() => import("../components/dashboard/VerificationSection"));
const PropertiesSection = lazy(() => import("../components/dashboard/PropertiesSection"));
const SecuritySection = lazy(() => import("../components/dashboard/SecuritySection"));

import { ProfileCardSkeleton, StatsGridSkeleton } from "../components/ui/skeleton-loaders";
import { PageLoading, NetworkStatus } from "../components/ui/loading-states";

const Dashboard = React.memo(function Dashboard() {
    const navigate = useNavigate();
    const [userProperties, setUserProperties] = useState([]);
    const [propertiesLoading, setPropertiesLoading] = useState(false);
    const [propertiesError, setPropertiesError] = useState(null);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [verificationStatus, setVerificationStatus] = useState(null);
    const [verificationLoading, setVerificationLoading] = useState(false);
    const [verificationError, setVerificationError] = useState(null);
    const conversations = [];
    const wishlist = [];

    // Memoize authentication check to prevent unnecessary re-renders
    const shouldRedirectToLogin = useMemo(() => {
        return !isAuthenticated();
    }, []);

    useEffect(() => {
        if (shouldRedirectToLogin) {
            console.log('User not authenticated, redirecting to login');
            navigate("/login", { replace: true });
        }
    }, [navigate, shouldRedirectToLogin]);

    // Load user data from localStorage
    useEffect(() => {
        const storedUser = getUser();
        if (storedUser) {
            setUser(storedUser);
        }
        setIsLoading(false);
    }, []);

    // Fetch verification status from API
    const fetchVerificationStatus = useCallback(async () => {
        const token = getToken();
        if (!token) return;

        setVerificationLoading(true);
        setVerificationError(null);

        try {
            const response = await fetch('/api/verification/status', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || data.error || 'Failed to fetch verification status');
            }

            setVerificationStatus(data);

            // Update user data with latest verification status
            if (data.success && data.verification) {
                setUser(prevUser => {
                    if (!prevUser) return prevUser;
                    const updatedUser = {
                        ...prevUser,
                        emailVerified: data.verification.email.verified,
                        phoneVerified: data.verification.phone.verified,
                        emailVerifiedAt: data.verification.email.verifiedAt,
                        phoneVerifiedAt: data.verification.phone.verifiedAt,
                        createdAt: data.createdAt || prevUser.createdAt
                    };
                    // Update localStorage with the latest verification status
                    setUserInStorage(updatedUser);
                    return updatedUser;
                });
            }
        } catch (error) {
            console.error('Error fetching verification status:', error);
            setVerificationError(error.message);
        } finally {
            setVerificationLoading(false);
        }
    }, []);

    // Fetch verification status on mount
    useEffect(() => {
        if (isAuthenticated()) {
            fetchVerificationStatus();
        }
    }, []);

    // Fetch user properties function
    const fetchUserProperties = useCallback(async () => {
        if (!isAuthenticated()) return;

        setPropertiesLoading(true);
        setPropertiesError(null);

        try {
            const response = await propertiesAPI.getMyListings(navigate);

            if (response.success && response.data?.properties) {
                setUserProperties(response.data.properties);
            } else {
                throw new Error(response.message || 'Failed to fetch properties');
            }
        } catch (error) {
            console.error('Error fetching user properties:', error);
            setPropertiesError(error.message || 'Unable to load properties. Please try again.');
        } finally {
            setPropertiesLoading(false);
        }
    }, [navigate]);

    // Fetch user properties on mount
    useEffect(() => {
        if (isAuthenticated()) {
            fetchUserProperties();
        }
    }, [fetchUserProperties]);

    // Network status monitoring
    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);


    const handleTogglePropertyStatus = useCallback(async (propertyId, newStatus) => {
        try {
            const response = await propertiesAPI.updateStatus(propertyId, newStatus, navigate);

            if (response.success) {
                // Update local state with the new status
                setUserProperties(prevProperties =>
                    prevProperties.map(prop =>
                        prop._id === propertyId
                            ? { ...prop, status: newStatus }
                            : prop
                    )
                );
                showSuccessToast(
                    `Property ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`,
                    '',
                    { title: 'Status Updated' }
                );
            } else {
                throw new Error(response.message || 'Failed to update property status');
            }
        } catch (error) {
            console.error('Toggle property status error:', error);
            showErrorToast(
                error.message || 'Failed to update property status',
                '',
                { title: 'Update Failed' }
            );
            throw error; // Re-throw to let PropertiesSection handle loading state
        }
    }, [navigate]);

    const handleDeleteProperty = useCallback(async (propertyId) => {
        try {
            const response = await propertiesAPI.delete(propertyId, navigate);

            if (response.success) {
                // Remove property from local state
                setUserProperties(prevProperties =>
                    prevProperties.filter(prop => prop._id !== propertyId)
                );
                showSuccessToast(
                    'Property deleted successfully',
                    '',
                    { title: 'Property Deleted' }
                );
            } else {
                throw new Error(response.message || 'Failed to delete property');
            }
        } catch (error) {
            console.error('Delete property error:', error);
            showErrorToast(
                error.message || 'Failed to delete property',
                '',
                { title: 'Delete Failed' }
            );
            throw error; // Re-throw to let PropertiesSection handle loading state
        }
    }, [navigate]);

    const handleVerificationComplete = useCallback((type) => {
        console.log('Verification complete:', type);
        // Refresh verification status after successful verification
        fetchVerificationStatus();
    }, [fetchVerificationStatus]);

    const handleRetryDataLoad = useCallback(() => {
        fetchUserProperties();
    }, [fetchUserProperties]);

    // Memoize computed values
    const userListings = useMemo(() => userProperties, [userProperties]);

    // Calculate profile completion dynamically
    const profileCompletion = useMemo(() => {
        return calculateProfileCompletion(user);
    }, [user]);

    const unreadMessages = useMemo(() => {
        return conversations?.filter((c) => c.unreadCount?.get(user?.id) > 0).length || 0;
    }, [conversations, user?.id]);

    // Show page loading for initial load
    if (isLoading) {
        return (
            <PageLoading
                title="Loading Dashboard"
                description="Preparing your dashboard..."
            />
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
            <Navbar />

            <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-10">
                {/* Network Status */}
                <NetworkStatus
                    isOnline={isOnline}
                    onRetry={handleRetryDataLoad}
                    className="mb-3 sm:mb-4"
                />

                {/* Header Section - Compact on mobile */}
                <div className="mb-4 sm:mb-8">
                    <div className="flex items-center gap-2 mb-1 sm:mb-2">
                        <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg sm:rounded-xl">
                            <Sparkles className="w-4 h-4 sm:w-6 sm:h-6 text-primary" />
                        </div>
                        <span className="text-xs sm:text-sm font-medium text-primary bg-primary/5 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full">
                            Dashboard
                        </span>
                    </div>
                    <h1 className="text-xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-1">
                        Welcome, <span className="text-primary">{user?.name?.split(' ')[0]}</span>! 👋
                    </h1>
                    <p className="text-muted-foreground text-sm sm:text-base lg:text-lg max-w-2xl hidden sm:block">
                        Manage your properties, verify your account, and keep your security settings updated
                    </p>
                </div>

                {/* Profile Card & Stats */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-3 sm:gap-6 mb-3 sm:mb-6">
                    <div className="xl:col-span-1">
                        <Suspense fallback={<ProfileCardSkeleton />}>
                            {user ? (
                                <ProfileCard
                                    user={user}
                                    completion={profileCompletion.percentage}
                                    completionData={profileCompletion}
                                    onPostProperty={() => navigate("/post-property")}
                                />
                            ) : (
                                <ProfileCardSkeleton />
                            )}
                        </Suspense>
                    </div>
                    <div className="xl:col-span-2">
                        <Suspense fallback={<StatsGridSkeleton />}>
                            <StatsGrid
                                listings={userListings.length}
                                messages={unreadMessages}
                                favorites={wishlist?.length || 0}
                            />
                        </Suspense>
                    </div>
                </div>

                {/* Personal Info & Verification */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6 mb-3 sm:mb-6">
                    <Suspense fallback={<div className="animate-pulse bg-card h-48 sm:h-64 rounded-xl sm:rounded-2xl border border-border"></div>}>
                        <PersonalInfoSection user={user} />
                    </Suspense>
                    
                    <Suspense fallback={<div className="animate-pulse bg-card h-48 sm:h-64 rounded-xl sm:rounded-2xl border border-border"></div>}>
                        <VerificationSection
                            user={user}
                            verificationStatus={verificationStatus}
                            isLoading={verificationLoading}
                            error={verificationError}
                            onVerificationComplete={handleVerificationComplete}
                            onRetry={fetchVerificationStatus}
                        />
                    </Suspense>
                </div>

                {/* Properties Section */}
                <div className="mb-3 sm:mb-6">
                    <Suspense fallback={<div className="animate-pulse bg-card h-64 sm:h-96 rounded-xl sm:rounded-2xl border border-border"></div>}>
                        <PropertiesSection 
                            properties={userListings}
                            isLoading={propertiesLoading}
                            error={propertiesError}
                            onToggleStatus={handleTogglePropertyStatus}
                            onDeleteProperty={handleDeleteProperty}
                            onRetry={handleRetryDataLoad}
                        />
                    </Suspense>
                </div>

                {/* Security Section */}
                <div className="mb-3 sm:mb-6">
                    <Suspense fallback={<div className="animate-pulse bg-card h-48 sm:h-64 rounded-xl sm:rounded-2xl border border-border"></div>}>
                        <SecuritySection 
                            isLoading={false}
                            error={null}
                            user={user}
                        />
                    </Suspense>
                </div>
            </main>

            <Footer />
        </div>
    );
});

export default Dashboard;
