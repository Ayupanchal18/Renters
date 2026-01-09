export function ConversationItem({
    conversation,
    isSelected,
    onClick,
}) {
    const formatTime = (timestamp) => {
        if (!timestamp) return "";
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return "now";
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    };

    // Handle both old and new data formats
    const participant = conversation.participants?.[0] || {
        id: 'unknown',
        name: 'Unknown User',
        avatar: null,
        isOnline: false
    };

    // Create a simple avatar fallback using CSS
    const getAvatarFallback = (name) => {
        const initials = (name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        return initials;
    };

    // Get last message preview - handle both formats
    const lastMessagePreview = conversation.lastMessage?.text || "No messages yet";
    
    // Get timestamp - handle both lastMessageTime and lastActivityAt
    const messageTime = conversation.lastMessageTime || 
                       conversation.lastActivityAt || 
                       conversation.lastMessage?.createdAt ||
                       conversation.lastMessage?.timestamp;

    // Get unread count - handle both number and object formats
    let unreadCount = 0;
    if (typeof conversation.unreadCount === 'number') {
        unreadCount = conversation.unreadCount;
    } else if (typeof conversation.unreadCount === 'object' && conversation.unreadCount !== null) {
        // Sum all unread counts if it's an object (Map-like)
        unreadCount = Object.values(conversation.unreadCount).reduce((sum, count) => sum + (count || 0), 0);
    }

    return (
        <button
            onClick={onClick}
            className={`w-full px-4 py-3 rounded-lg hover:bg-muted/50 transition-colors text-left ${isSelected ? "bg-primary/10 border-l-4 border-l-primary rounded-l-sm" : ""
                }`}
        >
            <div className="flex items-start gap-3">
                <div className="relative flex-shrink-0">
                    {participant.avatar ? (
                        <img
                            src={participant.avatar}
                            alt={participant.name || 'User'}
                            className="w-12 h-12 rounded-full object-cover ring-2 ring-border"
                            referrerPolicy="no-referrer"
                            crossOrigin="anonymous"
                        />
                    ) : (
                        <div className="w-12 h-12 rounded-full bg-primary/10 ring-2 ring-border flex items-center justify-center">
                            <span className="text-sm font-semibold text-primary">
                                {getAvatarFallback(participant.name)}
                            </span>
                        </div>
                    )}
                    {participant.isOnline && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-success rounded-full ring-2 ring-card" />
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                        <h3
                            className={`font-semibold text-foreground truncate ${unreadCount > 0 ? "font-bold" : ""
                                }`}
                        >
                            {participant.name || 'Unknown User'}
                        </h3>
                        <span className="text-xs text-muted-foreground flex-shrink-0">
                            {formatTime(messageTime)}
                        </span>
                    </div>

                    <div className="flex items-center justify-between gap-2 mt-1">
                        <p
                            className={`text-sm truncate ${unreadCount > 0
                                ? "text-foreground font-medium"
                                : "text-muted-foreground"
                                }`}
                        >
                            {lastMessagePreview}
                        </p>

                        {unreadCount > 0 && (
                            <div className="w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center flex-shrink-0 font-medium">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </button>
    );
}
