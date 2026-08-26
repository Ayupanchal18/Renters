import { apiClient } from "../../../api/client";
import type {
  ApiResponse,
  PaginatedData,
  Property,
  ListingFilters,
} from "../../../types/types";

/**
 * GET /api/properties/rent?page=&limit=&city=&...
 * Fetches paginated rent listings.
 */
export async function fetchRentListings(
  page = 1,
  limit = 12,
  filters?: ListingFilters
): Promise<PaginatedData<Property>> {
  const params: Record<string, any> = { page, limit };

  if (filters?.city) params.city = filters.city;
  if (filters?.category) params.category = filters.category;
  if (filters?.propertyType) params.propertyType = filters.propertyType;
  if (filters?.minRent) params.minRent = filters.minRent;
  if (filters?.maxRent) params.maxRent = filters.maxRent;
  if (filters?.bedrooms) params.bedrooms = filters.bedrooms;
  if (filters?.furnishing) params.furnishing = filters.furnishing;
  if (filters?.preferredTenants) params.preferredTenants = filters.preferredTenants;
  if (filters?.verified) params.verified = filters.verified;
  if (filters?.amenities) params.amenities = filters.amenities;
  if (filters?.sort) params.sort = filters.sort;
  if (filters?.q) params.q = filters.q;

  const res = await apiClient.get<ApiResponse<PaginatedData<Property>>>(
    "/api/properties/rent",
    { params }
  );

  return (
    res.data.data ?? { items: [], total: 0, page: 1, pageSize: limit }
  );
}

/**
 * GET /api/properties/buy?page=&limit=&city=&...
 * Fetches paginated buy listings.
 */
export async function fetchBuyListings(
  page = 1,
  limit = 12,
  filters?: ListingFilters
): Promise<PaginatedData<Property>> {
  const params: Record<string, any> = { page, limit };

  if (filters?.city) params.city = filters.city;
  if (filters?.category) params.category = filters.category;
  if (filters?.propertyType) params.propertyType = filters.propertyType;
  if (filters?.minPrice) params.minPrice = filters.minPrice;
  if (filters?.maxPrice) params.maxPrice = filters.maxPrice;
  if (filters?.bedrooms) params.bedrooms = filters.bedrooms;
  if (filters?.possessionStatus) params.possessionStatus = filters.possessionStatus;
  if (filters?.loanAvailable !== undefined) params.loanAvailable = filters.loanAvailable;
  if (filters?.verified) params.verified = filters.verified;
  if (filters?.amenities) params.amenities = filters.amenities;
  if (filters?.sort) params.sort = filters.sort;
  if (filters?.q) params.q = filters.q;

  const res = await apiClient.get<ApiResponse<PaginatedData<Property>>>(
    "/api/properties/buy",
    { params }
  );

  return (
    res.data.data ?? { items: [], total: 0, page: 1, pageSize: limit }
  );
}

/**
 * POST /api/properties/rent/search or /api/properties/buy/search
 */
export async function searchListings(
  type: "rent" | "buy",
  payload: any
): Promise<PaginatedData<Property>> {
  const res = await apiClient.post<ApiResponse<any>>(
    `/api/properties/${type}/search`,
    payload
  );
  
  const data = res.data.data;
  const items = data.searchResultData || data.items || [];
  const pagination = res.data.details as any; // The server often puts pagination in details or root
  
  return {
    items,
    total: pagination?.total || items.length,
    page: pagination?.page || 1,
    pageSize: pagination?.pageSize || 12
  };
}

/**
 * GET /api/properties/rent/:identifier or /api/properties/buy/:identifier
 */
export async function fetchPropertyDetail(
  identifier: string,
  type: "rent" | "buy" = "rent"
): Promise<Property> {
  const res = await apiClient.get<ApiResponse<Property>>(
    `/api/properties/${type}/${identifier}`
  );
  return res.data.data!;
}

/**
 * GET /api/properties/:identifier/similar
 */
export async function fetchSimilarProperties(
  identifier: string,
  limit = 8
): Promise<Property[]> {
  try {
    const res = await apiClient.get<ApiResponse<{ items: Property[] }>>(
      `/api/properties/${identifier}/similar`,
      { params: { limit } }
    );
    return res.data.data?.items || [];
  } catch (error) {
    console.warn("fetchSimilarProperties failed:", error);
    return [];
  }
}
