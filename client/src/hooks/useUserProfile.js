import { useState, useCallback, useEffect } from 'react';
import { useUser, useUpdateUser, useProperties } from './useAPI';

/**
 * Custom hook for managing user profile data and operations
 * Provides comprehensive user data management with loading states and error handling
 */
export function useUserProfile() {
    const [profileState, setProfileState] = useState({
        isUpdating: false,
        updateError: null,
        updateSuccess: null,
        lastUpdated: null
    });

    const userQuery = useUser();
    const updateUserMutation = useUpdateUser();
    const propertiesQuery = useProperties({ owner: userQuery.data?._id });

    // Update user profile
    const updateProfile = useCallback(async (profileData) => {
        try {
            setProfileState(prev => ({
                ...prev,
                isUpdating: true,
                updateError: null,
                updateSuccess: null
            }));

            const result = await updateUserMutation.mutateAsync(profileData);

            if (result.success || result.user) {
                setProfileState(prev => ({
                    ...prev,
                    isUpdating: false,
                    updateSuccess: 'Profile updated successfully',
                    lastUpdated: new Date()
                }));
                return { success: true, user: result.user, message: result.message };
            } else {
                throw new Error(result.message || 'Failed to update profile');
            }
        } catch (error) {
            const errorMessage = error.message || 'Failed to update profile';
            setProfileState(prev => ({
                ...prev,
                isUpdating: false,
                updateError: errorMessage
            }));
            return { success: false, error: errorMessage };
        }
    }, [updateUserMutation]);

    // Refresh user data
    const refreshProfile = useCallback(() => {
        userQuery.refetch();
        propertiesQuery.refetch();
    }, [userQuery, propertiesQuery]);

    // Clear update state
    const clearUpdateState = useCallback(() => {
        setProfileState(prev => ({
            ...prev,
            updateError: null,
            updateSuccess: null
        }));
    }, []);

    // Get verification status summary
    const getVerificationStatus = useCallback(() => {
        const user = userQuery.data;
        if (!user) return { total: 0, verified: 0, percentage: 0 };

        const verifications = [
            user.emailVerified,
            user.phoneVerified
            // Add more verification types as they're implemented
        ];

        const verified = verifications.filter(Boolean).length;
        const total = verifications.length;
        const percentage = total > 0 ? Math.round((verified / total) * 100) : 0;

        return { total, verified, percentage };
    }, [userQuery.data]);

    // Get profile completion status
    const getProfileCompletion = useCallback(() => {
        const user = userQuery.data;
        if (!user) return { total: 0, completed: 0, percentage: 0, missing: [] };

        const fields = [
            { key: 'name', label: 'Full Name', value: user.name },
            { key: 'email', label: 'Email Address', value: user.email },
            { key: 'phone', label: 'Phone Number', value: user.phone },
            { key: 'address', label: 'Address', value: user.address },
            { key: 'avatar', label: 'Profile Picture', value: user.avatar }
        ];

        const completed = fields.filter(field => field.value && field.value.trim() !== '').length;
        const total = fields.length;
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
        const missing = fields.filter(field => !field.value || field.value.trim() === '').map(field => field.label);

        return { total, completed, percentage, missing };
    }, [userQuery.data]);

    // Get user statistics
    const getUserStats = useCallback(() => {
        const user = userQuery.data;
        const properties = propertiesQuery.data?.properties || [];

        return {
            totalProperties: properties.length,
            activeProperties: properties.filter(p => p.status === 'active').length,
            totalViews: properties.reduce((sum, p) => sum + (p.views || 0), 0),
            memberSince: user?.createdAt ? new Date(user.createdAt) : null,
            lastLogin: user?.lastLoginAt ? new Date(user.lastLoginAt) : null
        };
    }, [userQuery.data, propertiesQuery.data]);

    // Check if user has specific role or permission
    const hasRole = useCallback((role) => {
        const user = userQuery.data;
        if (!user) return false;
        return user.role === role || (Array.isArray(user.roles) && user.roles.includes(role));
    }, [userQuery.data]);

    // Check if user is property owner
    const isPropertyOwner = useCallback(() => {
        const properties = propertiesQuery.data?.properties || [];
        return properties.length > 0;
    }, [propertiesQuery.data]);

    // Auto-clear success messages after 5 seconds
    useEffect(() => {
        if (profileState.updateSuccess) {
            const timer = setTimeout(() => {
                setProfileState(prev => ({
                    ...prev,
                    updateSuccess: null
                }));
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [profileState.updateSuccess]);

    return {
        // User data
        user: userQuery.data,
        properties: propertiesQuery.data?.properties || [],

        // Loading states
        isLoading: userQuery.isLoading || propertiesQuery.isLoading,
        isUpdating: profileState.isUpdating || updateUserMutation.isPending,

        // Error states
        error: userQuery.error || propertiesQuery.error || profileState.updateError,
        updateError: profileState.updateError,

        // Success states
        updateSuccess: profileState.updateSuccess,
        lastUpdated: profileState.lastUpdated,

        // Operations
        updateProfile,
        refreshProfile,
        clearUpdateState,

        // Computed data
        verificationStatus: getVerificationStatus(),
        profileCompletion: getProfileCompletion(),
        userStats: getUserStats(),

        // Utilities
        hasRole,
        isPropertyOwner,

        // Query states for advanced usage
        userQuery,
        propertiesQuery,

        // Refetch functions
        refetchUser: userQuery.refetch,
        refetchProperties: propertiesQuery.refetch
    };
}