/**
 * Optimistic Update Utilities
 * Provides better user experience by showing immediate feedback
 * Validates: Requirements 1.4, 9.1, 9.4
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { showSuccessToast, showErrorToast } from './toastNotifications';

/**
 * Optimistic Update Hook
 * Manages optimistic updates with rollback capability
 */
export function useOptimisticUpdate(initialData = null) {
    const [data, setData] = useState(initialData);
    const [isOptimistic, setIsOptimistic] = useState(false);
    const [error, setError] = useState(null);
    const previousDataRef = useRef(null);

    // Apply optimistic update
    const applyOptimisticUpdate = useCallback((newData, updateFn) => {
        // Store current data for potential rollback
        previousDataRef.current = data;

        // Apply optimistic update
        const optimisticData = updateFn ? updateFn(data, newData) : newData;
        setData(optimisticData);
        setIsOptimistic(true);
        setError(null);

        return optimisticData;
    }, [data]);

    // Confirm optimistic update (when server responds successfully)
    const confirmUpdate = useCallback((serverData) => {
        setData(serverData);
        setIsOptimistic(false);
        setError(null);
        previousDataRef.current = null;
    }, []);

    // Rollback optimistic update (when server responds with error)
    const rollbackUpdate = useCallback((errorMessage) => {
        if (previousDataRef.current !== null) {
            setData(previousDataRef.current);
            previousDataRef.current = null;
        }
        setIsOptimistic(false);
        setError(errorMessage);
    }, []);

    // Reset state
    const reset = useCallback((newData = null) => {
        setData(newData);
        setIsOptimistic(false);
        setError(null);
        previousDataRef.current = null;
    }, []);

    return {
        data,
        isOptimistic,
        error,
        applyOptimisticUpdate,
        confirmUpdate,
        rollbackUpdate,
        reset
    };
}

/**
 * Optimistic List Operations
 */
export class OptimisticList {
    constructor(initialItems = []) {
        this.items = initialItems;
        this.pendingOperations = new Map();
        this.listeners = new Set();
    }

    // Subscribe to changes
    subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    // Notify listeners of changes
    notify() {
        this.listeners.forEach(listener => listener(this.getItems()));
    }

    // Get current items (including optimistic updates)
    getItems() {
        return [...this.items];
    }

    // Add item optimistically
    addItem(item, tempId = null) {
        const optimisticItem = {
            ...item,
            _tempId: tempId || `temp_${Date.now()}_${Math.random()}`,
            _isOptimistic: true
        };

        this.items.push(optimisticItem);
        this.pendingOperations.set(optimisticItem._tempId, {
            type: 'add',
            item: optimisticItem
        });

        this.notify();
        return optimisticItem._tempId;
    }

    // Update item optimistically
    updateItem(id, updates) {
        const index = this.items.findIndex(item =>
            item.id === id || item._id === id || item._tempId === id
        );

        if (index === -1) return null;

        const originalItem = { ...this.items[index] };
        const updatedItem = {
            ...originalItem,
            ...updates,
            _isOptimistic: true,
            _originalData: originalItem._originalData || originalItem
        };

        this.items[index] = updatedItem;
        this.pendingOperations.set(id, {
            type: 'update',
            item: updatedItem,
            originalItem
        });

        this.notify();
        return updatedItem;
    }

    // Remove item optimistically
    removeItem(id) {
        const index = this.items.findIndex(item =>
            item.id === id || item._id === id || item._tempId === id
        );

        if (index === -1) return null;

        const removedItem = this.items[index];
        this.items.splice(index, 1);
        this.pendingOperations.set(id, {
            type: 'remove',
            item: removedItem,
            index
        });

        this.notify();
        return removedItem;
    }

