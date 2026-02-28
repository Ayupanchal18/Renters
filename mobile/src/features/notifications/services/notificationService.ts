import { apiClient } from "../../../api/client";

export const notificationService = {
  async getNotifications(params: { page?: number; unreadOnly?: boolean } = {}) {
    const res = await apiClient.get("/api/notifications", { params });
    return res.data;
  },

  async markAsRead(notificationId: string) {
    const res = await apiClient.put(`/api/notifications/${notificationId}/read`);
    return res.data;
  },

  async markAllAsRead() {
    const res = await apiClient.put("/api/notifications/read-all");
    return res.data;
  },
};

export default notificationService;
