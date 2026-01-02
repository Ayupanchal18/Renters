/**
 * NotificationItem Component
 * 
 * Displays individual notification with:
 * - Notification title, message preview, timestamp
 * - Unread indicator (dot or highlight)
 * - Click handler to navigate to related conversation
 */

import { MessageSquare, Heart, Home, Bell, Info } from "lucide-react";
import { cn } from "../../lib/utils";

/**
 * Format timestamp to relative time
 * @param {string|Date} timestamp - The timestamp to format
 * @returns {string} Formatted relative time string
 */
const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-US", { 
        month: "short", 
        day: "numeric",
        year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined
    });
};

/**
 * Get icon component based on notification type
 * @param {string} type - Notification type
 * @returns {JSX.Element} Icon component
 */
const getNotificationIcon = (type) => {
    switch (type) {
        case "message":
            return MessageSquare;
        case "favorite":
            return Heart;
        case "property":
            return Home;
        case "system":
            return Info;
        default:
            return Bell;
    }
};

/**
 * Get icon background color based on notification type
 * @param {string} type - Notification type
 * @returns {string} Tailwind CSS classes for background
 */
const getIconBackground = (type) => {
    switch (type) {
        case "message":
            return "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400";
        case "favorite":
            return "bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400";
        case "property":
            return "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400";
        case "system":
            return "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400";
        default:
            return "bg-primary/10 text-primary";
    }
};

/**
 * NotificationItem Component
 * @param {Object} props - Component props
 * @param {Object} props.notification - Notification data
 * @param {Function} props.onClick - Click handler
 */
export default function NotificationItem({ notification, onClick }) {
    const {
        type = "system",
        title = "Notification",
        message = "",
        read = false,
        createdAt,
        data = {}
    } = notification;

    const IconComponent = getNotificationIcon(type);
    const iconBgClass = getIconBackground(type);

    return (
        <button
            onClick={onClick}
            className={cn(
                "w-full text-left px-4 py-4 transition-colors hover:bg-muted/50",
                // Visual distinction for unread notifications (Requirement 6.4)
                !read && "bg-primary/5 hover:bg-primary/10"
            )}
        >
            <div className="flex items-start gap-3">
                {/* Icon */}
                <div className={cn(
                    "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
                    iconBgClass
                )}>
                    <IconComponent className="w-5 h-5" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                            {/* Title with unread indicator */}
                            <div className="flex items-center gap-2">
                                <h4 className={cn(
                                    "text-sm truncate",
                                    !read ? "font-semibold text-foreground" : "font-medium text-foreground"
                                )}>
                                    {title}
                                </h4>
                                {/* Unread dot indicator (Requirement 6.4) */}
                                {!read && (
                                    <span className="flex-shrink-0 w-2 h-2 bg-primary rounded-full" />
                                )}
                            </div>

                            {/* Message preview */}
                            <p className={cn(
                                "text-sm mt-0.5 line-clamp-2",
                                !read ? "text-foreground/80" : "text-muted-foreground"
                            )}>
                                {message}
                            </p>
                        </div>

                        {/* Timestamp */}
                        <span className="flex-shrink-0 text-xs text-muted-foreground whitespace-nowrap">
                            {formatTime(createdAt)}
                        </span>
                    </div>

                    {/* Property info if available */}
                    {data.propertyId && data.propertyTitle && (
                        <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Home className="w-3 h-3" />
                            <span className="truncate">{data.propertyTitle}</span>
                        </div>
                    )}
                </div>
            </div>
        </button>
    );
}