    // Confirm operation success
    confirmOperation(tempId, serverItem = null) {
        const operation = this.pendingOperations.get(tempId);
        if (!operation) return;

        switch (operation.type) {
            case 'add':
                if (serverItem) {
                    // Replace optimistic item with server item
                    const index = this.items.findIndex(item => item._tempId === tempId);
                    if (index !== -1) {
                        this.items[index] = { ...serverItem, _isOptimistic: false };
                    }
                }
                break;

            case 'update':
                if (serverItem) {
                    const id = operation.item.id || operation.item._id;
                    const index = this.items.findIndex(item =>
                        item.id === id || item._id === id
                    );
                    if (index !== -1) {
                        this.items[index] = { ...serverItem, _isOptimistic: false };
                    }
                } else {
                    // Just remove optimistic flag
                    const id = operation.item.id || operation.item._id;
                    const index = this.items.findIndex(item =>
                        item.id === id || item._id === id
                    );
                    if (index !== -1) {
                        delete this.items[index]._isOptimistic;
                        delete this.items[index]._originalData;
                    }
                }
                break;

            case 'remove':
                // Item already removed, just clean up
                break;
        }

        this.pendingOperations.delete(tempId);
        this.notify();
    }

    // Rollback operation on error
    rollbackOperation(tempId) {
        const operation = this.pendingOperations.get(tempId);
        if (!operation) return;

        switch (operation.type) {
            case 'add': {
                // Remove the optimistically added item
                const addIndex = this.items.findIndex(item => item._tempId === tempId);
                if (addIndex !== -1) {
                    this.items.splice(addIndex, 1);
                }
                break;
            }

            case 'update': {
                // Restore original item
                const id = operation.item.id || operation.item._id;
                const updateIndex = this.items.findIndex(item =>
                    item.id === id || item._id === id
                );
                if (updateIndex !== -1) {
                    this.items[updateIndex] = operation.originalItem;
                }
                break;
            }

            case 'remove':
                // Re-add the removed item
                this.items.splice(operation.index, 0, operation.item);
                break;
        }

        this.pendingOperations.delete(tempId);
        this.notify();
    }

    // Check if item is optimistic
    isOptimistic(id) {
        const item = this.items.find(item =>
            item.id === id || item._id === id || item._tempId === id
        );
        return item?._isOptimistic || false;
    }

    // Get pending operations count
    getPendingCount() {
        return this.pendingOperations.size;
    }

    // Clear all optimistic updates
    clearOptimistic() {
        // Rollback all pending operations
        for (const [tempId] of this.pendingOperations) {
            this.rollbackOperation(tempId);
        }
    }
}

/**
 * Optimistic Property Updates Hook
 */
