import { apiClient } from "../../../api/client";

export interface AmenityItem {
  name: string;
  category: string;
  distance: number;
  lat: number;
  lng: number;
}

export interface NeighborhoodCategories {
  schools: AmenityItem[];
  hospitals: AmenityItem[];
  groceries: AmenityItem[];
  restaurants: AmenityItem[];
  parks: AmenityItem[];
  transit: AmenityItem[];
}

export interface NeighborhoodResponse {
  success: boolean;
  available: boolean;
  walkScore: number;
  transitScore: number;
  categories: NeighborhoodCategories;
  provider: string;
}

export class NeighborhoodService {
  /**
   * Fetch neighborhood insights for a specific property by ID
   */
  async getNeighborhoodInsights(propertyId: string): Promise<NeighborhoodResponse> {
    const res = await apiClient.get<NeighborhoodResponse>(
      `/api/properties/${propertyId}/neighborhood`
    );
    if (res.data && res.data.success) {
      return res.data;
    }
    throw new Error("Failed to retrieve neighborhood insights");
  }
}

export const neighborhoodService = new NeighborhoodService();
