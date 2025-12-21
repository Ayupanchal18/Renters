import { useState, useEffect, useCallback } from 'react';
import { useToast } from './use-toast';
import { getHeaders } from '../lib/api.js';

/**
 * Custom hook for managing notification preferences
 * Provides functionality to get, update, and manage user notification settings
 */
export function useNotificationPreferences() {
    const [preferences, setPreferences] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { toast } = useToast();

    /**
     * Fetch user notification preferences
     */
    const fetchPreferences = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/notifications/preferences', {
                method: 'GET',
                headers: getHeaders(),
            });

            if (!response.ok) {
                throw new Error('Failed to fetch notification preferences');
            }

            const data = await response.json();
            setPreferences(data.data);
        } catch (err) {
            setError(err.message);
            toast({
                title: "Error",
                description: "Failed to load notification preferences",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    /**
     * Update notification preferences
     * @param {object} updates - Preference updates to apply
     */
    const updatePreferences = useCallback(async (updates) => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/notifications/preferences', {
                method: 'PATCH',
                headers: getHeaders(),
                body: JSON.stringify(updates),
            });

            if (!response.ok) {
                throw new Error('Failed to update notification preferences');
            }

            const data = await response.json();
            setPreferences(data.data);

            toast({
                title: "Success",
                description: "Notification preferences updated successfully",
            });

            return data.data;
        } catch (err) {
            setError(err.message);
            toast({
                title: "Error",
                description: "Failed to update notification preferences",
                variant: "destructive",
            });
            throw err;
        } finally {
            setLoading(false);
        }
    }, [toast]);

    /**
     * Reset preferences to default
     */
    const resetToDefault = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/notifications/preferences/reset', {
                method: 'POST',
                headers: getHeaders(),
            });

            if (!response.ok) {
                throw new Error('Failed to reset notification preferences');
            }

            const data = await response.json();
            setPreferences(data.data);

            toast({
                title: "Success",
                description: "Notification preferences reset to default",
            });

            return data.data;
        } catch (err) {
            setError(err.message);
            toast({
                title: "Error",
                description: "Failed to reset notification preferences",
                variant: "destructive",
            });
            throw err;
        } finally {
            setLoading(false);
        }
    }, [toast]);

    /**
     * Update a specific preference setting
     * @param {string} category - Preference category (securityEvents, general, globalSettings)
     * @param {string} type - Preference type within category
     * @param {string} method - Notification method (email, sms)
     * @param {boolean} enabled - Whether the preference is enabled
     */
    const updateSpecificPreference = useCallback(async (category, type, method, enabled) => {
        if (!preferences) return;

        const updates = {
            [category]: {
                [type]: {
                    [method]: enabled
                }
            }
        };

        return await updatePreferences(updates);
    }, [preferences, updatePreferences]);

    /**
     * Update global settings
     * @param {object} globalUpdates - Global settings updates
     */
    const updateGlobalSettings = useCallback(async (globalUpdates) => {
        const updates = {
            globalSettings: globalUpdates
        };

        return await updatePreferences(updates);
    }, [updatePreferences]);

    /**
     * Send a test notification
     * @param {string} type - Type of notification to test
     * @param {object} context - Additional context for the test
     */
    const sendTestNotification = useCallback(async (type, context = {}) => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/notifications/test', {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ type, context }),
            });

            if (!response.ok) {
                throw new Error('Failed to send test notification');
            }

            toast({
                title: "Test Sent",
                description: "Test notification sent successfully",
            });
        } catch (err) {
            setError(err.message);
            toast({
                title: "Error",
                description: "Failed to send test notification",
                variant: "destructive",
            });
            throw err;
        } finally {
            setLoading(false);
        }
    }, [toast]);

    // Load preferences on mount
    useEffect(() => {
        fetchPreferences();
    }, [fetchPreferences]);

    return {
        preferences,
        loading,
        error,
        fetchPreferences,
        updatePreferences,
        updateSpecificPreference,
        updateGlobalSettings,
        resetToDefault,
        sendTestNotification,
    };
}