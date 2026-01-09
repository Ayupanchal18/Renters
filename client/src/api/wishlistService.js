/**
 * Wishlist Service - handles favorite/wishlist operations
 */

import { getToken, isAuthenticated } from '../utils/auth';

/**
 * Get auth headers for API requests
 */
const getAuthHeaders = () => {
    const token = getToken();
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
    };
};

const wishlistService = {
    /**
     * Get user's wishlist
     * @returns {Promise<Array>} List of wishlist items
     */
    getWishlist: async () => {
        if (!isAuthenticated()) {
            throw new Error('Authentication required');
        }
        try {
            const response = await fetch('/api/wishlist', {
                headers: getAuthHeaders()
            });

            if (response.status === 401) {
                throw new Error('Please log in to view your wishlist');
            }

            if (!response.ok) {
                throw new Error('Failed to fetch wishlist');
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching wishlist:', error);
            throw error;
        }
    },

    /**
     * Add property to wishlist
     * @param {string} propertyId - Property ID to add
     * @returns {Promise<Object>} Created wishlist item
     */
    addToWishlist: async (propertyId) => {
        if (!isAuthenticated()) {
            throw new Error('Authentication required');
        }
        try {
            const response = await fetch(`/api/wishlist/${propertyId}`, {
                method: 'POST',
                headers: getAuthHeaders()
            });

            if (response.status === 401) {
                throw new Error('Please log in to add to wishlist');
            }

            if (response.status === 409) {
                // Already in wishlist
                return { alreadyExists: true };
            }

            if (!response.ok) {
                throw new Error('Failed to add to wishlist');
            }

            return await response.json();
        } catch (error) {
            console.error('Error adding to wishlist:', error);
            throw error;
        }
    },

    /**
     * Remove property from wishlist
     * @param {string} propertyId - Property ID to remove
     * @returns {Promise<Object>} Success response
     */
    removeFromWishlist: async (propertyId) => {
        if (!isAuthenticated()) {
            throw new Error('Authentication required');
        }
        try {
            const response = await fetch(`/api/wishlist/${propertyId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            if (response.status === 401) {
                throw new Error('Please log in to manage your wishlist');
            }

            if (!response.ok) {
                throw new Error('Failed to remove from wishlist');
            }

            return await response.json();
        } catch (error) {
            console.error('Error removing from wishlist:', error);
            throw error;
        }
    },

    /**
     * Check if property is in wishlist
     * @param {string} propertyId - Property ID to check
     * @returns {Promise<boolean>} True if in wishlist
     */
    isInWishlist: async (propertyId) => {
        if (!isAuthenticated()) {
            return false;
        }
        try {
            const wishlist = await wishlistService.getWishlist();
            return wishlist.some(item => item.property?._id === propertyId || item.property === propertyId);
        } catch (error) {
            console.error('Error checking wishlist:', error);
            return false;
        }
    },

    /**
     * Toggle property in wishlist
     * @param {string} propertyId - Property ID to toggle
     * @param {boolean} currentState - Current favorite state
     * @returns {Promise<Object>} Result with new state
     */
    toggleWishlist: async (propertyId, currentState) => {
        if (!isAuthenticated()) {
            throw new Error('Authentication required');
        }
        try {
            if (currentState) {
                await wishlistService.removeFromWishlist(propertyId);
                return { isFavorited: false };
            } else {
                const result = await wishlistService.addToWishlist(propertyId);
                return { isFavorited: true, alreadyExists: result.alreadyExists };
            }
        } catch (error) {
            console.error('Error toggling wishlist:', error);
            throw error;
        }
    }
};

export default wishlistService;
