import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
    propertiesAPI,
    usersAPI,
    wishlistAPI,
    conversationsAPI,
    notificationsAPI,
    searchAPI,
    verificationAPI,
    userDiagnosticsAPI,
} from "../lib/api.js";

// Fallback implementation for deliveryPreferencesAPI
const deliveryPreferencesAPI = {
    get: async () => {
        try {
            const { deliveryPreferencesAPI: api } = await import("../lib/api.js");
            return await api.get();
        } catch (error) {
            console.error('Error in deliveryPreferencesAPI.get:', error);
            return { error: 'Delivery preferences API temporarily unavailable' };
        }
    },
    update: async (data) => {
        try {
            const { deliveryPreferencesAPI: api } = await import("../lib/api.js");
            return await api.update(data);
        } catch (error) {
            console.error('Error in deliveryPreferencesAPI.update:', error);
            return { error: 'Delivery preferences API temporarily unavailable' };
        }
    },
    reset: async () => {
        try {
            const { deliveryPreferencesAPI: api } = await import("../lib/api.js");
            return await api.reset();
        } catch (error) {
            console.error('Error in deliveryPreferencesAPI.reset:', error);
            return { error: 'Delivery preferences API temporarily unavailable' };
        }
    },
    getDeliveryPlan: async () => {
        try {
            const { deliveryPreferencesAPI: api } = await import("../lib/api.js");
            return await api.getDeliveryPlan();
        } catch (error) {
            console.error('Error in deliveryPreferencesAPI.getDeliveryPlan:', error);
            return { error: 'Delivery preferences API temporarily unavailable' };
        }
    },
    getRateLimitStatus: async () => {
        try {
            const { deliveryPreferencesAPI: api } = await import("../lib/api.js");
            return await api.getRateLimitStatus();
        } catch (error) {
            console.error('Error in deliveryPreferencesAPI.getRateLimitStatus:', error);
            return { error: 'Delivery preferences API temporarily unavailable' };
        }
    },
    testDelivery: async (data) => {
        try {
            const { deliveryPreferencesAPI: api } = await import("../lib/api.js");
            return await api.testDelivery(data);
        } catch (error) {
            console.error('Error in deliveryPreferencesAPI.testDelivery:', error);
            return { error: 'Delivery preferences API temporarily unavailable' };
        }
    },
};

/* ----------------------- Properties ----------------------- */

export function useProperties(params) {
    const navigate = useNavigate();
    return useQuery({
        queryKey: ["properties", params],
        queryFn: () => propertiesAPI.list(params, navigate),
    });
}

export function useProperty(id) {
    return useQuery({
        queryKey: ["property", id],
        queryFn: () => propertiesAPI.get(id),
    });
}

export function useCreateProperty() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data) => propertiesAPI.create(data),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["properties"] }),
    });
}

export function useUpdateProperty() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }) => propertiesAPI.update(id, data),
        onSuccess: (_, variables) => {
            qc.invalidateQueries({ queryKey: ["property", variables.id] });
            qc.invalidateQueries({ queryKey: ["properties"] });
        },
    });
}

export function useDeleteProperty() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id) => propertiesAPI.delete(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["properties"] }),
    });
}

/* ----------------------- Users ----------------------- */

export function useUser() {
    const navigate = useNavigate();
    return useQuery({
        queryKey: ["user"],
        queryFn: () => usersAPI.getMe(navigate),
    });
}

export function useUpdateUser() {
    const qc = useQueryClient();
    const navigate = useNavigate();
    return useMutation({
        mutationFn: (data) => usersAPI.update(data, navigate),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["user"] }),
    });
}

export function useChangePassword() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data) => usersAPI.changePassword(data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["user"] });
        },
    });
}

export function useUpdatePhone() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data) => usersAPI.updatePhone(data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["user"] });
        },
    });
}

export function useDeleteAccount() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data) => usersAPI.deleteAccount(data),
        onSuccess: () => {
            qc.clear(); // Clear all queries since user is deleted
        },
    });
}

/* ----------------------- Wishlist ----------------------- */

export function useWishlist() {
    const navigate = useNavigate();
    return useQuery({
        queryKey: ["wishlist"],
        queryFn: () => wishlistAPI.list(navigate),
    });
}

export function useAddToWishlist() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id) => wishlistAPI.add(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["wishlist"] });
            qc.invalidateQueries({ queryKey: ["properties"] });
        },
    });
}

export function useRemoveFromWishlist() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id) => wishlistAPI.remove(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["wishlist"] });
            qc.invalidateQueries({ queryKey: ["properties"] });
        },
    });
}

/* ----------------------- Conversations ----------------------- */

export function useConversations() {
    const navigate = useNavigate();
    return useQuery({
        queryKey: ["conversations"],
        queryFn: () => conversationsAPI.list(navigate),
    });
}

export function useConversation(id) {
    return useQuery({
        queryKey: ["conversation", id],
        queryFn: () => conversationsAPI.get(id),
    });
}

