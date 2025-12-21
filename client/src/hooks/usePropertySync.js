import { useDispatch, useSelector } from 'react-redux';
import { useCallback } from 'react';
import {
    updatePropertyOptimistic,
    confirmOptimisticUpdate,
    revertOptimisticUpdate,
    syncPropertyData,
    removePropertyFromViews
} from '../redux/slices/propertySlice';
import propertyService from '../api/propertyService';

/**
 * Custom hook for managing property updates with optimistic updates
 * and cross-view data consistency
 */
export const usePropertySync = () => {
    const dispatch = useDispatch();
    const { propertyCache, optimisticUpdates } = useSelector(state => state.postproperty);

    // Get property from cache with optimistic updates applied
    const getProperty = useCallback((propertyId) => {
        const baseProperty = propertyCache[propertyId];
        const optimisticUpdate = optimisticUpdates[propertyId];

        if (!baseProperty) return null;

        return optimisticUpdate
            ? { ...baseProperty, ...optimisticUpdate }
            : baseProperty;
    }, [propertyCache, optimisticUpdates]);

    // Update property with optimistic updates
    const updateProperty = useCallback(async (propertyId, updates) => {
        const originalProperty = propertyCache[propertyId];

        if (!originalProperty) {
            throw new Error('Property not found in cache');
        }

        // Apply optimistic update immediately
        dispatch(updatePropertyOptimistic({ propertyId, updates }));

        try {
            // Make API call
            const response = await propertyService.updateProperty(propertyId, updates);

            // Confirm optimistic update and sync with server response
            dispatch(confirmOptimisticUpdate({ propertyId }));
            dispatch(syncPropertyData({ property: response.data }));

            return response.data;
        } catch (error) {
            // Revert optimistic update on error
            dispatch(revertOptimisticUpdate({
                propertyId,
                originalData: originalProperty
            }));
            throw error;
        }
    }, [dispatch, propertyCache]);

    // Delete property with optimistic updates
    const deleteProperty = useCallback(async (propertyId) => {
        const originalProperty = propertyCache[propertyId];

        if (!originalProperty) {
            throw new Error('Property not found in cache');
        }

        // Optimistically remove from views
        dispatch(removePropertyFromViews({ propertyId }));

        try {
            // Make API call
            await propertyService.deleteProperty(propertyId);

            // Property already removed optimistically, no need to revert
            return true;
        } catch (error) {
            // Restore property on error
            dispatch(syncPropertyData({ property: originalProperty }));
            throw error;
        }
    }, [dispatch, propertyCache]);

    // Toggle property status (active/inactive)
    const togglePropertyStatus = useCallback(async (propertyId, newStatus) => {
        return updateProperty(propertyId, { status: newStatus });
    }, [updateProperty]);

    // Sync property data from server (for real-time updates)
    const syncProperty = useCallback((property) => {
        dispatch(syncPropertyData({ property }));
    }, [dispatch]);

    // Check if property has pending optimistic updates
    const hasPendingUpdates = useCallback((propertyId) => {
        return !!optimisticUpdates[propertyId];
    }, [optimisticUpdates]);

    return {
        getProperty,
        updateProperty,
        deleteProperty,
        togglePropertyStatus,
        syncProperty,
        hasPendingUpdates,
        propertyCache,
        optimisticUpdates
    };
};

export default usePropertySync;