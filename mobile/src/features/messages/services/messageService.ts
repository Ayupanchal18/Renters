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

  async sendMessage(conversationId: string, text: string) {
    const res = await apiClient.post(`/api/messages/conversations/${conversationId}/messages`, { text });
    return res.data;
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
