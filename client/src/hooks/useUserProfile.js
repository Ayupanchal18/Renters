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

    // Get profile completion status with weighted scoring
    const getProfileCompletion = useCallback(() => {
        const user = userQuery.data;
        if (!user) return { total: 100, completed: 0, percentage: 0, missing: [], breakdown: [] };

        /**
         * Weighted Profile Completion System
         * 
         * Categories and their weights (total = 100%):
         * - Basic Info (35%): Essential profile data
         * - Verification (40%): Trust & security - most important
         * - Profile Enhancement (15%): Optional but valuable
         * - Privacy Setup (10%): Account preferences
         */
        const completionItems = [
            // Basic Info - 35% total
            {
                key: 'name',
                label: 'Full Name',
                category: 'Basic Info',
                weight: 10,
                isComplete: !!(user.name && user.name.trim()),
                priority: 'required'
            },
            {
                key: 'email',
                label: 'Email Address',
                category: 'Basic Info',
                weight: 10,
                isComplete: !!(user.email && user.email.trim()),
                priority: 'required'
            },
            {
                key: 'phone',
                label: 'Phone Number',
                category: 'Basic Info',
                weight: 10,
                isComplete: !!(user.phone && user.phone.trim()),
                priority: 'required'
            },
            {
                key: 'address',
                label: 'Address',
                category: 'Basic Info',
                weight: 5,
                isComplete: !!(user.address && user.address.trim()),
                priority: 'recommended'
            },

            // Verification - 40% total (most important for trust)
            {
                key: 'emailVerified',
                label: 'Email Verification',
                category: 'Verification',
                weight: 20,
                isComplete: !!user.emailVerified,
                priority: 'required'
            },
            {
                key: 'phoneVerified',
                label: 'Phone Verification',
                category: 'Verification',
                weight: 20,
                isComplete: !!user.phoneVerified,
                priority: 'required'
            },

            // Profile Enhancement - 15% total
            {
                key: 'avatar',
                label: 'Profile Picture',
                category: 'Profile Enhancement',
                weight: 10,
                isComplete: !!(user.avatar && user.avatar.trim()),
                priority: 'recommended'
            },
            {
                key: 'userType',
                label: 'Account Type',
                category: 'Profile Enhancement',
                weight: 5,
                isComplete: !!(user.userType && user.userType !== 'buyer'), // Default is buyer, so selecting something specific counts
                priority: 'optional'
            },

            // Privacy Setup - 10% total
            {
                key: 'privacyPolicy',
                label: 'Privacy Policy Accepted',
                category: 'Privacy Setup',
                weight: 5,
                isComplete: !!user.privacyPolicyAcceptedAt,
                priority: 'recommended'
            },
            {
                key: 'terms',
                label: 'Terms Accepted',
                category: 'Privacy Setup',
                weight: 5,
                isComplete: !!user.termsAcceptedAt,
                priority: 'recommended'
            },
        ];

        // Calculate weighted percentage
        const totalWeight = completionItems.reduce((sum, item) => sum + item.weight, 0);
        const completedWeight = completionItems
            .filter(item => item.isComplete)
            .reduce((sum, item) => sum + item.weight, 0);

        const percentage = Math.round((completedWeight / totalWeight) * 100);

        // Get missing items sorted by priority and weight
        const priorityOrder = { required: 0, recommended: 1, optional: 2 };
        const missing = completionItems
            .filter(item => !item.isComplete)
            .sort((a, b) => {
                const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
                if (priorityDiff !== 0) return priorityDiff;
                return b.weight - a.weight; // Higher weight first within same priority
            })
            .map(item => ({
                label: item.label,
                category: item.category,
                weight: item.weight,
                priority: item.priority
            }));

        // Category breakdown for detailed view
        const categories = ['Basic Info', 'Verification', 'Profile Enhancement', 'Privacy Setup'];
        const breakdown = categories.map(category => {
            const categoryItems = completionItems.filter(item => item.category === category);
            const categoryTotal = categoryItems.reduce((sum, item) => sum + item.weight, 0);
            const categoryCompleted = categoryItems
                .filter(item => item.isComplete)
                .reduce((sum, item) => sum + item.weight, 0);

            return {
                category,
                total: categoryTotal,
                completed: categoryCompleted,
                percentage: categoryTotal > 0 ? Math.round((categoryCompleted / categoryTotal) * 100) : 0,
                items: categoryItems.map(item => ({
                    label: item.label,
                    isComplete: item.isComplete,
                    weight: item.weight,
                    priority: item.priority
                }))
            };
        });

        return {
            total: totalWeight,
            completed: completedWeight,
            percentage,
            missing,
            breakdown,
            // Quick access helpers
            nextStep: missing[0] || null,
            isComplete: percentage === 100,
            requiredComplete: completionItems
                .filter(item => item.priority === 'required')
                .every(item => item.isComplete)
        };
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