export function useOptimisticProperties(initialProperties = []) {
    const [optimisticList] = useState(() => new OptimisticList(initialProperties));
    const [properties, setProperties] = useState(initialProperties);

    // Subscribe to optimistic list changes
    useEffect(() => {
        return optimisticList.subscribe(setProperties);
    }, [optimisticList]);

    // Toggle property status optimistically
    const togglePropertyStatus = useCallback(async (propertyId, newStatus, updateFn) => {
        const tempId = `status_${propertyId}_${Date.now()}`;

        // Apply optimistic update
        optimisticList.updateItem(propertyId, { status: newStatus });

        try {
            // Call actual update function
            const result = await updateFn(propertyId, newStatus);

            if (result.success) {
                optimisticList.confirmOperation(tempId, result.property);
                showSuccessToast(`Property ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
            } else {
                throw new Error(result.error || 'Failed to update property status');
            }
        } catch (error) {
            optimisticList.rollbackOperation(tempId);
            showErrorToast(error.message || 'Failed to update property status');
            throw error;
        }
    }, [optimisticList]);

    // Delete property optimistically
    const deleteProperty = useCallback(async (propertyId, deleteFn) => {
        const tempId = `delete_${propertyId}_${Date.now()}`;

        // Apply optimistic update
        optimisticList.removeItem(propertyId);

        try {
            // Call actual delete function
            const result = await deleteFn(propertyId);

            if (result.success) {
                optimisticList.confirmOperation(tempId);
                showSuccessToast('Property deleted successfully');
            } else {
                throw new Error(result.error || 'Failed to delete property');
            }
        } catch (error) {
            optimisticList.rollbackOperation(tempId);
            showErrorToast(error.message || 'Failed to delete property');
            throw error;
        }
    }, [optimisticList]);

    // Update property optimistically
    const updateProperty = useCallback(async (propertyId, updates, updateFn) => {
        const tempId = `update_${propertyId}_${Date.now()}`;

        // Apply optimistic update
        optimisticList.updateItem(propertyId, updates);

        try {
            // Call actual update function
            const result = await updateFn(propertyId, updates);

            if (result.success) {
                optimisticList.confirmOperation(tempId, result.property);
                showSuccessToast('Property updated successfully');
            } else {
                throw new Error(result.error || 'Failed to update property');
            }
        } catch (error) {
            optimisticList.rollbackOperation(tempId);
            showErrorToast(error.message || 'Failed to update property');
            throw error;
        }
    }, [optimisticList]);

    // Check if property has pending updates
    const hasPendingUpdates = useCallback((propertyId) => {
        return optimisticList.isOptimistic(propertyId);
    }, [optimisticList]);

    return {
        properties,
        togglePropertyStatus,
        deleteProperty,
        updateProperty,
        hasPendingUpdates,
        pendingCount: optimisticList.getPendingCount(),
        clearOptimistic: () => optimisticList.clearOptimistic()
    };
}

/**
 * Optimistic User Profile Updates Hook
 */
export function useOptimisticProfile(initialProfile = null) {
    const {
        data: profile,
        isOptimistic,
        error,
        applyOptimisticUpdate,
        confirmUpdate,
        rollbackUpdate,
        reset
    } = useOptimisticUpdate(initialProfile);

    // Update profile field optimistically
    const updateProfileField = useCallback(async (field, value, updateFn) => {
        // Apply optimistic update
        applyOptimisticUpdate({ [field]: value }, (current, updates) => ({
            ...current,
            ...updates
        }));

        try {
            // Call actual update function
            const result = await updateFn({ [field]: value });

            if (result.success) {
                confirmUpdate(result.user || { ...profile, [field]: value });
                showSuccessToast('Profile updated successfully');
            } else {
                throw new Error(result.error || 'Failed to update profile');
            }
        } catch (error) {
            rollbackUpdate(error.message);
            showErrorToast(error.message || 'Failed to update profile');
            throw error;
        }
    }, [profile, applyOptimisticUpdate, confirmUpdate, rollbackUpdate]);

    // Update verification status optimistically
    const updateVerificationStatus = useCallback(async (type, verified, updateFn) => {
        const field = `${type}Verified`;
        const timestampField = `${type}VerifiedAt`;

        // Apply optimistic update
        applyOptimisticUpdate({
            [field]: verified,
            [timestampField]: verified ? new Date().toISOString() : null
        }, (current, updates) => ({
            ...current,
            ...updates
        }));

        try {
            // Call actual update function if provided
            if (updateFn) {
                const result = await updateFn(type, verified);

                if (result.success) {
                    confirmUpdate(result.user || profile);
                } else {
                    throw new Error(result.error || 'Failed to update verification status');
                }
            } else {
                // Just confirm the optimistic update
                confirmUpdate(profile);
            }
        } catch (error) {
            rollbackUpdate(error.message);
            throw error;
        }
    }, [profile, applyOptimisticUpdate, confirmUpdate, rollbackUpdate]);

    return {
        profile,
        isOptimistic,
        error,
        updateProfileField,
        updateVerificationStatus,
        reset
    };
}

/**
 * Debounced Optimistic Updates
 */
export function useDebouncedOptimisticUpdate(delay = 500) {
    const timeoutRef = useRef(null);
    const pendingUpdateRef = useRef(null);

    const debouncedUpdate = useCallback((optimisticData, actualUpdateFn) => {
        // Clear existing timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        // Store the pending update
        pendingUpdateRef.current = { optimisticData, actualUpdateFn };

        // Set new timeout
        timeoutRef.current = setTimeout(async () => {
            if (pendingUpdateRef.current) {
                try {
                    await pendingUpdateRef.current.actualUpdateFn(
                        pendingUpdateRef.current.optimisticData
                    );
                } catch (error) {
                    console.error('Debounced update failed:', error);
                } finally {
                    pendingUpdateRef.current = null;
                }
            }
        }, delay);
    }, [delay]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return debouncedUpdate;
}