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

    const participant = conversation.participants[0];
    const lastMessagePreview = conversation.lastMessage?.text || "No messages yet";

    return (
        <button
            onClick={onClick}
            className={`w-full px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors${isSelected ? "bg-blue-50 border-l-4 border-blue-500" : ""
                }`}
        >
            <div className="flex items-start gap-3">
                <div className="relative flex-shrink-0">
                    <img
                        src={participant.avatar}
                        alt={participant.name}
                        className="w-12 h-12 rounded-full object-cover"
                    />

                </div>

                <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between gap-2">
                        <h3
                            className={`font-semibold text-gray-900 truncate${conversation.unreadCount > 0 ? "font-bold" : ""
                                }`}
                        >
                            {participant.name}
                        </h3>
                        <span className="text-xs text-gray-500 flex-shrink-0">
                            {formatTime(conversation.lastMessageTime)}
                        </span>
                    </div>

                    <div className="flex items-center justify-between gap-2 mt-1">
                        <p
                            className={`text-sm truncate${conversation.unreadCount > 0
                                ? "text-gray-900 font-medium"
                                : "text-gray-500"
                                }`}
                        >
                            {lastMessagePreview}
                        </p>

                        {conversation.unreadCount > 0 && (
                            <div className="w-5 h-5 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center flex-shrink-0">
                                {conversation.unreadCount}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </button>
    );
}
