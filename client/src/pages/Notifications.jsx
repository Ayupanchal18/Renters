/**
 * Notifications Page Component
 * Requirements: 6.1, 6.4
 * 
 * Displays list of notifications sorted by date with:
 * - Visual distinction for read vs unread (background color, badge)
 * - Empty state when no notifications
 * - Mark as read functionality
 * - Mark all as read button
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CheckCheck, RefreshCw, AlertCircle, Inbox } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Button } from "../components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import NotificationItem from "../components/notifications/NotificationItem";
import { useNotifications } from "../hooks/useNotifications";
import { getUser, isAuthenticated } from "../utils/auth";

export default function Notifications() {
    const navigate = useNavigate();
    const [filter, setFilter] = useState("all"); // "all" or "unread"

    // Check authentication
    useEffect(() => {
        if (!isAuthenticated()) {
            navigate("/login", { state: { from: "/notifications" } });
        }
    }, [navigate]);

    const user = getUser();

    // Use the useNotifications hook for real data and socket connection
    const {
        notifications,
        unreadCount,
        loading,
        error,
        pagination,
        fetchNotifications,
        loadMore,
        markAsRead,
        markAllAsRead,
        refresh,
        setError
    } = useNotifications({ autoConnect: true, autoFetch: true });

    // Handle filter change
    const handleFilterChange = (newFilter) => {
        setFilter(newFilter);
        fetchNotifications({ page: 1, unreadOnly: newFilter === "unread" });
    };

    // Handle notification click - mark as read and navigate
    const handleNotificationClick = async (notification) => {
        const notificationId = notification._id || notification.id;
        
        // Mark as read if unread
        if (!notification.read) {
            await markAsRead(notificationId);
        }

        // Navigate to related conversation if it's a message notification
        if (notification.type === "message" && notification.data?.conversationId) {
            navigate(`/messages?conversation=${notification.data.conversationId}`);
        }
    };

    // Handle mark all as read
    const handleMarkAllAsRead = async () => {
        const result = await markAllAsRead();
        if (!result.success) {
            console.error("Failed to mark all as read:", result.error);
        }
    };

    // Handle retry on error
    const handleRetry = () => {
        setError(null);
        refresh();
    };

    // Filter notifications based on current filter
    const filteredNotifications = filter === "unread" 
        ? notifications.filter(n => !n.read)
        : notifications;

    // Empty state component
    const EmptyState = () => (
        <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Inbox className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
                {filter === "unread" ? "No unread notifications" : "No notifications yet"}
            </h3>
            <p className="text-muted-foreground text-center max-w-sm">
                {filter === "unread" 
                    ? "You're all caught up! Check back later for new updates."
                    : "When you receive messages or updates, they'll appear here."}
            </p>
            {filter === "unread" && notifications.length > 0 && (
                <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => handleFilterChange("all")}
                >
                    View all notifications
                </Button>
            )}
        </div>
    );

    if (!user) {
        return null; // Will redirect in useEffect
    }

    return (
        <>
            <Navbar />
            <div className="min-h-[80vh] bg-background">
                <div className="max-w-3xl mx-auto px-4 py-8">
                    {/* Header */}
                    <Card className="mb-6">
                        <CardHeader className="pb-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 rounded-lg">
                                        <Bell className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-xl">Notifications</CardTitle>
                                        {unreadCount > 0 && (
                                            <p className="text-sm text-muted-foreground mt-1">
                                                {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                
                                {/* Mark All as Read Button */}
                                {unreadCount > 0 && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleMarkAllAsRead}
                                        className="flex items-center gap-2"
                                    >
                                        <CheckCheck className="w-4 h-4" />
                                        <span className="hidden sm:inline">Mark all as read</span>
                                    </Button>
                                )}
                            </div>

                            {/* Filter Tabs */}
                            <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                                <Button
                                    variant={filter === "all" ? "default" : "ghost"}
                                    size="sm"
                                    onClick={() => handleFilterChange("all")}
                                >
                                    All
                                </Button>
                                <Button
                                    variant={filter === "unread" ? "default" : "ghost"}
                                    size="sm"
                                    onClick={() => handleFilterChange("unread")}
                                    className="flex items-center gap-2"
                                >
                                    Unread
                                    {unreadCount > 0 && (
                                        <span className="bg-primary/20 text-primary text-xs px-1.5 py-0.5 rounded-full">
                                            {unreadCount}
                                        </span>
                                    )}
                                </Button>
                            </div>
                        </CardHeader>
                    </Card>

                    {/* Error Banner */}
                    {error && (
                        <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center justify-between">
                            <div className="flex items-center gap-2 text-destructive">
                                <AlertCircle className="w-5 h-5" />
                                <span className="text-sm">{error}</span>
                            </div>
                            <button
                                onClick={handleRetry}
                                className="flex items-center gap-1 text-sm text-destructive hover:text-destructive/80 transition-colors"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Retry
                            </button>
                        </div>
                    )}

                    {/* Notifications List */}
                    <Card>
                        <CardContent className="p-0">
                            {loading && notifications.length === 0 ? (
                                // Loading skeleton
                                <div className="divide-y divide-border">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="p-4 animate-pulse">
                                            <div className="flex items-start gap-3">
                                                <div className="w-10 h-10 bg-muted rounded-full" />
                                                <div className="flex-1">
                                                    <div className="h-4 bg-muted rounded w-1/3 mb-2" />
                                                    <div className="h-3 bg-muted rounded w-2/3 mb-2" />
                                                    <div className="h-3 bg-muted rounded w-1/4" />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : filteredNotifications.length === 0 ? (
                                <EmptyState />
                            ) : (
                                <div className="divide-y divide-border">
                                    {filteredNotifications.map((notification) => (
                                        <NotificationItem
                                            key={notification._id || notification.id}
                                            notification={notification}
                                            onClick={() => handleNotificationClick(notification)}
                                        />
                                    ))}
                                </div>
                            )}

                            {/* Load More Button */}
                            {pagination.hasMore && filteredNotifications.length > 0 && (
                                <div className="p-4 border-t border-border">
                                    <Button
                                        variant="outline"
                                        className="w-full"
                                        onClick={loadMore}
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                                Loading...
                                            </>
                                        ) : (
                                            "Load more"
                                        )}
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
            <Footer />
        </>
    );
}
