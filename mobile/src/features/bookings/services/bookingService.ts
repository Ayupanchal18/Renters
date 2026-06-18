import { apiClient } from "../../../api/client";

export interface AvailabilitySlotResponse {
  slotStart: string;
  slotEnd: string;
  duration: number;
}

export interface AvailabilityRule {
  _id?: string;
  type: "recurring" | "override";
  dayOfWeek?: number;
  specificDate?: string;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
  isActive: boolean;
}

export interface VisitBooking {
  _id: string;
  propertyId: {
    _id: string;
    title: string;
    photos?: string[];
    monthlyRent?: number;
    city?: string;
    address?: string;
    listingType?: "rent" | "buy";
    sellingPrice?: number;
  } & any;
  ownerId: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    avatar?: string;
  } & any;
  tenantId: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    avatar?: string;
  } & any;
  slotStart: string;
  slotEnd: string;
  notes?: string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  createdAt?: string;
  updatedAt?: string;
}

export interface BookingsMeResponse {
  success: boolean;
  tenant: VisitBooking[];
  owner: VisitBooking[];
}

export class BookingService {
  /**
   * Retrieves computed slots for the property for the next N days
   */
  async getAvailability(propertyId: string, days = 14): Promise<AvailabilitySlotResponse[]> {
    const res = await apiClient.get<{ success: boolean; slots: AvailabilitySlotResponse[] }>(
      `/api/properties/${propertyId}/availability?days=${days}`
    );
    if (res.data && res.data.success) {
      return res.data.slots || [];
    }
    throw new Error("Failed to retrieve availability slots");
  }

  /**
   * Retrieves raw availability rules for the property (for owners only)
   */
  async getRawRules(propertyId: string): Promise<AvailabilityRule[]> {
    const res = await apiClient.get<{ success: boolean; rules: AvailabilityRule[] }>(
      `/api/properties/${propertyId}/availability/rules`
    );
    if (res.data && res.data.success) {
      return res.data.rules || [];
    }
    throw new Error("Failed to retrieve availability rules");
  }

  /**
   * Updates/saves availability rules (for owners only)
   */
  async saveAvailabilityRules(propertyId: string, slots: AvailabilityRule[]): Promise<AvailabilityRule[]> {
    const res = await apiClient.post<{ success: boolean; slots: AvailabilityRule[] }>(
      `/api/properties/${propertyId}/availability`,
      { slots }
    );
    if (res.data && res.data.success) {
      return res.data.slots || [];
    }
    throw new Error("Failed to save availability rules");
  }

  /**
   * Requests a visit booking for a specific slot
   */
  async requestVisit(
    propertyId: string,
    slotStart: string | Date,
    slotEnd: string | Date,
    notes?: string
  ): Promise<VisitBooking> {
    const payload = {
      slotStart: slotStart instanceof Date ? slotStart.toISOString() : slotStart,
      slotEnd: slotEnd instanceof Date ? slotEnd.toISOString() : slotEnd,
      notes,
    };
    const res = await apiClient.post<{ success: boolean; booking: VisitBooking }>(
      `/api/properties/${propertyId}/bookings`,
      payload
    );
    if (res.data && res.data.success) {
      return res.data.booking;
    }
    throw new Error("Failed to request visit booking");
  }

  /**
   * Retrieves current user's bookings (both as a tenant and as an owner)
   */
  async getUserBookings(): Promise<BookingsMeResponse> {
    const res = await apiClient.get<BookingsMeResponse>("/api/bookings/me");
    if (res.data && res.data.success) {
      return res.data;
    }
    throw new Error("Failed to retrieve user bookings");
  }

  /**
   * Updates booking status (confirm, decline, cancel)
   */
  async updateBookingStatus(
    bookingId: string,
    status: "confirmed" | "cancelled" | "completed"
  ): Promise<VisitBooking> {
    const res = await apiClient.patch<{ success: boolean; booking: VisitBooking }>(
      `/api/bookings/${bookingId}`,
      { status }
    );
    if (res.data && res.data.success) {
      return res.data.booking;
    }
    throw new Error("Failed to update booking status");
  }
}

export const bookingService = new BookingService();
