import { apiClient } from "../../../api/client";

export interface Amenity {
  name: string;
  type: string;
  distance: string;
  icon: string;
  color?: string;
  iconColor?: string;
}

export interface NearbyResponse {
  success: boolean;
  amenities: Amenity[];
  error?: string;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export const nearbyService = {
  getNearbyAmenities: async (coords: Coordinates, radius = 2): Promise<NearbyResponse> => {
    try {
      const res = await apiClient.get<NearbyResponse>("/api/nearby", {
        params: { lat: coords.lat, lng: coords.lng, radius }
      });
      return res.data;
    } catch (error: any) {
      console.error("Error fetching nearby amenities:", error);
      return { success: false, amenities: [], error: error.message };
    }
  },

  getNearbyAmenitiesByAddress: async (address?: string, city?: string): Promise<NearbyResponse> => {
    try {
      const params: any = {};
      if (address) params.address = address;
      if (city) params.city = city;

      const geocodeResponse = await apiClient.get<any>("/api/geocode", { params });
      
      if (!geocodeResponse.data?.success || !geocodeResponse.data?.coordinates) {
        if (city && address) {
          const cityResponse = await apiClient.get<any>("/api/geocode", { params: { city } });
          if (cityResponse.data?.success && cityResponse.data?.coordinates) {
            return nearbyService.getNearbyAmenities(cityResponse.data.coordinates, 2);
          }
        }
        return { success: false, amenities: [], error: "Could not geocode address" };
      }

      return nearbyService.getNearbyAmenities(geocodeResponse.data.coordinates, 2);
    } catch (error: any) {
      console.error("Error fetching nearby by address:", error);
      return { success: false, amenities: [], error: error.message };
    }
  }
};
