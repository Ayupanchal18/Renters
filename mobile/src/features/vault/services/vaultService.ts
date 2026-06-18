import { apiClient } from "../../../api/client";
import { env } from "../../../config/env";
import { getAccessToken } from "../../auth/services/tokenStorage";

export interface VaultDocument {
  _id: string;
  userId: string;
  type: "id_proof" | "address_proof" | "income_proof" | "reference_letter" | "other";
  filename: string;
  mimetype: string;
  publicId: string;
  storageUrl: string;
  status: "pending" | "verified" | "rejected";
  uploadedAt: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export class VaultService {
  /**
   * Retrieves the logged-in user's documents
   */
  async getDocuments(): Promise<VaultDocument[]> {
    const res = await apiClient.get<{ success: boolean; data: VaultDocument[] }>(
      "/api/vault/documents"
    );
    if (res.data && res.data.success) {
      return res.data.data || [];
    }
    throw new Error("Failed to load vault documents");
  }

  /**
   * Upload a file to the vault
   */
  async uploadDocument(
    type: string,
    fileUri: string,
    filename: string,
    mimetype: string
  ): Promise<VaultDocument> {
    const formData = new FormData();
    formData.append("type", type);
    formData.append("file", {
      uri: fileUri,
      name: filename,
      type: mimetype,
    } as any);

    const res = await apiClient.post<{ success: boolean; data: VaultDocument; message?: string }>(
      "/api/vault/documents",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    if (res.data && res.data.success) {
      return res.data.data;
    }
    throw new Error(res.data.message || "Failed to upload document");
  }

  /**
   * Delete a document (only pending or rejected ones)
   */
  async deleteDocument(id: string): Promise<boolean> {
    const res = await apiClient.delete<{ success: boolean; message?: string }>(
      `/api/vault/documents/${id}`
    );
    return !!(res.data && res.data.success);
  }

  /**
   * Returns the secure URL path for proxying a document file
   */
  getFileProxyUrl(id: string): string {
    return `${env.apiBaseUrl}/api/vault/documents/${id}/file`;
  }
}

export const vaultService = new VaultService();
