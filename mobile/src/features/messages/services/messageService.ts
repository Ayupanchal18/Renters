import { Platform } from "react-native";
import { apiClient } from "../../../api/client";

export const messageService = {
  async getConversations() {
    const res = await apiClient.get("/api/messages/conversations");
    return res.data;
  },

  async getConversation(conversationId: string) {
    const res = await apiClient.get(`/api/messages/conversations/${conversationId}`);
    return res.data;
  },

  async sendMessage(conversationId: string, text: string, file: any = null) {
    if (file) {
      const formData = new FormData();
      if (text) {
        formData.append("text", text);
      }

      const uri = file.uri;
      const uriParts = uri.split("/");
      const fileName = file.fileName || uriParts[uriParts.length - 1] || "file.jpg";

      const extension = fileName.split(".").pop()?.toLowerCase();
      let type = file.mimeType || file.type || "image/jpeg";
      if (extension === "pdf") {
        type = "application/pdf";
      }

      formData.append("file", {
        uri: Platform.OS === "android" ? uri : uri.replace("file://", ""),
        name: fileName,
        type: type,
      } as any);

      const res = await apiClient.post(
        `/api/messages/conversations/${conversationId}/messages`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return res.data;
    } else {
      const res = await apiClient.post(`/api/messages/conversations/${conversationId}/messages`, { text });
      return res.data;
    }
  },

  async markAsRead(conversationId: string) {
    const res = await apiClient.put(`/api/messages/conversations/${conversationId}/read`);
    return res.data;
  },

  async deleteConversation(conversationId: string) {
    const res = await apiClient.delete(`/api/messages/conversations/${conversationId}`);
    return res.data;
  },

  async createConversation(recipientId: string, propertyId: string) {
    const res = await apiClient.post("/api/messages/conversations", { recipientId, propertyId });
    return res.data;
  },
};

export default messageService;