export function useCreateConversation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data) => conversationsAPI.create(data),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["conversations"] }),
    });
}

export function useSendMessage() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ convId, text }) =>
            conversationsAPI.sendMessage(convId, text),
        onSuccess: (_, variables) => {
            qc.invalidateQueries({
                queryKey: ["conversation", variables.convId],
            });
        },
    });
}

/* ----------------------- Notifications ----------------------- */

export function useNotifications(params) {
    return useQuery({
        queryKey: ["notifications", params],
        queryFn: () => notificationsAPI.list(params),
    });
}

export function useMarkAsRead() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id) => notificationsAPI.markAsRead(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
    });
}

/* ----------------------- Verification ----------------------- */

export function useSendOTP() {
    const navigate = useNavigate();
    return useMutation({
        mutationFn: (data) => verificationAPI.sendOTP(data, navigate),
    });
}

export function useVerifyOTP() {
    const qc = useQueryClient();
    const navigate = useNavigate();
    return useMutation({
        mutationFn: (data) => verificationAPI.verifyOTP(data, navigate),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["user"] });
            qc.invalidateQueries({ queryKey: ["verification-status"] });
        },
    });
}

export function useDeliveryStatus(deliveryId) {
    return useQuery({
        queryKey: ["delivery-status", deliveryId],
        queryFn: () => verificationAPI.getDeliveryStatus(deliveryId),
        enabled: !!deliveryId,
        refetchInterval: 5000, // Poll every 5 seconds for real-time updates
    });
}

export function useRetryDelivery() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data) => verificationAPI.retryDelivery(data),
        onSuccess: (_, variables) => {
            qc.invalidateQueries({ queryKey: ["delivery-status", variables.deliveryId] });
            qc.invalidateQueries({ queryKey: ["delivery-history"] });
        },
    });
}

export function useDeliveryHistory(params = {}) {
    return useQuery({
        queryKey: ["delivery-history", params],
        queryFn: () => verificationAPI.getDeliveryHistory(params),
    });
}

export function useVerificationStatus() {
    const navigate = useNavigate();
    return useQuery({
        queryKey: ["verification-status"],
        queryFn: () => verificationAPI.getVerificationStatus(navigate),
    });
}

export function useServiceStatus() {
    return useQuery({
        queryKey: ["service-status"],
        queryFn: () => verificationAPI.getServiceStatus(),
        refetchInterval: 30000, // Poll every 30 seconds
    });
}

/* ----------------------- Delivery Preferences ----------------------- */

export function useDeliveryPreferences() {
    return useQuery({
        queryKey: ["delivery-preferences"],
        queryFn: () => deliveryPreferencesAPI.get(),
    });
}

export function useUpdateDeliveryPreferences() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data) => deliveryPreferencesAPI.update(data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["delivery-preferences"] });
        },
    });
}

export function useResetDeliveryPreferences() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: () => deliveryPreferencesAPI.reset(),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["delivery-preferences"] });
        },
    });
}

export function useDeliveryPlan() {
    return useQuery({
        queryKey: ["delivery-plan"],
        queryFn: () => deliveryPreferencesAPI.getDeliveryPlan(),
    });
}

export function useRateLimitStatus() {
    return useQuery({
        queryKey: ["rate-limit-status"],
        queryFn: () => deliveryPreferencesAPI.getRateLimitStatus(),
        refetchInterval: 60000, // Poll every minute
    });
}

export function useTestDelivery() {
    return useMutation({
        mutationFn: (data) => deliveryPreferencesAPI.testDelivery(data),
    });
}

/* ----------------------- User Diagnostics ----------------------- */

export function useTroubleshootingInfo(deliveryId) {
    return useQuery({
        queryKey: ["troubleshooting-info", deliveryId],
        queryFn: () => userDiagnosticsAPI.getTroubleshootingInfo(deliveryId),
        enabled: !!deliveryId,
    });
}

export function useConnectivityTest() {
    return useMutation({
        mutationFn: (data) => userDiagnosticsAPI.runConnectivityTest(data),
    });
}

export function useDeliveryDiagnostics(deliveryId) {
    return useQuery({
        queryKey: ["delivery-diagnostics", deliveryId],
        queryFn: () => userDiagnosticsAPI.getDeliveryDiagnostics(deliveryId),
        enabled: !!deliveryId,
    });
}

export function useReportIssue() {
    return useMutation({
        mutationFn: (data) => userDiagnosticsAPI.reportIssue(data),
    });
}

/* ----------------------- Search ----------------------- */

export function useSearch(params) {
    return useQuery({
        queryKey: ["search", params],
        queryFn: () => searchAPI.suggest(params),
    });
}

/* ----------------------- Re-export Custom Hooks ----------------------- */

// Note: Removed re-exports to prevent circular dependencies
// Import these hooks directly from their respective files when needed
