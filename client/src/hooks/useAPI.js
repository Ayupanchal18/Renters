import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    propertiesAPI,
    usersAPI,
    wishlistAPI,
    conversationsAPI,
    notificationsAPI,
    searchAPI,
} from "../lib/api";

/* ----------------------- Properties ----------------------- */

export function useProperties(params) {
    return useQuery({
        queryKey: ["properties", params],
        queryFn: () => propertiesAPI.list(params),
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
    return useQuery({
        queryKey: ["user"],
        queryFn: () => usersAPI.getMe(),
    });
}

export function useUpdateUser() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data) => usersAPI.update(data),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["user"] }),
    });
}

/* ----------------------- Wishlist ----------------------- */

export function useWishlist() {
    return useQuery({
        queryKey: ["wishlist"],
        queryFn: () => wishlistAPI.list(),
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
    return useQuery({
        queryKey: ["conversations"],
        queryFn: () => conversationsAPI.list(),
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

/* ----------------------- Search ----------------------- */

export function useSearch(params) {
    return useQuery({
        queryKey: ["search", params],
        queryFn: () => searchAPI.suggest(params),
    });
}
