import { apiClient } from "../../../api/client";
import type { WishlistItem } from "../../../types/types";

/**
 * GET /api/wishlist
 * Returns the current user's saved properties.
 */
export async function fetchWishlist(): Promise<WishlistItem[]> {
  const res = await apiClient.get<WishlistItem[]>("/api/wishlist");
  return res.data;
}

/**
 * POST /api/wishlist/:propertyId
 * Adds a property to the user's wishlist.
 */
export async function addToWishlist(propertyId: string): Promise<void> {
  await apiClient.post(`/api/wishlist/${propertyId}`);
}

/**
 * DELETE /api/wishlist/:propertyId
 * Removes a property from the user's wishlist.
 */
export async function removeFromWishlist(propertyId: string): Promise<void> {
  await apiClient.delete(`/api/wishlist/${propertyId}`);
}
