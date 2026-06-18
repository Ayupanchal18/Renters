import { apiClient } from "../../../api/client";

export interface LeaseTerms {
  rentAmount: number;
  securityDeposit: number;
  leaseStartDate: string;
  leaseEndDate: string;
  noticePeriodDays: number;
  additionalClauses?: string;
}

export interface LeaseDraft {
  _id: string;
  propertyId: {
    _id: string;
    title: string;
    address: string;
    city: string;
    state?: string;
    photos?: string[];
  } & any;
  ownerId: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    isVerified?: boolean;
  } & any;
  tenantId: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    isVerified?: boolean;
  } & any;
  status: "draft" | "sent" | "signed_by_tenant" | "signed_by_owner" | "completed";
  terms: LeaseTerms;
  ownerSignature?: string;
  tenantSignature?: string;
  signedAtOwner?: string;
  signedAtTenant?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export class LeaseService {
  /**
   * Owner drafts a new lease agreement
   */
  async createLeaseDraft(
    propertyId: string,
    tenantId: string,
    terms: LeaseTerms
  ): Promise<LeaseDraft> {
    const res = await apiClient.post<{ success: boolean; data: LeaseDraft }>(
      "/api/leases",
      { propertyId, tenantId, terms }
    );
    if (res.data && res.data.success) {
      return res.data.data;
    }
    throw new Error("Failed to create lease draft");
  }

  /**
   * Retrieves lease agreement details by ID
   */
  async getLeaseById(id: string): Promise<LeaseDraft> {
    const res = await apiClient.get<{ success: boolean; data: LeaseDraft }>(
      `/api/leases/${id}`
    );
    if (res.data && res.data.success) {
      return res.data.data;
    }
    throw new Error("Failed to load lease agreement details");
  }

  /**
   * Retrieves lease agreement by property and tenant IDs
   */
  async getLeaseByPropertyAndTenant(propertyId: string, tenantId: string): Promise<LeaseDraft | null> {
    const res = await apiClient.get<{ success: boolean; data?: LeaseDraft; message?: string }>(
      `/api/leases/property/${propertyId}/tenant/${tenantId}`
    );
    if (res.data && res.data.success) {
      return res.data.data || null;
    }
    return null;
  }

  /**
   * Edit lease terms (owner only, in "draft" status only)
   */
  async updateLeaseTerms(id: string, terms: Partial<LeaseTerms>): Promise<LeaseDraft> {
    const res = await apiClient.patch<{ success: boolean; data: LeaseDraft }>(
      `/api/leases/${id}`,
      { terms }
    );
    if (res.data && res.data.success) {
      return res.data.data;
    }
    throw new Error("Failed to update lease terms");
  }

  /**
   * Owner sends lease draft to tenant
   */
  async sendLeaseDraft(id: string): Promise<LeaseDraft> {
    const res = await apiClient.post<{ success: boolean; data: LeaseDraft }>(
      `/api/leases/${id}/send`
    );
    if (res.data && res.data.success) {
      return res.data.data;
    }
    throw new Error("Failed to send lease draft");
  }

  /**
   * Owner or tenant signs the lease
   * @param signature base64 PNG data URL starting with "data:image/png;base64,"
   */
  async signLease(id: string, signature: string): Promise<LeaseDraft> {
    const res = await apiClient.post<{ success: boolean; data: LeaseDraft }>(
      `/api/leases/${id}/sign`,
      { signature }
    );
    if (res.data && res.data.success) {
      return res.data.data;
    }
    throw new Error("Failed to sign lease agreement");
  }
}

export const leaseService = new LeaseService();
